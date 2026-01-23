import React, { useState } from 'react';
import CountUp from 'react-countup';
import './PsychologicalBenefits.css';

const PsychologicalBenefits = ({ benefits }) => {
  const [selectedBenefit, setSelectedBenefit] = useState(null);

  // Additional impact metrics
  const impactMetrics = [
    {
      icon: '💼',
      value: 67,
      suffix: '%',
      label: 'Increased Job Access',
      description: 'With vehicle ownership',
      color: '#4ade80'
    },
    {
      icon: '📈',
      value: 2.7,
      suffix: 'x',
      label: 'More Opportunities Available',
      description: 'Compared to non-vehicle owners',
      color: '#FFD700'
    },
    {
      icon: '🧠',
      value: 2.3,
      suffix: '% - 3.3%',
      label: 'Wellbeing Improvement',
      description: 'Independent of income level',
      color: '#60a5fa'
    },
    {
      icon: '⏰',
      value: 1,
      suffix: ' week',
      label: 'Freedom Achieved',
      description: 'Break-even to independence',
      color: '#B87333'
    }
  ];

  const lifeImprovements = [
    {
      category: 'Personal Freedom',
      icon: '🗽',
      improvements: [
        'Eliminate parental dependence for mobility',
        'Freedom to leave home without approval',
        'Access to social opportunities independently',
        'Ability to respond to emergencies immediately'
      ],
      color: '#FFD700'
    },
    {
      category: 'Professional Growth',
      icon: '💼',
      improvements: [
        'Honest job applications (no vehicle misrepresentation)',
        'Access to 2.7x more employment opportunities',
        'Ability to accept last-minute shifts',
        'Professional credibility and reliability'
      ],
      color: '#4ade80'
    },
    {
      category: 'Family Relationships',
      icon: '👨‍👩‍👦',
      improvements: [
        'Reduce burden on parents for transportation',
        'Demonstrate financial independence capability',
        'Enable helping family with errands/tasks',
        'Build foundation for supporting parents later'
      ],
      color: '#B87333'
    },
    {
      category: 'Mental Wellbeing',
      icon: '🧘',
      improvements: [
        'Achieve transportation independence and freedom',
        'Build confidence through financial self-sufficiency',
        'Increase sense of control over life direction',
        'Strengthen mental resilience through achievement'
      ],
      color: '#60a5fa'
    }
  ];

  return (
    <div className="psychological-benefits">
      <div className="benefits-header">
        <h2 className="section-title">
          <span className="title-icon">🧠</span>
          Psychological & Life Quality Impact
        </h2>
        <p className="section-subtitle">
          Research-backed analysis of non-financial benefits from transportation independence
        </p>
      </div>

      {/* Impact Metrics Grid */}
      <div className="impact-metrics-grid">
        {impactMetrics.map((metric, index) => (
          <div 
            key={index} 
            className="metric-card card-3d"
            style={{ borderColor: `${metric.color}40` }}
          >
            <div className="metric-icon" style={{ fontSize: '3rem' }}>
              {metric.icon}
            </div>
            <div className="metric-value" style={{ color: metric.color }}>
              <CountUp 
                end={metric.value} 
                duration={2.5}
                decimals={metric.value % 1 !== 0 ? 1 : 0}
                suffix={metric.suffix}
              />
            </div>
            <div className="metric-label">{metric.label}</div>
            <div className="metric-description">{metric.description}</div>
          </div>
        ))}
      </div>

      {/* Research-Backed Benefits */}
      <div className="research-section">
        <h3 className="subsection-title">
          <span className="research-icon">🔬</span>
          Research-Validated Benefits
        </h3>
        
        <div className="research-grid">
          {benefits.map((benefit, index) => (
            <div 
              key={index} 
              className={`research-card card-3d ${
                selectedBenefit === index ? 'expanded' : ''
              }`}
              onClick={() => setSelectedBenefit(selectedBenefit === index ? null : index)}
            >
              <div className="research-header">
                <div className="research-badge">RESEARCH-BACKED</div>
                <h4 className="research-title">{benefit.title}</h4>
              </div>

              <div className="research-stat-display">
                {benefit.stat}
              </div>

              <p className="research-description">{benefit.description}</p>

              <div className="research-source">
                <span className="source-icon">📚</span>
                <span className="source-text">{benefit.source}</span>
              </div>

              {selectedBenefit === index && (
                <div className="research-expanded">
                  <div className="expanded-divider"></div>
                  <div className="expanded-content">
                    <h5>Real-World Application:</h5>
                    {benefit.title === 'Employment Access' && (
                      <ul>
                        <li>Current foundation: Yoga studio position ($320/month)</li>
                        <li>Vehicle enables honest, confident job applications</li>
                        <li>Access to higher income opportunities opens up</li>
                        <li>Professional flexibility and reliability established</li>
                      </ul>
                    )}
                    {benefit.title === 'Mental Health Impact' && (
                      <ul>
                        <li>Vehicle ownership restores autonomy and control</li>
                        <li>Independence creates positive psychological shift</li>
                        <li>Confidence building through self-sufficiency</li>
                        <li>Research-proven wellbeing improvement</li>
                      </ul>
                    )}
                    {benefit.title === 'Breaking Mental Prison' && (
                      <ul>
                        <li>Spontaneity and flexibility return to daily life</li>
                        <li>Independent decision-making capability restored</li>
                        <li>Freedom to pursue opportunities immediately</li>
                        <li>Vehicle unlocks physical and psychological growth</li>
                      </ul>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Life Improvements Matrix */}
      <div className="improvements-section">
        <h3 className="subsection-title">
          <span className="improvements-icon">✨</span>
          Comprehensive Life Quality Improvements
        </h3>
        
        <div className="improvements-grid">
          {lifeImprovements.map((category, index) => (
            <div 
              key={index} 
              className="improvement-category card-3d"
              style={{ borderLeftColor: category.color }}
            >
              <div className="category-header">
                <div className="category-icon">{category.icon}</div>
                <h4 className="category-title">{category.category}</h4>
              </div>

              <ul className="improvements-list">
                {category.improvements.map((improvement, idx) => (
                  <li key={idx} className="improvement-item">
                    <span className="check-icon">✓</span>
                    <span className="improvement-text">{improvement}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Timeline of Psychological Benefits */}
      <div className="psych-timeline-section card-3d">
        <h3 className="subsection-title">
          <span className="timeline-icon">📅</span>
          Timeline of Psychological Transformation
        </h3>
        
        <div className="psych-timeline">
          <div className="timeline-item">
            <div className="timeline-marker" style={{ background: '#4ade80' }}>
              Day 1
            </div>
            <div className="timeline-content">
              <h5>Immediate Liberation</h5>
              <p>
                Physical freedom achieved. Independent mobility restored. 
                First experience of autonomous decision-making creates immediate confidence boost.
              </p>
            </div>
          </div>

          <div className="timeline-item">
            <div className="timeline-marker" style={{ background: '#FFD700' }}>
              Week 1
            </div>
            <div className="timeline-content">
              <h5>Confidence Building</h5>
              <p>
                First successful week of self-sustaining income. Demonstrating capability to yourself 
                and family. Confidence in your abilities grows with each day.
              </p>
            </div>
          </div>

          <div className="timeline-item">
            <div className="timeline-marker" style={{ background: '#B87333' }}>
              Month 1
            </div>
            <div className="timeline-content">
              <h5>Identity Shift</h5>
              <p>
                Professional driver status established. Contributing family member identity. 
                Helping family financially while building your own future.
              </p>
            </div>
          </div>

          <div className="timeline-item">
            <div className="timeline-marker" style={{ background: '#60a5fa' }}>
              Month 3
            </div>
            <div className="timeline-content">
              <h5>Future Planning Enabled</h5>
              <p>
                Accumulated savings enable thinking about growth opportunities. 
                Planning for independent housing, career advancement, and personal goals becomes reality.
              </p>
            </div>
          </div>

          <div className="timeline-item">
            <div className="timeline-marker" style={{ background: '#a78bfa' }}>
              Month 6
            </div>
            <div className="timeline-content">
              <h5>Complete Transformation</h5>
              <p>
                From dependent to independent and thriving. Established track record 
                of financial responsibility. Ready for next life chapter with proven capability and confidence.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Father's Perspective */}
      <div className="father-perspective-section card-3d glow-gold">
        <div className="perspective-header">
          <div className="perspective-icon">👨‍👦</div>
          <h3 className="perspective-title">Investment in Your Son's Future: Beyond the Numbers</h3>
        </div>
        
        <div className="perspective-content">
          <div className="perspective-block">
            <h4>What You're Really Investing In:</h4>
            <ul className="perspective-list">
              <li>
                <strong>Launching independence:</strong> Your son gains vehicle 
                independence immediately, establishing foundation for self-sufficiency.
              </li>
              <li>
                <strong>Demonstrating capability:</strong> $686.86 provides the opportunity to prove 
                financial responsibility. First week shows promise, six months confirms success.
              </li>
              <li>
                <strong>Strengthening family bonds:</strong> Becoming financially independent allows 
                him to contribute to the family and eventually provide support.
              </li>
              <li>
                <strong>Wellbeing investment:</strong> Research proves vehicle ownership improves mental health. 
                You're investing in your son's psychological growth, not just transportation.
              </li>
              <li>
                <strong>Opportunity access:</strong> Vehicle ownership increases employment opportunities 
                by 2.7x, opening doors to career advancement and growth.
              </li>
            </ul>
          </div>

          <div className="perspective-roi">
            <h4>Return on Investment (Personal):</h4>
            <div className="roi-grid">
              <div className="roi-item">
                <div className="roi-icon">🎯</div>
                <div className="roi-text">
                  <strong>Week 1:</strong> See immediate results. He's working, earning, self-sustaining.
                </div>
              </div>
              <div className="roi-item">
                <div className="roi-icon">💪</div>
                <div className="roi-text">
                  <strong>Month 1:</strong> Witness confidence transformation. No longer burden on parents.
                </div>
              </div>
              <div className="roi-item">
                <div className="roi-icon">🏠</div>
                <div className="roi-text">
                  <strong>Month 3:</strong> Path to independent housing clear. Adult independence achieved.
                </div>
              </div>
              <div className="roi-item">
                <div className="roi-icon">🚀</div>
                <div className="roi-text">
                  <strong>Month 6:</strong> Fully transformed life. Your investment launched his future.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PsychologicalBenefits;
