/**
 * Privacy Dashboard Component
 * Displays charts and visualizations of privacy data
 */

/**
 * Initialize dashboard
 */
export async function initializeDashboard() {
  await loadDashboardData();
}

/**
 * Load dashboard data and render charts
 */
async function loadDashboardData() {
  try {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const response = await new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({
        type: 'GET_DASHBOARD_DATA',
      }, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        resolve(response);
      });
    });

    if (response?.success) {
      const data = response.data;
      updateDashboardStats(data);
      renderRiskChart(data.riskDistribution);
      renderScoreChart(data);
      renderCookieChart(data);
    }
  } catch (error) {
    console.error('Failed to load dashboard data:', error);
    // Show empty state
    document.getElementById('dashboardTotalSites').textContent = '0';
    document.getElementById('dashboardAvgScore').textContent = '0';
    document.getElementById('dashboardTrackersBlocked').textContent = '0';
  }
}

/**
 * Update dashboard statistics
 */
function updateDashboardStats(data) {
  document.getElementById('dashboardTotalSites').textContent = data.totalSites || 0;
  document.getElementById('dashboardAvgScore').textContent = data.averagePrivacyScore || 0;
  document.getElementById('dashboardTrackersBlocked').textContent = data.totalTrackersBlocked || 0;
}

/**
 * Render risk distribution pie chart
 */
function renderRiskChart(riskDistribution) {
  const canvas = document.getElementById('riskChartCanvas');
  if (!canvas) return;

  // Ensure canvas maintains its size
  const container = canvas.parentElement;
  const containerWidth = container.clientWidth - 32; // Account for padding
  if (containerWidth > 0 && containerWidth < canvas.width) {
    canvas.style.width = containerWidth + 'px';
    canvas.style.height = (containerWidth * canvas.height / canvas.width) + 'px';
  }

  const ctx = canvas.getContext('2d');
  const { Safe = 0, Watch = 0, Risky = 0 } = riskDistribution || {};
  const total = Safe + Watch + Risky;

  if (total === 0) {
    ctx.fillStyle = '#94a3b8';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('No data available', canvas.width / 2, canvas.height / 2);
    return;
  }

  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const radius = Math.min(80, canvas.width / 4, canvas.height / 4);

  let currentAngle = -Math.PI / 2;

  // Safe (green)
  if (Safe > 0) {
    const sliceAngle = (Safe / total) * 2 * Math.PI;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
    ctx.closePath();
    ctx.fillStyle = '#10b981';
    ctx.fill();
    currentAngle += sliceAngle;
  }

  // Watch (orange)
  if (Watch > 0) {
    const sliceAngle = (Watch / total) * 2 * Math.PI;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
    ctx.closePath();
    ctx.fillStyle = '#f59e0b';
    ctx.fill();
    currentAngle += sliceAngle;
  }

  // Risky (red)
  if (Risky > 0) {
    const sliceAngle = (Risky / total) * 2 * Math.PI;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
    ctx.closePath();
    ctx.fillStyle = '#ef4444';
    ctx.fill();
  }

  // Legend
  const legendY = centerY + radius + 30;
  ctx.font = '12px sans-serif';
  ctx.textAlign = 'left';
  
  ctx.fillStyle = '#10b981';
  ctx.fillRect(centerX - 100, legendY - 20, 15, 15);
  ctx.fillStyle = '#1e293b';
  ctx.fillText(`Safe: ${Safe}`, centerX - 80, legendY - 8);

  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(centerX - 100, legendY, 15, 15);
  ctx.fillStyle = '#1e293b';
  ctx.fillText(`Watch: ${Watch}`, centerX - 80, legendY + 12);

  ctx.fillStyle = '#ef4444';
  ctx.fillRect(centerX - 100, legendY + 20, 15, 15);
  ctx.fillStyle = '#1e293b';
  ctx.fillText(`Risky: ${Risky}`, centerX - 80, legendY + 32);
}

/**
 * Render privacy score trend line chart
 */
function renderScoreChart(data) {
  const canvas = document.getElementById('scoreChartCanvas');
  if (!canvas) return;

  // Ensure canvas maintains its size
  const container = canvas.parentElement;
  const containerWidth = container.clientWidth - 32; // Account for padding
  if (containerWidth > 0 && containerWidth < canvas.width) {
    canvas.style.width = containerWidth + 'px';
    canvas.style.height = (containerWidth * canvas.height / canvas.width) + 'px';
  }

  const ctx = canvas.getContext('2d');
  
  // Get history for trend
  chrome.storage.local.get('privacyGuardHistory').then(({ privacyGuardHistory = {} }) => {
    const entries = Object.values(privacyGuardHistory)
      .sort((a, b) => new Date(a.analyzed_at) - new Date(b.analyzed_at))
      .slice(-10); // Last 10 analyses

    if (entries.length === 0) {
      ctx.fillStyle = '#94a3b8';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('No trend data available', canvas.width / 2, canvas.height / 2);
      return;
    }

    const scores = entries.map(e => e.privacy_score || 0);
    const maxScore = 100;
    const padding = 40;
    const chartWidth = canvas.width - padding * 2;
    const chartHeight = canvas.height - padding * 2;

    // Draw grid
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = padding + (chartHeight / 5) * i;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(canvas.width - padding, y);
      ctx.stroke();
    }

    // Draw line
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 2;
    ctx.beginPath();
    scores.forEach((score, index) => {
      const x = padding + (chartWidth / (scores.length - 1 || 1)) * index;
      const y = padding + chartHeight - (score / maxScore) * chartHeight;
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();

    // Draw points
    ctx.fillStyle = '#6366f1';
    scores.forEach((score, index) => {
      const x = padding + (chartWidth / (scores.length - 1 || 1)) * index;
      const y = padding + chartHeight - (score / maxScore) * chartHeight;
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, 2 * Math.PI);
      ctx.fill();
    });

    // Labels
    ctx.fillStyle = '#64748b';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('0', padding - 20, canvas.height - padding + 5);
    ctx.fillText('100', padding - 20, padding + 5);
  });
}

/**
 * Render cookie categories bar chart
 */
function renderCookieChart(data) {
  const canvas = document.getElementById('cookieChartCanvas');
  if (!canvas) return;

  // Ensure canvas maintains its size
  const container = canvas.parentElement;
  const containerWidth = container.clientWidth - 32; // Account for padding
  if (containerWidth > 0 && containerWidth < canvas.width) {
    canvas.style.width = containerWidth + 'px';
    canvas.style.height = (containerWidth * canvas.height / canvas.width) + 'px';
  }

  const ctx = canvas.getContext('2d');
  
  // Get cookie data from current analysis or history
  chrome.storage.local.get('privacyGuardHistory').then(({ privacyGuardHistory = {} }) => {
    // Simplified - in production, would aggregate cookie data
    const categories = {
      Essential: 0,
      Functional: 0,
      Analytics: 0,
      Marketing: 0,
      Advertising: 0,
    };

    // This would be populated from actual cookie analysis
    // For now, show placeholder
    if (Object.values(categories).every(v => v === 0)) {
      ctx.fillStyle = '#94a3b8';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Cookie data will appear here', canvas.width / 2, canvas.height / 2);
      return;
    }

    const maxValue = Math.max(...Object.values(categories));
    const barWidth = 40;
    const barSpacing = 20;
    const chartHeight = canvas.height - 60;
    const startX = 30;

    Object.entries(categories).forEach(([category, value], index) => {
      const x = startX + index * (barWidth + barSpacing);
      const barHeight = (value / maxValue) * chartHeight;
      const y = canvas.height - 40 - barHeight;

      // Draw bar
      ctx.fillStyle = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#dc2626'][index];
      ctx.fillRect(x, y, barWidth, barHeight);

      // Label
      ctx.fillStyle = '#1e293b';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.save();
      ctx.translate(x + barWidth / 2, canvas.height - 20);
      ctx.rotate(-Math.PI / 4);
      ctx.fillText(category, 0, 0);
      ctx.restore();

      // Value
      ctx.fillText(value.toString(), x + barWidth / 2, y - 5);
    });
  });
}

// Export for use in popup.js
export { loadDashboardData };

