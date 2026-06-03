/* ============================================
   Integration Module
   Trapezoidal, Simpson 1/3, Simpson 3/8
   ============================================ */

const Integration = {
  trapezoidal(xData, yData) {
    let sum = 0;
    const partials = [];
    for (let i = 0; i < xData.length - 1; i++) {
      const h = xData[i + 1] - xData[i];
      const area = h * (yData[i] + yData[i + 1]) / 2;
      sum += area;
      partials.push({ i, x0: xData[i], x1: xData[i + 1], y0: yData[i], y1: yData[i + 1], area, cumulative: sum });
    }
    return { result: sum, partials };
  },

  trapezoidalFunc(f, a, b, n) {
    const h = (b - a) / n;
    let sum = f(a) + f(b);
    const partials = [];
    for (let i = 1; i < n; i++) {
      const x = a + i * h;
      sum += 2 * f(x);
    }
    const result = (h / 2) * sum;
    // Build partials
    let cumulative = 0;
    for (let i = 0; i < n; i++) {
      const x0 = a + i * h, x1 = a + (i + 1) * h;
      const area = h * (f(x0) + f(x1)) / 2;
      cumulative += area;
      partials.push({ i, x0, x1, y0: f(x0), y1: f(x1), area, cumulative });
    }
    return { result, partials, h };
  },

  simpson13(xData, yData) {
    const n = xData.length - 1;
    if (n % 2 !== 0) {
      // Adjust: use available even segments
      const usableN = n - (n % 2);
      if (usableN < 2) throw new Error('Se necesitan al menos 3 puntos equiespaciados para Simpson 1/3');
      const h = xData[1] - xData[0];
      let sum = yData[0] + yData[usableN];
      for (let i = 1; i < usableN; i++) sum += (i % 2 === 0 ? 2 : 4) * yData[i];
      return { result: (h / 3) * sum, n: usableN };
    }
    const h = xData[1] - xData[0];
    let sum = yData[0] + yData[n];
    for (let i = 1; i < n; i++) sum += (i % 2 === 0 ? 2 : 4) * yData[i];
    return { result: (h / 3) * sum, n, h };
  },

  simpson13Func(f, a, b, n) {
    if (n % 2 !== 0) n++;
    const h = (b - a) / n;
    let sum = f(a) + f(b);
    for (let i = 1; i < n; i++) {
      const x = a + i * h;
      sum += (i % 2 === 0 ? 2 : 4) * f(x);
    }
    return { result: (h / 3) * sum, n, h };
  },

  simpson38(xData, yData) {
    const n = xData.length - 1;
    if (n % 3 !== 0) {
      const usableN = n - (n % 3);
      if (usableN < 3) throw new Error('Se necesitan al menos 4 puntos equiespaciados para Simpson 3/8');
      const h = xData[1] - xData[0];
      let sum = yData[0] + yData[usableN];
      for (let i = 1; i < usableN; i++) sum += (i % 3 === 0 ? 2 : 3) * yData[i];
      return { result: (3 * h / 8) * sum, n: usableN };
    }
    const h = xData[1] - xData[0];
    let sum = yData[0] + yData[n];
    for (let i = 1; i < n; i++) sum += (i % 3 === 0 ? 2 : 3) * yData[i];
    return { result: (3 * h / 8) * sum, n, h };
  },

  simpson38Func(f, a, b, n) {
    if (n % 3 !== 0) n += (3 - n % 3);
    const h = (b - a) / n;
    let sum = f(a) + f(b);
    for (let i = 1; i < n; i++) {
      const x = a + i * h;
      sum += (i % 3 === 0 ? 2 : 3) * f(x);
    }
    return { result: (3 * h / 8) * sum, n, h };
  }
};

// ---- PAGE CONTROLLER ----
document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('integ-module')) return;

  const familyData = SampleData.familyCosts;

  function loadSampleData() {
    const lines = familyData.dailyPrices.map((p, i) => `${i + 1},${p}`).join('\n');
    document.getElementById('integ-data-input').value = lines;
  }

  document.getElementById('integ-load-sample')?.addEventListener('click', loadSampleData);

  // Solve
  document.getElementById('integ-solve-btn')?.addEventListener('click', () => {
    const text = document.getElementById('integ-data-input').value.trim();
    const lines = text.split('\n').filter(l => l.trim());
    const xData = [], yData = [];
    lines.forEach(line => {
      const parts = line.split(',').map(s => parseFloat(s.trim()));
      if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        xData.push(parts[0]); yData.push(parts[1]);
      }
    });

    if (xData.length < 2) {
      Utils.showResults('integ-results', '<div class="glass-card" style="border-color:var(--accent-rose)"><p style="color:var(--accent-rose)">Se necesitan al menos 2 puntos de datos</p></div>');
      return;
    }

    // Apply all methods
    const trapResult = Integration.trapezoidal(xData, yData);
    let s13Result = null, s38Result = null;
    try { s13Result = Integration.simpson13(xData, yData); } catch (e) { }
    try { s38Result = Integration.simpson38(xData, yData); } catch (e) { }

    // Results
    const normalCost = familyData.normalDaily * xData.length;
    let html = '<div class="grid-4" style="margin-bottom:1.5rem">';
    html += `<div class="result-card"><h4>Trapecios</h4><div class="value cyan">${Utils.formatNum(trapResult.result, 2)} Bs</div></div>`;
    html += `<div class="result-card"><h4>Simpson 1/3</h4><div class="value emerald">${s13Result ? Utils.formatNum(s13Result.result, 2) + ' Bs' : 'N/A'}</div></div>`;
    html += `<div class="result-card"><h4>Simpson 3/8</h4><div class="value amber">${s38Result ? Utils.formatNum(s38Result.result, 2) + ' Bs' : 'N/A'}</div></div>`;
    const extraCost = trapResult.result - normalCost;
    html += `<div class="result-card"><h4>Sobrecosto</h4><div class="value rose">+${Utils.formatNum(Math.max(0, extraCost), 2)} Bs</div></div>`;
    html += '</div>';

    // Comparison table
    html += '<h3 style="margin:1rem 0 0.75rem;font-size:1rem">Comparación de Métodos</h3><div id="integ-compare-table"></div>';

    // Monthly breakdown
    html += '<h3 style="margin:1.5rem 0 0.75rem;font-size:1rem">Acumulación por Semana</h3><div id="integ-weekly-table"></div>';

    // Trapezoid detail
    html += '<h3 style="margin:1.5rem 0 0.75rem;font-size:1rem">Detalle de Integración (Trapecios)</h3><div id="integ-detail-table"></div>';

    Utils.showResults('integ-results', html);

    // Comparison
    const compRows = [
      ['Trapecios', Utils.formatNum(trapResult.result, 4), xData.length - 1, 'O(h²)'],
      ['Simpson 1/3', s13Result ? Utils.formatNum(s13Result.result, 4) : 'N/A', s13Result ? s13Result.n : '-', 'O(h⁴)'],
      ['Simpson 3/8', s38Result ? Utils.formatNum(s38Result.result, 4) : 'N/A', s38Result ? s38Result.n : '-', 'O(h⁴)']
    ];
    Utils.createTable(['Método', 'Resultado (Bs)', 'Subintervalos', 'Orden Error'], compRows, 'integ-compare-table');

    // Weekly breakdown
    const weekSize = 7;
    const weeklyRows = [];
    let weekCum = 0;
    for (let w = 0; w < Math.ceil(xData.length / weekSize); w++) {
      const start = w * weekSize;
      const end = Math.min(start + weekSize, xData.length);
      const weekX = xData.slice(start, end);
      const weekY = yData.slice(start, end);
      if (weekX.length >= 2) {
        const weekCost = Integration.trapezoidal(weekX, weekY).result;
        weekCum += weekCost;
        const normalWeek = familyData.normalDaily * (end - start);
        weeklyRows.push([
          `Semana ${w + 1}`,
          `Día ${start + 1} - ${end}`,
          Utils.formatNum(weekCost, 2),
          Utils.formatNum(normalWeek, 2),
          Utils.formatNum(weekCost - normalWeek, 2),
          Utils.formatNum(weekCum, 2)
        ]);
      }
    }
    Utils.createTable(['Semana', 'Período', 'Costo Crisis', 'Costo Normal', 'Diferencia', 'Acumulado'], weeklyRows, 'integ-weekly-table');

    // Detail table
    const detailRows = trapResult.partials.map(p => [
      p.i + 1,
      `[${Utils.formatNum(p.x0, 0)}, ${Utils.formatNum(p.x1, 0)}]`,
      Utils.formatNum(p.y0, 2),
      Utils.formatNum(p.y1, 2),
      Utils.formatNum(p.area, 4),
      Utils.formatNum(p.cumulative, 2)
    ]);
    Utils.createTable(['#', 'Intervalo', 'f(a)', 'f(b)', 'Área', 'Acumulado'], detailRows, 'integ-detail-table');

    // Charts
    drawIntegrationCharts(xData, yData, trapResult);

    // Interpretation
    const interpDiv = document.getElementById('integ-interpretation');
    if (interpDiv) {
      const pctIncrease = ((trapResult.result - normalCost) / normalCost * 100).toFixed(1);
      interpDiv.innerHTML = `<div class="interpretation-box"><h4>📊 Interpretación: Costos Acumulados de la Canasta Familiar</h4>
        <p>El costo acumulado de la canasta familiar durante ${xData.length} días de crisis es de <strong>${Utils.formatNum(trapResult.result, 2)} Bs</strong>, comparado con un costo normal estimado de <strong>${Utils.formatNum(normalCost, 2)} Bs</strong>.</p>
        <p>Esto representa un incremento del <strong>${pctIncrease}%</strong> en el gasto familiar total.</p>
        <p><strong>Comparación de métodos:</strong> La regla de Simpson 1/3 y 3/8 ofrecen mayor precisión (error O(h⁴)) que la regla del trapecio (O(h²)), especialmente cuando la curva de precios presenta curvatura significativa.</p>
        <p><strong>Impacto social:</strong> Una familia promedio enfrenta un sobrecosto de <strong>${Utils.formatNum(Math.max(0, extraCost), 2)} Bs</strong> durante el período de crisis, lo que puede representar una pérdida significativa del poder adquisitivo.</p>
      </div>`;
    }
  });

  function drawIntegrationCharts(xData, yData, trapResult) {
    // Area under curve
    ChartManager.createLine('integ-area-chart', xData.map(x => `Día ${x}`), [
      { label: 'Precio diario (Bs)', data: yData, borderColor: '#06b6d4', fill: true, backgroundColor: 'rgba(6,182,212,0.15)', tension: 0.3 },
      { label: 'Precio normal', data: new Array(xData.length).fill(familyData.normalDaily), borderColor: '#f43f5e', borderDash: [5, 5], pointRadius: 0 }
    ], {
      plugins: { title: { display: true, text: 'Área Bajo la Curva — Costo Acumulado', color: '#f1f5f9', font: { size: 14, family: 'Inter' } } },
      scales: { y: { title: { display: true, text: 'Precio (Bs)', color: '#94a3b8' } } }
    });

    // Cumulative chart
    const cumLabels = trapResult.partials.map(p => `Día ${p.x1}`);
    const cumData = trapResult.partials.map(p => p.cumulative);
    const normalCum = trapResult.partials.map((p, i) => familyData.normalDaily * (i + 1));
    ChartManager.createLine('integ-cum-chart', cumLabels, [
      { label: 'Costo acumulado (crisis)', data: cumData, borderColor: '#f59e0b', fill: true, backgroundColor: 'rgba(245,158,11,0.1)' },
      { label: 'Costo acumulado (normal)', data: normalCum, borderColor: '#10b981', borderDash: [5, 5] }
    ], {
      plugins: { title: { display: true, text: 'Gasto Acumulado vs Normal', color: '#f1f5f9', font: { size: 14, family: 'Inter' } } },
      scales: { y: { title: { display: true, text: 'Bs acumulados', color: '#94a3b8' } } }
    });
  }

  loadSampleData();
});
