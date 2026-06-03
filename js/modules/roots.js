/* ============================================
   Roots Module
   Bisection, Newton-Raphson, Secant
   ============================================ */

const Roots = {
  bisection(f, a, b, tol = 1e-6, maxIter = 100) {
    const history = [];
    if (f(a) * f(b) > 0) throw new Error('f(a) y f(b) deben tener signos opuestos');
    for (let i = 0; i < maxIter; i++) {
      const c = (a + b) / 2;
      const fc = f(c);
      const err = Math.abs(b - a) / 2;
      history.push({ iter: i + 1, a, b, c, fc, error: err });
      if (Math.abs(fc) < tol || err < tol) return { root: c, converged: true, iterations: i + 1, history };
      if (f(a) * fc < 0) b = c; else a = c;
    }
    return { root: (a + b) / 2, converged: false, iterations: maxIter, history };
  },

  newtonRaphson(f, df, x0, tol = 1e-6, maxIter = 100) {
    const history = [];
    let x = x0;
    for (let i = 0; i < maxIter; i++) {
      const fx = f(x);
      const dfx = df(x);
      if (Math.abs(dfx) < 1e-14) throw new Error('Derivada cero encontrada');
      const xNew = x - fx / dfx;
      const err = Math.abs(xNew - x);
      history.push({ iter: i + 1, x, fx, dfx, xNew, error: err });
      if (err < tol) return { root: xNew, converged: true, iterations: i + 1, history };
      x = xNew;
    }
    return { root: x, converged: false, iterations: maxIter, history };
  },

  secant(f, x0, x1, tol = 1e-6, maxIter = 100) {
    const history = [];
    for (let i = 0; i < maxIter; i++) {
      const f0 = f(x0), f1 = f(x1);
      if (Math.abs(f1 - f0) < 1e-14) throw new Error('División por cero en método secante');
      const x2 = x1 - f1 * (x1 - x0) / (f1 - f0);
      const err = Math.abs(x2 - x1);
      history.push({ iter: i + 1, x0, x1, x2, fx1: f1, error: err });
      if (err < tol) return { root: x2, converged: true, iterations: i + 1, history };
      x0 = x1; x1 = x2;
    }
    return { root: x1, converged: false, iterations: maxIter, history };
  }
};

// ---- PAGE CONTROLLER ----
document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('roots-module')) return;

  const thresholds = SampleData.criticalThresholds.functions;
  let currentFunction = 'reserve';
  let userCustom = false;

  // Load preset
  function loadPreset(key) {
    currentFunction = key;
    userCustom = false;
    const t = thresholds[key];
    document.getElementById('roots-func-expr').value = t.expr;
    document.getElementById('roots-interval-a').value = t.interval[0];
    document.getElementById('roots-interval-b').value = t.interval[1];
    document.getElementById('roots-x0').value = (t.interval[0] + t.interval[1]) / 2;
    document.getElementById('roots-func-desc').textContent = t.description;
  }

  document.querySelectorAll('.threshold-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.threshold-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      loadPreset(btn.dataset.func);
    });
  });

  // Parse function from preset or custom
  function getFunction() {
    if (!userCustom && thresholds[currentFunction]) {
      return { f: thresholds[currentFunction].f, df: thresholds[currentFunction].df };
    }
    const expr = document.getElementById('roots-func-expr').value;
    try {
      const f = new Function('x', `return ${expr.replace(/\^/g, '**').replace(/e\*\*/g, 'Math.E**').replace(/Math\.E\*\*\(/g, 'Math.exp(').replace(/sin/g, 'Math.sin').replace(/cos/g, 'Math.cos').replace(/log/g, 'Math.log').replace(/sqrt/g, 'Math.sqrt').replace(/abs/g, 'Math.abs').replace(/pi/g, 'Math.PI')}`);
      f(1); // test
      const h = 1e-8;
      const df = (x) => (f(x + h) - f(x - h)) / (2 * h);
      return { f, df };
    } catch (e) {
      throw new Error('Expresión de función inválida');
    }
  }

  document.getElementById('roots-func-expr')?.addEventListener('input', () => { userCustom = true; });

  // Solve
  document.getElementById('roots-solve-btn')?.addEventListener('click', () => {
    const method = document.getElementById('roots-method').value;
    const a = parseFloat(document.getElementById('roots-interval-a').value);
    const b = parseFloat(document.getElementById('roots-interval-b').value);
    const x0 = parseFloat(document.getElementById('roots-x0').value);
    const tol = parseFloat(document.getElementById('roots-tolerance').value || 1e-6);
    const maxIter = parseInt(document.getElementById('roots-max-iter').value || 100);

    let result, fns;
    try {
      fns = getFunction();
      switch (method) {
        case 'bisection': result = Roots.bisection(fns.f, a, b, tol, maxIter); break;
        case 'newton': result = Roots.newtonRaphson(fns.f, fns.df, x0, tol, maxIter); break;
        case 'secant': result = Roots.secant(fns.f, a, b, tol, maxIter); break;
      }
    } catch (err) {
      Utils.showResults('roots-results', `<div class="glass-card" style="border-color:var(--accent-rose)"><p style="color:var(--accent-rose)">Error: ${err.message}</p></div>`);
      return;
    }

    displayRootResults(result, method, fns, a, b);
  });

  // Compare all methods
  document.getElementById('roots-compare-btn')?.addEventListener('click', () => {
    const a = parseFloat(document.getElementById('roots-interval-a').value);
    const b = parseFloat(document.getElementById('roots-interval-b').value);
    const x0 = parseFloat(document.getElementById('roots-x0').value);
    const tol = parseFloat(document.getElementById('roots-tolerance').value || 1e-6);
    const maxIter = parseInt(document.getElementById('roots-max-iter').value || 100);

    let fns;
    try { fns = getFunction(); } catch (e) { return; }

    const results = [];
    const methods = [
      { key: 'bisection', name: 'Bisección', fn: () => Roots.bisection(fns.f, a, b, tol, maxIter) },
      { key: 'newton', name: 'Newton-Raphson', fn: () => Roots.newtonRaphson(fns.f, fns.df, x0, tol, maxIter) },
      { key: 'secant', name: 'Secante', fn: () => Roots.secant(fns.f, a, b, tol, maxIter) }
    ];

    methods.forEach(m => {
      try {
        const r = m.fn();
        results.push({ name: m.name, ...r });
      } catch (e) {
        results.push({ name: m.name, converged: false, root: null, error: e.message, iterations: 0, history: [] });
      }
    });

    displayComparison(results, fns, a, b);
  });

  function displayRootResults(result, method, fns, a, b) {
    const t = thresholds[currentFunction];
    let html = '<div class="grid-4" style="margin-bottom:1.5rem">';
    html += `<div class="result-card"><h4>Raíz Encontrada</h4><div class="value cyan">${Utils.formatNum(result.root, 8)}</div></div>`;
    html += `<div class="result-card"><h4>f(raíz)</h4><div class="value emerald">${Utils.formatNum(fns.f(result.root), 10)}</div></div>`;
    html += `<div class="result-card"><h4>Iteraciones</h4><div class="value amber">${result.iterations}</div></div>`;
    html += `<div class="result-card"><h4>Convergencia</h4><div class="value ${result.converged ? 'emerald' : 'rose'}">${result.converged ? 'Sí' : 'No'}</div></div>`;
    html += '</div>';

    // Iteration table
    html += '<h3 style="margin:1.5rem 0 0.75rem;font-size:1rem">Tabla de Iteraciones</h3><div id="roots-iter-table"></div>';
    Utils.showResults('roots-results', html);

    let headers, rows;
    if (method === 'bisection') {
      headers = ['Iter', 'a', 'b', 'c', 'f(c)', 'Error'];
      rows = result.history.map(h => [h.iter, Utils.formatNum(h.a), Utils.formatNum(h.b), Utils.formatNum(h.c), Utils.formatNum(h.fc, 8), Utils.formatNum(h.error, 8)]);
    } else if (method === 'newton') {
      headers = ['Iter', 'xₙ', 'f(xₙ)', "f'(xₙ)", 'xₙ₊₁', 'Error'];
      rows = result.history.map(h => [h.iter, Utils.formatNum(h.x), Utils.formatNum(h.fx, 8), Utils.formatNum(h.dfx, 8), Utils.formatNum(h.xNew), Utils.formatNum(h.error, 8)]);
    } else {
      headers = ['Iter', 'x₀', 'x₁', 'x₂', 'f(x₁)', 'Error'];
      rows = result.history.map(h => [h.iter, Utils.formatNum(h.x0), Utils.formatNum(h.x1), Utils.formatNum(h.x2), Utils.formatNum(h.fx1, 8), Utils.formatNum(h.error, 8)]);
    }
    Utils.createTable(headers, rows, 'roots-iter-table');

    // Function graph
    drawFunctionGraph(fns.f, a, b, result.root);

    // Convergence chart
    const convLabels = result.history.map(h => h.iter);
    const convErrors = result.history.map(h => h.error);
    ChartManager.createLine('roots-conv-chart', convLabels, [
      { label: 'Error', data: convErrors, borderColor: '#f59e0b', fill: true, backgroundColor: 'rgba(245,158,11,0.1)' }
    ], {
      plugins: { title: { display: true, text: 'Convergencia', color: '#f1f5f9', font: { size: 14, family: 'Inter' } } },
      scales: { y: { type: 'logarithmic', title: { display: true, text: 'Error', color: '#94a3b8' } } }
    });

    // Interpretation
    const interpDiv = document.getElementById('roots-interpretation');
    if (interpDiv && t) {
      interpDiv.innerHTML = `<div class="interpretation-box"><h4>📊 Interpretación: ${t.name}</h4>
        <p>${t.description}. El método encontró que el valor crítico es <strong>${Utils.formatNum(result.root, 4)}</strong>.</p>
        <p><strong>¿Qué significa?</strong> Este valor indica el punto exacto donde el sistema alcanza un umbral crítico. Antes de este punto, el sistema se mantiene estable; después, se entra en zona de riesgo.</p>
        <p><strong>Para los tomadores de decisiones:</strong> Conocer este umbral permite planificar intervenciones preventivas antes de que la situación se deteriore irreversiblemente.</p>
      </div>`;
    }
  }

  function drawFunctionGraph(f, a, b, root) {
    const n = 200;
    const margin = (b - a) * 0.1;
    const xa = a - margin, xb = b + margin;
    const step = (xb - xa) / n;
    const labels = [], values = [];
    for (let i = 0; i <= n; i++) {
      const x = xa + i * step;
      labels.push(Utils.formatNum(x, 2));
      values.push(f(x));
    }
    const rootIdx = Math.round((root - xa) / step);
    const pointData = new Array(n + 1).fill(null);
    if (rootIdx >= 0 && rootIdx <= n) pointData[rootIdx] = f(root);

    ChartManager.createLine('roots-func-chart', labels, [
      { label: 'f(x)', data: values, borderColor: '#6366f1', pointRadius: 0, tension: 0.2 },
      { label: 'Raíz', data: pointData, borderColor: '#f43f5e', pointRadius: 8, pointBackgroundColor: '#f43f5e', showLine: false }
    ], {
      plugins: { title: { display: true, text: 'Gráfica de la Función', color: '#f1f5f9', font: { size: 14, family: 'Inter' } } },
      scales: { x: { title: { display: true, text: 'x', color: '#94a3b8' } }, y: { title: { display: true, text: 'f(x)', color: '#94a3b8' } } }
    });
  }

  function displayComparison(results, fns, a, b) {
    const headers = ['Método', 'Raíz', 'f(raíz)', 'Iteraciones', 'Convergió'];
    const rows = results.map(r => [
      r.name,
      r.root !== null ? Utils.formatNum(r.root, 8) : 'Error',
      r.root !== null ? Utils.formatNum(fns.f(r.root), 10) : '-',
      r.iterations,
      r.converged ? '<span class="badge badge-emerald">Sí</span>' : '<span class="badge badge-rose">No</span>'
    ]);
    let html = '<h3 style="margin:0 0 1rem;font-size:1.1rem">Comparación de Métodos</h3><div id="roots-compare-table"></div>';
    Utils.showResults('roots-results', html);
    Utils.createTable(headers, rows, 'roots-compare-table');

    // Convergence comparison
    const convData = results.filter(r => r.history && r.history.length > 1);
    if (convData.length > 0) {
      const maxLen = Math.max(...convData.map(r => r.history.length));
      const labels = Array.from({ length: maxLen }, (_, i) => i + 1);
      const datasets = convData.map((r, i) => ({
        label: r.name, data: r.history.map(h => h.error),
        borderColor: ChartManager.defaults.palette[i]
      }));
      ChartManager.createLine('roots-conv-chart', labels, datasets, {
        plugins: { title: { display: true, text: 'Comparación de Convergencia', color: '#f1f5f9', font: { size: 14, family: 'Inter' } } },
        scales: { y: { type: 'logarithmic' } }
      });
    }

    if (convData.length > 0) drawFunctionGraph(fns.f, a, b, results[0].root);
  }

  // Init
  loadPreset('reserve');
});
