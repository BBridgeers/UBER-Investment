import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const generatePDF = async (calculations, defaultData) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const margin = 20;

  // Title Page
  doc.setFillColor(0, 0, 0);
  doc.rect(0, 0, pageWidth, 297, 'F');
  
  doc.setTextColor(255, 215, 0);
  doc.setFontSize(32);
  doc.setFont('helvetica', 'bold');
  doc.text('Transportation Independence', pageWidth / 2, 80, { align: 'center' });
  
  doc.setFontSize(24);
  doc.text('Investment Analysis', pageWidth / 2, 100, { align: 'center' });
  
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text('Data-Driven Decision Tool for Financial Freedom', pageWidth / 2, 120, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setTextColor(200, 200, 200);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, 260, { align: 'center' });

  // Page 2: Executive Summary
  doc.addPage();
  doc.setFillColor(255, 255, 255);
  doc.setTextColor(0, 0, 0);
  
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Executive Summary', margin, 30);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Recommended Strategy: AVIS Mach-E Rental (48 hrs/week)', margin, 45);
  
  // Key Metrics Table
  doc.autoTable({
    startY: 55,
    head: [['Metric', 'Value']],
    body: [
      ['Initial Investment Required', `$${calculations.avis_rental.initial_investment.toFixed(2)}`],
      ['Weekly Costs', `$${calculations.avis_rental.weekly_costs.toFixed(2)}`],
      ['Monthly Net Income', `$${calculations.avis_rental.monthly_net.toLocaleString()}`],
      ['6-Month Net Profit', `$${calculations.avis_rental.six_month_net.toLocaleString()}`],
      ['Break-Even Point', `${calculations.avis_rental.break_even_weeks} weeks`],
      ['Current Uber Expenses Eliminated', `$${calculations.avis_rental.total_uber_eliminated.toLocaleString()}`],
      ['Total Financial Benefit (6 months)', `$${calculations.avis_rental.total_benefit.toLocaleString()}`]
    ],
    theme: 'grid',
    headStyles: { fillColor: [255, 215, 0], textColor: [0, 0, 0] },
    styles: { fontSize: 11 }
  });

  // Page 3: Scenario Comparison
  doc.addPage();
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Three Strategy Comparison', margin, 30);
  
  doc.autoTable({
    startY: 40,
    head: [['Metric', 'AVIS Rental', 'Beater Car', 'Hybrid']],
    body: [
      ['Initial Investment', 
        `$${calculations.avis_rental.initial_investment.toFixed(2)}`,
        `$${calculations.beater_car.initial_investment.toLocaleString()}`,
        `$${calculations.hybrid.initial_investment.toLocaleString()}`
      ],
      ['Monthly Costs',
        `$${calculations.avis_rental.monthly_costs.toFixed(2)}`,
        `$${calculations.beater_car.monthly_costs.toFixed(2)}`,
        `$${calculations.hybrid.monthly_costs.toFixed(2)}`
      ],
      ['Monthly Net Income',
        `$${calculations.avis_rental.monthly_net.toFixed(2)}`,
        `$${calculations.beater_car.monthly_net.toFixed(2)}`,
        `$${calculations.hybrid.monthly_net.toFixed(2)}`
      ],
      ['6-Month Net Total',
        `$${calculations.avis_rental.six_month_net.toLocaleString()}`,
        `$${calculations.beater_car.six_month_net.toLocaleString()}`,
        `$${calculations.hybrid.six_month_net.toLocaleString()}`
      ]
    ],
    theme: 'grid',
    headStyles: { fillColor: [255, 215, 0], textColor: [0, 0, 0] },
    columnStyles: {
      1: { fontStyle: 'bold', fillColor: [255, 215, 0, 0.2] }
    },
    styles: { fontSize: 10 }
  });

  // Winner Box
  const tableEndY = doc.lastAutoTable.finalY + 15;
  doc.setFillColor(255, 215, 0, 0.3);
  doc.roundedRect(margin, tableEndY, pageWidth - 2 * margin, 30, 3, 3, 'F');
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('🏆 Winner: AVIS Mach-E Rental', margin + 10, tableEndY + 12);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Advantage: $${(calculations.avis_rental.six_month_net - calculations.beater_car.six_month_net).toLocaleString()} more than Beater Car`,
    margin + 10,
    tableEndY + 22
  );

  // Page 4: Charging Strategy
  doc.addPage();
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('EV Charging Strategy', margin, 30);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Optimized Mix: 60% Free / 20% Tesla / 20% EVgo', margin, 45);
  doc.text('Weekly Charging Cost: $15.54', margin, 53);
  doc.text('Monthly Charging Cost: $67.28', margin, 61);
  
  // Charging Locations
  doc.autoTable({
    startY: 75,
    head: [['Location', 'Type', 'Distance', 'Cost']],
    body: defaultData.charging_locations.map(loc => [
      loc.name,
      loc.type,
      `${loc.distance_miles} mi`,
      loc.cost
    ]),
    theme: 'grid',
    headStyles: { fillColor: [255, 215, 0], textColor: [0, 0, 0] },
    styles: { fontSize: 9 }
  });

  // Page 5: Income Projections
  doc.addPage();
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('6-Month Income Projections', margin, 30);
  
  doc.autoTable({
    startY: 40,
    head: [['Month', 'Income', 'Costs', 'Net', 'Cumulative']],
    body: calculations.avis_rental.projections.map(proj => [
      `Month ${proj.month}`,
      `$${proj.income.toLocaleString()}`,
      `$${proj.costs.toLocaleString()}`,
      `$${proj.net.toLocaleString()}`,
      `$${proj.cumulative.toLocaleString()}`
    ]),
    theme: 'striped',
    headStyles: { fillColor: [255, 215, 0], textColor: [0, 0, 0] },
    styles: { fontSize: 10 }
  });

  // Page 6: Psychological Benefits
  doc.addPage();
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Psychological & Life Quality Impact', margin, 30);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  
  let yPos = 45;
  defaultData.psychological_benefits.forEach(benefit => {
    doc.setFont('helvetica', 'bold');
    doc.text(benefit.title, margin, yPos);
    yPos += 7;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Stat: ${benefit.stat}`, margin + 5, yPos);
    yPos += 6;
    
    const descLines = doc.splitTextToSize(benefit.description, pageWidth - 2 * margin - 10);
    doc.text(descLines, margin + 5, yPos);
    yPos += descLines.length * 5 + 3;
    
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(`Source: ${benefit.source}`, margin + 5, yPos);
    yPos += 10;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    
    if (yPos > 260) {
      doc.addPage();
      yPos = 30;
    }
  });

  // Page 7: Current Situation Crisis
  doc.addPage();
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Current Transportation Crisis', margin, 30);
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  yPos = 45;
  
  const crisisPoints = [
    {
      title: 'Financial Drain',
      text: 'Monthly Uber expenses ($500-800) represent 156-250% of current yoga studio income ($320). Average $33 per trip serves as sole means of mobility.'
    },
    {
      title: 'Employment Barriers',
      text: '84% of low-income non-car owners report turning down opportunities due to transportation. Job applications require misrepresenting vehicle ownership.'
    },
    {
      title: 'Mental Prison',
      text: 'Two years without vehicle independence creates felt sense of being trapped. Research confirms car ownership reduces depression independent of income.'
    }
  ];

  crisisPoints.forEach(point => {
    doc.setFont('helvetica', 'bold');
    doc.text(point.title, margin, yPos);
    yPos += 7;
    
    doc.setFont('helvetica', 'normal');
    const textLines = doc.splitTextToSize(point.text, pageWidth - 2 * margin);
    doc.text(textLines, margin, yPos);
    yPos += textLines.length * 5 + 10;
  });

  // Final Page: Investment Recommendation
  doc.addPage();
  doc.setFillColor(255, 215, 0, 0.2);
  doc.rect(0, 0, pageWidth, 297, 'F');
  
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('Investment Recommendation', pageWidth / 2, 40, { align: 'center' });
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  yPos = 60;
  
  const recommendations = [
    `✓ Initial Ask: $656.86 (AVIS rental + bike + U-lock + deposit)`,
    `✓ Strategy: AVIS Mach-E rental at 48 hours/week`,
    `✓ Break-Even: ${calculations.avis_rental.break_even_weeks} weeks`,
    `✓ 6-Month Net Profit: $${calculations.avis_rental.six_month_net.toLocaleString()}`,
    `✓ Total Benefit: $${calculations.avis_rental.total_benefit.toLocaleString()} (including eliminated Uber costs)`,
    '',
    'This investment breaks a 2-year cycle of transportation dependence,',
    'enables financial independence, and provides proven psychological benefits',
    'backed by research. The vehicle pays for itself immediately and generates',
    'substantial savings while opening access to employment opportunities.'
  ];

  recommendations.forEach(line => {
    doc.text(line, pageWidth / 2, yPos, { align: 'center' });
    yPos += 10;
  });

  doc.setFontSize(12);
  doc.setFont('helvetica', 'italic');
  doc.text('A small investment today = life transformation tomorrow', pageWidth / 2, 260, { align: 'center' });

  // Save the PDF
  doc.save('Transportation-Independence-Investment-Analysis.pdf');
};

export default generatePDF;
