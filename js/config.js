/* ===================================================
   CONFIG — Sistema VA/VT
   Configurações, constantes e utilitários globais
   =================================================== */

const CONFIG = {
  // ID da planilha unificada do Google Sheets (VA e VR)
  SPREADSHEET_ID: '1mgmWBM7DFDLkpwaITENCBfFGNa3--JwAEGqRL_hlYPs',

  // Google Sheets API v4 base URL
  SHEETS_API_BASE: 'https://sheets.googleapis.com/v4/spreadsheets',

  // Chaves da API e Scripts (Fixas no sistema)
  API_KEY: 'AIzaSyBEvDDwXWJCFLGDteO5OqSRFnsF03POmF0',
  SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbwyj_pEW4hFmyBG_6hZjgAtlGeeC8KpluKL4_eF1VoDpV77kP6oVVj0ueyJd1JU21I/exec',

  // Ranges da planilha (layout padrão)
  RANGES: {
    HEADER: 'A1:I5',         // Cabeçalho com dados da empresa
    COLUMNS: 'A8:I8',        // Nomes das colunas
    DATA: 'A9:I200',         // Dados dos funcionários
    PERIOD_START: 'E4',      // Data início do período
    PERIOD_END: 'G4',        // Data fim do período
    EMISSION_DATE: 'B5',     // Data de emissão
    FULL: 'A1:I200',         // Tudo de uma vez
  },

  // Dados da empresa
  COMPANY: {
    name: 'Imobiliária Santamérica',
    cnpj: '04.238.745/0001-44',
    city: 'Londrina',
    phone: '(43) 3374-5600',
    address: 'Av. Higienópolis, 1200',
  },

  // Meses do ano em português
  MONTHS: [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ],

  // Valores padrão
  DEFAULTS: {
    VA_UNIT_VALUE: 23.33,
    VA_QUANTITY: 30,
    VT_UNIT_VALUE: 6.25,
    VT_CAMBE_UNIT_VALUE: 6.50,
    VT_QUANTITY: 50,
  },
};

/* ===================================================
   ÍCONES SVG
   =================================================== */
const ICONS = {
  dashboard: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>`,
  food: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8h1a4 4 0 010 8h-1"/><path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>`,
  bus: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6v6"/><path d="M16 6v6"/><path d="M2 12h20"/><path d="M6 18h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v10a2 2 0 002 2z"/><circle cx="7" cy="15" r="1"/><circle cx="17" cy="15" r="1"/><path d="M5 18v2"/><path d="M19 18v2"/></svg>`,
  users: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>`,
  settings: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg>`,
  search: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`,
  plus: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
  edit: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
  trash: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>`,
  sync: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>`,
  check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
  x: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
  alert: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
  calendar: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
  moon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>`,
  sun: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`,
  dollar: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>`,
  download: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`,
  filter: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>`,
  info: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`,
  key: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>`,
  link: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>`,
  save: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>`,
  play: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>`,
  pause: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>`,
  farmacia: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.5 2h3a1 1 0 011 1v5.5H20a1 1 0 011 1v3a1 1 0 01-1 1h-5.5V19a1 1 0 01-1 1h-3a1 1 0 01-1-1v-5.5H3a1 1 0 01-1-1v-3a1 1 0 011-1h5.5V3a1 1 0 011-1z"/></svg>`,
  reset: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>`,
};

/* ===================================================
   UTILITÁRIOS GLOBAIS
   =================================================== */
const Utils = {
  /**
   * Formata número para moeda brasileira
   */
  formatCurrency(value) {
    const val = Number(value) || 0;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val);
  },

  /**
   * Formata número brasileiro (com vírgula decimal) para float
   */
  parseBRNumber(str) {
    if (typeof str === 'number') return str;
    if (!str || str === '') return 0;
    // Remove tudo que não for dígito, vírgula, ponto ou sinal de menos
    const cleanStr = str.toString().replace(/[^\d,.-]/g, '');
    if (cleanStr.includes(',')) {
      // Formato brasileiro: remove pontos de milhar, substitui vírgula decimal por ponto
      return parseFloat(cleanStr.replace(/\./g, '').replace(',', '.'));
    }
    return parseFloat(cleanStr);
  },

  /**
   * Formata float para número brasileiro
   */
  formatBRNumber(num, decimals = 2) {
    const val = Number(num) || 0;
    return val.toLocaleString('pt-BR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  },

  /**
   * Limpa formatação do CPF e garante 11 dígitos se omitir zero à esquerda
   */
  cleanCPF(cpf) {
    if (!cpf) return '';
    let clean = String(cpf).replace(/\D/g, '');
    if (clean.length === 10) clean = '0' + clean;
    return clean;
  },

  /**
   * Formata CPF
   */
  formatCPF(cpf) {
    if (!cpf) return '';
    const clean = this.cleanCPF(cpf);
    if (clean.length !== 11) return cpf;
    return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  },

  /**
   * Aplica máscara de CPF em um input ao digitar
   */
  applyCPFMask(input) {
    input.addEventListener('input', function () {
      let v = this.value.replace(/\D/g, '').slice(0, 11);
      if (v.length > 9) {
        v = v.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, '$1.$2.$3-$4');
      } else if (v.length > 6) {
        v = v.replace(/(\d{3})(\d{3})(\d{1,3})/, '$1.$2.$3');
      } else if (v.length > 3) {
        v = v.replace(/(\d{3})(\d{1,3})/, '$1.$2');
      }
      this.value = v;
    });
  },


  /**
   * Valida CPF
   */
  isValidCPF(cpf) {
    const clean = cpf.replace(/\D/g, '');
    if (clean.length !== 11) return false;
    if (/^(\d)\1+$/.test(clean)) return false;
    let sum = 0;
    for (let i = 0; i < 9; i++) sum += parseInt(clean[i]) * (10 - i);
    let check = 11 - (sum % 11);
    if (check >= 10) check = 0;
    if (parseInt(clean[9]) !== check) return false;
    sum = 0;
    for (let i = 0; i < 10; i++) sum += parseInt(clean[i]) * (11 - i);
    check = 11 - (sum % 11);
    if (check >= 10) check = 0;
    return parseInt(clean[10]) === check;
  },

  /**
   * Obtém iniciais do nome (até 2 letras)
   */
  getInitials(name) {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  },

  /**
   * Gera cor de avatar baseada no nome
   */
  getAvatarGradient(name) {
    const gradients = [
      'linear-gradient(135deg, #6366f1, #818cf8)',
      'linear-gradient(135deg, #059669, #34d399)',
      'linear-gradient(135deg, #2563eb, #60a5fa)',
      'linear-gradient(135deg, #d946ef, #f0abfc)',
      'linear-gradient(135deg, #f59e0b, #fcd34d)',
      'linear-gradient(135deg, #ef4444, #fca5a5)',
      'linear-gradient(135deg, #06b6d4, #67e8f9)',
      'linear-gradient(135deg, #8b5cf6, #c4b5fd)',
    ];
    let hash = 0;
    for (let i = 0; i < (name || '').length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return gradients[Math.abs(hash) % gradients.length];
  },

  /**
   * Obtém o mês e ano a partir de uma string de data brasileira
   */
  parsePeriodDate(dateStr) {
    if (!dateStr) return { month: new Date().getMonth(), year: new Date().getFullYear() };
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      return { month: parseInt(parts[1]) - 1, year: parseInt(parts[2]) };
    }
    return { month: new Date().getMonth(), year: new Date().getFullYear() };
  },

  /**
   * Formata data para o formato dd/mm/yyyy
   */
  formatDate(month, year) {
    const lastDay = new Date(year, month + 1, 0).getDate();
    const mm = String(month + 1).padStart(2, '0');
    return {
      start: `01/${mm}/${year}`,
      end: `${lastDay}/${mm}/${year}`,
    };
  },

  /**
   * Gera texto de data de emissão
   */
  formatEmissionDate(month, year) {
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    return `Londrina, 20 de ${CONFIG.MONTHS[prevMonth].toLowerCase()} de ${prevYear}`;
  },

  /**
   * Debounce
   */
  debounce(fn, delay = 300) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  },

  /**
   * Escapa HTML
   */
  escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },
};

/* ===================================================
   ESTADO GLOBAL DA APLICAÇÃO
   =================================================== */
const AppState = {
  // Dados das planilhas
  vaData: [],
  vtData: [],
  vaHeader: {},
  vtHeader: {},

  // Estado da UI
  currentPage: 'dashboard',
  loading: false,
  connected: false,



  // Configurações (salvas em localStorage)
  config: {
    apiKey: '',
    spreadsheetId: '',
    scriptUrl: '',
    theme: 'dark',
    selectedMonth: new Date().getMonth(),
    selectedYear: new Date().getFullYear(),
    vaUnitValue: '',
    vtLondrinaUnitValue: '',
    vtCambeUnitValue: '',
    vaQuantity: '',
    vtQuantity: '',
  },

  _extractId(urlOrId) {
    if (!urlOrId) return '';
    let str = urlOrId.trim();
    // Se for URL completa
    const match = str.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (match) return match[1];
    // Se colou o ID mas puxou o /edit junto (ex: 1mgmWBM7DF.../edit?gid=0)
    const editMatch = str.match(/^([a-zA-Z0-9-_]+)\/edit/);
    if (editMatch) return editMatch[1];
    return str;
  },

  // Carrega configurações do localStorage
  loadConfig() {
    const saved = localStorage.getItem('va_vt_config');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        Object.assign(this.config, parsed);
      } catch (e) {
        console.error('Erro ao carregar configurações:', e);
      }
    }

    // Inicializa valores padrões caso estejam vazios
    if (!this.config.apiKey) {
      this.config.apiKey = CONFIG.API_KEY;
    }
    if (!this.config.spreadsheetId) {
      this.config.spreadsheetId = CONFIG.SPREADSHEET_ID;
    }
    if (!this.config.scriptUrl) {
      this.config.scriptUrl = CONFIG.SCRIPT_URL;
    }

    if (!this.config.vaUnitValue) {
      this.config.vaUnitValue = CONFIG.DEFAULTS.VA_UNIT_VALUE;
    }
    if (!this.config.vtLondrinaUnitValue) {
      this.config.vtLondrinaUnitValue = CONFIG.DEFAULTS.VT_UNIT_VALUE;
    }
    if (!this.config.vtCambeUnitValue) {
      this.config.vtCambeUnitValue = CONFIG.DEFAULTS.VT_CAMBE_UNIT_VALUE;
    }
    if (!this.config.vaQuantity) {
      this.config.vaQuantity = CONFIG.DEFAULTS.VA_QUANTITY;
    }
    if (!this.config.vtQuantity) {
      this.config.vtQuantity = CONFIG.DEFAULTS.VT_QUANTITY;
    }

    // Sincroniza com as constantes globais do CONFIG
    CONFIG.API_KEY = this.config.apiKey;
    CONFIG.SPREADSHEET_ID = this._extractId(this.config.spreadsheetId);
    if (this.config.scriptUrl) CONFIG.SCRIPT_URL = this.config.scriptUrl;

    CONFIG.DEFAULTS.VA_UNIT_VALUE = parseFloat(this.config.vaUnitValue);
    CONFIG.DEFAULTS.VT_UNIT_VALUE = parseFloat(this.config.vtLondrinaUnitValue);
    CONFIG.DEFAULTS.VT_CAMBE_UNIT_VALUE = parseFloat(this.config.vtCambeUnitValue);
    CONFIG.DEFAULTS.VA_QUANTITY = parseInt(this.config.vaQuantity);
    CONFIG.DEFAULTS.VT_QUANTITY = parseInt(this.config.vtQuantity);
  },

  // Salva configurações no localStorage
  saveConfig() {
    localStorage.setItem('va_vt_config', JSON.stringify(this.config));

    // Sincroniza com as constantes globais do CONFIG
    CONFIG.API_KEY = this.config.apiKey;
    CONFIG.SPREADSHEET_ID = this._extractId(this.config.spreadsheetId);
    if (this.config.scriptUrl) CONFIG.SCRIPT_URL = this.config.scriptUrl;

    CONFIG.DEFAULTS.VA_UNIT_VALUE = parseFloat(this.config.vaUnitValue);
    CONFIG.DEFAULTS.VT_UNIT_VALUE = parseFloat(this.config.vtLondrinaUnitValue);
    CONFIG.DEFAULTS.VT_CAMBE_UNIT_VALUE = parseFloat(this.config.vtCambeUnitValue);
    CONFIG.DEFAULTS.VA_QUANTITY = parseInt(this.config.vaQuantity);
    CONFIG.DEFAULTS.VT_QUANTITY = parseInt(this.config.vtQuantity);
  },

  // Verifica se o sistema está configurado
  isConfigured() {
    return !!(this.config.apiKey);
  },
};
