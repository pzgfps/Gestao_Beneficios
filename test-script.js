

async function testAppsScript() {
  const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwyj_pEW4hFmyBG_6hZjgAtlGeeC8KpluKL4_eF1VoDpV77kP6oVVj0ueyJd1JU21I/exec';
  
  // Teste 1: Passar um ID inválido para ver se ele tenta usar openById (se atualizou o script)
  const payload = {
    action: 'append',
    sheetName: 'Vale Alimentação',
    spreadsheetId: '1mgmWBM7DFDLkpwaITENCBfFGNa3--JwAEGqRL_hlYPs',
    values: [ "999", "TESTE NODEJS 2", "123", "30", 20, 600, "", "" ]
  };

  try {
    const res = await fetch(SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(payload)
    });
    
    const json = await res.json();
    console.log("Resposta do POST:", json);
    
    console.log("Lendo dados via GET imediatamente...");
    const url = `https://sheets.googleapis.com/v4/spreadsheets/1mgmWBM7DFDLkpwaITENCBfFGNa3--JwAEGqRL_hlYPs/values/'Vale Alimentação'!A1:H200?key=AIzaSyBEvDDwXWJCFLGDteO5OqSRFnsF03POmF0&valueRenderOption=FORMATTED_VALUE`;
    const getRes = await fetch(url, { cache: 'no-store' });
    const getData = await getRes.json();
    const rows = getData.values || [];
    console.log(`Linhas encontradas: ${rows.length}`);
    const lastRow = rows[rows.length - 1];
    console.log("Última linha:", lastRow);
  } catch(e) {
    console.error("Erro:", e);
  }
}

testAppsScript();
