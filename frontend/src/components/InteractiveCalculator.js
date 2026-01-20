import React, { useState, useEffect } from 'react';
import axios from 'axios';
import CountUp from 'react-countup';
import './InteractiveCalculator.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const InteractiveCalculator = ({ onCalculate }) => {
  const [inputs, setInputs] = useState({
    hoursPerWeek: 48,
    hourlyRate: 23,
    months: 6,
    freeChargingPercent: 60
  });

  const [calculations, setCalculations] = useState(null);
  const [scenarioName, setScenarioName] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    calculateResults();
  }, [inputs]);

  const calculateResults = async () => {
    try {
      const response = await axios.get(`${API}/calculate-all`, {
        params: {
          hours_per_week: inputs.hoursPerWeek,
          hourly_rate: inputs.hourlyRate,
          months: inputs.months
        }
      });
      setCalculations(response.data.avis_rental);
      
      // Update parent component
      if (onCalculate) {
        onCalculate(inputs);
      }
    } catch (error) {
      console.error('Error calculating:', error);
    }
  };

  const handleChange = (field, value) => {
    setInputs(prev => ({ ...prev, [field]: parseFloat(value) }));
  };

  const handleSaveScenario = async () => {
    if (!scenarioName.trim()) {
      setSaveMessage('Please enter a scenario name');
      return;
    }

    setSaving(true);
    try {
      await axios.post(`${API}/scenarios`, {
        name: scenarioName,
        inputs: {
          hours_per_week: inputs.hoursPerWeek,
          hourly_rate: inputs.hourlyRate,
          months: inputs.months,
          charging_strategy: {
            free_percentage: inputs.freeChargingPercent,
            tesla_supercharger_percentage: (100 - inputs.freeChargingPercent) / 2,
            evgo_percentage: (100 - inputs.freeChargingPercent) / 2,
            weekly_cost: 15.54
          }
        }
      });

      setSaveMessage('✅ Scenario saved successfully!');
      setScenarioName('');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      setSaveMessage('❌ Error saving scenario');
      console.error('Error saving scenario:', error);
    } finally {
      setSaving(false);
    }
  };

  if (!calculations) {
    return <div className="calculator-loading">Calculating...</div>;
  }

  const weeklyEarnings = inputs.hoursPerWeek * inputs.hourlyRate;
  const monthlyUber = weeklyEarnings * 4.33;
  const monthlyTotal = monthlyUber + 320; // Yoga
  const monthlyNet = calculations.monthly_net;
  const sixMonthNet = calculations.six_month_net;
  const breakEven = calculations.break_even_weeks;

  return (
    <div className="interactive-calculator">
      <div className="calculator-header">
        <h2 className="section-title">
          <span className="title-icon">🔢</span>
          Interactive Financial Calculator
        </h2>
        <p className="section-subtitle">
          Adjust parameters to see real-time projections and save custom scenarios
        </p>
      </div>

      {/* Input Controls */}
      <div className="calculator-grid">
        {/* Left: Controls */}
        <div className="controls-section card-3d">
          <h3 className="controls-title">Adjust Parameters</h3>

          {/* Hours Per Week */}
          <div className="input-group">
            <div className="input-header">
              <label className="input-label">Hours Per Week</label>
              <div className="input-value">{inputs.hoursPerWeek} hrs</div>
            </div>
            <input 
              type="range" 
              className="slider"
              min="20" 
              max="70" 
              step="1"
              value={inputs.hoursPerWeek}
              onChange={(e) => handleChange('hoursPerWeek', e.target.value)}
            />
            <div className="slider-labels">
              <span>20 hrs</span>
              <span className="label-recommended">48 hrs (recommended)</span>
              <span>70 hrs</span>
            </div>
          </div>

          {/* Hourly Rate */}
          <div className="input-group">
            <div className="input-header">
              <label className="input-label">Expected Hourly Rate</label>
              <div className="input-value">${inputs.hourlyRate}/hr</div>
            </div>
            <input 
              type="range" 
              className="slider"
              min="15" 
              max="35" 
              step="0.5"
              value={inputs.hourlyRate}
              onChange={(e) => handleChange('hourlyRate', e.target.value)}
            />
            <div className="slider-labels">
              <span>$15 (min)</span>
              <span className="label-recommended">$23 (target)</span>
              <span>$35 (peak)</span>
            </div>
          </div>

          {/* Months Timeline */}
          <div className="input-group">
            <div className="input-header">
              <label className="input-label">Projection Timeline</label>
              <div className="input-value">{inputs.months} months</div>
            </div>
            <input 
              type="range" 
              className="slider"
              min="1" 
              max="12" 
              step="1"
              value={inputs.months}
              onChange={(e) => handleChange('months', e.target.value)}
            />
            <div className="slider-labels">
              <span>1 month</span>
              <span className="label-recommended">6 months</span>
              <span>12 months</span>
            </div>
          </div>

          {/* Free Charging Mix */}
          <div className="input-group">
            <div className="input-header">
              <label className="input-label">Free Charging Mix</label>
              <div className="input-value">{inputs.freeChargingPercent}%</div>
            </div>
            <input 
              type="range" 
              className="slider"
              min="0" 
              max="100" 
              step="5"
              value={inputs.freeChargingPercent}
              onChange={(e) => handleChange('freeChargingPercent', e.target.value)}
            />
            <div className="slider-labels">
              <span>0% free</span>
              <span className="label-recommended">60% free</span>
              <span>100% free</span>
            </div>
          </div>

          {/* Save Scenario */}
          <div className="save-section">
            <h4 className="save-title">Save This Scenario</h4>
            <input 
              type="text"
              className="scenario-name-input"
              placeholder="Enter scenario name..."
              value={scenarioName}
              onChange={(e) => setScenarioName(e.target.value)}
            />
            <button 
              className="save-btn"
              onClick={handleSaveScenario}
              disabled={saving || !scenarioName.trim()}
            >
              {saving ? 'Saving...' : '💾 Save Scenario'}
            </button>
            {saveMessage && (
              <div className={`save-message ${saveMessage.includes('✅') ? 'success' : 'error'}`}>
                {saveMessage}
              </div>
            )}
          </div>
        </div>

        {/* Right: Results */}
        <div className="results-section">
          {/* Quick Stats */}
          <div className="quick-stats-grid">
            <div className="stat-card card-3d glow-gold">
              <div className="stat-icon">💵</div>
              <div className="stat-value">
                $<CountUp end={weeklyEarnings} duration={1.5} separator="," />
              </div>
              <div className="stat-label">Weekly Uber Earnings</div>
            </div>

            <div className="stat-card card-3d glow-copper">
              <div className="stat-icon">📅</div>
              <div className="stat-value">
                $<CountUp end={monthlyTotal} duration={1.5} separator="," />
              </div>
              <div className="stat-label">Monthly Total Income</div>
            </div>

            <div className="stat-card card-3d glow-gold">
              <div className="stat-icon">💰</div>
              <div className="stat-value text-gradient-gold">
                $<CountUp end={monthlyNet} duration={1.5} separator="," />
              </div>
              <div className="stat-label">Monthly Net Income</div>
            </div>

            <div className="stat-card card-3d glow-copper">
              <div className="stat-icon">🎯</div>
              <div className="stat-value text-gradient-copper">
                $<CountUp end={sixMonthNet} duration={2} separator="," />
              </div>
              <div className="stat-label">{inputs.months}-Month Net Total</div>
            </div>
          </div>

          {/* Detailed Breakdown */}
          <div className="breakdown-card card-3d">
            <h3 className="breakdown-title">Detailed Breakdown</h3>
            
            <div className="breakdown-table">
              <div className="breakdown-row">
                <div className="breakdown-label">Weekly Hours Driving</div>
                <div className="breakdown-value">{inputs.hoursPerWeek} hrs</div>
              </div>
              <div className="breakdown-row">
                <div className="breakdown-label">Hourly Rate (avg)</div>
                <div className="breakdown-value">${inputs.hourlyRate}/hr</div>
              </div>
              <div className="breakdown-row highlight">
                <div className="breakdown-label">Weekly Uber Income</div>
                <div className="breakdown-value">${weeklyEarnings.toLocaleString()}</div>
              </div>
              <div className="breakdown-row">
                <div className="breakdown-label">Monthly Uber Income</div>
                <div className="breakdown-value">${monthlyUber.toFixed(0)}</div>
              </div>
              <div className="breakdown-row">
                <div className="breakdown-label">Monthly Yoga Studio</div>
                <div className="breakdown-value">$320</div>
              </div>
              <div className="breakdown-row highlight">
                <div className="breakdown-label">Total Monthly Income</div>
                <div className="breakdown-value positive">${monthlyTotal.toLocaleString()}</div>
              </div>
              <div className="breakdown-divider"></div>
              <div className="breakdown-row">
                <div className="breakdown-label">AVIS Weekly Rental</div>
                <div className="breakdown-value negative">-$386.86</div>
              </div>
              <div className="breakdown-row">
                <div className="breakdown-label">Sales Tax (Weekly)</div>
                <div className="breakdown-value negative">-$31.92</div>
              </div>
              <div className="breakdown-row">
                <div className="breakdown-label">Electricity (Weekly)</div>
                <div className="breakdown-value negative">-$15.54</div>
              </div>
              <div className="breakdown-row highlight">
                <div className="breakdown-label">Total Monthly Costs</div>
                <div className="breakdown-value negative">
                  -${calculations.monthly_costs.toFixed(0)}
                </div>
              </div>
              <div className="breakdown-divider"></div>
              <div className="breakdown-row highlight-gold">
                <div className="breakdown-label strong">Monthly Net Profit</div>
                <div className="breakdown-value strong positive">
                  ${monthlyNet.toLocaleString()}
                </div>
              </div>
              <div className="breakdown-row highlight-gold">
                <div className="breakdown-label strong">{inputs.months}-Month Total</div>
                <div className="breakdown-value strong positive">
                  ${sixMonthNet.toLocaleString()}
                </div>
              </div>
              <div className="breakdown-row">
                <div className="breakdown-label">Break-Even Point</div>
                <div className="breakdown-value">{breakEven} weeks</div>
              </div>
            </div>
          </div>

          {/* Comparison Insights */}
          <div className="insights-card card-3d">
            <h3 className="insights-title">💡 Key Insights</h3>
            <div className="insights-list">
              <div className="insight-item">
                <span className="insight-icon">✅</span>
                <span className="insight-text">
                  At {inputs.hoursPerWeek} hrs/week @ ${inputs.hourlyRate}/hr, you'll earn <strong>${monthlyTotal.toLocaleString()}/month</strong>
                </span>
              </div>
              <div className="insight-item">
                <span className="insight-icon">💰</span>
                <span className="insight-text">
                  After all costs, net profit is <strong>${monthlyNet.toLocaleString()}/month</strong> or <strong>${(monthlyNet / 4.33).toFixed(0)}/week</strong>
                </span>
              </div>
              <div className="insight-item">
                <span className="insight-icon">🎯</span>
                <span className="insight-text">
                  You'll recover the initial $667 investment in just <strong>{breakEven} weeks</strong>
                </span>
              </div>
              <div className="insight-item">
                <span className="insight-icon">📈</span>
                <span className="insight-text">
                  In {inputs.months} months, you'll accumulate <strong>${sixMonthNet.toLocaleString()}</strong> in savings
                </span>
              </div>
              {inputs.hoursPerWeek < 40 && (
                <div className="insight-item warning">
                  <span className="insight-icon">⚠️</span>
                  <span className="insight-text">
                    Consider increasing hours to 48/week for optimal income and sustainability
                  </span>
                </div>
              )}
              {inputs.hourlyRate < 20 && (
                <div className="insight-item warning">
                  <span className="insight-icon">⚠️</span>
                  <span className="insight-text">
                    $20+/hr is achievable with strategic driving (peak hours, surge pricing)
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InteractiveCalculator;
