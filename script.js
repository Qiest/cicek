const SVG_NS = 'http://www.w3.org/2000/svg';
const svg = document.getElementById('bouquetSvg');

const STEM_START = 0.18;
const LEAF_START = 1.18;
const PAPER_START = 1.72;
const RIBBON_START = 2.42;
const FLOWER_START = 2.9;
const FLOWER_GAP = 0.18;
const PETAL_STEP = 0.031;
const COMPLETE_AT = 11.2;

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
  ink: '#756d62'
};

// Bu sürümün ana mantığı:
// Her çiçeğin anchor noktası sapın bittiği noktadır.
// Şakayık başı bu anchor'ın üstüne çizilir; sap ve çiçek ayrılmaz.
const flowers = [
  // Arkadaki üst sıra
  { anchorX: 500, anchorY: 372, size: 0.82, rot: -2, base: '#f6b6c8', accent: '#d75f83', light: '#fff0f4', seed: 11 },
  { anchorX: 418, anchorY: 408, size: 0.75, rot: -9, base: '#ffd0d8', accent: '#e4889b', light: '#fff7f3', seed: 22 },
  { anchorX: 582, anchorY: 408, size: 0.75, rot: 9, base: '#f3a8bd', accent: '#c95578', light: '#ffe9ef', seed: 33 },

  // Orta dolgun sıra
  { anchorX: 372, anchorY: 514, size: 0.86, rot: -12, base: '#ffe1df', accent: '#e0929e', light: '#fff8f1', seed: 44 },
  { anchorX: 500, anchorY: 505, size: 1.08, rot: 0, base: '#f4a7ba', accent: '#d75f83', light: '#ffe4ec', seed: 55 },
  { anchorX: 628, anchorY: 514, size: 0.86, rot: 12, base: '#f0a1b0', accent: '#c94e73', light: '#ffe0e5', seed: 66 },

  // Öne yakın sıra
  { anchorX: 424, anchorY: 610, size: 0.84, rot: -7, base: '#f7c0cb', accent: '#d66b88', light: '#fff0f1', seed: 77 },
  { anchorX: 576, anchorY: 610, size: 0.84, rot: 7, base: '#f6c9bf', accent: '#df7b89', light: '#fff2e9', seed: 88 },
  { anchorX: 500, anchorY: 660, size: 0.72, rot: 2, base: '#f9d6dd', accent: '#db7b95', light: '#fff7f6', seed: 99 },

  // Küçük denge çiçekleri; dışarı taşmasın diye içeri alındı.
  { anchorX: 344, anchorY: 618, size: 0.60, rot: -10, base: '#fff0ef', accent: '#e0929e', light: '#fffaf5', seed: 111 },
  { anchorX: 656, anchorY: 618, size: 0.60, rot: 10, base: '#f5abc0', accent: '#c95578', light: '#ffe9ee', seed: 122 },
];

const leafConfigs = [
  { x: 408, y: 664, rot: -42, s: .92 },
  { x: 592, y: 664, rot: 42, s: .92 },
  { x: 382, y: 590, rot: -62, s: .78 },
  { x: 618, y: 590, rot: 62, s: .78 },
  { x: 458, y: 722, rot: -25, s: .72 },
  { x: 542, y: 722, rot: 25, s: .72 },
  { x: 452, y: 535, rot: -18, s: .58 },
  { x: 548, y: 535, rot: 18, s: .58 },
  { x: 468, y: 438, rot: -126, s: .52 },
  { x: 532, y: 438, rot: 126, s: .52 },
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
  return '#' + [r, g, b]
    .map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0'))
    .join('');
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
  }, [
    el('feDropShadow', { dx: '0', dy: '11', stdDeviation: '10', 'flood-color': '#8e3659', 'flood-opacity': '0.17' })
  ]));

  defs.appendChild(el('filter', {
    id: 'leafShadow', x: '-30%', y: '-30%', width: '160%', height: '160%'
  }, [
    el('feDropShadow', { dx: '0', dy: '6', stdDeviation: '6', 'flood-color': '#315d3e', 'flood-opacity': '0.16' })
  ]));

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
  const c2y = endY + 150;
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
  // Çiçeğin sapla birleştiği yer: local origin yani anchor noktası.
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

  // Önce sapın ucundaki yeşil çanak çizilir.
  group.appendChild(makeCalyx(delay - .15));

  // Çiçek başı çanağın ÜSTÜNE kurulur.
  const bloom = el('g', { transform: 'translate(0 -62)' });

  for (let d = 0; d < 12; d++) {
    const angle = (360 / 12) * d + rand() * 10;
    const radius = 24 + rand() * 34;
    bloom.appendChild(el('circle', {
      class: 'construct-dot',
      cx: (Math.cos(angle * Math.PI / 180) * radius).toFixed(2),
      cy: (Math.sin(angle * Math.PI / 180) * radius).toFixed(2),
      r: (1.5 + rand() * 1.5).toFixed(2),
      style: { '--delay': `${delay - .15 + d * .014}s` }
    }));
  }

  const rings = [
    { count: 16, radius: 22, length: 86, width: 38, jitter: 8, yOffset: 5 },
    { count: 14, radius: 10, length: 70, width: 30, jitter: 10, yOffset: 0 },
    { count: 12, radius: 1, length: 54, width: 23, jitter: 13, yOffset: -3 },
    { count: 8, radius: -4, length: 38, width: 16, jitter: 16, yOffset: -5 }
  ];

  let petalNumber = 0;

  rings.forEach((ring, ringIndex) => {
    for (let i = 0; i < ring.count; i++) {
      const baseAngle = (360 / ring.count) * i + ringIndex * 13;
      const angle = baseAngle + (rand() - .5) * ring.jitter;
      const length = ring.length * (.9 + rand() * .18);
      const width = ring.width * (.86 + rand() * .2);
      const radius = ring.radius + (rand() - .5) * 5;
      const delayValue = delay + petalNumber * PETAL_STEP + ringIndex * .08;

      const wrapper = el('g', {
        transform: `rotate(${angle.toFixed(2)}) translate(0 ${(-radius + ring.yOffset).toFixed(2)})`
      });

      wrapper.appendChild(el('path', {
        class: `petal ${ringIndex >= 2 ? 'inner' : 'outer'}`,
        d: petalPath(length, width, rand()),
        fill: `url(#petalGrad-${index}-${ringIndex})`,
        style: { '--delay': `${delayValue}s` }
      }));

      if (rand() > .42) {
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

  for (let i = 0; i < 8; i++) {
    const angle = i * 45 + rand() * 16;
    const wrapper = el('g', { transform: `rotate(${angle}) translate(0 ${-6 - rand() * 6})` });

    wrapper.appendChild(el('path', {
      class: 'petal inner',
      d: petalPath(25 + rand() * 7, 9 + rand() * 4, rand()),
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
    d: 'M 248 566 C 330 626 420 704 500 790 C 580 704 670 626 752 566 C 738 742 682 944 602 1072 C 565 1092 526 1106 500 1110 C 474 1106 435 1092 398 1072 C 318 944 262 742 248 566 Z',
    fill: 'url(#paperGradient)',
    style: { '--delay': `${delay}s` }
  }));

  group.appendChild(el('path', {
    class: 'paper-piece paper-wing newspaper-paper',
    d: 'M 248 570 C 318 622 392 704 474 824 C 382 798 300 752 224 696 C 210 648 222 598 248 570 Z',
    fill: 'url(#paperLightGradient)',
    style: { '--delay': `${delay + .1}s` }
  }));

  group.appendChild(el('path', {
    class: 'paper-piece paper-wing newspaper-paper',
    d: 'M 752 570 C 682 622 608 704 526 824 C 618 798 700 752 776 696 C 790 648 778 598 752 570 Z',
    fill: 'url(#paperLightGradient)',
    style: { '--delay': `${delay + .14}s` }
  }));

  return group;
}

function addNewsLines(group, delay, side) {
  for (let i = 0; i < 9; i++) {
    const y = 708 + i * 18;
    const x1 = side === 'left' ? 304 + (i % 3) * 9 : 548 + (i % 3) * 7;
    const x2 = side === 'left' ? 458 - (i % 2) * 16 : 708 - (i % 2) * 14;

    group.appendChild(el('path', {
      class: 'news-line',
      d: `M ${x1} ${y} C ${(x1 + x2) / 2} ${y + 8}, ${(x1 + x2) / 2} ${y - 5}, ${x2} ${y + 2}`,
      fill: 'none',
      stroke: 'rgba(90,82,72,.28)',
      'stroke-width': i % 3 === 0 ? '2.05' : '1.28',
      'stroke-linecap': 'round',
      style: { '--delay': `${delay + .5 + i * .045}s` }
    }));
  }
}

function makePaperFront(delay) {
  const group = el('g', { id: 'paperFrontLayer' });

  group.appendChild(el('path', {
    class: 'paper-piece paper-front newspaper-paper',
    d: 'M 282 642 C 366 720 438 804 500 898 C 562 804 634 720 718 642 C 698 812 654 980 590 1080 C 555 1098 524 1108 500 1112 C 476 1108 445 1098 410 1080 C 346 980 302 812 282 642 Z',
    fill: 'url(#paperGradient)',
    style: { '--delay': `${delay + .18}s` }
  }));

  group.appendChild(el('path', {
    class: 'paper-piece paper-fold',
    d: 'M 282 642 C 360 716 430 802 500 898 C 442 878 382 832 306 776 C 290 732 281 688 282 642 Z',
    fill: 'rgba(255,255,255,.28)',
    style: { '--delay': `${delay + .32}s` }
  }));

  group.appendChild(el('path', {
    class: 'paper-piece paper-fold',
    d: 'M 718 642 C 640 716 570 802 500 898 C 558 878 618 832 694 776 C 710 732 719 688 718 642 Z',
    fill: 'rgba(92,83,72,.11)',
    style: { '--delay': `${delay + .36}s` }
  }));

  const folds = [
    'M 356 700 C 405 782 439 905 420 1040',
    'M 644 700 C 595 782 561 905 580 1040',
    'M 500 898 C 500 960 500 1020 500 1095',
    'M 326 690 C 400 765 448 828 500 898',
    'M 674 690 C 600 765 552 828 500 898'
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

  addNewsLines(group, delay, 'left');
  addNewsLines(group, delay, 'right');

  return group;
}

function makeRibbon(delay) {
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
    [300, 300, .55], [700, 306, .55], [262, 520, .45], [738, 520, .45],
    [405, 205, .42], [595, 205, .42], [500, 218, .48], [500, 724, .38]
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

  // Paper arkada; saplar üstünden büyür; ön paper sapların altını toplar.
  paperBackLayer.appendChild(makePaperBack(PAPER_START));

  flowers.forEach((flower, i) => {
    const startX = baseX + (i - 5) * 4.4;
    const bend = (flower.anchorX - baseX) * .36;
    const path = curvedStemPath(startX, baseY + (i % 3) * 6, flower.anchorX, flower.anchorY, bend);

    stemsLayer.appendChild(el('path', {
      class: 'stem-shadow',
      d: path,
      pathLength: '1',
      style: { '--delay': `${STEM_START + i * .045}s` }
    }));

    stemsLayer.appendChild(el('path', {
      class: 'stem',
      d: path,
      pathLength: '1',
      style: { '--delay': `${STEM_START + i * .045}s` }
    }));
  });

  leafConfigs.forEach((leaf, i) => {
    leavesLayer.appendChild(makeLeaf(leaf.x, leaf.y, leaf.rot, leaf.s, LEAF_START + i * .07));
  });

  paperFrontLayer.appendChild(makePaperFront(PAPER_START + .2));
  ribbonLayer.appendChild(makeRibbon(RIBBON_START));

  // Arkadaki üst çiçekler önce, öndekiler sonra çizilir.
  flowers
    .map((f, index) => ({ ...f, originalIndex: index }))
    .sort((a, b) => (a.anchorY + a.size * 100) - (b.anchorY + b.size * 100))
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
