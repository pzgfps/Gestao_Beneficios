/* ===================================================
   VALE TRANSPORTE MODULE
   Tabela com filtros, CRUD e sincronização
   =================================================== */

const VTModule = {
  searchTerm: '',
  activeFilter: 'all', // 'all', 'londrina', 'cambe'

  render(container) {
    const data = this._getFilteredData();
    const total = data.reduce((sum, e) => sum + e.totalValue, 0);

    // Contadores para filtros
    const londrinaCount = AppState.vtData.filter(e => e.authorization.toUpperCase() === 'SIM').length;
    const cambeCount = AppState.vtData.filter(e => e.authorization.toUpperCase() === 'CAMBÉ').length;

    container.innerHTML = `
      <!-- Toolbar -->
      <div class="toolbar">
        <div class="toolbar-left">
          <div class="search-box">
            ${ICONS.search}
            <input type="text" class="search-input" id="vt-search"
              placeholder="Buscar por nome ou CPF..." value="${Utils.escapeHtml(this.searchTerm)}">
          </div>
          <div style="display:flex;gap:8px;">
            <button class="filter-chip ${this.activeFilter === 'all' ? 'active' : ''}" data-filter="all">
              Todos (${AppState.vtData.length})
            </button>
            <button class="filter-chip ${this.activeFilter === 'londrina' ? 'active' : ''}" data-filter="londrina">
              🏙️ Londrina (${londrinaCount})
            </button>
            <button class="filter-chip ${this.activeFilter === 'cambe' ? 'active' : ''}" data-filter="cambe">
              📍 Cambé (${cambeCount})
            </button>
          </div>
        </div>
        <div class="toolbar-right" id="vt-toolbar-right">
          <button class="btn btn-gray" id="vt-reset-btn" title="Restaurar valores padrão das configurações">
            <span class="nav-icon">${ICONS.reset}</span> Reiniciar
          </button>
          <label class="btn btn-primary" style="cursor: pointer;">
            <span class="nav-icon">${ICONS.plus}</span> Carregar Planilha
            <input type="file" id="vt-upload" accept=".xlsx, .xls, .csv" style="display: none;">
          </label>

          <button class="btn btn-vt" id="vt-add-btn">
            ${ICONS.plus} Novo Funcionário
          </button>
        </div>
      </div>

      <!-- Tabela -->
      <div class="card">
        <div class="table-wrapper vt-table-wrapper" id="vt-table-wrapper">
          <table class="data-table data-table-spacious" id="vt-table">
            <thead>
              <tr>
                <th style="width:36px;text-align:center;">
                  <input type="checkbox" class="row-checkbox" id="vt-select-all" title="Marcar todos">
                </th>
                <th class="col-code">#</th>
                <th>Funcionário</th>
                <th class="col-cpf">CPF</th>
                <th class="col-number">Qtd</th>
                <th class="col-currency" style="text-align:right;">Valor Unit.</th>
                <th class="col-currency" style="text-align:right;">Total</th>
                <th class="col-city" style="text-align:center;">Cidade</th>
                <th style="text-align:center;">Estagiário</th>
                <th class="col-actions" style="text-align:center;">Ações</th>
              </tr>
            </thead>
            <tbody id="vt-tbody">
              ${this._renderRows(data)}
            </tbody>
          </table>
        </div>
        <div class="table-footer">
          <div style="display:flex;gap:12px;align-items:center;">
            <button class="btn btn-outline btn-sm" id="vt-export-btn" title="Exportar Tabela para Excel">
              <span class="nav-icon">${ICONS.download}</span> Exportar
            </button>
            <span id="vt-employee-count">${data.length} funcionário${data.length !== 1 ? 's' : ''}</span>
          </div>
          <div style="display:flex;gap:16px;align-items:center;">
            <span class="table-total" style="color:var(--vt-400);">Total: ${Utils.formatCurrency(total)}</span>
          </div>
        </div>
      </div>
    `;
  },

  _getFilteredData() {
    let data = AppState.vtData;

    // Filtro por cidade
    if (this.activeFilter === 'londrina') {
      data = data.filter(e => e.authorization.toUpperCase() === 'SIM');
    } else if (this.activeFilter === 'cambe') {
      data = data.filter(e => e.authorization.toUpperCase() === 'CAMBÉ');
    }

    // Filtro por busca
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      data = data.filter(e =>
        e.name.toLowerCase().includes(term) ||
        e.cpf.includes(term)
      );
    }

    return data;
  },

  _renderRows(data) {
    if (data.length === 0) {
      return `<tr><td colspan="10" class="text-center text-muted" style="padding:40px;">
        ${this.searchTerm || this.activeFilter !== 'all' ? 'Nenhum funcionário encontrado.' : 'Nenhum dado carregado.'}
      </td></tr>`;
    }

    return data.map(e => {
      const isCambe = e.authorization.toUpperCase() === 'CAMBÉ';

      return `
        <tr data-row="${e.rowIndex}" data-code="${e.code}">
          <td style="text-align:center;width:36px;">
            <input type="checkbox" class="row-checkbox vt-row-chk" data-row="${e.rowIndex}">
          </td>
          <td class="col-code">${Utils.escapeHtml(e.code)}</td>
          <td class="col-name">
            <input type="text" class="inline-edit-input" data-field="name" value="${Utils.escapeHtml(e.name)}" style="text-transform:uppercase;">
          </td>
          <td class="col-cpf">
            <input type="text" class="inline-edit-input" data-field="cpf" value="${Utils.escapeHtml(Utils.formatCPF(e.cpf))}" maxlength="14">
          </td>
          <td class="col-number">
            <div class="quantity-stepper" style="margin: 0 auto;">
              <button class="stepper-btn minus-btn" data-row="${e.rowIndex}" data-action="minus">-</button>
              <input type="number" class="inline-edit-input stepper-input" data-field="quantity" value="${e.quantity}">
              <button class="stepper-btn plus-btn" data-row="${e.rowIndex}" data-action="plus">+</button>
            </div>
          </td>
          <td class="col-currency">
            <input type="text" class="inline-edit-input text-right" data-field="unitValue" value="${Utils.formatBRNumber(e.unitValue)}">
          </td>
          <td class="col-currency fw-700" style="color:var(--vt-400);">
            <input type="text" class="inline-edit-input text-right" data-field="totalValue" value="${Utils.formatBRNumber(e.totalValue)}" style="font-weight:700; color:var(--vt-400);">
          </td>
          <td class="col-city" style="text-align:center;">
            <select class="inline-edit-select" data-field="authorization" style="text-align:center;">
              <option value="SIM" ${!isCambe ? 'selected' : ''}>Londrina</option>
              <option value="CAMBÉ" ${isCambe ? 'selected' : ''}>Cambé</option>
            </select>
          </td>
          <td style="text-align:center;">
            <span class="badge" style="${e.isEstagiario ? 'background:var(--vt-600);color:#fff;' : 'background:var(--surface-3);color:var(--text-muted);'}">${e.isEstagiario ? 'SIM' : 'NÃO'}</span>
          </td>
          <td class="col-actions" style="text-align:center;">

            <button class="btn-reset-action vt-reset-row-btn" data-row="${e.rowIndex}" title="Restaurar valores padrão deste funcionário">
              ${ICONS.reset}
            </button>
          </td>
        </tr>
      `;
    }).join('');
  },

  setupEvents() {
    // Busca
    const searchInput = document.getElementById('vt-search');
    if (searchInput) {
      searchInput.addEventListener('input', Utils.debounce((e) => {
        this.searchTerm = e.target.value;
        this._refreshTable();
      }, 250));
    }

    // Upload de planilha
    const uploadInput = document.getElementById('vt-upload');
    if (uploadInput) {
      uploadInput.addEventListener('change', (e) => this._handleUpload(e));
    }

    // Botão Reiniciar
    const resetBtn = document.getElementById('vt-reset-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => this._showResetConfirm());
    }

    // Filtros
    document.querySelectorAll('.filter-chip[data-filter]').forEach(chip => {
      chip.addEventListener('click', (e) => {
        const clickedFilter = e.currentTarget.dataset.filter;
        if (this.activeFilter === clickedFilter && clickedFilter !== 'all') {
          this.activeFilter = 'all';
        } else {
          this.activeFilter = clickedFilter;
        }
        document.querySelectorAll('.filter-chip[data-filter]').forEach(c => c.classList.remove('active'));
        document.querySelector(`.filter-chip[data-filter="${this.activeFilter}"]`).classList.add('active');
        this._refreshTable();
      });
    });

    // Botão Adicionar
    const addBtn = document.getElementById('vt-add-btn');
    if (addBtn) {
      addBtn.addEventListener('click', () => this._showAddModal());
    }

    // Select-all
    const selectAll = document.getElementById('vt-select-all');
    if (selectAll) {
      selectAll.addEventListener('change', () => {
        document.querySelectorAll('.vt-row-chk').forEach(chk => {
          chk.checked = selectAll.checked;
          chk.closest('tr').classList.toggle('row-selected', selectAll.checked);
        });
        this._updateBulkDeleteBtn();
      });
    }

    // Botão excluir selecionados
    const bulkBtn = document.getElementById('vt-bulk-delete-btn');
    if (bulkBtn) {
      bulkBtn.addEventListener('click', () => this._handleBulkDelete(bulkBtn));
    }

    // Botão Exportar
    const exportBtn = document.getElementById('vt-export-btn');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => this._handleExportExcel());
    }

    this._bindRowEvents();
  },

  _handleExportExcel() {
    if (typeof XLSX === 'undefined') {
      App.toast('Biblioteca de Excel não carregada.', 'error');
      return;
    }

    const data = this._getFilteredData();
    if (data.length === 0) {
      App.toast('Não há dados para exportar.', 'warning');
      return;
    }

    const totalSpent = data.reduce((sum, e) => sum + (Number(e.totalValue) || 0), 0);
    const totalQty = data.reduce((sum, e) => sum + (Number(e.quantity) || 0), 0);

    const rows = data.map(e => ({
      'Código': e.code,
      'Funcionário': e.name,
      'CPF': Utils.formatCPF(e.cpf),
      'Quantidade': e.quantity,
      'Valor Unitário': Utils.formatBRNumber(e.unitValue),
      'Total': Utils.formatBRNumber(e.totalValue),
      'Cidade': e.authorization
    }));

    // Linha de total geral após todos os funcionários
    rows.push({
      'Código': '',
      'Funcionário': 'TOTAL GERAL',
      'CPF': '',
      'Quantidade': totalQty,
      'Valor Unitário': '',
      'Total': Utils.formatBRNumber(totalSpent),
      'Cidade': ''
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Vale Transporte');

    XLSX.writeFile(workbook, 'Relatorio_Vale_Transporte.xlsx');
    App.toast('Relatório exportado com sucesso!', 'success');
  },

  _handleUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (typeof XLSX === 'undefined') {
      App.toast('Biblioteca de Excel ainda carregando, tente novamente.', 'warning');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        const newData = this._parseData(json);

        App.showModal('Sincronizando', `
          <div style="text-align:center;padding:20px;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:32px;height:32px;animation:spin 1s linear infinite;color:var(--primary);"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>
            <h3 style="margin-top:16px;">Sincronizando com a Planilha Unificada...</h3>
            <p id="sync-progress" style="color:var(--text-secondary);margin-top:8px;">Iniciando...</p>
          </div>
        `);

        const progEl = document.getElementById('sync-progress');

        const formattedRows = newData.map(item => [
          item.code,
          item.name,
          item.cpf,
          String(item.quantity || 0),
          item.unitValue,
          item.totalValue,
          item.authorization || 'SIM',
          item.isEstagiario ? 'SIM' : ''
        ]);

        if (progEl) progEl.innerText = `Salvando ${formattedRows.length} funcionários na planilha...`;
        await SheetsAPI.replaceAllRows('Vale Transporte', formattedRows);

        if (progEl) progEl.innerText = 'Recarregando dados...';
        await SheetsAPI.loadAllData();
        App.closeModal();
        this._refreshTable();
        App._updateBadges();
        App.toast(`${formattedRows.length} funcionários importados com sucesso!`, 'success');
      } catch (err) {
        App.closeModal();
        console.error('Erro ao sincronizar', err);
        App.toast('Erro ao sincronizar com a planilha unificada: ' + err.message, 'error');
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  },

  _parseData(rows) {
    let started = false;
    const result = [];
    const seenCpfs = new Set();
    
    rows.forEach(row => {
      if (!row || !row.length) return;
      
      const col0 = String(row[0] || '').toLowerCase().trim();
      const col1 = String(row[1] || '').toLowerCase().trim();
      
      if (!started) {
        if (col0 === 'código' || col0 === 'codigo' || col1 === 'funcionário' || col1 === 'funcionario') {
          started = true;
        }
        return;
      }
      
      const code = String(row[0] || '');
      const name = String(row[1] || '').trim();
      const cpfRaw = String(row[2] || '').trim();
      const cpf = cpfRaw.replace(/\D/g, '');
      let qty = row[3];
      let unit = row[4];
      let total = row[5];
      let auth = row[6];
      let estagiario = String(row[7] || '').trim().toUpperCase() === 'SIM';
      
      if (!name || !cpf) return;
      if (seenCpfs.has(cpf)) return;
      seenCpfs.add(cpf);
      
      const parseMoney = (val) => {
        if (typeof val === 'number') return val;
        if (!val) return 0;
        const s = String(val).replace('R$', '').trim().replace(/\\./g, '').replace(',', '.');
        return parseFloat(s) || 0;
      };
      
      const parseQty = (val) => {
        if (typeof val === 'number') return val;
        if (!val) return 0;
        return parseInt(String(val).trim(), 10) || 0;
      };

      const finalQty = parseQty(qty);
      const finalUnit = parseMoney(unit);
      const finalTotal = parseMoney(total) || (finalQty * finalUnit);
      let finalAuth = String(auth || '').trim().toUpperCase();
      if (finalAuth !== 'SIM' && finalAuth !== 'CAMBÉ' && finalAuth !== 'CAMBE') {
          finalAuth = 'SIM';
      }
      if (finalAuth === 'CAMBE') finalAuth = 'CAMBÉ';

      result.push({
        name: name,
        cpf: cpfRaw,
        quantity: finalQty,
        unitValue: finalUnit,
        totalValue: finalTotal,
        authorization: finalAuth,
        isEstagiario: estagiario
      });
    });

    result.sort((a, b) => a.name.localeCompare(b.name));
    
    let seqCode = 1;
    result.forEach(item => {
      item.code = String(seqCode++);
    });

    return result;
  },

  _refreshTable() {
    const data = this._getFilteredData();
    const tbody = document.getElementById('vt-tbody');
    if (tbody) {
      tbody.innerHTML = this._renderRows(data);
      this._bindRowEvents();
      this._updateTableTotal();
      this._updateBulkDeleteBtn();
      
      const countEl = document.getElementById('vt-employee-count');
      if (countEl) countEl.innerText = `${data.length} funcionário${data.length !== 1 ? 's' : ''}`;
    }
  },

  _bindRowEvents() {

    // Reiniciar individual
    document.querySelectorAll('.vt-reset-row-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const rowIndex = parseInt(e.currentTarget.dataset.row);
        const tr = e.currentTarget.closest('tr');
        const employee = AppState.vtData.find(emp => emp.rowIndex === rowIndex);
        if (employee) {
          await this._handleResetSingle(employee, tr);
        }
      });
    });

    // Checkboxes individuais
    document.querySelectorAll('.vt-row-chk').forEach(chk => {
      chk.addEventListener('change', () => {
        const tr = chk.closest('tr');
        if (chk.checked) {
          tr.classList.add('selected');
        } else {
          tr.classList.remove('selected');
        }
        this._updateBulkActions();
      });
    });

    // Edição inline (Dropdowns)
    document.querySelectorAll('#vt-tbody .inline-edit-select').forEach(select => {
      select.addEventListener('focus', (e) => {
        e.target.dataset.original = e.target.value;
      });

      select.addEventListener('change', (e) => {
        this._handleInlineEdit(e.target);
      });
    });

    // Edição inline (Inputs)
    document.querySelectorAll('#vt-tbody .inline-edit-input').forEach(input => {
      input.addEventListener('focus', (e) => {
        e.target.dataset.original = e.target.value;
      });

      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.target.blur();
        }
      });

      if (input.dataset.field === 'cpf') {
        Utils.applyCPFMask(input);
      }

      input.addEventListener('blur', (e) => {
        this._handleInlineEdit(e.target);
      });
    });

    // Botões de Stepper (+ / -)
    document.querySelectorAll('#vt-tbody .stepper-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const action = e.currentTarget.dataset.action;
        const rowIndex = parseInt(e.currentTarget.dataset.row);
        const tr = e.currentTarget.closest('tr');
        const input = tr.querySelector('.stepper-input');
        
        const employee = AppState.vtData.find(emp => emp.rowIndex === rowIndex);
        if (!employee) return;

        let currentVal = parseInt(input.value) || employee.quantity;
        let newVal = action === 'plus' ? currentVal + 1 : currentVal - 1;

        if (newVal <= 0) {
          App.toast('A quantidade deve ser maior que 0', 'error');
          return;
        }

        input.dataset.original = currentVal.toString();
        input.value = newVal;
        await this._handleInlineEdit(input);
      });
    });
  },

  async _handleInlineEdit(input) {
    const field = input.dataset.field;
    const value = input.value.trim();
    const originalValue = input.dataset.original;
    const tr = input.closest('tr');
    const rowIndex = parseInt(tr.dataset.row);

    if (value === originalValue) return;

    const employee = AppState.vtData.find(e => e.rowIndex === rowIndex);
    if (!employee) return;

    let validatedValue;
    if (field === 'name') {
      validatedValue = value.toUpperCase();
      if (!validatedValue) {
        App.toast('O nome não pode ser vazio', 'error');
        input.value = originalValue;
        return;
      }
      const normalizeName = (n) => (n || '').trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const normNewName = normalizeName(validatedValue);
      const hasDuplicateName = AppState.vtData.some(e => e.rowIndex !== rowIndex && normalizeName(e.name) === normNewName);
      if (hasDuplicateName) {
        App.toast('Este nome já está cadastrado para outro funcionário.', 'error');
        input.value = originalValue;
        return;
      }
    } else if (field === 'cpf') {
      const cleanCpf = Utils.cleanCPF(value);
      if (cleanCpf.length !== 11 || !Utils.isValidCPF(cleanCpf)) {
        App.toast('CPF inválido. Deve possuir 11 dígitos.', 'error');
        input.value = originalValue;
        return;
      }
      // Check for duplicate CPF in the active sheet
      const hasDuplicate = AppState.vtData.some(e => e.rowIndex !== rowIndex && Utils.cleanCPF(e.cpf) === cleanCpf);
      if (hasDuplicate) {
        App.toast('Este CPF já está cadastrado para outro funcionário.', 'error');
        input.value = originalValue;
        return;
      }
      validatedValue = cleanCpf;
      input.value = Utils.formatCPF(cleanCpf);
    } else if (field === 'quantity') {
      validatedValue = parseInt(value);
      if (isNaN(validatedValue) || validatedValue <= 0) {
        App.toast('A quantidade deve ser um número inteiro maior que 0', 'error');
        input.value = originalValue;
        return;
      }
      input.value = validatedValue;
    } else if (field === 'unitValue' || field === 'totalValue') {
      validatedValue = Utils.parseBRNumber(value);
      if (isNaN(validatedValue) || validatedValue < 0) {
        App.toast('O valor deve ser um número válido', 'error');
        input.value = originalValue;
        return;
      }
      input.value = Utils.formatBRNumber(validatedValue);
    } else if (field === 'authorization') {
      validatedValue = value;

      // Atualiza automaticamente o valor unitário conforme a cidade escolhida
      const isCambe = value.toUpperCase() === 'CAMBÉ';
      const newUnitValue = isCambe
        ? (parseFloat(CONFIG.DEFAULTS.VT_CAMBE_UNIT_VALUE) || 6.25)
        : (parseFloat(CONFIG.DEFAULTS.VT_UNIT_VALUE) || 7.25);

      employee.unitValue = newUnitValue;

      // Atualiza visualmente o input de valor unitário na linha
      const unitInput = tr.querySelector('[data-field="unitValue"]');
      if (unitInput) {
        unitInput.value = Utils.formatBRNumber(newUnitValue);
        unitInput.dataset.original = unitInput.value;
      }
    }

    // Atualiza localmente
    employee[field] = validatedValue;
    
    if (field !== 'totalValue') {
      // Regra de arredondamento: sempre arredonda para cima
      let calculatedTotal = Math.ceil(employee.quantity * employee.unitValue);
      employee.totalValue = calculatedTotal;
    }

    const totalInput = tr.querySelector('.inline-edit-input[data-field="totalValue"]');
    if (totalInput) {
      totalInput.value = Utils.formatBRNumber(employee.totalValue);
      if (field !== 'totalValue') {
        totalInput.dataset.original = totalInput.value;
      }
    }
    this._updateTableTotal();

    input.dataset.original = input.value;
    input.style.backgroundColor = 'var(--bg-hover)';

    const applyEdit = async (updateBoth) => {
      try {
        await SheetsAPI.updateVTRow(employee.rowIndex, employee);
        if (updateBoth) {
          const oldCleanCpf = field === 'cpf' ? Utils.cleanCPF(originalValue) : Utils.cleanCPF(employee.cpf);
          const otherEmployee = AppState.vaData.find(e => Utils.cleanCPF(e.cpf) === oldCleanCpf);
          if (otherEmployee) {
             otherEmployee[field] = validatedValue;
             await SheetsAPI.updateVARow(otherEmployee.rowIndex, otherEmployee);
             App.toast('Alteração aplicada também no Vale Alimentação.', 'success');
          }
        }
      } catch (error) {
        App.toast('Erro ao salvar na planilha: ' + error.message, 'error');
      } finally {
        input.style.backgroundColor = '';
      }
    };

    // Se mudou nome ou CPF e o funcionário também tem VA, pergunta se deseja aplicar em ambas as abas
    if (field === 'name' || field === 'cpf') {
      const oldCleanCpf = field === 'cpf' ? Utils.cleanCPF(originalValue) : Utils.cleanCPF(employee.cpf);
      const hasBoth = AppState.vaData.some(e => Utils.cleanCPF(e.cpf) === oldCleanCpf);

      if (hasBoth) {
        App.showModal('Atualizar em ambas as abas?', `
          <div style="text-align:center;padding:10px 0;">
            <p style="font-size:14px;color:var(--text-primary);margin-bottom:8px;">
              Este funcionário também está cadastrado no <strong>Vale Alimentação</strong>.
            </p>
            <p style="font-size:13px;color:var(--text-muted);">
              Deseja aplicar essa alteração de ${field === 'name' ? 'nome' : 'CPF'} também na aba de VA?
            </p>
          </div>
        `, [
          { label: 'Não', class: 'btn btn-outline', action: () => { App.closeModal(); applyEdit(false); } },
          { label: 'Sim, atualizar', class: 'btn', style: 'background:var(--primary);color:#fff;', action: () => { 
              App.closeModal();
              applyEdit(true);
          } }
        ]);
      } else {
        applyEdit(false);
      }
    } else {
      applyEdit(false);
    }
  },



  _updateTableTotal() {
    const data = this._getFilteredData();
    const total = data.reduce((sum, e) => sum + e.totalValue, 0);
    const totalEl = document.querySelector('#content-area .table-total');
    if (totalEl) {
      totalEl.textContent = `Total: ${Utils.formatCurrency(total)}`;
    }
  },

  _updateBulkDeleteBtn() {
    const checked = document.querySelectorAll('.vt-row-chk:checked');
    const btn = document.getElementById('vt-bulk-delete-btn');
    const countEl = document.getElementById('vt-bulk-count');
    if (btn) btn.style.display = checked.length > 0 ? 'inline-flex' : 'none';
    if (countEl) countEl.textContent = checked.length;
    const all = document.querySelectorAll('.vt-row-chk');
    const selectAll = document.getElementById('vt-select-all');
    if (selectAll) {
      selectAll.indeterminate = checked.length > 0 && checked.length < all.length;
      selectAll.checked = all.length > 0 && checked.length === all.length;
    }
  },

  async _handleBulkDelete(btn) {
    const checked = [...document.querySelectorAll('.vt-row-chk:checked')];
    if (checked.length === 0) return;
    const rowIndexes = checked.map(c => parseInt(c.dataset.row));
    const employees = rowIndexes.map(ri => AppState.vtData.find(e => e.rowIndex === ri)).filter(Boolean);
    if (employees.length === 0) return;

    const nameList = employees.map(e => `<li>${Utils.escapeHtml(e.name)}</li>`).join('');
    App.showModal('Confirmar Exclus\u00e3o em Massa', `
      <div style="text-align:center;padding:12px 0 0;">
        <div style="font-size:40px;margin-bottom:12px;">⚠️</div>
        <p style="font-size:14px;color:var(--text-primary);margin-bottom:12px;">
          Voc\u00ea est\u00e1 prestes a remover <strong>${employees.length} funcion\u00e1rio(s)</strong> do Vale Transporte:
        </p>
        <ul style="text-align:left;font-size:13px;color:var(--text-secondary);max-height:180px;overflow-y:auto;padding-left:20px;">
          ${nameList}
        </ul>
        <p style="font-size:12px;color:var(--text-muted);margin-top:12px;">Esta a\u00e7\u00e3o n\u00e3o pode ser desfeita.</p>
      </div>
    `, [
      { label: 'Cancelar', class: 'btn btn-outline', action: () => App.closeModal() },
      { label: `Remover ${employees.length}`, class: 'btn btn-bulk-delete', action: async (e) => {
        const confirmBtn = e.currentTarget;
        confirmBtn.disabled = true;
        confirmBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px;animation:spin 1s linear infinite;"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg> Removendo 0/${employees.length}...`;

        try {
          const rowIndexes = employees.map(emp => emp.rowIndex);
          await SheetsAPI.batchDeleteRows('Vale Transporte', rowIndexes, (current, total) => {
            confirmBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px;animation:spin 1s linear infinite;"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg> Removendo ${current}/${total}...`;
          });
          
          // Recarrega dados reais da planilha para garantir consistência
          confirmBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px;animation:spin 1s linear infinite;"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg> Sincronizando...`;
          await SheetsAPI.loadAllData();
          
          App.closeModal();
          App.toast(`${employees.length} funcionário(s) removido(s) do VT!`, 'success');
        } catch (err) {
          App.closeModal();
          App.toast('Erro ao remover funcionários: ' + err.message, 'error');
        }
        App._updateBadges();
        this._refreshTable();
      }},
    ]);
  },

  _showAddModal() {
    // Funcionários da VA que ainda não estão no VT
    const vtCpfs = new Set(AppState.vtData.map(e => Utils.cleanCPF(e.cpf)));
    const available = AppState.vaData.filter(e => {
      const clean = Utils.cleanCPF(e.cpf);
      return clean && !vtCpfs.has(clean);
    });

    if (available.length === 0) {
      App.toast('Todos os funcionários do Vale Alimentação já estão cadastrados no Vale Transporte.', 'info');
      return;
    }

    const listRows = available.map((e, idx) => `
      <div class="vt-select-row" id="vt-row-${idx}" style="
        display:flex;flex-direction:column;gap:0;
        padding:12px 14px;
        border-radius:8px;border:1px solid var(--border-subtle);
        background:var(--surface-2);margin-bottom:8px;cursor:pointer;
        transition:border-color 0.15s,background 0.15s;
      " onclick="VTModule._toggleVtSelectRow(${idx})">
        <div style="display:flex;align-items:center;gap:12px;">
          <input type="checkbox" id="vt-chk-${idx}" value="${Utils.escapeHtml(e.cpf)}"
            style="width:18px;height:18px;flex-shrink:0;cursor:pointer;accent-color:var(--vt-400);"
            onclick="event.stopPropagation();VTModule._toggleVtSelectRow(${idx},this.checked)">
          <div style="flex:1;min-width:0;">
            <div style="font-weight:600;font-size:13px;color:var(--text-primary);word-break:break-word;">${Utils.escapeHtml(e.name)}</div>
            <div style="font-size:11px;color:var(--text-muted);">${Utils.escapeHtml(Utils.formatCPF(e.cpf))}</div>
          </div>
        </div>
        <div class="vt-select-config" id="vt-cfg-${idx}"
          style="display:none;flex-wrap:wrap;align-items:center;gap:10px;margin-top:10px;padding-top:10px;border-top:1px solid var(--border-subtle);"
          onclick="event.stopPropagation()">
          <div style="display:flex;align-items:center;gap:6px;font-size:12px;color:var(--text-secondary);">
            <span style="font-weight:600;">Cidade:</span>
            <select class="form-select" id="vt-auth-${idx}" style="font-size:12px;padding:6px 10px;width:130px;"
              onchange="VTModule._onVtAuthChange(${idx})">
              <option value="SIM">Londrina</option>
              <option value="CAMB\u00c9">Camb\u00e9</option>
            </select>
          </div>
          <div style="display:flex;align-items:center;gap:6px;font-size:12px;color:var(--text-secondary);">
            <span style="font-weight:600;">Qtd:</span>
            <input type="number" id="vt-qty-${idx}" value="${CONFIG.DEFAULTS.VT_QUANTITY}" min="1" style="
              width:65px;padding:5px 8px;font-size:12px;
              background:var(--surface-3);border:1px solid var(--border-subtle);
              border-radius:6px;color:var(--text-primary);text-align:center;
            " onclick="event.stopPropagation()">
          </div>
          <div style="display:flex;align-items:center;gap:6px;font-size:12px;color:var(--text-secondary);">
            <span style="font-weight:600;">Valor Unit.:</span>
            <input type="number" id="vt-unit-${idx}" step="0.01"
              value="${CONFIG.DEFAULTS.VT_UNIT_VALUE}"
              style="width:80px;padding:5px 8px;font-size:12px;
              background:var(--surface-3);border:1px solid var(--border-subtle);
              border-radius:6px;color:var(--text-primary);text-align:center;"
              onclick="event.stopPropagation()">
          </div>
        </div>
      </div>
    `).join('');

    App.showModal('Adicionar ao Vale Transporte', `
      <div style="margin-bottom:12px;">
        <p style="font-size:13px;color:var(--text-secondary);margin-bottom:12px;">
          Selecione um ou mais funcionários do Vale Alimentação para adicionar ao Vale Transporte.
          Após marcar, configure a cidade e quantidade para cada um.
        </p>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;gap:8px;">
          <button class="btn btn-outline" style="font-size:14px;padding:6px 14px;"
            onclick="VTModule._showAddNoVAModal()">
            ➕ Não tem VA
          </button>
          <div style="display:flex;gap:8px;">
            <button class="btn btn-outline" style="font-size:14px;padding:6px 14px;"
              onclick="document.querySelectorAll('[id^=vt-chk-]').forEach((c,i)=>{c.checked=true;VTModule._toggleVtSelectRow(i,true)})">
              Marcar todos
            </button>
            <button class="btn btn-outline" style="font-size:14px;padding:6px 14px;"
              onclick="document.querySelectorAll('[id^=vt-chk-]').forEach((c,i)=>{c.checked=false;VTModule._toggleVtSelectRow(i,false)})">
              Desmarcar todos
            </button>
          </div>
        </div>
        <div style="max-height:calc(92vh - 300px);overflow-y:auto;padding-right:4px;">
          ${listRows}
        </div>
      </div>
    `, [
      { label: 'Cancelar', class: 'btn btn-outline', action: () => App.closeModal() },
      { label: 'Adicionar Selecionados', class: 'btn btn-vt', action: (e) => this._handleAddFromVAList(available, e) },
    ]);

    // Aplica classe de modal largo apenas neste popup
    document.getElementById('modal')?.classList.add('modal-lg');
  },

  _showAddNoVAModal() {
    App.closeModal();
    setTimeout(() => {
      App.showModal('Novo Funcionário — Apenas VT', `
        <p style="font-size:13px;color:var(--text-secondary);margin-bottom:18px;">
          Este funcionário será cadastrado <strong>somente no Vale Transporte</strong> e não aparecerá na aba de Vale Alimentação.
        </p>
        <div class="form-group">
          <label class="form-label">Nome Completo</label>
          <input type="text" class="form-input" id="modal-novt-name" placeholder="Nome do funcionário" style="text-transform:uppercase;" autocomplete="off">
        </div>
        <div class="form-group">
          <label class="form-label">CPF</label>
          <input type="text" class="form-input" id="modal-novt-cpf" placeholder="000.000.000-00" maxlength="14">
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Quantidade (passagens)</label>
            <input type="number" class="form-input" id="modal-novt-qty" value="${CONFIG.DEFAULTS.VT_QUANTITY}" min="1">
          </div>
          <div class="form-group">
            <label class="form-label">Valor Unitário (R$)</label>
            <input type="number" class="form-input" id="modal-novt-unit" step="0.01" value="${CONFIG.DEFAULTS.VT_UNIT_VALUE}">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Cidade</label>
          <select class="form-select" id="modal-novt-auth">
            <option value="SIM">Londrina</option>
            <option value="CAMBÉ">Cambé</option>
          </select>
        </div>
      `, [
        { label: '\u2190 Voltar', class: 'btn btn-outline', action: () => { App.closeModal(); setTimeout(() => this._showAddModal(), 50); } },
        { label: 'Adicionar ao VT', class: 'btn btn-vt', action: (e) => this._handleAddNoVA(e) },
      ]);

      // Auto-fill unit value on city change
      const authSel = document.getElementById('modal-novt-auth');
      const unitInp = document.getElementById('modal-novt-unit');
      if (authSel && unitInp) {
        authSel.addEventListener('change', () => {
          unitInp.value = authSel.value === 'CAMBÉ'
            ? CONFIG.DEFAULTS.VT_CAMBE_UNIT_VALUE
            : CONFIG.DEFAULTS.VT_UNIT_VALUE;
        });
      }

      // CPF mask
      const cpfInp = document.getElementById('modal-novt-cpf');
      if (cpfInp) {
        Utils.applyCPFMask(cpfInp);
      }
    }, 50);
  },

  async _handleAddNoVA(e) {
    const btn = e ? e.currentTarget : null;
    const originalContent = btn ? btn.innerHTML : '';

    const name = (document.getElementById('modal-novt-name')?.value || '').trim().toUpperCase();
    const cpf = (document.getElementById('modal-novt-cpf')?.value || '').trim();
    const qty = parseInt(document.getElementById('modal-novt-qty')?.value) || 50;
    const unit = parseFloat(document.getElementById('modal-novt-unit')?.value) || CONFIG.DEFAULTS.VT_UNIT_VALUE;
    const auth = document.getElementById('modal-novt-auth')?.value || 'SIM';

    if (!name) return App.toast('Informe o nome do funcionário', 'error');
    if (!cpf) return App.toast('Informe o CPF', 'error');

    const cleanCpf = Utils.cleanCPF(cpf);
    if (cleanCpf.length !== 11 || !Utils.isValidCPF(cleanCpf)) {
      return App.toast('CPF inválido. Deve possuir 11 dígitos.', 'error');
    }

    const normalizeName = (n) => (n || '').trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const normName = normalizeName(name);

    const hasDuplicate = [...AppState.vaData, ...AppState.vtData].some(
      e => Utils.cleanCPF(e.cpf) === cleanCpf || normalizeName(e.name) === normName
    );
    if (hasDuplicate) {
      return App.toast('Este funcionário (CPF ou Nome) já está cadastrado no sistema.', 'error');
    }

    try {
      if (btn) {
        btn.disabled = true;
        btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px;animation:spin 1s linear infinite;"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg> Adicionando...`;
      }
      App.toast('Adicionando na planilha...', 'info');
      let calculatedTotal = Math.ceil(qty * unit);

      const nextCode = AppState.vtData.length > 0
        ? Math.max(...AppState.vtData.map(e => parseInt(e.code) || 0)) + 1
        : 1;

      await SheetsAPI.appendVTRow({
        code: nextCode.toString(),
        name,
        cpf: cleanCpf,
        quantity: qty,
        unitValue: unit,
        totalValue: calculatedTotal,
        authorization: auth
      });

      App.closeModal();
      App.toast(`${name} adicionado ao Vale Transporte (sem VA)!`, 'success');

      // Optimistic update
      AppState.vtData.push({ name, cpf: cleanCpf, quantity: qty, unitValue: unit, totalValue: calculatedTotal, authorization: auth, rowIndex: Date.now() });
      AppState.vtData.sort((a, b) => a.name.localeCompare(b.name));
      App._updateBadges();

      await SheetsAPI.loadAllData();
      App.navigateTo('vale-transporte');
    } catch (error) {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = originalContent;
      }
      App.toast('Erro ao adicionar: ' + error.message, 'error');
    }
  },

  _toggleVtSelectRow(idx, forceState) {
    const chk = document.getElementById(`vt-chk-${idx}`);
    const row = document.getElementById(`vt-row-${idx}`);
    const cfg = document.getElementById(`vt-cfg-${idx}`);
    if (!chk || !row || !cfg) return;

    const checked = forceState !== undefined ? forceState : !chk.checked;
    chk.checked = checked;

    if (checked) {
      row.style.borderColor = 'var(--vt-400)';
      row.style.background = 'rgba(99,179,237,0.07)';
      cfg.style.display = 'flex';
    } else {
      row.style.borderColor = 'var(--border-subtle)';
      row.style.background = 'var(--surface-2)';
      cfg.style.display = 'none';
    }
  },

  _onVtAuthChange(idx) {
    const authSelect = document.getElementById(`vt-auth-${idx}`);
    const unitInput = document.getElementById(`vt-unit-${idx}`);
    if (!authSelect || !unitInput) return;
    const isCambe = authSelect.value === 'CAMBÉ';
    unitInput.value = isCambe ? CONFIG.DEFAULTS.VT_CAMBE_UNIT_VALUE : CONFIG.DEFAULTS.VT_UNIT_VALUE;
  },

  async _handleAddFromVAList(available, e) {
    const btn = e ? e.currentTarget : null;
    const originalContent = btn ? btn.innerHTML : '';

    const selected = available.filter((e, idx) => {
      const chk = document.getElementById(`vt-chk-${idx}`);
      return chk && chk.checked;
    });

    if (selected.length === 0) {
      App.toast('Selecione ao menos um funcionário para adicionar.', 'error');
      return;
    }

    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px;animation:spin 1s linear infinite;"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg> Adicionando...`;
    }

    const batchRows = [];
    const addedItems = [];

    for (let idx = 0; idx < available.length; idx++) {
      const chk = document.getElementById(`vt-chk-${idx}`);
      if (!chk || !chk.checked) continue;

      const emp = available[idx];
      const authSel = document.getElementById(`vt-auth-${idx}`);
      const qtyInp = document.getElementById(`vt-qty-${idx}`);
      const unitInp = document.getElementById(`vt-unit-${idx}`);

      const auth = authSel ? authSel.value : 'SIM';
      const qty = qtyInp ? (parseInt(qtyInp.value) || 50) : 50;
      const unit = unitInp ? (parseFloat(unitInp.value) || CONFIG.DEFAULTS.VT_UNIT_VALUE) : CONFIG.DEFAULTS.VT_UNIT_VALUE;
      const cleanCpf = Utils.cleanCPF(emp.cpf);
      let calculatedTotal = Math.ceil(qty * unit);

      const rowValues = [
        emp.code,
        emp.name,
        cleanCpf,
        String(qty),
        unit,
        calculatedTotal,
        auth,
        ''
      ];

      batchRows.push(rowValues);
      addedItems.push({
        code: emp.code,
        name: emp.name,
        cpf: cleanCpf,
        quantity: qty,
        unitValue: unit,
        totalValue: calculatedTotal,
        authorization: auth,
        paused: false,
        type: 'VT',
        rowIndex: Date.now() + idx
      });
    }

    try {
      if (batchRows.length > 0) {
        await SheetsAPI.batchAppendRows('Vale Transporte', batchRows);
        addedItems.forEach(item => AppState.vtData.push(item));
        AppState.vtData.sort((a, b) => a.name.localeCompare(b.name));
      }

      App.closeModal();
      App.toast(`${batchRows.length} funcionário(s) adicionado(s) ao Vale Transporte!`, 'success');
      App._updateBadges();
      await SheetsAPI.loadAllData();
      App.navigateTo('vale-transporte');
    } catch (err) {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = originalContent;
      }
      App.toast('Erro ao adicionar funcionários: ' + err.message, 'error');
    }

    if (btn && errors.length > 0) {
      btn.disabled = false;
      btn.innerHTML = originalContent;
    }

    if (errors.length > 0) {
      errors.forEach(msg => App.toast(msg, 'error'));
    }
  },



  _showDeleteConfirm(employee) {
    App.showModal('Confirmar Exclusão do VT', `
      <div style="text-align:center;padding:20px 0;">
        <div style="font-size:48px;margin-bottom:16px;">⚠️</div>
        <p style="font-size:15px;color:var(--text-primary);margin-bottom:8px;">
          Tem certeza que deseja remover <strong>${Utils.escapeHtml(employee.name)}</strong> do Vale Transporte?
        </p>
        <p style="font-size:13px;color:var(--text-muted);">
          O funcionário continuará cadastrado no Vale Alimentação. Apenas o VT será removido.
        </p>
      </div>
    `, [
      { label: 'Cancelar', class: 'btn btn-outline', action: () => App.closeModal() },
      { label: 'Remover do VT', class: 'btn btn-sm', style: 'background:var(--error);color:#fff;', action: (e) => this._handleDelete(employee, e) },
    ]);
  },

  async _handleDelete(employee, e) {
    const btn = e ? e.currentTarget : null;
    const originalContent = btn ? btn.innerHTML : '';
    
    const tr = document.querySelector(`#vt-tbody tr[data-row="${employee.rowIndex}"]`);
    if (tr) {
      tr.style.opacity = '0.5';
      tr.style.pointerEvents = 'none';
    }
    
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px;animation:spin 1s linear infinite;"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg> Removendo...`;
    }

    try {
      App.toast('Removendo da planilha...', 'info');
      await SheetsAPI.deleteVTRow(employee.rowIndex);
      App.closeModal();
      
      AppState.vtData = AppState.vtData.filter(e => e.rowIndex !== employee.rowIndex);
      App._updateBadges();
      this._refreshTable();
      App.toast('Funcionário removido do Vale Transporte!', 'success');
    } catch (error) {
      if (tr) {
        tr.style.opacity = '1';
        tr.style.pointerEvents = 'auto';
      }
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = originalContent;
      }
      App.toast('Erro ao remover: ' + error.message, 'error');
    }
  },

  _showResetConfirm() {
    const checked = [...document.querySelectorAll('.vt-row-chk:checked')];
    const defaultQty = parseInt(AppState.config.vtQuantity) || CONFIG.DEFAULTS.VT_QUANTITY;
    const defaultLondrina = parseFloat(AppState.config.vtLondrinaUnitValue) || CONFIG.DEFAULTS.VT_UNIT_VALUE;
    const defaultCambe = parseFloat(AppState.config.vtCambeUnitValue) || CONFIG.DEFAULTS.VT_CAMBE_UNIT_VALUE;

    let targetEmployees = [];
    let title = '';
    let message = '';

    if (checked.length > 0) {
      const rowIndexes = new Set(checked.map(c => parseInt(c.dataset.row)));
      targetEmployees = AppState.vtData.filter(e => rowIndexes.has(e.rowIndex));
      title = `Reiniciar ${targetEmployees.length} Funcionário(s)`;
      message = `Deseja restaurar os valores de <strong>${targetEmployees.length} funcionário(s) selecionado(s)</strong> para os valores padrão?`;
    } else {
      targetEmployees = this._getFilteredData();
      if (targetEmployees.length === 0) {
        App.toast('Nenhum funcionário encontrado para reiniciar.', 'warning');
        return;
      }
      title = 'Reiniciar Funcionários';
      message = `Deseja restaurar os valores de <strong>${targetEmployees.length} funcionário(s)</strong> do Vale Transporte para os valores padrão?`;
    }

    App.showModal(title, `
      <div style="text-align:center;padding:12px 0;">
        <div style="font-size:36px;margin-bottom:12px;">🔄</div>
        <p style="font-size:14px;color:var(--text-primary);margin-bottom:16px;">
          ${message}
        </p>
        <div style="background:var(--bg-card);border:1px solid var(--border-subtle);border-radius:var(--radius-md);padding:14px;display:inline-block;text-align:left;font-size:13px;line-height:1.8;">
          <div><strong>Quantidade Padrão:</strong> ${defaultQty} passes</div>
          <div><strong>Valor Unitário Londrina:</strong> R$ ${Utils.formatBRNumber(defaultLondrina)}</div>
          <div><strong>Valor Unitário Cambé:</strong> R$ ${Utils.formatBRNumber(defaultCambe)}</div>
        </div>
      </div>
    `, [
      { label: 'Cancelar', class: 'btn btn-outline', action: () => App.closeModal() },
      { label: 'Confirmar Reinício', class: 'btn btn-primary', action: async (e) => {
        const confirmBtn = e.currentTarget;
        confirmBtn.disabled = true;
        confirmBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px;animation:spin 1s linear infinite;"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg> Reiniciando...`;
        await this._handleReset(targetEmployees);
        App.closeModal();
      }}
    ]);
  },

  async _handleReset(targetEmployees) {
    const defaultQty = parseInt(AppState.config.vtQuantity) || CONFIG.DEFAULTS.VT_QUANTITY;
    const defaultLondrina = parseFloat(AppState.config.vtLondrinaUnitValue) || CONFIG.DEFAULTS.VT_UNIT_VALUE;
    const defaultCambe = parseFloat(AppState.config.vtCambeUnitValue) || CONFIG.DEFAULTS.VT_CAMBE_UNIT_VALUE;

    targetEmployees.forEach(emp => {
      const isCambe = emp.authorization && emp.authorization.toUpperCase() === 'CAMBÉ';
      const unit = isCambe ? defaultCambe : defaultLondrina;
      emp.quantity = defaultQty;
      emp.unitValue = unit;
      emp.totalValue = Math.ceil(defaultQty * unit);
    });

    const formattedRows = AppState.vtData.map(item => [
      item.code,
      item.name,
      item.cpf,
      String(item.quantity || 0),
      item.unitValue,
      item.totalValue,
      item.authorization || 'SIM',
      item.paused ? 'PAUSADO' : ''
    ]);

    try {
      await SheetsAPI.replaceAllRows('Vale Transporte', formattedRows);
      App.toast(`${targetEmployees.length} funcionário(s) reiniciado(s) com sucesso!`, 'success');
    } catch (err) {
      App.toast('Erro ao salvar na planilha: ' + err.message, 'error');
    }

    this._refreshTable();
    App._updateBadges();
  },

  async _handleResetSingle(employee, tr) {
    const defaultQty = parseInt(AppState.config.vtQuantity) || CONFIG.DEFAULTS.VT_QUANTITY;
    const isCambe = employee.authorization && employee.authorization.toUpperCase() === 'CAMBÉ';
    const unit = isCambe 
      ? (parseFloat(AppState.config.vtCambeUnitValue) || CONFIG.DEFAULTS.VT_CAMBE_UNIT_VALUE)
      : (parseFloat(AppState.config.vtLondrinaUnitValue) || CONFIG.DEFAULTS.VT_UNIT_VALUE);
    const defaultTotal = Math.ceil(defaultQty * unit);

    employee.quantity = defaultQty;
    employee.unitValue = unit;
    employee.totalValue = defaultTotal;

    const qtyInput = tr ? tr.querySelector('.inline-edit-input[data-field="quantity"]') : null;
    const unitInput = tr ? tr.querySelector('.inline-edit-input[data-field="unitValue"]') : null;
    const totalInput = tr ? tr.querySelector('.inline-edit-input[data-field="totalValue"]') : null;
    if (qtyInput) qtyInput.value = defaultQty;
    if (unitInput) unitInput.value = Utils.formatBRNumber(unit);
    if (totalInput) totalInput.value = Utils.formatBRNumber(defaultTotal);
    this._updateTableTotal();

    try {
      await SheetsAPI.updateVTRow(employee.rowIndex, employee);
      App.toast(`Valores de ${employee.name} reiniciados para o padrão!`, 'success');
    } catch (err) {
      App.toast('Erro ao salvar na planilha: ' + err.message, 'error');
    }
  },

  destroy() {
    this.searchTerm = '';
    this.activeFilter = 'all';
  },
};
