// Round flags for the language switch: circle-flags by HatScripts (https://github.com/HatScripts/circle-flags).
// The originals clip themselves with <mask id="a">; here the mask is dropped and site.css clips each flag with
// clip-path: circle(), so one <symbol> per flag can be reused anywhere on a page without duplicate ids.
// All static strings, safe to put in HTML as-is.
//
// MIT License
//
// Copyright (c) 2022 HatScripts
//
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
// documentation files (the "Software"), to deal in the Software without restriction, including without limitation
// the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and
// to permit persons to whom the Software is furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all copies or substantial portions of
// the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO
// THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF
// CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
// IN THE SOFTWARE.

export const FLAGS = {
  si: { label: "Slovenija", svg: '<path fill="#0052b4" d="m0 167 253.8-19.3L512 167v178l-254.9 32.3L0 345z"/><path fill="#eee" d="M0 0h512v167H0z"/><path fill="#d80027" d="M0 345h512v167H0z"/><path fill="#0052b4" d="M222.7 167v-66.8H89V167l67 82.6z"/><path fill="#eee" d="M89 167v22.2c0 51.1 66.8 66.8 66.8 66.8s66.8-15.7 66.8-66.8V167l-22.3 22.2-44.5-33.4-44.5 33.4z"/>' },
  gb: { label: "Združeno kraljestvo", svg: '<path fill="#eee" d="m0 0 8 22-8 23v23l32 54-32 54v32l32 48-32 48v32l32 54-32 54v68l22-8 23 8h23l54-32 54 32h32l48-32 48 32h32l54-32 54 32h68l-8-22 8-23v-23l-32-54 32-54v-32l-32-48 32-48v-32l-32-54 32-54V0l-22 8-23-8h-23l-54 32-54-32h-32l-48 32-48-32h-32l-54 32L68 0H0z"/><path fill="#0052b4" d="M336 0v108L444 0Zm176 68L404 176h108zM0 176h108L0 68ZM68 0l108 108V0Zm108 512V404L68 512ZM0 444l108-108H0Zm512-108H404l108 108Zm-68 176L336 404v108z"/><path fill="#d80027" d="M0 0v45l131 131h45L0 0zm208 0v208H0v96h208v208h96V304h208v-96H304V0h-96zm259 0L336 131v45L512 0h-45zM176 336 0 512h45l131-131v-45zm160 0 176 176v-45L381 336h-45z"/>' },
  hr: { label: "Hrvaška", svg: '<path fill="#eee" d="m0 167 253.8-19.3L512 167v178l-254.9 32.3L0 345z"/><path fill="#d80027" d="M0 0h512v167H0z"/><path fill="#0052b4" d="M0 345h512v167H0z"/><path fill="#338af3" d="M322.8 178h-44.5l7.4-55.7 29.7-22.2 29.6 22.2V167zm-133.6 0h44.5l-7.4-55.7-29.7-22.2-29.6 22.2V167z"/><path fill="#0052b4" d="M285.7 178h-59.4v-55.7l29.7-22.2 29.7 22.2z"/><path fill="#eee" d="M167 167v122.3a89 89 0 0 0 35.8 71.3l15.5-3.9 19.7 19.8a89.1 89.1 0 0 0 18 1.8 89 89 0 0 0 17.9-1.8l22.4-18.7 13 2.8a89 89 0 0 0 35.7-71.3V167z"/><path fill="#d80027" d="M167 167h35.6v35.5H167zm71.2 0h35.6v35.5h-35.6zm71.2 0H345v35.5h-35.6zm-106.8 35.5h35.6v35.6h-35.6zm71.2 0h35.6v35.6h-35.6zM167 238.1h35.6v35.6H167zm35.6 35.6h35.6v35.6h-35.6zm35.6-35.6h35.6v35.6h-35.6zm71.2 0H345v35.6h-35.6zm-35.6 35.6h35.6v35.6h-35.6zm-35.6 35.6h35.6V345h-35.6zm-35.6 0h-33.3c3 13.3 9 25.4 17.3 35.6h16zM309.4 345h16a88.8 88.8 0 0 0 17.3-35.6h-33.3zm-106.8 0v15.6a88.7 88.7 0 0 0 35.6 16V345zm71.2 0v31.6a88.7 88.7 0 0 0 35.6-16V345z"/>' },
  rs: { label: "Srbija", svg: '<path fill="#0052b4" d="m0 167 253.8-19.3L512 167v178l-254.9 32.3L0 345z"/><path fill="#d80027" d="M0 0h512v167H0z"/><path fill="#eee" d="M0 345h512v167H0z"/><path fill="#d80027" d="M66.2 144.7v127.7c0 72.6 94.9 95 94.9 95s94.9-22.4 94.9-95V144.7z"/><path fill="#ffda44" d="M105.4 167h111.4v-44.6l-22.3 11.2-33.4-33.4-33.4 33.4-22.3-11.2zm128.3 123.2-72.3-72.4L89 290.2l23.7 23.6 48.7-48.7 48.7 48.7z"/><path fill="#eee" d="M233.7 222.6H200a22.1 22.1 0 0 0 3-11.1 22.3 22.3 0 0 0-42-10.5 22.3 22.3 0 0 0-41.9 10.5 22.1 22.1 0 0 0 3 11.1H89a23 23 0 0 0 23 22.3h-.7c0 12.3 10 22.2 22.3 22.2 0 11 7.8 20 18.1 21.9l-17.5 39.6a72.1 72.1 0 0 0 27.2 5.3 72.1 72.1 0 0 0 27.2-5.3L171.1 289c10.3-2 18.1-11 18.1-21.9 12.3 0 22.3-10 22.3-22.2h-.8a23 23 0 0 0 23-22.3z"/>' },
  ba: { label: "Bosna in Hercegovina", svg: '<path fill="#ffda44" d="M0 0h445.3l33.9 255-33.9 257-323.7-134.3L0 66.8z"/><path fill="#0052b4" d="M0 66.8V512h445.4z"/><path fill="#0052b4" d="M445.3 0H512v512h-66.7z"/><path fill="#eee" d="m354.6 456-8.3 25.6h-26.8l21.7 15.8-8.3 25.5 21.7-15.8 21.7 15.8-8.3-25.5 21.7-15.8h-26.8zm-55-55.4-8.3 25.5h-26.8l21.7 15.8-8.3 25.5 21.7-15.8 21.7 15.8-8.3-25.5 21.7-15.8h-26.8zM244.4 345l-8.3 25.5h-26.8l21.7 15.8-8.3 25.5 21.7-15.8 21.7 15.8-8.3-25.5 21.7-15.8h-26.8zm-55.1-55.7-8.3 25.5h-26.8l21.7 15.8-8.3 25.5 21.7-15.8L211 356l-8.3-25.5 21.7-15.8h-26.8zm-55.4-55.7-8.3 25.5H98.8l21.7 15.8-8.3 25.5 21.7-15.8 21.7 15.8-8.3-25.5L169 259h-26.8zM78.7 178l-8.3 25.5H43.6l21.7 15.8-8.3 25.5L78.7 229l21.7 15.8-8.3-25.5 21.7-15.8H87zm-55.2-55.7-8.3 25.5h-26.8l21.7 15.8L1.8 189l21.7-15.8L45.2 189l-8.3-25.5 21.7-15.8H31.8z"/>' },
  me: { label: "Črna gora", svg: '<path fill="#ffda44" d="M0 0h512v44.5l-43.6 209.7L512 467.5V512H0v-44.5l46.6-212L0 44.5z"/><path fill="#a2001d" d="M0 44.5h512v423H0z"/><path fill="#ffda44" d="M200.3 189.2h111.4v-44.5l-22.3 11.1-33.4-33.4-33.4 33.4-22.3-11.1zM356.2 256h-55.7a25.5 25.5 0 0 0 3.5-12.8 25.7 25.7 0 0 0-48.3-12.1 25.7 25.7 0 1 0-45 24.9h-54.9c0 17 14.9 30.8 31.9 30.8h-1c0 14 9.2 25.8 22 29.6l-25 25 23.6 23.6 33.5-33.5c1.3.5 2.6.9 4 1.1l-20.2 45.7a83.2 83.2 0 0 0 31.4 6.2 83.2 83.2 0 0 0 31.4-6.2l-20.2-45.7a25.4 25.4 0 0 0 4-1.1l33.5 33.5 23.6-23.6-25-25a30.8 30.8 0 0 0 22-29.6h-1c17 0 31.9-13.8 31.9-30.8z"/><path fill="#6da544" d="m256 272.7-36.2 16.7v33.4L256 345l36.2-22.2v-33.4z"/><path fill="#0052b4" d="M219.8 256h72.4v44.5h-72.4z"/>' },
};

/** Flags offered for the third language (Serbo-Croatian, ijekavian Latin); the owner picks which to show. */
export const SH_FLAG_CHOICES = ['hr', 'rs', 'ba', 'me'];

/** One hidden <svg> with a <symbol> per flag; put it once at the top of <body>. */
export function flagSprite(codes) {
  const list = [...new Set(codes)].filter((c) => FLAGS[c]);
  if (!list.length) return '';
  return `<svg class="sprite" aria-hidden="true" focusable="false"><defs>${list.map((c) => `<symbol id="flag-${c}" viewBox="0 0 512 512">${FLAGS[c].svg}</symbol>`).join('')}</defs></svg>`;
}

/** The flag (or overlapping flags) of a language. Decorative: the language name is always written next to it. */
export function flagIcons(codes, cls = 'flags') {
  const list = codes.filter((c) => FLAGS[c]);
  if (!list.length) return '';
  return `<span class="${cls}${list.length > 1 ? ' is-multi' : ''}" aria-hidden="true">${list.map((c) => `<span class="flag"><svg viewBox="0 0 512 512" focusable="false"><use href="#flag-${c}"/></svg></span>`).join('')}</span>`;
}
