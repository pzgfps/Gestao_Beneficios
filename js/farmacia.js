/* ===================================================
   FARMÁCIA MODULE
   Upload e visualização de dados de farmácia
   =================================================== */

const FarmaciaModule = {
  data: [],

  render(container) {
    container.innerHTML = `
      <div class="toolbar" style="justify-content: space-between;">
        <div class="toolbar-left" style="display:flex; gap:16px;">
          <label class="btn btn-primary" style="cursor: pointer;">
            <span class="nav-icon">${ICONS.plus}</span> Carregar Planilha (Excel/CSV)
            <input type="file" id="farmacia-upload" accept=".xlsx, .xls, .csv" style="display: none;">
          </label>
          <div class="search-box">
            ${ICONS.search}
            <input type="text" id="farmacia-search" class="search-input" placeholder="Buscar por nome ou CPF...">
          </div>
        </div>
        <div class="toolbar-right">
          <button class="btn btn-outline" id="farmacia-clear">
            <span class="nav-icon">${ICONS.trash}</span> Limpar
          </button>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <div class="card-title">
            <span class="nav-icon">${ICONS.farmacia}</span> Lançamentos da Farmácia
          </div>
        </div>
        
        <div class="table-wrapper">
          <table class="data-table data-table-spacious">
            <thead>
              <tr>
                <th>Nome</th>
                <th style="text-align:center;">Qtd. Compras</th>
                <th class="col-cpf">CPF</th>
                <th style="text-align:left;">Data</th>
                <th style="text-align:left;">Valor Total</th>
              </tr>
            </thead>
            <tbody id="farmacia-tbody">
              <!-- Renderizado via JS -->
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  setupEvents() {
    const uploadInput = document.getElementById('farmacia-upload');
    const clearBtn = document.getElementById('farmacia-clear');
    const searchInput = document.getElementById('farmacia-search');

    if (uploadInput) {
      uploadInput.addEventListener('change', (e) => this._handleUpload(e));
    }

    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        this.data = [];
        this._renderRows();
      });
    }

    if (searchInput) {
      searchInput.addEventListener('input', Utils.debounce(() => {
        this._renderRows(searchInput.value);
      }, 300));
    }

    // Tenta renderizar caso já tenha dados em memória
    this._renderRows();
  },

  _handleUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (typeof XLSX === 'undefined') {
      App.toast('Biblioteca de Excel ainda carregando, tente novamente.', 'warning');
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: 'array' });

        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

        this._parseData(json);
        this._renderRows();
        App.toast('Planilha carregada com sucesso!', 'success');
      } catch (err) {
        console.error('Erro ao ler planilha', err);
        App.toast('Erro ao ler arquivo da planilha', 'error');
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = ''; // reseta o input para permitir carregar o mesmo arquivo novamente
  },

  _parseData(rows) {
    const grouped = {};

    rows.forEach((row, index) => {
      // Helper robusto para extrair valores ignorando espaços, acentos, cases e caracteres especiais
      const getVal = (possibleNames) => {
        const compactNames = possibleNames.map(n => n.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, ''));
        for (const [key, val] of Object.entries(row)) {
          const compactKey = key.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, '');
          if (compactNames.includes(compactKey)) return val;
        }
        return '';
      };

      // Busca pelos nomes de colunas
      const nome = getVal(['nome', 'funcionario']);
      const cpf = getVal(['cpf']);
      const dataStr = getVal(['data', 'data do pedido', 'data da venda']);
      
      // Valores
      let valor = getVal(['valor']) || 0;
      let valorTotal = getVal(['valor total', 'total']) || valor;
      
      const parcelas = getVal(['numero de parcelas', 'n de parcelas', 'parcelas', 'parcela', 'numeroparcelas']);
      const idPedido = getVal(['id do pedido', 'id pedido', 'pedido', 'numero do pedido', 'n do pedido', 'id']);

      // Tenta formatar data caso o Excel envie como número (serial do Excel)
      let parsedData = String(dataStr);
      if (typeof dataStr === 'number') {
        const d = new Date(Math.round((dataStr - 25569) * 86400 * 1000));
        parsedData = `${d.getUTCDate().toString().padStart(2, '0')}/${(d.getUTCMonth() + 1).toString().padStart(2, '0')}/${d.getUTCFullYear()}`;
      } else if (parsedData) {
        // Tira o horário, se houver: "22/04/2026 15:30" ou "2026-04-22T15:30"
        parsedData = parsedData.split(' ')[0].split('T')[0];
        // Se vier no formato YYYY-MM-DD, formata para DD/MM/YYYY
        if (parsedData.includes('-')) {
          const parts = parsedData.split('-');
          if (parts.length === 3 && parts[0].length === 4) {
            parsedData = `${parts[2]}/${parts[1]}/${parts[0]}`;
          }
        }
      }

      if (!nome) return;

      const cleanCpf = String(cpf).replace(/\D/g, '');
      const key = cleanCpf || String(nome).toLowerCase();

      if (!grouped[key]) {
        grouped[key] = {
          id: index,
          nome: String(nome),
          cpf: String(cpf),
          valorTotal: 0,
          compras: []
        };
      }

      const parsedValorTotal = Utils.parseBRNumber(valorTotal);
      const parsedValor = Utils.parseBRNumber(valor) || parsedValorTotal;

      grouped[key].compras.push({
        data: String(parsedData),
        parcelas: String(parcelas),
        valor: parsedValor,
        idPedido: String(idPedido)
      });
      grouped[key].valorTotal += parsedValorTotal;
    });

    const parseDateForSort = (dStr) => {
      if (!dStr) return 0;
      const parts = dStr.split('/');
      if (parts.length === 3) return new Date(`${parts[2]}-${parts[1]}-${parts[0]}T00:00:00`).getTime();
      return new Date(dStr).getTime();
    };

    const finalData = Object.values(grouped);
    finalData.forEach(d => {
      d.compras.sort((a, b) => parseDateForSort(a.data) - parseDateForSort(b.data));
    });

    this.data = finalData;
  },

  _renderRows(filter = '') {
    const tbody = document.getElementById('farmacia-tbody');
    if (!tbody) return;

    if (this.data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted" style="padding:40px;">
        Nenhum dado carregado. Anexe uma planilha para começar.
      </td></tr>`;
      return;
    }

    const term = filter.toLowerCase();
    const filtered = this.data.filter(d => {
      return d.nome.toLowerCase().includes(term) || d.cpf.replace(/\D/g, '').includes(term.replace(/\D/g, ''));
    });

    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted" style="padding:40px;">Nenhum registro encontrado.</td></tr>`;
      return;
    }

    tbody.innerHTML = filtered.map(d => {
      let dataText = '-';
      if (d.compras && d.compras.length > 0) {
        const dates = d.compras.map(c => c.data).filter(Boolean);
        if (dates.length === 1) {
          dataText = dates[0];
        } else if (dates.length > 1) {
          dataText = `${dates[0]} - ${dates[dates.length - 1]}`;
        }
      }

      return `
        <tr>
          <td class="col-name" style="text-transform: uppercase;">${Utils.escapeHtml(d.nome)}</td>
          <td style="text-align:center;">
            <span style="font-weight: bold;">${d.compras.length}</span>
          </td>
          <td class="col-cpf">${Utils.escapeHtml(Utils.formatCPF(d.cpf))}</td>
          <td style="text-align:left; font-size:12px; color:var(--text-muted);">${Utils.escapeHtml(dataText)}</td>
          <td class="col-currency fw-700" style="color:var(--va-400); text-align:left;">${Utils.formatCurrency(d.valorTotal)}</td>
        </tr>
      `;
    }).join('');
  }
};
