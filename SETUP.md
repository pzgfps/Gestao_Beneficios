# 🔧 Guia de Configuração — Sistema VA/VT

## Pré-requisitos
- Conta Google com acesso às planilhas de VA e VT
- Navegador moderno (Chrome, Firefox, Edge)

---

## 1️⃣ Criar Projeto no Google Cloud

1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Clique em **"Selecionar projeto"** → **"Novo Projeto"**
3. Nome: `VA-VT-Santamerica` (ou qualquer nome)
4. Clique em **"Criar"**

## 2️⃣ Ativar Google Sheets API

1. No painel lateral, vá em **"APIs e serviços"** → **"Biblioteca"**
2. Pesquise por **"Google Sheets API"**
3. Clique em **"Ativar"**

## 3️⃣ Gerar API Key

1. Vá em **"APIs e serviços"** → **"Credenciais"**
2. Clique em **"+ Criar credenciais"** → **"Chave de API"**
3. Copie a chave gerada (formato: `AIzaSy...`)
4. **Importante:** Clique em **"Restringir chave"** e adicione:
   - **Restrição de API:** Selecione apenas **Google Sheets API**

## 4️⃣ Configurar Apps Script (para operações de escrita)

> ⚠️ Este passo é necessário apenas se você quiser adicionar, editar ou remover funcionários pelo sistema.

### Para cada planilha (VA e VT):

1. Abra a planilha no Google Sheets
2. Vá em **Extensões** → **Apps Script**
3. Apague todo o conteúdo e cole o seguinte código:

```javascript
function doPost(e) {
  try {
    var payload = JSON.parse(e.postData.contents);
    var sheetName = payload.sheetName;
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = sheetName ? spreadsheet.getSheetByName(sheetName) : spreadsheet.getActiveSheet();
    
    if (!sheet) {
      return ContentService.createTextOutput(JSON.stringify({ success: false, error: 'Aba não encontrada: ' + sheetName }))
                           .setMimeType(ContentService.MimeType.JSON);
    }
    
    var action = payload.action;
    var startRow = 9;
    
    // 1. SUBSTITUIÇÃO TOTAL EM LOTE (Upload de Planilha instantâneo: < 1s)
    if (action === 'replaceAll' || action === 'syncAll' || action === 'syncSheet') {
      var allRows = payload.rows;
      var maxRows = sheet.getMaxRows();
      
      if (maxRows >= startRow) {
        sheet.getRange(startRow, 1, maxRows - startRow + 1, 8).clearContent();
      }
      
      if (allRows && allRows.length > 0) {
        var neededRows = (startRow - 1) + allRows.length;
        if (neededRows > sheet.getMaxRows()) {
          sheet.insertRowsAfter(sheet.getMaxRows(), neededRows - sheet.getMaxRows());
        }
        sheet.getRange(startRow, 1, allRows.length, allRows[0].length).setValues(allRows);
      }
      
    // 2. ADIÇÃO INDIVIDUAL OU EM LOTE
    } else if (action === 'append' || action === 'batchAppend') {
      var rawValues = payload.rows || payload.values;
      var allRows = (rawValues && rawValues.length > 0 && Array.isArray(rawValues[0])) 
        ? rawValues 
        : (rawValues ? [rawValues] : []);
        
      if (allRows.length > 0) {
        var maxRows = sheet.getMaxRows();
        var insertRow = startRow;
        
        if (maxRows >= startRow) {
          var rangeData = sheet.getRange(startRow, 2, maxRows - startRow + 1, 2).getValues();
          for (var i = 0; i < rangeData.length; i++) {
            var nome = rangeData[i][0] ? rangeData[i][0].toString().trim() : "";
            var cpf = rangeData[i][1] ? rangeData[i][1].toString().trim() : "";
            if (nome === "" && cpf === "") {
               break;
            }
            insertRow++;
          }
        }
        
        var neededRows = (insertRow - 1) + allRows.length;
        if (neededRows > sheet.getMaxRows()) {
          sheet.insertRowsAfter(sheet.getMaxRows(), neededRows - sheet.getMaxRows());
        }
        
        sheet.getRange(insertRow, 1, allRows.length, allRows[0].length).setValues(allRows);
      }
      
    // 3. ATUALIZAÇÃO
    } else if (action === 'update') {
      var row = payload.row;
      var values = payload.values;
      var range = sheet.getRange(row, 1, 1, values.length);
      range.setValues([values]);
      
    } else if (action === 'updateRange') {
      sheet.getRange(payload.range).setValues([payload.values]);
      
    // 4. EXCLUSÃO INDIVIDUAL OU EM LOTE
    } else if (action === 'delete' || action === 'batchDelete') {
      var rowsToDelete = payload.rows || (payload.row ? [payload.row] : []);
      if (rowsToDelete && rowsToDelete.length > 0) {
        for (var d = 0; d < rowsToDelete.length; d++) {
          sheet.getRange(rowsToDelete[d], 1, 1, 8).clearContent();
        }
      }
      
    // 5. ATUALIZAÇÃO DO CABEÇALHO / PERÍODO
    } else if (action === 'updatePeriod') {
      sheet.getRange("E4").setValue(payload.periodStart);
      sheet.getRange("G4").setValue(payload.periodEnd);
      sheet.getRange("B5").setValue(payload.emissionDate);
    }
    
    return ContentService.createTextOutput(JSON.stringify({ success: true }))
                         .setMimeType(ContentService.MimeType.JSON);
                         
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
                         .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput(
    JSON.stringify({status: 'ok'})
  ).setMimeType(ContentService.MimeType.JSON);
}
```

4. Clique em **"Implantar"** → **"Nova implantação"**
5. Em **Tipo**, selecione **"App da Web"**
6. Configure:
   - **Descrição:** `VA-VT API`
   - **Executar como:** `Eu`
   - **Quem tem acesso:** `Qualquer pessoa`
7. Clique em **"Implantar"**
8. Autorize quando solicitado
9. Copie a **URL da implantação** (formato: `https://script.google.com/macros/s/.../exec`)

### Repita o processo para a outra planilha.

## 5️⃣ Inserir as Configurações no Sistema

1. Abra o `index.html` no navegador
2. Vá em **Configurações** (ícone de engrenagem no menu lateral)
3. Cole:
   - **API Key** no campo correspondente
   - **URL do Apps Script VA** 
   - **URL do Apps Script VT**
4. Clique em **"Testar Conexão"** para verificar
5. Clique em **"Salvar Configurações"**

## ✅ Pronto!

O sistema agora está conectado às suas planilhas e pode:
- 📊 Visualizar dados no Dashboard
- 🍽️ Gerenciar Vale Alimentação
- 🚌 Gerenciar Vale Transporte
- 👥 Ver visão consolidada de funcionários
- ✏️ Adicionar, editar e remover funcionários (com Apps Script)
- 📅 Trocar período de referência

---

## 🔍 Solução de Problemas

| Problema | Solução |
|----------|---------|
| Erro 401/403 na API | Verifique se a API Key está correta e as planilhas estão compartilhadas como "Qualquer pessoa com o link pode ver" |
| Não consigo editar | Configure o Apps Script conforme passo 4 |
| Dados não atualizam | Clique no botão "Sincronizar" no topo |
| API Key inválida | Verifique se a Google Sheets API está ativada no projeto |
