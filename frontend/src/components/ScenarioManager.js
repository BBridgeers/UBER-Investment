import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ScenarioManager.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';
const API = `${BACKEND_URL}/api`;

const ScenarioManager = () => {
  const [scenarios, setScenarios] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchScenarios();
  }, []);

  const fetchScenarios = async () => {
    try {
      const response = await axios.get(`${API}/scenarios`);
      setScenarios(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching scenarios:', error);
      setLoading(false);
    }
  };

  if (loading) return <div>Loading scenarios...</div>;

  return (
    <div className="scenario-manager">
      <h2 className="section-title">
        <span className="title-icon">💾</span>
        Saved Scenarios
      </h2>

      {scenarios.length === 0 ? (
        <div className="empty-state card-3d">
          <p>No saved scenarios yet. Use the calculator to create and save custom scenarios.</p>
        </div>
      ) : (
        <div className="scenarios-grid">
          {scenarios.map((scenario) => (
            <div key={scenario.id} className="scenario-card card-3d">
              <h3>{scenario.name}</h3>
              <p>Monthly Net: ${scenario.monthly_net.toFixed(2)}</p>
              <p>6-Month Total: ${scenario.six_month_total.toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ScenarioManager;
