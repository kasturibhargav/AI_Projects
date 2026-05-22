// Analytics View Controller
import { getAppState, estimate1RM } from '../state.js';

const CATEGORY_COLORS = {
  'Chest': '#00f5d4',     // neon teal
  'Back': '#9d4edd',      // neon violet
  'Legs': '#ff2a5f',      // neon pink
  'Shoulders': '#ff9f1c', // neon orange
  'Arms': '#3a86ff',      // neon blue
  'Core': '#adff00',      // neon lime
  'Cardio': '#ff0055',    // neon magenta
  'Other': '#6b7280'      // gray
};

export function initAnalytics() {
  const exerciseSelect = document.getElementById('analytics-exercise-select');
  const totalCountEl = document.getElementById('analytics-total-count');
  const totalVolumeEl = document.getElementById('analytics-total-volume');
  const avgDurationEl = document.getElementById('analytics-avg-duration');

  const canvas1RM = document.getElementById('chart-1rm');
  const canvasVolume = document.getElementById('chart-volume');
  const canvasMuscles = document.getElementById('chart-muscles');

  // Re-draw when selected exercise changes
  exerciseSelect.addEventListener('change', () => {
    renderCharts();
  });

  function populateExerciseSelect(history) {
    const previousSelection = exerciseSelect.value;
    exerciseSelect.innerHTML = '';

    // Find all unique exercise names logged in history
    const exercises = new Set();
    history.forEach(log => {
      log.exercises.forEach(ex => {
        exercises.add(ex.name);
      });
    });

    if (exercises.size === 0) {
      const opt = document.createElement('option');
      opt.textContent = 'No exercises logged yet';
      exerciseSelect.appendChild(opt);
      exerciseSelect.disabled = true;
      return;
    }

    exerciseSelect.disabled = false;
    
    // Sort and populate
    Array.from(exercises).sort().forEach(name => {
      const opt = document.createElement('option');
      opt.value = name;
      opt.textContent = name;
      if (name === previousSelection) {
        opt.selected = true;
      }
      exerciseSelect.appendChild(opt);
    });
  }

  // Custom Line Chart Renderer on Canvas
  function drawLineChart(canvas, data, labels, color = '#f97316', accentColor = '#fde047') {
    const ctx = canvas.getContext('2d');
    
    // Clear and handle DPI scaling
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;

    // Check if enough data
    if (data.length === 0) {
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.font = '13px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Not enough data to display chart', width / 2, height / 2);
      return;
    }

    const paddingLeft = 45;
    const paddingRight = 20;
    const paddingTop = 20;
    const paddingBottom = 30;

    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;

    // Find min and max Y values
    let minY = Math.min(...data);
    let maxY = Math.max(...data);
    
    // Add margins to Y axis
    if (minY === maxY) {
      minY = Math.max(0, minY - 10);
      maxY = maxY + 10;
    } else {
      const range = maxY - minY;
      minY = Math.max(0, minY - range * 0.1);
      maxY = maxY + range * 0.1;
    }

    // Grid lines count
    const yGridCount = 4;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    for (let i = 0; i <= yGridCount; i++) {
      const ratio = i / yGridCount;
      const yVal = minY + (maxY - minY) * ratio;
      const yPos = height - paddingBottom - ratio * chartHeight;

      // Draw grid line
      ctx.beginPath();
      ctx.moveTo(paddingLeft, yPos);
      ctx.lineTo(width - paddingRight, yPos);
      ctx.stroke();

      // Draw Y label
      ctx.fillText(Math.round(yVal), paddingLeft - 8, yPos);
    }

    // Calculate X positions
    const xPoints = [];
    const stepX = data.length > 1 ? chartWidth / (data.length - 1) : chartWidth;

    for (let i = 0; i < data.length; i++) {
      xPoints.push(paddingLeft + i * stepX);
    }

    // Draw X axis labels (dates or labels)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    const maxLabels = 5;
    const stepLabel = Math.max(1, Math.ceil(data.length / maxLabels));

    for (let i = 0; i < data.length; i += stepLabel) {
      ctx.fillText(labels[i] || '', xPoints[i], height - paddingBottom + 8);
    }

    // Draw data path & gradients
    const yPoints = data.map(val => {
      const ratio = (val - minY) / (maxY - minY);
      return height - paddingBottom - ratio * chartHeight;
    });

    // 1. Draw area gradient fill
    if (data.length > 1) {
      ctx.beginPath();
      ctx.moveTo(xPoints[0], height - paddingBottom);
      for (let i = 0; i < data.length; i++) {
        ctx.lineTo(xPoints[i], yPoints[i]);
      }
      ctx.lineTo(xPoints[xPoints.length - 1], height - paddingBottom);
      ctx.closePath();

      const gradient = ctx.createLinearGradient(0, paddingTop, 0, height - paddingBottom);
      gradient.addColorStop(0, hexToRgba(color, 0.25));
      gradient.addColorStop(1, hexToRgba(color, 0.0));
      ctx.fillStyle = gradient;
      ctx.fill();
    }

    // 2. Draw line
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // Shadows for line glow
    ctx.shadowColor = color;
    ctx.shadowBlur = 8;

    if (data.length === 1) {
      ctx.arc(xPoints[0], yPoints[0], 2, 0, 2 * Math.PI);
      ctx.stroke();
    } else {
      ctx.moveTo(xPoints[0], yPoints[0]);
      for (let i = 1; i < data.length; i++) {
        ctx.lineTo(xPoints[i], yPoints[i]);
      }
      ctx.stroke();
    }

    // Reset shadow
    ctx.shadowBlur = 0;

    // 3. Draw dots on joints
    data.forEach((val, i) => {
      ctx.beginPath();
      ctx.arc(xPoints[i], yPoints[i], 4, 0, 2 * Math.PI);
      ctx.fillStyle = accentColor;
      ctx.fill();
      
      ctx.beginPath();
      ctx.arc(xPoints[i], yPoints[i], 2, 0, 2 * Math.PI);
      ctx.fillStyle = '#1c1a18';
      ctx.fill();
    });
  }

  // Hex color to RGBA helper
  function hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  // Custom Donut Chart Renderer on Canvas
  function drawDonutChart(canvas, data, labels) {
    const ctx = canvas.getContext('2d');
    
    // Clear and handle DPI scaling
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;

    // Check if enough data
    if (data.length === 0) {
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.font = '13px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Log some completed sets to see distribution', width / 2, height / 2);
      return;
    }

    const totalSets = data.reduce((sum, val) => sum + val, 0);

    // Layout variables
    const centerX = width * 0.33;
    const centerY = height / 2;
    const outerRadius = Math.min(width * 0.28, height * 0.38);
    const innerRadius = outerRadius * 0.65;

    // Draw slices
    let startAngle = -Math.PI / 2;
    data.forEach((val, i) => {
      const sliceAngle = (val / totalSets) * 2 * Math.PI;
      const color = CATEGORY_COLORS[labels[i]] || CATEGORY_COLORS['Other'];

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, outerRadius, startAngle, startAngle + sliceAngle);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();

      // Divider line
      ctx.strokeStyle = '#1c1a18'; // matching var(--bg-card)
      ctx.lineWidth = 2.5;
      ctx.stroke();

      startAngle += sliceAngle;
    });

    // Cut donut hole (transparent composite)
    ctx.beginPath();
    ctx.arc(centerX, centerY, innerRadius, 0, 2 * Math.PI);
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';

    // Center Text (Total Sets count)
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Draw count
    ctx.fillStyle = 'var(--text-main)';
    ctx.font = 'bold 22px Outfit, sans-serif';
    ctx.fillText(totalSets, centerX, centerY - 6);

    // Draw label "SETS"
    ctx.fillStyle = 'var(--text-muted)';
    ctx.font = '600 10px Outfit, sans-serif';
    ctx.fillText('SETS', centerX, centerY + 12);

    // Draw Legend
    const itemsCount = labels.length;
    const spacing = 18;
    const legendStartY = centerY - ((itemsCount - 1) * spacing) / 2;
    const legendStartX = width * 0.6;

    labels.forEach((label, i) => {
      const count = data[i];
      const percent = Math.round((count / totalSets) * 100);
      const color = CATEGORY_COLORS[label] || CATEGORY_COLORS['Other'];
      const itemY = legendStartY + i * spacing;

      // Draw color indicator circle
      ctx.beginPath();
      ctx.arc(legendStartX + 6, itemY, 5, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.fill();

      // Draw label text
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = 'var(--text-main)';
      ctx.font = '500 12px Outfit, sans-serif';
      ctx.fillText(`${label}`, legendStartX + 18, itemY);

      // Draw percentage text
      ctx.textAlign = 'right';
      ctx.fillStyle = 'var(--text-muted)';
      ctx.font = '600 11px monospace';
      ctx.fillText(`${percent}%`, width - 10, itemY);
    });
  }

  // Core Render charts function
  function renderCharts() {
    const state = getAppState();
    const history = state.history;

    if (history.length === 0) {
      // Clear canvases
      drawLineChart(canvas1RM, [], []);
      drawLineChart(canvasVolume, [], []);
      drawDonutChart(canvasMuscles, [], []);
      return;
    }

    // Chart 1: Estimated 1RM Trend
    const selectedEx = exerciseSelect.value;
    const est1RMData = [];
    const est1RMLabels = [];

    // Traverse history chronological order (oldest to newest)
    const reversedHistory = [...history].reverse();

    reversedHistory.forEach(log => {
      const foundEx = log.exercises.find(ex => ex.name === selectedEx);
      if (foundEx) {
        // Find maximum estimated 1RM in this workout session
        let max1RM = 0;
        foundEx.sets.forEach(set => {
          if (set.completed) {
            const oneRM = estimate1RM(set.weight, set.reps);
            if (oneRM > max1RM) {
              max1RM = oneRM;
            }
          }
        });

        if (max1RM > 0) {
          est1RMData.push(max1RM);
          // Label with date format "MM/DD"
          const d = new Date(log.date);
          est1RMLabels.push(`${d.getMonth() + 1}/${d.getDate()}`);
        }
      }
    });

    // Plot 1RM Trend
    drawLineChart(canvas1RM, est1RMData, est1RMLabels, '#f97316', '#fde047');

    // Chart 2: Volume Trend
    const volumeData = [];
    const volumeLabels = [];

    // Take last 7 workouts logged chronologically
    const last7Workouts = reversedHistory.slice(-7);

    last7Workouts.forEach(log => {
      let logVol = 0;
      log.exercises.forEach(ex => {
        ex.sets.forEach(s => {
          if (s.completed) {
            logVol += s.weight * s.reps;
          }
        });
      });

      volumeData.push(logVol);
      const d = new Date(log.date);
      volumeLabels.push(`${d.getMonth() + 1}/${d.getDate()}`);
    });

    // Plot Volume Trend
    drawLineChart(canvasVolume, volumeData, volumeLabels, '#fde047', '#f97316');

    // Chart 3: Muscle Group Distribution Donut Chart
    const muscleCounts = {};
    history.forEach(log => {
      log.exercises.forEach(ex => {
        ex.sets.forEach(s => {
          if (s.completed) {
            const cat = ex.category || 'Other';
            muscleCounts[cat] = (muscleCounts[cat] || 0) + 1;
          }
        });
      });
    });

    const muscleLabels = Object.keys(muscleCounts);
    const muscleData = Object.values(muscleCounts);

    // Sort descending by count
    const combined = muscleLabels.map((lbl, idx) => ({ label: lbl, val: muscleData[idx] }));
    combined.sort((a, b) => b.val - a.val);

    let sortedLabels = combined.map(c => c.label);
    let sortedData = combined.map(c => c.val);

    // Group elements into "Other" if too many to fit in the legend beautifully
    if (sortedLabels.length > 7) {
      const topLabels = sortedLabels.slice(0, 6);
      const topData = sortedData.slice(0, 6);
      const otherCount = sortedData.slice(6).reduce((a, b) => a + b, 0);
      topLabels.push('Other');
      topData.push(otherCount);
      sortedLabels = topLabels;
      sortedData = topData;
    }

    drawDonutChart(canvasMuscles, sortedData, sortedLabels);
  }

  // Return render function
  return function render() {
    const state = getAppState();
    const history = state.history;

    // Populates exercise selector dropdown
    populateExerciseSelect(history);

    // Calculate Summary Stats
    totalCountEl.textContent = history.length;
    
    let totalVol = 0;
    let totalMins = 0;

    history.forEach(log => {
      totalMins += log.duration || 0;
      log.exercises.forEach(ex => {
        ex.sets.forEach(s => {
          if (s.completed) totalVol += s.weight * s.reps;
        });
      });
    });

    const unit = state.settings.unit || 'kg';
    totalVolumeEl.textContent = `${totalVol.toLocaleString()} ${unit}`;
    
    const avgDuration = history.length > 0 ? Math.round(totalMins / history.length) : 0;
    avgDurationEl.textContent = `${avgDuration} mins`;

    // Render the canvas charts
    renderCharts();
  };
}
