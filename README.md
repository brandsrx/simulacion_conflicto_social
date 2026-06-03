# SimNum — Simulación Numérica de Crisis

> Simulación Numérica de Abastecimiento, Precios y Conflicto Social en Contexto de Crisis

Plataforma interactiva que demuestra la aplicación práctica de **14 métodos numéricos** a **7 escenarios de crisis** reales.

## 🚀 Despliegue

Este proyecto es un sitio estático. Puede desplegarse directamente en:
- **GitHub Pages**: Sube el repositorio y activa Pages desde Settings
- **Netlify**: Conecta el repositorio o arrastra la carpeta
- **Vercel**: Importa el repositorio

### Desarrollo Local
```bash
# Cualquier servidor estático funciona:
npx serve .
# O con Python:
python3 -m http.server 8000
```

## 📂 Estructura

```
├── index.html                      # Homepage
├── css/styles.css                  # Design system
├── js/
│   ├── main.js                     # Nav, footer, utilities
│   ├── charts/chart-manager.js     # Chart.js wrapper
│   └── modules/
│       ├── linear-systems.js       # LU, Jacobi, GS, SOR, CG
│       ├── roots.js                # Bisección, Newton, Secante
│       ├── interpolation.js        # Lagrange, Newton, Splines
│       ├── integration.js          # Trapecios, Simpson 1/3, 3/8
│       └── differential-equations.js # Euler, Heun, RK4
├── data/sample-data.js             # Datos de ejemplo
└── pages/
    ├── about.html                  # Contexto del proyecto
    ├── methods.html                # Resumen de métodos
    ├── linear-systems.html         # Módulo 1
    ├── roots.html                  # Módulo 2
    ├── interpolation.html          # Módulo 3
    ├── integration.html            # Módulo 4
    ├── differential-equations.html # Módulo 5
    ├── conclusions.html            # Conclusiones
    └── team.html                   # Equipo
```

## 🧮 Métodos Implementados

| Categoría | Métodos | Escenarios |
|-----------|---------|------------|
| Sistemas Lineales | LU, Jacobi, Gauss-Seidel, SOR, Gradiente Conjugado | Distribución de suministros, Propagación de rumores |
| Raíces | Bisección, Newton-Raphson, Secante | Umbrales críticos |
| Interpolación | Lagrange, Newton, Splines Cúbicos | Precios de alimentos |
| Integración | Trapecios, Simpson 1/3, Simpson 3/8 | Costos familiares acumulados |
| Ec. Diferenciales | Euler, Heun, Runge-Kutta 4 | Combustible, Descontento social |

## 👥 Equipo

| Miembro | Rol | Módulos |
|---------|-----|---------|
| Carlos Mendoza | Frontend & UI/UX | Homepage, About, Métodos, UI |
| María Fernández | Algoritmos I | Sist. Lineales, Raíces |
| Andrés Ramírez | Algoritmos II | Interpolación, Integración, EDO |

## 📄 Tecnologías

- HTML5 + CSS3 (TailwindCSS CDN)
- Vanilla JavaScript (ES6+)
- Chart.js

---

*Proyecto Final — Métodos Numéricos — Semestre 2025-II*
