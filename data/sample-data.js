/* ============================================
   Sample Data — Corrected for All 7 Scenarios
   ============================================ */

const SampleData = {

  // ============================
  // ESCENARIO A: Distribución de Suministros (Plantas → Zonas)
  // ============================
  supplyNetwork: {
    description: "Distribución de productos desde 3 plantas hacia 3 zonas de una ciudad",
    plants: ["Planta 1 (Producción)", "Planta 2 (Almacén Central)", "Planta 3 (Centro de Acopio)"],
    zones: ["Zona Norte", "Zona Centro", "Zona Sur"],
    // Variables: x1..x9 representan cantidad enviada de cada planta a cada zona
    // Restricciones: capacidad de planta, demanda de zona, costos de ruta
    // Sistema 9x9 reducido a 3x3 por simplificación (una planta por zona principal)
    matrix: [
      [4, -1, -0.5],
      [-1, 5, -1],
      [-0.5, -1, 4]
    ],
    demand: [120, 200, 80],
    labels: ["x₁ (→Norte)", "x₂ (→Centro)", "x₃ (→Sur)"],
    // Para análisis de sensibilidad
    demandVariations: {
      normal:    [120, 200, 80],
      plus5:     [126, 210, 84],
      plus10:    [132, 220, 88],
      plus20:    [144, 240, 96],
      bloqueoNorte:  [0, 250, 150],   // Ruta norte bloqueada, demanda redistribuida
      bloqueoCentro: [170, 0, 230],    // Ruta centro bloqueada
      bloqueoSur:    [160, 240, 0],    // Ruta sur bloqueada
    },
    // Modelo expandido: 3 plantas × 3 zonas
    fullModel: {
      matrix: [
        // Restricciones de capacidad de planta
        [1, 1, 1, 0, 0, 0, 0, 0, 0],  // Planta 1: x1+x2+x3 = cap1
        [0, 0, 0, 1, 1, 1, 0, 0, 0],  // Planta 2: x4+x5+x6 = cap2
        [0, 0, 0, 0, 0, 0, 1, 1, 1],  // Planta 3: x7+x8+x9 = cap3
        // Restricciones de demanda de zona
        [1, 0, 0, 1, 0, 0, 1, 0, 0],  // Norte: x1+x4+x7 = dem_norte
        [0, 1, 0, 0, 1, 0, 0, 1, 0],  // Centro: x2+x5+x8 = dem_centro
        [0, 0, 1, 0, 0, 1, 0, 0, 1],  // Sur: x3+x6+x9 = dem_sur
        // Costos/eficiencia (ecuaciones adicionales para completar sistema)
        [2, 0, 0, -1, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 2, 0, 0, -1, 0],
        [0, 0, 1, 0, 0, 0, 0, 0, -2],
      ],
      rhs: [150, 200, 120, 120, 200, 80, 30, 50, -20],
      varLabels: ["x₁(P1→N)", "x₂(P1→C)", "x₃(P1→S)", "x₄(P2→N)", "x₅(P2→C)", "x₆(P2→S)", "x₇(P3→N)", "x₈(P3→C)", "x₉(P3→S)"]
    }
  },

  // ============================
  // ESCENARIO F: Rumores y Compras de Pánico (Sistemas Mal Condicionados)
  // ============================
  rumorPanic: {
    description: "Efecto de rumores sobre la demanda en la red de distribución",
    zones: ["Zona Norte", "Zona Sur", "Zona Este", "Zona Oeste"],
    // Sistema mal condicionado: pequeños cambios en b causan grandes cambios en x
matrix: [
  [12, 2, 1, 1],
  [2, 12, 2, 1],
  [1, 2, 12, 2],
  [1, 1, 2, 12]
],
    demandOriginal: [30, 25, 28, 27],
    labels: ["D₁ (Norte)", "D₂ (Sur)", "D₃ (Este)", "D₄ (Oeste)"],
    // Niveles de rumor: cada nivel perturba la demanda
    rumorLevels: {
      bajo:   { factor: 1.02, label: "Rumor bajo (+2%)",   description: "Leve aumento en demanda por comentarios informales" },
      medio:  { factor: 1.05, label: "Rumor medio (+5%)",  description: "Noticias en redes sociales aumentan la percepción de escasez" },
      alto:   { factor: 1.10, label: "Rumor alto (+10%)",  description: "Pánico moderado, colas en tiendas y estaciones" },
      panico: { factor: 1.20, label: "Pánico total (+20%)", description: "Compras masivas, acaparamiento, estantes vacíos" }
    },
    // Perturbaciones específicas para análisis
    perturbations: [
      { label: "Δb global +2%", delta: "percent_2" },
{ label: "Δb global +5%", delta: "percent_5" },
{ label: "Δb global +10%", delta: "percent_10" },
{ label: "Shock externo +20%", delta: "percent_20" }  // calculated as 5% of original
    ]
  },

  // ============================
  // ESCENARIO B: Vaciado Crítico de Reservas de Carburantes
  // ============================
  fuelReserves: {
    description: "Simulación del vaciado de reservas de carburantes en una planta",
    R0: 10000,             // Reserva inicial (litros)
    entradaNormal: 800,    // Entrada normal (litros/día)
    entradaCrisis: 200,    // Entrada durante crisis (litros/día)
    consumoNormal: 600,    // Consumo normal (litros/día)
    consumoCrisis: 900,    // Consumo durante crisis (litros/día)
    nivelCritico: 1000,    // Nivel crítico de reserva
    days: 60,
    // R'(t) = entrada - consumo
    // consumo puede modelarse como: consumoBase * (1 + factor_panico)
    params: {
      entrada: 200,
      consumoBase: 0.08,  // fracción de R consumida por día
      factorPanico: 0.02,
      description: "R'(t) = entrada - consumoBase × R × (1 + factorPanico)"
    },
    // Para preguntas "¿Qué pasa si...?"
    whatIf: {
      consumoAlto:     { consumoBase: 0.12, label: "Consumo +50%", description: "La demanda aumenta significativamente" },
      consumoBajo:     { consumoBase: 0.05, label: "Consumo -37%", description: "Racionamiento reduce el consumo" },
      entradaReducida: { entrada: 100,      label: "Entrada -50%", description: "El reabastecimiento se reduce a la mitad" },
      entradaCero:     { entrada: 0,        label: "Sin entrada",  description: "Se corta completamente el suministro" },
      entradaAlta:     { entrada: 500,      label: "Entrada +150%", description: "Se logra aumentar el reabastecimiento" },
    }
  },

  // ============================
  // ESCENARIO C: Desabastecimiento y Curva de Precios
  // ============================
  foodPrices: {
    description: "Variación de precios de productos básicos con datos dispersos",
    items: {
      papa: { name: "Papa (arroba)", unit: "Bs", data: [
        {day: 1, price: 8}, {day: 5, price: 10}, {day: 10, price: 13},
        {day: 15, price: 16}, {day: 20, price: 19}, {day: 30, price: 22}
      ]},
      arroz: { name: "Arroz (kg)", unit: "Bs", data: [
        {day: 1, price: 3.50}, {day: 5, price: 4.20}, {day: 10, price: 5.80},
        {day: 15, price: 8.50}, {day: 20, price: 12.00}, {day: 25, price: 14.50}, {day: 30, price: 15.80}
      ]},
      harina: { name: "Harina (kg)", unit: "Bs", data: [
        {day: 1, price: 2.80}, {day: 5, price: 3.40}, {day: 10, price: 4.90},
        {day: 15, price: 7.20}, {day: 20, price: 9.80}, {day: 25, price: 11.50}, {day: 30, price: 12.90}
      ]},
      aceite: { name: "Aceite (L)", unit: "Bs", data: [
        {day: 1, price: 5.00}, {day: 5, price: 5.80}, {day: 10, price: 7.50},
        {day: 15, price: 11.00}, {day: 20, price: 15.50}, {day: 25, price: 18.00}, {day: 30, price: 20.20}
      ]},
      leche: { name: "Leche (L)", unit: "Bs", data: [
        {day: 1, price: 4.00}, {day: 5, price: 4.60}, {day: 10, price: 6.20},
        {day: 15, price: 9.00}, {day: 20, price: 13.00}, {day: 25, price: 15.80}, {day: 30, price: 17.50}
      ]}
    }
  },

  // ============================
  // ESCENARIO D: Costo Acumulado y Pérdida del Poder Adquisitivo
  // ============================
  familyCosts: {
    description: "Costo acumulado de la canasta familiar básica durante crisis",
    ingresoMensualFamiliar: 3500, // Bs/mes
    // Precios diarios de la canasta completa (suma de productos)
    dailyPrices: [
      8.5, 9.0, 9.8, 10.5, 11.2, 12.0, 12.8, 13.5, 14.5, 15.2,
      16.0, 17.1, 18.0, 19.2, 20.5, 21.0, 22.5, 23.8, 25.0, 26.5,
      27.8, 29.0, 30.5, 31.2, 32.8, 34.0, 35.5, 37.0, 38.5, 40.0
    ],
    normalDailyPrice: 8.5,
    // Desglose por producto para análisis de contribución
    productBreakdown: {
      papa:   [2.0, 2.2, 2.5, 2.8, 3.2, 3.5, 3.8, 4.0, 4.3, 4.5, 4.8, 5.2, 5.5, 5.8, 6.2, 6.4, 6.8, 7.2, 7.5, 7.8, 8.0, 8.3, 8.6, 8.8, 9.2, 9.5, 9.8, 10.2, 10.5, 11.0],
      arroz:  [1.5, 1.6, 1.7, 1.9, 2.0, 2.2, 2.4, 2.5, 2.7, 2.8, 3.0, 3.2, 3.4, 3.6, 3.8, 4.0, 4.2, 4.4, 4.6, 4.8, 5.0, 5.3, 5.5, 5.7, 6.0, 6.2, 6.5, 6.8, 7.0, 7.3],
      harina: [1.0, 1.0, 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.8, 1.9, 2.0, 2.1, 2.3, 2.4, 2.5, 2.6, 2.8, 3.0, 3.2, 3.3, 3.5, 3.6, 3.8, 3.9, 4.1, 4.3, 4.5, 4.7, 4.8, 5.0],
      aceite: [2.0, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.8, 3.0, 3.2, 3.4, 3.6, 3.8, 4.0, 4.2, 4.4, 4.7, 5.0, 5.3, 5.5, 5.8, 6.0, 6.3, 6.5, 6.8, 7.0, 7.3, 7.5, 7.8, 8.2],
      leche:  [2.0, 2.1, 2.3, 2.3, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.8, 3.0, 3.0, 3.4, 3.8, 3.6, 4.0, 4.2, 4.4, 5.1, 5.5, 5.8, 6.3, 6.3, 6.7, 7.0, 6.9, 7.8, 8.4, 8.5],
    },
    productNormalPrices: { papa: 2.0, arroz: 1.5, harina: 1.0, aceite: 2.0, leche: 2.0 },
    productNames: { papa: "Papa", arroz: "Arroz", harina: "Harina", aceite: "Aceite", leche: "Leche" }
  },

  // ============================
  // ESCENARIO E: Umbrales Críticos de Abastecimiento
  // ============================
  criticalThresholds: {
    description: "Determinación de umbrales críticos mediante raíces de ecuaciones",
    functions: {
      costoIngreso: {
        name: "Costo acumulado supera ingreso familiar",
        expr: "C(t) - Ingreso: integral de precios hasta día t menos ingreso mensual",
        // f(t) = costo_acumulado(t) - ingreso_familiar
        // Aproximación: f(t) = 8.5*t + 1.05*t² - 3500  (costo crece cuadráticamente)
        f: (t) => 8.5 * t + 1.05 * t * t - 3500,
        df: (t) => 8.5 + 2.1 * t,
        interval: [1, 60],
        description: "Punto donde el gasto acumulado en canasta básica supera el ingreso mensual familiar de 3500 Bs"
      },
      tasaReposicion: {
        name: "Tasa crítica de reposición de carburante",
        expr: "F(r) = r - consumo_base × R_eq: tasa que iguala consumo y llegada",
        // En equilibrio: entrada = consumoBase * R  →  r = 0.08 * R
        // f(r) = r - 0.08*(10000 - 50*r) → 0 (encontrar r que equilibre)
        f: (r) => r - 0.08 * (10000 - 50 * r),
        df: (r) => 1 + 4,
        interval: [50, 300],
        description: "Tasa mínima de reposición (litros/día) para que las reservas no lleguen a cero"
      },
      umbralOpinion: {
        name: "Umbral de opinión social (estabilidad → masificación)",
        expr: "G(M) = a·N·M - c·M·D - threshold: punto donde manifestantes crecen",
        // Cuando M'(t) > 0: aNM - cMD > 0 → aN > cD → M*(aN - cD) > 0
        // f(M) = 0.3*(0.7-M)*M - 0.1*M*0.1 - 0.01 (punto de bifurcación)
        f: (M) => 0.3 * (1.0 - M) * M - 0.1 * M * 0.15 - 0.01,
        df: (M) => 0.3 * (1.0 - 2 * M) - 0.015,
        interval: [0.01, 0.95],
        description: "Fracción de manifestantes donde el conflicto pasa de estable a masificación"
      }
    }
  },

  // ============================
  // ESCENARIO G: Difusión de Opinión / Descontento Social (Modelo N-M-D)
  // ============================
  socialDynamics: {
    description: "Modelo de dinámica social: Neutrales (N), Manifestantes (M), Mediadores (D)",
    // Poblaciones iniciales (fracciones de la población total)
    N0: 0.85,   // Ciudadanos neutrales
    M0: 0.10,   // Manifestantes activos
    D0: 0.05,   // Mediadores / actores de diálogo
    // Parámetros del modelo
    params: {
      a: 0.3,    // Tasa de influencia / contagio del descontento
      b: 0.05,   // Recuperación / retorno a la neutralidad por diálogo
      c: 0.1,    // Efectividad del diálogo para reducir manifestantes
      k: 0.08,   // Reacción institucional / aparición de mediadores
      r: 0.03,   // Desgaste de los mediadores
    },
    days: 120,
    // Ecuaciones:
    // N'(t) = -a·N·M + b·D
    // M'(t) =  a·N·M - c·M·D
    // D'(t) =  k·M   - r·D
    // Para preguntas "¿Qué pasa si...?"
    whatIf: {
      sinMediadores:    { D0: 0, k: 0,    label: "Sin mediadores",       description: "No existen actores de diálogo" },
      mejorDialogo:     { c: 0.25, b: 0.15, label: "Diálogo efectivo",   description: "Se mejora significativamente la tasa de diálogo" },
      masDescontento:   { a: 0.5, M0: 0.2, label: "Alto descontento",    description: "Mayor tasa de contagio y más manifestantes iniciales" },
      masMediadores:    { D0: 0.15, k: 0.2, label: "Más mediadores",     description: "Mayor presencia institucional y diálogo" },
      conflictoMasivo:  { a: 0.6, c: 0.02, r: 0.1, label: "Conflicto masivo", description: "Alta influencia + mediadores ineficaces y desgastados" },
    }
  },

  // ============================
  // Información del equipo
  // ============================
  team: [
    {
      name: "Carlos Mendoza",
      role: "Frontend & UI/UX",
      modules: "Homepage, About, Métodos, UI Global",
      avatar: "CM",
      color: "#6366f1"
    },
    {
      name: "María Fernández",
      role: "Algoritmos Numéricos I",
      modules: "Sistemas Lineales, Raíces de Ecuaciones",
      avatar: "MF",
      color: "#06b6d4"
    },
    {
      name: "Andrés Ramírez",
      role: "Algoritmos Numéricos II",
      modules: "Interpolación, Integración, Ecuaciones Diferenciales",
      avatar: "AR",
      color: "#10b981"
    }
  ]
};

if (typeof module !== 'undefined') module.exports = SampleData;
