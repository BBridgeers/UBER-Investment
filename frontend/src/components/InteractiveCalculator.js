import React, { useState } from 'react';
import './InteractiveCalculator.css';

const InteractiveCalculator = ({ onCalculate }) => {
  const [inputs, setInputs] = useState({
    hoursPerWeek: 48,
    hourlyRate: 23,
    months: 6
  });

  const handleChange = (field, value) => {
    const newInputs = { ...inputs, [field]: parseFloat(value) };
    setInputs(newInputs);
    onCalculate(newInputs);
  };

  return (
    <div className="interactive-calculator">
      <h2 className="section-title">
        <span className="title-icon">🔢</span>
        Interactive Calculator
      </h2>
      
      <div className="calculator-card card-3d">
        <div className="input-group">
          <label>Hours per Week: {inputs.hoursPerWeek}</label>
          <input 
            type="range" 
            min="20" 
            max="70" 
            value={inputs.hoursPerWeek}
            onChange={(e) => handleChange('hoursPerWeek', e.target.value)}
          />
        </div>
        
        <div className="input-group">
          <label>Hourly Rate: ${inputs.hourlyRate}</label>
          <input 
            type="range" 
            min="15" 
            max="35" 
            value={inputs.hourlyRate}
            onChange={(e) => handleChange('hourlyRate', e.target.value)}
          />
        </div>
        
        <div className="input-group">
          <label>Months: {inputs.months}</label>
          <input 
            type="range" 
            min="1" 
            max="12" 
            value={inputs.months}
            onChange={(e) => handleChange('months', e.target.value)}
          />
        </div>
      </div>
    </div>
  );
};

export default InteractiveCalculator;