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
  paperA: '#d8a977',
  paperB: '#f0d0a7',
  paperC: '#b98252',
};

// 11 şakayık burada. Pozisyon, boyut ve renkleri buradan değiştirilebilir.
const flowers = [
  { x: 500, y: 390, size: 1.22, rot: -2,  base: '#f4a7ba', accent: '#d75f83', light: '#ffe4ec', seed: 11 },
  { x: 415, y: 455, size: 1.08, rot: -9,  base: '#f7c0cb', accent: '#d66b88', light: '#fff0f1', seed: 22 },
  { x: 585, y: 455, size: 1.07, rot: 8,   base: '#f0a1b0', accent: '#c94e73', light: '#ffe0e5', seed: 33 },
  { x: 352, y: 378, size: 0.91, rot: -14, base: '#ffd1d7', accent: '#e4889b', light: '#fff6f3', seed: 44 },
  { x: 648, y: 378, size: 0.92, rot: 13,  base: '#ef98ac', accent: '#bb4768', light: '#ffdee8', seed: 55 },
  { x: 444, y: 292, size: 0.86, rot: 7,   base: '#f7b7c8', accent: '#d65b82', light: '#fff0f4', seed: 66 },
  { x: 556, y: 294, size: 0.86, rot: -7,  base: '#f6c9bf', accent: '#df7b89', light: '#fff2e9', seed: 77 },
  { x: 300, y: 492, size: 0.74, rot: -18, base: '#ffe1df', accent: '#e0929e', light: '#fff7f0', seed: 88 },
  { x: 700, y: 492, size: 0.74, rot: 18,  base: '#f5abc0', accent: '#c95578', light: '#ffe9ee', seed: 99 },
  { x: 348, y: 290, size: 0.68, rot: -13, base: '#f9d6dd', accent: '#db7b95', light: '#fff7f6', seed: 111 },
  { x: 652, y: 290, size: 0.68, rot: 13,  base: '#f3b0bf', accent: '#cc5f7c', light: '#ffe7ed', seed: 122 },
];

const leafConfigs = [
  { x: 406, y: 665, rot: -62, s: 1.25 }, { x: 601, y: 646, rot: 52, s: 1.2 },
  { x: 348, y: 585, rot: -82, s: 1.0 },  { x: 681, y: 585, rot: 82, s: 1.04 },
  { x: 462, y: 742, rot: -35, s: .9 },   { x: 562, y: 750, rot: 35, s: .92 },
  { x: 306, y: 474, rot: -118, s: .78 }, { x: 710, y: 462, rot: 116, s: .8 },
  { x: 430, y: 351, rot: -134, s: .72 }, { x: 570, y: 352, rot: 132, s: .72 },
  { x: 492, y: 618, rot: -12, s: .76 },  { x: 530, y: 605, rot: 18, s: .78 },
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
    el('stop', { offset: '0%', 'stop-color': '#f5d9b1' }),
    el('stop', { offset: '55%', 'stop-color': palette.paperA }),
    el('stop', { offset: '100%', 'stop-color': palette.paperC }),
  ]));

  defs.appendChild(el('linearGradient', { id: 'paperLightGradient', x1: '0', y1: '0', x2: '1', y2: '1' }, [
    el('stop', { offset: '0%', 'stop-color': '#fff0d2' }),
    el('stop', { offset: '64%', 'stop-color': palette.paperB }),
    el('stop', { offset: '100%', 'stop-color': '#c89563' }),
  ]));

  defs.appendChild(el('linearGradient', { id: 'paperShadowGradient', x1: '0', y1: '0', x2: '0', y2: '1' }, [
    el('stop', { offset: '0%', 'stop-color': 'rgba(122,75,38,0.05)' }),
    el('stop', { offset: '100%', 'stop-color': 'rgba(122,75,38,0.28)' }),
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
  const c1x = startX + bend * 0.4;
  const c1y = startY - 220;
  const c2x = endX - bend;
  const c2y = endY + 210;
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

function makeSepal(delay) {
  // Sapın çiçeğe bağlandığı görünür alt çanak.
  // Bilerek petallerden SONRA çiziliyor; böylece çiçek dalın üstüne oturmuş görünür.
  const group = el('g', { class: 'calyx-cover', transform: 'translate(0 78)' });

  group.appendChild(el('path', {
    class: 'flower-neck',
    d: 'M 0 62 C -2 44, -1 24, 0 7',
    style: { '--delay': `${delay + 0.08}s` }
  }));

  const angles = [-62, -36, -14, 14, 36, 62];
  angles.forEach((angle, i) => {
    group.appendChild(el('path', {
      class: 'sepal',
      d: 'M 0 10 C -11 -10 -8 -35 0 -56 C 11 -35 12 -10 0 10 Z',
      fill: i % 2 ? '#4f7449' : '#678852',
      transform: `rotate(${angle}) translate(0 1)`,
      style: { '--delay': `${delay + 0.14 + i * 0.035}s` }
    }));
  });

  group.appendChild(el('ellipse', {
    class: 'sepal',
    cx: '0',
    cy: '18',
    rx: '26',
    ry: '12',
    fill: '#55784c',
    style: { '--delay': `${delay + 0.22}s` }
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

  group.appendChild(makeSepal(delay + 0.25));

  return group;
}

function makeRibbon(delay) {
  // Craft kağıdının üstünde sadece buketi bağlayan kısa ve zarif bir kurdele.
  const group = el('g', { transform: 'translate(500 870)' });

  group.appendChild(el('path', {
    class: 'bow-piece',
    d: 'M -24 0 C -92 -35 -126 -5 -112 31 C -74 45 -42 28 -12 8 Z',
    fill: 'url(#ribbonGradient)',
    style: { '--delay': `${delay}s` }
  }));
  group.appendChild(el('path', {
    class: 'bow-piece',
    d: 'M 24 0 C 92 -35 126 -5 112 31 C 74 45 42 28 12 8 Z',
    fill: 'url(#ribbonGradient)',
    style: { '--delay': `${delay + 0.08}s` }
  }));
  group.appendChild(el('ellipse', {
    class: 'knot',
    cx: '0', cy: '7', rx: '34', ry: '23',
    fill: '#c34b70',
    style: { '--delay': `${delay + 0.16}s` }
  }));
  group.appendChild(el('path', {
    class: 'ribbon-piece',
    d: 'M -27 25 C -36 72 -54 103 -72 132 C -42 120 -17 95 -2 55 C 10 94 34 120 66 134 C 51 96 39 70 28 25 Z',
    fill: 'url(#ribbonGradient)',
    opacity: '0.92',
    style: { '--delay': `${delay + 0.22}s` }
  }));
  group.appendChild(el('path', {
    class: 'ribbon-piece',
    d: 'M -86 11 C -52 27 -22 26 -4 9',
    fill: 'none',
    stroke: 'rgba(255,255,255,.45)',
    'stroke-width': '4.2',
    'stroke-linecap': 'round',
    style: { '--delay': `${delay + 0.32}s` }
  }));
  group.appendChild(el('path', {
    class: 'ribbon-piece',
    d: 'M 86 11 C 52 27 22 26 4 9',
    fill: 'none',
    stroke: 'rgba(255,255,255,.42)',
    'stroke-width': '4.2',
    'stroke-linecap': 'round',
    style: { '--delay': `${delay + 0.36}s` }
  }));
  return group;
}

function makeCraftPaperBack(delay) {
  const group = el('g', { id: 'paperBackLayer', transform: 'translate(0 0)' });

  group.appendChild(el('path', {
    class: 'paper-piece paper-back',
    d: 'M 268 612 C 345 666 423 712 500 790 C 578 710 657 666 734 612 C 705 782 664 947 594 1068 C 556 1091 522 1102 500 1106 C 478 1102 444 1091 406 1068 C 336 947 296 782 268 612 Z',
    fill: 'url(#paperGradient)',
    style: { '--delay': `${delay}s` }
  }));

  group.appendChild(el('path', {
    class: 'paper-piece paper-wing',
    d: 'M 258 615 C 325 660 392 722 469 824 C 399 798 328 762 244 716 C 226 684 231 646 258 615 Z',
    fill: 'url(#paperLightGradient)',
    style: { '--delay': `${delay + 0.1}s` }
  }));

  group.appendChild(el('path', {
    class: 'paper-piece paper-wing',
    d: 'M 742 615 C 675 660 608 722 531 824 C 601 798 672 762 756 716 C 774 684 769 646 742 615 Z',
    fill: 'url(#paperLightGradient)',
    style: { '--delay': `${delay + 0.14}s` }
  }));

  return group;
}

function makeCraftPaperFront(delay) {
  const group = el('g', { id: 'paperFrontLayer', transform: 'translate(0 0)' });

  group.appendChild(el('path', {
    class: 'paper-piece paper-front',
    d: 'M 289 676 C 368 746 438 811 500 898 C 562 811 632 746 711 676 C 691 831 647 986 586 1080 C 552 1096 521 1105 500 1108 C 479 1105 448 1096 414 1080 C 353 986 309 831 289 676 Z',
    fill: 'url(#paperGradient)',
    style: { '--delay': `${delay + 0.2}s` }
  }));

  group.appendChild(el('path', {
    class: 'paper-piece paper-fold',
    d: 'M 289 676 C 360 742 430 807 500 898 C 452 883 392 844 323 792 C 301 754 290 716 289 676 Z',
    fill: 'rgba(255,246,226,0.33)',
    style: { '--delay': `${delay + 0.34}s` }
  }));

  group.appendChild(el('path', {
    class: 'paper-piece paper-fold',
    d: 'M 711 676 C 640 742 570 807 500 898 C 548 883 608 844 677 792 C 699 754 710 716 711 676 Z',
    fill: 'rgba(134,84,44,0.12)',
    style: { '--delay': `${delay + 0.38}s` }
  }));

  const lines = [
    'M 350 724 C 405 787 446 888 424 1040',
    'M 650 724 C 595 787 554 888 576 1040',
    'M 500 898 C 500 958 500 1015 500 1094',
    'M 312 706 C 404 785 448 835 500 898',
    'M 688 706 C 596 785 552 835 500 898',
  ];

  lines.forEach((d, i) => {
    group.appendChild(el('path', {
      class: 'paper-line',
      d,
      fill: 'none',
      stroke: i === 2 ? 'rgba(122,75,38,.18)' : 'rgba(255,248,232,.32)',
      'stroke-width': i === 2 ? '2.2' : '2.8',
      'stroke-linecap': 'round',
      style: { '--delay': `${delay + 0.52 + i * 0.07}s` }
    }));
  });

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
  const baseY = 1016;

  flowers.forEach((flower, i) => {
    const startX = baseX + (i - 5) * 6;
    const bend = (flower.x - 500) * 0.62;
    // Sap ucu çiçeğin alt çanak yaprağına bağlanıyor.
    // Bu değer çiçek grubu içindeki makeSepal translate(0 78) ile uyumlu.
    const stemEndY = flower.y + 142 * flower.size;
    const path = curvedStemPath(startX, baseY + (i % 3) * 8, flower.x, stemEndY, bend);
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
