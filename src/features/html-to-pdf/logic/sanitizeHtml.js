/**
 * Sanitize untrusted HTML to prevent script execution, tracking, and external network leaks
 * Preserves standard document markup, inline styles, tables, and inline data URIs.
 * @param {string} html
 * @returns {string}
 */
export function sanitizeHtml(html) {
  if (!html || typeof html !== 'string') {
    return '';
  }

  return html
    // 1. Remove entire <script>...</script> blocks
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script\s*>/gi, '')
    // 2. Remove iframes, objects, embeds, applets
    .replace(/<(iframe|object|embed|applet)\b[^<]*(?:(?!<\/\1>)<[^<]*)*<\/\1\s*>/gi, '')
    // 3. Remove inline on* event handlers (e.g. onclick="...", onload=...)
    .replace(/\s+on[a-z0-9_-]+\s*=\s*(['"][^'"]*['"]|[^\s>]+)/gi, '')
    // 4. Neutralize javascript: pseudo-protocol in links
    .replace(/href\s*=\s*(['"])javascript:[^'"]*\1/gi, 'href="#"')
    // 5. Neutralize external HTTP/HTTPS resources in src attributes to keep 100% offline
    .replace(/src\s*=\s*(['"])(?:https?:|\/\/)[^'"]*\1/gi, 'src=""')
    // 6. Neutralize external url(...) in style attributes
    .replace(/url\s*\(\s*(['"]?)(?:https?:|\/\/)[^'")\s]*\1\s*\)/gi, 'none');
}
