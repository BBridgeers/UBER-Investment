import React, { useState } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';
import './IncomeProjection.css';

const IncomeProjection = ({ calculations }) => {
  const [viewMode, setViewMode] = useState('monthly'); // 'monthly', 'weekly', 'cumulative'
  const [scenarioView, setScenarioView] = useState('conservative'); // 'conservative', 'moderate', 'optimistic'

  if (!calculations) return null;

  const { avis_rental } = calculations;

  // Generate weekly breakdown for first 6 weeks
  const weeklyData = Array.from({ length: 26 }, (_, i) => {
    const week = i + 1;
    const weeklyEarnings = avis_rental.weekly_earnings;
    const weeklyCosts = avis_rental.weekly_costs;
    const weeklyNet = weeklyEarnings - weeklyCosts;
    
    return {
      week: `W${week}`,
      earnings: weeklyEarnings,
      costs: week === 1 ? weeklyCosts + avis_rental.initial_investment : weeklyCosts,
      net: week === 1 ? weeklyNet - avis_rental.initial_investment : weeklyNet,
      cumulative: week === 1 ? weeklyNet - avis_rental.initial_investment : 
                  (i > 0 ? weeklyData[i-1]?.cumulative + weeklyNet : weeklyNet)
    };
  });

  // Earnings scenarios (48 hrs/week)
  const earningsScenarios = [
    {
      id: 'conservative',
      name: 'Conservative',
      hourlyRate: 20,
      weeklyUber: 48 * 20,
      monthlyUber: 48 * 20 * 4.33,
      yoga: 320,
      color: '#f87171'
    },
    {
      id: 'moderate',
      name: 'Moderate (Target)',
      hourlyRate: 23,
      weeklyUber: 48 * 23,
      monthlyUber: 48 * 23 * 4.33,
      yoga: 320,
      color: '#FFD700'
    },
    {
      id: 'optimistic',
      name: 'Optimistic',
      hourlyRate: 27,
      weeklyUber: 48 * 27,
      monthlyUber: 48 * 27 * 4.33,
      yoga: 320,
      color: '#4ade80'
    }
  ];

  const selectedScenario = earningsScenarios.find(s => s.id === scenarioView);
  const monthlyIncome = selectedScenario.monthlyUber + selectedScenario.yoga;
  const monthlyNet = monthlyIncome - avis_rental.monthly_costs;

  return (
    <div className="income-projection">
      <div className="projection-header">
        <h2 className="section-title">
          <span className="title-icon">📈</span>
          Income Projections & Timeline
        </h2>
        <p className="section-subtitle">
          Detailed earnings analysis with conservative, moderate, and optimistic scenarios
        </p>
      </div>

      {/* Earnings Scenario Selector */}
      <div className="scenario-selector">
        {earningsScenarios.map((scenario) => (
          <button
            key={scenario.id}
            className={`scenario-btn ${scenarioView === scenario.id ? 'active' : ''}`}
            onClick={() => setScenarioView(scenario.id)}
            style={{
              borderColor: scenarioView === scenario.id ? scenario.color : 'rgba(255, 255, 255, 0.2)'
            }}
          >
            <div className="scenario-btn-title">{scenario.name}</div>
            <div className="scenario-btn-rate">${scenario.hourlyRate}/hr</div>
          </button>
        ))}
      </div>

      {/* Current Scenario Summary */}
      <div className="scenario-summary-grid">
        <div className="summary-card card-3d glow-gold">
          <div className="summary-icon">💵</div>
          <div className="summary-value">${selectedScenario.weeklyUber.toLocaleString()}</div>
          <div className="summary-label">Weekly Uber Earnings</div>
          <div className="summary-detail">48 hours @ ${selectedScenario.hourlyRate}/hr</div>
        </div>

        <div className="summary-card card-3d glow-copper">
          <div className="summary-icon">📅</div>
          <div className="summary-value">${monthlyIncome.toLocaleString()}</div>
          <div className="summary-label">Total Monthly Income</div>
          <div className="summary-detail">Uber ${selectedScenario.monthlyUber.toFixed(0)} + Yoga $320</div>
        </div>

        <div className="summary-card card-3d glow-gold">
          <div className="summary-icon">💰</div>
          <div className="summary-value text-gradient-gold">${monthlyNet.toLocaleString()}</div>
          <div className="summary-label">Monthly Net Income</div>
          <div className="summary-detail">After all vehicle costs</div>
        </div>

        <div className="summary-card card-3d glow-copper">
          <div className="summary-icon">🎯</div>
          <div className="summary-value text-gradient-copper">${(monthlyNet * 6).toLocaleString()}</div>
          <div className="summary-label">6-Month Net Total</div>
          <div className="summary-detail">Accumulated savings</div>
        </div>
      </div>

      {/* View Mode Toggle */}
      <div className="chart-controls">
        <div className="view-mode-toggle">
          <button
            className={`mode-btn ${viewMode === 'weekly' ? 'active' : ''}`}
            onClick={() => setViewMode('weekly')}
          >
            Weekly View
          </button>
          <button
            className={`mode-btn ${viewMode === 'monthly' ? 'active' : ''}`}
            onClick={() => setViewMode('monthly')}
          >
            Monthly View
          </button>
          <button
            className={`mode-btn ${viewMode === 'cumulative' ? 'active' : ''}`}
            onClick={() => setViewMode('cumulative')}
          >
            Cumulative
          </button>
        </div>
      </div>

      {/* Weekly Timeline (First 6 weeks in detail) */}
      {viewMode === 'weekly' && (
        <div className="timeline-section card-3d">
          <h3 className="subsection-title">First 26 Weeks - Weekly Breakdown</h3>
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={weeklyData.slice(0, 26)}>
              <defs>
                <linearGradient id="earningsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4ade80" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#4ade80" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="costsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f87171" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#f87171" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="week" stroke="#ffffff" />
              <YAxis stroke="#ffffff" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(0, 0, 0, 0.9)',
                  border: '1px solid rgba(255, 215, 0, 0.3)',
                  borderRadius: '8px'
                }}
                formatter={(value) => `$${value.toLocaleString()}`}
              />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="earnings" 
                stroke="#4ade80" 
                fillOpacity={1} 
                fill="url(#earningsGradient)" 
                name="Earnings"
              />
              <Area 
                type="monotone" 
                dataKey="costs" 
                stroke="#f87171" 
                fillOpacity={1} 
                fill="url(#costsGradient)" 
                name="Costs"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Monthly View */}
      {viewMode === 'monthly' && (
        <div className="timeline-section card-3d">
          <h3 className="subsection-title">6-Month Projection</h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={avis_rental.projections}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis 
                dataKey="month" 
                stroke="#ffffff"
                tickFormatter={(value) => `Month ${value}`}
              />
              <YAxis stroke="#ffffff" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(0, 0, 0, 0.9)',
                  border: '1px solid rgba(255, 215, 0, 0.3)',
                  borderRadius: '8px'
                }}
                formatter={(value) => `$${value.toLocaleString()}`}
              />
              <Legend />
              <Bar dataKey="income" fill="#4ade80" name="Income" />
              <Bar dataKey="costs" fill="#f87171" name="Costs" />
              <Bar dataKey="net" fill="#FFD700" name="Net" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Cumulative View */}
      {viewMode === 'cumulative' && (
        <div className="timeline-section card-3d">
          <h3 className="subsection-title">Cumulative Savings Growth</h3>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={weeklyData}>
              <defs>
                <linearGradient id="cumulativeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FFD700" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#B87333" stopOpacity={0.3}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="week" stroke="#ffffff" />
              <YAxis stroke="#ffffff" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(0, 0, 0, 0.9)',
                  border: '1px solid rgba(255, 215, 0, 0.3)',
                  borderRadius: '8px'
                }}
                formatter={(value) => `$${value.toLocaleString()}`}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="cumulative" 
                stroke="url(#cumulativeGradient)" 
                strokeWidth={4}
                dot={{ r: 4, fill: '#FFD700' }}
                activeDot={{ r: 8 }}
                name="Cumulative Savings"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Milestones */}
      <div className="milestones-section">
        <h3 className="subsection-title">
          <span className="milestone-icon">🏆</span>
          Financial Milestones
        </h3>
        
        <div className="milestones-grid">
          <div className="milestone-card card-3d">
            <div className="milestone-number">Week 1</div>
            <div className="milestone-title">Break-Even Achieved</div>
            <div className="milestone-description">
              Initial investment of $666.86 covered by first week's earnings. 
              All subsequent weeks are pure profit.
            </div>
            <div className="milestone-value">$0 net (break-even)</div>
          </div>

          <div className="milestone-card card-3d">
            <div className="milestone-number">Month 2</div>
            <div className="milestone-title">Emergency Fund Established</div>
            <div className="milestone-description">
              Accumulated ${(monthlyNet * 2).toLocaleString()} enables $1,000-$2,000 
              emergency fund. Financial security begins.
            </div>
            <div className="milestone-value">${(monthlyNet * 2).toLocaleString()}</div>
          </div>

          <div className="milestone-card card-3d highlight">
            <div className="milestone-number">Month 3</div>
            <div className="milestone-title">Move-Out Ready</div>
            <div className="milestone-description">
              ${(monthlyNet * 3).toLocaleString()} accumulated. Sufficient for first/last 
              month rent + deposit. Independent housing achievable.
            </div>
            <div className="milestone-value text-gradient-gold">
              ${(monthlyNet * 3).toLocaleString()}
            </div>
          </div>

          <div className="milestone-card card-3d">
            <div className="milestone-number">Month 6</div>
            <div className="milestone-title">Financial Independence</div>
            <div className="milestone-description">
              ${(monthlyNet * 6).toLocaleString()} saved. Eliminated ${(650 * 6).toLocaleString()} 
              in Uber expenses. Total benefit: ${((monthlyNet + 650) * 6).toLocaleString()}.
            </div>
            <div className="milestone-value text-gradient-copper">
              ${(monthlyNet * 6).toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* All Scenarios Comparison */}
      <div className="all-scenarios-section card-3d">
        <h3 className="subsection-title">All Scenarios Comparison (48 hrs/week)</h3>
        
        <div className="scenarios-comparison-table">
          <div className="comparison-table-row table-header">
            <div className="table-cell">Scenario</div>
            <div className="table-cell">Hourly Rate</div>
            <div className="table-cell">Weekly Uber</div>
            <div className="table-cell">Monthly Total</div>
            <div className="table-cell">Monthly Net</div>
            <div className="table-cell">6-Month Net</div>
          </div>

          {earningsScenarios.map((scenario) => {
            const monthlyTotal = scenario.monthlyUber + scenario.yoga;
            const net = monthlyTotal - avis_rental.monthly_costs;
            const sixMonthNet = net * 6;

            return (
              <div 
                key={scenario.id} 
                className={`comparison-table-row ${scenarioView === scenario.id ? 'selected' : ''}`}
              >
                <div className="table-cell scenario-name">{scenario.name}</div>
                <div className="table-cell">${scenario.hourlyRate}/hr</div>
                <div className="table-cell">${scenario.weeklyUber.toLocaleString()}</div>
                <div className="table-cell">${monthlyTotal.toLocaleString()}</div>
                <div className="table-cell net-value">${net.toLocaleString()}</div>
                <div className="table-cell total-value">${sixMonthNet.toLocaleString()}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default IncomeProjection;
