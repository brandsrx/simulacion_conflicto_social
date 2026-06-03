/* ============================================
   Differential Equations Module
   Euler, Heun, Runge-Kutta 4
   Scenarios: B (Fuel) + G (Social N-M-D)
   ============================================ */

const DiffEq = {
  euler(f, y0, t0, tEnd, h) {
    const steps = [];
    let t = t0, y = Array.isArray(y0) ? [...y0] : [y0];
    steps.push({ t, y: [...y] });
    while (t < tEnd - 1e-10) {
      const dy = f(t, y);
      y = y.map((yi, i) => yi + h * dy[i]);
      t += h;
      steps.push({ t, y: [...y] });
    }
    return steps;
  },

  heun(f, y0, t0, tEnd, h) {
    const steps = [];
    let t = t0, y = Array.isArray(y0) ? [...y0] : [y0];
    steps.push({ t, y: [...y] });
    while (t < tEnd - 1e-10) {
      const k1 = f(t, y);
      const yPred = y.map((yi, i) => yi + h * k1[i]);
      const k2 = f(t + h, yPred);
      y = y.map((yi, i) => yi + (h / 2) * (k1[i] + k2[i]));
      t += h;
      steps.push({ t, y: [...y] });
    }
    return steps;
  },

  rk4(f, y0, t0, tEnd, h) {
    const steps = [];
    let t = t0, y = Array.isArray(y0) ? [...y0] : [y0];
    steps.push({ t, y: [...y] });
    while (t < tEnd - 1e-10) {
      const k1 = f(t, y);
      const k2 = f(t + h/2, y.map((yi, i) => yi + (h/2) * k1[i]));
      const k3 = f(t + h/2, y.map((yi, i) => yi + (h/2) * k2[i]));
      const k4 = f(t + h,   y.map((yi, i) => yi + h * k3[i]));
      y = y.map((yi, i) => yi + (h/6) * (k1[i] + 2*k2[i] + 2*k3[i] + k4[i]));
      t += h;
      steps.push({ t, y: [...y] });
    }
    return steps;
  }
};

// ---- PAGE CONTROLLER ----
document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('diffeq-module')) return;

  const fuelData = SampleData.fuelReserves;
  const socialData = SampleData.socialDynamics;
  let currentScenario = 'fuel';

  // Scenario tabs
  document.querySelectorAll('.deq-scenario-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.deq-scenario-tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.querySelectorAll('.deq-scenario-desc').forEach(d => d.classList.remove('active'));
      const target = document.getElementById(btn.dataset.scenario);
      if (target) target.classList.add('active');
      currentScenario = btn.dataset.scenario === 'scenario-fuel' ? 'fuel' : 'social';
      loadScenarioParams();
      // Show/hide extra param rows
      document.getElementById('deq-params-fuel').style.display = currentScenario === 'fuel' ? 'block' : 'none';
      document.getElementById('deq-params-social').style.display = currentScenario === 'social' ? 'block' : 'none';
    });
  });

  function loadScenarioParams() {
    if (currentScenario === 'fuel') {
      document.getElementById('deq-fuel-R0').value = fuelData.R0;
      document.getElementById('deq-fuel-entrada').value = fuelData.params.entrada;
      document.getElementById('deq-fuel-consumo').value = fuelData.params.consumoBase;
      document.getElementById('deq-tEnd').value = fuelData.days;
      document.getElementById('deq-h').value = 1;
    } else {
      document.getElementById('deq-social-N0').value = socialData.N0;
      document.getElementById('deq-social-M0').value = socialData.M0;
      document.getElementById('deq-social-D0').value = socialData.D0;
      document.getElementById('deq-social-a').value = socialData.params.a;
      document.getElementById('deq-social-b').value = socialData.params.b;
      document.getElementById('deq-social-c').value = socialData.params.c;
      document.getElementById('deq-social-k').value = socialData.params.k;
      document.getElementById('deq-social-r').value = socialData.params.r;
      document.getElementById('deq-tEnd').value = socialData.days;
      document.getElementById('deq-h').value = 1;
    }
  }

  // What-if buttons
  document.querySelectorAll('.whatif-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.whatif;
      if (currentScenario === 'fuel' && fuelData.whatIf[key]) {
        const w = fuelData.whatIf[key];
        if (w.consumoBase !== undefined) document.getElementById('deq-fuel-consumo').value = w.consumoBase;
        if (w.entrada !== undefined) document.getElementById('deq-fuel-entrada').value = w.entrada;
      } else if (currentScenario === 'social' && socialData.whatIf[key]) {
        const w = socialData.whatIf[key];
        if (w.a !== undefined) document.getElementById('deq-social-a').value = w.a;
        if (w.b !== undefined) document.getElementById('deq-social-b').value = w.b;
        if (w.c !== undefined) document.getElementById('deq-social-c').value = w.c;
        if (w.k !== undefined) document.getElementById('deq-social-k').value = w.k;
        if (w.r !== undefined) document.getElementById('deq-social-r').value = w.r;
        if (w.D0 !== undefined) document.getElementById('deq-social-D0').value = w.D0;
        if (w.M0 !== undefined) document.getElementById('deq-social-M0').value = w.M0;
      }
    });
  });

  // Solve
  document.getElementById('deq-solve-btn')?.addEventListener('click', () => {
    const method = document.getElementById('deq-method').value;
    const h = parseFloat(document.getElementById('deq-h').value);
    const tEnd = parseFloat(document.getElementById('deq-tEnd').value);

    const solve = (fn, y0) => {
      const methods = { euler: DiffEq.euler, heun: DiffEq.heun, rk4: DiffEq.rk4 };
      if (method === 'compare') {
        return { euler: DiffEq.euler(fn, y0, 0, tEnd, h), heun: DiffEq.heun(fn, y0, 0, tEnd, h), rk4: DiffEq.rk4(fn, y0, 0, tEnd, h) };
      }
      return { [method]: methods[method](fn, y0, 0, tEnd, h) };
    };

    if (currentScenario === 'fuel') {
      const R0 = parseFloat(document.getElementById('deq-fuel-R0').value);
      const entrada = parseFloat(document.getElementById('deq-fuel-entrada').value);
      const consumo = parseFloat(document.getElementById('deq-fuel-consumo').value);
      // R'(t) = entrada - consumoBase * R * (1 + factorPanico * sin(t/10))
      const fFuel = (t, y) => [entrada - consumo * y[0] * (1 + 0.02 * Math.sin(t * 0.1))];
      displayFuelResults(solve(fFuel, [R0]), h, tEnd, R0, entrada, consumo);
    } else {
      const N0 = parseFloat(document.getElementById('deq-social-N0').value);
      const M0 = parseFloat(document.getElementById('deq-social-M0').value);
      const D0 = parseFloat(document.getElementById('deq-social-D0').value);
      const a = parseFloat(document.getElementById('deq-social-a').value);
      const b = parseFloat(document.getElementById('deq-social-b').value);
      const c = parseFloat(document.getElementById('deq-social-c').value);
      const k = parseFloat(document.getElementById('deq-social-k').value);
      const r = parseFloat(document.getElementById('deq-social-r').value);
      // N'(t) = -a*N*M + b*D
      // M'(t) =  a*N*M - c*M*D
      // D'(t) =  k*M   - r*D
      const fNMD = (t, y) => {
        const N = Math.max(0, y[0]), M = Math.max(0, y[1]), D = Math.max(0, y[2]);
        return [
          -a * N * M + b * D,
           a * N * M - c * M * D,
           k * M     - r * D
        ];
      };
      displaySocialResults(solve(fNMD, [N0, M0, D0]), h, tEnd, { a, b, c, k, r });
    }
  });

  // ---- FUEL RESULTS ----
  function displayFuelResults(results, h, tEnd, R0, entrada, consumo) {
    const mNames = { euler: 'Euler', heun: 'Heun', rk4: 'Runge-Kutta 4' };
    const keys = Object.keys(results);
    const rk = results[keys[0]];

    // Find critical day for each method
    let html = '<div class="grid-4" style="margin-bottom:1.5rem">';
    keys.forEach(k => {
      const last = results[k][results[k].length - 1];
      html += `<div class="result-card"><h4>${mNames[k]} — R final</h4><div class="value cyan">${Utils.formatNum(last.y[0], 2)} L</div></div>`;
    });
    const critDay = rk.find(s => s.y[0] <= fuelData.nivelCritico);
    const deplDay = rk.find(s => s.y[0] <= 0);
    html += `<div class="result-card"><h4>Nivel Crítico (${fuelData.nivelCritico}L)</h4><div class="value amber">${critDay ? 'Día ' + Math.round(critDay.t) : 'No alcanzado'}</div></div>`;
    html += `<div class="result-card"><h4>Agotamiento Total</h4><div class="value rose">${deplDay ? 'Día ' + Math.round(deplDay.t) : 'No ocurre'}</div></div>`;
    html += '</div>';

    // Questions answered
    html += '<div class="interpretation-box" style="margin-bottom:1.5rem"><h4>📋 Respuestas a las Preguntas del Escenario</h4>';
    html += `<p><strong>1. ¿En cuántos días la reserva llega a nivel crítico?</strong> ${critDay ? 'En aproximadamente ' + Math.round(critDay.t) + ' días las reservas bajan de ' + fuelData.nivelCritico + ' litros.' : 'Con los parámetros actuales, la reserva no llega al nivel crítico.'}</p>`;
    html += `<p><strong>2. ¿Qué pasa si aumenta el consumo diario?</strong> Aumente la tasa de consumo usando los botones "¿Qué pasa si...?" para simular este escenario.</p>`;
    html += `<p><strong>3. ¿Qué pasa si se reduce el abastecimiento?</strong> Reduzca la entrada usando los botones de escenario para ver el efecto.</p>`;
    if (keys.length > 1) {
      const eulerFinal = results.euler ? results.euler[results.euler.length - 1].y[0] : 0;
      const rk4Final = results.rk4 ? results.rk4[results.rk4.length - 1].y[0] : 0;
      html += `<p><strong>4. ¿Qué método da aproximación más estable?</strong> RK4 es el más estable. Al día ${tEnd}: Euler=${Utils.formatNum(eulerFinal, 1)}L vs RK4=${Utils.formatNum(rk4Final, 1)}L (diferencia: ${Utils.formatNum(Math.abs(eulerFinal - rk4Final), 1)}L).</p>`;
      html += `<p><strong>5. Diferencia entre métodos:</strong> Euler (error O(h), simple), Heun (error O(h²), predictor-corrector), RK4 (error O(h⁴), 4 evaluaciones por paso). RK4 es ~${Utils.formatNum(Math.abs(eulerFinal - rk4Final) / Math.max(1, Math.abs(rk4Final)) * 100, 1)}% más preciso que Euler.</p>`;
    }
    html += '</div>';

    // Table
    html += '<h3 style="margin:1rem 0 0.75rem;font-size:1rem">Evolución de Reservas</h3><div id="deq-table"></div>';
    Utils.showResults('deq-results', html);

    const sr = Math.max(1, Math.floor(rk.length / 25));
    const tHeaders = ['Día', ...keys.map(k => `R(t) ${mNames[k]}`)];
    const tRows = rk.filter((_, i) => i % sr === 0 || i === rk.length - 1).map(s => {
      const row = [Math.round(s.t)];
      keys.forEach(k => {
        const match = results[k].find(s2 => Math.abs(s2.t - s.t) < h / 2);
        row.push(match ? Utils.formatNum(Math.max(0, match.y[0]), 2) : '-');
      });
      return row;
    });
    Utils.createTable(tHeaders, tRows, 'deq-table');

    // Charts
    const si = Math.max(1, Math.floor(rk.length / 100));
    const labels = rk.filter((_, i) => i % si === 0).map(s => Math.round(s.t));
    const ds = keys.map((k, i) => ({
      label: mNames[k],
      data: results[k].filter((_, j) => j % si === 0).map(s => Math.max(0, s.y[0])),
      borderColor: ChartManager.defaults.palette[i]
    }));
    ds.push({ label: `Nivel Crítico (${fuelData.nivelCritico}L)`, data: new Array(labels.length).fill(fuelData.nivelCritico), borderColor: '#f43f5e', borderDash: [5, 5], pointRadius: 0 });

    ChartManager.createLine('deq-evolution-chart', labels, ds, {
      plugins: { title: { display: true, text: 'Evolución de Reservas de Combustible', color: '#f1f5f9', font: { size: 14, family: 'Inter' } } },
      scales: { x: { title: { display: true, text: 'Días', color: '#94a3b8' } }, y: { title: { display: true, text: 'Reservas (litros)', color: '#94a3b8' } } }
    });

    // Stability chart
    if (keys.length > 1 && results.euler && results.rk4) {
      const eData = results.euler.filter((_, j) => j % si === 0);
      const rkData = results.rk4.filter((_, j) => j % si === 0);
      const diff = eData.map((s, i) => rkData[i] ? Math.abs(s.y[0] - rkData[i].y[0]) : 0);
      ChartManager.createLine('deq-stability-chart', labels, [
        { label: '|Euler - RK4|', data: diff, borderColor: '#f59e0b', fill: true, backgroundColor: 'rgba(245,158,11,0.1)' }
      ], {
        plugins: { title: { display: true, text: 'Diferencia entre Euler y RK4', color: '#f1f5f9', font: { size: 14, family: 'Inter' } } },
        scales: { y: { title: { display: true, text: 'Diferencia (litros)', color: '#94a3b8' } } }
      });
    }

    // Interpretation
    const interpDiv = document.getElementById('deq-interpretation');
    if (interpDiv) {
      const finalR = rk[rk.length - 1].y[0];
      interpDiv.innerHTML = `<div class="interpretation-box"><h4>📊 Interpretación: Vaciado de Reservas de Carburantes</h4>
        <p>Con una entrada de <strong>${entrada} litros/día</strong> (vs ${fuelData.entradaNormal} en condiciones normales) y tasa de consumo de <strong>${consumo}</strong>, las reservas ${finalR > 0 ? 'se estabilizan en <strong>' + Utils.formatNum(finalR, 0) + ' litros</strong>' : 'se <strong>agotan completamente</strong>'}.</p>
        <p>El modelo R'(t) = entrada - α·R captura la dinámica donde un mayor nivel de reservas genera mayor consumo (por confianza), mientras que la reducción de reservas genera pánico adicional.</p>
        <p><strong>Para los tomadores de decisiones:</strong> Se requiere un suministro mínimo de <strong>${Utils.formatNum(consumo * fuelData.nivelCritico, 0)} litros/día</strong> para mantener las reservas por encima del nivel crítico.</p>
      </div>`;
    }
  }

  // ---- SOCIAL RESULTS (N-M-D Model) ----
  function displaySocialResults(results, h, tEnd, params) {
    const mNames = { euler: 'Euler', heun: 'Heun', rk4: 'Runge-Kutta 4' };
    const keys = Object.keys(results);
    const rk = results[keys[0]];
    const last = rk[rk.length - 1];

    // Peak manifestantes
    const peakM = Math.max(...rk.map(s => s.y[1]));
    const peakDay = rk.find(s => Math.abs(s.y[1] - peakM) < 1e-6);
    // Does conflict stabilize?
    const lastQuarter = rk.slice(Math.floor(rk.length * 0.75));
    const mVariance = lastQuarter.reduce((s, v) => s + Math.pow(v.y[1] - last.y[1], 2), 0) / lastQuarter.length;
    const isStable = mVariance < 0.001;

    let html = '<div class="grid-4" style="margin-bottom:1.5rem">';
    html += `<div class="result-card"><h4>N final (Neutrales)</h4><div class="value cyan">${(last.y[0] * 100).toFixed(1)}%</div></div>`;
    html += `<div class="result-card"><h4>M final (Manifestantes)</h4><div class="value rose">${(last.y[1] * 100).toFixed(1)}%</div></div>`;
    html += `<div class="result-card"><h4>D final (Mediadores)</h4><div class="value emerald">${(last.y[2] * 100).toFixed(1)}%</div></div>`;
    html += `<div class="result-card"><h4>Pico Manifestantes</h4><div class="value amber">${(peakM * 100).toFixed(1)}% (día ${peakDay ? Math.round(peakDay.t) : '?'})</div></div>`;
    html += '</div>';

    // Questions answered
    html += '<div class="interpretation-box" style="margin-bottom:1.5rem"><h4>📋 Respuestas a las Preguntas del Escenario</h4>';
    html += `<p><strong>1. ¿El conflicto tiende a estabilizarse?</strong> ${isStable ? 'Sí, el sistema alcanza un equilibrio con N=' + (last.y[0]*100).toFixed(1) + '%, M=' + (last.y[1]*100).toFixed(1) + '%, D=' + (last.y[2]*100).toFixed(1) + '%.' : 'No, el sistema muestra oscilaciones o crecimiento inestable al final del período.'}</p>`;
    html += `<p><strong>2. ¿El número de manifestantes aumenta o disminuye?</strong> ${last.y[1] > rk[0].y[1] ? 'Aumenta de ' + (rk[0].y[1]*100).toFixed(1) + '% a ' + (last.y[1]*100).toFixed(1) + '% (crecimiento neto).' : 'Disminuye de ' + (rk[0].y[1]*100).toFixed(1) + '% a ' + (last.y[1]*100).toFixed(1) + '% (el diálogo es efectivo).'} El pico fue de ${(peakM*100).toFixed(1)}% el día ${peakDay ? Math.round(peakDay.t) : '?'}.</p>`;
    html += `<p><strong>3. ¿Qué pasa si mejora la tasa de diálogo?</strong> Use el botón "Diálogo efectivo" para simular. Un aumento en c (efectividad) y b (retorno) reduce significativamente el pico de manifestantes.</p>`;
    html += `<p><strong>4. ¿Qué pasa si no existen mediadores?</strong> Use el botón "Sin mediadores" para simular. Sin mediadores (D₀=0, k=0), los manifestantes crecen sin control.</p>`;
    html += `<p><strong>5. ¿Qué parámetros hacen que el conflicto se masifique?</strong> Una tasa de influencia a alta (>${Utils.formatNum(params.a, 2)}) combinada con baja efectividad de diálogo c (<${Utils.formatNum(params.c, 2)}) lleva a masificación. Use el botón "Conflicto masivo" para verlo.</p>`;
    html += '</div>';

    // Table
    html += '<h3 style="margin:1rem 0 0.75rem;font-size:1rem">Evolución del Sistema N-M-D</h3><div id="deq-table"></div>';
    Utils.showResults('deq-results', html);

    const sr = Math.max(1, Math.floor(rk.length / 25));
    const tRows = rk.filter((_, i) => i % sr === 0 || i === rk.length - 1).map(s => [
      Math.round(s.t),
      (s.y[0] * 100).toFixed(2) + '%',
      (s.y[1] * 100).toFixed(2) + '%',
      (s.y[2] * 100).toFixed(2) + '%'
    ]);
    Utils.createTable(['Día', 'N (Neutrales)', 'M (Manifestantes)', 'D (Mediadores)'], tRows, 'deq-table');

    // Chart
    const si = Math.max(1, Math.floor(rk.length / 100));
    const labels = rk.filter((_, i) => i % si === 0).map(s => Math.round(s.t));
    ChartManager.createLine('deq-evolution-chart', labels, [
      { label: 'N — Neutrales', data: rk.filter((_, i) => i % si === 0).map(s => (s.y[0] * 100)), borderColor: '#06b6d4', fill: true, backgroundColor: 'rgba(6,182,212,0.08)' },
      { label: 'M — Manifestantes', data: rk.filter((_, i) => i % si === 0).map(s => (s.y[1] * 100)), borderColor: '#f43f5e', fill: true, backgroundColor: 'rgba(244,63,94,0.08)' },
      { label: 'D — Mediadores', data: rk.filter((_, i) => i % si === 0).map(s => (s.y[2] * 100)), borderColor: '#10b981', fill: true, backgroundColor: 'rgba(16,185,129,0.08)' }
    ], {
      plugins: { title: { display: true, text: 'Dinámica Social: Neutrales - Manifestantes - Mediadores', color: '#f1f5f9', font: { size: 14, family: 'Inter' } } },
      scales: { x: { title: { display: true, text: 'Días', color: '#94a3b8' } }, y: { title: { display: true, text: 'Porcentaje de Población (%)', color: '#94a3b8' } } }
    });

    // Method comparison
    if (keys.length > 1) {
      const mDataSets = keys.map((k, idx) => ({
        label: `M — ${mNames[k]}`,
        data: results[k].filter((_, i) => i % si === 0).map(s => (s.y[1] * 100)),
        borderColor: ChartManager.defaults.palette[idx]
      }));
      ChartManager.createLine('deq-stability-chart', labels, mDataSets, {
        plugins: { title: { display: true, text: 'Comparación de Métodos — Curva M (Manifestantes)', color: '#f1f5f9', font: { size: 14, family: 'Inter' } } }
      });
    }

    // Interpretation
    const interpDiv = document.getElementById('deq-interpretation');
    if (interpDiv) {
      interpDiv.innerHTML = `<div class="interpretation-box"><h4>📊 Interpretación: Difusión del Descontento Social</h4>
        <p>El modelo N-M-D muestra que los manifestantes activos alcanzan un pico de <strong>${(peakM*100).toFixed(1)}%</strong> alrededor del día <strong>${peakDay ? Math.round(peakDay.t) : '?'}</strong>. Al final del período, la composición social es: ${(last.y[0]*100).toFixed(1)}% neutrales, ${(last.y[1]*100).toFixed(1)}% manifestantes, ${(last.y[2]*100).toFixed(1)}% mediadores.</p>
        <p><strong>Modelo:</strong> N'(t) = -a·N·M + b·D | M'(t) = a·N·M - c·M·D | D'(t) = k·M - r·D</p>
        <p>Los ciudadanos neutrales se convierten en manifestantes al interactuar con ellos (tasa a=${params.a}). Los mediadores reducen los manifestantes (tasa c=${params.c}) y facilitan el retorno a la neutralidad (tasa b=${params.b}). El desgaste de los mediadores (r=${params.r}) limita su efectividad a largo plazo.</p>
        <p><strong>Para los tomadores de decisiones:</strong> Fortalecer la mediación (aumentar k y c) es la estrategia más efectiva. Las intervenciones deben realizarse <strong>antes del día ${peakDay ? Math.round(peakDay.t) : '?'}</strong> (pico de manifestantes).</p>
      </div>`;
    }
  }

  loadScenarioParams();
});
