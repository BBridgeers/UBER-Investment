import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import './ChargingStrategy.css';

const ChargingStrategy = ({ chargingLocations }) => {
  const [selectedLocation, setSelectedLocation] = useState(null);

  // Charging strategy breakdown
  const chargingMix = [
    { name: 'Free Charging (Guerrilla)', value: 60, cost: 0, color: '#4ade80' },
    { name: 'Tesla Supercharger', value: 20, cost: 15.47 * 0.2, color: '#FFD700' },
    { name: 'EVgo (45% discount)', value: 20, cost: 15.47 * 0.2, color: '#B87333' }
  ];

  const totalWeeklyCost = 15.47;
  const monthlyCost = 67.04;  // Per audit: $15.47 × 4.33 rounded

  return (
    <div className="charging-strategy">
      <div className="charging-header">
        <h2 className="section-title">
          <span className="title-icon">⚡</span>
          Strategic EV Charging Plan
        </h2>
        <p className="section-subtitle">
          Optimized charging strategy combining free guerrilla charging with paid backup options
        </p>
      </div>

      {/* Cost Summary */}
      <div className="cost-summary-grid">
        <div className="cost-card card-3d glow-gold">
          <div className="cost-icon">💰</div>
          <div className="cost-value">${totalWeeklyCost.toFixed(2)}</div>
          <div className="cost-label">Weekly Charging Cost</div>
          <div className="cost-detail">Average across all strategies</div>
        </div>
        <div className="cost-card card-3d glow-copper">
          <div className="cost-icon">📅</div>
          <div className="cost-value">${monthlyCost.toFixed(2)}</div>
          <div className="cost-label">Monthly Charging Cost</div>
          <div className="cost-detail">4.33 weeks average</div>
        </div>
        <div className="cost-card card-3d glow-gold">
          <div className="cost-icon">🔋</div>
          <div className="cost-value">185 kWh</div>
          <div className="cost-label">Weekly Energy Need</div>
          <div className="cost-detail">~500 miles @ 2.7 mi/kWh</div>
        </div>
      </div>

      {/* Strategy Mix Visualization */}
      <div className="strategy-viz-section card-3d">
        <h3 className="subsection-title">Charging Strategy Mix (60/20/20)</h3>

        <div className="viz-content">
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chargingMix}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  animationBegin={0}
                  animationDuration={800}
                >
                  {chargingMix.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(0, 0, 0, 0.9)',
                    border: '1px solid rgba(255, 215, 0, 0.3)',
                    borderRadius: '8px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="strategy-legend">
            {chargingMix.map((strategy, index) => (
              <div key={index} className="legend-item">
                <div className="legend-color" style={{ background: strategy.color }}></div>
                <div className="legend-content">
                  <div className="legend-name">{strategy.name}</div>
                  <div className="legend-stats">
                    <span>{strategy.value}% of charging</span>
                    <span className="legend-cost">
                      {strategy.cost === 0 ? 'FREE' : `$${strategy.cost.toFixed(2)}/week`}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charging Locations */}
      <div className="locations-section">
        <h3 className="subsection-title">
          <span className="location-icon">📍</span>
          Charging Locations Near Southlake, TX
        </h3>

        <div className="locations-grid">
          {chargingLocations.map((location, index) => (
            <div
              key={index}
              className={`location-card card-3d ${selectedLocation === index ? 'selected' : ''
                }`}
              onClick={() => setSelectedLocation(index === selectedLocation ? null : index)}
            >
              <div className="location-header">
                <div className="location-type-badge">
                  {location.type}
                </div>
                <div className="location-distance">
                  {location.distance_miles} mi
                </div>
              </div>

              <h4 className="location-name">{location.name}</h4>
              <p className="location-address">{location.address}</p>

              <div className="location-details">
                <div className="detail-row">
                  <span className="detail-label">Chargers:</span>
                  <span className="detail-value">
                    {location.chargers || 'Multiple'}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Cost:</span>
                  <span className="detail-value cost-highlight">
                    {location.cost}
                  </span>
                </div>
                {location.risk && (
                  <div className="detail-row">
                    <span className="detail-label">Risk:</span>
                    <span className={`detail-value risk-${location.risk.toLowerCase()}`}>
                      {location.risk}
                    </span>
                  </div>
                )}
              </div>

              {selectedLocation === index && (
                <div className="location-expanded">
                  <div className="expanded-section">
                    <h5>Strategy Tips:</h5>
                    {location.name.includes('Westin') && (
                      <ul>
                        <li>✅ Park overnight 10pm-6am</li>
                        <li>✅ Rotate with other locations</li>
                        <li>✅ Blend in with hotel guests</li>
                        <li>✅ Use bike to return home ($50 one-time)</li>
                      </ul>
                    )}
                    {location.name.includes('Tesla') && (
                      <ul>
                        <li>⚡ Use off-peak hours (10pm-8am)</li>
                        <li>⚡ $0.18-0.25/kWh off-peak pricing</li>
                        <li>⚡ Free Ford NACS adapter included</li>
                        <li>⚡ 0.2 miles from home (closest!)</li>
                      </ul>
                    )}
                    {location.name.includes('EVgo') && (
                      <ul>
                        <li>🎯 Uber Pro 45% discount available</li>
                        <li>🎯 $0.19-0.23/kWh with discount</li>
                        <li>🎯 Gold/Platinum tier after 100 trips</li>
                        <li>🎯 Use for emergency top-ups</li>
                      </ul>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Weekly Routine */}
      <div className="routine-section card-3d">
        <h3 className="subsection-title">
          <span className="routine-icon">📋</span>
          Recommended Weekly Charging Routine
        </h3>

        <div className="routine-timeline">
          <div className="routine-day">
            <div className="day-badge">Mon/Wed/Fri</div>
            <div className="routine-content">
              <div className="routine-title">Free Overnight Charging</div>
              <div className="routine-description">
                • End day ~10pm with 30-40% battery<br />
                • Drive to Westin or apartment complex<br />
                • Plug in overnight (Level 2, 6-8 hours)<br />
                • Bike home (15-25 min ride)<br />
                • Retrieve 6-7am (108-162 miles added)
              </div>
              <div className="routine-cost">Cost: $0</div>
            </div>
          </div>

          <div className="routine-day">
            <div className="day-badge">Tue/Thu</div>
            <div className="routine-content">
              <div className="routine-title">Quick Tesla Supercharger Top-Up</div>
              <div className="routine-description">
                • 6am off-peak charging (20 min session)<br />
                • 261 N Carroll Ave (0.2 miles from home)<br />
                • Add 100 miles @ $0.22/kWh average<br />
                • 37 kWh = $8.14 per session
              </div>
              <div className="routine-cost">Cost: $8.14/session</div>
            </div>
          </div>

          <div className="routine-day">
            <div className="day-badge">Weekend</div>
            <div className="routine-content">
              <div className="routine-title">EVgo Fast Charge (Uber discount)</div>
              <div className="routine-description">
                • Lunch break between Uber shifts<br />
                • Various locations 5-10 miles away<br />
                • 45% discount with Uber Pro Gold<br />
                • Quick 30-min session
              </div>
              <div className="routine-cost">Cost: $7.40/session</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChargingStrategy;
