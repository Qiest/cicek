const SVG_NS = 'http://www.w3.org/2000/svg';
const svg = document.getElementById('bouquetSvg');

// Buradan genel animasyon hızını değiştirebilirsin.
// 1 normal hız, 0.7 daha hızlı, 1.4 daha yavaş.
const SPEED = 1;
const STEM_START = 0.25;
const LEAF_START = 1.6;
const PAPER_START = 1.95;
const RIBBON_START = 2.75;
const FLOWER_START = 3.35;
const PETAL_STEP = 0.038;
const FLOWER_GAP = 0.23;
const COMPLETE_AT = 11.9;

document.documentElement.style.setProperty('--animation-scale', SPEED);

const palette = {
  leafDark: '#315d3e',
  leafMid: '#5f8a55',
  leafLight: '#9bb779',
  stemDark: '#4a764d',
  stemLight: '#8da66a',
  ribbonA: '#b8476a',
  ribbonB: '#f4adc1',
  paperA: '#ece4d5',
  paperB: '#fbf6eb',
  paperC: '#c9bda9',
  newsInk: '#7d756a',
};

// 11 şakayık burada. Pozisyon, boyut ve renkleri buradan değiştirilebilir.
const flowers = [
  // Burada her çiçek kendi sap bitiş noktasına kilitli.
  // x: çiçeğin merkezi
  // y: çiçeğin merkezi
  // stemEndY: sapın biteceği yer; çanak yaprak da buraya oturur.
  // Böylece çiçek ayrı, dal ayrı görünmez.
  { x: 500, y: 388, stemEndY: 522, size: 1.22, rot: -2,  base: '#f4a7ba', accent: '#d75f83', light: '#ffe4ec', seed: 11 },
  { x: 418, y: 444, stemEndY: 563, size: 1.06, rot: -7,  base: '#f7c0cb', accent: '#d66b88', light: '#fff0f1', seed: 22 },
  { x: 582, y: 444, stemEndY: 563, size: 1.06, rot: 7,   base: '#f0a1b0', accent: '#c94e73', light: '#ffe0e5', seed: 33 },

  { x: 392, y: 338, stemEndY: 438, size: 0.88, rot: -10, base: '#ffd1d7', accent: '#e4889b', light: '#fff6f3', seed: 44 },
  { x: 608, y: 338, stemEndY: 438, size: 0.88, rot: 10,  base: '#ef98ac', accent: '#bb4768', light: '#ffdee8', seed: 55 },
  { x: 452, y: 278, stemEndY: 372, size: 0.82, rot: 6,   base: '#f7b7c8', accent: '#d65b82', light: '#fff0f4', seed: 66 },
  { x: 548, y: 278, stemEndY: 372, size: 0.82, rot: -6,  base: '#f6c9bf', accent: '#df7b89', light: '#fff2e9', seed: 77 },

  // Kenardaki çiçekler artık içeri alındı; taşmayı önlemek için biraz daha küçük.
  { x: 360, y: 486, stemEndY: 566, size: 0.66, rot: -12, base: '#ffe1df', accent: '#e0929e', light: '#fff7f0', seed: 88 },
  { x: 640, y: 486, stemEndY: 566, size: 0.66, rot: 12,  base: '#f5abc0', accent: '#c95578', light: '#ffe9ee', seed: 99 },
  { x: 390, y: 262, stemEndY: 336, size: 0.58, rot: -8,  base: '#f9d6dd', accent: '#db7b95', light: '#fff7f6', seed: 111 },
  { x: 610, y: 262, stemEndY: 336, size: 0.58, rot: 8,   base: '#f3b0bf', accent: '#cc5f7c', light: '#ffe7ed', seed: 122 },
];

const leafConfigs = [
  { x: 410, y: 620, rot: -44, s: 1.02 }, { x: 590, y: 620, rot: 44, s: 1.02 },
  { x: 386, y: 548, rot: -62, s: .82 },  { x: 614, y: 548, rot: 62, s: .82 },
  { x: 455, y: 700, rot: -27, s: .78 },  { x: 545, y: 700, rot: 27, s: .78 },
  { x: 463, y: 508, rot: -18, s: .66 },  { x: 537, y: 508, rot: 18, s: .66 },
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
    ar[2] + (br[2] - ar[2]) * amount,
  );
}

function createDefs() {
  const defs = el('defs');

  defs.appendChild(el('filter', {
    id: 'softShadow', x: '-30%', y: '-30%', width: '160%', height: '170%'
  }, [
    el('feDropShadow', { dx: '0', dy: '12', stdDeviation: '12', 'flood-color': '#8e3659', 'flood-opacity': '0.18' })
  ]));

  defs.appendChild(el('filter', {
    id: 'leafShadow', x: '-30%', y: '-30%', width: '160%', height: '160%'
  }, [
    el('feDropShadow', { dx: '0', dy: '6', stdDeviation: '7', 'flood-color': '#315d3e', 'flood-opacity': '0.16' })
  ]));

  defs.appendChild(el('linearGradient', { id: 'stemGradient', x1: '0', y1: '0', x2: '1', y2: '1' }, [
    el('stop', { offset: '0%', 'stop-color': palette.stemLight }),
    el('stop', { offset: '48%', 'stop-color': palette.stemDark }),
    el('stop', { offset: '100%', 'stop-color': '#91a968' }),
  ]));

  defs.appendChild(el('linearGradient', { id: 'leafGradient', x1: '0', y1: '0', x2: '1', y2: '1' }, [
    el('stop', { offset: '0%', 'stop-color': palette.leafLight }),
    el('stop', { offset: '48%', 'stop-color': palette.leafMid }),
    el('stop', { offset: '100%', 'stop-color': palette.leafDark }),
  ]));

  defs.appendChild(el('linearGradient', { id: 'ribbonGradient', x1: '0', y1: '0', x2: '1', y2: '1' }, [
    el('stop', { offset: '0%', 'stop-color': palette.ribbonB }),
    el('stop', { offset: '52%', 'stop-color': '#cf5d7c' }),
    el('stop', { offset: '100%', 'stop-color': palette.ribbonA }),
  ]));

  defs.appendChild(el('linearGradient', { id: 'paperGradient', x1: '0', y1: '0', x2: '1', y2: '1' }, [
    el('stop', { offset: '0%', 'stop-color': '#fffaf0' }),
    el('stop', { offset: '52%', 'stop-color': palette.paperA }),
    el('stop', { offset: '100%', 'stop-color': palette.paperC }),
  ]));

  defs.appendChild(el('linearGradient', { id: 'paperLightGradient', x1: '0', y1: '0', x2: '1', y2: '1' }, [
    el('stop', { offset: '0%', 'stop-color': '#fffdf7' }),
    el('stop', { offset: '65%', 'stop-color': palette.paperB }),
    el('stop', { offset: '100%', 'stop-color': '#d8cebd' }),
  ]));

  defs.appendChild(el('linearGradient', { id: 'paperShadowGradient', x1: '0', y1: '0', x2: '0', y2: '1' }, [
    el('stop', { offset: '0%', 'stop-color': 'rgba(70,63,55,0.04)' }),
    el('stop', { offset: '100%', 'stop-color': 'rgba(70,63,55,0.22)' }),
  ]));

  flowers.forEach((f, i) => {
    for (let r = 0; r < 4; r++) {
      const grad = el('radialGradient', {
        id: `petalGrad-${i}-${r}`,
        cx: r < 2 ? '38%' : '50%',
        cy: r < 2 ? '28%' : '34%',
        r: '76%'
      }, [
        el('stop', { offset: '0%', 'stop-color': f.light }),
        el('stop', { offset: '52%', 'stop-color': mix(f.light, f.base, 0.58) }),
        el('stop', { offset: '82%', 'stop-color': f.base }),
        el('stop', { offset: '100%', 'stop-color': mix(f.accent, '#6f1f43', 0.12) }),
      ]);
      defs.appendChild(grad);
    }
  });

  return defs;
}

function curvedStemPath(startX, startY, endX, endY, bend) {
  const c1x = startX + bend * 0.18;
  const c1y = startY - 185;
  const c2x = endX - bend * 0.28;
  const c2y = endY + 155;
  return `M ${startX} ${startY} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${endX} ${endY}`;
}

function leafPath() {
  return 'M 0 0 C -30 -46 -24 -92 0 -120 C 30 -88 38 -42 0 0 Z';
}

function makeLeaf(x, y, rot, s, delay) {
  const group = el('g', { transform: `translate(${x} ${y}) rotate(${rot}) scale(${s})` });
  const leaf = el('path', {
    class: 'leaf',
    d: leafPath(),
    fill: 'url(#leafGradient)',
    filter: 'url(#leafShadow)',
    style: { '--delay': `${delay}s` }
  });
  const vein = el('path', {
    class: 'leaf-vein',
    d: 'M 0 -5 C 1 -34 0 -70 0 -108',
    fill: 'none',
    stroke: 'rgba(255,255,255,.45)',
    'stroke-width': '2.2',
    'stroke-linecap': 'round',
    style: { '--delay': `${delay + 0.18}s` }
  });
  group.append(leaf, vein);
  return group;
}

function petalPath(length, width, wobble) {
  const l = length;
  const w = width;
  const notch = 0.92 + wobble * 0.14;
  const ruffle = 0.08 + wobble * 0.08;
  return [
    `M 0 9`,
    `C ${-w * 0.86} ${-l * 0.14}, ${-w * 0.92} ${-l * 0.54}, ${-w * 0.42} ${-l * 0.82}`,
    `C ${-w * 0.28} ${-l * (0.98 + ruffle)}, ${-w * 0.10} ${-l * 0.91}, ${-w * 0.02} ${-l * notch}`,
    `C ${w * 0.10} ${-l * (1.04 + ruffle)}, ${w * 0.28} ${-l * 0.95}, ${w * 0.44} ${-l * 0.82}`,
    `C ${w * 0.94} ${-l * 0.54}, ${w * 0.88} ${-l * 0.13}, 0 9`,
    `Z`
  ].join(' ');
}

function petalHighlightPath(length, width) {
  return `M ${-width * 0.12} ${-length * 0.18} C ${-width * 0.2} ${-length * 0.45}, ${-width * 0.04} ${-length * 0.72}, ${width * 0.08} ${-length * 0.88}`;
}

function makeSepal(delay, connectorY) {
  // Sap-çiçek kilidi:
  // connectorY = stemEndY - flowerY.
  // Çanak yaprak ve sap boynu tam bu noktaya iner; sap da aynı noktada biter.
  const neckTop = Math.max(36, connectorY - 54);
  const group = el('g', { class: 'calyx-cover' });

  group.appendChild(el('path', {
    class: 'flower-neck',
    d: `M 0 ${connectorY} C -1 ${connectorY - 20}, -1 ${neckTop + 16}, 0 ${neckTop}`,
    style: { '--delay': `${delay + 0.06}s` }
  }));

  const sepalBaseY = neckTop + 8;
  const angles = [-58, -34, -12, 12, 34, 58];

  angles.forEach((angle, i) => {
    group.appendChild(el('path', {
      class: 'sepal',
      d: 'M 0 8 C -10 -10 -7 -31 0 -48 C 10 -31 11 -10 0 8 Z',
      fill: i % 2 ? '#4f7449' : '#678852',
      transform: `translate(0 ${sepalBaseY}) rotate(${angle}) translate(0 -2)`,
      style: { '--delay': `${delay + 0.10 + i * 0.03}s` }
    }));
  });

  group.appendChild(el('ellipse', {
    class: 'sepal',
    cx: '0',
    cy: sepalBaseY + 12,
    rx: '21',
    ry: '9',
    fill: '#55784c',
    style: { '--delay': `${delay + 0.18}s` }
  }));

  return group;
}
function createPeony(config, index, delay) {
  const rand = mulberry32(config.seed);
  const group = el('g', {
    class: 'peony',
    transform: `translate(${config.x} ${config.y}) rotate(${config.rot}) scale(${config.size})`,
    filter: 'url(#softShadow)'
  });

  // Çiçek oluşmadan önce kısa parlayan “kod çiziyor” noktaları.
  for (let d = 0; d < 14; d++) {
    const angle = (360 / 14) * d + rand() * 12;
    const radius = 32 + rand() * 38;
    const x = Math.cos(angle * Math.PI / 180) * radius;
    const y = Math.sin(angle * Math.PI / 180) * radius;
    group.appendChild(el('circle', {
      class: 'construct-dot',
      cx: x.toFixed(2), cy: y.toFixed(2), r: (1.8 + rand() * 1.8).toFixed(2),
      style: { '--delay': `${delay - 0.2 + d * 0.018}s` }
    }));
  }

  const rings = [
    { count: 16, radius: 28, length: 102, width: 45, rotJitter: 9, yOffset: 6 },
    { count: 14, radius: 15, length: 82,  width: 35, rotJitter: 11, yOffset: 1 },
    { count: 12, radius: 5,  length: 62,  width: 27, rotJitter: 13, yOffset: -4 },
    { count: 9,  radius: -2, length: 44,  width: 19, rotJitter: 18, yOffset: -6 },
  ];

  let petalNumber = 0;
  rings.forEach((ring, ringIndex) => {
    for (let i = 0; i < ring.count; i++) {
      const baseAngle = (360 / ring.count) * i + (ringIndex * 13);
      const angle = baseAngle + (rand() - 0.5) * ring.rotJitter;
      const length = ring.length * (0.9 + rand() * 0.18);
      const width = ring.width * (0.86 + rand() * 0.2);
      const radius = ring.radius + (rand() - 0.5) * 9;
      const delayValue = delay + petalNumber * PETAL_STEP + ringIndex * 0.1;
      const wrapper = el('g', {
        transform: `rotate(${angle.toFixed(2)}) translate(0 ${(-radius + ring.yOffset).toFixed(2)})`
      });
      const petal = el('path', {
        class: `petal ${ringIndex >= 2 ? 'inner' : 'outer'}`,
        d: petalPath(length, width, rand()),
        fill: `url(#petalGrad-${index}-${ringIndex})`,
        style: { '--delay': `${delayValue}s` }
      });
      wrapper.appendChild(petal);

      if (rand() > 0.34) {
        wrapper.appendChild(el('path', {
          class: 'petal-highlight',
          d: petalHighlightPath(length, width),
          style: { '--delay': `${delayValue + 0.08}s` }
        }));
      }

      group.appendChild(wrapper);
      petalNumber++;
    }
  });

  // Çok görünür sarı merkez yerine şakayıktaki yoğun katmanı bozmayacak minik iç kıvrımlar.
  for (let i = 0; i < 10; i++) {
    const angle = i * 36 + rand() * 20;
    const wrapper = el('g', { transform: `rotate(${angle}) translate(0 ${-8 - rand() * 8})` });
    wrapper.appendChild(el('path', {
      class: 'petal inner',
      d: petalPath(27 + rand() * 8, 10 + rand() * 5, rand()),
      fill: `url(#petalGrad-${index}-3)`,
      style: { '--delay': `${delay + petalNumber * PETAL_STEP + i * 0.015}s` }
    }));
    group.appendChild(wrapper);
  }
  group.appendChild(makeSepal(delay + 0.18, config.stemEndY - config.y));

  return group;
}

function makeCraftPaperBack(delay) {
  const group = el('g', { id: 'paperBackLayer', transform: 'translate(0 0)' });

  // Arka gazete kağıdı: çiçeklerin arkasında geniş ama düzenli sarım.
  group.appendChild(el('path', {
    class: 'paper-piece paper-back newspaper-paper',
    d: 'M 248 560 C 334 626 420 700 500 792 C 580 700 666 626 752 560 C 738 742 682 944 602 1070 C 565 1092 526 1105 500 1110 C 474 1105 435 1092 398 1070 C 318 944 262 742 248 560 Z',
    fill: 'url(#paperGradient)',
    style: { '--delay': `${delay}s` }
  }));

  group.appendChild(el('path', {
    class: 'paper-piece paper-wing newspaper-paper',
    d: 'M 248 566 C 319 620 392 704 474 826 C 382 798 300 752 224 696 C 210 648 222 596 248 566 Z',
    fill: 'url(#paperLightGradient)',
    style: { '--delay': `${delay + 0.1}s` }
  }));

  group.appendChild(el('path', {
    class: 'paper-piece paper-wing newspaper-paper',
    d: 'M 752 566 C 681 620 608 704 526 826 C 618 798 700 752 776 696 C 790 648 778 596 752 566 Z',
    fill: 'url(#paperLightGradient)',
    style: { '--delay': `${delay + 0.14}s` }
  }));

  return group;
}

function makeNewsLines(group, delay, prefix, startY, side) {
  for (let i = 0; i < 9; i++) {
    const y = startY + i * 18;
    const x1 = side === 'left' ? 304 + (i % 3) * 9 : 548 + (i % 3) * 6;
    const x2 = side === 'left' ? 458 - (i % 2) * 16 : 708 - (i % 2) * 14;
    group.appendChild(el('path', {
      class: 'news-line',
      d: `M ${x1} ${y} C ${(x1 + x2) / 2} ${y + 8}, ${(x1 + x2) / 2} ${y - 5}, ${x2} ${y + 2}`,
      fill: 'none',
      stroke: 'rgba(88,82,73,.28)',
      'stroke-width': i % 3 === 0 ? '2.1' : '1.35',
      'stroke-linecap': 'round',
      style: { '--delay': `${delay + 0.55 + i * 0.045}s` }
    }));
  }
}

function makeCraftPaperFront(delay) {
  const group = el('g', { id: 'paperFrontLayer', transform: 'translate(0 0)' });

  // Ön gazete sarımı: sapları toparlar, çiçekleri kağıda gömmez.
  group.appendChild(el('path', {
    class: 'paper-piece paper-front newspaper-paper',
    d: 'M 282 640 C 366 720 438 804 500 898 C 562 804 634 720 718 640 C 698 812 654 980 590 1080 C 555 1098 524 1107 500 1111 C 476 1107 445 1098 410 1080 C 346 980 302 812 282 640 Z',
    fill: 'url(#paperGradient)',
    style: { '--delay': `${delay + 0.2}s` }
  }));

  group.appendChild(el('path', {
    class: 'paper-piece paper-fold',
    d: 'M 282 640 C 360 716 430 802 500 898 C 442 878 382 832 306 776 C 290 732 281 686 282 640 Z',
    fill: 'rgba(255,255,255,0.28)',
    style: { '--delay': `${delay + 0.34}s` }
  }));

  group.appendChild(el('path', {
    class: 'paper-piece paper-fold',
    d: 'M 718 640 C 640 716 570 802 500 898 C 558 878 618 832 694 776 C 710 732 719 686 718 640 Z',
    fill: 'rgba(95,87,76,0.11)',
    style: { '--delay': `${delay + 0.38}s` }
  }));

  const foldLines = [
    'M 356 700 C 405 782 439 905 420 1040',
    'M 644 700 C 595 782 561 905 580 1040',
    'M 500 898 C 500 960 500 1020 500 1095',
    'M 326 690 C 400 765 448 828 500 898',
    'M 674 690 C 600 765 552 828 500 898',
  ];

  foldLines.forEach((d, i) => {
    group.appendChild(el('path', {
      class: 'paper-line',
      d,
      fill: 'none',
      stroke: i === 2 ? 'rgba(88,82,73,.20)' : 'rgba(255,255,255,.38)',
      'stroke-width': i === 2 ? '2' : '2.6',
      'stroke-linecap': 'round',
      style: { '--delay': `${delay + 0.46 + i * 0.055}s` }
    }));
  });

  makeNewsLines(group, delay, 'left', 706, 'left');
  makeNewsLines(group, delay, 'right', 716, 'right');

  return group;
}

function makeRibbon(delay) {
  // Gazete kağıdının üstünde kısa, zarif bağ.
  const group = el('g', { transform: 'translate(500 872)' });

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
    style: { '--delay': `${delay + 0.08}s` }
  }));
  group.appendChild(el('ellipse', {
    class: 'knot',
    cx: '0', cy: '6', rx: '30', ry: '20',
    fill: '#c34b70',
    style: { '--delay': `${delay + 0.16}s` }
  }));
  return group;
}


function makeSparkles(layer) {
  const points = [
    [247, 316, 1.0], [755, 340, .85], [234, 556, .7], [785, 556, .75],
    [386, 214, .58], [610, 218, .62], [500, 226, .56], [172, 430, .5],
    [842, 434, .5], [673, 677, .46], [320, 682, .45], [498, 170, .42]
  ];
  points.forEach(([x, y, s], i) => {
    const g = el('g', {
      class: 'sparkle',
      transform: `translate(${x} ${y}) scale(${s})`,
      style: { '--delay': `${COMPLETE_AT + i * 0.16}s` }
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
  const baseY = 1010;

  flowers.forEach((flower, i) => {
    const startX = baseX + (i - 5) * 4.5;
    const bend = (flower.x - 500) * 0.42;
    // Sap ucu direkt flower.stemEndY değerine gider.
    // Çiçek de aynı x ekseninde oluşturulduğu için dal-çiçek ayrılığı yok.
    const stemEndY = flower.stemEndY;
    const path = curvedStemPath(startX, baseY + (i % 3) * 7, flower.x, stemEndY, bend);
    stemsLayer.appendChild(el('path', {
      class: 'stem-shadow',
      d: path,
      pathLength: '1',
      style: { '--delay': `${STEM_START + i * 0.055}s` }
    }));
    stemsLayer.appendChild(el('path', {
      class: 'stem',
      d: path,
      pathLength: '1',
      style: { '--delay': `${STEM_START + i * 0.055}s` }
    }));
  });

  paperBackLayer.appendChild(makeCraftPaperBack(PAPER_START));

  leafConfigs.forEach((l, i) => {
    leavesLayer.appendChild(makeLeaf(l.x, l.y, l.rot, l.s, LEAF_START + i * 0.09));
  });

  paperFrontLayer.appendChild(makeCraftPaperFront(PAPER_START + 0.18));
  ribbonLayer.appendChild(makeRibbon(RIBBON_START));

  // Arkadaki küçükler önce, öndeki büyük/alt çiçekler sonra çizilsin diye sıralama.
  flowers
    .map((f, i) => ({ ...f, originalIndex: i }))
    .sort((a, b) => (a.y + a.size * 80) - (b.y + b.size * 80))
    .forEach((flower, order) => {
      const delay = FLOWER_START + order * FLOWER_GAP;
      flowerLayer.appendChild(createPeony(flower, flower.originalIndex, delay));
    });

  makeSparkles(sparkleLayer);

  core.append(paperBackLayer, stemsLayer, leavesLayer, paperFrontLayer, ribbonLayer, flowerLayer, sparkleLayer);
  svg.appendChild(core);

  window.clearTimeout(window.__completeTimer);
  window.__completeTimer = window.setTimeout(() => {
    document.body.classList.add('complete');
  }, COMPLETE_AT * 1000 * SPEED);
}

buildBouquet();
