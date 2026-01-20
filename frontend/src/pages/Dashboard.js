import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ExecutiveSummary from '../components/ExecutiveSummary';
import FinancialComparison from '../components/FinancialComparison';
import ChargingStrategy from '../components/ChargingStrategy';
import IncomeProjection from '../components/IncomeProjection';
import PsychologicalBenefits from '../components/PsychologicalBenefits';
import InteractiveCalculator from '../components/InteractiveCalculator';
import ScenarioManager from '../components/ScenarioManager';
import { generatePDF } from '../utils/pdfGenerator';
import './Dashboard.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Dashboard = () => {
  const [defaultData, setDefaultData] = useState(null);
  const [calculations, setCalculations] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [generatingPDF, setGeneratingPDF] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch default data
      const defaultResponse = await axios.get(`${API}/default-data`);
      setDefaultData(defaultResponse.data);
      
      // Fetch initial calculations
      const calcResponse = await axios.get(`${API}/calculate-all?hours_per_week=48&hourly_rate=23&months=6`);
      setCalculations(calcResponse.data);
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  const handleCalculationUpdate = async (inputs) => {
    try {
      const response = await axios.get(`${API}/calculate-all`, {
        params: {
          hours_per_week: inputs.hoursPerWeek,
          hourly_rate: inputs.hourlyRate,
          months: inputs.months
        }
      });
      setCalculations(response.data);
    } catch (error) {
      console.error('Error updating calculations:', error);
    }
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loader">
          <div className="loader-ring"></div>
          <div className="loader-text">Loading Investment Analysis...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <div className="header-left">
            <h1 className="header-title">
              <span className="title-main">Transportation Independence</span>
              <span className="title-sub">Investment Analysis & Decision Tool</span>
            </h1>
          </div>
          <div className="header-right">
            <div className="header-stat">
              <div className="stat-value">$666.86</div>
              <div className="stat-label">Initial Investment</div>
            </div>
            <div className="header-stat">
              <div className="stat-value text-gradient-gold">
                ${calculations?.avis_rental?.six_month_net?.toLocaleString() || '0'}
              </div>
              <div className="stat-label">6-Month Net (Recommended)</div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="dashboard-main">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="dashboard-tabs">
          <TabsList className="tabs-list">
            <TabsTrigger value="overview" className="tab-trigger">
              <span className="tab-icon">📊</span>
              <span>Overview</span>
            </TabsTrigger>
            <TabsTrigger value="financial" className="tab-trigger">
              <span className="tab-icon">💰</span>
              <span>Financial Analysis</span>
            </TabsTrigger>
            <TabsTrigger value="charging" className="tab-trigger">
              <span className="tab-icon">⚡</span>
              <span>Charging Strategy</span>
            </TabsTrigger>
            <TabsTrigger value="projections" className="tab-trigger">
              <span className="tab-icon">📈</span>
              <span>Income Projections</span>
            </TabsTrigger>
            <TabsTrigger value="psychology" className="tab-trigger">
              <span className="tab-icon">🧠</span>
              <span>Psychological Impact</span>
            </TabsTrigger>
            <TabsTrigger value="calculator" className="tab-trigger">
              <span className="tab-icon">🔢</span>
              <span>Calculator</span>
            </TabsTrigger>
            <TabsTrigger value="scenarios" className="tab-trigger">
              <span className="tab-icon">💾</span>
              <span>Saved Scenarios</span>
            </TabsTrigger>
          </TabsList>

          <div className="tab-content-wrapper">
            <TabsContent value="overview" className="tab-content">
              <ExecutiveSummary 
                calculations={calculations}
                defaultData={defaultData}
              />
            </TabsContent>

            <TabsContent value="financial" className="tab-content">
              <FinancialComparison 
                calculations={calculations}
              />
            </TabsContent>

            <TabsContent value="charging" className="tab-content">
              <ChargingStrategy 
                chargingLocations={defaultData?.charging_locations || []}
              />
            </TabsContent>

            <TabsContent value="projections" className="tab-content">
              <IncomeProjection 
                calculations={calculations}
              />
            </TabsContent>

            <TabsContent value="psychology" className="tab-content">
              <PsychologicalBenefits 
                benefits={defaultData?.psychological_benefits || []}
              />
            </TabsContent>

            <TabsContent value="calculator" className="tab-content">
              <InteractiveCalculator 
                onCalculate={handleCalculationUpdate}
              />
            </TabsContent>

            <TabsContent value="scenarios" className="tab-content">
              <ScenarioManager />
            </TabsContent>
          </div>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="dashboard-footer">
        <div className="footer-content">
          <p className="footer-text">
            📍 Southlake, TX • 🚗 Ford Mustang Mach-E • ⚡ AVIS Uber Program
          </p>
          <p className="footer-subtext">
            Data-driven analysis for transportation independence and financial freedom
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;
