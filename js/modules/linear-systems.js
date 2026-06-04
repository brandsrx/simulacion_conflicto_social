/* ============================================
   Linear Systems Module
   LU, Jacobi, Gauss-Seidel, SOR, Conjugate Gradient
   ============================================ */

const LinearSystems = {
  // ---- LU Decomposition ----
  lu(A) {
    const n = A.length;
    const L = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => i === j ? 1 : 0));
    const U = A.map(r => [...r]);
    for (let k = 0; k < n; k++) {
      if (Math.abs(U[k][k]) < 1e-12) throw new Error('Pivote cero encontrado en LU');
      for (let i = k + 1; i < n; i++) {
        L[i][k] = U[i][k] / U[k][k];
        for (let j = k; j < n; j++) U[i][j] -= L[i][k] * U[k][j];
      }
    }
    return { L, U };
  },

  solveLU(A, b) {
    const n = A.length;
    const { L, U } = this.lu(A);
    // Forward substitution Ly = b
    const y = new Array(n).fill(0);
    for (let i = 0; i < n; i++) {
      y[i] = b[i];
      for (let j = 0; j < i; j++) y[i] -= L[i][j] * y[j];
    }
    // Back substitution Ux = y
    const x = new Array(n).fill(0);
    for (let i = n - 1; i >= 0; i--) {
      x[i] = y[i];
      for (let j = i + 1; j < n; j++) x[i] -= U[i][j] * x[j];
      x[i] /= U[i][i];
    }
    return { x, L, U, y };
  },

  // ---- Jacobi ----
  jacobi(A, b, tol = 1e-6, maxIter = 100) {
    const n = A.length;
    let x = new Array(n).fill(0);
    const history = [];
    for (let iter = 0; iter < maxIter; iter++) {
      const xNew = new Array(n);
      for (let i = 0; i < n; i++) {
        let sum = b[i];
        for (let j = 0; j < n; j++) { if (j !== i) sum -= A[i][j] * x[j]; }
        xNew[i] = sum / A[i][i];
      }
      const err = Math.max(...xNew.map((v, i) => Math.abs(v - x[i])));
      history.push({ iter: iter + 1, x: [...xNew], error: err });
      if (err < tol) return { x: xNew, converged: true, iterations: iter + 1, history };
      x = xNew;
    }
    return { x, converged: false, iterations: maxIter, history };
  },

  // ---- Gauss-Seidel ----
  gaussSeidel(A, b, tol = 1e-6, maxIter = 100) {
    const n = A.length;
    const x = new Array(n).fill(0);
    const history = [];
    for (let iter = 0; iter < maxIter; iter++) {
      const xOld = [...x];
      for (let i = 0; i < n; i++) {
        let sum = b[i];
        for (let j = 0; j < n; j++) { if (j !== i) sum -= A[i][j] * x[j]; }
        x[i] = sum / A[i][i];
      }
      const err = Math.max(...x.map((v, i) => Math.abs(v - xOld[i])));
      history.push({ iter: iter + 1, x: [...x], error: err });
      if (err < tol) return { x: [...x], converged: true, iterations: iter + 1, history };
    }
    return { x: [...x], converged: false, iterations: maxIter, history };
  },

  // ---- SOR ----
  sor(A, b, omega = 1.25, tol = 1e-6, maxIter = 100) {
    const n = A.length;
    const x = new Array(n).fill(0);
    const history = [];
    for (let iter = 0; iter < maxIter; iter++) {
      const xOld = [...x];
      for (let i = 0; i < n; i++) {
        let sum = b[i];
        for (let j = 0; j < n; j++) { if (j !== i) sum -= A[i][j] * x[j]; }
        x[i] = (1 - omega) * xOld[i] + omega * (sum / A[i][i]);
      }
      const err = Math.max(...x.map((v, i) => Math.abs(v - xOld[i])));
      history.push({ iter: iter + 1, x: [...x], error: err, omega });
      if (err < tol) return { x: [...x], converged: true, iterations: iter + 1, history };
    }
    return { x: [...x], converged: false, iterations: maxIter, history };
  },

  // ---- Conjugate Gradient ----
  conjugateGradient(A, b, tol = 1e-6, maxIter = 100) {
    const n = A.length;
    let x = new Array(n).fill(0);
    let r = b.map((bi, i) => { let s = bi; for (let j = 0; j < n; j++) s -= A[i][j] * x[j]; return s; });
    let p = [...r];
    let rsOld = r.reduce((s, v) => s + v * v, 0);
    const history = [];
    for (let iter = 0; iter < maxIter; iter++) {
      const Ap = A.map(row => row.reduce((s, v, j) => s + v * p[j], 0));
      const alpha = rsOld / p.reduce((s, v, j) => s + v * Ap[j], 0);
      x = x.map((v, i) => v + alpha * p[i]);
      r = r.map((v, i) => v - alpha * Ap[i]);
      const rsNew = r.reduce((s, v) => s + v * v, 0);
      const err = Math.sqrt(rsNew);
      history.push({ iter: iter + 1, x: [...x], error: err });
      if (err < tol) return { x, converged: true, iterations: iter + 1, history };
      p = r.map((v, i) => v + (rsNew / rsOld) * p[i]);
      rsOld = rsNew;
    }
    return { x, converged: false, iterations: maxIter, history };
  },

  normInfMatrix(A) {
    return Math.max(...A.map(row => row.reduce((s, v) => s + Math.abs(v), 0)));
  },

  normInfVector(v) {
    return Math.max(...v.map(x => Math.abs(x)));
  },

  conditionEstimate(A) {
    const n = A.length;
    const invCols = [];
    for (let col = 0; col < n; col++) {
      const e = new Array(n).fill(0);
      e[col] = 1;
      invCols[col] = this.solveLU(A, e).x;
    }
    const invRows = Array.from({ length: n }, (_, i) => invCols.map(col => col[i]));
    return this.normInfMatrix(A) * this.normInfMatrix(invRows);
  },

  sensitivityReport(A, b, labels) {
    try {
      const base = this.solveLU(A, b).x;
      const bPlus5 = b.map(v => v * 1.05);
      const plus5 = this.solveLU(A, bPlus5).x;
      const deltaB = this.normInfVector(bPlus5.map((v, i) => v - b[i]));
      const deltaX = this.normInfVector(plus5.map((v, i) => v - base[i]));
      const relB = deltaB / Math.max(this.normInfVector(b), 1e-12);
      const relX = deltaX / Math.max(this.normInfVector(base), 1e-12);
      const mostAffectedIndex = plus5
        .map((v, i) => ({ i, change: Math.abs(v - base[i]) }))
        .sort((a, b) => b.change - a.change)[0]?.i ?? 0;
      return {
        base,
        plus5,
        relativeDemandChange: relB,
        relativeSolutionChange: relX,
        amplification: relX / Math.max(relB, 1e-12),
        mostAffected: labels[mostAffectedIndex] || `x${mostAffectedIndex + 1}`,
        mostAffectedChange: Math.abs(plus5[mostAffectedIndex] - base[mostAffectedIndex])
      };
    } catch (e) {
      return null;
    }
  },

  // ---- Compute residual ----
  residual(A, x, b) {
    const n = A.length;
    return b.map((bi, i) => {
      let ax = 0; for (let j = 0; j < n; j++) ax += A[i][j] * x[j];
      return Math.abs(bi - ax);
    });
  },

  norm(v) { return Math.sqrt(v.reduce((s, x) => s + x * x, 0)); }
};

// ---- PAGE CONTROLLER ----
document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('ls-module')) return;

  const data = SampleData.supplyNetwork;
  const dataR = SampleData.rumorPanic;
  let currentScenario = 'supply';
  let matrixSize = data.matrix.length;

  // Init matrix
  function loadScenario(scenario) {
    currentScenario = scenario;
    const d = scenario === 'supply' ? data : dataR;
    matrixSize = d.matrix.length;
    document.getElementById('ls-matrix-size').value = matrixSize;
    Utils.generateMatrixInputs('ls-matrix-container', matrixSize, 'lsA',
      d.matrix, scenario === 'supply' ? d.demand : d.propagation);
  }

  // Scenario tabs
  document.querySelectorAll('.scenario-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.scenario-tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.querySelectorAll('.scenario-desc').forEach(d => d.classList.remove('active'));
      const target = document.getElementById(btn.dataset.scenario);
      if (target) target.classList.add('active');
      loadScenario(btn.dataset.scenario === 'scenario-supply' ? 'supply' : 'rumor');
    });
  });

  document.querySelectorAll('.ls-supply-whatif').forEach(btn => {
    btn.addEventListener('click', () => {
      const variation = data.demandVariations[btn.dataset.variation];
      if (!variation) return;
      currentScenario = 'supply';
      matrixSize = data.matrix.length;
      document.getElementById('ls-matrix-size').value = matrixSize;
      Utils.generateMatrixInputs('ls-matrix-container', matrixSize, 'lsA', data.matrix, variation);
      document.querySelectorAll('.ls-supply-whatif').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  // Size change
  document.getElementById('ls-matrix-size')?.addEventListener('change', (e) => {
    matrixSize = parseInt(e.target.value);
    Utils.generateMatrixInputs('ls-matrix-container', matrixSize, 'lsA', null, null);
  });

  // Solve
  document.getElementById('ls-solve-btn')?.addEventListener('click', () => {
    const A = Utils.parseMatrix('lsA', matrixSize);
    const b = Utils.parseVector('lsAb', matrixSize);
    const method = document.getElementById('ls-method').value;
    const tol = parseFloat(document.getElementById('ls-tolerance')?.value || 1e-6);
    const maxIter = parseInt(document.getElementById('ls-max-iter')?.value || 100);
    const omega = parseFloat(document.getElementById('ls-omega')?.value || 1.25);

    let result;
    try {
      switch (method) {
        case 'lu': result = LinearSystems.solveLU(A, b); result.converged = true; result.iterations = 1; result.history = [{ iter: 1, x: result.x, error: 0 }]; break;
        case 'jacobi': result = LinearSystems.jacobi(A, b, tol, maxIter); break;
        case 'gauss-seidel': result = LinearSystems.gaussSeidel(A, b, tol, maxIter); break;
        case 'sor': result = LinearSystems.sor(A, b, omega, tol, maxIter); break;
        case 'conjugate-gradient': result = LinearSystems.conjugateGradient(A, b, tol, maxIter); break;
      }
    } catch (err) {
      Utils.showResults('ls-results', `<div class="glass-card" style="border-color:var(--accent-rose)"><p style="color:var(--accent-rose)">Error: ${err.message}</p></div>`);
      return;
    }

    displayResults(result, A, b, method);
  });

  // Compare all methods
  document.getElementById('ls-compare-btn')?.addEventListener('click', () => {
    const A = Utils.parseMatrix('lsA', matrixSize);
    const b = Utils.parseVector('lsAb', matrixSize);
    const tol = parseFloat(document.getElementById('ls-tolerance')?.value || 1e-6);
    const maxIter = parseInt(document.getElementById('ls-max-iter')?.value || 100);

    const methods = ['lu', 'jacobi', 'gauss-seidel', 'sor', 'conjugate-gradient'];
    const names = ['LU', 'Jacobi', 'Gauss-Seidel', 'SOR (ω=1.25)', 'Gradiente Conjugado'];
    const results = [];

    methods.forEach((m, i) => {
      try {
        let r;
        switch (m) {
          case 'lu': r = LinearSystems.solveLU(A, b); r.converged = true; r.iterations = 1; r.history = [{ iter: 1, x: r.x, error: 0 }]; break;
          case 'jacobi': r = LinearSystems.jacobi(A, b, tol, maxIter); break;
          case 'gauss-seidel': r = LinearSystems.gaussSeidel(A, b, tol, maxIter); break;
          case 'sor': r = LinearSystems.sor(A, b, 1.25, tol, maxIter); break;
          case 'conjugate-gradient': r = LinearSystems.conjugateGradient(A, b, tol, maxIter); break;
        }
        const res = LinearSystems.residual(A, r.x, b);
        results.push({ name: names[i], ...r, residualNorm: LinearSystems.norm(res) });
      } catch (e) {
        results.push({ name: names[i], converged: false, error: e.message });
      }
    });

    displayComparison(results);
  });

  function displayResults(result, A, b, method) {
    const d = currentScenario === 'supply' ? data : dataR;
    const labels = d.labels || result.x.map((_, i) => `x${i + 1}`);
    const res = LinearSystems.residual(A, result.x, b);
    const condition = (() => {
      try { return LinearSystems.conditionEstimate(A); } catch (e) { return null; }
    })();
    const sensitivity = LinearSystems.sensitivityReport(A, b, labels);

    // Solution cards
    let html = '<div class="grid-3" style="margin-bottom:1.5rem">';
    result.x.forEach((v, i) => {
      html += `<div class="result-card"><h4>${labels[i] || 'x' + (i + 1)}</h4><div class="value cyan">${Utils.formatNum(v, 4)}</div></div>`;
    });
    html += `<div class="result-card"><h4>Iteraciones</h4><div class="value emerald">${result.iterations}</div></div>`;
    html += `<div class="result-card"><h4>Convergencia</h4><div class="value ${result.converged ? 'emerald' : 'rose'}">${result.converged ? 'Sí' : 'No'}</div></div>`;
    html += `<div class="result-card"><h4>Norma Residual</h4><div class="value amber">${Utils.formatNum(LinearSystems.norm(res), 6)}</div></div>`;
    html += `<div class="result-card"><h4>CondiciÃ³n estimada</h4><div class="value ${condition && condition > 100 ? 'rose' : 'emerald'}">${condition ? Utils.formatNum(condition, 3) : 'N/A'}</div></div>`;
    html += `<div class="result-card"><h4>Sensibilidad +5%</h4><div class="value ${sensitivity && sensitivity.amplification > 2 ? 'rose' : 'cyan'}">${sensitivity ? Utils.formatNum(sensitivity.relativeSolutionChange * 100, 2) + '%' : 'N/A'}</div></div>`;
    html += `<div class="result-card"><h4>Zona mÃ¡s afectada</h4><div class="value amber" style="font-size:1rem">${sensitivity ? sensitivity.mostAffected : 'N/A'}</div></div>`;
    html += '</div>';

    if (sensitivity) {
      html += '<h3 style="margin:1.5rem 0 0.75rem;font-size:1rem">AnÃ¡lisis de Sensibilidad ante Demanda +5%</h3>';
      html += '<div id="ls-sensitivity-table"></div>';
    }

    // Convergence table
    if (result.history && result.history.length > 1) {
      html += '<h3 style="margin:1.5rem 0 0.75rem;font-size:1rem">Tabla de Convergencia</h3>';
      const headers = ['Iteración', 'Error', ...labels.map((_, i) => `x${i + 1}`)];
      const rows = result.history.slice(0, 30).map(h => [
        h.iter, Utils.formatNum(h.error, 8), ...h.x.map(v => Utils.formatNum(v, 6))
      ]);
      html += '<div id="ls-conv-table"></div>';
      Utils.showResults('ls-results', html);
      if (sensitivity) renderSensitivityTable(labels, sensitivity);
      Utils.createTable(headers, rows, 'ls-conv-table');
    } else {
      Utils.showResults('ls-results', html);
      if (sensitivity) renderSensitivityTable(labels, sensitivity);
    }

    // Convergence chart
    if (result.history && result.history.length > 1) {
      const chartLabels = result.history.map(h => h.iter);
      const errors = result.history.map(h => h.error);
      ChartManager.createLine('ls-conv-chart', chartLabels, [
        { label: 'Error de convergencia', data: errors, borderColor: '#06b6d4', fill: true, backgroundColor: 'rgba(6,182,212,0.1)' }
      ], {
        plugins: { title: { display: true, text: 'Convergencia del Método Iterativo', color: '#f1f5f9', font: { size: 14, family: 'Inter' } } },
        scales: { y: { type: 'logarithmic', title: { display: true, text: 'Error', color: '#94a3b8' } }, x: { title: { display: true, text: 'Iteración', color: '#94a3b8' } } }
      });
    }

    if (sensitivity) {
      ChartManager.createBar('ls-bar-chart', labels, [
        { label: 'SoluciÃ³n actual', data: sensitivity.base, backgroundColor: 'rgba(6,182,212,0.55)', borderColor: '#06b6d4' },
        { label: 'Demanda +5%', data: sensitivity.plus5, backgroundColor: 'rgba(245,158,11,0.55)', borderColor: '#f59e0b' }
      ], {
        plugins: { title: { display: true, text: 'Cambio en la distribuciÃ³n por aumento de demanda', color: '#f1f5f9', font: { size: 14, family: 'Inter' } } },
        scales: { y: { title: { display: true, text: 'Cantidad asignada', color: '#94a3b8' } } }
      });
    }

    // Interpretation
    const interpDiv = document.getElementById('ls-interpretation');
    if (interpDiv) {
      const conditionText = condition
        ? `El numero de condicion estimado es <strong>${Utils.formatNum(condition, 3)}</strong>; por eso el sistema se lee como <strong>${condition > 100 ? 'sensible o mal condicionado' : 'estable ante cambios pequenos'}</strong>.`
        : 'No fue posible estimar el numero de condicion con los datos actuales.';
      const sensitivityText = sensitivity
        ? `Con demanda +5%, la solucion cambia aproximadamente <strong>${Utils.formatNum(sensitivity.relativeSolutionChange * 100, 2)}%</strong>. La zona mas afectada es <strong>${sensitivity.mostAffected}</strong>, con cambio de ${Utils.formatNum(sensitivity.mostAffectedChange, 3)} unidades.`
        : 'No fue posible calcular la sensibilidad para esta matriz.';
      const ctx = currentScenario === 'supply'
        ? `<p>Los resultados muestran la distribución óptima de suministros entre las ${matrixSize} ciudades de la red. Los valores representan las cantidades que deben ser transportadas para satisfacer la demanda en cada nodo. El método ${method.toUpperCase()} ${result.converged ? 'convergió exitosamente' : 'no logró converger'} en ${result.iterations} iteraciones con una norma residual de ${Utils.formatNum(LinearSystems.norm(res))}.</p><p><strong>Implicación práctica:</strong> Un planificador puede usar esta distribución para asignar recursos de transporte de manera eficiente durante una crisis de abastecimiento.</p>`
        : `<p>El sistema modela la propagación de rumores y compras de pánico entre ${matrixSize} zonas urbanas. Los valores obtenidos representan el nivel de propagación de rumores en cada zona. ${result.converged ? 'La convergencia del método indica estabilidad en el modelo' : 'La falta de convergencia sugiere inestabilidad'}.</p><p><strong>Implicación práctica:</strong> Las autoridades pueden identificar las zonas más vulnerables a la propagación de rumores y concentrar esfuerzos de comunicación oficial.</p>`;
      interpDiv.innerHTML = `<div class="interpretation-box"><h4>📊 Interpretación de Resultados</h4>${ctx}</div>`;
    }
  }

  function renderSensitivityTable(labels, sensitivity) {
    const rows = labels.map((label, i) => [
      label,
      Utils.formatNum(sensitivity.base[i], 4),
      Utils.formatNum(sensitivity.plus5[i], 4),
      Utils.formatNum(sensitivity.plus5[i] - sensitivity.base[i], 4)
    ]);
    rows.push([
      '<strong>AmplificaciÃ³n global</strong>',
      '-',
      '-',
      `<strong>${Utils.formatNum(sensitivity.amplification, 3)}x</strong>`
    ]);
    Utils.createTable(['Zona / variable', 'Actual', 'Con demanda +5%', 'Cambio'], rows, 'ls-sensitivity-table');
  }

  function displayComparison(results) {
    const headers = ['Método', 'Convergió', 'Iteraciones', 'Norma Residual'];
    const rows = results.map(r => [
      r.name,
      r.converged ? '<span class="badge badge-emerald">Sí</span>' : '<span class="badge badge-rose">No</span>',
      r.iterations || '-',
      r.residualNorm !== undefined ? Utils.formatNum(r.residualNorm, 8) : (r.error || 'Error')
    ]);
    let html = '<h3 style="margin:0 0 1rem;font-size:1.1rem">Comparación de Métodos</h3><div id="ls-compare-table"></div>';
    Utils.showResults('ls-results', html);
    Utils.createTable(headers, rows, 'ls-compare-table');

    // Convergence comparison chart
    const convData = results.filter(r => r.history && r.history.length > 1);
    if (convData.length > 0) {
      const maxLen = Math.max(...convData.map(r => r.history.length));
      const labels = Array.from({ length: maxLen }, (_, i) => i + 1);
      const datasets = convData.map((r, i) => ({
        label: r.name, data: r.history.map(h => h.error),
        borderColor: ChartManager.defaults.palette[i + 1],
      }));
      ChartManager.createLine('ls-conv-chart', labels, datasets, {
        plugins: { title: { display: true, text: 'Comparación de Convergencia', color: '#f1f5f9', font: { size: 14, family: 'Inter' } } },
        scales: { y: { type: 'logarithmic', title: { display: true, text: 'Error', color: '#94a3b8' } }, x: { title: { display: true, text: 'Iteración', color: '#94a3b8' } } }
      });
    }
  }

  // Load default scenario
  loadScenario('supply');
});
