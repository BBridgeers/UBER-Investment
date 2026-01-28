import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './WeeklyTable.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const WeeklyTable = ({ mode = 'baseline', hourlyRate = 23 }) => {
  const [weeklyData, setWeeklyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedScenario, setSelectedScenario] = useState(23);

  useEffect(() => {
    fetchWeeklyData();
  }, [mode, selectedScenario]);

  const fetchWeeklyData = async () => {
    try {
      setLoading(true);

      if (mode === 'baseline') {
        // Fetch baseline CSV data
        const response = await axios.get(`${API}/baseline/weekly`);
        // Filter by selected scenario (hourly rate) and normalize column names
        const filtered = response.data
          .filter(row => parseFloat(row.Scenario_hourly_rate_usd_per_hr || row.hourly_rate) === selectedScenario)
          .map(row => ({
            week: parseInt(row.Week || row.week),
            hourly_rate: parseFloat(row.Scenario_hourly_rate_usd_per_hr || row.hourly_rate),
            hours_per_week: parseFloat(row.Hours_per_week || row.hours_per_week),
            uber_gross: parseFloat(row.Uber_gross_usd || row.uber_gross),
            tips: parseFloat(row.Tips_usd || row.tips),
            total_gross: parseFloat(row.Total_gross_usd || row.total_gross),
            rental: parseFloat(row.Rental_usd || row.rental),
            charging: parseFloat(row.Charging_usd || row.charging),
            buffer: parseFloat(row.Buffer_usd || row.buffer),
            total_weekly_costs: parseFloat(row.Total_weekly_costs_usd || row.total_weekly_costs),
            tax_reserve: parseFloat(row.Tax_reserve_usd || row.tax_reserve),
            pay_dad: parseFloat(row.Pay_dad_usd_week1_only || row.pay_dad || 0),
            net_after_dad: parseFloat(row.Net_after_dad_usd || row.net_after_dad),
            cumulative_net_after_dad: parseFloat(row.Cumulative_net_after_dad_usd || row.cumulative_net_after_dad)
          }));
        setWeeklyData(filtered);
      } else {
        // Fetch custom calculation
        const response = await axios.get(`${API}/calculate-engine`, {
          params: { hourly_rate: selectedScenario, use_baseline: false }
        });
        setWeeklyData(response.data.weekly || []);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching weekly data:', error);
      setLoading(false);
    }
  };

  const exportCSV = () => {
    if (weeklyData.length === 0) return;

    // Create CSV header
    const headers = Object.keys(weeklyData[0]).join(',');

    // Create CSV rows
    const rows = weeklyData.map(row =>
      Object.values(row).map(val =>
        typeof val === 'number' ? val.toFixed(2) : val
      ).join(',')
    ).join('\n');

    // Combine
    const csv = `${headers}\n${rows}`;

    // Download
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `weekly_engine_${selectedScenario}hr_${mode}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div className="weekly-table-loading">Loading weekly data...</div>;
  }

  if (weeklyData.length === 0) {
    return <div className="weekly-table-empty">No weekly data available</div>;
  }

  // Format numbers for display
  const formatCurrency = (val) => {
    const num = parseFloat(val);
    return isNaN(num) ? val : `$${num.toFixed(2)}`;
  };

  const formatNumber = (val) => {
    const num = parseFloat(val);
    return isNaN(num) ? val : num.toFixed(2);
  };

  return (
    <div className="weekly-table-container">
      <div className="weekly-table-header">
        <h2 className="section-title">
          <span className="title-icon">📅</span>
          26-Week Detailed Breakdown
        </h2>
        <div className="weekly-controls">
          <div className="scenario-selector">
            <label>Hourly Rate:</label>
            <select
              value={selectedScenario}
              onChange={(e) => setSelectedScenario(parseFloat(e.target.value))}
              className="scenario-select"
            >
              <option value={20}>$20/hr (Conservative)</option>
              <option value={23}>$23/hr (Moderate)</option>
              <option value={26}>$26/hr (Optimistic)</option>
            </select>
          </div>
          <button className="export-btn" onClick={exportCSV}>
            📥 Export CSV
          </button>
        </div>
      </div>

      <div className="table-wrapper">
        <table className="weekly-table">
          <thead>
            <tr>
              <th className="sticky-col">Week</th>
              <th>Rate</th>
              <th>Hours</th>
              <th>Uber Gross</th>
              <th>Tips</th>
              <th>Total Gross</th>
              <th>Rental</th>
              <th>Charging</th>
              <th>Buffer</th>
              <th>Total Costs</th>
              <th>Tax Reserve</th>
              <th>Pay Dad</th>
              <th>Net After Dad</th>
              <th>Cumulative</th>
            </tr>
          </thead>
          <tbody>
            {weeklyData.map((row, index) => {
              const week = row.week || index + 1;
              const netValue = parseFloat(row.net_after_dad || 0);
              const cumulative = parseFloat(row.cumulative_net_after_dad || 0);
              const isNegative = netValue < 0;
              const isPositiveCumulative = cumulative >= 0;

              return (
                <tr key={index} className={week === 1 ? 'week-one' : ''}>
                  <td className="sticky-col week-col">{week}</td>
                  <td>${formatNumber(row.hourly_rate || row.rate)}</td>
                  <td>{formatNumber(row.hours_per_week || row.hours)}</td>
                  <td className="currency">{formatCurrency(row.uber_gross)}</td>
                  <td className="currency">{formatCurrency(row.tips)}</td>
                  <td className="currency highlight">{formatCurrency(row.total_gross)}</td>
                  <td className="currency expense">{formatCurrency(row.rental)}</td>
                  <td className="currency expense">{formatCurrency(row.charging)}</td>
                  <td className="currency expense">{formatCurrency(row.buffer)}</td>
                  <td className="currency expense bold">{formatCurrency(row.total_weekly_costs)}</td>
                  <td className="currency expense">{formatCurrency(row.tax_reserve)}</td>
                  <td className="currency dad-payment">
                    {formatCurrency(row.pay_dad || 0)}
                  </td>
                  <td className={`currency net ${isNegative ? 'negative' : 'positive'}`}>
                    {formatCurrency(row.net_after_dad)}
                  </td>
                  <td className={`currency cumulative ${isPositiveCumulative ? 'positive' : 'negative'}`}>
                    {formatCurrency(row.cumulative_net_after_dad)}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="total-row">
              <td className="sticky-col">TOTAL</td>
              <td colSpan="2"></td>
              <td className="currency">
                {formatCurrency(weeklyData.reduce((sum, r) => sum + parseFloat(r.uber_gross || 0), 0))}
              </td>
              <td className="currency">
                {formatCurrency(weeklyData.reduce((sum, r) => sum + parseFloat(r.tips || 0), 0))}
              </td>
              <td className="currency highlight">
                {formatCurrency(weeklyData.reduce((sum, r) => sum + parseFloat(r.total_gross || 0), 0))}
              </td>
              <td className="currency expense">
                {formatCurrency(weeklyData.reduce((sum, r) => sum + parseFloat(r.rental || 0), 0))}
              </td>
              <td className="currency expense">
                {formatCurrency(weeklyData.reduce((sum, r) => sum + parseFloat(r.charging || 0), 0))}
              </td>
              <td className="currency expense">
                {formatCurrency(weeklyData.reduce((sum, r) => sum + parseFloat(r.buffer || 0), 0))}
              </td>
              <td className="currency expense bold">
                {formatCurrency(weeklyData.reduce((sum, r) => sum + parseFloat(r.total_weekly_costs || 0), 0))}
              </td>
              <td className="currency expense">
                {formatCurrency(weeklyData.reduce((sum, r) => sum + parseFloat(r.tax_reserve || 0), 0))}
              </td>
              <td className="currency dad-payment">
                {formatCurrency(weeklyData.reduce((sum, r) => sum + parseFloat(r.pay_dad || 0), 0))}
              </td>
              <td className="currency net positive">
                {formatCurrency(weeklyData.reduce((sum, r) => sum + parseFloat(r.net_after_dad || 0), 0))}
              </td>
              <td className="currency cumulative positive">
                {formatCurrency(weeklyData[weeklyData.length - 1]?.cumulative_net_after_dad || 0)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="table-info">
        <div className="info-card">
          <h4>💡 Reading the Table</h4>
          <ul>
            <li><strong>Week 1</strong> includes Dad's upfront payment of $386.86</li>
            <li><strong>Tax Reserve (25%)</strong> is calculated on Uber Gross only, not Tips</li>
            <li><strong>Cumulative</strong> shows running total after all expenses</li>
            <li><strong>Green values</strong> indicate profit, <strong>red</strong> indicates loss</li>
            <li>All values exclude Yoga income (shown separately in Monthly view)</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default WeeklyTable;
