const SVG_NS = 'http://www.w3.org/2000/svg';
const svg = document.getElementById('bouquetSvg');

const STEM_START = 0.18;
const LEAF_START = 1.12;
const PAPER_START = 1.6;
const RIBBON_START = 2.28;
const FLOWER_START = 2.78;
const FLOWER_GAP = 0.125;
const PETAL_STEP = 0.024;
const COMPLETE_AT = 10.4;

const palette = {
  leafDark: '#315d3e',
  leafMid: '#5d8753',
  leafLight: '#a4bc7b',
  stemDark: '#416e45',
  stemLight: '#8da86a',
  ribbonA: '#b8476a',
  ribbonB: '#f4adc1',
  paperA: '#ebe2d2',
  paperB: '#fffaf0',
  paperC: '#c7b9a4',
};

const flowers = [
  // 3 üst - üst sıra biraz büyütüldü
  { anchorX: 448, anchorY: 358, size: 0.86, rot: -6, base: '#f7c0cb', accent: '#d66b88', light: '#fff0f1', seed: 11 },
  { anchorX: 500, anchorY: 340, size: 0.92, rot: 0, base: '#f4a7ba', accent: '#d75f83', light: '#ffe4ec', seed: 22 },
  { anchorX: 552, anchorY: 358, size: 0.86, rot: 6, base: '#f0a1b0', accent: '#c94e73', light: '#ffe0e5', seed: 33 },

  // 4 orta - büyükler biraz küçültüldü, küçüklerle fark azaldı
  { anchorX: 404, anchorY: 430, size: 0.91, rot: -9, base: '#ffd1d7', accent: '#e4889b', light: '#fff6f3', seed: 44 },
  { anchorX: 466, anchorY: 414, size: 0.94, rot: -4, base: '#f7b7c8', accent: '#d65b82', light: '#fff0f4', seed: 55 },
  { anchorX: 534, anchorY: 414, size: 0.94, rot: 4, base: '#f6c9bf', accent: '#df7b89', light: '#fff2e9', seed: 66 },
  { anchorX: 596, anchorY: 430, size: 0.91, rot: 9, base: '#ef98ac', accent: '#bb4768', light: '#ffdee8', seed: 77 },

  // 4 alt - alt sıra büyütüldü; buket daha dolu ve uyumlu
  { anchorX: 376, anchorY: 510, size: 0.86, rot: -10, base: '#ffe1df', accent: '#e0929e', light: '#fff8f1', seed: 88 },
  { anchorX: 442, anchorY: 494, size: 0.90, rot: -5, base: '#f9d6dd', accent: '#db7b95', light: '#fff7f6', seed: 99 },
  { anchorX: 558, anchorY: 494, size: 0.90, rot: 5, base: '#f5abc0', accent: '#c95578', light: '#ffe9ee', seed: 111 },
  { anchorX: 624, anchorY: 510, size: 0.86, rot: 10, base: '#f3b0bf', accent: '#cc5f7c', light: '#ffe7ed', seed: 122 },
];

const leafConfigs = [
  { x: 416, y: 620, rot: -36, s: .78 },
  { x: 584, y: 620, rot: 36, s: .78 },
  { x: 402, y: 552, rot: -54, s: .62 },
  { x: 598, y: 552, rot: 54, s: .62 },
  { x: 458, y: 694, rot: -24, s: .62 },
  { x: 542, y: 694, rot: 24, s: .62 },
  { x: 462, y: 476, rot: -16, s: .48 },
  { x: 538, y: 476, rot: 16, s: .48 },
];

function el(type, attrs = {}, children = []) {
  const node = document.createElementNS(SVG_NS, type);
  Object.entries(attrs).forEach(([key, value]) => {
    if (key === 'style') {
      Object.entries(value).forEach(([styleKey, styleValue]) => {
        if (styleKey.startsWith('--')) node.style.setProperty(styleKey, styleValue);
        else node.style[styleKey] = styleValue;
      });
    } else {
      node.setAttribute(key, value);
    }
  });
  children.forEach(child => node.appendChild(child));
  return node;
}

function mulberry32(seed) {
  return function rand() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function hexToRgb(hex) {
  const clean = hex.replace('#', '');
  const bigint = parseInt(clean, 16);
  return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
}

function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
}

function mix(a, b, amount) {
  const ar = hexToRgb(a);
  const br = hexToRgb(b);
  return rgbToHex(
    ar[0] + (br[0] - ar[0]) * amount,
    ar[1] + (br[1] - ar[1]) * amount,
    ar[2] + (br[2] - ar[2]) * amount
  );
}

function createDefs() {
  const defs = el('defs');

  defs.appendChild(el('filter', {
    id: 'softShadow', x: '-30%', y: '-30%', width: '160%', height: '170%'
  }, [el('feDropShadow', { dx: '0', dy: '11', stdDeviation: '10', 'flood-color': '#8e3659', 'flood-opacity': '0.17' })]));

  defs.appendChild(el('filter', {
    id: 'leafShadow', x: '-30%', y: '-30%', width: '160%', height: '160%'
  }, [el('feDropShadow', { dx: '0', dy: '6', stdDeviation: '6', 'flood-color': '#315d3e', 'flood-opacity': '0.16' })]));

  defs.appendChild(el('linearGradient', { id: 'stemGradient', x1: '0', y1: '0', x2: '1', y2: '1' }, [
    el('stop', { offset: '0%', 'stop-color': palette.stemLight }),
    el('stop', { offset: '52%', 'stop-color': palette.stemDark }),
    el('stop', { offset: '100%', 'stop-color': '#8fa568' })
  ]));

  defs.appendChild(el('linearGradient', { id: 'leafGradient', x1: '0', y1: '0', x2: '1', y2: '1' }, [
    el('stop', { offset: '0%', 'stop-color': palette.leafLight }),
    el('stop', { offset: '48%', 'stop-color': palette.leafMid }),
    el('stop', { offset: '100%', 'stop-color': palette.leafDark })
  ]));

  defs.appendChild(el('linearGradient', { id: 'paperGradient', x1: '0', y1: '0', x2: '1', y2: '1' }, [
    el('stop', { offset: '0%', 'stop-color': palette.paperB }),
    el('stop', { offset: '58%', 'stop-color': palette.paperA }),
    el('stop', { offset: '100%', 'stop-color': palette.paperC })
  ]));

  defs.appendChild(el('linearGradient', { id: 'paperLightGradient', x1: '0', y1: '0', x2: '1', y2: '1' }, [
    el('stop', { offset: '0%', 'stop-color': '#fffdf7' }),
    el('stop', { offset: '65%', 'stop-color': '#f4eadb' }),
    el('stop', { offset: '100%', 'stop-color': '#d7cab8' })
  ]));

  defs.appendChild(el('linearGradient', { id: 'ribbonGradient', x1: '0', y1: '0', x2: '1', y2: '1' }, [
    el('stop', { offset: '0%', 'stop-color': palette.ribbonB }),
    el('stop', { offset: '52%', 'stop-color': '#cf5d7c' }),
    el('stop', { offset: '100%', 'stop-color': palette.ribbonA })
  ]));

  flowers.forEach((f, i) => {
    for (let r = 0; r < 4; r++) {
      defs.appendChild(el('radialGradient', {
        id: `petalGrad-${i}-${r}`,
        cx: r < 2 ? '40%' : '50%',
        cy: r < 2 ? '28%' : '34%',
        r: '76%'
      }, [
        el('stop', { offset: '0%', 'stop-color': f.light }),
        el('stop', { offset: '55%', 'stop-color': mix(f.light, f.base, 0.58) }),
        el('stop', { offset: '82%', 'stop-color': f.base }),
        el('stop', { offset: '100%', 'stop-color': mix(f.accent, '#6f1f43', 0.10) })
      ]));
    }
  });

  return defs;
}

function curvedStemPath(startX, startY, endX, endY, bend) {
  const c1x = startX + bend * 0.12;
  const c1y = startY - 190;
  const c2x = endX - bend * 0.16;
  const c2y = endY + 148;
  return `M ${startX} ${startY} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${endX} ${endY}`;
}

function leafPath() {
  return 'M 0 0 C -30 -44 -24 -90 0 -120 C 31 -88 38 -42 0 0 Z';
}

function makeLeaf(x, y, rot, s, delay) {
  const group = el('g', { transform: `translate(${x} ${y}) rotate(${rot}) scale(${s})` });
  group.appendChild(el('path', {
    class: 'leaf',
    d: leafPath(),
    fill: 'url(#leafGradient)',
    filter: 'url(#leafShadow)',
    style: { '--delay': `${delay}s` }
  }));
  group.appendChild(el('path', {
    class: 'leaf-vein',
    d: 'M 0 -5 C 1 -35 0 -72 0 -108',
    fill: 'none',
    stroke: 'rgba(255,255,255,.46)',
    'stroke-width': '2',
    'stroke-linecap': 'round',
    style: { '--delay': `${delay + .14}s` }
  }));
  return group;
}

function petalPath(length, width, wobble) {
  const l = length;
  const w = width;
  const notch = .92 + wobble * .13;
  const ruffle = .08 + wobble * .08;
  return [
    `M 0 9`,
    `C ${-w * .86} ${-l * .14}, ${-w * .92} ${-l * .54}, ${-w * .42} ${-l * .82}`,
    `C ${-w * .28} ${-l * (.98 + ruffle)}, ${-w * .10} ${-l * .91}, ${-w * .02} ${-l * notch}`,
    `C ${w * .10} ${-l * (1.04 + ruffle)}, ${w * .28} ${-l * .95}, ${w * .44} ${-l * .82}`,
    `C ${w * .94} ${-l * .54}, ${w * .88} ${-l * .13}, 0 9`,
    'Z'
  ].join(' ');
}

function petalHighlightPath(length, width) {
  return `M ${-width * .12} ${-length * .18} C ${-width * .2} ${-length * .45}, ${-width * .04} ${-length * .72}, ${width * .08} ${-length * .88}`;
}

function makeCalyx(delay) {
  const group = el('g', { class: 'calyx' });

  group.appendChild(el('path', {
    class: 'calyx-part',
    d: 'M 0 8 C -2 -10 -1 -32 0 -52 C 2 -32 2 -10 0 8 Z',
    fill: '#4d7449',
    style: { '--delay': `${delay}s` }
  }));

  const angles = [-64, -38, -15, 15, 38, 64];
  angles.forEach((angle, i) => {
    group.appendChild(el('path', {
      class: 'calyx-part',
      d: 'M 0 6 C -10 -12 -7 -35 0 -55 C 10 -35 11 -12 0 6 Z',
      fill: i % 2 ? '#50754a' : '#66874f',
      transform: `rotate(${angle}) translate(0 -2)`,
      style: { '--delay': `${delay + .04 + i * .028}s` }
    }));
  });

  group.appendChild(el('ellipse', {
    class: 'calyx-part',
    cx: '0',
    cy: '7',
    rx: '20',
    ry: '9',
    fill: '#557a4f',
    style: { '--delay': `${delay + .16}s` }
  }));

  return group;
}

function createPeony(config, index, delay) {
  const rand = mulberry32(config.seed);
  const group = el('g', {
    class: 'peony',
    transform: `translate(${config.anchorX} ${config.anchorY}) rotate(${config.rot}) scale(${config.size})`,
    filter: 'url(#softShadow)'
  });

  group.appendChild(makeCalyx(delay - .14));

  const bloom = el('g', { transform: 'translate(0 -62)' });

  for (let d = 0; d < 12; d++) {
    const angle = (360 / 12) * d + rand() * 10;
    const radius = 24 + rand() * 30;
    bloom.appendChild(el('circle', {
      class: 'construct-dot',
      cx: (Math.cos(angle * Math.PI / 180) * radius).toFixed(2),
      cy: (Math.sin(angle * Math.PI / 180) * radius).toFixed(2),
      r: (1.4 + rand() * 1.4).toFixed(2),
      style: { '--delay': `${delay - .14 + d * .014}s` }
    }));
  }

  const rings = [
    { count: 19, radius: 22, length: 88, width: 38, jitter: 7, yOffset: 4 },
    { count: 17, radius: 10, length: 72, width: 30, jitter: 9, yOffset: -1 },
    { count: 14, radius: 2, length: 55, width: 23, jitter: 11, yOffset: -4 },
    { count: 10, radius: -4, length: 38, width: 16, jitter: 14, yOffset: -6 }
  ];

  let petalNumber = 0;

  rings.forEach((ring, ringIndex) => {
    for (let i = 0; i < ring.count; i++) {
      const baseAngle = (360 / ring.count) * i + ringIndex * 13;
      const angle = baseAngle + (rand() - .5) * ring.jitter;
      const length = ring.length * (.92 + rand() * .14);
      const width = ring.width * (.88 + rand() * .18);
      const radius = ring.radius + (rand() - .5) * 4;
      const delayValue = delay + petalNumber * PETAL_STEP + ringIndex * .07;

      const wrapper = el('g', {
        transform: `rotate(${angle.toFixed(2)}) translate(0 ${(-radius + ring.yOffset).toFixed(2)})`
      });

      wrapper.appendChild(el('path', {
        class: `petal ${ringIndex >= 2 ? 'inner' : 'outer'}`,
        d: petalPath(length, width, rand()),
        fill: `url(#petalGrad-${index}-${ringIndex})`,
        style: { '--delay': `${delayValue}s` }
      }));

      if (rand() > .45) {
        wrapper.appendChild(el('path', {
          class: 'petal-highlight',
          d: petalHighlightPath(length, width),
          style: { '--delay': `${delayValue + .07}s` }
        }));
      }

      bloom.appendChild(wrapper);
      petalNumber++;
    }
  });

  for (let i = 0; i < 10; i++) {
    const angle = i * 45 + rand() * 16;
    const wrapper = el('g', { transform: `rotate(${angle}) translate(0 ${-6 - rand() * 5})` });
    wrapper.appendChild(el('path', {
      class: 'petal inner',
      d: petalPath(23 + rand() * 6, 9 + rand() * 4, rand()),
      fill: `url(#petalGrad-${index}-3)`,
      style: { '--delay': `${delay + petalNumber * PETAL_STEP + i * .014}s` }
    }));
    bloom.appendChild(wrapper);
  }

  group.appendChild(bloom);
  return group;
}

function makePaperBack(delay) {
  const group = el('g', { id: 'paperBackLayer' });

  group.appendChild(el('path', {
    class: 'paper-piece paper-back newspaper-paper',
    d: 'M 258 580 C 340 634 422 704 500 786 C 578 704 660 634 742 580 C 736 744 682 944 602 1070 C 565 1092 526 1106 500 1110 C 474 1106 435 1092 398 1070 C 318 944 264 744 250 574 Z',
    fill: 'url(#paperGradient)',
    style: { '--delay': `${delay}s` }
  }));

  group.appendChild(el('path', {
    class: 'paper-piece paper-wing newspaper-paper',
    d: 'M 250 578 C 320 626 392 704 472 818 C 382 794 300 750 226 698 C 212 650 224 602 250 578 Z',
    fill: 'url(#paperLightGradient)',
    style: { '--delay': `${delay + .1}s` }
  }));

  group.appendChild(el('path', {
    class: 'paper-piece paper-wing newspaper-paper',
    d: 'M 750 578 C 680 626 608 704 528 818 C 618 794 700 750 774 698 C 788 650 776 602 750 578 Z',
    fill: 'url(#paperLightGradient)',
    style: { '--delay': `${delay + .14}s` }
  }));

  return group;
}

function makeNewspaperText(x, y, text, size, delay, extra = {}) {
  return el('text', {
    class: extra.className || 'news-text',
    x,
    y,
    'font-size': size,
    'font-family': 'Georgia, Times New Roman, serif',
    'font-weight': extra.weight || '500',
    'letter-spacing': extra.spacing || '0',
    fill: extra.fill || 'rgba(70,64,56,.46)',
    transform: extra.transform || '',
    style: { '--delay': `${delay}s` }
  }, [document.createTextNode(text)]);
}

function makeNewsRule(x1, y1, x2, y2, delay, opacity = .32, width = 1.2) {
  return el('path', {
    class: 'news-detail',
    d: `M ${x1} ${y1} L ${x2} ${y2}`,
    fill: 'none',
    stroke: `rgba(72,65,56,${opacity})`,
    'stroke-width': width,
    'stroke-linecap': 'round',
    style: { '--delay': `${delay}s` }
  });
}

function makeNewsColumn(group, x, y, width, rows, delay, side = 'left') {
  for (let i = 0; i < rows; i++) {
    const lineY = y + i * 9.2;
    const trim = (i % 4) * 8 + (i % 3) * 3;
    const endX = x + width - trim;

    group.appendChild(el('path', {
      class: 'news-detail',
      d: `M ${x} ${lineY} L ${endX} ${lineY}`,
      fill: 'none',
      stroke: 'rgba(70,64,56,.31)',
      'stroke-width': i % 5 === 0 ? '1.35' : '0.82',
      'stroke-linecap': 'round',
      style: { '--delay': `${delay + i * .026}s` }
    }));
  }

  // Küçük haber kutusu / fotoğraf alanı gibi dursun.
  group.appendChild(el('rect', {
    class: 'news-detail',
    x: side === 'left' ? x + 8 : x + width - 52,
    y: y + rows * 9.2 + 8,
    width: 42,
    height: 28,
    rx: 2,
    fill: 'rgba(83,75,65,.08)',
    stroke: 'rgba(70,64,56,.26)',
    'stroke-width': '1',
    style: { '--delay': `${delay + rows * .028}s` }
  }));

  for (let i = 0; i < 3; i++) {
    group.appendChild(el('path', {
      class: 'news-detail',
      d: `M ${side === 'left' ? x + 58 : x} ${y + rows * 9.2 + 12 + i * 7} L ${side === 'left' ? x + width - 6 : x + width - 58} ${y + rows * 9.2 + 12 + i * 7}`,
      fill: 'none',
      stroke: 'rgba(70,64,56,.25)',
      'stroke-width': '.78',
      'stroke-linecap': 'round',
      style: { '--delay': `${delay + rows * .028 + i * .03}s` }
    }));
  }
}

function addNewspaperDetails(group, delay) {
  // Sol sayfa başlığı
  group.appendChild(makeNewspaperText(318, 710, 'THE DAILY', 13, delay + .38, {
    weight: '700',
    spacing: '.12em',
    fill: 'rgba(61,55,49,.48)'
  }));
  group.appendChild(makeNewspaperText(318, 727, 'BLOOM', 21, delay + .43, {
    weight: '800',
    spacing: '.08em',
    fill: 'rgba(61,55,49,.52)'
  }));
  group.appendChild(makeNewsRule(318, 735, 456, 735, delay + .48, .36, 1.4));

  // Sağ sayfa başlığı
  group.appendChild(makeNewspaperText(552, 714, 'FLOWER', 18, delay + .41, {
    weight: '800',
    spacing: '.08em',
    fill: 'rgba(61,55,49,.48)'
  }));
  group.appendChild(makeNewspaperText(552, 731, 'EDITION', 12, delay + .46, {
    weight: '700',
    spacing: '.16em',
    fill: 'rgba(61,55,49,.42)'
  }));
  group.appendChild(makeNewsRule(552, 739, 698, 739, delay + .5, .34, 1.3));

  // Sayfa kolonları
  makeNewsColumn(group, 318, 752, 62, 10, delay + .56, 'left');
  makeNewsColumn(group, 392, 752, 64, 10, delay + .62, 'left');
  makeNewsColumn(group, 552, 756, 66, 10, delay + .58, 'right');
  makeNewsColumn(group, 632, 756, 66, 10, delay + .64, 'right');

  // Orta kat yeri / sayfa ayrımı
  group.appendChild(makeNewsRule(500, 746, 500, 1048, delay + .52, .18, 1.6));

  // Aşağıdaki daha küçük metin blokları
  makeNewsColumn(group, 354, 900, 92, 8, delay + .92, 'left');
  makeNewsColumn(group, 556, 900, 92, 8, delay + .96, 'right');

  // Hafif tarih/sayı detayı
  group.appendChild(makeNewspaperText(395, 873, 'No. 11', 9, delay + .86, {
    weight: '700',
    fill: 'rgba(61,55,49,.36)'
  }));
  group.appendChild(makeNewspaperText(565, 873, 'SPECIAL', 9, delay + .88, {
    weight: '700',
    spacing: '.1em',
    fill: 'rgba(61,55,49,.34)'
  }));
}


function makePaperFront(delay) {
  const group = el('g', { id: 'paperFrontLayer' });

  group.appendChild(el('path', {
    class: 'paper-piece paper-front newspaper-paper',
    d: 'M 294 654 C 374 726 442 806 500 896 C 558 806 626 726 706 654 C 692 814 650 980 590 1080 C 554 1098 523 1108 500 1112 C 477 1108 446 1098 410 1080 C 350 980 308 814 290 648 Z',
    fill: 'url(#paperGradient)',
    style: { '--delay': `${delay + .18}s` }
  }));

  group.appendChild(el('path', {
    class: 'paper-piece paper-fold',
    d: 'M 290 648 C 366 718 434 802 500 896 C 444 878 386 834 314 780 C 298 736 289 692 290 648 Z',
    fill: 'rgba(255,255,255,.28)',
    style: { '--delay': `${delay + .32}s` }
  }));

  group.appendChild(el('path', {
    class: 'paper-piece paper-fold',
    d: 'M 710 648 C 634 718 566 802 500 896 C 556 878 614 834 686 780 C 702 736 711 692 710 648 Z',
    fill: 'rgba(92,83,72,.11)',
    style: { '--delay': `${delay + .36}s` }
  }));

  const folds = [
    'M 360 706 C 407 784 438 904 422 1040',
    'M 640 706 C 593 784 562 904 578 1040',
    'M 500 896 C 500 958 500 1018 500 1095',
    'M 330 696 C 400 768 446 828 500 896',
    'M 670 696 C 600 768 554 828 500 896'
  ];

  folds.forEach((d, i) => {
    group.appendChild(el('path', {
      class: 'paper-line',
      d,
      fill: 'none',
      stroke: i === 2 ? 'rgba(88,82,73,.20)' : 'rgba(255,255,255,.38)',
      'stroke-width': i === 2 ? '2' : '2.5',
      'stroke-linecap': 'round',
      style: { '--delay': `${delay + .45 + i * .055}s` }
    }));
  });

  addNewspaperDetails(group, delay);

  return group;
}

function makeRibbon(delay) {
  const group = el('g', { transform: 'translate(500 874)' });

  group.appendChild(el('path', {
    class: 'bow-piece',
    d: 'M -22 0 C -82 -30 -112 -5 -101 26 C -68 40 -39 25 -11 7 Z',
    fill: 'url(#ribbonGradient)',
    style: { '--delay': `${delay}s` }
  }));

  group.appendChild(el('path', {
    class: 'bow-piece',
    d: 'M 22 0 C 82 -30 112 -5 101 26 C 68 40 39 25 11 7 Z',
    fill: 'url(#ribbonGradient)',
    style: { '--delay': `${delay + .08}s` }
  }));

  group.appendChild(el('ellipse', {
    class: 'knot',
    cx: '0',
    cy: '6',
    rx: '30',
    ry: '20',
    fill: '#c34b70',
    style: { '--delay': `${delay + .16}s` }
  }));

  return group;
}

function makeSparkles(layer) {
  const points = [
    [350, 300, .45], [650, 300, .45], [280, 510, .38], [720, 510, .38],
    [430, 250, .35], [570, 250, .35], [500, 690, .32]
  ];

  points.forEach(([x, y, s], i) => {
    const g = el('g', {
      class: 'sparkle',
      transform: `translate(${x} ${y}) scale(${s})`,
      style: { '--delay': `${COMPLETE_AT + i * .16}s` }
    });
    g.appendChild(el('path', {
      d: 'M0 -18 C4 -7 7 -4 18 0 C7 4 4 7 0 18 C-4 7 -7 4 -18 0 C-7 -4 -4 -7 0 -18Z'
    }));
    layer.appendChild(g);
  });
}

function buildBouquet() {
  svg.innerHTML = '';
  document.body.classList.remove('complete');

  svg.appendChild(createDefs());

  const core = el('g', { id: 'bouquetCore' });
  const paperBackLayer = el('g', { id: 'paperBackWrap' });
  const stemsLayer = el('g', { id: 'stemsLayer' });
  const leavesLayer = el('g', { id: 'leavesLayer' });
  const paperFrontLayer = el('g', { id: 'paperFrontWrap' });
  const ribbonLayer = el('g', { id: 'ribbonLayer' });
  const flowerLayer = el('g', { id: 'flowerLayer' });
  const sparkleLayer = el('g', { id: 'sparkleLayer' });

  const baseX = 500;
  const baseY = 1014;

  paperBackLayer.appendChild(makePaperBack(PAPER_START));

  flowers.forEach((flower, i) => {
    const startX = baseX + (i - 5) * 4.2;
    const bend = (flower.anchorX - baseX) * .34;
    const path = curvedStemPath(startX, baseY + (i % 3) * 6, flower.anchorX, flower.anchorY, bend);

    stemsLayer.appendChild(el('path', {
      class: 'stem-shadow',
      d: path,
      pathLength: '1',
      style: { '--delay': `${STEM_START + i * .043}s` }
    }));

    stemsLayer.appendChild(el('path', {
      class: 'stem',
      d: path,
      pathLength: '1',
      style: { '--delay': `${STEM_START + i * .043}s` }
    }));
  });

  leafConfigs.forEach((leaf, i) => {
    leavesLayer.appendChild(makeLeaf(leaf.x, leaf.y, leaf.rot, leaf.s, LEAF_START + i * .07));
  });

  paperFrontLayer.appendChild(makePaperFront(PAPER_START + .2));
  ribbonLayer.appendChild(makeRibbon(RIBBON_START));

  flowers
    .map((f, index) => ({ ...f, originalIndex: index }))
    .sort((a, b) => a.anchorY - b.anchorY)
    .forEach((flower, order) => {
      const delay = FLOWER_START + order * FLOWER_GAP;
      flowerLayer.appendChild(createPeony(flower, flower.originalIndex, delay));
    });

  makeSparkles(sparkleLayer);

  core.append(
    paperBackLayer,
    stemsLayer,
    leavesLayer,
    paperFrontLayer,
    ribbonLayer,
    flowerLayer,
    sparkleLayer
  );

  svg.appendChild(core);

  window.clearTimeout(window.__completeTimer);
  window.__completeTimer = window.setTimeout(() => {
    document.body.classList.add('complete');
  }, COMPLETE_AT * 1000);
}

buildBouquet();
