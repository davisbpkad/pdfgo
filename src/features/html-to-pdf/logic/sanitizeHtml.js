/**
 * Sanitize untrusted HTML with an allowlist (fail closed).
 * Only allowlisted tags and attributes survive; everything else is dropped.
 * Unknown or unparsable markup is discarded, never re-emitted.
 * Runs in the browser and in Node (no DOMParser required).
 */

const ALLOWED_TAGS = new Set([
  'div', 'span', 'p', 'br', 'hr',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li',
  'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td',
  'a', 'img',
  'strong', 'em', 'b', 'i', 'u', 's', 'sub', 'sup',
  'blockquote', 'pre', 'code', 'style',
  'figure', 'figcaption'
]);

// Elements removed together with their content.
const DROP_WITH_CONTENT = new Set([
  'script', 'iframe', 'object', 'embed', 'applet', 'noscript',
  'template', 'svg', 'math', 'title', 'textarea', 'frame', 'frameset'
]);

const ALLOWED_ATTRS = new Set([
  'style', 'colspan', 'rowspan', 'alt', 'width', 'height', 'src', 'href',
  // Presentational attributes pasted HTML still uses; they cannot execute anything.
  'align', 'valign', 'bgcolor', 'border', 'cellpadding', 'cellspacing', 'title', 'dir'
]);

const URL_ATTRS = new Set(['src', 'href']);

const SAFE_URL = /^data:/i;

const TAG_RE = /^<\s*\/?\s*([a-zA-Z][a-zA-Z0-9:-]*)/;
const ATTR_RE = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)(?:\s*=\s*("([^"]*)"|'([^']*)'|([^\s"'`=<>]+)))?/g;

/** Neutralize external url() and @import in a CSS string, keep data: URIs. */
function scrubCss(value) {
  return String(value)
    .replace(/@import[^;]*;?/gi, '')
    .replace(/url\s*\(\s*(['"]?)([^)'"]*)\1\s*\)/gi, (match, _quote, url) =>
      SAFE_URL.test(String(url).trim()) ? match : 'none'
    );
}

/** Attribute values are always re-emitted quoted, so escaping quotes is enough. */
function escapeAttrValue(value) {
  return String(value).replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function parseAttributes(body) {
  const attrs = [];
  ATTR_RE.lastIndex = 0;
  let match;
  while ((match = ATTR_RE.exec(body)) !== null) {
    if (match[0].length === 0) {
      ATTR_RE.lastIndex++;
      continue;
    }
    attrs.push({
      name: match[1].toLowerCase(),
      value: match[3] !== undefined ? match[3] : match[4] !== undefined ? match[4] : match[5] || ''
    });
  }
  return attrs;
}

function renderAttributes(attrs) {
  let out = '';
  for (const { name, value } of attrs) {
    if (!ALLOWED_ATTRS.has(name)) continue;

    let safeValue = value;
    if (URL_ATTRS.has(name)) {
      safeValue = SAFE_URL.test(value.trim()) ? value : name === 'src' ? '' : '#';
    } else if (name === 'style') {
      safeValue = scrubCss(value);
    }

    out += ` ${name}="${escapeAttrValue(safeValue)}"`;
  }
  return out;
}

/**
 * @param {string} html
 * @returns {string}
 */
export function sanitizeHtml(html) {
  if (!html || typeof html !== 'string') {
    return '';
  }

  // Comments and declarations are dropped up front: they cannot carry safe markup.
  const source = html.replace(/<!--[\s\S]*?-->/g, '').replace(/<[!?][^>]*>/g, '');

  const parts = source.split(/(<[^>]*>)/);
  let out = '';
  let dropDepth = 0;
  let dropTag = '';
  let inStyle = false;

  for (const part of parts) {
    if (part === '') continue;

    if (!part.startsWith('<')) {
      if (dropDepth > 0) continue;
      out += inStyle ? scrubCss(part) : part;
      continue;
    }

    const nameMatch = TAG_RE.exec(part);
    if (!nameMatch) continue; // unparsable tag: dropped

    const tagName = nameMatch[1].toLowerCase();
    const isClosing = /^<\s*\//.test(part);

    if (dropDepth > 0) {
      if (tagName === dropTag) dropDepth += isClosing ? -1 : 1;
      continue;
    }

    if (DROP_WITH_CONTENT.has(tagName)) {
      if (!isClosing) {
        dropDepth = 1;
        dropTag = tagName;
      }
      continue;
    }

    if (isClosing) {
      if (ALLOWED_TAGS.has(tagName)) {
        out += `</${tagName}>`;
        if (tagName === 'style') inStyle = false;
      }
      continue;
    }

    if (!ALLOWED_TAGS.has(tagName)) continue; // drop the tag, keep its text children

    if (tagName === 'style') inStyle = true;

    const body = part.replace(/^<\s*[a-zA-Z][a-zA-Z0-9:-]*/, '');
    out += `<${tagName}${renderAttributes(parseAttributes(body))}>`;
  }

  return out;
}
