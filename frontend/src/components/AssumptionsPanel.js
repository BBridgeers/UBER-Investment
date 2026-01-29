import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AssumptionsPanel.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';
const API = `${BACKEND_URL}/api`;

const AssumptionsPanel = ({ onAssumptionsChange }) => {
  const [assumptions, setAssumptions] = useState(null);
  const [baseline, setBaseline] = useState(null);
  const [schema, setSchema] = useState(null);
  const [mode, setMode] = useState('baseline');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAssumptions();
  }, []);

  const fetchAssumptions = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/assumptions`);
      setAssumptions(response.data.current);
      setBaseline(response.data.baseline);
      setSchema(response.data.schema);
      setMode(response.data.mode);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching assumptions:', error);
      setLoading(false);
    }
  };

  const handleChange = (key, value) => {
    const newAssumptions = { ...assumptions, [key]: parseFloat(value) };
    setAssumptions(newAssumptions);
    setMode('custom');
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates = {};
      Object.keys(assumptions).forEach(key => {
        if (typeof assumptions[key] === 'number') {
          updates[key] = assumptions[key];
        }
      });

      await axios.post(`${API}/assumptions`, updates);
      setMode('custom');

      if (onAssumptionsChange) {
        onAssumptionsChange(assumptions);
      }
    } catch (error) {
      console.error('Error saving assumptions:', error);
      alert('Error saving assumptions');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    try {
      const response = await axios.post(`${API}/assumptions/reset`);
      setAssumptions(response.data.current);
      setMode('baseline');

      if (onAssumptionsChange) {
        onAssumptionsChange(response.data.current);
      }
    } catch (error) {
      console.error('Error resetting assumptions:', error);
    }
  };

  const handleResetField = (key) => {
    const newAssumptions = { ...assumptions, [key]: baseline[key] };
    setAssumptions(newAssumptions);
  };

  const isChanged = (key) => {
    return assumptions && baseline && assumptions[key] !== baseline[key];
  };

  const hasChanges = () => {
    if (!assumptions || !baseline) {
      return false;
    }
    return Object.keys(assumptions).some((key) => assumptions[key] !== baseline[key]);
  };

  if (loading || !schema) {
    return <div className="assumptions-loading">Loading assumptions...</div>;
  }

  return (
    <div className="assumptions-panel">
      <div className="assumptions-header">
        <h2 className="section-title">
          <span className="title-icon">🎛️</span>
          Assumptions & Knobs
        </h2>
        <div className="mode-indicator">
          <span className={`mode-badge ${mode}`}>
            {mode === 'baseline' ? '📊 Baseline Mode' : '✏️ Custom Mode'}
          </span>
        </div>
      </div>

      <div className="assumptions-controls">
        <button
          className="control-btn save-btn"
          onClick={handleSave}
          disabled={saving || !hasChanges()}
        >
          {saving ? 'Saving...' : '💾 Save Changes'}
        </button>
        <button
          className="control-btn reset-btn"
          onClick={handleReset}
        >
          🔄 Reset All to Baseline
        </button>
      </div>

      <div className="knobs-grid">
        {schema.knobs.map((knob) => {
          const key = knob.key;
          const currentValue = assumptions[key];
          const baselineValue = baseline[key];
          const changed = isChanged(key);

          if (Array.isArray(currentValue)) return null;

          return (
            <div
              key={key}
              className={`knob-card ${changed ? 'changed' : ''}`}
            >
              <div className="knob-header">
                <label className="knob-label">{knob.label}</label>
                {changed && (
                  <button
                    className="reset-field-btn"
                    onClick={() => handleResetField(key)}
                    title="Reset to baseline"
                  >
                    ↺
                  </button>
                )}
              </div>

              <div className="knob-input-group">
                <input
                  type="number"
                  className="knob-input"
                  value={currentValue || 0}
                  onChange={(e) => handleChange(key, e.target.value)}
                  min={knob.min}
                  max={knob.max}
                  step={knob.step}
                />
                <input
                  type="range"
                  className="knob-slider"
                  value={currentValue || 0}
                  onChange={(e) => handleChange(key, e.target.value)}
                  min={knob.min}
                  max={knob.max}
                  step={knob.step}
                />
              </div>

              <div className="knob-values">
                <div className="value-row">
                  <span className="value-label">Current:</span>
                  <span className={`value-number ${changed ? 'changed' : ''}`}>
                    {currentValue !== undefined ? currentValue.toLocaleString() : 'N/A'}
                  </span>
                </div>
                <div className="value-row">
                  <span className="value-label">Baseline:</span>
                  <span className="value-number baseline">
                    {baselineValue !== undefined ? baselineValue.toLocaleString() : 'N/A'}
                  </span>
                </div>
                {changed && (
                  <div className="value-row delta">
                    <span className="value-label">Delta:</span>
                    <span className="value-number">
                      {((currentValue - baselineValue) > 0 ? '+' : '')}
                      {(currentValue - baselineValue).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="assumptions-info">
        <div className="info-box">
          <h4>💡 How Knobs Work</h4>
          <ul>
            <li>Adjust any assumption to run "what if" scenarios</li>
            <li>Changed values are highlighted in gold</li>
            <li>Save changes to update calculations</li>
            <li>Save scenarios for comparison</li>
            <li>Reset individual fields or all at once</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AssumptionsPanel;
