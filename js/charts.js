/* ===================================================
   CHARTS — Motor de Gráficos com Canvas API
   Gráficos de barras e donut sem dependências
   =================================================== */

const Charts = {
  /**
   * Desenha um gráfico de barras horizontais
   */
  drawBarChart(canvasId, data, options = {}) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.parentElement.getBoundingClientRect();

    canvas.width = rect.width * dpr;
    canvas.height = (options.height || 280) * dpr;
    canvas.style.width = rect.width + 'px';
    canvas.style.height = (options.height || 280) + 'px';
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = options.height || 280;

    const padding = { top: 20, right: 20, bottom: 40, left: 140 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // Limpa o canvas
    ctx.clearRect(0, 0, width, height);

    if (!data || data.length === 0) {
      ctx.fillStyle = '#5a6480';
      ctx.font = '13px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Sem dados para exibir', width / 2, height / 2);
      return;
    }

    const maxValue = Math.max(...data.map(d => d.value)) * 1.15;
    const barHeight = Math.min(28, (chartHeight / data.length) - 8);
    const gap = (chartHeight - barHeight * data.length) / (data.length + 1);

    // Grid lines
    const gridLines = 5;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= gridLines; i++) {
      const x = padding.left + (chartWidth / gridLines) * i;
      ctx.beginPath();
      ctx.moveTo(x, padding.top);
      ctx.lineTo(x, height - padding.bottom);
      ctx.stroke();

      // Labels do eixo X
      const val = (maxValue / gridLines) * i;
      ctx.fillStyle = '#5a6480';
      ctx.font = '10px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(Utils.formatCurrency(val), x, height - padding.bottom + 20);
    }

    // Barras
    data.forEach((item, i) => {
      const y = padding.top + gap + i * (barHeight + gap);
      const barWidth = (item.value / maxValue) * chartWidth;

      // Barra de fundo
      ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
      this._roundedRect(ctx, padding.left, y, chartWidth, barHeight, 4);
      ctx.fill();

      // Barra de valor com gradiente
      const gradient = ctx.createLinearGradient(padding.left, 0, padding.left + barWidth, 0);
      gradient.addColorStop(0, item.color || '#6366f1');
      gradient.addColorStop(1, item.colorEnd || item.color || '#818cf8');
      ctx.fillStyle = gradient;
      this._roundedRect(ctx, padding.left, y, barWidth, barHeight, 4);
      ctx.fill();

      // Label do nome (eixo Y)
      ctx.fillStyle = '#94a3b8';
      ctx.font = '11px Inter, sans-serif';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      const displayName = item.label.length > 18 ? item.label.substring(0, 18) + '...' : item.label;
      ctx.fillText(displayName, padding.left - 10, y + barHeight / 2);

      // Valor na barra
      if (barWidth > 60) {
        ctx.fillStyle = '#fff';
        ctx.font = '600 10px Inter, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(Utils.formatCurrency(item.value), padding.left + barWidth - 8, y + barHeight / 2);
      }
    });
  },

  /**
   * Desenha um gráfico de donut
   */
  drawDonutChart(canvasId, data, options = {}) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const size = options.size || 240;

    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = size + 'px';
    canvas.style.height = size + 'px';
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, size, size);

    if (!data || data.length === 0) {
      ctx.fillStyle = '#5a6480';
      ctx.font = '13px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Sem dados', size / 2, size / 2);
      return;
    }

    const cx = size / 2;
    const cy = size / 2;
    const outerRadius = (size / 2) - 10;
    const innerRadius = outerRadius * 0.62;
    const total = data.reduce((sum, d) => sum + d.value, 0);

    let currentAngle = -Math.PI / 2;

    data.forEach((item) => {
      const sliceAngle = (item.value / total) * Math.PI * 2;
      const gapAngle = 0.03;

      ctx.beginPath();
      ctx.arc(cx, cy, outerRadius, currentAngle + gapAngle, currentAngle + sliceAngle - gapAngle);
      ctx.arc(cx, cy, innerRadius, currentAngle + sliceAngle - gapAngle, currentAngle + gapAngle, true);
      ctx.closePath();

      // Gradiente
      const midAngle = currentAngle + sliceAngle / 2;
      const gx1 = cx + Math.cos(midAngle) * innerRadius;
      const gy1 = cy + Math.sin(midAngle) * innerRadius;
      const gx2 = cx + Math.cos(midAngle) * outerRadius;
      const gy2 = cy + Math.sin(midAngle) * outerRadius;
      const gradient = ctx.createLinearGradient(gx1, gy1, gx2, gy2);
      gradient.addColorStop(0, item.color);
      gradient.addColorStop(1, item.colorEnd || item.color);
      ctx.fillStyle = gradient;
      ctx.fill();

      // Shadow
      ctx.shadowColor = item.color;
      ctx.shadowBlur = 8;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      ctx.fill();
      ctx.shadowBlur = 0;

      currentAngle += sliceAngle;
    });

    // Texto central
    ctx.fillStyle = options.centerColor || '#f1f5f9';
    ctx.font = '800 22px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(Utils.formatCurrency(total), cx, cy - 6);

    ctx.fillStyle = '#5a6480';
    ctx.font = '500 11px Inter, sans-serif';
    ctx.fillText('Total Mensal', cx, cy + 16);
  },

  /**
   * Desenha legenda para o donut chart
   */
  renderDonutLegend(containerId, data) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const total = data.reduce((sum, d) => sum + d.value, 0);
    let html = '<div style="display:flex;flex-direction:column;gap:20px;">';

    data.forEach(item => {
      const percent = total > 0 ? ((item.value / total) * 100).toFixed(1) : 0;
      html += `
        <div style="display:flex;flex-direction:column;gap:6px;">
          <div style="display:flex;align-items:center;gap:8px;">
            <div style="width:12px;height:12px;border-radius:3px;background:${item.color};flex-shrink:0;"></div>
            <span style="font-size:13px;font-weight:600;color:var(--text-secondary);">${item.label}</span>
          </div>
          <div style="font-size:22px;font-weight:800;color:var(--text-primary);letter-spacing:-0.02em;">${Utils.formatCurrency(item.value)}</div>
          <div style="font-size:12px;color:var(--text-muted);">${percent}% do total</div>
        </div>
      `;
    });

    html += '</div>';
    container.innerHTML = html;
  },

  /**
   * Helper — Retângulo arredondado
   */
  _roundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  },
};
