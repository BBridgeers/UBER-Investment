import React from 'react';
import './ChargingStrategy.css';

const ChargingStrategy = ({ chargingLocations }) => {
  return (
    <div className="charging-strategy">
      <h2 className="section-title">
        <span className="title-icon">⚡</span>
        EV Charging Strategy
      </h2>
      
      <div className="charging-grid">
        {chargingLocations.map((location, index) => (
          <div key={index} className="charging-card card-3d">
            <h3>{location.name}</h3>
            <p>{location.address}</p>
            <p>Distance: {location.distance_miles} miles</p>
            <p>Type: {location.type}</p>
            <p>Cost: {location.cost}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChargingStrategy;