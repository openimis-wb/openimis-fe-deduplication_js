// Pure helpers for building GraphQL query fragments and reading server values.
// No imports: the module loads under `node --test` as well as in the bundle.

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function isEmptyValue(value) {
  return value === null || value === undefined || value === '';
}

// A GraphQL string literal; JSON escaping is valid GraphQL escaping.
export function gqlString(value) {
  return JSON.stringify(String(value));
}

export function stringArg(name, value) {
  if (isEmptyValue(value)) return null;
  return `${name}: ${gqlString(value)}`;
}

// Date-only values widen to the start (gte) or the end (lte) of that day,
// because the filtered columns are DateTime.
export function dateTimeArg(name, value, bound) {
  if (isEmptyValue(value)) return null;
  const text = String(value);
  if (!ISO_DATE_PATTERN.test(text)) return stringArg(name, text);
  return stringArg(name, bound === 'lte' ? `${text}T23:59:59.999999` : `${text}T00:00:00`);
}

export function hasRight(rights, code) {
  if (!Array.isArray(rights) || isEmptyValue(code)) return false;
  const wanted = String(code);
  return rights.some((right) => String(right) === wanted);
}

export function hasAnyRight(rights, codes) {
  return (Array.isArray(codes) ? codes : [codes]).some((code) => hasRight(rights, code));
}

export function isUuid(value) {
  return typeof value === 'string' && UUID_PATTERN.test(value);
}

// The raw UUID behind a relay global id ("Type:uuid" in base64), or the value
// itself when it already is a UUID. Null for anything else.
export function toUuid(id) {
  if (isEmptyValue(id)) return null;
  const text = String(id);
  if (isUuid(text)) return text;
  try {
    const decoded = atob(text);
    const raw = decoded.slice(decoded.indexOf(':') + 1);
    return isUuid(raw) ? raw : null;
  } catch {
    return null;
  }
}

// JSONString fields arrive as text; some callers already hold the parsed value.
export function parseJson(value) {
  if (value === null || value === undefined) return null;
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

export function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

// Appends `tiebreak` to the `orderBy: [...]` fragment of a Searcher parameter
// list so that offset and cursor pages stay stable when the sort key ties.
export function withStableOrder(params, tiebreak = 'id') {
  if (!Array.isArray(params)) return params;
  return params.map((param) => {
    const match = typeof param === 'string' ? param.match(/^\s*orderBy:\s*\[(.*)\]\s*$/s) : null;
    if (!match) return param;
    let keys;
    try {
      keys = JSON.parse(`[${match[1]}]`);
    } catch {
      return param;
    }
    if (keys.some((key) => String(key).replace(/^-/, '') === tiebreak)) return param;
    return `orderBy: ${JSON.stringify([...keys, tiebreak])}`;
  });
}

// The translated message for `key` when the catalogue holds it, otherwise the raw code.
export function labelOr(messages, key, raw) {
  if (messages && typeof messages[key] === 'string' && messages[key] !== '') return messages[key];
  return raw;
}
