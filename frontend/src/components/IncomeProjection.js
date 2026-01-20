import React from 'react';
import './IncomeProjection.css';

const IncomeProjection = ({ calculations }) => {
  if (!calculations) return null;
  
  return (
    <div className="income-projection">
      <h2 className="section-title">
        <span className="title-icon">📈</span>
        Income Projections
      </h2>
      <div className="projection-content">
        <p>6-Month Net: ${calculations.avis_rental?.six_month_net?.toLocaleString()}</p>
      </div>
    </div>
  );
};

export default IncomeProjection;