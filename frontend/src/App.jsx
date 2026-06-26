import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronLeft, ChevronRight, LayoutGrid, User, Building, Users, MapPin,
  ShieldAlert, Zap, HelpCircle, Activity, Globe, Search, Sliders, Share2, MoreHorizontal, Sun, Moon,
  Wind, Thermometer, Waves, Settings
} from 'lucide-react';
import L from 'leaflet';
import HistoricalRecords, { HISTORICAL_DATA } from './components/HistoricalRecords';
import SpectroscopeAnalysis from './components/SpectroscopeAnalysis';
import NationalRegistry from './components/NationalRegistry';
import StateOrg from './components/StateOrg';
import FieldOfficers from './components/FieldOfficers';
const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
const WS_URL = import.meta.env.VITE_WS_URL || 'ws://127.0.0.1:8000';

const WARDS = [
  { id: 'Ward 1', name: 'Connaught Place', lat: 28.6304, lng: 77.2177, devices: 16 },
  { id: 'Ward 2', name: 'Dwarka Sector 10', lat: 28.5850, lng: 77.0490, devices: 16 },
  { id: 'Ward 3', name: 'Okhla Industrial', lat: 28.5350, lng: 77.2850, devices: 16 },
  { id: 'Ward 4', name: 'Anand Vihar', lat: 28.6470, lng: 77.3150, devices: 16 },
  { id: 'Ward 5', name: 'Punjabi Bagh', lat: 28.6610, lng: 77.1240, devices: 16 },
  { id: 'Ward 6', name: 'Wazirpur Industrial', lat: 28.6990, lng: 77.1680, devices: 16 },
];

function DonutGauge({ value, max = 250, label, status, type = 'pm' }) {
  const radius = 18;
  const circ = 2 * Math.PI * radius;
  const pct = Math.min(Math.max(value / max, 0), 1);

  let color = 'var(--green)';
  if (type === 'pm') {
    if (value > 120) color = '#e74c3c';
    else if (value > 50) color = '#f39c12';
  } else {
    if (value > 520) color = '#e74c3c';
    else if (value > 450) color = '#f39c12';
  }

  return (
    <div className="metric-block">
      <div className="donut">
        <svg viewBox="0 0 44 44">
          <circle cx="22" cy="22" r={radius} fill="none" stroke="#333" strokeWidth="4" />
          <circle
            cx="22" cy="22" r={radius} fill="none"
            stroke={color} strokeWidth="4"
            strokeDasharray={`${pct * circ} ${circ - pct * circ}`}
            strokeLinecap="round" transform="rotate(-90 22 22)"
            style={{ transition: 'stroke-dasharray 0.4s ease' }}
          />
        </svg>
        <div className="donut-val">{Math.round(value)}</div>
      </div>
      <div>
        <div className="metric-label">{label}</div>
        <div className="metric-status" style={{ color }}>{status}</div>
      </div>
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
  const [actions, setActions] = useState([]);
  const [anomalyActive, setAnomalyActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('diesel exhaust');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedActionId, setSelectedActionId] = useState(null);

  const mapRef = useRef(null);
  const mapInst = useRef(null);
  const wsRef = useRef(null);

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

  const executeMitigation = (actionId) => {
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
            <div className="logo-icon">N</div>
            <span className="logo-text">nafas</span>
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
          />
        ) : (
          <>
            {/* TOP BAR */}
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
              <div className="flex gap-2">
                <button className="btn-cyan" style={{ background: '#f89c1d', borderRadius: '8px' }} onClick={injectSpike}>Inject Transport Spike</button>
                <button className="btn-ghost" style={{ borderRadius: '8px' }} onClick={resetSimulation}>Reset Simulation</button>
              </div>
            )}
          </div>

          {activeTab === 'dashboard' && (
            <>
              {/* STAT CARDS */}
              <div className="stat-row">

                {/* Current PM2.5 */}
                <div className="stat-card" style={{ borderRadius: '8px' }}>
                  <div className="stat-header">
                    <div className="stat-icon" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '4px' }}><Activity size={14} /></div>
                    Current PM2.5 Level
                  </div>
                  <div className="pm-row">
                    <div className="pm-badge" style={{ background: '#f89c1d', borderRadius: '8px' }}>
                      <span className="pm-num">{cpPM.toFixed(0)}</span>
                      <span>Ward Avg<br /><span className="pm-unit">µg/m³</span></span>
                    </div>
                  </div>
                </div>

                {/* Today's Average PM2.5 */}
                <div className="stat-card" style={{ borderRadius: '8px' }}>
                  <div className="stat-header">
                    <div className="stat-icon" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '4px' }}><Activity size={14} /></div>
                    Today's Average PM2.5 Levels
                    <span style={{ marginLeft: 'auto', fontSize: '9px', color: '#666', textAlign: 'right' }}>UP TO 11:00AM</span>
                  </div>
                  <div className="pm-row">
                    <div className="pm-badge" style={{ background: '#f89c1d', borderRadius: '8px' }}>
                      <span className="pm-num">12</span>
                      <span>Ward Avg<br /><span className="pm-unit">µg/m³</span></span>
                    </div>
                    <div className="pm-badge pm-badge-purple" style={{ borderRadius: '8px' }}>
                      <span className="pm-num">244</span>
                      <span>National Baseline<br /><span className="pm-unit">µg/m³</span></span>
                    </div>
                  </div>
                </div>

                {/* Power Consumption */}
                <div className="stat-card" style={{ borderRadius: '8px' }}>
                  <div className="stat-header">
                    <div className="stat-icon" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '4px' }}><Zap size={14} /></div>
                    Active Mitigation System Load
                  </div>
                  <div className="power-flex">
                    <div className="power-row">
                      <span className="power-val" style={{ color: '#f89c1d' }}>151.27</span>
                      <span className="power-unit">MWh</span>
                    </div>
                    <button className="details-btn" style={{ borderRadius: '8px' }} onClick={() => setActiveTab('map')}>Details</button>
                  </div>
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

                    {/* Outdoor PM2.5 line */}
                    <polyline
                      fill="none"
                      stroke="#777"
                      strokeWidth="2"
                      points={pts.outdoor}
                    />

                    {/* Indoor PM2.5 line */}
                    <polyline
                      fill="none"
                      stroke="#f89c1d"
                      strokeWidth="2.5"
                      points={pts.indoor}
                    />

                    {/* Tooltip dot */}
                    <circle cx="525" cy="160" r="5" fill="#f89c1d" stroke="#fff" strokeWidth="1.5" />

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

                    {/* Tooltip bubble */}
                    <rect x="500" y="136" width="72" height="22" rx="4" fill="#1a1a1a" />
                    <text x="536" y="151" fill="#fff" fontSize="11" fontWeight="700" textAnchor="middle">{pts.val} µg/m³</text>
                  </svg>
                </div>
              </div>

              {/* ROOM GRID */}
              <div className="room-grid">
                {WARDS.map((w, idx) => {
                  const tKey = `Ward-${idx + 1}`;
                  const pmVal = telemetry[tKey]?.PM25 || 12;
                  const co2Val = telemetry[tKey]?.CO2 || 400;

                  const pmStatus = pmVal > 120 ? 'Hazardous' : pmVal > 50 ? 'Moderate' : 'Good';
                  const co2Status = co2Val > 520 ? 'Critical' : co2Val > 450 ? 'Average' : 'Normal';

                  return (
                    <div key={w.id} className="room-card" style={{ borderRadius: '8px' }} onClick={() => focusWardOnMap(w)}>
                      <div className="room-info">
                        <div className="room-name">{w.name}</div>
                        <div className="room-sub">{w.devices} Monitoring Stations</div>
                      </div>

                      <div className="room-metrics">
                        <DonutGauge
                          value={pmVal} max={250}
                          label="Ward PM 2.5" status={pmStatus}
                          type="pm"
                        />
                        <div className="sep" />
                        <DonutGauge
                          value={co2Val} max={650}
                          label="SO₂ / NO₂" status={co2Status}
                          type="co2"
                        />
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
                            <button className="btn-acc" onClick={() => executeMitigation(act.id)}>
                              Execute Action
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
