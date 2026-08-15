const CACHE_HEADERS = [
  "cache_key",
  "action",
  "vehicle_type",
  "brand_id",
  "model_id",
  "year_id",
  "reference",
  "response_json",
  "cached_at",
  "expires_at",
];

function jsonOutput(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function getCacheSheet() {
  const spreadsheetId = PropertiesService.getScriptProperties()
    .getProperty("FIPE_CACHE_SPREADSHEET_ID");
  if (!spreadsheetId) throw new Error("FIPE_CACHE_SPREADSHEET_ID não configurado");

  const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
  const sheet = spreadsheet.getSheets()[0];
  sheet.getRange(1, 1, 1, CACHE_HEADERS.length).setValues([CACHE_HEADERS]);
  sheet.setFrozenRows(1);
  return sheet;
}

function findCacheRow(sheet, cacheKey) {
  if (sheet.getLastRow() < 2) return null;
  const match = sheet
    .getRange(2, 1, sheet.getLastRow() - 1, 1)
    .createTextFinder(cacheKey)
    .matchEntireCell(true)
    .findNext();
  return match ? match.getRow() : null;
}

function handleGet(sheet, cacheKey) {
  const row = findCacheRow(sheet, cacheKey);
  if (!row) return { ok: true, hit: false };

  const values = sheet.getRange(row, 1, 1, CACHE_HEADERS.length).getValues()[0];
  const expiresAt = new Date(values[9]);
  if (!Number.isFinite(expiresAt.getTime()) || expiresAt.getTime() <= Date.now()) {
    return { ok: true, hit: false };
  }

  try {
    return { ok: true, hit: true, data: JSON.parse(String(values[7])) };
  } catch (_error) {
    return { ok: true, hit: false };
  }
}

function handlePut(sheet, request) {
  if (typeof request.response !== "object" || request.response === null) {
    throw new Error("Resposta inválida");
  }

  const now = new Date();
  const expiresAt = new Date(request.expiresAt);
  if (!Number.isFinite(expiresAt.getTime())) throw new Error("Validade inválida");

  const values = [[
    request.cacheKey,
    request.action || "",
    request.vehicleType || "",
    request.brandId || "",
    request.modelId || "",
    request.yearId || "",
    request.reference || "",
    JSON.stringify(request.response),
    now.toISOString(),
    expiresAt.toISOString(),
  ]];

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const row = findCacheRow(sheet, request.cacheKey) || sheet.getLastRow() + 1;
    sheet.getRange(row, 1, 1, CACHE_HEADERS.length).setValues(values);
  } finally {
    lock.releaseLock();
  }

  return { ok: true, stored: true };
}

function doPost(event) {
  try {
    const request = JSON.parse(event?.postData?.contents || "{}");
    const expectedSecret = PropertiesService.getScriptProperties()
      .getProperty("FIPE_CACHE_SECRET");

    if (!expectedSecret || request.secret !== expectedSecret) {
      return jsonOutput({ ok: false, error: "Não autorizado" });
    }
    if (typeof request.cacheKey !== "string" || request.cacheKey.length < 10) {
      return jsonOutput({ ok: false, error: "Chave de cache inválida" });
    }

    const sheet = getCacheSheet();
    if (request.operation === "get") return jsonOutput(handleGet(sheet, request.cacheKey));
    if (request.operation === "put") return jsonOutput(handlePut(sheet, request));
    return jsonOutput({ ok: false, error: "Operação inválida" });
  } catch (error) {
    console.error(error);
    return jsonOutput({ ok: false, error: "Falha interna no cache" });
  }
}
