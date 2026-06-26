import React, { useState, useEffect } from 'react';
import { Users, User, Shield, MapPin, Send, CheckCircle, Navigation, Clock, Activity, AlertTriangle, Check } from 'lucide-react';

const INITIAL_OFFICERS = [
  { id: 'OFF-01', name: 'Officer A. Banerjee', rank: 'Field Auditor', ward: 'Dwarka Sector 10', status: 'On Patrol', gps: '28.5855, 77.0495', activeAction: 'None', completed: 18, responseTime: '22m', citations: 4 },
  { id: 'OFF-02', name: 'Inspector K. Dahiya', rank: 'Senior Compliance Inspector', ward: 'Anand Vihar', status: 'Inspecting', gps: '28.6472, 77.3155', activeAction: 'ACT-101', completed: 25, responseTime: '15m', citations: 9 },
  { id: 'OFF-03', name: 'Deputy Commissioner R. Negi', rank: 'District Supervisor', ward: 'Connaught Place', status: 'On Patrol', gps: '28.6308, 77.2182', activeAction: 'None', completed: 32, responseTime: '18m', citations: 12 },
  { id: 'OFF-04', name: 'Inspector V. Chauhan', rank: 'Compliance Officer', ward: 'Okhla Industrial', status: 'Inspecting', gps: '28.5355, 77.2845', activeAction: 'ACT-102', completed: 14, responseTime: '28m', citations: 3 },
  { id: 'OFF-05', name: 'Officer S. Malhotra', rank: 'Auditor Trainee', ward: 'Punjabi Bagh', status: 'Off Duty', gps: 'N/A', activeAction: 'None', completed: 8, responseTime: '34m', citations: 1 },
];

const WARD_DIRECIVES = {
  'Ward 1': { name: 'Connaught Place', directive: 'Enforce commercial diesel generator limits and verify wet-suppression logs.', source: 'Commercial Generators' },
  'Ward 2': { name: 'Dwarka Sector 10', directive: 'Audit expressway excavation site, verify dust mitigation screens and water mist layouts.', source: 'Construction Dust' },
  'Ward 3': { name: 'Okhla Industrial', directive: 'Inspect metal casting plant stacks, audit gas scrubber compliance and damper locks.', source: 'Industrial Emissions' },
  'Ward 4': { name: 'Anand Vihar', directive: 'Divert heavy cargo transit trucks, verify fuel compliance BS-VI standards.', source: 'Diesel Transport' },
  'Ward 5': { name: 'Punjabi Bagh', directive: 'Verify construction permit screens and inspect flyover site sweep logs.', source: 'Construction Dust' },
  'Ward 6': { name: 'Wazirpur Industrial', directive: 'Audit steel scrap smelting pickling units, inspect exhaust hoods and seal dampers.', source: 'Industrial Emissions' },
};

export default function FieldOfficers({ lightTheme, actions, telemetry }) {
  const [officers, setOfficers] = useState(INITIAL_OFFICERS);
  const [localDispatches, setLocalDispatches] = useState([]);
  const [selectedWard, setSelectedWard] = useState('Ward 4'); // Default Anand Vihar
  const [selectedOfficerId, setSelectedOfficerId] = useState('OFF-01');
  const [customDirective, setCustomDirective] = useState('');
  const [dispatchStatusMsg, setDispatchStatusMsg] = useState('');

  const activeDirective = WARD_DIRECIVES[selectedWard];

  useEffect(() => {
    if (activeDirective) {
      setCustomDirective(activeDirective.directive);
    }
  }, [selectedWard]);

  const handleDispatch = (e) => {
    e.preventDefault();
    const officer = officers.find(o => o.id === selectedOfficerId);
    if (!officer) return;

    if (officer.status === 'Off Duty') {
      setDispatchStatusMsg(`⚠️ Cannot dispatch ${officer.name} - Officer is currently Off Duty.`);
      setTimeout(() => setDispatchStatusMsg(''), 4000);
      return;
    }

    const newDispatchId = `ACT-${Math.floor(200 + Math.random() * 800)}`;
    
    // Add local dispatch
    const dispatchRecord = {
      id: newDispatchId,
      officer: officer.name,
      ward: activeDirective.name,
      source: activeDirective.source,
      directive: customDirective,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'Dispatched'
    };

    setLocalDispatches([dispatchRecord, ...localDispatches]);

    // Update officer status
    setOfficers(prev => prev.map(o => {
      if (o.id === officer.id) {
        return {
          ...o,
          status: 'Inspecting',
          ward: activeDirective.name,
          activeAction: newDispatchId
        };
      }
      return o;
    }));

    setDispatchStatusMsg(`✅ Dispatched ${officer.name} to ${activeDirective.name} successfully!`);
    setTimeout(() => setDispatchStatusMsg(''), 4000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '100%', overflowY: 'auto' }}>
      
      {/* HEADER */}
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: '800', letterSpacing: '-0.02em', margin: 0 }}>
          Field Officer Dispatch Command
        </h1>
        <p style={{ color: lightTheme ? '#64748b' : '#9ca3af', fontSize: '12.5px', marginTop: '4px' }}>
          Real-time human-in-the-loop tracking, patrol status, and enforcement action dispatch.
        </p>
      </div>

      {/* STATISTICS OVERVIEW */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
        {[
          { label: 'Deployed Patrols', value: officers.filter(o => o.status === 'On Patrol').length, sub: 'Active vehicle patrols', icon: <Navigation size={16} color="#3498db" /> },
          { label: 'Inspections In Progress', value: officers.filter(o => o.status === 'Inspecting').length, sub: 'Target site audits', icon: <Activity size={16} color="#ef4444" /> },
          { label: 'Avg Patrol Response Time', value: '18 min', sub: 'Target compliance benchmark', icon: <Clock size={16} color="#f89c1d" /> },
          { label: 'Total Audited Actions', value: officers.reduce((acc, curr) => acc + curr.completed, 0), sub: 'Actions closed-loop', icon: <CheckCircle size={16} color="#2ecc71" /> }
        ].map((m, i) => (
          <div 
            key={i}
            style={{
              background: lightTheme ? '#ffffff' : 'rgba(17, 24, 39, 0.85)',
              borderRadius: '12px', padding: '16px',
              border: `1px solid ${lightTheme ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between'
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
              width: '38px', height: '38px', borderRadius: '8px',
              background: lightTheme ? '#f1f5f9' : 'rgba(255,255,255,0.04)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              {m.icon}
            </div>
          </div>
        ))}
      </div>

      {/* DISPATCH LAYOUT */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '14px' }}>
        
        {/* FIELD OFFICERS DIRECTORY */}
        <div style={{
          background: lightTheme ? '#ffffff' : 'rgba(17, 24, 39, 0.85)',
          borderRadius: '16px', border: `1px solid ${lightTheme ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'}`,
          padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Users size={18} color="#f89c1d" />
            <h2 style={{ fontSize: '15px', fontWeight: '700', margin: 0 }}>Enforcement Inspectorate Directory</h2>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="action-tbl" style={{ borderCollapse: 'collapse', width: '100%' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${lightTheme ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'}` }}>
                  <th style={{ padding: '10px', fontSize: '9.5px' }}>Officer</th>
                  <th style={{ padding: '10px', fontSize: '9.5px' }}>Rank</th>
                  <th style={{ padding: '10px', fontSize: '9.5px' }}>Sector / Ward</th>
                  <th style={{ padding: '10px', fontSize: '9.5px' }}>Status</th>
                  <th style={{ padding: '10px', fontSize: '9.5px' }}>GPS</th>
                  <th style={{ padding: '10px', fontSize: '9.5px', textAlign: 'center' }}>Closed Audits</th>
                  <th style={{ padding: '10px', fontSize: '9.5px', textAlign: 'center' }}>Citations</th>
                </tr>
              </thead>
              <tbody>
                {officers.map(o => {
                  let statusColor = '#2ecc71';
                  let statusBg = 'rgba(46, 204, 113, 0.12)';
                  if (o.status === 'Inspecting') {
                    statusColor = '#ef4444';
                    statusBg = 'rgba(239, 68, 68, 0.12)';
                  } else if (o.status === 'Off Duty') {
                    statusColor = '#94a3b8';
                    statusBg = 'rgba(148, 163, 184, 0.12)';
                  }

                  return (
                    <tr 
                      key={o.id}
                      style={{ borderBottom: `1px solid ${lightTheme ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)'}` }}
                    >
                      <td style={{ padding: '10px', fontWeight: '600' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{
                            width: '28px', height: '28px', borderRadius: '50%',
                            background: lightTheme ? '#f1f5f9' : 'rgba(255,255,255,0.04)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                          }}>
                            <User size={14} color={lightTheme ? '#0f172a' : '#f3f4f6'} />
                          </div>
                          <div>
                            <div style={{ fontSize: '11.5px', fontWeight: 700 }}>{o.name}</div>
                            <div style={{ fontSize: '9.5px', color: lightTheme ? '#64748b' : '#9ca3af', fontFamily: 'monospace' }}>{o.id}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '10px', fontSize: '11px', color: lightTheme ? '#64748b' : '#9ca3af' }}>{o.rank}</td>
                      <td style={{ padding: '10px', fontSize: '11.5px', fontWeight: 500 }}>{o.ward}</td>
                      <td style={{ padding: '10px' }}>
                        <span 
                          style={{
                            color: statusColor, background: statusBg,
                            padding: '4px 8px', borderRadius: '6px',
                            fontWeight: '700', fontSize: '9.5px', textTransform: 'uppercase'
                          }}
                        >
                          {o.status}
                        </span>
                      </td>
                      <td style={{ padding: '10px', fontSize: '10.5px', fontFamily: 'monospace' }}>{o.gps}</td>
                      <td style={{ padding: '10px', textAlign: 'center', fontWeight: 'bold' }}>{o.completed}</td>
                      <td style={{ padding: '10px', textAlign: 'center', color: '#f89c1d', fontWeight: 'bold' }}>{o.citations}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* HUMAN-IN-THE-LOOP ACTIVE DISPATCH CONTROLLER */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          <div style={{
            background: lightTheme ? '#ffffff' : 'rgba(17, 24, 39, 0.85)',
            borderRadius: '16px', border: `1px solid ${lightTheme ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'}`,
            padding: '20px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '14px' }}>
              <Send size={18} color="#f89c1d" />
              <h2 style={{ fontSize: '15px', fontWeight: '700', margin: 0 }}>Dispatch Local Patrol</h2>
            </div>

            <form onSubmit={handleDispatch} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '10px', fontWeight: '700', color: lightTheme ? '#64748b' : '#9ca3af', display: 'block', marginBottom: '4px' }}>
                  TARGET REGIONAL WARD
                </label>
                <select
                  value={selectedWard}
                  onChange={(e) => setSelectedWard(e.target.value)}
                  style={{
                    width: '100%',
                    background: lightTheme ? '#f1f5f9' : 'rgba(0,0,0,0.2)',
                    border: `1px solid ${lightTheme ? '#cbd5e1' : 'rgba(255,255,255,0.08)'}`,
                    borderRadius: '8px',
                    padding: '8px 12px',
                    color: lightTheme ? '#0f172a' : '#f3f4f6',
                    fontFamily: 'inherit',
                    outline: 'none',
                    fontSize: '12px'
                  }}
                >
                  {Object.keys(WARD_DIRECIVES).map(wKey => (
                    <option key={wKey} value={wKey}>{WARD_DIRECIVES[wKey].name} ({wKey})</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '10px', fontWeight: '700', color: lightTheme ? '#64748b' : '#9ca3af', display: 'block', marginBottom: '4px' }}>
                  SELECT AVAILABLE PATROL OFFICER
                </label>
                <select
                  value={selectedOfficerId}
                  onChange={(e) => setSelectedOfficerId(e.target.value)}
                  style={{
                    width: '100%',
                    background: lightTheme ? '#f1f5f9' : 'rgba(0,0,0,0.2)',
                    border: `1px solid ${lightTheme ? '#cbd5e1' : 'rgba(255,255,255,0.08)'}`,
                    borderRadius: '8px',
                    padding: '8px 12px',
                    color: lightTheme ? '#0f172a' : '#f3f4f6',
                    fontFamily: 'inherit',
                    outline: 'none',
                    fontSize: '12px'
                  }}
                >
                  {officers.map(o => (
                    <option key={o.id} value={o.id}>
                      {o.name} - {o.status} ({o.rank})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '10px', fontWeight: '700', color: lightTheme ? '#64748b' : '#9ca3af', display: 'block', marginBottom: '4px' }}>
                  AI DIRECTIVE / RECOMMENDED TASK
                </label>
                <textarea
                  required
                  rows="3"
                  value={customDirective}
                  onChange={(e) => setCustomDirective(e.target.value)}
                  style={{
                    width: '100%',
                    background: lightTheme ? '#f1f5f9' : 'rgba(0,0,0,0.2)',
                    border: `1px solid ${lightTheme ? '#cbd5e1' : 'rgba(255,255,255,0.08)'}`,
                    borderRadius: '8px',
                    padding: '8px 12px',
                    color: lightTheme ? '#0f172a' : '#f3f4f6',
                    fontFamily: 'inherit',
                    outline: 'none',
                    fontSize: '11px',
                    resize: 'none',
                    lineHeight: '1.4'
                  }}
                />
              </div>

              <button
                type="submit"
                style={{
                  width: '100%',
                  background: '#f89c1d',
                  color: '#000',
                  fontWeight: '700',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <Send size={14} /> Deploy Patrol Dispatch
              </button>

              {dispatchStatusMsg && (
                <div style={{
                  fontSize: '11px', fontWeight: '600', textAlign: 'center',
                  color: dispatchStatusMsg.includes('✅') ? '#2ecc71' : '#ef4444',
                  marginTop: '6px'
                }}>
                  {dispatchStatusMsg}
                </div>
              )}
            </form>
          </div>

          {/* ACTIVE DISPATCH LOGS */}
          <div style={{
            background: lightTheme ? '#ffffff' : 'rgba(17, 24, 39, 0.85)',
            borderRadius: '16px', border: `1px solid ${lightTheme ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'}`,
            padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', gap: '12px'
          }}>
            <h2 style={{ fontSize: '13px', fontWeight: '700', margin: 0, color: lightTheme ? '#0f172a' : '#f3f4f6' }}>
              Live Patrol Dispatch Ledger
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto', maxHeight: '180px' }}>
              {localDispatches.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px 0', color: lightTheme ? '#94a3b8' : '#6b7280', fontSize: '11px' }}>
                  No active dispatches deployed in this session. Use the panel above to command.
                </div>
              ) : (
                localDispatches.map((d, i) => (
                  <div 
                    key={i}
                    style={{
                      background: lightTheme ? '#f8fafc' : 'rgba(0,0,0,0.2)',
                      border: `1px solid ${lightTheme ? '#e2e8f0' : 'rgba(255,255,255,0.04)'}`,
                      padding: '10px',
                      borderRadius: '8px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontFamily: 'monospace', fontSize: '10px', fontWeight: 'bold', color: '#f89c1d' }}>{d.id}</span>
                      <span style={{ fontSize: '8.5px', color: lightTheme ? '#94a3b8' : '#6b7280' }}>{d.timestamp}</span>
                    </div>
                    <div style={{ fontSize: '11px', fontWeight: '700', color: lightTheme ? '#0f172a' : '#f3f4f6' }}>
                      {d.officer} &rarr; {d.ward}
                    </div>
                    <p style={{ fontSize: '9.5px', margin: 0, color: lightTheme ? '#64748b' : '#9ca3af', lineHeight: 1.3 }}>
                      {d.directive}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
