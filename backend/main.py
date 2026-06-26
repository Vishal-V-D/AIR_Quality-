import asyncio
import json
import random
import os
from typing import List, Dict
from datetime import datetime
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from database import get_db_connection, init_db
from risk_engine import evaluate_ward_risk
from regulations import search_regulations

app = FastAPI(title="NEXUS AQI Accountability & Forensics Platform")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize DB at startup
init_db()

# Simulation Global State for Wards
# We track PM25 (ug/m3) and CO2 (ppm)
simulation_state = {
    "anomaly_active": False, # If active, triggers a massive pollution spike in Anand Vihar (Ward-4)
    "mins_to_shift_change": 25,
    "readings": {
        "Ward-1": {"PM25": 14.5, "CO2": 410},
        "Ward-2": {"PM25": 48.0, "CO2": 425},
        "Ward-3": {"PM25": 118.5, "CO2": 520},
        "Ward-4": {"PM25": 72.0, "CO2": 460},
        "Ward-5": {"PM25": 35.2, "CO2": 430},
        "Ward-6": {"PM25": 92.4, "CO2": 490}
    }
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
        dead_connections = []
        for connection in self.active_connections:
            try:
                await connection.send_text(json.dumps(message))
            except Exception:
                dead_connections.append(connection)
        for conn in dead_connections:
            self.disconnect(conn)

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
            "id": r[0],
            "ward_id": r[1],
            "ward_name": r[2],
            "source_id": r[3],
            "source_name": r[4],
            "source_type": r[5],
            "description": r[6],
            "officer": r[7],
            "status": r[8],
            "gps_lat": r[9],
            "gps_lng": r[10],
            "timestamp": r[11],
            "initial_aqi": r[12],
            "post_aqi": r[13]
        })
    return actions

# Background simulation task
async def sensor_simulator_loop():
    while True:
        try:
            # 1. Simulating normal fluctuations
            for ward, sensors in simulation_state["readings"].items():
                # Base fluctuations
                sensors["PM25"] = max(8.0, round(sensors["PM25"] + random.uniform(-2.5, 2.5), 1))
                sensors["CO2"] = max(380, int(sensors["CO2"] + random.randint(-8, 8)))

            # 2. Handle active anomaly injection (slow spike in Ward-4 Anand Vihar due to diesel transport)
            if simulation_state["anomaly_active"]:
                simulation_state["readings"]["Ward-4"]["PM25"] = min(285.0, simulation_state["readings"]["Ward-4"]["PM25"] + random.uniform(8.0, 16.0))
                simulation_state["readings"]["Ward-4"]["CO2"] = min(680, simulation_state["readings"]["Ward-4"]["CO2"] + random.randint(10, 25))

            # 3. Check for automatic pollution spikes and auto-create enforcement action if not already present
            conn = get_db_connection()
            cursor = conn.cursor()
            
            for ward, sensors in simulation_state["readings"].items():
                if sensors["PM25"] > 140.0:
                    # Check if active enforcement action already exists for this ward
                    cursor.execute("SELECT id FROM enforcement_actions WHERE ward_id = ? AND status = 'Dispatched'", (ward,))
                    row = cursor.fetchone()
                    if not row:
                        # Auto-generate closed-loop dispatch!
                        cursor.execute("SELECT id, name, lat, lng FROM emission_sources WHERE ward_id = ? LIMIT 1", (ward,))
                        src = cursor.fetchone()
                        if src:
                            action_id = f"ACT-{random.randint(200, 999)}"
                            officers = ["Officer A. Banerjee", "Inspector K. Dahiya", "Deputy Commissioner R. Negi"]
                            desc = f"Halt construction excavation, mist spray layout area, and verify dust screens."
                            if ward == "Ward-4":
                                desc = "Intercept heavy transit diesel container trucks and enforce BS-VI emission checks."
                            
                            cursor.execute("""
                                INSERT INTO enforcement_actions (id, ward_id, source_id, description, officer, status, gps_lat, gps_lng, timestamp, initial_aqi, post_aqi)
                                VALUES (?, ?, ?, ?, ?, 'Dispatched', ?, ?, ?, ?, NULL)
                            """, (action_id, ward, src[0], desc, random.choice(officers), src[2], src[3], datetime.now().strftime("%Y-%m-%d %H:%M:%S"), sensors["PM25"]))
                            conn.commit()

            # 4. Handle gradual AQI recovery for Completed actions
            # If an action is marked Completed, we gradually lower PM2.5 levels of that ward
            cursor.execute("SELECT ward_id FROM enforcement_actions WHERE status = 'Completed'")
            completed_wards = [r[0] for r in cursor.fetchall()]
            conn.close()

            for w_id in completed_wards:
                if w_id in simulation_state["readings"]:
                    # Slowly drift PM2.5 levels down to healthy ranges
                    current_pm = simulation_state["readings"][w_id]["PM25"]
                    if current_pm > 25.0:
                        simulation_state["readings"][w_id]["PM25"] = max(20.0, round(current_pm - random.uniform(4.0, 9.0), 1))
                        simulation_state["readings"][w_id]["CO2"] = max(400, int(simulation_state["readings"][w_id]["CO2"] - random.randint(5, 12)))

            # Evaluate risks and broadcast
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
                "actions": actions
            }
            await manager.broadcast(payload)
            
        except Exception as e:
            print("Simulator loop error:", e)
        
        await asyncio.sleep(2)

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(sensor_simulator_loop())

# --- API ENDPOINTS ---

@app.get("/api/enforcement")
def get_actions():
    return fetch_enforcement_actions()

class ActionStatusUpdate(BaseModel):
    status: str

@app.post("/api/enforcement/{action_id}/execute")
def execute_action(action_id: str):
    """
    Executes the enforcement action, closing the loop.
    AQI will start dropping in the background simulation.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Get current PM2.5 for logging initial/post values
    cursor.execute("SELECT ward_id FROM enforcement_actions WHERE id = ?", (action_id,))
    row = cursor.fetchone()
    if row:
        ward_id = row[0]
        current_val = simulation_state["readings"].get(ward_id, {}).get("PM25", 150.0)
        cursor.execute("""
            UPDATE enforcement_actions 
            SET status = 'Completed', post_aqi = ? 
            WHERE id = ?
        """, (current_val * 0.3, action_id))
        conn.commit()
    conn.close()
    return {"status": "success", "message": f"Enforcement action {action_id} completed successfully. Mitigation active."}

@app.post("/api/simulate/inject")
def inject_anomaly():
    simulation_state["anomaly_active"] = True
    return {"status": "success", "message": "Heavy transport spike injected in Anand Vihar."}

@app.post("/api/simulate/reset")
def reset_simulation():
    simulation_state["anomaly_active"] = False
    simulation_state["readings"] = {
        "Ward-1": {"PM25": 14.5, "CO2": 410},
        "Ward-2": {"PM25": 48.0, "CO2": 425},
        "Ward-3": {"PM25": 118.5, "CO2": 520},
        "Ward-4": {"PM25": 72.0, "CO2": 460},
        "Ward-5": {"PM25": 35.2, "CO2": 430},
        "Ward-6": {"PM25": 92.4, "CO2": 490}
    }
    # Reset all actions
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE enforcement_actions SET status = 'Dispatched', post_aqi = NULL")
    conn.commit()
    conn.close()
    return {"status": "success", "message": "Simulation states restored to normal."}

@app.get("/api/forensics/fingerprint")
def get_forensics():
    """
    Returns temporal pattern signatures for pollution forensics
    - Construction dust: peaks around 9am
    - Diesel transport: peaks around 6pm
    - Industrial: flat, steady baseline
    """
    hours = [f"{h:02d}:00" for h in range(24)]
    construction_pattern = []
    diesel_pattern = []
    industrial_pattern = []
    
    for h in range(24):
        # Construction peaks at 9am (9) and 10am (10)
        c_val = 15 + 120 * (1 / (1 + ((h - 9)/2)**2))
        construction_pattern.append(round(c_val + random.uniform(-3, 3), 1))
        
        # Diesel peaks at 6pm (18) and 7pm (19)
        d_val = 20 + 160 * (1 / (1 + ((h - 18)/2.5)**2))
        diesel_pattern.append(round(d_val + random.uniform(-4, 4), 1))
        
        # Industrial stays flat
        i_val = 65 + random.uniform(-5, 5)
        industrial_pattern.append(round(i_val, 1))
        
    return {
        "hours": hours,
        "construction": construction_pattern,
        "diesel": diesel_pattern,
        "industrial": industrial_pattern
    }

@app.get("/api/regulations/search")
def search_safety_guidelines(query: str = Query(..., min_length=2)):
    return search_regulations(query)

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
