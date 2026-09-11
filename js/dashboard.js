/* ===================================================
   DASHBOARD MODULE
   KPIs, gráficos e resumo geral
   =================================================== */

const DashboardModule = {
  render(container) {
    const vaTotal = AppState.vaData.reduce((sum, e) => sum + e.totalValue, 0);
    const vtTotal = AppState.vtData.reduce((sum, e) => sum + e.totalValue, 0);
    const grandTotal = vaTotal + vtTotal;
    const totalEmployees = typeof FuncionariosModule !== 'undefined' 
      ? FuncionariosModule._getConsolidatedEmployees().length 
      : 0;

    container.innerHTML = `
      <div style="background: linear-gradient(rgba(0,0,0,0.85), rgba(0,0,0,0.85)), url('img/dashboard-bg.png') no-repeat center bottom; background-size: cover; padding: var(--space-xl); min-height: calc(100vh - 80px);">
        <!-- KPI Cards -->
      <div class="kpi-grid stagger">
        <div class="kpi-card employees animate-fade-in-up">
          <div class="kpi-icon">${ICONS.users}</div>
          <div class="kpi-label">Funcionários</div>
          <div class="kpi-value">${totalEmployees}</div>
          <div class="kpi-footer">Cadastrados no sistema</div>
        </div>
        <div class="kpi-card va animate-fade-in-up">
          <div class="kpi-icon">${ICONS.food}</div>
          <div class="kpi-label">Vale Alimentação</div>
          <div class="kpi-value"><span class="currency">R$</span>${Utils.formatBRNumber(vaTotal)}</div>
          <div class="kpi-footer">${AppState.vaData.length} funcionários</div>
        </div>
        <div class="kpi-card vt animate-fade-in-up">
          <div class="kpi-icon">${ICONS.bus}</div>
          <div class="kpi-label">Vale Transporte</div>
          <div class="kpi-value"><span class="currency">R$</span>${Utils.formatBRNumber(vtTotal)}</div>
          <div class="kpi-footer">${AppState.vtData.length} funcionários</div>
        </div>
        <div class="kpi-card total animate-fade-in-up">
          <div class="kpi-icon">${ICONS.dollar}</div>
          <div class="kpi-label">Custo Total</div>
          <div class="kpi-value"><span class="currency">R$</span>${Utils.formatBRNumber(grandTotal)}</div>
          <div class="kpi-footer">VA + VT</div>
        </div>
      </div>

      <!-- Banner Imobiliária -->
      <div style="width: 100%; display: flex; justify-content: center; margin-top: 60px;">
        <div class="animate-fade-in-up" style="padding:0 20px;">
          <h2 class="text-gradient-red-white" style="font-size:clamp(32px, 4vw, 48px); font-weight:800; margin:0; letter-spacing:-0.03em; text-align:center; line-height:1.2; min-height: 2.4em;">
            <span id="typewriter-text"></span><span class="cursor-blink">|</span>
          </h2>
        </div>
      </div>
      </div>
    `;
  },

  setupEvents() {
    const el = document.getElementById('typewriter-text');
    if (el) {
      const text = "A gente é apaixonado|pelo que faz!";
      let i = 0;
      el.innerHTML = '';
      
      const typeWriter = () => {
        if (i < text.length) {
          const char = text.charAt(i);
          if (char === '|') {
            el.innerHTML += '<br>';
          } else {
            el.innerHTML += char;
          }
          i++;
          setTimeout(typeWriter, 70 + Math.random() * 50);
        }
      };
      
      // Delay de 500ms antes de começar a digitar
      setTimeout(typeWriter, 500);
    }
  },

  destroy() {
    // Cleanup se necessário
  },
};
