import React, { useState } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './FinancialComparison.css';

const FinancialComparison = ({ calculations }) => {
  const [viewMode, setViewMode] = useState('monthly'); // 'monthly' or 'cumulative'

  if (!calculations) return null;

  const { avis_rental, beater_car, hybrid } = calculations;

  // Prepare chart data
  const monthlyData = avis_rental.projections.map((month, index) => ({
    month: `Month ${month.month}`,
    AVIS: avis_rental.projections[index].net,
    Beater: beater_car.projections[index].net,
    Hybrid: hybrid.projections[index].net
  }));

  const cumulativeData = avis_rental.projections.map((month, index) => ({
    month: `Month ${month.month}`,
    AVIS: avis_rental.projections[index].cumulative,
    Beater: beater_car.projections[index].cumulative,
    Hybrid: hybrid.projections[index].cumulative
  }));

  const costBreakdown = [
    {
      name: 'AVIS Rental',
      'Initial Investment': avis_rental.initial_investment,
      'Weekly Costs': avis_rental.weekly_costs * 4.33,
      'Monthly Net': avis_rental.monthly_net
    },
    {
      name: 'Beater Car',
      'Initial Investment': beater_car.initial_investment,
      'Weekly Costs': beater_car.weekly_costs * 4.33,
      'Monthly Net': beater_car.monthly_net
    },
    {
      name: 'Hybrid',
      'Initial Investment': hybrid.initial_investment,
      'Weekly Costs': hybrid.weekly_costs * 4.33,
      'Monthly Net': hybrid.monthly_net
    }
  ];

  return (
    <div className="financial-comparison">
      <div className="comparison-header">
        <h2 className="section-title">
          <span className="title-icon">💰</span>
          Financial Comparison Analysis
        </h2>
        <p className="section-subtitle">
          Comprehensive cost-benefit analysis of three transportation independence strategies
        </p>
      </div>

      {/* Cost Breakdown Chart */}
      <div className="chart-section card-3d">
        <h3 className="chart-title">Cost & Net Income Breakdown</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={costBreakdown}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="name" stroke="#ffffff" />
            <YAxis stroke="#ffffff" />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'rgba(0, 0, 0, 0.9)',
                border: '1px solid rgba(255, 215, 0, 0.3)',
                borderRadius: '8px'
              }}
            />
            <Legend />
            <Bar dataKey="Initial Investment" fill="#B87333" />
            <Bar dataKey="Weekly Costs" fill="#FFD700" />
            <Bar dataKey="Monthly Net" fill="#4ade80" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Timeline Comparison */}
      <div className="chart-section card-3d">
        <div className="chart-header">
          <h3 className="chart-title">6-Month Financial Timeline</h3>
          <div className="view-toggle">
            <button 
              className={`toggle-btn ${viewMode === 'monthly' ? 'active' : ''}`}
              onClick={() => setViewMode('monthly')}
            >
              Monthly Net
            </button>
            <button 
              className={`toggle-btn ${viewMode === 'cumulative' ? 'active' : ''}`}
              onClick={() => setViewMode('cumulative')}
            >
              Cumulative
            </button>
          </div>
        </div>
        
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={viewMode === 'monthly' ? monthlyData : cumulativeData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="month" stroke="#ffffff" />
            <YAxis stroke="#ffffff" />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'rgba(0, 0, 0, 0.9)',
                border: '1px solid rgba(255, 215, 0, 0.3)',
                borderRadius: '8px'
              }}
            />
            <Legend />
            <Line type="monotone" dataKey="AVIS" stroke="#FFD700" strokeWidth={3} dot={{ r: 6 }} />
            <Line type="monotone" dataKey="Beater" stroke="#f87171" strokeWidth={2} dot={{ r: 4 }} />
            <Line type="monotone" dataKey="Hybrid" stroke="#B87333" strokeWidth={2} dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Detailed Comparison Table */}
      <div className="comparison-table-section card-3d">
        <h3 className="chart-title">Detailed Financial Metrics</h3>
        
        <div className="comparison-table">
          <div className="table-row table-header">
            <div className="table-cell">Metric</div>
            <div className="table-cell">AVIS Rental</div>
            <div className="table-cell">Beater Car</div>
            <div className="table-cell">Hybrid</div>
          </div>

          <div className="table-row">
            <div className="table-cell metric-label">Initial Investment</div>
            <div className="table-cell">${avis_rental.initial_investment.toFixed(2)}</div>
            <div className="table-cell">${beater_car.initial_investment.toLocaleString()}</div>
            <div className="table-cell">${hybrid.initial_investment.toLocaleString()}</div>
          </div>

          <div className="table-row">
            <div className="table-cell metric-label">Weekly Costs</div>
            <div className="table-cell">${avis_rental.weekly_costs.toFixed(2)}</div>
            <div className="table-cell">${beater_car.weekly_costs.toFixed(2)}</div>
            <div className="table-cell">${hybrid.weekly_costs.toFixed(2)}</div>
          </div>

          <div className="table-row">
            <div className="table-cell metric-label">Monthly Costs</div>
            <div className="table-cell">${avis_rental.monthly_costs.toFixed(2)}</div>
            <div className="table-cell">${beater_car.monthly_costs.toFixed(2)}</div>
            <div className="table-cell">${hybrid.monthly_costs.toFixed(2)}</div>
          </div>

          <div className="table-row">
            <div className="table-cell metric-label">Monthly Earnings</div>
            <div className="table-cell">${avis_rental.monthly_earnings.toFixed(2)}</div>
            <div className="table-cell">${beater_car.monthly_earnings.toFixed(2)}</div>
            <div className="table-cell">${hybrid.monthly_earnings.toFixed(2)}</div>
          </div>

          <div className="table-row highlight">
            <div className="table-cell metric-label">Monthly Net Income</div>
            <div className="table-cell positive">${avis_rental.monthly_net.toFixed(2)}</div>
            <div className="table-cell negative">${beater_car.monthly_net.toFixed(2)}</div>
            <div className="table-cell negative">${hybrid.monthly_net.toFixed(2)}</div>
          </div>

          <div className="table-row highlight">
            <div className="table-cell metric-label">6-Month Net Total</div>
            <div className="table-cell positive bold">${avis_rental.six_month_net.toLocaleString()}</div>
            <div className="table-cell negative bold">${beater_car.six_month_net.toLocaleString()}</div>
            <div className="table-cell negative bold">${hybrid.six_month_net.toLocaleString()}</div>
          </div>

          <div className="table-row">
            <div className="table-cell metric-label">Break-Even (weeks)</div>
            <div className="table-cell">{avis_rental.break_even_weeks}</div>
            <div className="table-cell">N/A (negative)</div>
            <div className="table-cell">N/A (negative)</div>
          </div>

          <div className="table-row">
            <div className="table-cell metric-label">Uber Expenses Eliminated</div>
            <div className="table-cell">${avis_rental.total_uber_eliminated.toLocaleString()}</div>
            <div className="table-cell">${beater_car.total_uber_eliminated.toLocaleString()}</div>
            <div className="table-cell">${hybrid.total_uber_eliminated.toLocaleString()}</div>
          </div>

          <div className="table-row highlight">
            <div className="table-cell metric-label">Total Financial Benefit</div>
            <div className="table-cell positive bold">${avis_rental.total_benefit.toLocaleString()}</div>
            <div className="table-cell">${beater_car.total_benefit.toLocaleString()}</div>
            <div className="table-cell">${hybrid.total_benefit.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Winner Announcement */}
      <div className="winner-section card-3d glow-gold">
        <div className="winner-icon">🏆</div>
        <h3 className="winner-title">Clear Winner: AVIS Mach-E Rental</h3>
        <div className="winner-stats">
          <div className="winner-stat">
            <div className="stat-value text-gradient-gold">
              ${(avis_rental.six_month_net - beater_car.six_month_net).toLocaleString()}
            </div>
            <div className="stat-label">Advantage over Beater Car (6 months)</div>
          </div>
          <div className="winner-stat">
            <div className="stat-value text-gradient-gold">
              ${(avis_rental.six_month_net - hybrid.six_month_net).toLocaleString()}
            </div>
            <div className="stat-label">Advantage over Hybrid (6 months)</div>
          </div>
        </div>
        <p className="winner-description">
          The AVIS Mach-E rental strategy delivers superior financial outcomes across every metric:
          lowest initial investment, highest monthly net income, fastest break-even, and greatest long-term profit.
        </p>
      </div>
    </div>
  );
};

export default FinancialComparison;
