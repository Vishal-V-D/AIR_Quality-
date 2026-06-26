import React, { useState } from 'react';
import { Search, Plus, Filter, Activity, Server, MapPin, CheckCircle, ShieldAlert, X, Info } from 'lucide-react';

const INITIAL_STATIONS = [
  { id: 'AQ-DEL-01', name: 'ITO Crossroad', region: 'Delhi NCR', lat: 28.6284, lng: 77.2410, type: 'Laser Particle', status: 'Active', pm25: 145, co2: 520, lastCalibrated: '2026-05-12' },
  { id: 'AQ-DEL-02', name: 'Sanjay Vihar Industrial', region: 'Delhi NCR', lat: 28.6652, lng: 77.3015, type: 'Electrochemical', status: 'Active', pm25: 232, co2: 610, lastCalibrated: '2026-06-01' },
  { id: 'AQ-BOM-01', name: 'Bandra Reclamation', region: 'Maharashtra', lat: 19.0410, lng: 72.8250, type: 'Laser Particle', status: 'Active', pm25: 42, co2: 415, lastCalibrated: '2026-04-18' },
  { id: 'AQ-BOM-02', name: 'Kurla West', region: 'Maharashtra', lat: 19.0712, lng: 72.8821, type: 'UV Absorption', status: 'Maintenance', pm25: 78, co2: 460, lastCalibrated: '2026-03-22' },
  { id: 'AQ-BLR-01', name: 'Silk Board Junction', region: 'Karnataka', lat: 12.9176, lng: 77.6244, type: 'Laser Particle', status: 'Active', pm25: 64, co2: 480, lastCalibrated: '2026-05-20' },
  { id: 'AQ-CCU-01', name: 'Victoria Memorial', region: 'West Bengal', lat: 22.5448, lng: 88.3426, type: 'Electrochemical', status: 'Active', pm25: 55, co2: 440, lastCalibrated: '2026-06-10' },
  { id: 'AQ-MAA-01', name: 'Kathipara Junction', region: 'Tamil Nadu', lat: 13.0074, lng: 80.2057, type: 'Laser Particle', status: 'Calibrating', pm25: 38, co2: 395, lastCalibrated: '2026-06-25' },
];

export default function NationalRegistry({ lightTheme }) {
  const [stations, setStations] = useState(INITIAL_STATIONS);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [regionFilter, setRegionFilter] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedStation, setSelectedStation] = useState(null);

  // New Station Form State
  const [newStation, setNewStation] = useState({
    name: '',
    region: 'Delhi NCR',
    lat: '',
    lng: '',
    type: 'Laser Particle',
    status: 'Active',
    pm25: 35,
    co2: 400
  });

  const handleAddStation = (e) => {
    e.preventDefault();
    if (!newStation.name || !newStation.lat || !newStation.lng) return;

    const newId = `AQ-${newStation.region.slice(0, 3).toUpperCase()}-${Math.floor(10 + Math.random() * 90)}`;
    const createdStation = {
      ...newStation,
      id: newId,
      lat: parseFloat(newStation.lat),
      lng: parseFloat(newStation.lng),
      pm25: parseInt(newStation.pm25),
      co2: parseInt(newStation.co2),
      lastCalibrated: new Date().toISOString().split('T')[0]
    };

    setStations([createdStation, ...stations]);
    setShowAddModal(false);
    setNewStation({
      name: '',
      region: 'Delhi NCR',
      lat: '',
      lng: '',
      type: 'Laser Particle',
      status: 'Active',
      pm25: 35,
      co2: 400
    });
  };

  const filteredStations = stations.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) || 
                          s.id.toLowerCase().includes(search.toLowerCase()) ||
                          s.region.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'All' || s.status === statusFilter;
    const matchesRegion = regionFilter === 'All' || s.region === regionFilter;
    return matchesSearch && matchesStatus && matchesRegion;
  });

  const regions = ['All', ...new Set(stations.map(s => s.region))];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '100%', overflowY: 'auto' }}>
      
      {/* HEADER SECTION */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', letterSpacing: '-0.02em', margin: 0 }}>
            National Air Quality Monitoring Registry
          </h1>
          <p style={{ color: lightTheme ? '#64748b' : '#9ca3af', fontSize: '12.5px', marginTop: '4px' }}>
            Central directory and state-by-state listing of certified telemetric monitoring systems.
          </p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          style={{
            background: '#f89c1d',
            color: '#000',
            fontWeight: '700',
            fontSize: '12.5px',
            padding: '10px 18px',
            borderRadius: '8px',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(248, 156, 29, 0.2)',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
        >
          <Plus size={16} /> Register Monitor
        </button>
      </div>

      {/* METRICS ROW */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
        {[
          { label: 'Active Registries', value: stations.filter(s => s.status === 'Active').length, sub: 'Live streaming telemetry', icon: <Activity size={16} color="#f89c1d" /> },
          { label: 'Nationwide Stations', value: stations.length, sub: 'Total hardware points', icon: <Server size={16} color="#3498db" /> },
          { label: 'State Coverage', value: regions.length - 1, sub: 'Provinces connected', icon: <MapPin size={16} color="#2ecc71" /> },
          { label: 'Calibration Compliance', value: '92.4%', sub: 'Within 90-day cycle', icon: <CheckCircle size={16} color="#9b59b6" /> }
        ].map((m, i) => (
          <div 
            key={i} 
            style={{
              background: lightTheme ? '#ffffff' : 'rgba(17, 24, 39, 0.85)',
              borderRadius: '12px',
              padding: '16px',
              border: `1px solid ${lightTheme ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <div style={{ fontSize: '11px', color: lightTheme ? '#64748b' : '#9ca3af', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.04em' }}>
                {m.label}
              </div>
              <div style={{ fontSize: '26px', fontWeight: '800', margin: '4px 0 2px', color: lightTheme ? '#0f172a' : '#f3f4f6' }}>
                {m.value}
              </div>
              <div style={{ fontSize: '10px', color: lightTheme ? '#94a3b8' : '#6b7280' }}>
                {m.sub}
              </div>
            </div>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '8px',
              background: lightTheme ? '#f1f5f9' : 'rgba(255,255,255,0.04)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {m.icon}
            </div>
          </div>
        ))}
      </div>

      {/* FILTER & LEDGER BODY */}
      <div 
        style={{
          background: lightTheme ? '#ffffff' : 'rgba(17, 24, 39, 0.85)',
          borderRadius: '16px',
          border: `1px solid ${lightTheme ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'}`,
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}
      >
        {/* FILTERS TOOLBAR */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
            <Search 
              size={15} 
              style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} 
            />
            <input 
              type="text" 
              placeholder="Search station ID, name, or city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                background: lightTheme ? '#f1f5f9' : 'rgba(0, 0, 0, 0.25)',
                border: `1px solid ${lightTheme ? '#e2e8f0' : 'rgba(255,255,255,0.08)'}`,
                borderRadius: '8px',
                padding: '10px 12px 10px 36px',
                color: lightTheme ? '#0f172a' : '#f3f4f6',
                fontSize: '12.5px',
                fontFamily: 'inherit',
                outline: 'none'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: lightTheme ? '#64748b' : '#9ca3af', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Filter size={12} /> Status:
            </span>
            {['All', 'Active', 'Maintenance', 'Calibrating'].map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                style={{
                  background: statusFilter === s ? (lightTheme ? '#1e293b' : '#1f2937') : 'transparent',
                  color: statusFilter === s ? '#ffffff' : (lightTheme ? '#64748b' : '#9ca3af'),
                  border: `1px solid ${statusFilter === s ? 'transparent' : (lightTheme ? '#e2e8f0' : 'rgba(255,255,255,0.08)')}`,
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '6px 12px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
              >
                {s}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginLeft: 'auto' }}>
            <span style={{ fontSize: '11px', color: lightTheme ? '#64748b' : '#9ca3af' }}>Region:</span>
            <select
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
              style={{
                background: lightTheme ? '#f1f5f9' : 'rgba(0, 0, 0, 0.25)',
                color: lightTheme ? '#0f172a' : '#f3f4f6',
                border: `1px solid ${lightTheme ? '#e2e8f0' : 'rgba(255,255,255,0.08)'}`,
                borderRadius: '6px',
                fontSize: '11px',
                padding: '6px 10px',
                outline: 'none',
                fontFamily: 'inherit'
              }}
            >
              {regions.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
        </div>

        {/* REGISTRY TABLE */}
        <div style={{ overflowX: 'auto' }}>
          <table className="action-tbl" style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${lightTheme ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'}` }}>
                <th style={{ padding: '12px 16px', fontSize: '10px' }}>Station ID</th>
                <th style={{ padding: '12px 16px', fontSize: '10px' }}>Station Name</th>
                <th style={{ padding: '12px 16px', fontSize: '10px' }}>Region / State</th>
                <th style={{ padding: '12px 16px', fontSize: '10px' }}>Technology Type</th>
                <th style={{ padding: '12px 16px', fontSize: '10px' }}>PM2.5 (µg/m³)</th>
                <th style={{ padding: '12px 16px', fontSize: '10px' }}>Last Calibrated</th>
                <th style={{ padding: '12px 16px', fontSize: '10px' }}>Status</th>
                <th style={{ padding: '12px 16px', fontSize: '10px', textAlign: 'center' }}>Details</th>
              </tr>
            </thead>
            <tbody>
              {filteredStations.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '30px', color: lightTheme ? '#64748b' : '#9ca3af' }}>
                    No registered stations found matching the filters.
                  </td>
                </tr>
              ) : (
                filteredStations.map(s => {
                  let pmColor = '#2ecc71';
                  if (s.pm25 > 120) pmColor = '#ef4444';
                  else if (s.pm25 > 50) pmColor = '#f59e0b';

                  let statusColor = '#2ecc71';
                  let statusBg = 'rgba(46, 204, 113, 0.12)';
                  if (s.status === 'Maintenance') {
                    statusColor = '#f59e0b';
                    statusBg = 'rgba(245, 158, 11, 0.12)';
                  } else if (s.status === 'Calibrating') {
                    statusColor = '#9b59b6';
                    statusBg = 'rgba(155, 89, 182, 0.12)';
                  }

                  return (
                    <tr 
                      key={s.id} 
                      style={{ borderBottom: `1px solid ${lightTheme ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)'}` }}
                    >
                      <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontWeight: 'bold' }}>{s.id}</td>
                      <td style={{ padding: '12px 16px', fontWeight: '500' }}>{s.name}</td>
                      <td style={{ padding: '12px 16px', color: lightTheme ? '#64748b' : '#9ca3af' }}>{s.region}</td>
                      <td style={{ padding: '12px 16px' }}>{s.type}</td>
                      <td style={{ padding: '12px 16px', fontWeight: '700', color: pmColor }}>
                        {s.pm25} <span style={{ fontSize: '9px', fontWeight: '400', color: lightTheme ? '#94a3b8' : '#6b7280' }}>µg/m³</span>
                      </td>
                      <td style={{ padding: '12px 16px', color: lightTheme ? '#64748b' : '#9ca3af' }}>{s.lastCalibrated}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span 
                          style={{
                            color: statusColor,
                            background: statusBg,
                            padding: '4px 8px',
                            borderRadius: '6px',
                            fontWeight: '700',
                            fontSize: '10px',
                            textTransform: 'uppercase'
                          }}
                        >
                          {s.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <button
                          onClick={() => setSelectedStation(s)}
                          style={{
                            background: lightTheme ? '#e2e8f0' : 'rgba(255,255,255,0.06)',
                            color: lightTheme ? '#0f172a' : '#f3f4f6',
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.15s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#f89c1d'}
                          onMouseLeave={(e) => e.currentTarget.style.background = lightTheme ? '#e2e8f0' : 'rgba(255,255,255,0.06)'}
                        >
                          View Stats
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* REGISTER STATION MODAL */}
      {showAddModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
        }}>
          <div style={{
            background: lightTheme ? '#ffffff' : '#1f2937',
            width: '450px',
            borderRadius: '16px',
            border: `1px solid ${lightTheme ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'}`,
            padding: '24px',
            boxShadow: '0 20px 45px rgba(0,0,0,0.3)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '800', margin: 0 }}>Register Telemetric Station</h2>
              <button 
                onClick={() => setShowAddModal(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: lightTheme ? '#64748b' : '#9ca3af' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddStation} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '700', color: lightTheme ? '#64748b' : '#9ca3af', display: 'block', marginBottom: '4px' }}>
                  STATION NAME
                </label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Anand Vihar Depot"
                  value={newStation.name}
                  onChange={(e) => setNewStation({ ...newStation, name: e.target.value })}
                  style={{
                    width: '100%',
                    background: lightTheme ? '#f1f5f9' : 'rgba(0,0,0,0.2)',
                    border: `1px solid ${lightTheme ? '#cbd5e1' : 'rgba(255,255,255,0.08)'}`,
                    borderRadius: '8px',
                    padding: '8px 12px',
                    color: lightTheme ? '#0f172a' : '#f3f4f6',
                    fontFamily: 'inherit',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: lightTheme ? '#64748b' : '#9ca3af', display: 'block', marginBottom: '4px' }}>
                    REGION / STATE
                  </label>
                  <select
                    value={newStation.region}
                    onChange={(e) => setNewStation({ ...newStation, region: e.target.value })}
                    style={{
                      width: '100%',
                      background: lightTheme ? '#f1f5f9' : 'rgba(0,0,0,0.2)',
                      border: `1px solid ${lightTheme ? '#cbd5e1' : 'rgba(255,255,255,0.08)'}`,
                      borderRadius: '8px',
                      padding: '8px 12px',
                      color: lightTheme ? '#0f172a' : '#f3f4f6',
                      fontFamily: 'inherit',
                      outline: 'none'
                    }}
                  >
                    <option value="Delhi NCR">Delhi NCR</option>
                    <option value="Maharashtra">Maharashtra</option>
                    <option value="Karnataka">Karnataka</option>
                    <option value="West Bengal">West Bengal</option>
                    <option value="Tamil Nadu">Tamil Nadu</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: lightTheme ? '#64748b' : '#9ca3af', display: 'block', marginBottom: '4px' }}>
                    SENSOR TECHNOLOGY
                  </label>
                  <select
                    value={newStation.type}
                    onChange={(e) => setNewStation({ ...newStation, type: e.target.value })}
                    style={{
                      width: '100%',
                      background: lightTheme ? '#f1f5f9' : 'rgba(0,0,0,0.2)',
                      border: `1px solid ${lightTheme ? '#cbd5e1' : 'rgba(255,255,255,0.08)'}`,
                      borderRadius: '8px',
                      padding: '8px 12px',
                      color: lightTheme ? '#0f172a' : '#f3f4f6',
                      fontFamily: 'inherit',
                      outline: 'none'
                    }}
                  >
                    <option value="Laser Particle">Laser Particle (PM)</option>
                    <option value="Electrochemical">Electrochemical (Gaseous)</option>
                    <option value="UV Absorption">UV Absorption (O3/SO2)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: lightTheme ? '#64748b' : '#9ca3af', display: 'block', marginBottom: '4px' }}>
                    GPS LATITUDE
                  </label>
                  <input 
                    type="number" 
                    step="0.0001"
                    required
                    placeholder="28.6139"
                    value={newStation.lat}
                    onChange={(e) => setNewStation({ ...newStation, lat: e.target.value })}
                    style={{
                      width: '100%',
                      background: lightTheme ? '#f1f5f9' : 'rgba(0,0,0,0.2)',
                      border: `1px solid ${lightTheme ? '#cbd5e1' : 'rgba(255,255,255,0.08)'}`,
                      borderRadius: '8px',
                      padding: '8px 12px',
                      color: lightTheme ? '#0f172a' : '#f3f4f6',
                      fontFamily: 'inherit',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: lightTheme ? '#64748b' : '#9ca3af', display: 'block', marginBottom: '4px' }}>
                    GPS LONGITUDE
                  </label>
                  <input 
                    type="number" 
                    step="0.0001"
                    required
                    placeholder="77.2090"
                    value={newStation.lng}
                    onChange={(e) => setNewStation({ ...newStation, lng: e.target.value })}
                    style={{
                      width: '100%',
                      background: lightTheme ? '#f1f5f9' : 'rgba(0,0,0,0.2)',
                      border: `1px solid ${lightTheme ? '#cbd5e1' : 'rgba(255,255,255,0.08)'}`,
                      borderRadius: '8px',
                      padding: '8px 12px',
                      color: lightTheme ? '#0f172a' : '#f3f4f6',
                      fontFamily: 'inherit',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: lightTheme ? '#64748b' : '#9ca3af', display: 'block', marginBottom: '4px' }}>
                    INITIAL PM2.5 (µg/m³)
                  </label>
                  <input 
                    type="number" 
                    value={newStation.pm25}
                    onChange={(e) => setNewStation({ ...newStation, pm25: e.target.value })}
                    style={{
                      width: '100%',
                      background: lightTheme ? '#f1f5f9' : 'rgba(0,0,0,0.2)',
                      border: `1px solid ${lightTheme ? '#cbd5e1' : 'rgba(255,255,255,0.08)'}`,
                      borderRadius: '8px',
                      padding: '8px 12px',
                      color: lightTheme ? '#0f172a' : '#f3f4f6',
                      fontFamily: 'inherit',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: lightTheme ? '#64748b' : '#9ca3af', display: 'block', marginBottom: '4px' }}>
                    INITIAL SO2/NO2 (ppm)
                  </label>
                  <input 
                    type="number" 
                    value={newStation.co2}
                    onChange={(e) => setNewStation({ ...newStation, co2: e.target.value })}
                    style={{
                      width: '100%',
                      background: lightTheme ? '#f1f5f9' : 'rgba(0,0,0,0.2)',
                      border: `1px solid ${lightTheme ? '#cbd5e1' : 'rgba(255,255,255,0.08)'}`,
                      borderRadius: '8px',
                      padding: '8px 12px',
                      color: lightTheme ? '#0f172a' : '#f3f4f6',
                      fontFamily: 'inherit',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{
                    flex: 1,
                    background: 'transparent',
                    color: lightTheme ? '#0f172a' : '#f3f4f6',
                    border: `1px solid ${lightTheme ? '#cbd5e1' : 'rgba(255,255,255,0.1)'}`,
                    borderRadius: '8px',
                    padding: '10px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    background: '#f89c1d',
                    color: '#000',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '10px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Save Station
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW STATION DETAILS MODAL */}
      {selectedStation && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
        }}>
          <div style={{
            background: lightTheme ? '#ffffff' : '#1f2937',
            width: '500px',
            borderRadius: '16px',
            border: `1px solid ${lightTheme ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'}`,
            padding: '24px',
            boxShadow: '0 20px 45px rgba(0,0,0,0.3)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '10px', fontFamily: 'monospace', color: '#f89c1d', fontWeight: 'bold' }}>
                  {selectedStation.id}
                </span>
                <h2 style={{ fontSize: '18px', fontWeight: '800', margin: '2px 0 0' }}>{selectedStation.name}</h2>
              </div>
              <button 
                onClick={() => setSelectedStation(null)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: lightTheme ? '#64748b' : '#9ca3af' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', background: lightTheme ? '#f8fafc' : 'rgba(0,0,0,0.15)', padding: '14px', borderRadius: '12px' }}>
              <div>
                <div style={{ fontSize: '10px', color: lightTheme ? '#64748b' : '#9ca3af', fontWeight: '600' }}>REGION</div>
                <div style={{ fontSize: '13px', fontWeight: '700', marginTop: '2px' }}>{selectedStation.region}</div>
              </div>
              <div>
                <div style={{ fontSize: '10px', color: lightTheme ? '#64748b' : '#9ca3af', fontWeight: '600' }}>TECHNOLOGY</div>
                <div style={{ fontSize: '13px', fontWeight: '700', marginTop: '2px' }}>{selectedStation.type}</div>
              </div>
              <div style={{ marginTop: '8px' }}>
                <div style={{ fontSize: '10px', color: lightTheme ? '#64748b' : '#9ca3af', fontWeight: '600' }}>GPS LATITUDE</div>
                <div style={{ fontSize: '13px', fontWeight: '700', marginTop: '2px', fontFamily: 'monospace' }}>{selectedStation.lat.toFixed(4)}</div>
              </div>
              <div style={{ marginTop: '8px' }}>
                <div style={{ fontSize: '10px', color: lightTheme ? '#64748b' : '#9ca3af', fontWeight: '600' }}>GPS LONGITUDE</div>
                <div style={{ fontSize: '13px', fontWeight: '700', marginTop: '2px', fontFamily: 'monospace' }}>{selectedStation.lng.toFixed(4)}</div>
              </div>
            </div>

            {/* LIVE SENSOR READOUTS */}
            <div>
              <h3 style={{ fontSize: '12px', fontWeight: '700', color: lightTheme ? '#64748b' : '#9ca3af', marginBottom: '8px', letterSpacing: '0.04em' }}>
                LIVE TRANSMISSION READOUT
              </h3>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{
                  flex: 1, padding: '12px', borderRadius: '10px', background: 'rgba(248, 156, 29, 0.08)',
                  border: '1px solid rgba(248, 156, 29, 0.2)', display: 'flex', flexDirection: 'column', alignItems: 'center'
                }}>
                  <div style={{ fontSize: '10px', fontWeight: '700', color: '#f89c1d' }}>PM2.5 DENSITY</div>
                  <div style={{ fontSize: '24px', fontWeight: '800', color: '#f89c1d', margin: '4px 0' }}>{selectedStation.pm25}</div>
                  <div style={{ fontSize: '8.5px', color: lightTheme ? '#64748b' : '#9ca3af' }}>micrograms / m³</div>
                </div>

                <div style={{
                  flex: 1, padding: '12px', borderRadius: '10px', background: 'rgba(52, 152, 219, 0.08)',
                  border: '1px solid rgba(52, 152, 219, 0.2)', display: 'flex', flexDirection: 'column', alignItems: 'center'
                }}>
                  <div style={{ fontSize: '10px', fontWeight: '700', color: '#3498db' }}>SO₂ / NO₂ LEVEL</div>
                  <div style={{ fontSize: '24px', fontWeight: '800', color: '#3498db', margin: '4px 0' }}>{selectedStation.co2}</div>
                  <div style={{ fontSize: '8.5px', color: lightTheme ? '#64748b' : '#9ca3af' }}>parts per million</div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', background: lightTheme ? '#f1f5f9' : 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '8px' }}>
              <Info size={14} style={{ color: '#f89c1d', flexShrink: 0, marginTop: '1px' }} />
              <p style={{ fontSize: '10px', margin: 0, color: lightTheme ? '#64748b' : '#9ca3af', lineHeight: 1.4 }}>
                This station operates under strict calibration standards. The last calibration cycle was completed on <strong>{selectedStation.lastCalibrated}</strong>. The next scheduled inspection audit is due in 34 days.
              </p>
            </div>

            <button
              onClick={() => setSelectedStation(null)}
              style={{
                background: '#f89c1d',
                color: '#000',
                fontWeight: '700',
                border: 'none',
                padding: '10px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              Acknowledge Audit
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
