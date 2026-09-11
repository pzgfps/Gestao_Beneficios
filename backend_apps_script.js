/**
 * Script do Google Apps Script para atuar como Backend (Proxy) de Alto Desempenho do Sistema RH
 * 
 * INSTRUÇÕES DE INSTALAÇÃO / ATUALIZAÇÃO:
 * 1. Abra sua Planilha Unificada (ou planilhas de VA e VT).
 * 2. No menu superior, vá em "Extensões" > "Apps Script".
 * 3. Apague o código que estiver lá e cole todo este código atualizado.
 * 4. Clique em "Implantar" > "Gerenciar implantações" > clique no ícone de lápis (Editar) > selecione "Nova versão" > "Implantar".
 *    (Ou "Nova implantação" > Tipo "App da Web" > Executar como "Eu" > Quem tem acesso "Qualquer pessoa" > "Implantar").
 * 5. Copie o link gerado e garanta que está configurado em Configurações no Sistema RH.
 */

function doPost(e) {
  try {
    var payload = JSON.parse(e.postData.contents);
    var sheetName = payload.sheetName;
    
    // Suporte para rodar como script solto usando o ID fornecido no payload
    var spreadsheet;
    if (payload.spreadsheetId) {
      spreadsheet = SpreadsheetApp.openById(payload.spreadsheetId);
    } else {
      spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    }
    
    var sheet = sheetName ? spreadsheet.getSheetByName(sheetName) : spreadsheet.getActiveSheet();

    if (!sheet) {
      return ContentService.createTextOutput(JSON.stringify({ success: false, error: 'Aba não encontrada: ' + sheetName }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    var action = payload.action;
    var startRow = 9;

    // 1. SUBSTITUIÇÃO TOTAL EM LOTE (Usado no Upload de Planilha - ULTRA RÁPIDO: < 1 segundo)
    if (action === 'replaceAll' || action === 'syncAll' || action === 'syncSheet') {
      var allRows = payload.rows; // Array 2D: [[código, nome, cpf, qtd, unit, total, auth, paused], ...]
      var maxRows = sheet.getMaxRows();

      // Limpa dados anteriores a partir da linha 9 até a última linha
      if (maxRows >= startRow) {
        sheet.getRange(startRow, 1, maxRows - startRow + 1, 9).clearContent();
      }

      // Insere todas as linhas de uma única vez em lote
      if (allRows && allRows.length > 0) {
        var neededRows = (startRow - 1) + allRows.length;
        if (neededRows > sheet.getMaxRows()) {
          sheet.insertRowsAfter(sheet.getMaxRows(), neededRows - sheet.getMaxRows());
        }
        sheet.getRange(startRow, 1, allRows.length, allRows[0].length).setValues(allRows);
      }

      // 2. ADIÇÃO INDIVIDUAL OU EM LOTE (append / batchAppend)
    } else if (action === 'append' || action === 'batchAppend') {
      var rawValues = payload.rows || payload.values;
      var allRows = (rawValues && rawValues.length > 0 && Array.isArray(rawValues[0]))
        ? rawValues
        : (rawValues ? [rawValues] : []);

      if (allRows.length > 0) {
        var maxRows = sheet.getMaxRows();
        var insertRow = startRow;

        // Procura a primeira linha vazia a partir da linha 9
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

      // 3. ATUALIZAÇÃO DE UMA LINHA OU INTERVALO ESPECÍFICO
    } else if (action === 'update') {
      var row = payload.row;
      var values = payload.values;
      var range = sheet.getRange(row, 1, 1, values.length);
      range.setValues([values]);

    } else if (action === 'updateRange') {
      var targetRange = payload.range; // Ex: 'D10:F10'
      var values = payload.values;
      sheet.getRange(targetRange).setValues([values]);

      // 4. EXCLUSÃO INDIVIDUAL OU EM LOTE (batchDelete)
    } else if (action === 'delete' || action === 'batchDelete') {
      var rowsToDelete = payload.rows || (payload.row ? [payload.row] : []);
      if (rowsToDelete && rowsToDelete.length > 0) {
        var ranges = [];
        for (var d = 0; d < rowsToDelete.length; d++) {
          ranges.push("A" + rowsToDelete[d] + ":I" + rowsToDelete[d]);
        }
        if (ranges.length > 0) {
          sheet.getRangeList(ranges).clearContent();
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

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput(
    JSON.stringify({ status: 'ok', message: 'Apps Script RH Backend Online' })
  ).setMimeType(ContentService.MimeType.JSON);
}
