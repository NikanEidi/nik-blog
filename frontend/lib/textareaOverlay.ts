export type OverlayRect = { left: number; top: number; width: number; height: number };

const MIRRORED_PROPS = [
  'fontFamily',
  'fontSize',
  'fontWeight',
  'fontStyle',
  'letterSpacing',
  'lineHeight',
  'textTransform',
  'wordSpacing',
  'tabSize',
  'paddingTop',
  'paddingRight',
  'paddingBottom',
  'paddingLeft',
  'borderTopWidth',
  'borderRightWidth',
  'borderBottomWidth',
  'borderLeftWidth',
  'boxSizing',
] as const;

let mirrorEl: HTMLDivElement | null = null;

function getMirror(): HTMLDivElement {
  if (mirrorEl) return mirrorEl;
  const el = document.createElement('div');
  el.style.position = 'absolute';
  el.style.visibility = 'hidden';
  el.style.top = '0';
  el.style.left = '-9999px';
  el.style.whiteSpace = 'pre-wrap';
  el.style.wordWrap = 'break-word';
  document.body.appendChild(el);
  mirrorEl = el;
  return el;
}

// Mirrors the textarea's text in a hidden div with matching font/padding,
// then reads a marker span's position to find where a substring renders.
export function measureSubstring(textarea: HTMLTextAreaElement, start: number, end: number): OverlayRect {
  const el = getMirror();
  const computed = getComputedStyle(textarea);

  for (const prop of MIRRORED_PROPS) {
    el.style[prop] = computed[prop];
  }
  el.style.width = `${textarea.clientWidth}px`;

  el.textContent = '';
  el.appendChild(document.createTextNode(textarea.value.slice(0, start)));
  const marker = document.createElement('span');
  marker.textContent = textarea.value.slice(start, end) || ' ';
  el.appendChild(marker);

  // getClientRects(), not offsetWidth/Height: those report the full wrapped
  // box when the match spans lines, instead of just the first line.
  const mirrorBox = el.getBoundingClientRect();
  const rects = marker.getClientRects();
  const first = rects[0] ?? marker.getBoundingClientRect();

  return {
    left: first.left - mirrorBox.left - textarea.scrollLeft,
    top: first.top - mirrorBox.top - textarea.scrollTop,
    width: first.width,
    height: first.height,
  };
}
