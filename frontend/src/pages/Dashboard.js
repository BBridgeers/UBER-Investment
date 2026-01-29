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
import AssumptionsPanel from '../components/AssumptionsPanel';
import WeeklyTable from '../components/WeeklyTable';
import CreditPath from '../components/CreditPath';
import { generatePDF } from '../utils/pdfGenerator';
import './Dashboard.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';
const API = `${BACKEND_URL}/api`;

const Dashboard = () => {
  const [defaultData, setDefaultData] = useState(null);
  const [calculations, setCalculations] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [mode, setMode] = useState('baseline'); // 'baseline' or 'custom'
  const [assumptions, setAssumptions] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch default data (legacy)
      const defaultResponse = await axios.get(`${API}/default-data`);
      setDefaultData(defaultResponse.data);

      // Fetch assumptions
      const assumptionsResponse = await axios.get(`${API}/assumptions`);
      setAssumptions(assumptionsResponse.data.current);
      setMode(assumptionsResponse.data.mode);

      // Fetch calculations (legacy format from engine)
      const hourlyRate = assumptionsResponse.data.current?.hourly_rate || 23;
      const calcResponse = await axios.get(
        `${API}/calculate-engine?hourly_rate=${hourlyRate}&months=6&legacy_format=true`
      );
      setCalculations(calcResponse.data);

      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  const handleAssumptionsChange = async (newAssumptions) => {
    // Recalculate with new assumptions (legacy format from engine)
    try {
      const hourlyRate = newAssumptions.hourly_rate || 23;
      const calcResponse = await axios.get(
        `${API}/calculate-engine?hourly_rate=${hourlyRate}&months=6&legacy_format=true`
      );
      setCalculations(calcResponse.data);
      setAssumptions(newAssumptions);
      setMode('custom');
    } catch (error) {
      console.error('Error recalculating:', error);
    }
  };

  const handleCalculationUpdate = async (inputs) => {
    try {
      const response = await axios.get(`${API}/calculate-engine`, {
        params: {
          hours_per_week: inputs.hoursPerWeek,
          hourly_rate: inputs.hourlyRate,
          months: inputs.months,
          legacy_format: true
        }
      });
      setCalculations(response.data);
    } catch (error) {
      console.error('Error updating calculations:', error);
    }
  };

  const handleGeneratePDF = async () => {
    setGeneratingPDF(true);
    try {
      await generatePDF(calculations, defaultData);
      // Success - PDF downloaded
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    } finally {
      setGeneratingPDF(false);
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
              <span className="title-main">EXIT PROTOCOL</span>
              <span className="title-sub">From Dependent to Sovereign</span>
              <span className="title-sub-line2">Independence Dashboard</span>
            </h1>
          </div>
          <div className="header-right">
            <div className="mode-toggle-header">
              <span className={`mode-badge ${mode}`}>
                {mode === 'baseline' ? '📊 Baseline' : '✏️ Custom'}
              </span>
            </div>
            <button
              className="pdf-export-btn"
              onClick={handleGeneratePDF}
              disabled={generatingPDF}
              data-testid="export-pdf-button"
            >
              {generatingPDF ? (
                <>
                  <span className="btn-icon">⏳</span>
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <span className="btn-icon">📄</span>
                  <span>Export PDF</span>
                </>
              )}
            </button>
            <div className="header-stat">
              <div className="stat-value">$686.86</div>
              <div className="stat-label">Initial Investment</div>
            </div>
            <div className="header-stat">
              <div className="stat-value text-gradient-gold">
                ${calculations?.avis_rental?.six_month_net?.toLocaleString() || '0'}
              </div>
              <div className="stat-label">6-Month Net (After Tax)</div>
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
            <TabsTrigger value="assumptions" className="tab-trigger">
              <span className="tab-icon">🎛️</span>
              <span>Assumptions</span>
            </TabsTrigger>
            <TabsTrigger value="weekly" className="tab-trigger">
              <span className="tab-icon">📅</span>
              <span>Weekly</span>
            </TabsTrigger>
            <TabsTrigger value="financial" className="tab-trigger">
              <span className="tab-icon">💰</span>
              <span>Financial</span>
            </TabsTrigger>
            <TabsTrigger value="charging" className="tab-trigger">
              <span className="tab-icon">⚡</span>
              <span>Charging</span>
            </TabsTrigger>
            <TabsTrigger value="projections" className="tab-trigger">
              <span className="tab-icon">📈</span>
              <span>Projections</span>
            </TabsTrigger>
            <TabsTrigger value="psychology" className="tab-trigger">
              <span className="tab-icon">🧠</span>
              <span>Psychology</span>
            </TabsTrigger>
            <TabsTrigger value="credit-path" className="tab-trigger">
              <span className="tab-icon">🎯</span>
              <span>Credit Path</span>
            </TabsTrigger>
            <TabsTrigger value="calculator" className="tab-trigger">
              <span className="tab-icon">🔢</span>
              <span>Calculator</span>
            </TabsTrigger>
            <TabsTrigger value="scenarios" className="tab-trigger">
              <span className="tab-icon">💾</span>
              <span>Scenarios</span>
            </TabsTrigger>
          </TabsList>

          <div className="tab-content-wrapper">
            <TabsContent value="overview" className="tab-content">
              <ExecutiveSummary
                calculations={calculations}
                defaultData={defaultData}
              />
            </TabsContent>

            <TabsContent value="assumptions" className="tab-content">
              <AssumptionsPanel
                onAssumptionsChange={handleAssumptionsChange}
              />
            </TabsContent>

            <TabsContent value="weekly" className="tab-content">
              <WeeklyTable
                mode={mode}
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

            <TabsContent value="credit-path" className="tab-content">
              <CreditPath />
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
