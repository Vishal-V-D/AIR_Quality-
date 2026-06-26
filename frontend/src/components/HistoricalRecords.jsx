import React, { useState } from 'react';
import {
  Activity, MoreHorizontal, Share2, Wind, Thermometer, Waves,
  ShieldAlert, Sun, Flame, Car, Cloud, Compass, ThumbsUp
} from 'lucide-react';

export const HISTORICAL_DATA = [
  { location: 'Connaught Place, New Delhi', flag: '🇮🇳', date: 'Mar 19, 2026', aqi: 148, temp: 21, status: 'Moderate', trend: 'flat', humidity: 55, o3: 0.052, co: 1.2, no2: 38, pm25: 64, wind: 'WNW', speed: 12, dispersion: 'Average', weather: 'Hazy' },
  { location: 'Dwarka Sector 10, New Delhi', flag: '🇮🇳', date: 'Mar 18, 2026', aqi: 162, temp: 20, status: 'Poor', trend: 'up', humidity: 58, o3: 0.064, co: 1.4, no2: 44, pm25: 78, wind: 'NW', speed: 8, dispersion: 'Poor', weather: 'Foggy' },
  { location: 'Okhla Industrial, New Delhi', flag: '🇮🇳', date: 'Mar 18, 2026', aqi: 210, temp: 22, status: 'Poor', trend: 'up', humidity: 62, o3: 0.082, co: 2.1, no2: 56, pm25: 118, wind: 'WSW', speed: 10, dispersion: 'Critical', weather: 'Smoky' },
  { location: 'Anand Vihar, New Delhi', flag: '🇮🇳', date: 'Mar 17, 2026', aqi: 185, temp: 19, status: 'Poor', trend: 'down', humidity: 60, o3: 0.055, co: 1.8, no2: 49, pm25: 92, wind: 'E', speed: 15, dispersion: 'Poor', weather: 'Mist' },
  { location: 'Punjabi Bagh, New Delhi', flag: '🇮🇳', date: 'Mar 17, 2026', aqi: 85, temp: 18, status: 'Moderate', trend: 'down', humidity: 52, o3: 0.038, co: 0.9, no2: 32, pm25: 35, wind: 'N', speed: 6, dispersion: 'Good', weather: 'Overcast' },
  { location: 'Wazirpur Industrial, New Delhi', flag: '🇮🇳', date: 'Mar 17, 2026', aqi: 195, temp: 17, status: 'Poor', trend: 'flat', humidity: 64, o3: 0.071, co: 1.9, no2: 51, pm25: 92, wind: 'NW', speed: 11, dispersion: 'Critical', weather: 'Foggy' },
  { location: 'Bandra Kurla, Mumbai', flag: '🇮🇳', date: 'Mar 16, 2026', aqi: 45, temp: 28, status: 'Good', trend: 'down', humidity: 78, o3: 0.024, co: 0.5, no2: 18, pm25: 15, wind: 'SW', speed: 18, dispersion: 'Good', weather: 'Sunny' },
  { location: 'Whitefield, Bengaluru', flag: '🇮🇳', date: 'Mar 16, 2026', aqi: 38, temp: 24, status: 'Good', trend: 'down', humidity: 64, o3: 0.018, co: 0.4, no2: 12, pm25: 10, wind: 'ESE', speed: 14, dispersion: 'Good', weather: 'Clear' },
  { location: 'Adyar, Chennai', flag: '🇮🇳', date: 'Mar 16, 2026', aqi: 42, temp: 30, status: 'Good', trend: 'flat', humidity: 82, o3: 0.022, co: 0.6, no2: 15, pm25: 12, wind: 'E', speed: 16, dispersion: 'Good', weather: 'Humid' },
  { location: 'Salt Lake, Kolkata', flag: '🇮🇳', date: 'Mar 14, 2026', aqi: 95, temp: 26, status: 'Moderate', trend: 'up', humidity: 72, o3: 0.045, co: 1.1, no2: 28, pm25: 42, wind: 'S', speed: 10, dispersion: 'Average', weather: 'Hazy' },
];

function SegmentedProgressBar({ value, max }) {
  const totalSegments = 24;
  const filledCount = Math.min(Math.round((value / max) * totalSegments), totalSegments);

  return (
    <div className="segmented-track">
      {Array.from({ length: totalSegments }).map((_, i) => {
        const isFilled = i < filledCount;
        let color = 'rgba(120, 120, 120, 0.18)'; // Unfilled gray
        if (isFilled) {
          if (i < 8) color = '#2ecc71'; // Green
          else if (i < 16) color = '#f1c40f'; // Yellow
          else if (i < 20) color = '#e67e22'; // Orange
          else color = '#e74c3c'; // Red
        }
        return (
          <div
            key={i}
            className="segmented-segment"
            style={{ background: color }}
          />
        );
      })}
    </div>
  );
}

export default function HistoricalRecords({ lightTheme, selectedLocation, setSelectedLocation }) {
  const [recordsSearch, setRecordsSearch] = useState('');
  const [localSelected, setLocalSelected] = useState(HISTORICAL_DATA[0].location);
  const activeSelected = selectedLocation || localSelected;
  const setActiveSelected = setSelectedLocation || setLocalSelected;

  const activeRecord = HISTORICAL_DATA.find(r => r.location === activeSelected) || HISTORICAL_DATA[0];
  const filteredRecords = HISTORICAL_DATA.filter(r =>
    r.location.toLowerCase().includes(recordsSearch.toLowerCase()) ||
    r.status.toLowerCase().includes(recordsSearch.toLowerCase())
  );

  return (
    <div className="records-layout">
      {/* Left Column Wrapper */}
      <div className="records-left-column">
        {/* Historical Data Pill Tab */}
        <div style={{ marginBottom: '16px' }}>
          <div className="historical-tab-pill">
            <Activity size={13} style={{ color: '#2ecc71' }} />
            Historical Data
          </div>
        </div>

        {/* Historical Records Table Card */}
        <div className="records-table-card">
          <div className="records-header-row">
            <span style={{ fontSize: '14px', fontWeight: '600' }}>Historical Records</span>
            <div className="records-search-bar">
              <input
                type="text"
                placeholder="Search location..."
                value={recordsSearch}
                onChange={(e) => setRecordsSearch(e.target.value)}
                className="search-inp"
                style={{ padding: '6px 12px', fontSize: '12px' }}
              />
              <button className="records-filter-btn">Filter</button>
              <button className="records-filter-btn" style={{ padding: '6px 8px' }}><MoreHorizontal size={14} /></button>
            </div>
          </div>

          <div className="records-table-wrapper">
            <table className="records-tbl">
              <thead>
                <tr>
                  <th>Location <span style={{ opacity: 0.6 }}>↓↑</span></th>
                  <th>Date <span style={{ opacity: 0.6 }}>↓↑</span></th>
                  <th>Avg. AQI <span style={{ opacity: 0.6 }}>↓↑</span></th>
                  <th>Avg. Temp <span style={{ opacity: 0.6 }}>↓↑</span></th>
                  <th>Status <span style={{ opacity: 0.6 }}>↓↑</span></th>
                  <th>Trend <span style={{ opacity: 0.6 }}>↓↑</span></th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((rec, index) => {
                  const isGood = rec.aqi < 50;
                  const isModerate = rec.aqi >= 50 && rec.aqi < 150;
                  const statClass = isGood ? 'good' : isModerate ? 'moderate' : 'poor';
                  const isSelected = activeSelected === rec.location;

                  return (
                    <tr
                      key={index}
                      className={isSelected ? 'active' : ''}
                      onClick={() => setActiveSelected(rec.location)}
                    >
                      <td>
                        <span className="flag-icon">{rec.flag}</span>
                        {rec.location}
                      </td>
                      <td>{rec.date}</td>
                      <td style={{ fontWeight: '700' }}>{rec.aqi}</td>
                      <td>{rec.temp}°C</td>
                      <td>
                        <span className={`status-tag ${statClass}`}>
                          {rec.status}
                        </span>
                      </td>
                      <td>
                        {rec.trend === 'up' && <span className="trend-arrow up">↗</span>}
                        {rec.trend === 'down' && <span className="trend-arrow down">↘</span>}
                        {rec.trend === 'flat' && <span className="trend-arrow flat">→</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="records-pagination">
            <button className="pagination-btn">&lt; Back</button>
            <div className="pagination-pages">
              <span className="pagination-page active">1</span>
              <span className="pagination-page">2</span>
              <span className="pagination-page">3</span>
              <span style={{ color: 'var(--muted)', padding: '0 4px' }}>...</span>
              <span className="pagination-page">10</span>
            </div>
            <button className="pagination-btn">Next &gt;</button>
          </div>
        </div>
      </div>

      {/* Right Details Panel matching image styling exactly */}
      <div className="record-details-panel">
        <div className="details-header">
          <div className="details-title-group">
            <div className="details-flag-circle">
              {activeRecord.flag}
            </div>
            <div>
              <div className="details-title">{activeRecord.location.split(',')[0]}</div>
              <div className="details-subtitle">{activeRecord.date}</div>
            </div>
          </div>
          <div className="details-icon-group">
            <button className="details-icon-btn"><Share2 size={14} /></button>
            <button className="details-icon-btn"><MoreHorizontal size={14} /></button>
          </div>
        </div>

        <div className="weather-row">
          <span className="weather-info">
            Weather: <span className="weather-value">☀️ {activeRecord.weather}</span>
          </span>
          <span className="status-info">
            Status: <span className={`status-tag ${activeRecord.aqi < 50 ? 'good' : activeRecord.aqi < 150 ? 'moderate' : 'poor'}`}>
              {activeRecord.status}
            </span>
          </span>
        </div>

        <div className="metrics-dashed-container">
          <div className="metric-col">
            <span className="metric-box-label">Avg. AQI</span>
            <div className="metric-box-val-row">
              <div className="metric-box-val-group">
                <span className="metric-box-val">{activeRecord.aqi}</span>
                <span className="metric-box-unit">mm</span>
              </div>
              <Wind size={20} className="metric-box-icon wind" />
            </div>
          </div>

          <div className="metric-col">
            <span className="metric-box-label">Avg. Temperature</span>
            <div className="metric-box-val-row">
              <div className="metric-box-val-group">
                <span className="metric-box-val">{activeRecord.temp}</span>
                <span className="metric-box-unit">°C</span>
              </div>
              <Thermometer size={20} className="metric-box-icon thermometer" />
            </div>
          </div>

          <div className="metric-col">
            <span className="metric-box-label">Humidity</span>
            <div className="metric-box-val-row">
              <div className="metric-box-val-group">
                <span className="metric-box-val">{activeRecord.humidity}</span>
                <span className="metric-box-unit">%</span>
              </div>
              <Waves size={20} className="metric-box-icon waves" />
            </div>
          </div>
        </div>

        {/* AQI Trend line preview */}
        <div className="aqi-trend-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '8px' }}>
            <span style={{ fontWeight: '600' }}>AQI Trend</span>
            <span style={{ color: '#2ecc71', fontWeight: '500' }}>Healthy air quality</span>
          </div>
          <svg viewBox="0 0 300 115" style={{ width: '100%', height: '115px', display: 'block' }}>
            <defs>
              <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2ecc71" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#2ecc71" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Grid lines */}
            <line x1="35" x2="275" y1="15" y2="15" stroke="var(--border)" strokeWidth="0.5" strokeDasharray="3,3" />
            <line x1="35" x2="275" y1="40" y2="40" stroke="var(--border)" strokeWidth="0.5" strokeDasharray="3,3" />
            <line x1="35" x2="275" y1="65" y2="65" stroke="var(--border)" strokeWidth="0.5" strokeDasharray="3,3" />
            <line x1="35" x2="275" y1="90" y2="90" stroke="var(--border)" strokeWidth="0.5" strokeDasharray="3,3" />

            {/* Y Axis Labels */}
            <text x="12" y="18" fill="var(--muted)" fontSize="9" textAnchor="start">60</text>
            <text x="12" y="43" fill="var(--muted)" fontSize="9" textAnchor="start">40</text>
            <text x="12" y="68" fill="var(--muted)" fontSize="9" textAnchor="start">20</text>
            <text x="12" y="93" fill="var(--muted)" fontSize="9" textAnchor="start">0</text>

            {/* Smooth Bezier Path */}
            <path
              d="M 35,55 C 55,43 65,40 75,42.5 C 85,45 105,46 115,47.5 C 125,49 145,55 155,55 C 165,55 185,50 195,50 C 205,50 225,58 235,57.5 C 245,57 265,52 275,50"
              fill="none"
              stroke="#2ecc71"
              strokeWidth="2.5"
              strokeLinecap="round"
            />

            {/* Gradient Fill under Path */}
            <path
              d="M 35,55 C 55,43 65,40 75,42.5 C 85,45 105,46 115,47.5 C 125,49 145,55 155,55 C 165,55 185,50 195,50 C 205,50 225,58 235,57.5 C 245,57 265,52 275,50 L 275,90 L 35,90 Z"
              fill="url(#areaGrad)"
            />

            {/* Dots on Curve Points */}
            <circle cx="35" cy="55" r="3.5" fill="#2ecc71" stroke="var(--card-bg2)" strokeWidth="1.5" />
            <circle cx="75" cy="42.5" r="3.5" fill="#2ecc71" stroke="var(--card-bg2)" strokeWidth="1.5" />
            <circle cx="115" cy="47.5" r="3.5" fill="#2ecc71" stroke="var(--card-bg2)" strokeWidth="1.5" />
            <circle cx="155" cy="55" r="3.5" fill="#2ecc71" stroke="var(--card-bg2)" strokeWidth="1.5" />
            <circle cx="195" cy="50" r="3.5" fill="#2ecc71" stroke="var(--card-bg2)" strokeWidth="1.5" />
            <circle cx="235" cy="57.5" r="3.5" fill="#2ecc71" stroke="var(--card-bg2)" strokeWidth="1.5" />
            <circle cx="275" cy="50" r="3.5" fill="#2ecc71" stroke="var(--card-bg2)" strokeWidth="1.5" />

            {/* X Axis Labels */}
            <text x="35" y="106" fill="var(--muted)" fontSize="9" textAnchor="middle">0.00</text>
            <text x="75" y="106" fill="var(--muted)" fontSize="9" textAnchor="middle">4.00</text>
            <text x="115" y="106" fill="var(--muted)" fontSize="9" textAnchor="middle">8.00</text>
            <text x="155" y="106" fill="var(--muted)" fontSize="9" textAnchor="middle">12.00</text>
            <text x="195" y="106" fill="var(--muted)" fontSize="9" textAnchor="middle">16.00</text>
            <text x="235" y="106" fill="var(--muted)" fontSize="9" textAnchor="middle">20.00</text>
            <text x="275" y="106" fill="var(--muted)" fontSize="9" textAnchor="middle">24.00</text>
          </svg>
        </div>

        {/* Additional metrics in a 2x2 grid */}
        <div className="detail-bars-list">
          <div className="detail-bar-item">
            <div className="detail-bar-header">
              <span className="detail-bar-name" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sun size={14} className="pollutant-icon" /> Ozone (O₃)
              </span>
              <span className="detail-bar-val">{activeRecord.o3} <span className="unit-label">ppm</span></span>
            </div>
            <SegmentedProgressBar value={activeRecord.o3} max={0.1} />
            <span className="detail-bar-caption">Ozone levels are slightly rising</span>
          </div>

          <div className="detail-bar-item">
            <div className="detail-bar-header">
              <span className="detail-bar-name" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Flame size={14} className="pollutant-icon" /> Carbon Monoxide
              </span>
              <span className="detail-bar-val">{activeRecord.co} <span className="unit-label">ppm</span></span>
            </div>
            <SegmentedProgressBar value={activeRecord.co} max={3.0} />
            <span className="detail-bar-caption">CO levels are within safe limits</span>
          </div>

          <div className="detail-bar-item">
            <div className="detail-bar-header">
              <span className="detail-bar-name" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Car size={14} className="pollutant-icon" /> Nitrogen Dioxide (NO₂)
              </span>
              <span className="detail-bar-val">{activeRecord.no2} <span className="unit-label">ppb</span></span>
            </div>
            <SegmentedProgressBar value={activeRecord.no2} max={100} />
            <span className="detail-bar-caption">NO₂ levels are stable</span>
          </div>

          <div className="detail-bar-item">
            <div className="detail-bar-header">
              <span className="detail-bar-name" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Cloud size={14} className="pollutant-icon" /> PM2.5
              </span>
              <span className="detail-bar-val">{activeRecord.pm25} <span className="unit-label">µg/m³</span></span>
            </div>
            <SegmentedProgressBar value={activeRecord.pm25} max={150} />
            <span className="detail-bar-caption">PM2.5 levels are Slightly Decreasing</span>
          </div>
        </div>

        {/* Extra details bottom row */}
        <div className="extra-metrics-row">
          <div className="extra-metric-item">
            <div className="extra-metric-label">
              <Compass size={13} /> Wind Direction
            </div>
            <div className="extra-metric-value">{activeRecord.wind}</div>
          </div>

          <div className="extra-metric-item">
            <div className="extra-metric-label">
              <Wind size={13} /> Speed
            </div>
            <div className="extra-metric-value">{activeRecord.speed} km/h</div>
          </div>

          <div className="extra-metric-item">
            <div className="extra-metric-label">
              <Activity size={13} /> Dispersion
            </div>
            <div className="extra-metric-value" style={{ color: activeRecord.dispersion === 'Critical' ? '#e74c3c' : '#2ecc71' }}>
              {activeRecord.dispersion}
            </div>
          </div>
        </div>

        {/* Environmental Insights Card */}
        <div className="insights-card">
          <div className="insights-title">
            <ThumbsUp size={14} /> Environmental Insights
          </div>
          <p>
            Air quality for {activeRecord.location.split(',')[0]} remains {activeRecord.status.toLowerCase()} with {activeRecord.dispersion.toLowerCase()} atmospheric pollutant dispersion conditions.
          </p>
        </div>
      </div>
    </div>
  );
}
