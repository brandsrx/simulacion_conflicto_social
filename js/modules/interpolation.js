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

function formatBs(value, decimals = 2) {
  return `${Utils.formatNum(value, decimals)} Bs`;
}

function getGapStats(xData) {
  const gaps = [];
  for (let i = 1; i < xData.length; i++) gaps.push(xData[i] - xData[i - 1]);
  const maxGap = Math.max(...gaps);
  const avgGap = gaps.reduce((sum, g) => sum + g, 0) / gaps.length;
  return { gaps, maxGap, avgGap };
}

function estimateConfidence(xData, evalX, methodSpread) {
  const minX = Math.min(...xData);
  const maxX = Math.max(...xData);
  const { maxGap, avgGap } = getGapStats(xData);
  const inRange = evalX >= minX && evalX <= maxX;
  const sparse = maxGap > avgGap * 1.7 || maxGap >= 10;
  const spreadRisk = methodSpread > 1.5;

  if (!inRange) {
    return {
      level: 'Baja',
      badge: 'badge-rose',
      text: 'El punto esta fuera del intervalo observado; eso es extrapolacion y no una interpolacion confiable.'
    };
  }
  if (sparse || spreadRisk) {
    return {
      level: 'Media',
      badge: 'badge-amber',
      text: 'La estimacion es util como aproximacion, pero los datos son dispersos o los metodos difieren de forma apreciable.'
    };
  }
  return {
    level: 'Alta',
    badge: 'badge-emerald',
    text: 'La estimacion esta dentro del rango de datos y los metodos mantienen diferencias pequenas.'
  };
}

function getProductIncrementSummary(priceData) {
  return Object.entries(priceData).map(([key, item]) => {
    const first = item.data[0].price;
    const last = item.data[item.data.length - 1].price;
    return {
      key,
      name: item.name,
      abs: last - first,
      pct: ((last - first) / first) * 100
    };
  }).sort((a, b) => b.pct - a.pct);
}

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
    if (!text) throw new Error('Ingrese datos en formato dia,precio');
    const lines = text.split('\n').filter(l => l.trim());
    const points = [];
    lines.forEach((line, index) => {
      const parts = line.split(',').map(s => parseFloat(s.trim()));
      if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        if (parts[0] <= 0 || parts[0] > 366) throw new Error(`Linea ${index + 1}: el dia debe ser positivo`);
        if (parts[1] <= 0) throw new Error(`Linea ${index + 1}: el precio debe ser mayor a cero`);
        points.push({ x: parts[0], y: parts[1] });
      } else {
        throw new Error(`Linea ${index + 1}: use el formato dia,precio`);
      }
    });
    points.sort((a, b) => a.x - b.x);
    const repeated = points.find((p, i) => i > 0 && p.x === points[i - 1].x);
    if (repeated) throw new Error(`El dia ${repeated.x} esta repetido; cada dia debe tener un solo precio`);
    if (points.length < 3) throw new Error('Se necesitan al menos 3 puntos para comparar Lagrange, Newton y spline cubico');
    const xData = points.map(p => p.x);
    const yData = points.map(p => p.y);
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
    if (isNaN(evalX)) {
      Utils.showResults('interp-results', `<div class="glass-card" style="border-color:var(--accent-rose)"><p style="color:var(--accent-rose)">Ingrese un dia valido para evaluar.</p></div>`);
      return;
    }

    // All three methods
    const lagrangeResult = Interpolation.lagrange(xData, yData, evalX);
    const newtonResult = Interpolation.newtonDividedDiff(xData, yData);
    const newtonVal = newtonResult.evaluate(evalX);
    const spline = Interpolation.cubicSpline(xData, yData);
    const splineVal = spline.evaluate(evalX);
    const methodValues = [lagrangeResult.value, newtonVal, splineVal].filter(v => typeof v === 'number' && isFinite(v));
    const methodSpread = Math.max(...methodValues) - Math.min(...methodValues);
    const confidence = estimateConfidence(xData, evalX, methodSpread);
    const selectedEstimate = splineVal;
    const isMissingDay = !xData.includes(evalX);

    // Results cards
    let html = '<div class="grid-3" style="margin-bottom:1.5rem">';
    html += `<div class="result-card"><h4>Lagrange P(${evalX})</h4><div class="value cyan">${Utils.formatNum(lagrangeResult.value, 4)}</div></div>`;
    html += `<div class="result-card"><h4>Newton P(${evalX})</h4><div class="value emerald">${Utils.formatNum(newtonVal, 4)}</div></div>`;
    html += `<div class="result-card"><h4>Spline S(${evalX})</h4><div class="value amber">${Utils.formatNum(splineVal, 4)}</div></div>`;
    html += '</div>';

    html += `<div class="interpretation-box" style="margin-bottom:1.5rem"><h4>Respuesta directa</h4>
      <p><strong>Precio aproximado en el dia ${evalX}:</strong> ${formatBs(selectedEstimate)} usando spline cubico como estimacion principal. ${isMissingDay ? 'Ese dia no existe en la tabla observada.' : 'Ese dia coincide con un dato observado.'}</p>
      <p><strong>Confiabilidad:</strong> <span class="badge ${confidence.badge}">${confidence.level}</span> ${confidence.text}</p>
    </div>`;

    html += '<h3 style="margin:1rem 0 0.75rem;font-size:1rem">Tabla de Datos Observados</h3>';
    html += '<div id="interp-data-table"></div>';

    // Comparison table
    html += '<h3 style="margin:1rem 0 0.75rem;font-size:1rem">Comparación de Métodos</h3>';
    html += '<div id="interp-compare-table"></div>';

    // Divided differences table
    html += '<h3 style="margin:1.5rem 0 0.75rem;font-size:1rem">Tabla de Diferencias Divididas (Newton)</h3>';
    html += '<div id="interp-dd-table"></div>';

    // Prediction for missing days
    const minX = Math.min(...xData);
    const maxX = Math.max(...xData);
    const allDays = [];
    for (let d = Math.ceil(minX); d <= Math.floor(maxX); d++) allDays.push(d);
    const predictions = allDays.map(d => ({
      day: d,
      lagrange: Interpolation.lagrange(xData, yData, d).value,
      newton: newtonResult.evaluate(d),
      spline: spline.evaluate(d),
      isOriginal: xData.includes(d)
    }));

    html += '<h3 style="margin:1.5rem 0 0.75rem;font-size:1rem">Estimación de Días Faltantes</h3>';
    html += '<div id="interp-pred-table"></div>';

    Utils.showResults('interp-results', html);

    const dataRows = xData.map((x, i) => [
      Utils.formatNum(x, 2),
      formatBs(yData[i]),
      i === 0 ? 'Inicial' : `${formatBs(yData[i] - yData[i - 1])} desde dato anterior`
    ]);
    Utils.createTable(['Dia', 'Precio observado', 'Variacion local'], dataRows, 'interp-data-table');

    // Fill comparison table
    const compRows = [
      ['Lagrange', Utils.formatNum(lagrangeResult.value, 6), xData.length - 1, 'Polinomio unico; puede oscilar con muchos puntos'],
      ['Newton', Utils.formatNum(newtonVal, 6), xData.length - 1, 'Mismo polinomio que Lagrange, calculado con diferencias divididas'],
      ['Spline Cubico', Utils.formatNum(splineVal, 6), '3 por tramo', 'Curva suave por intervalos; mas estable visualmente']
    ];
    Utils.createTable(['Metodo', `Estimacion en dia ${evalX}`, 'Grado', 'Comportamiento'], compRows, 'interp-compare-table');

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
    const predRows = predictions.filter(p => !p.isOriginal).map(p => [
      p.day,
      Utils.formatNum(p.lagrange, 2),
      Utils.formatNum(p.newton, 2),
      Utils.formatNum(p.spline, 2),
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
      const increments = getProductIncrementSummary(priceData);
      const maxProduct = increments[0];
      const { maxGap, avgGap } = getGapStats(xData);
      const trend = yData[yData.length - 1] > yData[0] ? 'creciente' : 'decreciente o estable';
      interpDiv.innerHTML = `<div class="interpretation-box"><h4>Interpretacion economica y social: ${item ? item.name : 'Producto'}</h4>
        <p><strong>Comportamiento durante el mes:</strong> la curva es ${trend}; el precio cambia de ${formatBs(yData[0])} a ${formatBs(yData[yData.length - 1])}, con un incremento de <strong>${priceChange}%</strong>.</p>
        <p><strong>Producto con mayor incremento:</strong> ${maxProduct.name}, con ${Utils.formatNum(maxProduct.pct, 1)}% de aumento (${formatBs(maxProduct.abs)}). Esta comparacion usa los datos base de todos los productos.</p>
        <p><strong>Comparacion de metodos:</strong> Lagrange y Newton deben coincidir porque representan el mismo polinomio interpolante. El spline cubico conserva continuidad y suavidad por tramos, por eso es preferible para visualizar precios cuando se quiere evitar oscilaciones artificiales.</p>
        <p><strong>Datos dispersos:</strong> el mayor salto entre observaciones es de ${Utils.formatNum(maxGap, 2)} dias y el promedio es ${Utils.formatNum(avgGap, 2)} dias. Si los puntos estan muy separados, la curva puede ocultar cambios bruscos reales y la confiabilidad baja, especialmente en extremos.</p>
        <p><strong>Interpretacion:</strong> una pendiente creciente representa perdida de poder adquisitivo y presion sobre hogares y comerciantes. La interpolacion no prueba causalidad; solo estima valores intermedios consistentes con los datos disponibles.</p>
      </div>`;
    }
  });

  function drawInterpolationCharts(xData, yData, predictions) {
    const newton = Interpolation.newtonDividedDiff(xData, yData);
    const spline = Interpolation.cubicSpline(xData, yData);
    const minX = Math.min(...xData);
    const maxX = Math.max(...xData);
    const step = Math.max((maxX - minX) / 160, 0.1);
    const curvePoints = [];
    for (let x = minX; x <= maxX + 1e-9; x += step) curvePoints.push(Number(x.toFixed(3)));
    const labels = curvePoints.map(x => Utils.formatNum(x, 2));
    const lagrangeData = curvePoints.map(x => ({ x, y: Interpolation.lagrange(xData, yData, x).value }));
    const newtonData = curvePoints.map(x => ({ x, y: newton.evaluate(x) }));
    const splineData = curvePoints.map(x => ({ x, y: spline.evaluate(x) }));
    const originalScatter = xData.map((x, i) => ({ x, y: yData[i] }));

    const datasets = [
      { label: 'Datos Originales', data: originalScatter, borderColor: '#f1f5f9', pointRadius: 6, pointBackgroundColor: '#f1f5f9', showLine: false, parsing: false },
      { label: 'Lagrange', data: lagrangeData, borderColor: '#06b6d4', pointRadius: 0, parsing: false },
      { label: 'Newton', data: newtonData, borderColor: '#6366f1', pointRadius: 0, borderDash: [5, 3], parsing: false },
      { label: 'Spline Cubico', data: splineData, borderColor: '#10b981', pointRadius: 0, parsing: false }
    ];

    ChartManager.createLine('interp-main-chart', labels, datasets, {
      plugins: { title: { display: true, text: 'Comparación de Interpolaciones', color: '#f1f5f9', font: { size: 14, family: 'Inter' } } },
      scales: { x: { type: 'linear', title: { display: true, text: 'Día', color: '#94a3b8' } }, y: { title: { display: true, text: 'Precio (Bs)', color: '#94a3b8' } } }
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
