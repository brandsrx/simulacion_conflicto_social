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
  let currentFunction = 'costoIngreso';
  let userCustom = false;

  function methodName(key) {
    return { bisection: 'Biseccion', newton: 'Newton-Raphson', secant: 'Secante' }[key] || key;
  }

  function normalizeExpr(expr) {
    return expr
      .replace(/\^/g, '**')
      .replace(/\bexp\s*\(/g, 'Math.exp(')
      .replace(/\bsin\s*\(/g, 'Math.sin(')
      .replace(/\bcos\s*\(/g, 'Math.cos(')
      .replace(/\btan\s*\(/g, 'Math.tan(')
      .replace(/\blog\s*\(/g, 'Math.log(')
      .replace(/\bsqrt\s*\(/g, 'Math.sqrt(')
      .replace(/\babs\s*\(/g, 'Math.abs(')
      .replace(/\bpi\b/gi, 'Math.PI')
      .replace(/\be\b/g, 'Math.E');
  }

  function estimateOrder(history) {
    const errors = history.map(h => h.error).filter(e => e > 0 && isFinite(e));
    if (errors.length < 4) return 'No estimable';
    const e0 = errors[errors.length - 3];
    const e1 = errors[errors.length - 2];
    const e2 = errors[errors.length - 1];
    const denom = Math.log(e1 / e0);
    if (!isFinite(denom) || Math.abs(denom) < 1e-12) return 'No estimable';
    const p = Math.log(e2 / e1) / denom;
    return isFinite(p) && p > 0 ? Utils.formatNum(p, 3) : 'No estimable';
  }

  function validateInputs(a, b, x0, tol, maxIter) {
    if (![a, b, x0, tol, maxIter].every(v => typeof v === 'number' && isFinite(v))) {
      throw new Error('Todos los parametros numericos deben ser validos');
    }
    if (a === b) throw new Error('El intervalo no puede tener extremos iguales');
    if (tol <= 0) throw new Error('La tolerancia debe ser mayor a cero');
    if (maxIter < 1) throw new Error('El maximo de iteraciones debe ser positivo');
  }

  function loadPreset(key) {
    currentFunction = key;
    userCustom = false;
    const t = thresholds[key];
    if (!t) return;
    document.getElementById('roots-func-expr').value = t.expr;
    document.getElementById('roots-interval-a').value = t.interval[0];
    document.getElementById('roots-interval-b').value = t.interval[1];
    document.getElementById('roots-x0').value = (t.interval[0] + t.interval[1]) / 2;
    document.getElementById('roots-func-desc').textContent = t.description;
    document.getElementById('roots-results').style.display = 'none';
    document.getElementById('roots-interpretation').innerHTML = '';
  }

  document.querySelectorAll('.threshold-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.threshold-btn').forEach(b => {
        b.classList.remove('active', 'btn-primary');
        b.classList.add('btn-secondary');
      });
      btn.classList.add('active', 'btn-primary');
      btn.classList.remove('btn-secondary');
      loadPreset(btn.dataset.func);
    });
  });

  function getFunction() {
    if (!userCustom && thresholds[currentFunction]) {
      return { f: thresholds[currentFunction].f, df: thresholds[currentFunction].df, meta: thresholds[currentFunction] };
    }
    const expr = normalizeExpr(document.getElementById('roots-func-expr').value.trim());
    if (!expr) throw new Error('Ingrese una funcion f(x)');
    try {
      const f = new Function('x', `"use strict"; const y = ${expr}; if (!Number.isFinite(y)) throw new Error("no finita"); return y;`);
      f(1);
      const h = 1e-6;
      const df = (x) => (f(x + h) - f(x - h)) / (2 * h);
      return { f, df, meta: { name: 'Funcion personalizada', description: 'Modelo ingresado por el usuario' } };
    } catch (e) {
      throw new Error('Expresion invalida. Use una formula en x, por ejemplo: 8.5*x + 1.05*x^2 - 3500');
    }
  }

  function readConfig() {
    const a = parseFloat(document.getElementById('roots-interval-a').value);
    const b = parseFloat(document.getElementById('roots-interval-b').value);
    const x0 = parseFloat(document.getElementById('roots-x0').value);
    const tol = parseFloat(document.getElementById('roots-tolerance').value || 1e-6);
    const maxIter = parseInt(document.getElementById('roots-max-iter').value || 100, 10);
    validateInputs(a, b, x0, tol, maxIter);
    return { a, b, x0, tol, maxIter };
  }

  function solveByMethod(method, fns, cfg) {
    if (method === 'bisection') return Roots.bisection(fns.f, cfg.a, cfg.b, cfg.tol, cfg.maxIter);
    if (method === 'newton') return Roots.newtonRaphson(fns.f, fns.df, cfg.x0, cfg.tol, cfg.maxIter);
    return Roots.secant(fns.f, cfg.a, cfg.b, cfg.tol, cfg.maxIter);
  }

  document.getElementById('roots-func-expr')?.addEventListener('input', () => { userCustom = true; });

  document.getElementById('roots-solve-btn')?.addEventListener('click', () => {
    try {
      const cfg = readConfig();
      const fns = getFunction();
      const method = document.getElementById('roots-method').value;
      const result = solveByMethod(method, fns, cfg);
      displayRootResults(result, method, fns, cfg);
    } catch (err) {
      Utils.showResults('roots-results', `<div class="glass-card" style="border-color:var(--accent-rose)"><p style="color:var(--accent-rose)">Error: ${err.message}</p></div>`);
    }
  });

  document.getElementById('roots-compare-btn')?.addEventListener('click', () => {
    try {
      const cfg = readConfig();
      const fns = getFunction();
      const methods = ['bisection', 'newton', 'secant'];
      const results = methods.map(key => {
        try {
          return { key, name: methodName(key), ...solveByMethod(key, fns, cfg) };
        } catch (e) {
          return { key, name: methodName(key), converged: false, root: null, error: e.message, iterations: 0, history: [] };
        }
      });
      displayComparison(results, fns, cfg);
    } catch (err) {
      Utils.showResults('roots-results', `<div class="glass-card" style="border-color:var(--accent-rose)"><p style="color:var(--accent-rose)">Error: ${err.message}</p></div>`);
    }
  });

  function displayRootResults(result, method, fns, cfg) {
    const t = fns.meta || thresholds[currentFunction];
    const order = estimateOrder(result.history);
    let html = '<div class="grid-4" style="margin-bottom:1.5rem">';
    html += `<div class="result-card"><h4>Raíz Encontrada</h4><div class="value cyan">${Utils.formatNum(result.root, 8)}</div></div>`;
    html += `<div class="result-card"><h4>f(raíz)</h4><div class="value emerald">${Utils.formatNum(fns.f(result.root), 10)}</div></div>`;
    html += `<div class="result-card"><h4>Iteraciones</h4><div class="value amber">${result.iterations}</div></div>`;
    html += `<div class="result-card"><h4>Convergencia</h4><div class="value ${result.converged ? 'emerald' : 'rose'}">${result.converged ? 'Sí' : 'No'}</div></div>`;
    html += '</div>';
    html += `<div class="interpretation-box" style="margin-bottom:1.5rem"><h4>Respuesta directa</h4>
      <p><strong>Umbral critico:</strong> ${Utils.formatNum(result.root, 6)}. En este punto la funcion cambia de signo o se anula, por lo que el modelo alcanza la condicion critica definida.</p>
      <p><strong>Metodo aplicado:</strong> ${methodName(method)} con orden de convergencia estimado <strong>${order}</strong>.</p>
    </div>`;

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
    drawFunctionGraph(fns.f, cfg.a, cfg.b, result.root);

    // Convergence chart
    const convLabels = result.history.map(h => h.iter);
    const convErrors = result.history.map(h => Math.max(h.error, cfg.tol * 0.1));
    ChartManager.createLine('roots-conv-chart', convLabels, [
      { label: 'Error', data: convErrors, borderColor: '#f59e0b', fill: true, backgroundColor: 'rgba(245,158,11,0.1)' }
    ], {
      plugins: { title: { display: true, text: 'Convergencia', color: '#f1f5f9', font: { size: 14, family: 'Inter' } } },
      scales: { y: { type: 'logarithmic', title: { display: true, text: 'Error', color: '#94a3b8' } } }
    });

    // Interpretation
    const interpDiv = document.getElementById('roots-interpretation');
    if (interpDiv && t) {
      const sensitivityRows = buildSensitivity(fns, cfg);
      interpDiv.innerHTML = `<div class="interpretation-box"><h4>Interpretacion: ${t.name}</h4>
        <p>${t.description}. El método encontró que el valor crítico es <strong>${Utils.formatNum(result.root, 4)}</strong>.</p>
        <p><strong>Interpretacion contextual:</strong> antes de la raiz, el modelo se mantiene del lado no critico de f(x); al cruzarla, el costo, la reposicion o la opinion social alcanzan una condicion de riesgo segun el caso elegido.</p>
        <p><strong>Condicion inicial:</strong> Newton-Raphson puede cambiar su comportamiento si x0 se aleja de la raiz o si la derivada es pequena. Biseccion es mas estable si el intervalo encierra cambio de signo.</p>
      </div>`;
      interpDiv.innerHTML += '<h3 style="margin:1.5rem 0 0.75rem;font-size:1rem">Sensibilidad a Condiciones Iniciales</h3><div id="roots-sensitivity-table"></div>';
      Utils.createTable(['Prueba', 'Raiz', 'Iteraciones', 'Convergio', 'Observacion'], sensitivityRows, 'roots-sensitivity-table');
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
      values.push({ x, y: f(x) });
    }
    const pointData = root !== null && isFinite(root) ? [{ x: root, y: f(root) }] : [];
    const zeroLine = [{ x: xa, y: 0 }, { x: xb, y: 0 }];

    ChartManager.createLine('roots-func-chart', labels, [
      { label: 'f(x)', data: values, borderColor: '#6366f1', pointRadius: 0, tension: 0.2, parsing: false },
      { label: 'Eje f(x)=0', data: zeroLine, borderColor: '#94a3b8', pointRadius: 0, borderDash: [4, 4], parsing: false },
      { label: 'Raiz', data: pointData, borderColor: '#f43f5e', pointRadius: 8, pointBackgroundColor: '#f43f5e', showLine: false, parsing: false }
    ], {
      plugins: { title: { display: true, text: 'Gráfica de la Función', color: '#f1f5f9', font: { size: 14, family: 'Inter' } } },
      scales: { x: { type: 'linear', title: { display: true, text: 'x', color: '#94a3b8' } }, y: { title: { display: true, text: 'f(x)', color: '#94a3b8' } } }
    });
  }

  function buildSensitivity(fns, cfg) {
    const span = cfg.b - cfg.a;
    const tests = [
      { label: 'Newton x0 cercano a a', run: () => Roots.newtonRaphson(fns.f, fns.df, cfg.a + span * 0.2, cfg.tol, cfg.maxIter) },
      { label: 'Newton x0 central', run: () => Roots.newtonRaphson(fns.f, fns.df, cfg.x0, cfg.tol, cfg.maxIter) },
      { label: 'Newton x0 cercano a b', run: () => Roots.newtonRaphson(fns.f, fns.df, cfg.a + span * 0.8, cfg.tol, cfg.maxIter) },
      { label: 'Secante extremos originales', run: () => Roots.secant(fns.f, cfg.a, cfg.b, cfg.tol, cfg.maxIter) },
      { label: 'Biseccion intervalo original', run: () => Roots.bisection(fns.f, cfg.a, cfg.b, cfg.tol, cfg.maxIter) }
    ];
    return tests.map(test => {
      try {
        const r = test.run();
        return [
          test.label,
          Utils.formatNum(r.root, 8),
          r.iterations,
          r.converged ? '<span class="badge badge-emerald">Si</span>' : '<span class="badge badge-rose">No</span>',
          r.converged ? 'Resultado numericamente valido' : 'No alcanzo tolerancia'
        ];
      } catch (e) {
        return [test.label, 'Error', '-', '<span class="badge badge-rose">No</span>', e.message];
      }
    });
  }

  function displayComparison(results, fns, cfg) {
    const valid = results.filter(r => r.converged && r.root !== null);
    const fastest = valid.length ? valid.reduce((best, r) => r.iterations < best.iterations ? r : best, valid[0]) : null;
    const stable = results.find(r => r.key === 'bisection' && r.converged) || valid[0] || null;
    const headers = ['Método', 'Raíz', 'f(raíz)', 'Iteraciones', 'Orden estimado', 'Robustez', 'Convergió'];
    const rows = results.map(r => [
      r.name,
      r.root !== null ? Utils.formatNum(r.root, 8) : 'Error',
      r.root !== null ? Utils.formatNum(fns.f(r.root), 10) : '-',
      r.iterations,
      r.history && r.history.length ? estimateOrder(r.history) : '-',
      r.key === 'bisection' ? 'Alta si hay cambio de signo' : (r.key === 'newton' ? 'Alta velocidad, sensible a x0 y derivada' : 'Intermedia, no requiere derivada'),
      r.converged ? '<span class="badge badge-emerald">Sí</span>' : '<span class="badge badge-rose">No</span>'
    ]);
    let html = '<h3 style="margin:0 0 1rem;font-size:1.1rem">Comparación de Métodos</h3><div id="roots-compare-table"></div>';
    html += '<h3 style="margin:1.5rem 0 0.75rem;font-size:1rem">Sensibilidad a Condiciones Iniciales</h3><div id="roots-sensitivity-table"></div>';
    Utils.showResults('roots-results', html);
    Utils.createTable(headers, rows, 'roots-compare-table');
    Utils.createTable(['Prueba', 'Raiz', 'Iteraciones', 'Convergio', 'Observacion'], buildSensitivity(fns, cfg), 'roots-sensitivity-table');

    // Convergence comparison
    const convData = results.filter(r => r.history && r.history.length > 1);
    if (convData.length > 0) {
      const maxLen = Math.max(...convData.map(r => r.history.length));
      const labels = Array.from({ length: maxLen }, (_, i) => i + 1);
      const datasets = convData.map((r, i) => ({
        label: r.name, data: r.history.map(h => Math.max(h.error, cfg.tol * 0.1)),
        borderColor: ChartManager.defaults.palette[i]
      }));
      ChartManager.createLine('roots-conv-chart', labels, datasets, {
        plugins: { title: { display: true, text: 'Comparación de Convergencia', color: '#f1f5f9', font: { size: 14, family: 'Inter' } } },
        scales: { y: { type: 'logarithmic' } }
      });
    }

    if (convData.length > 0) drawFunctionGraph(fns.f, cfg.a, cfg.b, valid[0] ? valid[0].root : null);

    const interpDiv = document.getElementById('roots-interpretation');
    const meta = fns.meta || thresholds[currentFunction];
    if (interpDiv) {
      interpDiv.innerHTML = `<div class="interpretation-box"><h4>Interpretacion y comparacion</h4>
        <p><strong>Umbral critico:</strong> ${valid[0] ? Utils.formatNum(valid[0].root, 6) : 'no determinado con los parametros actuales'} para ${meta.name}.</p>
        <p><strong>Metodo mas rapido:</strong> ${fastest ? `${fastest.name}, con ${fastest.iterations} iteraciones` : 'ninguno convergio'}.</p>
        <p><strong>Metodo mas estable:</strong> ${stable ? stable.name : 'no determinable'}. Biseccion suele ser el mas robusto cuando existe un intervalo con cambio de signo; Newton y Secante suelen ser mas veloces, pero dependen mas de la condicion inicial.</p>
        <p><strong>Contexto:</strong> la raiz marca el punto donde el abastecimiento, ingreso familiar u opinion social llega al limite matematico definido por la funcion. El resultado debe interpretarse como umbral de alerta, no como postura politica.</p>
      </div>`;
    }
  }

  // Init
  loadPreset('costoIngreso');
});
