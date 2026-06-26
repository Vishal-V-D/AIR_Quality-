import React, { useState } from 'react';
import { Building, ShieldAlert, Award, FileText, ChevronRight, Sliders, AlertTriangle, HelpCircle } from 'lucide-react';

export default function StateOrg({ lightTheme }) {
  const [grapStage, setGrapStage] = useState(2);
  const [emergencyThreshold, setEmergencyThreshold] = useState(150);
  const [activeAlerts, setActiveAlerts] = useState([
    { id: 'ALT-901', severity: 'Critical', title: 'NGT Order on Wazirpur Steel Scrap smelting', date: 'Today, 08:32 AM', desc: 'National Green Tribunal issues strict warning to DPCC to audit Wazirpur steel mills for acid-pickling violations within 48 hours.' },
    { id: 'ALT-902', severity: 'Warning', title: 'BS-VI Diesel Truck Restrictions', date: 'Yesterday', desc: 'Enforcement of GRAP Stage II border toll check stops for transit heavy goods vehicle diversion to Western Peripheral Expressway.' },
    { id: 'ALT-903', severity: 'Info', title: 'Smog Tower Calibration scheduled', date: '2 days ago', desc: 'Periodic check of filtration elements in Connaught Place Smog Tower. Filter replacement at 85% capacity.' }
  ]);

  const departments = [
    { name: 'DPCC Air Quality Control Board', head: 'Dr. Ramesh Chandra', phone: '+91-11-23371101', email: 'chairman.dpcc@delhi.gov.in', status: 'Optimal' },
    { name: 'CPCB Special Enforcement Wing', head: 'Shri A. K. Banerjee', phone: '+91-11-22301925', email: 'enforcement.cpcb@nic.in', status: 'High Load' },
    { name: 'DPCC Legal Cell & Auditing Office', head: 'Smt. Kavita Sharma', phone: '+91-11-23371904', email: 'legal.audit.dpcc@delhi.gov.in', status: 'Optimal' },
    { name: 'Mobile Patrol & Inspection Dispatch Unit', head: 'Deputy Commissioner R. Negi', phone: '+91-9871029344', email: 'patrol.ops@dpcc.net', status: 'Dispatched' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '100%', overflowY: 'auto' }}>
      {/* HEADER SECTION */}
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: '800', letterSpacing: '-0.02em', margin: 0 }}>
          State Regulatory Control Cockpit
        </h1>
        <p style={{ color: lightTheme ? '#64748b' : '#9ca3af', fontSize: '12.5px', marginTop: '4px' }}>
          Delhi Pollution Control Committee (DPCC) command dashboard & GRAP policy controls.
        </p>
      </div>

      {/* STATE BODY CORE METRICS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
        {/* GRAP LEVEL STATUS CARD */}
        <div style={{
          background: lightTheme ? '#ffffff' : 'rgba(17, 24, 39, 0.85)',
          borderRadius: '12px', padding: '18px',
          border: `1px solid ${lightTheme ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'}`,
          display: 'flex', gap: '14px', alignItems: 'center'
        }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '10px',
            background: grapStage >= 3 ? 'rgba(239, 68, 68, 0.12)' : 'rgba(245, 158, 11, 0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
          }}>
            <ShieldAlert size={22} color={grapStage >= 3 ? '#ef4444' : '#f59e0b'} />
          </div>
          <div>
            <div style={{ fontSize: '11px', color: lightTheme ? '#64748b' : '#9ca3af', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              GRAP Emergency Level
            </div>
            <div style={{ fontSize: '20px', fontWeight: '800', margin: '4px 0 2px', color: lightTheme ? '#0f172a' : '#f3f4f6' }}>
              Stage {grapStage} - {grapStage === 1 ? 'Moderate' : grapStage === 2 ? 'Very Poor' : grapStage === 3 ? 'Severe' : 'Severe+'}
            </div>
            <div style={{ fontSize: '10px', color: lightTheme ? '#94a3b8' : '#6b7280' }}>
              Graded Response Action Plan active
            </div>
          </div>
        </div>

        {/* COMPLIANCE CARD */}
        <div style={{
          background: lightTheme ? '#ffffff' : 'rgba(17, 24, 39, 0.85)',
          borderRadius: '12px', padding: '18px',
          border: `1px solid ${lightTheme ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'}`,
          display: 'flex', gap: '14px', alignItems: 'center'
        }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '10px',
            background: 'rgba(46, 204, 113, 0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
          }}>
            <Award size={22} color="#2ecc71" />
          </div>
          <div>
            <div style={{ fontSize: '11px', color: lightTheme ? '#64748b' : '#9ca3af', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              CPCB Target Compliance
            </div>
            <div style={{ fontSize: '20px', fontWeight: '800', margin: '4px 0 2px', color: lightTheme ? '#0f172a' : '#f3f4f6' }}>
              78.2% Region-Wide
            </div>
            <div style={{ fontSize: '10px', color: lightTheme ? '#94a3b8' : '#6b7280' }}>
              Target: &lt; 40 µg/m³ average baseline
            </div>
          </div>
        </div>

        {/* INDUSTRIAL COMPLIANCE STACKS */}
        <div style={{
          background: lightTheme ? '#ffffff' : 'rgba(17, 24, 39, 0.85)',
          borderRadius: '12px', padding: '18px',
          border: `1px solid ${lightTheme ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'}`,
          display: 'flex', gap: '14px', alignItems: 'center'
        }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '10px',
            background: 'rgba(52, 152, 219, 0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
          }}>
            <Building size={22} color="#3498db" />
          </div>
          <div>
            <div style={{ fontSize: '11px', color: lightTheme ? '#64748b' : '#9ca3af', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Audited Smoke Stacks
            </div>
            <div style={{ fontSize: '20px', fontWeight: '800', margin: '4px 0 2px', color: lightTheme ? '#0f172a' : '#f3f4f6' }}>
              142 Registered Units
            </div>
            <div style={{ fontSize: '10px', color: lightTheme ? '#94a3b8' : '#6b7280' }}>
              100% CEMS Telemetry integration
            </div>
          </div>
        </div>
      </div>

      {/* CORE CONTROLS & EMERGENCY SETTING */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '14px' }}>
        {/* GRAP ACTION PLAN POLICY CONTROL CARD */}
        <div style={{
          background: lightTheme ? '#ffffff' : 'rgba(17, 24, 39, 0.85)',
          borderRadius: '16px', border: `1px solid ${lightTheme ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'}`,
          padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sliders size={18} color="#f89c1d" />
            <h2 style={{ fontSize: '15px', fontWeight: '700', margin: 0 }}>Emergency GRAP Policy Control</h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: '600', marginBottom: '6px' }}>
                <span>Interactive Emergency PM2.5 Dispatch Threshold</span>
                <span style={{ color: '#f89c1d' }}>{emergencyThreshold} µg/m³</span>
              </div>
              <input 
                type="range" 
                min="50" max="300" step="10"
                value={emergencyThreshold}
                onChange={(e) => setEmergencyThreshold(parseInt(e.target.value))}
                style={{
                  width: '100%', cursor: 'pointer', accentColor: '#f89c1d',
                  background: lightTheme ? '#cbd5e1' : '#374151', height: '6px', borderRadius: '3px'
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9.5px', color: lightTheme ? '#64748b' : '#9ca3af', marginTop: '4px' }}>
                <span>50 µg/m³ (Stricter Audits)</span>
                <span>300 µg/m³ (Critical Only)</span>
              </div>
            </div>

            <div style={{ borderTop: `1px solid ${lightTheme ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'}`, paddingTop: '14px' }}>
              <div style={{ fontSize: '12px', fontWeight: '700', marginBottom: '8px', color: lightTheme ? '#0f172a' : '#f3f4f6' }}>
                Policy Level Settings
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  { stage: 1, label: 'Stage I - Moderate Warning (PM2.5 > 60)', desc: 'Mechanical sweeping, anti-dust mist layout screens enforced.' },
                  { stage: 2, label: 'Stage II - Very Poor Advisory (PM2.5 > 120)', desc: 'Divert diesel freights at checkpost, ban diesel gensets except emergency.' },
                  { stage: 3, label: 'Stage III - Severe Action (PM2.5 > 150)', desc: 'Complete ban on minor brick kilns, stone crushers & construction demolition.' },
                  { stage: 4, label: 'Stage IV - Severe Plus Emergency (PM2.5 > 250)', desc: 'Order 50% state org work-from-home, enforce odd-even car regulations.' }
                ].map(p => (
                  <div 
                    key={p.stage}
                    onClick={() => setGrapStage(p.stage)}
                    style={{
                      padding: '10px',
                      borderRadius: '8px',
                      background: grapStage === p.stage ? (lightTheme ? 'rgba(248, 156, 29, 0.08)' : 'rgba(248, 156, 29, 0.05)') : 'transparent',
                      border: `1.5px solid ${grapStage === p.stage ? '#f89c1d' : 'transparent'}`,
                      cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}
                  >
                    <div style={{ fontSize: '11px', fontWeight: '700', color: grapStage === p.stage ? '#f89c1d' : (lightTheme ? '#0f172a' : '#f3f4f6') }}>
                      {p.label}
                    </div>
                    <div style={{ fontSize: '9.5px', color: lightTheme ? '#64748b' : '#9ca3af', marginTop: '2px' }}>
                      {p.desc}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* LIVE BULLETINS & NGT DIRECTIVES */}
        <div style={{
          background: lightTheme ? '#ffffff' : 'rgba(17, 24, 39, 0.85)',
          borderRadius: '16px', border: `1px solid ${lightTheme ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'}`,
          padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={18} color="#e74c3c" />
            <h2 style={{ fontSize: '15px', fontWeight: '700', margin: 0 }}>Regulatory Alerts & Orders</h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, overflowY: 'auto' }}>
            {activeAlerts.map(a => {
              let labelCol = '#f89c1d';
              if (a.severity === 'Critical') labelCol = '#e74c3c';
              else if (a.severity === 'Info') labelCol = '#3498db';

              return (
                <div 
                  key={a.id}
                  style={{
                    background: lightTheme ? '#f8fafc' : 'rgba(0,0,0,0.2)',
                    borderLeft: `3px solid ${labelCol}`,
                    padding: '10px 12px',
                    borderRadius: '0 8px 8px 0',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', fontWeight: '700' }}>
                    <span style={{ color: labelCol, textTransform: 'uppercase' }}>{a.severity}</span>
                    <span style={{ color: lightTheme ? '#94a3b8' : '#6b7280' }}>{a.date}</span>
                  </div>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: lightTheme ? '#0f172a' : '#f3f4f6' }}>
                    {a.title}
                  </div>
                  <p style={{ fontSize: '9.5px', color: lightTheme ? '#64748b' : '#9ca3af', margin: 0, lineHeight: 1.3 }}>
                    {a.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* DEPARTMENT CONTACT DIRECTORY */}
      <div style={{
        background: lightTheme ? '#ffffff' : 'rgba(17, 24, 39, 0.85)',
        borderRadius: '16px', border: `1px solid ${lightTheme ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'}`,
        padding: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <Building size={18} color="#3498db" />
          <h2 style={{ fontSize: '15px', fontWeight: '700', margin: 0 }}>State Regulatory Directory</h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {departments.map((d, idx) => (
            <div 
              key={idx} 
              style={{
                border: `1.5px solid ${lightTheme ? '#f1f5f9' : 'rgba(255,255,255,0.04)'}`,
                background: lightTheme ? '#f8fafc' : 'rgba(255,255,255,0.02)',
                borderRadius: '10px',
                padding: '12px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', fontWeight: '700', color: lightTheme ? '#0f172a' : '#f3f4f6' }}>{d.name}</span>
                <span 
                  style={{
                    fontSize: '8.5px', fontWeight: '800', textTransform: 'uppercase',
                    color: d.status === 'Optimal' ? '#2ecc71' : d.status === 'Dispatched' ? '#f89c1d' : '#e74c3c'
                  }}
                >
                  {d.status}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '10.5px', color: lightTheme ? '#64748b' : '#9ca3af' }}>
                <div>Head Officer: <strong>{d.head}</strong></div>
                <div>Phone hotline: <span style={{ fontFamily: 'monospace' }}>{d.phone}</span></div>
                <div>Email: <span style={{ textDecoration: 'underline' }}>{d.email}</span></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
