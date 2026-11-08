// A deliberately tiny, safe Markdown subset for text fields edited in the admin.
// Supported: paragraphs, line breaks, "- " lists, "## " / "### " headings, **bold**, *italic*, [links](https://...).
// Text is escaped before any formatting is applied, so raw HTML in the input is always shown as text.
// `base` is put in front of site links such as [pogoji](/pogoji/), so they work on any address.

import { esc, safeUrl } from './util.mjs';

function emphasis(escaped) {
  return escaped
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>');
}

export function inline(text, { base = '' } = {}) {
  const source = String(text ?? '');
  const linkPattern = /\[([^\]]+)\]\(([^)\s]+)\)/g;
  let out = '';
  let last = 0;
  for (const match of source.matchAll(linkPattern)) {
    out += emphasis(esc(source.slice(last, match.index)));
    let href = safeUrl(match[2]);
    const label = emphasis(esc(match[1]));
    if (href.startsWith('/')) href = base + href;
    if (href) {
      const external = /^https?:/.test(href);
      out += `<a href="${esc(href)}"${external ? ' rel="noopener" target="_blank"' : ''}>${label}</a>`;
    } else {
      out += label;
    }
    last = match.index + match[0].length;
  }
  out += emphasis(esc(source.slice(last)));
  return out;
}

export function markdown(text, opts = {}) {
  const blocks = String(text ?? '')
    .replace(/\r\n?/g, '\n')
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean);

  return blocks
    .map((block) => {
      const lines = block.split('\n');
      if (lines.every((l) => /^\s*[-*]\s+/.test(l))) {
        return `<ul>${lines.map((l) => `<li>${inline(l.replace(/^\s*[-*]\s+/, ''), opts)}</li>`).join('')}</ul>`;
      }
      if (lines.length === 1 && /^###\s+/.test(block)) return `<h4>${inline(block.replace(/^###\s+/, ''), opts)}</h4>`;
      if (lines.length === 1 && /^##?\s+/.test(block)) return `<h3>${inline(block.replace(/^##?\s+/, ''), opts)}</h3>`;
      return `<p>${lines.map((l) => inline(l, opts)).join('<br>')}</p>`;
    })
    .join('\n');
}

/** Markdown-ish text as a plain one-line description. */
export function plain(text, max = 200) {
  const out = String(text ?? '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[*_`#>]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return out.length > max ? `${out.slice(0, max - 1).trimEnd()}…` : out;
}
