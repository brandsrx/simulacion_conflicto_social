/* ============================================
   Interpolation Module
   Lagrange, Newton, Cubic Splines
   ============================================ */

const Interpolation = {
  lagrange(xData, yData, x) {
    const n = xData.length;
    let result = 0;
    const terms = [];
    for (let i = 0; i < n; i++) {
      let li = 1;
      for (let j = 0; j < n; j++) {
        if (j !== i) li *= (x - xData[j]) / (xData[i] - xData[j]);
      }
      terms.push({ i, li, yi: yData[i], contribution: li * yData[i] });
      result += li * yData[i];
    }
    return { value: result, terms };
  },

  lagrangePoly(xData, yData) {
    return (x) => this.lagrange(xData, yData, x).value;
  },

  newtonDividedDiff(xData, yData) {
    const n = xData.length;
    const table = [yData.map(v => v)];
    for (let j = 1; j < n; j++) {
      table[j] = [];
      for (let i = 0; i < n - j; i++) {
        table[j][i] = (table[j - 1][i + 1] - table[j - 1][i]) / (xData[i + j] - xData[i]);
      }
    }
    const coeffs = table.map(col => col[0]);
    const evaluate = (x) => {
      let result = coeffs[0], product = 1;
      for (let i = 1; i < n; i++) {
        product *= (x - xData[i - 1]);
        result += coeffs[i] * product;
      }
      return result;
    };
    return { coeffs, table, evaluate };
  },

  cubicSpline(xData, yData) {
    const n = xData.length - 1;
    const h = [], alpha = [];
    for (let i = 0; i < n; i++) h[i] = xData[i + 1] - xData[i];
    for (let i = 1; i < n; i++)
      alpha[i] = (3 / h[i]) * (yData[i + 1] - yData[i]) - (3 / h[i - 1]) * (yData[i] - yData[i - 1]);

    const l = [1], mu = [0], z = [0];
    for (let i = 1; i < n; i++) {
      l[i] = 2 * (xData[i + 1] - xData[i - 1]) - h[i - 1] * mu[i - 1];
      mu[i] = h[i] / l[i];
      z[i] = (alpha[i] - h[i - 1] * z[i - 1]) / l[i];
    }
    l[n] = 1; z[n] = 0;
    const c = new Array(n + 1), b = new Array(n), d = new Array(n);
    c[n] = 0;
    for (let j = n - 1; j >= 0; j--) {
      c[j] = z[j] - mu[j] * c[j + 1];
      b[j] = (yData[j + 1] - yData[j]) / h[j] - h[j] * (c[j + 1] + 2 * c[j]) / 3;
      d[j] = (c[j + 1] - c[j]) / (3 * h[j]);
    }
    const a = yData.slice(0, n);
    const evaluate = (x) => {
      let i = 0;
      for (let j = 0; j < n; j++) {
        if (x >= xData[j] && x <= xData[j + 1]) { i = j; break; }
        if (j === n - 1) i = j;
      }
      const dx = x - xData[i];
      return a[i] + b[i] * dx + c[i] * dx * dx + d[i] * dx * dx * dx;
    };
    return { a, b, c: c.slice(0, n), d, evaluate };
  }
};

// ---- PAGE CONTROLLER ----
document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('interp-module')) return;

  const priceData = SampleData.foodPrices.items;
  let currentItem = 'arroz';
  let customPoints = null;

  function loadItem(key) {
    currentItem = key;
    customPoints = null;
    const item = priceData[key];
    const pointsStr = item.data.map(d => `${d.day},${d.price}`).join('\n');
    document.getElementById('interp-data-input').value = pointsStr;
    document.getElementById('interp-item-name').textContent = item.name;
  }

  document.querySelectorAll('.food-item-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.food-item-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      loadItem(btn.dataset.item);
    });
  });

  function parsePoints() {
    const text = document.getElementById('interp-data-input').value.trim();
    const lines = text.split('\n').filter(l => l.trim());
    const xData = [], yData = [];
    lines.forEach(line => {
      const parts = line.split(',').map(s => parseFloat(s.trim()));
      if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        xData.push(parts[0]); yData.push(parts[1]);
      }
    });
    if (xData.length < 2) throw new Error('Se necesitan al menos 2 puntos de datos');
    return { xData, yData };
  }

  // Interpolate
  document.getElementById('interp-solve-btn')?.addEventListener('click', () => {
    let pts;
    try { pts = parsePoints(); } catch (e) {
      Utils.showResults('interp-results', `<div class="glass-card" style="border-color:var(--accent-rose)"><p style="color:var(--accent-rose)">${e.message}</p></div>`);
      return;
    }
    const { xData, yData } = pts;
    const evalX = parseFloat(document.getElementById('interp-eval-x').value);

    // All three methods
    const lagrangeResult = Interpolation.lagrange(xData, yData, evalX);
    const newtonResult = Interpolation.newtonDividedDiff(xData, yData);
    const newtonVal = newtonResult.evaluate(evalX);
    let splineVal = null;
    try { splineVal = Interpolation.cubicSpline(xData, yData).evaluate(evalX); } catch (e) { }

    // Results cards
    let html = '<div class="grid-3" style="margin-bottom:1.5rem">';
    html += `<div class="result-card"><h4>Lagrange P(${evalX})</h4><div class="value cyan">${Utils.formatNum(lagrangeResult.value, 4)}</div></div>`;
    html += `<div class="result-card"><h4>Newton P(${evalX})</h4><div class="value emerald">${Utils.formatNum(newtonVal, 4)}</div></div>`;
    html += `<div class="result-card"><h4>Spline S(${evalX})</h4><div class="value amber">${splineVal !== null ? Utils.formatNum(splineVal, 4) : 'N/A'}</div></div>`;
    html += '</div>';

    // Comparison table
    html += '<h3 style="margin:1rem 0 0.75rem;font-size:1rem">Comparación de Métodos</h3>';
    html += '<div id="interp-compare-table"></div>';

    // Divided differences table
    html += '<h3 style="margin:1.5rem 0 0.75rem;font-size:1rem">Tabla de Diferencias Divididas (Newton)</h3>';
    html += '<div id="interp-dd-table"></div>';

    // Prediction for missing days
    const allDays = [];
    for (let d = Math.min(...xData); d <= Math.max(...xData); d++) allDays.push(d);
    const predictions = allDays.map(d => ({
      day: d,
      lagrange: Interpolation.lagrange(xData, yData, d).value,
      newton: newtonResult.evaluate(d),
      spline: splineVal !== null ? Interpolation.cubicSpline(xData, yData).evaluate(d) : null,
      isOriginal: xData.includes(d)
    }));

    html += '<h3 style="margin:1.5rem 0 0.75rem;font-size:1rem">Estimación de Días Faltantes</h3>';
    html += '<div id="interp-pred-table"></div>';

    Utils.showResults('interp-results', html);

    // Fill comparison table
    const compRows = [
      ['Lagrange', Utils.formatNum(lagrangeResult.value, 6), xData.length - 1, 'Polinomio único'],
      ['Newton', Utils.formatNum(newtonVal, 6), xData.length - 1, 'Diferencias divididas'],
      ['Spline Cúbico', splineVal !== null ? Utils.formatNum(splineVal, 6) : 'N/A', '3 (por tramo)', 'Suave por tramos']
    ];
    Utils.createTable(['Método', `P(${evalX})`, 'Grado', 'Tipo'], compRows, 'interp-compare-table');

    // DD table
    const ddHeaders = ['x', 'f[x]', ...Array.from({ length: xData.length - 1 }, (_, i) => `Δ${i + 1}`)];
    const ddRows = xData.map((x, i) => {
      const row = [Utils.formatNum(x, 1), Utils.formatNum(yData[i], 4)];
      for (let j = 1; j < xData.length; j++) {
        row.push(newtonResult.table[j] && newtonResult.table[j][i] !== undefined ? Utils.formatNum(newtonResult.table[j][i], 6) : '');
      }
      return row;
    });
    Utils.createTable(ddHeaders, ddRows, 'interp-dd-table');

    // Predictions table
    const predRows = predictions.filter(p => !p.isOriginal).slice(0, 20).map(p => [
      p.day,
      Utils.formatNum(p.lagrange, 2),
      Utils.formatNum(p.newton, 2),
      p.spline !== null ? Utils.formatNum(p.spline, 2) : 'N/A',
      `<span class="badge badge-amber">Estimado</span>`
    ]);
    Utils.createTable(['Día', 'Lagrange', 'Newton', 'Spline', 'Estado'], predRows, 'interp-pred-table');

    // Charts
    drawInterpolationCharts(xData, yData, predictions);

    // Interpretation
    const item = priceData[currentItem];
    const interpDiv = document.getElementById('interp-interpretation');
    if (interpDiv) {
      const priceChange = ((yData[yData.length - 1] - yData[0]) / yData[0] * 100).toFixed(1);
      interpDiv.innerHTML = `<div class="interpretation-box"><h4>📊 Interpretación: Curva de Precios de ${item ? item.name : 'Producto'}</h4>
        <p>Los datos muestran un incremento de <strong>${priceChange}%</strong> en el precio durante el período analizado. La interpolación permite estimar precios para días sin datos observados.</p>
        <p><strong>¿Qué método es mejor?</strong> El spline cúbico produce curvas más suaves y naturales, mientras que Lagrange y Newton generan el mismo polinomio pero pueden oscilar en los extremos (fenómeno de Runge).</p>
        <p><strong>Uso práctico:</strong> Estas estimaciones permiten a las familias y comerciantes anticipar los precios futuros y planificar sus compras, especialmente durante períodos de escasez.</p>
      </div>`;
    }
  });

  function drawInterpolationCharts(xData, yData, predictions) {
    const labels = predictions.map(p => p.day);
    const lagrangeData = predictions.map(p => p.lagrange);
    const newtonData = predictions.map(p => p.newton);
    const splineData = predictions.map(p => p.spline);
    const originalData = predictions.map(p => p.isOriginal ? yData[xData.indexOf(p.day)] : null);

    const datasets = [
      { label: 'Datos Originales', data: originalData, borderColor: '#f1f5f9', pointRadius: 6, pointBackgroundColor: '#f1f5f9', showLine: false },
      { label: 'Lagrange', data: lagrangeData, borderColor: '#06b6d4', pointRadius: 0 },
      { label: 'Newton', data: newtonData, borderColor: '#6366f1', pointRadius: 0, borderDash: [5, 3] },
    ];
    if (splineData[0] !== null) {
      datasets.push({ label: 'Spline Cúbico', data: splineData, borderColor: '#10b981', pointRadius: 0 });
    }

    ChartManager.createLine('interp-main-chart', labels, datasets, {
      plugins: { title: { display: true, text: 'Comparación de Interpolaciones', color: '#f1f5f9', font: { size: 14, family: 'Inter' } } },
      scales: { x: { title: { display: true, text: 'Día', color: '#94a3b8' } }, y: { title: { display: true, text: 'Precio (Bs)', color: '#94a3b8' } } }
    });

    // Error chart (difference between methods)
    const errData = predictions.filter(p => p.spline !== null).map(p => Math.abs(p.lagrange - p.spline));
    const errLabels = predictions.filter(p => p.spline !== null).map(p => p.day);
    ChartManager.createLine('interp-error-chart', errLabels, [
      { label: '|Lagrange - Spline|', data: errData, borderColor: '#f59e0b', fill: true, backgroundColor: 'rgba(245,158,11,0.1)' }
    ], {
      plugins: { title: { display: true, text: 'Diferencia entre Métodos', color: '#f1f5f9', font: { size: 14, family: 'Inter' } } },
      scales: { x: { title: { display: true, text: 'Día', color: '#94a3b8' } }, y: { title: { display: true, text: 'Diferencia', color: '#94a3b8' } } }
    });
  }

  loadItem('arroz');
});
