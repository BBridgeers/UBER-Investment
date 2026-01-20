import React from 'react';
import './ExecutiveSummary.css';

const ExecutiveSummary = ({ calculations, defaultData }) => {
  if (!calculations || !defaultData) return null;

  const { avis_rental, beater_car, hybrid, comparison } = calculations;

  const scenarios = [
    {
      id: 'avis',
      name: 'AVIS Mach-E Rental',
      recommended: true,
      data: avis_rental,
      icon: '🚗',
      color: 'gold'
    },
    {
      id: 'beater',
      name: 'Personal $4k Beater',
      recommended: false,
      data: beater_car,
      icon: '🚙',
      color: 'copper'
    },
    {
      id: 'hybrid',
      name: 'Hybrid Approach',
      recommended: false,
      data: hybrid,
      icon: '🔄',
      color: 'white'
    }
  ];

  return (
    <div className="executive-summary">
      {/* Hero Section */}
      <div className="hero-section">
        <div className="hero-content">
          <div className="hero-badge">
            ✨ Investment Opportunity
          </div>
          <h1 className="hero-title">
            Break Free from Transportation Dependency
          </h1>
          <p className="hero-subtitle">
            A data-driven analysis of three pathways to vehicle independence, income generation, and psychological wellbeing
          </p>
          
          <div className="hero-stats">
            <div className="hero-stat-card card-3d glow-gold">
              <div className="stat-number">${avis_rental.initial_investment.toFixed(2)}</div>
              <div className="stat-label">Initial Investment Required</div>
              <div className="stat-detail">One-time upfront cost</div>
            </div>
            <div className="hero-stat-card card-3d glow-gold">
              <div className="stat-number text-gradient-gold">
                ${avis_rental.six_month_net.toLocaleString()}
              </div>
              <div className="stat-label">6-Month Net Profit</div>
              <div className="stat-detail">AVIS Rental Strategy</div>
            </div>
            <div className="hero-stat-card card-3d glow-copper">
              <div className="stat-number">
                {avis_rental.break_even_weeks} weeks
              </div>
              <div className="stat-label">Break-Even Point</div>
              <div className="stat-detail">ROI achieved quickly</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Comparison */}
      <div className="comparison-grid">
        {scenarios.map(scenario => (
          <div 
            key={scenario.id}
            className={`comparison-card card-3d ${
              scenario.recommended ? 'recommended glow-gold' : ''
            }`}
          >
            {scenario.recommended && (
              <div className="recommended-badge">
                ⭐ RECOMMENDED
              </div>
            )}
            
            <div className="card-header">
              <div className="card-icon">{scenario.icon}</div>
              <h3 className="card-title">{scenario.name}</h3>
            </div>

            <div className="card-metrics">
              <div className="metric">
                <div className="metric-label">Initial Cost</div>
                <div className="metric-value">
                  ${scenario.data.initial_investment.toLocaleString()}
                </div>
              </div>
              
              <div className="metric">
                <div className="metric-label">Monthly Costs</div>
                <div className="metric-value">
                  ${scenario.data.monthly_costs.toFixed(0)}
                </div>
              </div>
              
              <div className="metric">
                <div className="metric-label">Monthly Net</div>
                <div className={`metric-value ${
                  scenario.data.monthly_net > 0 ? 'positive' : 'negative'
                }`}>
                  ${scenario.data.monthly_net.toFixed(0)}
                </div>
              </div>
              
              <div className="metric highlight">
                <div className="metric-label">6-Month Total</div>
                <div className={`metric-value large ${
                  scenario.data.six_month_net > 0 ? 'positive' : 'negative'
                }`}>
                  ${scenario.data.six_month_net.toLocaleString()}
                </div>
              </div>
            </div>

            {scenario.id === 'avis' && (
              <div className="card-benefits">
                <div className="benefit-item">
                  ✅ Includes insurance & maintenance
                </div>
                <div className="benefit-item">
                  ✅ Zero credit check via Uber Pro Card
                </div>
                <div className="benefit-item">
                  ✅ Self-sustaining after Week 1
                </div>
                <div className="benefit-item">
                  ✅ Electric vehicle (low fuel costs)
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Key Insights */}
      <div className="insights-section">
        <h2 className="section-title">
          <span className="title-icon">💡</span>
          Key Financial Insights
        </h2>
        
        <div className="insights-grid">
          <div className="insight-card card-3d">
            <div className="insight-number text-gradient-gold">
              ${comparison.avis_advantage_vs_beater.toLocaleString()}
            </div>
            <div className="insight-label">
              AVIS Advantage vs. Personal Vehicle
            </div>
            <div className="insight-detail">
              Additional savings over 6 months by choosing AVIS rental strategy
            </div>
          </div>

          <div className="insight-card card-3d">
            <div className="insight-number text-gradient-copper">
              ${avis_rental.total_uber_eliminated.toLocaleString()}
            </div>
            <div className="insight-label">
              Current Uber Expenses Eliminated
            </div>
            <div className="insight-detail">
              Savings from no longer spending $500-800/month on Uber rides
            </div>
          </div>

          <div className="insight-card card-3d">
            <div className="insight-number text-gradient-gold">
              ${avis_rental.total_benefit.toLocaleString()}
            </div>
            <div className="insight-label">
              Total Financial Benefit
            </div>
            <div className="insight-detail">
              Net profit + eliminated Uber expenses over 6 months
            </div>
          </div>
        </div>
      </div>

      {/* Current Situation */}
      <div className="current-situation-section">
        <h2 className="section-title">
          <span className="title-icon">🚨</span>
          Current Transportation Crisis
        </h2>
        
        <div className="situation-grid">
          <div className="situation-card card-3d">
            <div className="situation-icon">💸</div>
            <h3 className="situation-title">Financial Drain</h3>
            <div className="situation-stat">$500-800/month</div>
            <p className="situation-text">
              Monthly Uber expenses represent 156-250% of current yoga studio income ($320/month). 
              Average $33 per trip serves as sole means of mobility, limiting employment access and independence.
            </p>
          </div>

          <div className="situation-card card-3d">
            <div className="situation-icon">🚫</div>
            <h3 className="situation-title">Employment Barriers</h3>
            <div className="situation-stat">84% impact rate</div>
            <p className="situation-text">
              Lack of vehicle creates self-reinforcing cycle. Job applications require misrepresenting 
              vehicle ownership. 84% of low-income non-car owners report turning down opportunities due to transportation.
            </p>
          </div>

          <div className="situation-card card-3d">
            <div className="situation-icon">🔒</div>
            <h3 className="situation-title">Mental Prison</h3>
            <div className="situation-stat">2 years trapped</div>
            <p className="situation-text">
              Two years without vehicle independence creates felt sense of being trapped, requiring parental 
              approval for mobility, experiencing burden identity. Research confirms car ownership reduces depression 
              independent of income.
            </p>
          </div>
        </div>
      </div>

      {/* Recommendation */}
      <div className="recommendation-section">
        <div className="recommendation-card card-3d glow-gold">
          <div className="recommendation-header">
            <div className="recommendation-icon">🎯</div>
            <h2 className="recommendation-title">Recommended Strategy</h2>
          </div>
          
          <div className="recommendation-content">
            <h3 className="recommendation-option">AVIS Mach-E Rental (48 hrs/week)</h3>
            
            <div className="recommendation-reasons">
              <div className="reason">
                <div className="reason-icon">✔️</div>
                <div className="reason-content">
                  <div className="reason-title">Financial Superiority</div>
                  <div className="reason-text">
                    ${avis_rental.six_month_net.toLocaleString()} net profit in 6 months vs. 
                    negative ${Math.abs(beater_car.six_month_net).toLocaleString()} loss with personal vehicle
                  </div>
                </div>
              </div>

              <div className="reason">
                <div className="reason-icon">✔️</div>
                <div className="reason-content">
                  <div className="reason-title">Immediate Sustainability</div>
                  <div className="reason-text">
                    Self-sustaining after Week 1. First ${avis_rental.weekly_earnings.toFixed(0)} in earnings 
                    covers ${avis_rental.weekly_costs.toFixed(0)} weekly costs with ${(avis_rental.weekly_earnings - avis_rental.weekly_costs).toFixed(0)} surplus
                  </div>
                </div>
              </div>

              <div className="reason">
                <div className="reason-icon">✔️</div>
                <div className="reason-content">
                  <div className="reason-title">Zero Risk Approval</div>
                  <div className="reason-text">
                    Uber Pro Card bypasses credit checks entirely. No approval barrier despite poor credit status. 
                    Guaranteed vehicle access.
                  </div>
                </div>
              </div>

              <div className="reason">
                <div className="reason-icon">✔️</div>
                <div className="reason-content">
                  <div className="reason-title">Psychological Liberation</div>
                  <div className="reason-text">
                    Breaks 2-year "mental prison" immediately. Eliminates parental dependence. 
                    Enables honest job applications and expanded opportunity access.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExecutiveSummary;
