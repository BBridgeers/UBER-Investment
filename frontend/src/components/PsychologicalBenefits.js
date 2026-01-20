import React from 'react';
import './PsychologicalBenefits.css';

const PsychologicalBenefits = ({ benefits }) => {
  return (
    <div className="psychological-benefits">
      <h2 className="section-title">
        <span className="title-icon">🧠</span>
        Psychological Impact
      </h2>
      
      <div className="benefits-grid">
        {benefits.map((benefit, index) => (
          <div key={index} className="benefit-card card-3d">
            <h3>{benefit.title}</h3>
            <div className="benefit-stat">{benefit.stat}</div>
            <p>{benefit.description}</p>
            <small>Source: {benefit.source}</small>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PsychologicalBenefits;