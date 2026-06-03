/* ============================================
   Main JS - Navigation, Footer, Utilities
   ============================================ */

(function () {
  'use strict';

  const isSubPage = window.location.pathname.includes('/pages/');
  const base = isSubPage ? '..' : '.';

  // ---- NAVBAR ----
  function renderNavbar() {
    const container = document.getElementById('nav-container');
    if (!container) return;
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const links = [
      { href: `${base}/index.html`, label: 'Inicio', page: 'index.html' },
      { href: `${base}/pages/about.html`, label: 'Contexto', page: 'about.html' },
      { href: `${base}/pages/methods.html`, label: 'Métodos', page: 'methods.html' },
      { href: `${base}/pages/linear-systems.html`, label: 'Sist. Lineales', page: 'linear-systems.html' },
      { href: `${base}/pages/roots.html`, label: 'Raíces', page: 'roots.html' },
      { href: `${base}/pages/interpolation.html`, label: 'Interpolación', page: 'interpolation.html' },
      { href: `${base}/pages/integration.html`, label: 'Integración', page: 'integration.html' },
      { href: `${base}/pages/differential-equations.html`, label: 'Ec. Diferenciales', page: 'differential-equations.html' },
      { href: `${base}/pages/conclusions.html`, label: 'Conclusiones', page: 'conclusions.html' },
      { href: `${base}/pages/team.html`, label: 'Equipo', page: 'team.html' },
    ];

    const navLinksHtml = links.map(l =>
      `<a href="${l.href}" class="${currentPage === l.page ? 'active' : ''}">${l.label}</a>`
    ).join('');

    const mobileLinksHtml = links.map(l =>
      `<a href="${l.href}" class="${currentPage === l.page ? 'active' : ''}">${l.label}</a>`
    ).join('');

    container.innerHTML = `
      <nav class="navbar" id="mainNav">
        <div class="nav-inner">
          <a href="${base}/index.html" class="nav-logo">
            <div class="nav-logo-icon">Σ</div>
            <span>SimNum</span>
          </a>
          <div class="nav-links">${navLinksHtml}</div>
          <button class="mobile-toggle" id="mobileToggle" aria-label="Menú">
            <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
        </div>
        <div class="mobile-menu" id="mobileMenu">${mobileLinksHtml}</div>
      </nav>
    `;

    // Mobile menu toggle
    document.getElementById('mobileToggle')?.addEventListener('click', () => {
      document.getElementById('mobileMenu')?.classList.toggle('open');
    });

    // Scroll effect
    window.addEventListener('scroll', () => {
      const nav = document.getElementById('mainNav');
      if (nav) nav.classList.toggle('scrolled', window.scrollY > 20);
    });
  }

  // ---- FOOTER ----
  function renderFooter() {
    const container = document.getElementById('footer-container');
    if (!container) return;
    container.innerHTML = `
      <footer class="footer">
        <div class="footer-inner">
          <div class="footer-grid">
            <div>
              <h4>SimNum</h4>
              <p>Simulación Numérica de Abastecimiento, Precios y Conflicto Social en Contexto de Crisis.</p>
            </div>
            <div>
              <h4>Módulos</h4>
              <p><a href="${base}/pages/linear-systems.html">Sistemas Lineales</a></p>
              <p><a href="${base}/pages/roots.html">Raíces de Ecuaciones</a></p>
              <p><a href="${base}/pages/interpolation.html">Interpolación</a></p>
              <p><a href="${base}/pages/integration.html">Integración Numérica</a></p>
              <p><a href="${base}/pages/differential-equations.html">Ecuaciones Diferenciales</a></p>
            </div>
            <div>
              <h4>Proyecto</h4>
              <p><a href="${base}/pages/about.html">Contexto del Proyecto</a></p>
              <p><a href="${base}/pages/methods.html">Métodos Numéricos</a></p>
              <p><a href="${base}/pages/conclusions.html">Conclusiones</a></p>
              <p><a href="${base}/pages/team.html">Equipo</a></p>
            </div>
            <div>
              <h4>Académico</h4>
              <p>Métodos Numéricos</p>
              <p>Ingeniería / Ciencias</p>
              <p>Semestre 2025-II</p>
              <p><a href="https://github.com" target="_blank">Repositorio GitHub →</a></p>
            </div>
          </div>
          <div class="footer-bottom">
            <p>© 2025 SimNum — Proyecto Final de Métodos Numéricos. Desarrollado por Ramiro Brandon Mamani Quisbert, Maya Celina Cadiz Quispe y Sergio Alejandro Macias Quispe.</p>
          </div>
        </div>
      </footer>
    `;
  }

  // ---- TABS ----
  window.initTabs = function (containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const buttons = container.querySelectorAll('.tab-btn');
    const contents = container.querySelectorAll('.tab-content');
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        buttons.forEach(b => b.classList.remove('active'));
        contents.forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        const target = document.getElementById(btn.dataset.tab);
        if (target) target.classList.add('active');
      });
    });
  };

  // ---- UTILITIES ----
  window.Utils = {
    formatNum(n, d = 6) {
      if (typeof n !== 'number' || isNaN(n)) return 'N/A';
      if (Math.abs(n) < 1e-12) return '0';
      if (Math.abs(n) > 1e8) return n.toExponential(d);
      return parseFloat(n.toFixed(d)).toString();
    },
    createTable(headers, rows, containerId) {
      const c = document.getElementById(containerId);
      if (!c) return;
      const ths = headers.map(h => `<th>${h}</th>`).join('');
      const trs = rows.map(r => `<tr>${r.map(v => `<td>${v}</td>`).join('')}</tr>`).join('');
      c.innerHTML = `<div class="data-table-wrapper"><table class="data-table"><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table></div>`;
    },
    showResults(containerId, html) {
      const c = document.getElementById(containerId);
      if (c) { c.innerHTML = html; c.style.display = 'block'; }
    },
    parseMatrix(id, n) {
      const m = [];
      for (let i = 0; i < n; i++) {
        m[i] = [];
        for (let j = 0; j < n; j++) {
          const el = document.getElementById(`${id}_${i}_${j}`);
          m[i][j] = el ? parseFloat(el.value) || 0 : 0;
        }
      }
      return m;
    },
    parseVector(id, n) {
      const v = [];
      for (let i = 0; i < n; i++) {
        const el = document.getElementById(`${id}_${i}`);
        v[i] = el ? parseFloat(el.value) || 0 : 0;
      }
      return v;
    },
    generateMatrixInputs(containerId, n, prefix, initialMatrix, initialVector) {
      const c = document.getElementById(containerId);
      if (!c) return;
      let html = '<div style="display:flex;gap:2rem;flex-wrap:wrap;align-items:start">';
      html += `<div><label class="form-label">Matriz A (${n}×${n})</label><div class="matrix-grid" style="grid-template-columns:repeat(${n},1fr)">`;
      for (let i = 0; i < n; i++)
        for (let j = 0; j < n; j++) {
          const val = initialMatrix ? initialMatrix[i][j] : 0;
          html += `<input type="number" step="any" id="${prefix}_${i}_${j}" value="${val}">`;
        }
      html += '</div></div>';
      html += `<div><label class="form-label">Vector b</label><div class="matrix-grid" style="grid-template-columns:1fr">`;
      for (let i = 0; i < n; i++) {
        const val = initialVector ? initialVector[i] : 0;
        html += `<input type="number" step="any" id="${prefix}b_${i}" value="${val}">`;
      }
      html += '</div></div></div>';
      c.innerHTML = html;
    }
  };

  // ---- INTERSECTION OBSERVER FOR ANIMATIONS ----
  function initAnimations() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('fade-in-up');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    document.querySelectorAll('.animate-on-scroll').forEach(el => observer.observe(el));
  }

  // ---- INIT ----
  document.addEventListener('DOMContentLoaded', () => {
    renderNavbar();
    renderFooter();
    initAnimations();
    // Close mobile menu on link click
    document.querySelectorAll('.mobile-menu a').forEach(a => {
      a.addEventListener('click', () => document.getElementById('mobileMenu')?.classList.remove('open'));
    });
  });
})();
