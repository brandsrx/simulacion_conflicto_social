/* ============================================
   Linear Systems Module
   LU, Jacobi, Gauss-Seidel, SOR, Conjugate Gradient
   ESCENARIO F: Rumores y Compras de Pánico (CORREGIDO - MATRIZ DE CORRELACIÓN)
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
    const y = new Array(n).fill(0);
    for (let i = 0; i < n; i++) {
      y[i] = b[i];
      for (let j = 0; j < i; j++) y[i] -= L[i][j] * y[j];
    }
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

  residual(A, x, b) {
    const n = A.length;
    return b.map((bi, i) => {
      let ax = 0; for (let j = 0; j < n; j++) ax += A[i][j] * x[j];
      return Math.abs(bi - ax);
    });
  },

  norm(v) { return Math.sqrt(v.reduce((s, x) => s + x * x, 0)); }
};

// ============================================
// ESCENARIO F: Rumores y Compras de Pánico (CORREGIDO)
// MATRIZ DE CORRELACIÓN ENTRE ZONAS
// ============================================

const EscenarioF = {
  config: {
    description: "Efecto de rumores sobre la demanda en la red de distribución - Matriz de correlación entre zonas",
    zones: ["Zona Norte", "Zona Sur", "Zona Este", "Zona Oeste"],
    // MATRIZ CORREGIDA: Matriz de correlación entre zonas (mal condicionada)
    // Valores cercanos a 1 indican alta interdependencia
    matrix: [
      [1, 0.95, 0.90, 0.85],
      [0.95, 1, 0.95, 0.90],
      [0.90, 0.95, 1, 0.95],
      [0.85, 0.90, 0.95, 1]
    ],
    demandOriginal: [30, 25, 28, 27],
    labels: ["Norte", "Sur", "Este", "Oeste"],
    
    rumorLevels: {
      bajo:   { factor: 1.02, label: "Rumor bajo (+2%)",   description: "Leve aumento en demanda por comentarios informales" },
      medio:  { factor: 1.05, label: "Rumor medio (+5%)",  description: "Noticias en redes sociales aumentan la percepción de escasez" },
      alto:   { factor: 1.10, label: "Rumor alto (+10%)",  description: "Pánico moderado, colas en tiendas y estaciones" },
      panico: { factor: 1.20, label: "Pánico total (+20%)", description: "Compras masivas, acaparamiento, estantes vacíos" }
    },
    
    perturbations: [
      { label: "Δb global +2%", factor: 1.02 },
      { label: "Δb global +5%", factor: 1.05 },
      { label: "Δb global +10%", factor: 1.10 },
      { label: "Shock externo +20%", factor: 1.20 }
    ]
  },

  applyRumor(demand, factor) {
    return demand.map(v => v * factor);
  },

  // CORRECCIÓN CRÍTICA: Aplicar rumor tanto a la matriz A como al vector b
  applyRumorToSystem(matrix, demand, factor, intensidadCorrelacion = 0.6) {
    // La matriz A se ve afectada por el rumor (aumenta la correlación entre zonas)
    const perturbedMatrix = matrix.map(row =>
      row.map(v => v * (1 + (factor - 1) * intensidadCorrelacion))
    );
    
    // El vector b (demanda) también aumenta
    const perturbedDemand = this.applyRumor(demand, factor);
    
    return { matrix: perturbedMatrix, demand: perturbedDemand };
  },

  getRumorScenario(levelKey, intensidadCorrelacion = 0.6) {
    const level = this.config.rumorLevels[levelKey];
    if (!level) return { matrix: this.config.matrix, demand: this.config.demandOriginal };
    
    return this.applyRumorToSystem(
      this.config.matrix,
      this.config.demandOriginal,
      level.factor,
      intensidadCorrelacion
    );
  },

  getPerturbation(factor, intensidadCorrelacion = 0.6) {
    return this.applyRumorToSystem(
      this.config.matrix,
      this.config.demandOriginal,
      factor,
      intensidadCorrelacion
    );
  },

  getAllRumorImpacts(A_base, b_base, solveMethod, intensidadCorrelacion = 0.6) {
    const impacts = [];
    const baseSolution = solveMethod(A_base, b_base);
    
    for (const [key, level] of Object.entries(this.config.rumorLevels)) {
      const { matrix: A_pert, demand: b_pert } = this.applyRumorToSystem(
        A_base, b_base, level.factor, intensidadCorrelacion
      );
      const perturbedSolution = solveMethod(A_pert, b_pert);
      
      const cambios = perturbedSolution.x.map((val, i) => ({
        zona: this.config.labels[i],
        cambioAbsoluto: val - baseSolution.x[i],
        cambioRelativo: ((val - baseSolution.x[i]) / Math.abs(baseSolution.x[i])) * 100
      }));
      
      impacts.push({
        nivel: key,
        label: level.label,
        factor: level.factor,
        matrix: A_pert,
        demand: b_pert,
        solution: perturbedSolution.x,
        cambios: cambios,
        amplificacion: this.calcularAmplificacion(baseSolution.x, perturbedSolution.x, b_base, b_pert)
      });
    }
    return impacts;
  },

  calcularAmplificacion(baseX, perturbedX, baseB, perturbedB) {
    const deltaB = Math.max(...perturbedB.map((v, i) => Math.abs(v - baseB[i]))) / Math.max(...baseB);
    const deltaX = Math.max(...perturbedX.map((v, i) => Math.abs(v - baseX[i]))) / Math.max(...baseX);
    return deltaX / Math.max(deltaB, 1e-12);
  },

  responderPreguntas(A, bOriginal, impacts, condition) {
    const esMalCondicionado = condition > 100;
    const peorEscenario = impacts.reduce((max, imp) => 
      imp.amplificacion > max.amplificacion ? imp : max, impacts[0]);
    
    let html = `
      <div class="interpretation-box" style="margin-bottom:1.5rem">
        <h4>📋 Respuestas a las Preguntas del Escenario F</h4>
        
        <p><strong>1. ¿Qué pasa si la demanda aumenta solo un 5%?</strong><br>
        Con un aumento del 5% en la demanda, el sistema responde con un cambio del 
        <strong>${(impacts.find(i => i.factor === 1.05)?.amplificacion * 100 || 0).toFixed(1)}%</strong> 
        en la distribución. Esto indica que el rumor se <strong>amplifica ${(impacts.find(i => i.factor === 1.05)?.amplificacion || 0).toFixed(2)}x</strong>.</p>
        
        <p><strong>2. ¿La solución cambia poco o demasiado?</strong><br>
        El factor de amplificación es de hasta <strong>${peorEscenario.amplificacion.toFixed(2)}x</strong> en el escenario de ${peorEscenario.label}. 
        Esto significa que el sistema es <strong>${esMalCondicionado ? 'MUY SENSIBLE' : 'MODERADAMENTE SENSIBLE'}</strong> a cambios en la demanda.</p>
        
        <p><strong>3. ¿El sistema es estable o mal condicionado?</strong><br>
        El número de condición estimado es <strong>${condition.toFixed(2)}</strong>. 
        ${condition > 100 
          ? '⚠️ El sistema es MAL CONDICIONADO. Pequeños rumores causan grandes cambios en el abastecimiento.' 
          : '✅ El sistema es ESTABLE. Los rumores tienen impacto controlado.'}</p>
        
        <p><strong>4. ¿Cómo afecta el rumor al abastecimiento?</strong><br>
        ${peorEscenario.cambios.filter(c => Math.abs(c.cambioRelativo) > 20).map(c => 
          `La zona <strong>${c.zona}</strong> varía un ${c.cambioRelativo > 0 ? '+' : ''}${c.cambioRelativo.toFixed(1)}%`
        ).join(' · ') || 'El impacto se distribuye uniformemente entre todas las zonas.'}</p>
        
        <p><strong>5. ¿Qué zona o mercado se vuelve más vulnerable?</strong><br>
        La zona más vulnerable es <strong>${peorEscenario.cambios.reduce((max, c) => 
          Math.abs(c.cambioRelativo) > Math.abs(max.cambioRelativo) ? c : max, peorEscenario.cambios[0]).zona}</strong>, 
        con una variación del ${Math.abs(peorEscenario.cambios.reduce((max, c) => 
          Math.abs(c.cambioRelativo) > Math.abs(max.cambioRelativo) ? c : max, peorEscenario.cambios[0]).cambioRelativo).toFixed(1)}% 
        en el escenario de ${peorEscenario.label}.</p>
        
        <p><strong>📊 Interpretación de la matriz de correlación:</strong><br>
        La matriz utilizada (con valores entre 0.85 y 1) representa la alta interdependencia entre zonas. 
        Cuando el rumor afecta a una zona, el efecto se propaga a las demás debido a la alta correlación,
        lo que explica el factor de amplificación observado.</p>
      </div>
    `;
    
    return html;
  },

  renderRumorComparison(impacts) {
    let html = '<h3 style="margin:1rem 0 0.75rem;font-size:1rem">📊 Comparación de Niveles de Rumor</h3>';
    html += '<div class="grid-4" style="margin-bottom:1.5rem">';
    
    for (const imp of impacts) {
      const cambioPromedio = imp.cambios.reduce((sum, c) => sum + Math.abs(c.cambioRelativo), 0) / imp.cambios.length;
      html += `
        <div class="result-card" style="${imp.factor > 1.1 ? 'border-left: 4px solid #f43f5e;' : ''}">
          <h4>${imp.label}</h4>
          <div class="value ${imp.amplificacion > 2 ? 'rose' : 'emerald'}" style="font-size:1.2rem">
            ${imp.amplificacion.toFixed(1)}x
          </div>
          <small>Amplificación</small>
          <div style="margin-top:8px;font-size:0.8rem">
            Cambio promedio: ${cambioPromedio.toFixed(1)}%
          </div>
        </div>
      `;
    }
    html += '</div>';
    return html;
  }
};

// ============================================
// PAGE CONTROLLER (CORREGIDO PARA ESCENARIO F)
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('ls-module')) return;

  const data = SampleData.supplyNetwork;
  const dataR = EscenarioF.config;  // Usar EscenarioF corregido
  let currentScenario = 'supply';
  let matrixSize = data.matrix.length;
  let currentRumorLevel = null;

  // Función corregida para cargar escenario (usa demandOriginal en rumor)
  function loadScenario(scenario) {
    currentScenario = scenario;
    const d = scenario === 'supply' ? data : dataR;
    matrixSize = d.matrix.length;
    document.getElementById('ls-matrix-size').value = matrixSize;
    
    let bVector;
    let matrixToUse;
    
    if (scenario === 'supply') {
      bVector = d.demand;
      matrixToUse = d.matrix;
    } else {
      // Escenario de Rumor: usar matriz de correlación original
      bVector = dataR.demandOriginal;
      matrixToUse = dataR.matrix;
    }
    
    Utils.generateMatrixInputs('ls-matrix-container', matrixSize, 'lsA', matrixToUse, bVector);
  }

  // Función CORREGIDA para cargar escenario con rumor (aplica a A y b)
  function loadRumorScenario(levelKey, intensidadCorrelacion = 0.6) {
    currentScenario = 'rumor';
    
    if (levelKey && dataR.rumorLevels && dataR.rumorLevels[levelKey]) {
      const levelInfo = dataR.rumorLevels[levelKey];
      const { matrix: A_pert, demand: b_pert } = EscenarioF.getRumorScenario(levelKey, intensidadCorrelacion);
      
      matrixSize = A_pert.length;
      document.getElementById('ls-matrix-size').value = matrixSize;
      
      Utils.generateMatrixInputs('ls-matrix-container', matrixSize, 'lsA', A_pert, b_pert);
      
      // Actualizar botones activos
      document.querySelectorAll('.ls-rumor-level').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.level === levelKey) btn.classList.add('active');
      });
    }
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
      
      // Ocultar/mostrar panel de rumores según escenario
      const rumorPanelDiv = document.getElementById('rumor-panel-container');
      if (rumorPanelDiv) {
        rumorPanelDiv.style.display = btn.dataset.scenario === 'scenario-rumor' ? 'block' : 'none';
      }
    });
  });

  // Botones de "Qué pasaría si" para supply
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
    html += `<div class="result-card"><h4>Condición estimada</h4><div class="value ${condition && condition > 100 ? 'rose' : 'emerald'}">${condition ? Utils.formatNum(condition, 3) : 'N/A'}</div></div>`;
    html += `<div class="result-card"><h4>Sensibilidad +5%</h4><div class="value ${sensitivity && sensitivity.amplification > 2 ? 'rose' : 'cyan'}">${sensitivity ? Utils.formatNum(sensitivity.relativeSolutionChange * 100, 2) + '%' : 'N/A'}</div></div>`;
    html += `<div class="result-card"><h4>Zona más afectada</h4><div class="value amber" style="font-size:1rem">${sensitivity ? sensitivity.mostAffected : 'N/A'}</div></div>`;
    html += '</div>';

    if (sensitivity) {
      html += '<h3 style="margin:1.5rem 0 0.75rem;font-size:1rem">Análisis de Sensibilidad ante Demanda +5%</h3>';
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
        { label: 'Solución actual', data: sensitivity.base, backgroundColor: 'rgba(6,182,212,0.55)', borderColor: '#06b6d4' },
        { label: 'Demanda +5%', data: sensitivity.plus5, backgroundColor: 'rgba(245,158,11,0.55)', borderColor: '#f59e0b' }
      ], {
        plugins: { title: { display: true, text: 'Cambio en la distribución por aumento de demanda', color: '#f1f5f9', font: { size: 14, family: 'Inter' } } },
        scales: { y: { title: { display: true, text: 'Cantidad asignada', color: '#94a3b8' } } }
      });
    }

    // Interpretation (agregar análisis de rumores si es escenario F)
    const interpDiv = document.getElementById('ls-interpretation');
    if (interpDiv) {
      let ctx = '';
      
      if (currentScenario === 'supply') {
        ctx = `<p>Los resultados muestran la distribución óptima de suministros entre las ${matrixSize} ciudades de la red. Los valores representan las cantidades que deben ser transportadas para satisfacer la demanda en cada nodo. El método ${method.toUpperCase()} ${result.converged ? 'convergió exitosamente' : 'no logró converger'} en ${result.iterations} iteraciones con una norma residual de ${Utils.formatNum(LinearSystems.norm(res))}.</p><p><strong>Implicación práctica:</strong> Un planificador puede usar esta distribución para asignar recursos de transporte de manera eficiente durante una crisis de abastecimiento.</p>`;
      } else {
        // Escenario de Rumor - agregar análisis completo con matriz de correlación
        const impacts = EscenarioF.getAllRumorImpacts(dataR.matrix, dataR.demandOriginal, (mat, dem) => LinearSystems.solveLU(mat, dem), 0.6);
        const preguntasHtml = EscenarioF.responderPreguntas(dataR.matrix, dataR.demandOriginal, impacts, condition || 150);
        const comparacionHtml = EscenarioF.renderRumorComparison(impacts);
        ctx = preguntasHtml + comparacionHtml;
        
        // Agregar nota sobre la matriz utilizada
        ctx += `<div class="interpretation-box" style="margin-top:1rem">
          <h4>📊 Matriz de Correlación Utilizada</h4>
          <pre style="background:#1e293b; padding:10px; border-radius:8px; color:#94a3b8; font-size:0.8rem">
      [1.00, 0.95, 0.90, 0.85]
      [0.95, 1.00, 0.95, 0.90]
      [0.90, 0.95, 1.00, 0.95]
      [0.85, 0.90, 0.95, 1.00]</pre>
          <p>Esta matriz representa la alta interdependencia entre zonas. Valores cercanos a 1 indican que el rumor en una zona afecta fuertemente a las demás.</p>
        </div>`;
      }
      
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
      '<strong>Amplificación global</strong>',
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

  // Agregar panel de botones de rumor al DOM
  const rumorPanelHtml = `
    <div id="rumor-panel-container" style="display: none; margin-top: 1rem;">
      <div class="simulation-panel">
        <h3 style="margin-bottom:0.75rem">📢 Simular Diferentes Niveles de Rumor</h3>
        <p style="font-size:0.8rem; margin-bottom:0.75rem; color:#f59e0b">
          ⚠️ El rumor afecta TANTO a la demanda (vector b) COMO a la matriz de correlación entre zonas (matriz A)
        </p>
        <div style="display:flex; gap:0.75rem; flex-wrap:wrap">
          <button class="ls-rumor-level btn-sm" data-level="bajo" style="background:#f59e0b; padding:8px 16px; border:none; border-radius:20px; cursor:pointer; color:white">Rumor Bajo (+2%)</button>
          <button class="ls-rumor-level btn-sm" data-level="medio" style="background:#f97316; padding:8px 16px; border:none; border-radius:20px; cursor:pointer; color:white">Rumor Medio (+5%)</button>
          <button class="ls-rumor-level btn-sm" data-level="alto" style="background:#ea580c; padding:8px 16px; border:none; border-radius:20px; cursor:pointer; color:white">Rumor Alto (+10%)</button>
          <button class="ls-rumor-level btn-sm" data-level="panico" style="background:#dc2626; padding:8px 16px; border:none; border-radius:20px; cursor:pointer; color:white">Pánico Total (+20%)</button>
        </div>
        <p style="font-size:0.75rem; color:#94a3b8; margin-top:0.75rem">
          📌 Cada botón aplica un aumento porcentual en la demanda Y en la correlación entre zonas
        </p>
      </div>
    </div>
  `;
  
  // Insertar panel después del simulation-panel existente
  const simulationPanel = document.querySelector('#ls-module .simulation-panel');
  if (simulationPanel) {
    simulationPanel.insertAdjacentHTML('afterend', rumorPanelHtml);
  }
  
  // Event listeners para botones de rumor
  document.querySelectorAll('.ls-rumor-level').forEach(btn => {
    btn.addEventListener('click', () => {
      const level = btn.dataset.level;
      loadRumorScenario(level, 0.6);
      currentRumorLevel = level;
      
      setTimeout(() => {
        const solveBtn = document.getElementById('ls-solve-btn');
        if (solveBtn) solveBtn.click();
      }, 100);
    });
  });

  // Load default scenario
  loadScenario('supply');
});