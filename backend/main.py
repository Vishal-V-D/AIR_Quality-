import asyncio
import json
import random
import os
from typing import List, Dict
from datetime import datetime
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

from database import get_db_connection, init_db
from risk_engine import evaluate_ward_risk
from regulations import search_regulations

# Groq client
try:
    from groq import Groq
    groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))
    GROQ_AVAILABLE = True
except Exception:
    groq_client = None
    GROQ_AVAILABLE = False

app = FastAPI(title="NEXUS AQI Accountability & Forensics Platform")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

init_db()

# ── Simulation State ─────────────────────────────────────────────────────────
simulation_state = {
    "anomaly_active": False,
    "anomaly_ward": "Ward-4",        # Which ward is being spiked
    "spike_intensity": 0.0,          # 0..1 ramp-up factor
    "mins_to_shift_change": 25,
    "tick": 0,
    "readings": {
        "Ward-1": {"PM25": 14.5,  "CO2": 410},
        "Ward-2": {"PM25": 48.0,  "CO2": 425},
        "Ward-3": {"PM25": 118.5, "CO2": 520},
        "Ward-4": {"PM25": 72.0,  "CO2": 460},
        "Ward-5": {"PM25": 35.2,  "CO2": 430},
        "Ward-6": {"PM25": 92.4,  "CO2": 490},
    },
    "baseline": {
        "Ward-1": {"PM25": 14.5,  "CO2": 410},
        "Ward-2": {"PM25": 48.0,  "CO2": 425},
        "Ward-3": {"PM25": 118.5, "CO2": 520},
        "Ward-4": {"PM25": 72.0,  "CO2": 460},
        "Ward-5": {"PM25": 35.2,  "CO2": 430},
        "Ward-6": {"PM25": 92.4,  "CO2": 490},
    }
}

WARD_NAMES = {
    "Ward-1": "Connaught Place",
    "Ward-2": "Dwarka Sector 10",
    "Ward-3": "Okhla Industrial",
    "Ward-4": "Anand Vihar",
    "Ward-5": "Punjabi Bagh",
    "Ward-6": "Wazirpur Industrial",
}


class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        dead = []
        for conn in self.active_connections:
            try:
                await conn.send_text(json.dumps(message))
            except Exception:
                dead.append(conn)
        for c in dead:
            self.disconnect(c)


manager = ConnectionManager()


def fetch_enforcement_actions():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT a.id, a.ward_id, w.name as ward_name, a.source_id, s.name as source_name, s.type as source_type,
               a.description, a.officer, a.status, a.gps_lat, a.gps_lng, a.timestamp, a.initial_aqi, a.post_aqi
        FROM enforcement_actions a
        JOIN wards w ON a.ward_id = w.id
        JOIN emission_sources s ON a.source_id = s.id
    """)
    rows = cursor.fetchall()
    conn.close()
    actions = []
    for r in rows:
        actions.append({
            "id": r[0], "ward_id": r[1], "ward_name": r[2],
            "source_id": r[3], "source_name": r[4], "source_type": r[5],
            "description": r[6], "officer": r[7], "status": r[8],
            "gps_lat": r[9], "gps_lng": r[10], "timestamp": r[11],
            "initial_aqi": r[12], "post_aqi": r[13]
        })
    return actions


# ── Background Simulation Loop ────────────────────────────────────────────────
async def sensor_simulator_loop():
    while True:
        try:
            simulation_state["tick"] += 1
            tick = simulation_state["tick"]

            # 1. Base fluctuations — realistic brownian drift
            for ward, sensors in simulation_state["readings"].items():
                drift_pm  = random.gauss(0, 1.8)
                drift_co2 = random.gauss(0, 6)
                sensors["PM25"] = max(8.0,  round(sensors["PM25"] + drift_pm,  1))
                sensors["CO2"]  = max(380,  int(sensors["CO2"]  + drift_co2))

            # 2. Diurnal cycle: rush hours at 8–10 AM and 5–7 PM add extra load
            hour = datetime.now().hour
            if hour in (8, 9, 17, 18):
                for ward in ["Ward-3", "Ward-4", "Ward-6"]:
                    simulation_state["readings"][ward]["PM25"] = min(
                        300, round(simulation_state["readings"][ward]["PM25"] + random.uniform(0.5, 1.5), 1))

            # 3. Anomaly ramp-up (ward-4 diesel transport spike, multi-ward cascade)
            if simulation_state["anomaly_active"]:
                intensity = min(1.0, simulation_state["spike_intensity"] + 0.08)
                simulation_state["spike_intensity"] = intensity

                # Primary ward spike
                primary = simulation_state["anomaly_ward"]
                simulation_state["readings"][primary]["PM25"] = min(
                    340.0,
                    simulation_state["readings"][primary]["PM25"] + random.uniform(15.0, 30.0) * intensity
                )
                simulation_state["readings"][primary]["CO2"] = min(
                    780,
                    simulation_state["readings"][primary]["CO2"] + random.randint(18, 36)
                )
                # Secondary cascade to adjacent wards (wind drift effect)
                for secondary, factor in [("Ward-1", 0.3), ("Ward-2", 0.2), ("Ward-3", 0.6), ("Ward-5", 0.25), ("Ward-6", 0.5)]:
                    simulation_state["readings"][secondary]["PM25"] = min(
                        240.0,
                        simulation_state["readings"][secondary]["PM25"] + random.uniform(5.0, 14.0) * intensity * factor
                    )

            # 4. Auto-dispatch when PM25 > 140 in any ward
            conn = get_db_connection()
            cursor = conn.cursor()
            for ward, sensors in simulation_state["readings"].items():
                if sensors["PM25"] > 140.0:
                    cursor.execute(
                        "SELECT id FROM enforcement_actions WHERE ward_id = ? AND status = 'Dispatched'", (ward,))
                    if not cursor.fetchone():
                        cursor.execute(
                            "SELECT id, name, lat, lng FROM emission_sources WHERE ward_id = ? LIMIT 1", (ward,))
                        src = cursor.fetchone()
                        if src:
                            action_id = f"ACT-{random.randint(200, 999)}"
                            officers = ["Officer A. Banerjee", "Inspector K. Dahiya", "Deputy Commissioner R. Negi"]
                            desc = "Halt construction excavation, mist spray layout area, and verify dust screens."
                            if ward == "Ward-4":
                                desc = "Intercept heavy transit diesel container trucks and enforce BS-VI emission checks."
                            cursor.execute("""
                                INSERT INTO enforcement_actions
                                  (id, ward_id, source_id, description, officer, status, gps_lat, gps_lng, timestamp, initial_aqi, post_aqi)
                                VALUES (?, ?, ?, ?, ?, 'Dispatched', ?, ?, ?, ?, NULL)
                            """, (action_id, ward, src[0], desc, random.choice(officers),
                                  src[2], src[3], datetime.now().strftime("%Y-%m-%d %H:%M:%S"), sensors["PM25"]))
                            conn.commit()

            # 5. Completed action → recovery drift
            cursor.execute("SELECT ward_id FROM enforcement_actions WHERE status = 'Completed'")
            completed_wards = [r[0] for r in cursor.fetchall()]
            conn.close()
            for w_id in completed_wards:
                if w_id in simulation_state["readings"]:
                    pm = simulation_state["readings"][w_id]["PM25"]
                    if pm > 25.0:
                        simulation_state["readings"][w_id]["PM25"] = max(
                            20.0, round(pm - random.uniform(4.5, 10.0), 1))
                        simulation_state["readings"][w_id]["CO2"] = max(
                            400, int(simulation_state["readings"][w_id]["CO2"] - random.randint(6, 14)))

            # 6. Broadcast payload
            actions = fetch_enforcement_actions()
            computed_risks = {}
            active_conflict_zone = None
            for ward_id in ["Ward-1", "Ward-2", "Ward-3", "Ward-4", "Ward-5", "Ward-6"]:
                risk_eval = evaluate_ward_risk(ward_id, simulation_state["readings"][ward_id], actions)
                computed_risks[ward_id] = risk_eval
                if risk_eval["action_required"]:
                    active_conflict_zone = ward_id

            payload = {
                "timestamp": datetime.utcnow().isoformat(),
                "telemetry": simulation_state["readings"],
                "risks": computed_risks,
                "active_conflict_zone": active_conflict_zone,
                "anomaly_active": simulation_state["anomaly_active"],
                "spike_intensity": simulation_state["spike_intensity"],
                "actions": actions,
                "tick": tick,
            }
            await manager.broadcast(payload)

        except Exception as e:
            print("Simulator loop error:", e)

        await asyncio.sleep(2)


@app.on_event("startup")
async def startup_event():
    asyncio.create_task(sensor_simulator_loop())


# ── REST API ─────────────────────────────────────────────────────────────────

@app.get("/api/enforcement")
def get_actions():
    return fetch_enforcement_actions()


@app.get("/api/simulation/state")
def get_simulation_state():
    """Return current live sensor readings + anomaly state."""
    return {
        "readings": simulation_state["readings"],
        "anomaly_active": simulation_state["anomaly_active"],
        "spike_intensity": simulation_state["spike_intensity"],
        "tick": simulation_state["tick"],
    }


class ActionStatusUpdate(BaseModel):
    status: str


@app.post("/api/enforcement/{action_id}/execute")
def execute_action(action_id: str):
    """Execute enforcement action → AQI starts dropping immediately."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT ward_id FROM enforcement_actions WHERE id = ?", (action_id,))
    row = cursor.fetchone()
    if row:
        ward_id = row[0]
        current_val = simulation_state["readings"].get(ward_id, {}).get("PM25", 150.0)
        cursor.execute("""
            UPDATE enforcement_actions
            SET status = 'Completed', post_aqi = ?
            WHERE id = ?
        """, (round(current_val * 0.3, 1), action_id))
        conn.commit()

        # Immediately knock down PM25 by 30% so the chart reacts in 2–3 s
        if ward_id in simulation_state["readings"]:
            simulation_state["readings"][ward_id]["PM25"] = round(current_val * 0.68, 1)

    conn.close()
    return {
        "status": "success",
        "message": f"Enforcement action {action_id} executed. Mitigation active — AQI recovery in progress.",
        "ward_id": ward_id if row else None,
    }


@app.post("/api/simulate/inject")
def inject_anomaly():
    """Inject a heavy transport spike into Anand Vihar (Ward-4)."""
    simulation_state["anomaly_active"] = True
    simulation_state["anomaly_ward"] = "Ward-4"
    simulation_state["spike_intensity"] = 0.0   # ramp from zero
    return {"status": "success", "message": "Heavy transport spike injected in Anand Vihar. PM2.5 ramping up."}


@app.post("/api/simulate/reset")
def reset_simulation():
    """Reset all ward readings and enforcement actions."""
    simulation_state["anomaly_active"] = False
    simulation_state["spike_intensity"] = 0.0
    simulation_state["readings"] = {
        "Ward-1": {"PM25": 14.5,  "CO2": 410},
        "Ward-2": {"PM25": 48.0,  "CO2": 425},
        "Ward-3": {"PM25": 118.5, "CO2": 520},
        "Ward-4": {"PM25": 72.0,  "CO2": 460},
        "Ward-5": {"PM25": 35.2,  "CO2": 430},
        "Ward-6": {"PM25": 92.4,  "CO2": 490},
    }
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE enforcement_actions SET status = 'Dispatched', post_aqi = NULL")
    conn.commit()
    conn.close()
    return {"status": "success", "message": "Simulation restored to baseline conditions."}


@app.get("/api/forensics/fingerprint")
def get_forensics():
    """Temporal pollution fingerprints for the forensic chart."""
    hours = [f"{h:02d}:00" for h in range(24)]
    construction_pattern, diesel_pattern, industrial_pattern = [], [], []
    for h in range(24):
        c_val = 15 + 120 * (1 / (1 + ((h - 9) / 2) ** 2))
        construction_pattern.append(round(c_val + random.uniform(-3, 3), 1))
        d_val = 20 + 160 * (1 / (1 + ((h - 18) / 2.5) ** 2))
        diesel_pattern.append(round(d_val + random.uniform(-4, 4), 1))
        industrial_pattern.append(round(65 + random.uniform(-5, 5), 1))
    return {
        "hours": hours,
        "construction": construction_pattern,
        "diesel": diesel_pattern,
        "industrial": industrial_pattern,
    }


@app.get("/api/regulations/search")
def search_safety_guidelines(query: str = Query(..., min_length=2)):
    return search_regulations(query)


# ── Groq AI Chat Endpoint ─────────────────────────────────────────────────────

class ChatRequest(BaseModel):
    message: str
    context: dict = {}   # telemetry snapshot, anomaly_active, etc.


@app.post("/api/ai/chat")
async def ai_chat(req: ChatRequest):
    """Real-time Groq-powered AI analysis of live AQI telemetry."""
    if not GROQ_AVAILABLE or not groq_client:
        return {"reply": "⚠️ AI Copilot unavailable — Groq API key not configured.", "source": "fallback"}

    # Build a rich system prompt with live data
    readings = simulation_state["readings"]
    anomaly = simulation_state["anomaly_active"]
    intensity = simulation_state["spike_intensity"]

    ward_summary = "\n".join(
        f"  • {WARD_NAMES.get(w, w)} ({w}): PM2.5={v['PM25']:.1f} µg/m³, SO2/NO2={v['CO2']} ppm"
        for w, v in readings.items()
    )

    # Determine worst ward
    worst_ward = max(readings, key=lambda w: readings[w]["PM25"])
    worst_pm = readings[worst_ward]["PM25"]

    system_prompt = f"""You are NEXUS AI Sentinel Copilot — an expert real-time air quality intelligence system for Delhi's environmental enforcement authority.

LIVE TELEMETRY SNAPSHOT ({datetime.utcnow().strftime('%H:%M UTC')}):
{ward_summary}

ANOMALY STATUS: {"🚨 ACTIVE — Heavy transport diesel spike (intensity {intensity:.0%})" if anomaly else "✅ No active anomaly"}
WORST WARD: {WARD_NAMES.get(worst_ward, worst_ward)} — PM2.5 = {worst_pm:.1f} µg/m³

Your role:
- Provide concise, actionable intelligence for field officers and enforcement directors.
- When asked about inspector deployment, rank wards by PM2.5 and give specific directives.
- Quantify expected AQI reduction from interventions (use realistic estimates).
- Reference actual live readings above in your answers.
- Keep responses under 200 words. Use bullet points and bold for clarity.
- Format numbers as: PM2.5 XX µg/m³, AQI XX.
"""

    user_msg = req.message
    # Inject extra context if provided
    if req.context.get("anomaly_active"):
        user_msg += " [NOTE: Traffic spike is currently active in Anand Vihar]"

    try:
        response = groq_client.chat.completions.create(
            model="llama3-8b-8192",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user",   "content": user_msg},
            ],
            max_tokens=300,
            temperature=0.65,
        )
        reply = response.choices[0].message.content.strip()
        return {"reply": reply, "source": "groq", "model": "llama3-8b-8192"}
    except Exception as e:
        print("Groq error:", e)
        return {
            "reply": f"⚠️ AI query failed: {str(e)[:120]}",
            "source": "error"
        }


# ── WebSocket ─────────────────────────────────────────────────────────────────

@app.websocket("/ws/telemetry")
async def websocket_telemetry(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception:
        manager.disconnect(websocket)
