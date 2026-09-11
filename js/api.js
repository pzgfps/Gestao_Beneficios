/* ===================================================
   API — Google Sheets Integration
   Leitura via API Key, Escrita via Apps Script
   =================================================== */

const SheetsAPI = {
  /**
   * Lê dados de uma planilha via Google Sheets API v4
   */
  async fetchSheet(spreadsheetId, range) {
    const apiKey = CONFIG.API_KEY;
    if (!apiKey || apiKey.includes('COLE_AQUI')) throw new Error('API Key não configurada');

    const url = `${CONFIG.SHEETS_API_BASE}/${spreadsheetId}/values/${range}?key=${apiKey}&valueRenderOption=FORMATTED_VALUE`;

    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error?.message || `Erro HTTP ${response.status}`);
    }

    const data = await response.json();
    return data.values || [];
  },

  /**
   * Carrega todos os dados de Vale Alimentação
   */
  async fetchVA() {
    try {
      const spreadsheetId = AppState?.config?.spreadsheetId || CONFIG.SPREADSHEET_ID;
      const rows = await this.fetchSheet(spreadsheetId, `'Vale Alimentação'!${CONFIG.RANGES.FULL}`);
      return this.parseSheetData(rows, 'VA');
    } catch (error) {
      console.error('Erro ao carregar VA:', error);
      throw error;
    }
  },

  /**
   * Carrega todos os dados de Vale Transporte
   */
  async fetchVT() {
    try {
      const spreadsheetId = AppState?.config?.spreadsheetId || CONFIG.SPREADSHEET_ID;
      const rows = await this.fetchSheet(spreadsheetId, `'Vale Transporte'!${CONFIG.RANGES.FULL}`);
      return this.parseSheetData(rows, 'VT');
    } catch (error) {
      console.error('Erro ao carregar VT:', error);
      throw error;
    }
  },

  /**
   * Parseia dados brutos da planilha em objetos estruturados
   */
  parseSheetData(rows, type) {
    if (!rows || rows.length < 8) return { header: {}, employees: [], duplicates: [] };

    // Parse do cabeçalho (linhas 0-4)
    const header = {
      title: rows[0]?.[0] || '',
      company: rows[1]?.[1] || '',
      cnpj: rows[1]?.[4] || '',
      city: rows[2]?.[1] || '',
      phone: rows[2]?.[4] || '',
      address: rows[3]?.[1] || '',
      periodStart: rows[3]?.[4] || '',
      periodEnd: rows[3]?.[6] || '',
      emissionDate: rows[4]?.[1] || '',
    };

    // Parse dos funcionários (linhas 8+, index 8 no array)
    const employees = [];
    const duplicates = [];
    const seenCpfs = new Set();
    const seenNames = new Set();

    const normalizeName = (name) => {
      if (!name) return '';
      return name.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, ' ');
    };

    for (let i = 8; i < rows.length; i++) {
      const row = rows[i];
      if (!row || !row[1] || row[1].trim() === '') continue; // Pula linhas vazias

      const cpf = (row[2] || '').replace(/\D/g, '');
      const normName = normalizeName(row[1]);

      // Detecta duplicata por CPF ou por Nome normalizado
      const isDupByCpf = cpf && seenCpfs.has(cpf);
      const isDupByName = normName && seenNames.has(normName);

      if (isDupByCpf || isDupByName) {
        duplicates.push({
          rowIndex: i + 1,
          name: (row[1] || '').trim(),
          cpf: (row[2] || '').trim()
        });
        continue; // Exclui o clone em memória
      }

      if (cpf) {
        seenCpfs.add(cpf);
      }
      if (normName) {
        seenNames.add(normName);
      }

      const parseMoney = (val) => {
        if (typeof val === 'number') return val;
        if (!val) return 0;
        const s = String(val).replace('R$', '').trim().replace(/\./g, '').replace(',', '.');
        return parseFloat(s) || 0;
      };
      const parseQty = (val) => {
        if (typeof val === 'number') return val;
        if (!val) return 0;
        return parseInt(String(val).trim(), 10) || 0;
      };

      let quantity = parseQty(row[3]);
      let unitValue = parseMoney(row[4]);
      let totalValue = parseMoney(row[5]);
      const typeLower = type.toLowerCase();

      if (typeLower === 'va') {
        if (!quantity) quantity = parseFloat(AppState?.config?.vaQuantity || 30);
        if (!unitValue) unitValue = parseFloat(AppState?.config?.vaUnitValue || 23.33);
      } else if (typeLower === 'vt') {
        if (!quantity) quantity = parseFloat(AppState?.config?.vtQuantity || 50);
        const authNorm = (row[6] || '').trim().toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        if (!unitValue) {
          unitValue = (authNorm === 'CAMBE')
            ? parseFloat(AppState?.config?.vtCambeUnitValue || 6.50)
            : parseFloat(AppState?.config?.vtLondrinaUnitValue || 6.25);
        }
      }

      if (!totalValue) totalValue = Math.ceil(quantity * unitValue);

      employees.push({
        rowIndex: i + 1, // Índice real na planilha (1-based)
        code: String(employees.length + 1),
        name: (row[1] || '').trim(),
        cpf: (row[2] || '').trim(),
        quantity: quantity,
        unitValue: unitValue,
        totalValue: totalValue,
        authorization: (row[6] || '').trim(),
        paused: (row[7] || '').trim().toUpperCase() === 'PAUSADO',
        isEstagiario: (row[8] || '').trim().toUpperCase() === 'ESTAGIÁRIO' || (row[8] || '').trim().toUpperCase() === 'ESTAGIARIO',
        type: type,
      });
    }

    return { header, employees, duplicates };
  },

  /**
   * Escreve dados via Google Apps Script (proxy)
   */
  async writeViaAppsScript(scriptUrl, payload) {
    if (!scriptUrl || !scriptUrl.includes('script.google.com/macros/')) {
      throw new Error('URL do Apps Script não configurada corretamente! Vá em Configurações e insira o Link do Google Apps Script (Web App).');
    }

    // Injeta o ID da planilha (já limpo e extraído) para garantir que o Apps Script encontre o arquivo correto
    payload.spreadsheetId = CONFIG.SPREADSHEET_ID;

    // Usa text/plain para que o navegador envie como "simple request" sem preflight CORS.
    // O Apps Script consegue ler o body mesmo com text/plain.
    const response = await fetch(scriptUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
    });

    // no-cors retorna opaque response, assumimos sucesso
    return { success: true };
  },

  _clearReceiptStatus(cpf, rowIndex, type) {
    try {
      const cleanCpf = cpf ? String(cpf).replace(/\D/g, '') : '';
      const key = cleanCpf || `ROW_${rowIndex}`;
      const storageKey = `recibos_downloaded_${type}`;
      const map = JSON.parse(localStorage.getItem(storageKey) || '{}');
      if (map[key]) {
        delete map[key];
        localStorage.setItem(storageKey, JSON.stringify(map));
      }
    } catch (e) { }
  },

  /**
   * Atualiza APENAS as colunas D, E, F (Quantidade, Valor Unitário, Valor Total) de uma linha
   */
  async updateValuesOnly(sheetName, rowIndex, data) {
    const scriptUrl = CONFIG.SCRIPT_URL;
    return this.writeViaAppsScript(scriptUrl, {
      action: 'updateRange',
      sheetName: sheetName,
      range: `D${rowIndex}:F${rowIndex}`,
      values: [
        String(data.quantity || 0),
        data.unitValue,
        data.totalValue,
      ],
    });
  },

  /**
   * Atualiza uma linha de funcionário na planilha VA
   */
  async updateVARow(rowIndex, data) {
    if (data.paused) {
      this._clearReceiptStatus(data.cpf, rowIndex, 'va');
    }
    const scriptUrl = CONFIG.SCRIPT_URL;
    return this.writeViaAppsScript(scriptUrl, {
      action: 'update',
      sheetName: 'Vale Alimentação',
      row: rowIndex,
      values: [
        data.code,
        data.name,
        data.cpf,
        String(data.quantity || 0),
        data.unitValue,
        data.totalValue,
        data.authorization || '',
        data.paused ? 'PAUSADO' : '',
        data.isEstagiario ? 'ESTAGIÁRIO' : '',
      ],
    });
  },

  /**
   * Atualiza uma linha de funcionário na planilha VT
   */
  async updateVTRow(rowIndex, data) {
    if (data.paused) {
      this._clearReceiptStatus(data.cpf, rowIndex, 'vt');
    }
    const scriptUrl = CONFIG.SCRIPT_URL;
    return this.writeViaAppsScript(scriptUrl, {
      action: 'update',
      sheetName: 'Vale Transporte',
      row: rowIndex,
      values: [
        data.code,
        data.name,
        data.cpf,
        String(data.quantity || 0),
        data.unitValue,
        data.totalValue,
        data.authorization || '',
        data.paused ? 'PAUSADO' : '',
        data.isEstagiario ? 'ESTAGIÁRIO' : '',
      ],
    });
  },

  /**
   * Adiciona novo funcionário na planilha VA
   */
  async appendVARow(data) {
    const scriptUrl = CONFIG.SCRIPT_URL;
    return this.writeViaAppsScript(scriptUrl, {
      action: 'append',
      sheetName: 'Vale Alimentação',
      values: [
        data.code,
        data.name,
        data.cpf,
        String(data.quantity || 0),
        data.unitValue,
        data.totalValue,
        data.authorization || '',
        data.paused ? 'PAUSADO' : '',
        data.isEstagiario ? 'ESTAGIÁRIO' : '',
      ],
    });
  },

  /**
   * Adiciona novo funcionário na planilha VT
   */
  async appendVTRow(data) {
    const scriptUrl = CONFIG.SCRIPT_URL;
    return this.writeViaAppsScript(scriptUrl, {
      action: 'append',
      sheetName: 'Vale Transporte',
      values: [
        data.code,
        data.name,
        data.cpf,
        String(data.quantity || 0),
        data.unitValue,
        data.totalValue,
        data.authorization || '',
        data.paused ? 'PAUSADO' : '',
        data.isEstagiario ? 'ESTAGIÁRIO' : '',
      ],
    });
  },

  /**
   * Substitui todas as linhas de funcionários da planilha de uma única vez (Upload em Lote)
   * Ultra rápido: 1 única chamada HTTP (< 1 segundo)
   */
  async replaceAllRows(sheetName, rows) {
    const scriptUrl = CONFIG.SCRIPT_URL;
    const formattedRows = rows.map((r, i) => {
      if (Array.isArray(r)) return r;
      return [
        String(i + 1),
        r.name || '',
        r.cpf ? Utils.formatCPF(r.cpf) : '',
        String(r.quantity || 0),
        r.unitValue !== undefined ? Utils.formatBRNumber(r.unitValue) : '',
        r.totalValue !== undefined ? Utils.formatBRNumber(r.totalValue) : '',
        r.authorization || '',
        r.paused ? 'PAUSADO' : '',
        r.isEstagiario ? 'ESTAGIÁRIO' : '',
      ];
    });
    return this.writeViaAppsScript(scriptUrl, {
      action: 'replaceAll',
      sheetName: sheetName,
      rows: formattedRows,
    });
  },

  /**
   * Adiciona múltiplos funcionários de uma só vez na planilha
   */
  async batchAppendRows(sheetName, rows) {
    const scriptUrl = CONFIG.SCRIPT_URL;
    return this.writeViaAppsScript(scriptUrl, {
      action: 'batchAppend',
      sheetName: sheetName,
      rows: rows,
    });
  },

  /**
   * Remove funcionário individual (limpa linha)
   */
  async deleteVARow(rowIndex) {
    const scriptUrl = CONFIG.SCRIPT_URL;
    return this.writeViaAppsScript(scriptUrl, {
      action: 'delete',
      sheetName: 'Vale Alimentação',
      row: rowIndex,
    });
  },

  async deleteVTRow(rowIndex) {
    const scriptUrl = CONFIG.SCRIPT_URL;
    return this.writeViaAppsScript(scriptUrl, {
      action: 'delete',
      sheetName: 'Vale Transporte',
      row: rowIndex,
    });
  },

  /**
   * Remove funcionários em lote da planilha
   * Envia uma única requisição com a lista de linhas para o Apps Script
   */
  async batchDeleteRows(sheetName, rowIndexes, onProgress) {
    if (!rowIndexes || rowIndexes.length === 0) return;
    const scriptUrl = CONFIG.SCRIPT_URL;

    // Tenta primeiro a exclusão em lote de 1 única requisição
    try {
      await this.writeViaAppsScript(scriptUrl, {
        action: 'batchDelete',
        sheetName: sheetName,
        rows: rowIndexes,
      });
      if (onProgress) onProgress(rowIndexes.length, rowIndexes.length);
    } catch (err) {
      // Fallback sequencial se o Apps Script não tiver batchDelete
      const sorted = [...rowIndexes].sort((a, b) => b - a);
      for (let i = 0; i < sorted.length; i++) {
        await this.writeViaAppsScript(scriptUrl, {
          action: 'delete',
          sheetName,
          row: sorted[i],
        });
        if (onProgress) onProgress(i + 1, sorted.length);
      }
    }
  },

  /**
   * Atualiza período na planilha
   */
  async updateVAPeriod(periodStart, periodEnd, emissionDate) {
    const scriptUrl = CONFIG.SCRIPT_URL;
    return this.writeViaAppsScript(scriptUrl, {
      action: 'updatePeriod',
      sheetName: 'Vale Alimentação',
      periodStart,
      periodEnd,
      emissionDate,
    });
  },

  async updateVTPeriod(periodStart, periodEnd, emissionDate) {
    const scriptUrl = CONFIG.SCRIPT_URL;
    return this.writeViaAppsScript(scriptUrl, {
      action: 'updatePeriod',
      sheetName: 'Vale Transporte',
      periodStart,
      periodEnd,
      emissionDate,
    });
  },

  /**
   * Testa conexão com a API
   */
  async testConnection() {
    try {
      // Tenta ler uma célula da planilha
      await this.fetchSheet(CONFIG.SPREADSHEET_ID, `'Vale Alimentação'!A1`);
      return { success: true, message: 'Conexão estabelecida com sucesso!' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  },

  async loadAllData() {
    AppState.loading = true;

    try {
      const [vaResult, vtResult] = await Promise.all([
        this.fetchVA(),
        this.fetchVT()
      ]);

      AppState.vaHeader = vaResult.header;
      AppState.vaData = vaResult.employees.sort((a, b) => a.name.localeCompare(b.name));

      AppState.vtHeader = vtResult.header;
      AppState.vtData = vtResult.employees.sort((a, b) => a.name.localeCompare(b.name));
      AppState.connected = true;

      // Sincroniza período selecionado com o da planilha
      if (vaResult.header.periodStart) {
        const period = Utils.parsePeriodDate(vaResult.header.periodStart);
        AppState.config.selectedMonth = period.month;
        AppState.config.selectedYear = period.year;
      }

      // Duplicatas são filtradas em memória pelo parseSheetData
      // e sincronizadas em lote com a planilha para limpeza permanente
      if (vaResult.duplicates.length > 0) {
        console.log(`[Auto-Clean] ${vaResult.duplicates.length} duplicata(s) de VA detectada(s). Sincronizando versão limpa...`);
        this.replaceAllRows('Vale Alimentação', vaResult.employees).catch(e => console.warn('Erro ao limpar duplicatas de VA:', e));
      }
      if (vtResult.duplicates.length > 0) {
        console.log(`[Auto-Clean] ${vtResult.duplicates.length} duplicata(s) de VT detectada(s). Sincronizando versão limpa...`);
        this.replaceAllRows('Vale Transporte', vtResult.employees).catch(e => console.warn('Erro ao limpar duplicatas de VT:', e));
      }

      AppState.loading = false;
      return { va: vaResult, vt: vtResult };
    } catch (error) {
      console.error('Falha ao carregar dados do Google Sheets:', error);
      AppState.connected = false;
      AppState.loading = false;
      throw error;
    }
  },


};
