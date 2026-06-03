/* ============================================
   Chart Manager - Chart.js Wrapper
   Unified chart styling for dark theme
   ============================================ */

const ChartManager = {
  instances: {},

  // Default dark theme config
  defaults: {
    colors: {
      cyan: '#06b6d4',
      blue: '#3b82f6',
      indigo: '#6366f1',
      emerald: '#10b981',
      amber: '#f59e0b',
      rose: '#f43f5e',
      purple: '#a855f7',
      grid: 'rgba(99, 102, 241, 0.08)',
      text: '#94a3b8',
      border: 'rgba(99, 102, 241, 0.12)'
    },
    palette: ['#06b6d4', '#6366f1', '#10b981', '#f59e0b', '#f43f5e', '#a855f7', '#3b82f6'],
  },

  baseOptions() {
    return {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 800, easing: 'easeOutQuart' },
      plugins: {
        legend: {
          labels: { color: this.defaults.colors.text, font: { family: 'Inter', size: 12 }, padding: 16, usePointStyle: true, pointStyleWidth: 10 }
        },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          titleColor: '#f1f5f9', bodyColor: '#94a3b8',
          borderColor: this.defaults.colors.border, borderWidth: 1,
          padding: 12, cornerRadius: 8,
          titleFont: { family: 'Inter', weight: '600' },
          bodyFont: { family: 'JetBrains Mono', size: 12 },
          displayColors: true, boxPadding: 4
        }
      },
      scales: {
        x: {
          grid: { color: this.defaults.colors.grid, drawBorder: false },
          ticks: { color: this.defaults.colors.text, font: { family: 'Inter', size: 11 } }
        },
        y: {
          grid: { color: this.defaults.colors.grid, drawBorder: false },
          ticks: { color: this.defaults.colors.text, font: { family: 'Inter', size: 11 } }
        }
      }
    };
  },

  destroy(id) {
    if (this.instances[id]) {
      this.instances[id].destroy();
      delete this.instances[id];
    }
  },

  createLine(canvasId, labels, datasets, extraOpts = {}) {
    this.destroy(canvasId);
    const ctx = document.getElementById(canvasId);
    if (!ctx) return null;
    const styledDatasets = datasets.map((ds, i) => ({
      borderColor: ds.borderColor || this.defaults.palette[i % this.defaults.palette.length],
      backgroundColor: ds.backgroundColor || (ds.fill ? this.hexToRgba(this.defaults.palette[i % this.defaults.palette.length], 0.1) : 'transparent'),
      borderWidth: ds.borderWidth || 2,
      pointRadius: ds.pointRadius !== undefined ? ds.pointRadius : 3,
      pointHoverRadius: ds.pointHoverRadius || 6,
      tension: ds.tension !== undefined ? ds.tension : 0.3,
      fill: ds.fill || false,
      ...ds
    }));
    const opts = this.mergeDeep(this.baseOptions(), extraOpts);
    this.instances[canvasId] = new Chart(ctx, { type: 'line', data: { labels, datasets: styledDatasets }, options: opts });
    return this.instances[canvasId];
  },

  createBar(canvasId, labels, datasets, extraOpts = {}) {
    this.destroy(canvasId);
    const ctx = document.getElementById(canvasId);
    if (!ctx) return null;
    const styledDatasets = datasets.map((ds, i) => ({
      backgroundColor: ds.backgroundColor || this.hexToRgba(this.defaults.palette[i % this.defaults.palette.length], 0.6),
      borderColor: ds.borderColor || this.defaults.palette[i % this.defaults.palette.length],
      borderWidth: ds.borderWidth || 1, borderRadius: 4,
      ...ds
    }));
    const opts = this.mergeDeep(this.baseOptions(), extraOpts);
    this.instances[canvasId] = new Chart(ctx, { type: 'bar', data: { labels, datasets: styledDatasets }, options: opts });
    return this.instances[canvasId];
  },

  createScatter(canvasId, datasets, extraOpts = {}) {
    this.destroy(canvasId);
    const ctx = document.getElementById(canvasId);
    if (!ctx) return null;
    const styledDatasets = datasets.map((ds, i) => ({
      backgroundColor: ds.backgroundColor || this.defaults.palette[i % this.defaults.palette.length],
      borderColor: ds.borderColor || this.defaults.palette[i % this.defaults.palette.length],
      pointRadius: ds.pointRadius || 5, ...ds
    }));
    const opts = this.mergeDeep(this.baseOptions(), extraOpts);
    this.instances[canvasId] = new Chart(ctx, { type: 'scatter', data: { datasets: styledDatasets }, options: opts });
    return this.instances[canvasId];
  },

  hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  },

  mergeDeep(target, source) {
    const result = { ...target };
    for (const key of Object.keys(source)) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.mergeDeep(result[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    return result;
  },

  formatNumber(n, decimals = 4) {
    if (typeof n !== 'number' || isNaN(n)) return 'N/A';
    return n.toFixed(decimals);
  }
};
