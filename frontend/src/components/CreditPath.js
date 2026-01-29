import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';
import './CreditPath.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';

const CreditPath = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedScenario, setSelectedScenario] = useState('scenario_b');
    const [expandedSections, setExpandedSections] = useState({
        scoreProjection: true,
        financialFlow: false,
        timeline: false,
        checklist: true,
        templates: false,
        milestones: true,
        contacts: false
    });
    const [checkedItems, setCheckedItems] = useState(() => {
        const saved = localStorage.getItem('creditPathChecklist');
        return saved ? JSON.parse(saved) : {};
    });

    useEffect(() => {
        fetchCreditPathData();
    }, []);

    useEffect(() => {
        localStorage.setItem('creditPathChecklist', JSON.stringify(checkedItems));
    }, [checkedItems]);

    const fetchCreditPathData = async () => {
        try {
            const response = await fetch(`${BACKEND_URL}/api/credit-path`);
            if (!response.ok) throw new Error('Failed to fetch credit path data');
            const result = await response.json();
            setData(result);
            setLoading(false);
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    };

    const toggleSection = (section) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    const toggleCheckItem = (itemId) => {
        setCheckedItems(prev => ({
            ...prev,
            [itemId]: !prev[itemId]
        }));
    };

    const getChecklistProgress = () => {
        if (!data?.checklist) return { completed: 0, total: 0, percentage: 0 };
        const allItems = data.checklist.flatMap(week => week.items);
        const completed = allItems.filter(item => checkedItems[item.id]).length;
        return {
            completed,
            total: allItems.length,
            percentage: Math.round((completed / allItems.length) * 100)
        };
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
    };

    if (loading) {
        return (
            <div className="credit-path loading">
                <div className="loading-spinner"></div>
                <p>Loading Credit Path data...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="credit-path error">
                <p>Error: {error}</p>
                <button onClick={fetchCreditPathData}>Retry</button>
            </div>
        );
    }

    const progress = getChecklistProgress();
    const chartData = data?.credit_projections?.[selectedScenario]?.data?.map(d => ({
        period: d.period,
        scoreLow: d.score_low,
        scoreHigh: d.score_high,
        scoreAvg: (d.score_low + d.score_high) / 2
    })) || [];

    return (
        <div className="credit-path">
            {/* Header */}
            <div className="credit-path-header">
                <h2 className="section-title">
                    <span className="title-icon">📈</span>
                    90-Day Credit Path
                </h2>
                <p className="section-subtitle">
                    Your roadmap from {data?.credit_projections?.scenario_a?.data?.[0]?.score_low || 586} → {data?.credit_projections?.scenario_a?.data?.[5]?.score_high || 720}+ credit score
                </p>
                <div className="progress-summary">
                    <div className="progress-bar-container">
                        <div className="progress-bar" style={{ width: `${progress.percentage}%` }}></div>
                    </div>
                    <span className="progress-text">{progress.completed}/{progress.total} tasks completed ({progress.percentage}%)</span>
                </div>
            </div>

            {/* Phase Cards */}
            <div className="phase-cards-container">
                {data?.phases?.map((phase, index) => (
                    <div
                        key={index}
                        className="phase-card card-3d"
                        style={{ borderColor: phase.color }}
                    >
                        <div className="phase-header">
                            <span className="phase-icon">{phase.icon}</span>
                            <span className="phase-number">Phase {phase.phase}</span>
                        </div>
                        <h3 className="phase-name" style={{ color: phase.color }}>{phase.name}</h3>
                        <p className="phase-days">{phase.days}</p>
                        <p className="phase-impact">{phase.score_impact}</p>
                        <p className="phase-description">{phase.description}</p>
                    </div>
                ))}
            </div>

            {/* Credit Score Projection */}
            <div className="collapsible-section card-3d">
                <div
                    className="section-header"
                    onClick={() => toggleSection('scoreProjection')}
                >
                    <h3>📊 Credit Score Projection</h3>
                    <span className={`toggle-icon ${expandedSections.scoreProjection ? 'expanded' : ''}`}>▼</span>
                </div>
                {expandedSections.scoreProjection && (
                    <div className="section-content">
                        <div className="scenario-toggle">
                            <button
                                className={`toggle-btn ${selectedScenario === 'scenario_a' ? 'active' : ''}`}
                                onClick={() => setSelectedScenario('scenario_a')}
                            >
                                Standard Path
                            </button>
                            <button
                                className={`toggle-btn ${selectedScenario === 'scenario_b' ? 'active' : ''}`}
                                onClick={() => setSelectedScenario('scenario_b')}
                            >
                                Dual Tradeline Path ⭐
                            </button>
                        </div>
                        <p className="scenario-description">
                            {data?.credit_projections?.[selectedScenario]?.description}
                            {data?.credit_projections?.[selectedScenario]?.recommended && (
                                <span className="recommended-badge">Recommended</span>
                            )}
                        </p>
                        <div className="chart-container">
                            <ResponsiveContainer width="100%" height={300}>
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#FFD700" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#FFD700" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                    <XAxis dataKey="period" stroke="#ffffff" />
                                    <YAxis domain={[550, 750]} stroke="#ffffff" />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'rgba(0, 0, 0, 0.9)',
                                            border: '1px solid rgba(255, 215, 0, 0.3)',
                                            borderRadius: '8px'
                                        }}
                                        formatter={(value, name) => [value, name === 'scoreAvg' ? 'Score' : name]}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="scoreAvg"
                                        stroke="#FFD700"
                                        fill="url(#scoreGradient)"
                                        strokeWidth={3}
                                    />
                                    <Line type="monotone" dataKey="scoreLow" stroke="#B87333" strokeDasharray="5 5" />
                                    <Line type="monotone" dataKey="scoreHigh" stroke="#4ade80" strokeDasharray="5 5" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Comparison Table */}
                        <div className="comparison-table">
                            <h4>Scenario Comparison</h4>
                            <table>
                                <thead>
                                    <tr>
                                        <th>Timeframe</th>
                                        <th>Standard Path</th>
                                        <th>Dual Tradeline</th>
                                        <th>Advantage</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data?.credit_projections?.comparison?.map((row, i) => (
                                        <tr key={i}>
                                            <td>{row.timeframe}</td>
                                            <td>{row.scenario_a}</td>
                                            <td>{row.scenario_b}</td>
                                            <td className="advantage">{row.difference}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Financial Flow */}
            <div className="collapsible-section card-3d">
                <div
                    className="section-header"
                    onClick={() => toggleSection('financialFlow')}
                >
                    <h3>💰 Financial Flow</h3>
                    <span className={`toggle-icon ${expandedSections.financialFlow ? 'expanded' : ''}`}>▼</span>
                </div>
                {expandedSections.financialFlow && (
                    <div className="section-content">
                        {/* Weekly Cycle */}
                        <div className="flow-subsection">
                            <h4>Weekly Cycle</h4>
                            <div className="weekly-cycle-table">
                                {data?.financial_flow?.weekly_cycle?.map((row, i) => (
                                    <div key={i} className="cycle-row">
                                        <span className="cycle-day">{row.day}</span>
                                        <span className="cycle-action">{row.action}</span>
                                        <span className="cycle-account">{row.your_account}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Income Breakdown */}
                        <div className="flow-subsection">
                            <h4>Income Breakdown</h4>
                            <div className="income-grid">
                                {data?.financial_flow?.income_breakdown?.map((scenario, i) => (
                                    <div key={i} className={`income-card ${scenario.scenario.toLowerCase()}`}>
                                        <h5>{scenario.scenario}</h5>
                                        <div className="income-stat">
                                            <span className="stat-label">Hourly Rate</span>
                                            <span className="stat-value">${scenario.hourly_rate}/hr</span>
                                        </div>
                                        <div className="income-stat">
                                            <span className="stat-label">Weekly Gross</span>
                                            <span className="stat-value">${scenario.weekly_gross.toLocaleString()}</span>
                                        </div>
                                        <div className="income-stat">
                                            <span className="stat-label">Weekly Net</span>
                                            <span className="stat-value highlight">${scenario.weekly_net.toLocaleString()}</span>
                                        </div>
                                        <div className="income-stat">
                                            <span className="stat-label">Monthly Net</span>
                                            <span className="stat-value highlight">${scenario.monthly_net.toLocaleString()}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Expense Breakdown */}
                        <div className="flow-subsection">
                            <h4>Weekly Expenses</h4>
                            <div className="expense-breakdown">
                                <div className="expense-item">
                                    <span>Rental</span>
                                    <span>${data?.financial_flow?.expense_breakdown?.rental}</span>
                                </div>
                                <div className="expense-item">
                                    <span>Charging</span>
                                    <span>${data?.financial_flow?.expense_breakdown?.charging}</span>
                                </div>
                                <div className="expense-item">
                                    <span>Buffer</span>
                                    <span>${data?.financial_flow?.expense_breakdown?.buffer}</span>
                                </div>
                                <div className="expense-item total">
                                    <span>Total Weekly</span>
                                    <span>${data?.financial_flow?.expense_breakdown?.total_weekly}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Weekly Timeline */}
            <div className="collapsible-section card-3d">
                <div
                    className="section-header"
                    onClick={() => toggleSection('timeline')}
                >
                    <h3>📅 Weekly Timeline</h3>
                    <span className={`toggle-icon ${expandedSections.timeline ? 'expanded' : ''}`}>▼</span>
                </div>
                {expandedSections.timeline && (
                    <div className="section-content">
                        <div className="timeline-container">
                            {data?.checklist?.map((week, weekIndex) => (
                                <div key={weekIndex} className="timeline-week">
                                    <div className="week-header">
                                        <span className="week-marker">{weekIndex + 1}</span>
                                        <div className="week-info">
                                            <h4>{week.week}</h4>
                                            <p>{week.title}</p>
                                        </div>
                                    </div>
                                    <ul className="week-actions">
                                        {week.items.map((item, i) => (
                                            <li key={i} className={item.critical ? 'critical' : ''}>
                                                {item.critical && <span className="critical-badge">⚠️</span>}
                                                {item.text}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Interactive Checklist */}
            <div className="collapsible-section card-3d">
                <div
                    className="section-header"
                    onClick={() => toggleSection('checklist')}
                >
                    <h3>✅ Your Checklist ({progress.completed}/{progress.total})</h3>
                    <span className={`toggle-icon ${expandedSections.checklist ? 'expanded' : ''}`}>▼</span>
                </div>
                {expandedSections.checklist && (
                    <div className="section-content">
                        {data?.checklist?.map((week, weekIndex) => (
                            <div key={weekIndex} className="checklist-week">
                                <h4>{week.week}: {week.title}</h4>
                                <div className="checklist-items">
                                    {week.items.map((item) => (
                                        <label
                                            key={item.id}
                                            className={`checklist-item ${checkedItems[item.id] ? 'checked' : ''} ${item.critical ? 'critical' : ''}`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={checkedItems[item.id] || false}
                                                onChange={() => toggleCheckItem(item.id)}
                                            />
                                            <span className="checkmark"></span>
                                            <span className="item-text">{item.text}</span>
                                            {item.critical && <span className="critical-indicator">Critical</span>}
                                        </label>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Templates */}
            <div className="collapsible-section card-3d">
                <div
                    className="section-header"
                    onClick={() => toggleSection('templates')}
                >
                    <h3>📝 Templates</h3>
                    <span className={`toggle-icon ${expandedSections.templates ? 'expanded' : ''}`}>▼</span>
                </div>
                {expandedSections.templates && (
                    <div className="section-content">
                        <div className="templates-container">
                            {Object.entries(data?.templates || {}).map(([key, template]) => (
                                <div key={key} className="template-card">
                                    <div className="template-header">
                                        <h4>{template.title}</h4>
                                        <button
                                            className="copy-btn"
                                            onClick={() => copyToClipboard(template.template)}
                                        >
                                            📋 Copy
                                        </button>
                                    </div>
                                    <pre className="template-content">{template.template}</pre>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Milestones */}
            <div className="collapsible-section card-3d">
                <div
                    className="section-header"
                    onClick={() => toggleSection('milestones')}
                >
                    <h3>🎯 Milestones</h3>
                    <span className={`toggle-icon ${expandedSections.milestones ? 'expanded' : ''}`}>▼</span>
                </div>
                {expandedSections.milestones && (
                    <div className="section-content">
                        <div className="milestones-container">
                            {data?.milestones?.map((milestone, i) => (
                                <div
                                    key={i}
                                    className="milestone-card"
                                    style={{ borderColor: milestone.color }}
                                >
                                    <div className="milestone-header">
                                        <span className="milestone-icon">{milestone.icon}</span>
                                        <div>
                                            <h4>{milestone.name}</h4>
                                            <p className="milestone-title">{milestone.title}</p>
                                        </div>
                                    </div>
                                    <div className="score-target" style={{ color: milestone.color }}>
                                        <span className="score-from">{milestone.score_from}</span>
                                        <span className="arrow">→</span>
                                        <span className="score-to">{milestone.score_target}</span>
                                    </div>
                                    <ul className="achievement-list">
                                        {milestone.achievements.map((achievement, j) => (
                                            <li key={j}>
                                                <span className="achievement-icon">{achievement.icon}</span>
                                                {achievement.text}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Quick Reference */}
            <div className="collapsible-section card-3d">
                <div
                    className="section-header"
                    onClick={() => toggleSection('contacts')}
                >
                    <h3>📞 Quick Reference</h3>
                    <span className={`toggle-icon ${expandedSections.contacts ? 'expanded' : ''}`}>▼</span>
                </div>
                {expandedSections.contacts && (
                    <div className="section-content">
                        <div className="contacts-grid">
                            {/* Credit Cards */}
                            <div className="contact-category">
                                <h4>💳 Credit Cards</h4>
                                {data?.contacts?.credit_cards?.map((contact, i) => (
                                    <div key={i} className="contact-card">
                                        <strong>{contact.name}</strong>
                                        <p>{contact.purpose}</p>
                                        <a href={`tel:${contact.phone}`} className="phone-link">{contact.phone}</a>
                                        <a href={`https://${contact.website}`} target="_blank" rel="noopener noreferrer" className="website-link">{contact.website}</a>
                                    </div>
                                ))}
                            </div>

                            {/* Rental */}
                            <div className="contact-category">
                                <h4>🚗 Rental</h4>
                                {data?.contacts?.rental?.map((contact, i) => (
                                    <div key={i} className="contact-card">
                                        <strong>{contact.name}</strong>
                                        <p>{contact.purpose}</p>
                                        <a href={`tel:${contact.phone}`} className="phone-link">{contact.phone}</a>
                                        <a href={`https://${contact.website}`} target="_blank" rel="noopener noreferrer" className="website-link">{contact.website}</a>
                                    </div>
                                ))}
                            </div>

                            {/* Credit Monitoring */}
                            <div className="contact-category">
                                <h4>📊 Credit Monitoring</h4>
                                {data?.contacts?.credit_monitoring?.map((contact, i) => (
                                    <div key={i} className="contact-card">
                                        <strong>{contact.name}</strong>
                                        <p>{contact.note}</p>
                                        <a href={`https://${contact.website}`} target="_blank" rel="noopener noreferrer" className="website-link">{contact.website}</a>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Critical Rules */}
                        <div className="critical-rules">
                            <h4>⚠️ Critical Rules</h4>
                            <div className="rules-grid">
                                <div className="rules-column permitted">
                                    <h5>Permitted Charges</h5>
                                    {data?.critical_rules?.permitted_charges?.map((rule, i) => (
                                        <p key={i}>{rule}</p>
                                    ))}
                                </div>
                                <div className="rules-column prohibited">
                                    <h5>Prohibited</h5>
                                    {data?.critical_rules?.prohibited_charges?.map((rule, i) => (
                                        <p key={i}>{rule}</p>
                                    ))}
                                </div>
                                <div className="rules-column reimbursement">
                                    <h5>Reimbursement</h5>
                                    {data?.critical_rules?.reimbursement_rules?.map((rule, i) => (
                                        <p key={i}>{rule}</p>
                                    ))}
                                </div>
                            </div>
                            <p className="legal-reference">{data?.critical_rules?.legal_reference}</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CreditPath;
