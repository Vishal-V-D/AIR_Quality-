import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronLeft, ChevronRight, LayoutGrid, User, Building, Users, MapPin,
  ShieldAlert, Zap, HelpCircle, Activity, Globe, Search, Sliders, Share2, MoreHorizontal, Sun, Moon,
  Wind, Thermometer, Waves, Settings, Smile, ThumbsUp, Meh, Frown, AlertCircle
} from 'lucide-react';
import L from 'leaflet';
import HistoricalRecords, { HISTORICAL_DATA } from './components/HistoricalRecords';
import SpectroscopeAnalysis from './components/SpectroscopeAnalysis';
import NationalRegistry from './components/NationalRegistry';
import StateOrg from './components/StateOrg';
import FieldOfficers from './components/FieldOfficers';
const API_URL = import.meta.env.VITE_API_URL || 'https://air-quality-yxqa.onrender.com';
const WS_URL = import.meta.env.VITE_WS_URL || 'wss://air-quality-yxqa.onrender.com';

const WARDS = [
  { id: 'Ward 1', name: 'Connaught Place', lat: 28.6304, lng: 77.2177, devices: 16 },
  { id: 'Ward 2', name: 'Dwarka Sector 10', lat: 28.5850, lng: 77.0490, devices: 16 },
  { id: 'Ward 3', name: 'Okhla Industrial', lat: 28.5350, lng: 77.2850, devices: 16 },
  { id: 'Ward 4', name: 'Anand Vihar', lat: 28.6470, lng: 77.3150, devices: 16 },
  { id: 'Ward 5', name: 'Punjabi Bagh', lat: 28.6610, lng: 77.1240, devices: 16 },
  { id: 'Ward 6', name: 'Wazirpur Industrial', lat: 28.6990, lng: 77.1680, devices: 16 },
];

function calculateAQI(pm25) {
  if (pm25 <= 30) return Math.round(pm25 * 50 / 30);
  if (pm25 <= 60) return Math.round(50 + (pm25 - 30) * 50 / 30);
  if (pm25 <= 90) return Math.round(100 + (pm25 - 60) * 100 / 30);
  if (pm25 <= 120) return Math.round(200 + (pm25 - 90) * 100 / 30);
  if (pm25 <= 250) return Math.round(300 + (pm25 - 120) * 100 / 130);
  return Math.round(400 + (pm25 - 250) * 100 / 150);
}

function getAQIColor(aqi) {
  if (aqi <= 50) return '#2ecc71';
  if (aqi <= 100) return '#8bc34a';
  if (aqi <= 200) return '#ff9f1c';
  if (aqi <= 300) return '#e74c3c';
  if (aqi <= 400) return '#9b59b6';
  return '#7d1c1c';
}

function getAQIStatus(aqi) {
  if (aqi <= 50) return 'Good';
  if (aqi <= 100) return 'Satisfactory';
  if (aqi <= 200) return 'Moderate';
  if (aqi <= 300) return 'Poor';
  if (aqi <= 400) return 'Very Poor';
  return 'Severe';
}

function getAQIIcon(aqi, size = 13) {
  if (aqi <= 50) return <Smile size={size} />;
  if (aqi <= 100) return <ThumbsUp size={size} />;
  if (aqi <= 200) return <Meh size={size} />;
  if (aqi <= 300) return <Frown size={size} />;
  if (aqi <= 400) return <AlertCircle size={size} />;
  return <ShieldAlert size={size} />;
}

function SpeedometerGauge({ value }) {
  const [tooltip, setTooltip] = React.useState(null);

  // ── Geometry ──────────────────────────────────────────────────────────────
  const W = 400, H = 260;
  const cx = W / 2;      // 200
  const cy = H - 48;     // 212  — hub sits near bottom
  const R = 148;        // arc radius
  const max = 350;
  const valClamped = Math.min(Math.max(value, 0), max);

  // The FULL arc path: starts at leftmost point, sweeps clockwise (sweep=1) to rightmost.
  // M (cx-R, cy)  A R R 0 0 1  (cx+R, cy)
  const arcD = `M ${cx - R} ${cy} A ${R} ${R} 0 0 1 ${cx + R} ${cy}`;

  // Half circumference = total arc pixel length
  const totalArc = Math.PI * R; // ≈ 465

  // ── AQI Zones ─────────────────────────────────────────────────────────────
  const zones = [
    { label: 'Good', min: 0, max: 50, color: '#008a3c' },
    { label: 'Satisfactory', min: 50, max: 100, color: '#9ccb3b' },
    { label: 'Moderate', min: 100, max: 150, color: '#facc15' },
    { label: 'Poor', min: 150, max: 200, color: '#f97316' },
    { label: 'Very Poor', min: 200, max: 300, color: '#ef4444' },
    { label: 'Severe', min: 300, max: 350, color: '#7f1d1d' },
  ];

  // ── Helpers ────────────────────────────────────────────────────────────────
  // Map a value (0-350) to its (x, y) on the arc
  const valToPoint = (v, rOffset = 0) => {
    // angle: π (left) → 0 (right) as v goes 0 → 350
    const angle = Math.PI - (Math.min(v, max) / max) * Math.PI;
    return {
      x: cx + (R + rOffset) * Math.cos(angle),
      y: cy - (R + rOffset) * Math.sin(angle),
    };
  };

  // ── Needle rotation ────────────────────────────────────────────────────────
  // Needle SVG shape points UPWARD from the hub.
  // At v=0  → points LEFT  → rotate -90°
  // At v=350 → points RIGHT → rotate +90°
  const needleRotation = -90 + (valClamped / max) * 180;

  // ── Scale labels ───────────────────────────────────────────────────────────
  const labelValues = [0, 50, 100, 150, 200, 250, 300, 350];

  return (
    <div className="speedometer-inner" style={{ position: 'relative', overflow: 'visible' }}>

      {/* Hover tooltip */}
      {tooltip && (
        <div style={{
          position: 'absolute',
          left: tooltip.px - 58,
          top: tooltip.py - 46,
          background: tooltip.color,
          color: '#fff',
          padding: '5px 12px',
          borderRadius: '8px',
          fontSize: '12px',
          fontWeight: '800',
          pointerEvents: 'none',
          zIndex: 20,
          boxShadow: '0 4px 14px rgba(0,0,0,0.45)',
          whiteSpace: 'nowrap',
        }}>
          {tooltip.label}: {tooltip.min}–{tooltip.max}
        </div>
      )}

      <svg
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        style={{ overflow: 'visible', display: 'block' }}
      >
        <defs>
          <filter id="nShadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="1" dy="2" stdDeviation="4" floodColor="#000" floodOpacity="0.55" />
          </filter>
        </defs>

        {/* ── Background track ── */}
        <path
          d={arcD}
          fill="none"
          stroke="rgba(255,255,255,0.07)"
          strokeWidth="30"
          strokeLinecap="round"
        />

        {/* ── Coloured zone segments via stroke-dasharray ── */}
        {zones.map(z => {
          const startPx = (z.min / max) * totalArc;
          const lenPx = ((z.max - z.min) / max) * totalArc;
          return (
            <path
              key={z.label}
              d={arcD}
              fill="none"
              stroke={z.color}
              strokeWidth="30"
              strokeLinecap="butt"
              strokeDasharray={`${lenPx.toFixed(2)} ${totalArc.toFixed(2)}`}
              strokeDashoffset={(-startPx).toFixed(2)}
              style={{ cursor: 'pointer' }}
              onMouseEnter={e => {
                const svg = e.currentTarget.closest('svg');
                const rect = svg.getBoundingClientRect();
                const scaleX = W / rect.width;
                const scaleY = H / rect.height;
                setTooltip({
                  label: z.label, min: z.min, max: z.max, color: z.color,
                  px: (e.clientX - rect.left) * scaleX,
                  py: (e.clientY - rect.top) * scaleY,
                });
              }}
              onMouseLeave={() => setTooltip(null)}
            />
          );
        })}

        {/* ── Scale labels outside arc ── */}
        {labelValues.map(v => {
          const pt = valToPoint(v, 26);
          return (
            <text
              key={v}
              x={pt.x.toFixed(1)}
              y={(pt.y + 4).toFixed(1)}
              fill="var(--text)"
              fontSize="12"
              fontWeight="800"
              textAnchor="middle"
            >
              {v}
            </text>
          );
        })}

        {/* ── AQI number + label inside the arc ── */}
        <text
          x={cx}
          y={cy - 60}
          textAnchor="middle"
          fill="var(--text)"
          fontSize="50"
          fontWeight="900"
          style={{ transition: 'all 0.5s ease' }}
        >
          {value}
        </text>
        <text
          x={cx}
          y={cy - 30}
          textAnchor="middle"
          fill="var(--muted)"
          fontSize="13"
          fontWeight="700"
          letterSpacing="2"
        >
          AQI
        </text>

        {/* ── Needle — rendered BEFORE hub so hub sits on top ── */}
        <g
          transform={`rotate(${needleRotation.toFixed(2)}, ${cx}, ${cy})`}
          style={{ transition: 'transform 0.6s cubic-bezier(0.4,0,0.2,1)' }}
          filter="url(#nShadow)"
        >
          {/* Slim teardrop needle pointing upward */}
          <path
            d={`M ${cx} ${cy + 8} L ${cx - 7} ${cy} L ${cx} ${cy - R + 28} L ${cx + 7} ${cy} Z`}
            fill="#1e1e1e"
            stroke="rgba(255,255,255,0.12)"
            strokeWidth="0.8"
          />
        </g>

        {/* ── Hub cap (above needle) ── */}
        <circle cx={cx} cy={cy} r="20" fill="#1a1a1a" stroke="rgba(255,255,255,0.22)" strokeWidth="2.5" />
        <circle cx={cx} cy={cy} r="7" fill="rgba(255,255,255,0.28)" />

        {/* ── AIR / QUALITY INDEX ── */}
        <text x={cx} y={cy + 34} textAnchor="middle" fill="var(--text)" fontSize="15" fontWeight="900" letterSpacing="1">AIR</text>
        <text x={cx} y={cy + 50} textAnchor="middle" fill="var(--muted)" fontSize="9" fontWeight="700" letterSpacing="2">QUALITY INDEX</text>
      </svg>
    </div>
  );
}

function MiniSpeedometerGauge({ value }) {
  const max = 500;
  const val = Math.min(Math.max(value, 0), max);
  const percent = val / max;
  const cx = 35;
  const cy = 35;
  const rOuter = 26;
  const rInner = 20;

  const angleStart = 200;
  const angleEnd = -20;
  const angleRange = angleStart - angleEnd;

  const color = getAQIColor(val);

  const segments = [];
  const totalSegments = 14;
  for (let i = 0; i < totalSegments; i++) {
    const segPercent = i / (totalSegments - 1);
    const segAQI = segPercent * max;
    const segAngle = angleStart - segPercent * angleRange;
    const rad = (segAngle * Math.PI) / 180;

    const x1 = cx + rInner * Math.cos(rad);
    const y1 = cy - rInner * Math.sin(rad);
    const x2 = cx + rOuter * Math.cos(rad);
    const y2 = cy - rOuter * Math.sin(rad);

    const isActive = segAQI <= val;
    const strokeColor = isActive ? color : 'rgba(255, 255, 255, 0.08)';

    segments.push(
      <line
        key={i}
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={strokeColor}
        strokeWidth="2.2"
        strokeLinecap="round"
        style={{ transition: 'stroke 0.4s ease' }}
      />
    );
  }

  return (
    <div className="mini-speedometer">
      <svg width="70" height="56" viewBox="0 0 70 56">
        {segments}
      </svg>
      <div className="mini-aqi-center" style={{ bottom: '8px' }}>
        <span className="mini-aqi-val">{val}</span>
        <span className="mini-aqi-lbl">AQI</span>
      </div>
    </div>
  );
}

function Sparkline({ data = [] }) {
  if (data.length === 0) return null;
  const width = 240;
  const height = 38;
  const maxVal = Math.max(...data, 100);
  const minVal = Math.min(...data, 0);
  const range = maxVal - minVal || 1;

  const points = data.map((val, idx) => {
    const x = (idx / (data.length - 1)) * width;
    const y = height - ((val - minVal) / range) * (height - 6) - 3;
    return { x, y };
  });

  const pathD = points.reduce((acc, p, idx) => {
    return acc + `${idx === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
  }, "");

  const areaD = pathD + ` L ${width} ${height} L 0 ${height} Z`;
  const currentVal = data[data.length - 1];
  const color = getAQIColor(currentVal);

  // Generate 6 vertical grid lines
  const gridLines = [];
  const totalGridLines = 6;
  for (let i = 0; i < totalGridLines; i++) {
    const x = (i / (totalGridLines - 1)) * width;
    gridLines.push(
      <line
        key={`grid-${i}`}
        x1={x}
        y1={0}
        x2={x}
        y2={height}
        stroke="var(--border)"
        strokeWidth="0.8"
        strokeDasharray="2,2"
        opacity="0.35"
      />
    );
  }

  return (
    <div className="sparkline-container">
      <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        <defs>
          <linearGradient id={`sparkGrad-${color}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.25" />
            <stop offset="100%" stopColor={color} stopOpacity="0.0" />
          </linearGradient>
        </defs>
        {/* Vertical Grid Lines */}
        {gridLines}

        {/* Gradient Fill */}
        <path d={areaD} fill={`url(#sparkGrad-${color})`} style={{ transition: 'all 0.4s ease' }} />
        {/* Trend Line */}
        <path d={pathD} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'all 0.4s ease' }} />
        {/* End dot */}
        {points.length > 0 && (
          <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r="2.5" fill={color} stroke="#fff" strokeWidth="1" />
        )}
      </svg>
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedLocation, setSelectedLocation] = useState('Connaught Place, New Delhi');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [lightTheme, setLightTheme] = useState(false);
  const [graphPeriod, setGraphPeriod] = useState('Monthly');
  const [telemetry, setTelemetry] = useState({
    "Ward-1": { "PM25": 12.0, "CO2": 410 },
    "Ward-2": { "PM25": 48.0, "CO2": 425 },
    "Ward-3": { "PM25": 118.5, "CO2": 520 },
    "Ward-4": { "PM25": 72.0, "CO2": 460 },
    "Ward-5": { "PM25": 35.2, "CO2": 430 },
    "Ward-6": { "PM25": 92.4, "CO2": 490 }
  });
  const [wardHistory, setWardHistory] = useState({});
  const [chartHoverIndex, setChartHoverIndex] = useState(null);

  useEffect(() => {
    if (!telemetry || Object.keys(telemetry).length === 0) return;
    setWardHistory(prev => {
      const next = { ...prev };
      Object.keys(telemetry).forEach(wKey => {
        const pm = telemetry[wKey]?.PM25 || 12;
        const aqi = calculateAQI(pm);
        const currentHistory = prev[wKey] || Array(26).fill(aqi);
        const newHistory = [...currentHistory.slice(-25), aqi]; // always keep last 26
        next[wKey] = newHistory;
      });
      return next;
    });
  }, [telemetry]);
  const [actions, setActions] = useState([]);
  const [anomalyActive, setAnomalyActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('diesel exhaust');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedActionId, setSelectedActionId] = useState(null);

  const mapRef = useRef(null);
  const mapInst = useRef(null);
  const wsRef = useRef(null);
  const dashMapRef = useRef(null);
  const dashMapInst = useRef(null);
  const dashMarkersRef = useRef({});

  useEffect(() => {
    const connectWS = () => {
      const ws = new WebSocket(`${WS_URL}/ws/telemetry`);
      wsRef.current = ws;
      ws.onmessage = (event) => {
        const payload = JSON.parse(event.data);
        if (payload.telemetry) setTelemetry(payload.telemetry);
        if (payload.anomaly_active !== undefined) setAnomalyActive(payload.anomaly_active);
        if (payload.actions) setActions(payload.actions);
      };
      ws.onclose = () => setTimeout(connectWS, 3000);
    };
    connectWS();
    fetchActions();
    handleSearch();
    return () => wsRef.current?.close();
  }, []);

  const fetchActions = async () => {
    try {
      const res = await fetch(`${API_URL}/api/enforcement`);
      const data = await res.json();
      setActions(data);
    } catch (e) { }
  };

  const executeMitigation = async (actionId) => {
    // First call the backend to mark completed
    try {
      await fetch(`${API_URL}/api/enforcement/${actionId}/execute`, { method: 'POST' });
      // Optimistically update local state
      setActions(prev => prev.map(a =>
        a.id === actionId ? { ...a, status: 'Completed' } : a
      ));
    } catch (e) { }
    // Also navigate to analysis view
    setSelectedActionId(actionId);
    setActiveTab('analysis');
  };

  const injectSpike = async () => {
    try { await fetch(`${API_URL}/api/simulate/inject`, { method: 'POST' }); } catch (e) { }
  };

  const resetSimulation = async () => {
    try { await fetch(`${API_URL}/api/simulate/reset`, { method: 'POST' }); } catch (e) { }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    try {
      const res = await fetch(`${API_URL}/api/regulations/search?query=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      setSearchResults(data);
    } catch (e) { }
  };

  useEffect(() => {
    if (activeTab !== 'map' || !mapRef.current) return;
    if (mapInst.current) return;
    mapInst.current = L.map(mapRef.current, { center: [28.6139, 77.2090], zoom: 11 });

    if (lightTheme) {
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png').addTo(mapInst.current);
    } else {
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png').addTo(mapInst.current);
    }

    WARDS.forEach(w => {
      const val = telemetry[w.id.replace('Ward ', 'Ward-')]?.PM25 || 35;
      const color = val > 120 ? '#e74c3c' : val > 50 ? '#f39c12' : '#f89c1d';
      const icon = L.divIcon({
        html: `<div style="display:flex; flex-direction:column; align-items:center;">
          <svg width="24" height="34" viewBox="0 0 28 38"><path d="M14 0C6.27 0 0 6.27 0 14C0 24.5 14 38 14 38C14 38 28 24.5 28 14C28 6.27 21.73 0 14 0Z" fill="${color}"/><circle cx="14" cy="14" r="5" fill="#fff"/></svg>
          <div style="background:${color}; color:#000; padding:2px 6px; border-radius:4px; font-size:9px; font-weight:700; margin-top:2px;">${w.id}</div>
        </div>`,
        className: 'custom-map-marker', iconSize: [50, 50], iconAnchor: [25, 34]
      });
      L.marker([w.lat, w.lng], { icon }).addTo(mapInst.current).bindPopup(`<strong>${w.id} - ${w.name}</strong><br/>PM2.5: ${val} μg/m³`);
    });
    return () => { mapInst.current?.remove(); mapInst.current = null; };
  }, [activeTab, telemetry, lightTheme]);

  useEffect(() => {
    if (activeTab !== 'dashboard' || !dashMapRef.current) {
      if (dashMapInst.current) {
        dashMapInst.current.remove();
        dashMapInst.current = null;
        dashMarkersRef.current = {};
      }
      return;
    }

    if (!dashMapInst.current) {
      dashMapInst.current = L.map(dashMapRef.current, {
        center: [28.6139, 77.2090],
        zoom: 10,
        zoomControl: false
      });
      L.control.zoom({ position: 'topright' }).addTo(dashMapInst.current);
    }

    // Refresh tile layer
    dashMapInst.current.eachLayer(layer => {
      if (layer instanceof L.TileLayer) {
        dashMapInst.current.removeLayer(layer);
      }
    });

    if (lightTheme) {
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png').addTo(dashMapInst.current);
    } else {
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png').addTo(dashMapInst.current);
    }

    // Update/create markers
    WARDS.forEach(w => {
      const tKey = w.id.replace('Ward ', 'Ward-');
      const pmVal = telemetry[tKey]?.PM25 || 12;
      const aqiVal = calculateAQI(pmVal);
      const color = getAQIColor(aqiVal);

      if (dashMarkersRef.current[w.id]) {
        const marker = dashMarkersRef.current[w.id];
        marker.setIcon(L.divIcon({
          html: `<div style="display:flex; flex-direction:column; align-items:center;">
            <svg width="24" height="34" viewBox="0 0 28 38"><path d="M14 0C6.27 0 0 6.27 0 14C0 24.5 14 38 14 38C14 38 28 24.5 28 14C28 6.27 21.73 0 14 0Z" fill="${color}"/><circle cx="14" cy="14" r="5" fill="#fff"/></svg>
            <div style="background:${color}; color:#fff; padding:2px 6px; border-radius:4px; font-size:9px; font-weight:700; margin-top:2px; text-shadow: 0 1px 2px rgba(0,0,0,0.5);">${w.id}</div>
          </div>`,
          className: 'custom-map-marker', iconSize: [50, 50], iconAnchor: [25, 34]
        }));
        marker.getPopup().setContent(`<strong>${w.id} - ${w.name}</strong><br/>PM2.5: ${pmVal} μg/m³<br/>AQI: ${aqiVal}`);
      } else {
        const marker = L.marker([w.lat, w.lng], {
          icon: L.divIcon({
            html: `<div style="display:flex; flex-direction:column; align-items:center;">
              <svg width="24" height="34" viewBox="0 0 28 38"><path d="M14 0C6.27 0 0 6.27 0 14C0 24.5 14 38 14 38C14 38 28 24.5 28 14C28 6.27 21.73 0 14 0Z" fill="${color}"/><circle cx="14" cy="14" r="5" fill="#fff"/></svg>
              <div style="background:${color}; color:#fff; padding:2px 6px; border-radius:4px; font-size:9px; font-weight:700; margin-top:2px; text-shadow: 0 1px 2px rgba(0,0,0,0.5);">${w.id}</div>
            </div>`,
            className: 'custom-map-marker', iconSize: [50, 50], iconAnchor: [25, 34]
          })
        }).addTo(dashMapInst.current).bindPopup(`<strong>${w.id} - ${w.name}</strong><br/>PM2.5: ${pmVal} μg/m³<br/>AQI: ${aqiVal}`);
        dashMarkersRef.current[w.id] = marker;
      }
    });
  }, [activeTab, telemetry, lightTheme]);

  const focusWardOnMap = (w) => {
    setActiveTab('map');
  };

  const getPoints = () => {
    switch (graphPeriod) {
      case 'Weekly':
        return {
          outdoor: "45,140 109,110 173,130 237,160 301,90 365,70 429,95 493,120 557,140 621,80 685,60 749,110 813,130 845,90",
          indoor: "45,178 109,174 173,176 237,178 301,170 365,168 429,172 493,174 557,176 621,170 685,165 749,173 813,175 845,170",
          val: 80
        };
      case 'Daily':
        return {
          outdoor: "45,160 109,150 173,145 237,120 301,105 365,95 429,80 493,75 557,90 621,110 685,120 749,130 813,145 845,160",
          indoor: "45,182 109,180 173,179 237,176 301,174 365,172 429,170 493,169 557,171 621,173 685,175 749,178 813,180 845,182",
          val: 170
        };
      case 'Hourly':
        return {
          outdoor: "45,70 109,180 173,60 237,190 301,50 365,195 429,80 493,180 557,75 621,190 685,90 749,185 813,85 845,190",
          indoor: "45,150 109,175 173,148 237,179 301,142 365,180 429,151 493,176 557,144 621,179 685,150 749,178 813,149 845,177",
          val: 180
        };
      default: // Monthly
        return {
          outdoor: "45,105 77,83 109,63 141,53 173,83 205,123 237,148 269,113 301,73 333,33 365,18 397,43 429,23 461,53 493,83 525,58 557,93 589,123 621,103 653,73 685,88 717,63 749,53 781,68 813,73 845,58",
          indoor: "45,172 77,168 109,165 141,162 173,168 205,175 237,178 269,170 301,163 333,155 365,150 397,158 429,152 461,162 493,168 525,160 557,167 589,174 621,170 653,162 685,166 717,160 749,175 781,171 813,165 845,168",
          val: 12
        };
    }
  };

  const cpPM = telemetry["Ward-1"]?.PM25 || 12;
  const avgPM = Object.keys(telemetry).length > 0
    ? Object.keys(telemetry).reduce((sum, key) => sum + (telemetry[key]?.PM25 || 0), 0) / Object.keys(telemetry).length
    : 12;
  const delhiAQI = calculateAQI(avgPM);
  const pts = getPoints();

  const selectedRecord = HISTORICAL_DATA.find(r => r.location === selectedLocation) || HISTORICAL_DATA[0];
  const selectedAQI = selectedRecord ? selectedRecord.aqi : 148;

  let bgUrl = '';
  if (activeTab === 'records') {
    bgUrl = 'https://purple-cdn.web-apps-prod.wo-cloud.com/purple/0f7a645f-e3c1-4a9c-a6dd-ccfa5dff68a7/ccaeda65-166e-49c6-bbcd-ece973f0339c/9bb63399-573d-450a-bb35-5a66081c740d/fcbf6408-2079-45d2-9f05-773a5f2c4b70.jpg';
  }

  return (
    <div
      className={`shell ${lightTheme ? 'theme-light' : ''} ${activeTab === 'records' ? 'records-view' : ''}`}
      style={bgUrl ? {
        backgroundImage: `url(${bgUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      } : {}}
    >

      {/* SIDEBAR */}
      <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`} style={{ overflowX: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <div className="logo" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
            <div className="logo-icon">P</div>
            <span className="logo-text">PranalAQ</span>
          </div>
          <button className="sb-toggle-btn" onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>
            <ChevronLeft size={16} style={{ transform: sidebarCollapsed ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </button>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%' }}>
          <button className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
            <span className="nav-icon" style={{ display: 'inline-flex', alignItems: 'center' }}><LayoutGrid size={15} /></span>
            <span className="nav-text">Dashboard</span>
          </button>

          <button className={`nav-item ${activeTab === 'records' ? 'active' : ''}`} onClick={() => setActiveTab('records')}>
            <span className="nav-icon" style={{ display: 'inline-flex', alignItems: 'center' }}><Activity size={15} /></span>
            <span className="nav-text">Historical Records</span>
          </button>

          <div className="nav-section-label" style={{ marginTop: '12px' }}>Registry Management</div>
          <button className={`nav-item ${activeTab === 'national-registry' ? 'active' : ''}`} onClick={() => setActiveTab('national-registry')}>
            <span className="nav-icon" style={{ display: 'inline-flex', alignItems: 'center' }}><User size={15} /></span>
            <span className="nav-text">National Registry</span>
          </button>
          <button className={`nav-item ${activeTab === 'state-org' ? 'active' : ''}`} onClick={() => setActiveTab('state-org')}>
            <span className="nav-icon" style={{ display: 'inline-flex', alignItems: 'center' }}><Building size={15} /></span>
            <span className="nav-text">State Org</span>
          </button>
          <button className={`nav-item ${activeTab === 'field-officers' ? 'active' : ''}`} onClick={() => setActiveTab('field-officers')}>
            <span className="nav-icon" style={{ display: 'inline-flex', alignItems: 'center' }}><Users size={15} /></span>
            <span className="nav-text">Field Officers</span>
          </button>

          <div className="nav-section-label" style={{ marginTop: '12px' }}>Forensics Cockpit</div>
          <button className={`nav-item ${activeTab === 'map' ? 'active' : ''}`} onClick={() => setActiveTab('map')}>
            <span className="nav-icon" style={{ display: 'inline-flex', alignItems: 'center' }}><MapPin size={15} /></span>
            <span className="nav-text">Spatial Map</span>
          </button>
          <button className={`nav-item ${activeTab === 'regulations' ? 'active' : ''}`} onClick={() => setActiveTab('regulations')}>
            <span className="nav-icon" style={{ display: 'inline-flex', alignItems: 'center' }}><ShieldAlert size={15} /></span>
            <span className="nav-text">Safety Guidelines</span>
          </button>

          <div className="nav-section-label" style={{ marginTop: '12px' }}>System</div>
          <button className="nav-item">
            <span className="nav-icon" style={{ display: 'inline-flex', alignItems: 'center' }}><Settings size={15} /></span>
            <span className="nav-text">Settings</span>
          </button>
        </nav>

        <div className="apt-card" style={{ borderRadius: '8px' }}>
          <img src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&q=80" style={{ borderRadius: '8px 8px 0 0' }} alt="Delhi Registry Map" />
          <div className="apt-badge">
            <div className="apt-co2" style={{ borderColor: '#f89c1d', color: '#f89c1d', borderRadius: '4px' }}>79<sub>AQI</sub></div>
            Delhi Region
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <div className="main">

        {activeTab === 'analysis' ? (
          <SpectroscopeAnalysis
            actionId={selectedActionId}
            actions={actions}
            lightTheme={lightTheme}
            onClose={() => setActiveTab('dashboard')}
            telemetry={telemetry}
            anomalyActive={anomalyActive}
            onExecuteAction={(id) => {
              setActions(prev => prev.map(a =>
                a.id === id ? { ...a, status: 'Completed' } : a
              ));
            }}
          />
        ) : (
          <>
            <div className="topbar">
              <div className="breadcrumb">
                <ChevronLeft style={{ width: '14px', height: '14px', marginRight: '4px' }} />
                <span>Overview</span>
                <span>/</span>
                <span>National Registry</span>
                <span>/</span>
                <span className="active">{activeTab === 'records' ? 'Historical Data' : 'Delhi Region'}</span>
              </div>

              <div className="topbar-right">
                <div className="theme-toggle">
                  Light
                  <div className={`toggle-pill ${lightTheme ? '' : 'dark'}`} onClick={() => setLightTheme(!lightTheme)}></div>
                  Dark
                </div>
                <div className="user-chip" style={{ borderRadius: '8px' }}>
                  Hello, Nixtio
                </div>
              </div>
            </div>

            {/* CONTENT */}
            <div className="content">

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1>{activeTab === 'dashboard' ? 'Delhi Region Registry' : ''}</h1>
                {activeTab === 'dashboard' && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      className={anomalyActive ? "btn-cyan active-spike-btn" : "btn-cyan"}
                      style={{
                        background: anomalyActive ? '#ef4444' : '#f89c1d',
                        color: '#fff',
                        borderRadius: '8px',
                        padding: '8px 16px',
                        fontWeight: '700',
                        boxShadow: anomalyActive ? '0 0 12px rgba(239, 68, 68, 0.4)' : 'none',
                        animation: anomalyActive ? 'pulseGlow 1.5s infinite alternate' : 'none',
                        transition: 'all 0.3s ease',
                        border: 'none',
                        cursor: 'pointer'
                      }}
                      onClick={anomalyActive ? resetSimulation : injectSpike}
                    >
                      {anomalyActive ? '🔴 Stop Transport Spike' : '⚡ Inject Transport Spike'}
                    </button>
                    <button className="btn-ghost" style={{ borderRadius: '8px' }} onClick={resetSimulation}>Reset Simulation</button>
                  </div>
                )}
              </div>

              {activeTab === 'dashboard' && (
                <>
                  {/* TOP speedometer & map grid */}
                  <div className="top-grid">

                    {/* Speedometer card */}
                    <div className="speedometer-card" style={{ borderRadius: '8px' }}>
                      <div className="speedometer-title">Delhi Region Air Quality Index</div>
                      <div className="speedometer-location">
                        <MapPin size={13} />
                        <span>Connaught Place, New Delhi</span>
                      </div>
                      <SpeedometerGauge value={delhiAQI} />
                    </div>

                    {/* Dashboard Map card */}
                    <div className="dash-map-card" style={{ borderRadius: '8px' }}>
                      <div className="dash-map-title">Live Ward Distribution Map</div>
                      <div className="dash-map-container" ref={dashMapRef}></div>
                    </div>

                  </div>

                  {/* CHART CARD */}
                  <div className="chart-card" style={{ borderRadius: '8px' }}>
                    <div className="chart-header">
                      <div className="chart-title">National Baseline vs Delhi Region PM 2.5</div>
                      <div className="chart-legend">
                        <span><span className="legend-dot" style={{ background: '#f89c1d' }}></span> Delhi Avg PM 2.5</span>
                        <span><span className="legend-dot" style={{ background: '#888' }}></span> National Avg PM 2.5</span>

                        <select className="monthly-btn" style={{ borderRadius: '8px' }} value={graphPeriod} onChange={(e) => setGraphPeriod(e.target.value)}>
                          <option value="Monthly">Monthly</option>
                          <option value="Weekly">Weekly</option>
                          <option value="Daily">Daily</option>
                          <option value="Hourly">Hourly</option>
                        </select>
                      </div>
                    </div>

                    <div className="chart-wrap">
                      <svg viewBox="0 0 860 210" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', display: 'block' }}>
                        <defs>
                          <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#444" stopOpacity="0.4" />
                            <stop offset="100%" stopColor="#2a2a2a" stopOpacity="0" />
                          </linearGradient>
                        </defs>

                        {/* Y-axis labels */}
                        <text x="8" y="18" fill="#555" fontSize="10">250</text>
                        <text x="8" y="58" fill="#555" fontSize="10">150</text>
                        <text x="8" y="100" fill="#555" fontSize="10">55</text>
                        <text x="8" y="128" fill="#555" fontSize="10">35</text>
                        <text x="8" y="156" fill="#555" fontSize="10">12</text>
                        <text x="8" y="192" fill="#555" fontSize="10">0</text>

                        {/* Grid lines */}
                        <line x1="32" x2="855" y1="14" y2="14" stroke="#333" strokeWidth=".5" />
                        <line x1="32" x2="855" y1="54" y2="54" stroke="#333" strokeWidth=".5" />
                        <line x1="32" x2="855" y1="96" y2="96" stroke="#333" strokeWidth=".5" />
                        <line x1="32" x2="855" y1="125" y2="125" stroke="#333" strokeWidth=".5" />
                        <line x1="32" x2="855" y1="153" y2="153" stroke="#333" strokeWidth=".5" />
                        <line x1="32" x2="855" y1="188" y2="188" stroke="#333" strokeWidth=".5" />

                        {/* Bars (outdoor) */}
                        <rect x="35" y="100" width="20" height="88" fill="url(#barGrad)" rx="3" />
                        <rect x="67" y="80" width="20" height="108" fill="url(#barGrad)" rx="3" />
                        <rect x="99" y="60" width="20" height="128" fill="url(#barGrad)" rx="3" />
                        <rect x="131" y="50" width="20" height="138" fill="url(#barGrad)" rx="3" />
                        <rect x="163" y="80" width="20" height="108" fill="url(#barGrad)" rx="3" />
                        <rect x="195" y="120" width="20" height="68" fill="url(#barGrad)" rx="3" />
                        <rect x="227" y="145" width="20" height="43" fill="url(#barGrad)" rx="3" />
                        <rect x="259" y="110" width="20" height="78" fill="url(#barGrad)" rx="3" />
                        <rect x="291" y="70" width="20" height="118" fill="url(#barGrad)" rx="3" />
                        <rect x="323" y="30" width="20" height="158" fill="url(#barGrad)" rx="3" />
                        <rect x="355" y="15" width="20" height="173" fill="url(#barGrad)" rx="3" />
                        <rect x="387" y="40" width="20" height="148" fill="url(#barGrad)" rx="3" />
                        <rect x="419" y="20" width="20" height="168" fill="url(#barGrad)" rx="3" />
                        <rect x="451" y="50" width="20" height="138" fill="url(#barGrad)" rx="3" />
                        <rect x="483" y="80" width="20" height="108" fill="url(#barGrad)" rx="3" />
                        <rect x="515" y="55" width="20" height="133" fill="url(#barGrad)" rx="3" />
                        <rect x="547" y="90" width="20" height="98" fill="url(#barGrad)" rx="3" />
                        <rect x="579" y="120" width="20" height="68" fill="url(#barGrad)" rx="3" />
                        <rect x="611" y="100" width="20" height="88" fill="url(#barGrad)" rx="3" />
                        <rect x="643" y="70" width="20" height="118" fill="url(#barGrad)" rx="3" />
                        <rect x="675" y="85" width="20" height="103" fill="url(#barGrad)" rx="3" />
                        <rect x="707" y="60" width="20" height="128" fill="url(#barGrad)" rx="3" />
                        <rect x="739" y="50" width="20" height="138" fill="url(#barGrad)" rx="3" />
                        <rect x="771" y="65" width="20" height="123" fill="url(#barGrad)" rx="3" />
                        <rect x="803" y="70" width="20" height="118" fill="url(#barGrad)" rx="3" />
                        <rect x="830" y="55" width="20" height="133" fill="url(#barGrad)" rx="3" />


                        {/* ── Fully live chart & interactive hover overlay ── */}
                        {(() => {
                          // Parse outdoor points to get exact coordinates
                          const outdoorPoints = pts.outdoor.trim().split(/\s+/).map(pair => {
                            const [x, y] = pair.split(',').map(Number);
                            return { x, y };
                          });

                          const N = outdoorPoints.length;
                          const yTop = 14, yBottom = 188;
                          const yScale = 250; // AQI 250 -> y=14, AQI 0 -> y=188
                          const toY = v => yBottom - (Math.min(v, yScale) / yScale) * (yBottom - yTop);

                          // Build live Delhi AQI series from wardHistory
                          const histories = Object.values(wardHistory);
                          const liveAQI = Array.from({ length: N }, (_, i) => {
                            let sum = 0, count = 0;
                            histories.forEach(hist => {
                              const offset = hist.length - N + i;
                              if (offset >= 0 && hist[offset] !== undefined) {
                                sum += hist[offset]; count++;
                              }
                            });
                            return count > 0 ? sum / count : delhiAQI;
                          });

                          const pts26 = liveAQI.map((v, i) => `${outdoorPoints[i].x.toFixed(1)},${toY(v).toFixed(1)}`).join(' ');
                          const lastIdx = N - 1;
                          const lastX = outdoorPoints[lastIdx].x;
                          const lastY = toY(liveAQI[lastIdx]);
                          const lastAQI = liveAQI[lastIdx];

                          return (
                            <>
                              {/* Static National Avg line (white/grey) */}
                              <polyline
                                fill="none"
                                stroke="#777"
                                strokeWidth="2"
                                points={pts.outdoor}
                              />

                              {/* Delhi orange line — live */}
                              <polyline
                                fill="none"
                                stroke="#f89c1d"
                                strokeWidth="2.5"
                                strokeLinejoin="round"
                                strokeLinecap="round"
                                points={pts26}
                                style={{ transition: 'points 0.8s ease' }}
                              />

                              {/* Trailing live dot */}
                              <circle
                                cx={lastX}
                                cy={lastY}
                                r="5"
                                fill="#f89c1d"
                                stroke="#fff"
                                strokeWidth="1.5"
                                style={{ transition: 'cx 0.8s ease, cy 0.8s ease' }}
                              />

                              {/* Live tooltip bubble above trailing dot (only shown if not hovering elsewhere) */}
                              {chartHoverIndex === null && (
                                <>
                                  <rect x={lastX - 38} y={lastY - 30} width={76} height={22} rx="4" fill="#1a1a1a" opacity="0.9" />
                                  <text x={lastX} y={lastY - 14} fill="#fff" fontSize="11" fontWeight="700" textAnchor="middle">
                                    {Math.round(lastAQI)} AQI
                                  </text>
                                </>
                              )}

                              {/* ── Interactive Hover elements ── */}
                              {chartHoverIndex !== null && chartHoverIndex < N && (
                                <>
                                  {/* Vertical crosshair line */}
                                  <line
                                    x1={outdoorPoints[chartHoverIndex].x}
                                    x2={outdoorPoints[chartHoverIndex].x}
                                    y1={yTop}
                                    y2={yBottom}
                                    stroke="rgba(248, 156, 29, 0.4)"
                                    strokeWidth="1.5"
                                    strokeDasharray="4,4"
                                    pointerEvents="none"
                                  />

                                  {/* Highlight dot on National Avg */}
                                  <circle
                                    cx={outdoorPoints[chartHoverIndex].x}
                                    cy={outdoorPoints[chartHoverIndex].y}
                                    r="6"
                                    fill="#777"
                                    stroke="#fff"
                                    strokeWidth="2"
                                    pointerEvents="none"
                                  />

                                  {/* Highlight dot on Delhi Avg */}
                                  <circle
                                    cx={outdoorPoints[chartHoverIndex].x}
                                    cy={toY(liveAQI[chartHoverIndex])}
                                    r="6"
                                    fill="#f89c1d"
                                    stroke="#fff"
                                    strokeWidth="2"
                                    pointerEvents="none"
                                  />

                                  {/* Floating Tooltip box */}
                                  {(() => {
                                    const hX = outdoorPoints[chartHoverIndex].x;
                                    const hY = Math.min(toY(liveAQI[chartHoverIndex]), outdoorPoints[chartHoverIndex].y) - 45;
                                    const tooltipX = Math.max(75, Math.min(hX, 785));
                                    const tooltipY = Math.max(30, hY);
                                    
                                    // Calculate approx national value from Y coord
                                    const natValue = Math.round(250 * (yBottom - outdoorPoints[chartHoverIndex].y) / (yBottom - yTop));

                                    return (
                                      <g transform={`translate(${tooltipX}, ${tooltipY})`} pointerEvents="none" style={{ transition: 'transform 0.1s ease' }}>
                                        <rect x="-65" y="-36" width="130" height="42" rx="6" fill="#1e1e24" stroke="#f89c1d" strokeWidth="1.5" filter="url(#nShadow)" />
                                        <text x="0" y="-22" fill="#fff" fontSize="10" fontWeight="800" textAnchor="middle">
                                          Delhi: {Math.round(liveAQI[chartHoverIndex])} AQI
                                        </text>
                                        <text x="0" y="-8" fill="#aaa" fontSize="9" fontWeight="700" textAnchor="middle">
                                          National: {natValue} AQI
                                        </text>
                                      </g>
                                    );
                                  })()}
                                </>
                              )}

                              {/* Hover detection zones */}
                              {outdoorPoints.map((pt, idx) => {
                                // Calculate hover boundary width
                                const width = idx === 0 ? 32 : (outdoorPoints[idx].x - outdoorPoints[idx - 1].x);
                                const x = pt.x - width / 2;
                                return (
                                  <rect
                                    key={idx}
                                    x={x}
                                    y={yTop}
                                    width={width}
                                    height={yBottom - yTop}
                                    fill="transparent"
                                    style={{ cursor: 'crosshair' }}
                                    onMouseEnter={() => setChartHoverIndex(idx)}
                                    onMouseLeave={() => setChartHoverIndex(null)}
                                  />
                                );
                              })}
                            </>
                          );
                        })()}

                        {/* X-axis labels */}
                        <text x="42" y="205" fill="#555" fontSize="9" textAnchor="middle">1</text>
                        <text x="74" y="205" fill="#555" fontSize="9" textAnchor="middle">2</text>
                        <text x="106" y="205" fill="#555" fontSize="9" textAnchor="middle">3</text>
                        <text x="138" y="205" fill="#555" fontSize="9" textAnchor="middle">4</text>
                        <text x="170" y="205" fill="#555" fontSize="9" textAnchor="middle">5</text>
                        <text x="202" y="205" fill="#555" fontSize="9" textAnchor="middle">6</text>
                        <text x="234" y="205" fill="#555" fontSize="9" textAnchor="middle">7</text>
                        <text x="266" y="205" fill="#555" fontSize="9" textAnchor="middle">8</text>
                        <text x="298" y="205" fill="#555" fontSize="9" textAnchor="middle">9</text>
                        <text x="330" y="205" fill="#555" fontSize="9" textAnchor="middle">10</text>
                        <text x="362" y="205" fill="#555" fontSize="9" textAnchor="middle">11</text>
                        <text x="394" y="205" fill="#555" fontSize="9" textAnchor="middle">12</text>
                        <text x="426" y="205" fill="#555" fontSize="9" textAnchor="middle">13</text>
                        <text x="458" y="205" fill="#555" fontSize="9" textAnchor="middle">14</text>
                        <text x="490" y="205" fill="#555" fontSize="9" textAnchor="middle">15</text>
                        <text x="522" y="205" fill="#555" fontSize="9" textAnchor="middle">16</text>
                        <text x="554" y="205" fill="#555" fontSize="9" textAnchor="middle">17</text>
                        <text x="586" y="205" fill="#555" fontSize="9" textAnchor="middle">18</text>
                        <text x="618" y="205" fill="#555" fontSize="9" textAnchor="middle">19</text>
                        <text x="650" y="205" fill="#555" fontSize="9" textAnchor="middle">20</text>
                        <text x="682" y="205" fill="#555" fontSize="9" textAnchor="middle">21</text>
                        <text x="714" y="205" fill="#555" fontSize="9" textAnchor="middle">22</text>
                        <text x="746" y="205" fill="#555" fontSize="9" textAnchor="middle">23</text>
                        <text x="778" y="205" fill="#555" fontSize="9" textAnchor="middle">24</text>
                        <text x="810" y="205" fill="#555" fontSize="9" textAnchor="middle">25</text>
                        <text x="840" y="205" fill="#555" fontSize="9" textAnchor="middle">26</text>
                      </svg>
                    </div>
                  </div>

                  {/* ROOM GRID (Watchlist Style) */}
                  <div className="room-grid">
                    {WARDS.map((w, idx) => {
                      const tKey = `Ward-${idx + 1}`;
                      const pmVal = telemetry[tKey]?.PM25 || 12;
                      const co2Val = telemetry[tKey]?.CO2 || 400;
                      const aqiVal = calculateAQI(pmVal);

                      const aqiStatus = getAQIStatus(aqiVal);
                      const aqiColor = getAQIColor(aqiVal);

                      // Calculate pollutants dynamically
                      const pm10Val = Math.round(pmVal * 1.6 + 4);
                      const o3Val = Math.round(co2Val * 0.11 + 1);
                      const no2Val = Math.round(co2Val * 0.22 + 2);

                      return (
                        <div key={w.id} className="room-card" style={{ borderRadius: '24px' }} onClick={() => focusWardOnMap(w)}>

                          {/* Top Section */}
                          <div className="room-card-top">
                            <div className="room-card-top-left">
                              <div className="status-badge" style={{ backgroundColor: aqiColor }}>
                                {getAQIIcon(aqiVal, 11)}
                                <span style={{ marginLeft: '4px' }}>{aqiStatus}</span>
                              </div>
                              <h3 className="room-name">{w.name}</h3>
                              <div className="country-row">
                                <span className="flag-emoji">🇮🇳</span>
                                <span className="country-name">India</span>
                              </div>
                            </div>
                            <div className="room-card-top-right">
                              <MiniSpeedometerGauge value={aqiVal} />
                            </div>
                          </div>

                          {/* Pollutants Row */}
                          <div className="pollutants-row">
                            <div className="pollutant-box">
                              <span className="pollutant-label">PM2.5</span>
                              <span className="pollutant-val">{pmVal.toFixed(1)}</span>
                              <span className="pollutant-unit">µg/m³</span>
                            </div>
                            <div className="pollutant-box">
                              <span className="pollutant-label">PM10</span>
                              <span className="pollutant-val">{pm10Val}</span>
                              <span className="pollutant-unit">µg/m³</span>
                            </div>
                            <div className="pollutant-box">
                              <span className="pollutant-label">NO₂</span>
                              <span className="pollutant-val">{no2Val}</span>
                              <span className="pollutant-unit">µg/m³</span>
                            </div>
                            <div className="pollutant-box">
                              <span className="pollutant-label">O₃</span>
                              <span className="pollutant-val">{o3Val}</span>
                              <span className="pollutant-unit">µg/m³</span>
                            </div>
                          </div>

                          {/* Forecast Section */}
                          <div className="room-card-bottom">
                            <div className="forecast-header">
                              <span className="forecast-title">Air Quality Forecast</span>
                            </div>
                            <div className="sparkline-wrapper">
                              <Sparkline data={wardHistory[tKey] || Array(12).fill(aqiVal)} />
                              <div className="sparkline-time-labels">
                                <span>04.00</span>
                                <span>05.00</span>
                                <span>06.00</span>
                                <span>07.00</span>
                                <span>08.00</span>
                                <span>09.00</span>
                              </div>
                            </div>
                          </div>

                        </div>
                      );
                    })}
                  </div>

                  {/* Enforcement dispatches table ledger */}
                  <div className="ledger-card" style={{ borderRadius: '8px' }}>
                    <div className="ledger-title">Closed-loop Enforcement & Action Ledger</div>
                    <div className="action-tbl-container">
                      <table className="action-tbl">
                        <thead>
                          <tr>
                            <th>Dispatch ID</th>
                            <th>Ward Region</th>
                            <th>Source Type</th>
                            <th>Enforcement Directive</th>
                            <th>Assigned Officer</th>
                            <th>Status</th>
                            <th>Mitigation Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {actions.map(act => (
                            <tr key={act.id}>
                              <td style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{act.id}</td>
                              <td>{act.ward_name}</td>
                              <td><span className="badge b-red">{act.source_type}</span></td>
                              <td>{act.description}</td>
                              <td>{act.officer}</td>
                              <td>
                                <span
                                  className={`badge ${act.status === 'Completed' ? '' : 'b-red'}`}
                                  style={act.status === 'Completed' ? { color: '#f89c1d', backgroundColor: 'rgba(248, 156, 29, 0.12)' } : {}}
                                >
                                  {act.status}
                                </span>
                              </td>
                              <td>
                                <button
                                  className={`btn-acc ${act.status === 'Completed' ? 'btn-acc-done' : ''}`}
                                  disabled={act.status === 'Completed'}
                                  onClick={() => executeMitigation(act.id)}
                                  style={act.status === 'Completed' ? { opacity: 0.6, cursor: 'default', background: 'rgba(46,204,113,0.15)', color: '#2ecc71', border: '1px solid #2ecc71' } : {}}
                                >
                                  {act.status === 'Completed' ? '✅ Completed' : 'Execute Action'}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'records' && (
                <HistoricalRecords
                  lightTheme={lightTheme}
                  selectedLocation={selectedLocation}
                  setSelectedLocation={setSelectedLocation}
                />
              )}

              {activeTab === 'map' && (
                <div className="map-container" style={{ borderRadius: '8px' }}>
                  <div ref={mapRef} style={{ width: '100%', height: '100%' }}></div>
                </div>
              )}

              {activeTab === 'regulations' && (
                <div className="chart-card" style={{ borderRadius: '8px' }}>
                  <div className="chart-header">
                    <span className="chart-title">Regulatory Standards Lookup</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                    <input
                      type="text" value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="search-inp" style={{ borderRadius: '8px' }} placeholder="Search guidelines..."
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                    <button className="btn-cyan" style={{ background: '#f89c1d', borderRadius: '8px' }} onClick={handleSearch}>Search</button>
                  </div>
                  <div>
                    {searchResults.map((r, idx) => (
                      <div key={idx} className="cres" style={{ borderRadius: '8px' }}>
                        <div className="cres-id" style={{ color: '#f89c1d' }}>{r.id} // {r.document}</div>
                        <div className="cres-sec">{r.section}</div>
                        <p className="cres-txt">{r.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'national-registry' && (
                <NationalRegistry lightTheme={lightTheme} />
              )}

              {activeTab === 'state-org' && (
                <StateOrg lightTheme={lightTheme} />
              )}

              {activeTab === 'field-officers' && (
                <FieldOfficers lightTheme={lightTheme} actions={actions} telemetry={telemetry} />
              )}

            </div>
          </>
        )}
      </div>

    </div >
  );
}
