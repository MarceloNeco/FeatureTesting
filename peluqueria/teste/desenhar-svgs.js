// Gera os 12 cenários e os 12 itens em vetor da Peluqueria (cenarios/*.svg, itens/*.svg e os dois .json).
// Rodar de FeatureTesting/: node peluqueria/teste/desenhar-svgs.js
// Desenhos próprios, liberados junto com o código. Estilo da Bagunçolândia: formas cheias, gradiente,
// contorno escuro, brilho branco e olhos com reflexo.
const fs = require('fs');
const path = require('path');
const pasta = path.resolve(__dirname, '..');
const K = '#1b1030', SW = 8;

const lg = (id, a, b, x2 = 0, y2 = 1) => `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>`;
const rg = (id, a, b, cx = 0.4, cy = 0.35, r = 0.75) => `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></radialGradient>`;
const svg = (w, h, defs, corpo) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}"><defs>${defs}</defs>${corpo}</svg>\n`;
const st = (w = SW) => `stroke="${K}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
function olho(cx, cy, r, iris = '#3a2a1a', olhar = 0) {
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#fff" ${st(6)}/>` +
    `<circle cx="${cx + olhar}" cy="${cy + r * 0.12}" r="${r * 0.58}" fill="${iris}"/>` +
    `<circle cx="${cx + olhar}" cy="${cy + r * 0.12}" r="${r * 0.3}" fill="${K}"/>` +
    `<circle cx="${cx + olhar - r * 0.22}" cy="${cy - r * 0.15}" r="${r * 0.18}" fill="#fff"/>`;
}
const brilho = (d, w = 14, op = 0.55) => `<path d="${d}" fill="none" stroke="#fff" stroke-opacity="${op}" stroke-width="${w}" stroke-linecap="round"/>`;
const sorriso = (cx, cy, w, h, lingua) => `<path d="M${cx - w / 2} ${cy} Q${cx} ${cy + h} ${cx + w / 2} ${cy}" fill="${lingua ? '#7a1f3d' : 'none'}" ${st(7)}/>` +
  (lingua ? `<path d="M${cx - w * 0.18} ${cy + h * 0.38} Q${cx} ${cy + h * 0.8} ${cx + w * 0.18} ${cy + h * 0.38} Z" fill="#ff6b8a"/>` : '');
const bochecha = (cx, cy, r = 26) => `<ellipse cx="${cx}" cy="${cy}" rx="${r}" ry="${r * 0.65}" fill="#ff7aa8" opacity=".45"/>`;
function estrelas(n, semente, ymax = 500, cor = '#fff') {
  let s = semente, r = '';
  const rnd = () => (s = (s * 9301 + 49297) % 233280) / 233280;
  for (let i = 0; i < n; i++) r += `<circle cx="${(rnd() * 1000).toFixed(0)}" cy="${(rnd() * ymax).toFixed(0)}" r="${(2 + rnd() * 4).toFixed(1)}" fill="${cor}" opacity="${(0.4 + rnd() * 0.6).toFixed(2)}"/>`;
  return r;
}
function bolhas(n, semente) {
  let s = semente, r = '';
  const rnd = () => (s = (s * 9301 + 49297) % 233280) / 233280;
  for (let i = 0; i < n; i++) { const x = rnd() * 1000, y = rnd() * 1000, rr = 6 + rnd() * 18; r += `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${rr.toFixed(0)}" fill="none" stroke="#bff6ff" stroke-width="4" opacity=".55"/>`; }
  return r;
}

/* ---------------------------- cenários ---------------------------- */
const C = {};

C.cachorro = {
  nome: { pt: 'Cachorro', en: 'Dog' },
  lugares: { cabeca: { x: 0.5, y: 0.25, tam: 0.42 }, olhos: { x: 0.5, y: 0.43, tam: 0.34 }, nariz: { x: 0.5, y: 0.535, tam: 0.09 }, boca: { x: 0.5, y: 0.62, tam: 0.22 } },
  svg: () => svg(1000, 1000,
    lg('ceu', '#7fd3ff', '#d9f4ff') + lg('grama', '#7ad957', '#3e9a35') + rg('pelo', '#d9965a', '#9a5a2a') + rg('focinho', '#fff3e0', '#f0d2a8') + lg('orelha', '#7a4320', '#4e2810'),
    `<rect width="1000" height="1000" fill="url(#ceu)"/><circle cx="840" cy="150" r="70" fill="#fff2a8"/>` +
    `<ellipse cx="200" cy="170" rx="110" ry="40" fill="#fff" opacity=".9"/><ellipse cx="270" cy="150" rx="70" ry="40" fill="#fff" opacity=".9"/>` +
    `<path d="M0 760 Q250 700 500 740 T1000 730 V1000 H0 Z" fill="url(#grama)"/>` +
    `<path d="M300 1000 Q300 800 500 790 Q700 800 700 1000 Z" fill="url(#pelo)" ${st()}/>` +
    `<path d="M285 330 Q200 330 190 470 Q185 600 260 640 Q310 560 320 420 Z" fill="url(#orelha)" ${st()}/>` +
    `<path d="M715 330 Q800 330 810 470 Q815 600 740 640 Q690 560 680 420 Z" fill="url(#orelha)" ${st()}/>` +
    `<ellipse cx="500" cy="470" rx="230" ry="240" fill="url(#pelo)" ${st()}/>` +
    brilho('M380 300 Q440 255 520 255') +
    `<ellipse cx="500" cy="590" rx="140" ry="105" fill="url(#focinho)" ${st()}/>` +
    olho(415, 430, 42, '#5a3410', 4) + olho(585, 430, 42, '#5a3410', -4) +
    `<path d="M380 380 Q415 360 450 378" fill="none" ${st(7)}/><path d="M550 378 Q585 360 620 380" fill="none" ${st(7)}/>` +
    `<ellipse cx="500" cy="535" rx="44" ry="32" fill="${K}"/><ellipse cx="488" cy="525" rx="12" ry="7" fill="#fff" opacity=".7"/>` +
    `<path d="M500 567 V600" ${st(7)}/>` + sorriso(500, 605, 140, 70, true) + bochecha(380, 560) + bochecha(620, 560))
};

C.gato = {
  nome: { pt: 'Gato', en: 'Cat' },
  lugares: { cabeca: { x: 0.5, y: 0.27, tam: 0.4 }, olhos: { x: 0.5, y: 0.45, tam: 0.36 }, nariz: { x: 0.5, y: 0.535, tam: 0.07 }, boca: { x: 0.5, y: 0.6, tam: 0.18 } },
  svg: () => svg(1000, 1000,
    lg('parede', '#5b3fa6', '#2b1f63') + rg('pelo', '#ffb066', '#e07a1f') + lg('almofada', '#ff4fa3', '#b62a74') + rg('rosto', '#fff4e6', '#ffd9b0'),
    `<rect width="1000" height="1000" fill="url(#parede)"/>` +
    `<g opacity=".18" fill="#fff">${Array.from({ length: 6 }, (_, i) => `<circle cx="${80 + i * 170}" cy="${120 + (i % 2) * 90}" r="18"/>`).join('')}</g>` +
    `<rect x="60" y="120" width="190" height="240" rx="16" fill="#ffd166" ${st()}/><rect x="85" y="145" width="140" height="190" rx="8" fill="#3ee8ff"/>` +
    `<path d="M0 830 Q500 760 1000 830 V1000 H0 Z" fill="url(#almofada)" ${st()}/>` +
    `<path d="M320 1000 Q320 790 500 785 Q680 790 680 1000 Z" fill="url(#pelo)" ${st()}/>` +
    `<path d="M300 400 L300 175 L440 300 Z" fill="url(#pelo)" ${st()}/><path d="M330 330 L330 225 L400 300 Z" fill="#ff9ec7"/>` +
    `<path d="M700 400 L700 175 L560 300 Z" fill="url(#pelo)" ${st()}/><path d="M670 330 L670 225 L600 300 Z" fill="#ff9ec7"/>` +
    `<ellipse cx="500" cy="480" rx="230" ry="210" fill="url(#pelo)" ${st()}/>` +
    `<path d="M440 290 L455 350 M500 280 V345 M560 290 L545 350" stroke="#b85e10" stroke-width="12" stroke-linecap="round"/>` +
    `<ellipse cx="500" cy="580" rx="120" ry="80" fill="url(#rosto)"/>` +
    `<ellipse cx="410" cy="450" rx="46" ry="52" fill="#d6ff7a" ${st(6)}/><ellipse cx="410" cy="455" rx="14" ry="38" fill="${K}"/><circle cx="398" cy="432" r="9" fill="#fff"/>` +
    `<ellipse cx="590" cy="450" rx="46" ry="52" fill="#d6ff7a" ${st(6)}/><ellipse cx="590" cy="455" rx="14" ry="38" fill="${K}"/><circle cx="578" cy="432" r="9" fill="#fff"/>` +
    `<path d="M478 522 H522 L500 548 Z" fill="#ff6b9a" ${st(5)}/>` +
    `<path d="M500 548 V570 M500 570 Q470 600 445 578 M500 570 Q530 600 555 578" fill="none" ${st(7)}/>` +
    `<path d="M380 560 H260 M380 585 L265 610 M620 560 H740 M620 585 L735 610" stroke="${K}" stroke-width="5" stroke-linecap="round"/>` +
    bochecha(370, 540) + bochecha(630, 540) + brilho('M360 330 Q420 290 480 290'))
};

C.tubarao = {
  nome: { pt: 'Tubarão', en: 'Shark' },
  lugares: { cabeca: { x: 0.5, y: 0.3, tam: 0.38 }, olhos: { x: 0.5, y: 0.44, tam: 0.42 }, nariz: { x: 0.5, y: 0.52, tam: 0.08 }, boca: { x: 0.5, y: 0.64, tam: 0.3 } },
  svg: () => svg(1000, 1000,
    lg('mar', '#2fb6e8', '#0b2f6b') + rg('pele', '#9fb7cc', '#5b7590') + rg('barriga', '#ffffff', '#dfe8ef') + lg('areia', '#ffe3a3', '#e2b766'),
    `<rect width="1000" height="1000" fill="url(#mar)"/>` +
    `<g fill="#fff" opacity=".12"><path d="M100 0 L220 0 L520 1000 L400 1000 Z"/><path d="M600 0 L680 0 L880 1000 L800 1000 Z"/></g>` +
    bolhas(18, 11) +
    `<path d="M0 900 Q250 850 500 890 T1000 880 V1000 H0 Z" fill="url(#areia)"/>` +
    `<path d="M120 900 Q140 800 110 720 M160 900 Q190 820 170 760" fill="none" stroke="#2fbf71" stroke-width="18" stroke-linecap="round"/>` +
    `<path d="M440 330 L500 120 L575 330 Z" fill="url(#pele)" ${st()}/>` +
    `<path d="M210 650 Q120 700 80 790 Q190 760 280 720 Z" fill="url(#pele)" ${st()}/><path d="M790 650 Q880 700 920 790 Q810 760 720 720 Z" fill="url(#pele)" ${st()}/>` +
    `<path d="M500 300 C700 300 790 450 790 600 C790 760 660 860 500 860 C340 860 210 760 210 600 C210 450 300 300 500 300 Z" fill="url(#pele)" ${st()}/>` +
    `<path d="M300 650 Q500 600 700 650 Q680 820 500 840 Q320 820 300 650 Z" fill="url(#barriga)"/>` +
    `<path d="M300 520 L330 540 M300 560 L330 575 M700 520 L670 540 M700 560 L670 575" stroke="${K}" stroke-width="6" stroke-linecap="round"/>` +
    olho(370, 440, 40, '#1b4f7a', 6) + olho(630, 440, 40, '#1b4f7a', -6) +
    `<ellipse cx="470" cy="520" rx="9" ry="6" fill="${K}"/><ellipse cx="530" cy="520" rx="9" ry="6" fill="${K}"/>` +
    `<path d="M400 630 Q500 700 600 630" fill="#fff" ${st(7)}/>` +
    brilho('M330 360 Q400 320 470 315'))
};

C.bebe = {
  nome: { pt: 'Bebê', en: 'Baby' },
  lugares: { cabeca: { x: 0.5, y: 0.235, tam: 0.42 }, olhos: { x: 0.5, y: 0.47, tam: 0.36 }, nariz: { x: 0.5, y: 0.55, tam: 0.07 }, boca: { x: 0.5, y: 0.625, tam: 0.16 } },
  svg: () => svg(1000, 1000,
    lg('quarto', '#ffd9ec', '#ffb3d6') + rg('pele', '#ffe2c6', '#f2b98c') + lg('roupa', '#3ee8ff', '#1aa6c9'),
    `<rect width="1000" height="1000" fill="url(#quarto)"/>` +
    `<g opacity=".5">${Array.from({ length: 5 }, (_, i) => `<path d="M${60 + i * 220} 120 l14 30 33 4 -24 22 6 33 -29 -16 -29 16 6 -33 -24 -22 33 -4z" fill="#ffd166"/>`).join('')}</g>` +
    `<g ${st(6)}><circle cx="140" cy="760" r="70" fill="#c6ff3d"/><circle cx="860" cy="770" r="60" fill="#ff4fa3"/></g>` +
    `<path d="M280 1000 Q290 780 500 770 Q710 780 720 1000 Z" fill="url(#roupa)" ${st()}/>` +
    `<circle cx="500" cy="880" r="34" fill="#fff" ${st(6)}/>` +
    `<ellipse cx="270" cy="490" rx="50" ry="62" fill="url(#pele)" ${st()}/><ellipse cx="730" cy="490" rx="50" ry="62" fill="url(#pele)" ${st()}/>` +
    `<ellipse cx="500" cy="480" rx="245" ry="250" fill="url(#pele)" ${st()}/>` +
    `<path d="M470 245 Q500 180 545 215 Q560 250 520 255" fill="none" stroke="#8a5a2b" stroke-width="12" stroke-linecap="round"/>` +
    olho(420, 470, 40, '#3a6fd1') + olho(580, 470, 40, '#3a6fd1') +
    `<path d="M380 425 Q420 405 455 420 M545 420 Q580 405 620 425" fill="none" stroke="#c48a5a" stroke-width="6" stroke-linecap="round"/>` +
    `<ellipse cx="500" cy="548" rx="22" ry="16" fill="#f0a87a"/>` +
    `<path d="M455 615 Q500 655 545 615" fill="#c2405e" ${st(6)}/>` +
    bochecha(370, 570, 34) + bochecha(630, 570, 34) + brilho('M370 300 Q430 260 500 255'))
};

C.vovo = {
  nome: { pt: 'Vovô', en: 'Grandpa' },
  lugares: { cabeca: { x: 0.5, y: 0.24, tam: 0.38 }, olhos: { x: 0.5, y: 0.44, tam: 0.33 }, nariz: { x: 0.5, y: 0.53, tam: 0.08 }, boca: { x: 0.5, y: 0.625, tam: 0.18 } },
  svg: () => svg(1000, 1000,
    lg('sala', '#ffcf8a', '#e8955a') + rg('pele', '#ffd6b5', '#e0a27c') + lg('blusa', '#5a7bd8', '#34479c') + lg('poltrona', '#b5302f', '#7a1c1c'),
    `<rect width="1000" height="1000" fill="url(#sala)"/>` +
    `<rect x="700" y="90" width="220" height="280" rx="12" fill="#fff6e0" ${st()}/><path d="M720 340 L790 220 L850 300 L900 240 V340 Z" fill="#7ad957"/><circle cx="860" cy="160" r="26" fill="#ffd166"/>` +
    `<path d="M140 1000 V430 Q140 330 260 330 H740 Q860 330 860 430 V1000 Z" fill="url(#poltrona)" ${st()}/>` +
    `<path d="M290 1000 Q300 790 500 780 Q700 790 710 1000 Z" fill="url(#blusa)" ${st()}/><path d="M450 785 L500 860 L550 785" fill="#fff" ${st(6)}/>` +
    `<ellipse cx="295" cy="470" rx="42" ry="58" fill="url(#pele)" ${st()}/><ellipse cx="705" cy="470" rx="42" ry="58" fill="url(#pele)" ${st()}/>` +
    `<ellipse cx="500" cy="470" rx="215" ry="235" fill="url(#pele)" ${st()}/>` +
    `<path d="M290 420 Q280 330 340 300 Q320 360 350 410 Z M710 420 Q720 330 660 300 Q680 360 650 410 Z" fill="#f2f2f2" ${st(6)}/>` +
    `<path d="M420 300 Q500 285 580 300 M430 330 Q500 318 570 330" fill="none" stroke="#c98b66" stroke-width="5" stroke-linecap="round"/>` +
    olho(425, 445, 32, '#4a7a4a') + olho(575, 445, 32, '#4a7a4a') +
    `<path d="M380 395 Q425 370 465 392 M535 392 Q575 370 620 395" fill="none" stroke="#e6e6e6" stroke-width="16" stroke-linecap="round"/>` +
    `<path d="M380 470 l-25 12 M620 470 l25 12" stroke="#c98b66" stroke-width="5" stroke-linecap="round"/>` +
    `<path d="M485 470 Q470 540 500 548 Q530 540 515 470" fill="#f0b08a" ${st(6)}/>` +
    sorriso(500, 615, 120, 40) + bochecha(380, 560) + bochecha(620, 560) + brilho('M400 285 Q450 262 510 262'))
};

C.coruja = {
  nome: { pt: 'Coruja', en: 'Owl' },
  lugares: { cabeca: { x: 0.5, y: 0.25, tam: 0.42 }, olhos: { x: 0.5, y: 0.42, tam: 0.44 }, nariz: { x: 0.5, y: 0.52, tam: 0.07 }, boca: { x: 0.5, y: 0.6, tam: 0.14 } },
  svg: () => svg(1000, 1000,
    lg('noite', '#0b0a1f', '#2a2070') + rg('penas', '#b07a4a', '#6e4320') + rg('peito', '#f3dcb5', '#d4ad78') + lg('galho', '#7a4a26', '#4e2c12'),
    `<rect width="1000" height="1000" fill="url(#noite)"/>` + estrelas(60, 5, 700) +
    `<circle cx="820" cy="170" r="90" fill="#fff4c2"/><circle cx="790" cy="150" r="16" fill="#e8dca0"/><circle cx="845" cy="200" r="11" fill="#e8dca0"/>` +
    `<path d="M0 860 Q500 820 1000 870 L1000 910 Q500 870 0 905 Z" fill="url(#galho)" ${st()}/>` +
    `<ellipse cx="500" cy="600" rx="260" ry="300" fill="url(#penas)" ${st()}/>` +
    `<ellipse cx="500" cy="700" rx="160" ry="180" fill="url(#peito)"/>` +
    `<g fill="none" stroke="#a98458" stroke-width="6" stroke-linecap="round">${[640, 700, 760].map(y => `<path d="M420 ${y} q20 18 40 0 q20 18 40 0 q20 18 40 0 q20 18 40 0"/>`).join('')}</g>` +
    `<path d="M300 330 L270 190 L390 290 Z M700 330 L730 190 L610 290 Z" fill="url(#penas)" ${st()}/>` +
    `<circle cx="390" cy="420" r="92" fill="#ffd166" ${st()}/><circle cx="610" cy="420" r="92" fill="#ffd166" ${st()}/>` +
    olho(390, 420, 62, '#ff8a1f') + olho(610, 420, 62, '#ff8a1f') +
    `<path d="M470 480 L530 480 L500 545 Z" fill="#ffb02e" ${st(6)}/>` +
    `<path d="M465 600 Q500 625 535 600" fill="none" ${st(6)}/>` +
    `<path d="M440 875 v25 M470 875 v28 M530 875 v28 M560 875 v25" stroke="#ffb02e" stroke-width="14" stroke-linecap="round"/>` +
    brilho('M330 360 Q350 330 380 325', 10))
};

C.leao = {
  nome: { pt: 'Leão', en: 'Lion' },
  lugares: { cabeca: { x: 0.5, y: 0.29, tam: 0.38 }, olhos: { x: 0.5, y: 0.44, tam: 0.32 }, nariz: { x: 0.5, y: 0.53, tam: 0.09 }, boca: { x: 0.5, y: 0.615, tam: 0.18 } },
  svg: () => svg(1000, 1000,
    lg('por', '#ff9a4d', '#ffd166') + rg('juba', '#d1611f', '#8a3410') + rg('pelo', '#ffd27a', '#e8a33a') + lg('chao', '#e8b45a', '#b9802e'),
    `<rect width="1000" height="1000" fill="url(#por)"/><circle cx="500" cy="760" r="300" fill="#fff0a8" opacity=".6"/>` +
    `<path d="M0 820 Q500 780 1000 820 V1000 H0 Z" fill="url(#chao)"/>` +
    `<path d="M80 820 V700 M70 700 Q80 620 150 640 Q90 650 80 700 M80 700 Q60 640 20 650" fill="none" stroke="#5a3a1a" stroke-width="12" stroke-linecap="round"/>` +
    `<path d="M320 1000 Q330 800 500 790 Q670 800 680 1000 Z" fill="url(#pelo)" ${st()}/>` +
    `<g fill="url(#juba)" ${st()}>${Array.from({ length: 14 }, (_, i) => { const a = i / 14 * Math.PI * 2, x = 500 + Math.cos(a) * 270, y = 480 + Math.sin(a) * 270; return `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="95"/>`; }).join('')}</g>` +
    `<circle cx="500" cy="480" r="290" fill="url(#juba)"/>` +
    `<circle cx="345" cy="300" r="48" fill="url(#pelo)" ${st()}/><circle cx="655" cy="300" r="48" fill="url(#pelo)" ${st()}/>` +
    `<ellipse cx="500" cy="490" rx="200" ry="205" fill="url(#pelo)" ${st()}/>` +
    olho(430, 440, 34, '#8a5a10') + olho(570, 440, 34, '#8a5a10') +
    `<ellipse cx="500" cy="580" rx="90" ry="62" fill="#fff1d0"/>` +
    `<path d="M465 520 H535 Q535 555 500 565 Q465 555 465 520 Z" fill="#7a3a1f" ${st(6)}/>` +
    `<path d="M500 565 V590 M500 590 Q470 625 440 600 M500 590 Q530 625 560 600" fill="none" ${st(7)}/>` +
    `<g fill="${K}"><circle cx="440" cy="575" r="5"/><circle cx="420" cy="590" r="5"/><circle cx="560" cy="575" r="5"/><circle cx="580" cy="590" r="5"/></g>` +
    brilho('M390 320 Q440 295 500 293'))
};

C.robo = {
  nome: { pt: 'Robô', en: 'Robot' },
  lugares: { cabeca: { x: 0.5, y: 0.26, tam: 0.44 }, olhos: { x: 0.5, y: 0.43, tam: 0.38 }, nariz: { x: 0.5, y: 0.53, tam: 0.07 }, boca: { x: 0.5, y: 0.625, tam: 0.24 } },
  svg: () => svg(1000, 1000,
    lg('fundo', '#120f3a', '#2a1f6e') + lg('metal', '#e6ecf5', '#8f9db3', 1, 1) + lg('corpo', '#c7d2e2', '#7b88a0'),
    `<rect width="1000" height="1000" fill="url(#fundo)"/>` +
    `<g stroke="#3ee8ff" stroke-opacity=".18" stroke-width="3">${Array.from({ length: 11 }, (_, i) => `<path d="M${i * 100} 0 V1000 M0 ${i * 100} H1000"/>`).join('')}</g>` +
    `<path d="M300 1000 V810 Q300 770 340 770 H660 Q700 770 700 810 V1000 Z" fill="url(#corpo)" ${st()}/>` +
    `<circle cx="420" cy="880" r="22" fill="#ff4fa3" ${st(5)}/><circle cx="500" cy="880" r="22" fill="#c6ff3d" ${st(5)}/><circle cx="580" cy="880" r="22" fill="#3ee8ff" ${st(5)}/>` +
    `<rect x="460" y="720" width="80" height="60" fill="#8f9db3" ${st()}/>` +
    `<path d="M500 260 V160" ${st(10)}/><circle cx="500" cy="145" r="28" fill="#ff4fa3" ${st(6)}/>` +
    `<rect x="250" y="440" width="40" height="120" rx="10" fill="#8f9db3" ${st()}/><rect x="710" y="440" width="40" height="120" rx="10" fill="#8f9db3" ${st()}/>` +
    `<rect x="280" y="260" width="440" height="470" rx="60" fill="url(#metal)" ${st()}/>` +
    `<g fill="#8f9db3"><circle cx="315" cy="295" r="9"/><circle cx="685" cy="295" r="9"/><circle cx="315" cy="695" r="9"/><circle cx="685" cy="695" r="9"/></g>` +
    `<rect x="330" y="360" width="340" height="140" rx="40" fill="#14123a" ${st(6)}/>` +
    `<circle cx="415" cy="430" r="44" fill="#3ee8ff"/><circle cx="415" cy="430" r="20" fill="#e8ffff"/><circle cx="585" cy="430" r="44" fill="#3ee8ff"/><circle cx="585" cy="430" r="20" fill="#e8ffff"/>` +
    `<circle cx="500" cy="530" r="18" fill="#ffd166" ${st(5)}/>` +
    `<rect x="380" y="595" width="240" height="60" rx="14" fill="#14123a" ${st(6)}/>` +
    `<path d="M410 625 H590" stroke="#c6ff3d" stroke-width="8" stroke-linecap="round" stroke-dasharray="20 14"/>` +
    brilho('M320 300 Q360 285 420 285', 12))
};

C.sapo = {
  nome: { pt: 'Sapo', en: 'Frog' },
  lugares: { cabeca: { x: 0.5, y: 0.31, tam: 0.3 }, olhos: { x: 0.5, y: 0.37, tam: 0.5 }, nariz: { x: 0.5, y: 0.5, tam: 0.07 }, boca: { x: 0.5, y: 0.585, tam: 0.34 } },
  svg: () => svg(1000, 1000,
    lg('lago', '#8fe3ff', '#2c8fb8') + rg('pele', '#9cf26b', '#3fa82d') + rg('barriga', '#f4ffcc', '#d4f08a') + lg('folha', '#4fc85a', '#2a7a32'),
    `<rect width="1000" height="1000" fill="url(#lago)"/>` +
    `<g fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="5"><ellipse cx="180" cy="300" rx="90" ry="20"/><ellipse cx="820" cy="380" rx="70" ry="16"/></g>` +
    `<path d="M120 520 Q60 460 140 420 Q220 400 230 470 L170 470 Z" fill="url(#folha)" ${st(6)}/><circle cx="880" cy="230" r="34" fill="#ff8ccb" ${st(5)}/>` +
    `<path d="M80 900 A420 110 0 1 1 920 900 A420 110 0 1 1 80 900 Z" fill="url(#folha)" ${st()}/><path d="M500 900 L760 820" ${st(6)}/>` +
    `<path d="M250 880 Q250 690 500 680 Q750 690 750 880 Z" fill="url(#pele)" ${st()}/>` +
    `<ellipse cx="500" cy="810" rx="160" ry="80" fill="url(#barriga)"/>` +
    `<ellipse cx="500" cy="520" rx="290" ry="200" fill="url(#pele)" ${st()}/>` +
    `<circle cx="365" cy="370" r="88" fill="url(#pele)" ${st()}/><circle cx="635" cy="370" r="88" fill="url(#pele)" ${st()}/>` +
    olho(365, 370, 60, '#2a5a1a') + olho(635, 370, 60, '#2a5a1a') +
    `<circle cx="480" cy="500" r="7" fill="${K}"/><circle cx="520" cy="500" r="7" fill="${K}"/>` +
    `<path d="M330 570 Q500 650 670 570" fill="#c2405e" ${st(7)}/>` +
    bochecha(320, 540, 32) + bochecha(680, 540, 32) + brilho('M300 330 Q320 300 350 296', 10))
};

C.cavalo = {
  nome: { pt: 'Cavalo', en: 'Horse' },
  lugares: { cabeca: { x: 0.5, y: 0.2, tam: 0.3 }, olhos: { x: 0.5, y: 0.36, tam: 0.4 }, nariz: { x: 0.5, y: 0.63, tam: 0.1 }, boca: { x: 0.5, y: 0.72, tam: 0.16 } },
  svg: () => svg(1000, 1000,
    lg('ceu', '#ffe08a', '#ffb36b') + rg('pelo', '#a8693a', '#6e3f1d') + lg('focinho', '#e8c7a0', '#c9a07a') + lg('crina', '#3a2414', '#1e1208') + lg('campo', '#c6ff3d', '#6fbf3a'),
    `<rect width="1000" height="1000" fill="url(#ceu)"/>` +
    `<path d="M0 780 Q300 720 600 760 T1000 740 V1000 H0 Z" fill="url(#campo)"/>` +
    `<path d="M40 780 V640 H220 V780 M30 650 L130 580 L230 650 Z" fill="#d1462f" ${st(6)}/><rect x="105" y="690" width="50" height="90" fill="#fff" ${st(5)}/>` +
    `<path d="M60 820 H960 M60 870 H960" stroke="#fff" stroke-width="12"/><path d="M120 800 V900 M880 800 V900" stroke="#fff" stroke-width="16"/>` +
    `<path d="M330 1000 Q340 760 500 740 Q660 760 670 1000 Z" fill="url(#pelo)" ${st()}/>` +
    `<path d="M345 260 L320 140 L420 230 Z M655 260 L680 140 L580 230 Z" fill="url(#pelo)" ${st()}/>` +
    `<path d="M500 200 C640 200 690 300 680 420 C670 520 640 600 630 680 C620 760 380 760 370 680 C360 600 330 520 320 420 C310 300 360 200 500 200 Z" fill="url(#pelo)" ${st()}/>` +
    `<path d="M430 190 Q470 140 520 170 Q560 140 590 190 Q560 230 530 260 Q500 220 470 260 Q440 230 430 190 Z" fill="url(#crina)" ${st(6)}/>` +
    `<path d="M480 300 L500 270 L520 300 L500 330 Z" fill="#fff"/>` +
    olho(380, 360, 38, '#3a2414', 6) + olho(620, 360, 38, '#3a2414', -6) +
    `<ellipse cx="500" cy="650" rx="140" ry="105" fill="url(#focinho)" ${st()}/>` +
    `<ellipse cx="450" cy="630" rx="20" ry="28" fill="${K}"/><ellipse cx="550" cy="630" rx="20" ry="28" fill="${K}"/>` +
    sorriso(500, 705, 110, 40) + brilho('M400 240 Q450 215 500 215'))
};

C.pinguim = {
  nome: { pt: 'Pinguim', en: 'Penguin' },
  lugares: { cabeca: { x: 0.5, y: 0.235, tam: 0.38 }, olhos: { x: 0.5, y: 0.42, tam: 0.32 }, nariz: { x: 0.5, y: 0.5, tam: 0.08 }, boca: { x: 0.5, y: 0.57, tam: 0.14 } },
  svg: () => svg(1000, 1000,
    lg('ceu', '#bfe9ff', '#7fc3ef') + rg('preto', '#3a3f5c', '#151726') + rg('branco', '#ffffff', '#dfe9f5') + lg('gelo', '#ffffff', '#cfe6f7'),
    `<rect width="1000" height="1000" fill="url(#ceu)"/>` + estrelas(30, 9, 600) +
    `<path d="M0 600 L120 470 L220 560 L330 430 L450 600 Z M600 600 L720 420 L830 540 L920 450 L1000 520 V600 Z" fill="#eaf6ff" ${st(6)}/>` +
    `<path d="M0 800 Q500 740 1000 800 V1000 H0 Z" fill="url(#gelo)" ${st(6)}/>` +
    `<ellipse cx="500" cy="680" rx="250" ry="270" fill="url(#preto)" ${st()}/>` +
    `<ellipse cx="500" cy="720" rx="170" ry="210" fill="url(#branco)"/>` +
    `<path d="M260 600 Q190 700 220 800 Q280 740 290 660 Z M740 600 Q810 700 780 800 Q720 740 710 660 Z" fill="url(#preto)" ${st()}/>` +
    `<circle cx="500" cy="420" r="200" fill="url(#preto)" ${st()}/>` +
    `<path d="M380 360 Q440 330 500 400 Q560 330 620 360 Q660 460 600 540 Q500 580 400 540 Q340 460 380 360 Z" fill="url(#branco)"/>` +
    olho(445, 420, 30, '#3a3f5c') + olho(555, 420, 30, '#3a3f5c') +
    `<path d="M465 480 Q500 470 535 480 L500 525 Z" fill="#ffa62e" ${st(6)}/>` +
    `<path d="M470 565 Q500 585 530 565" fill="none" ${st(6)}/>` +
    `<path d="M420 945 h60 M520 945 h60" stroke="#ffa62e" stroke-width="22" stroke-linecap="round"/>` +
    bochecha(410, 490, 22) + bochecha(590, 490, 22) + brilho('M380 280 Q430 250 490 245', 12))
};

C['boneco-de-neve'] = {
  nome: { pt: 'Boneco de neve', en: 'Snowman' },
  lugares: { cabeca: { x: 0.5, y: 0.205, tam: 0.36 }, olhos: { x: 0.5, y: 0.33, tam: 0.3 }, nariz: { x: 0.5, y: 0.4, tam: 0.08 }, boca: { x: 0.5, y: 0.47, tam: 0.18 } },
  svg: () => svg(1000, 1000,
    lg('noite', '#1a1446', '#4a5ab8') + rg('neve', '#ffffff', '#d6e4f5') + lg('cachecol', '#ff4fa3', '#c42a7c') + lg('chao', '#ffffff', '#c9dcf0'),
    `<rect width="1000" height="1000" fill="url(#noite)"/>` + estrelas(70, 3, 1000, '#fff') +
    `<path d="M0 820 Q500 760 1000 820 V1000 H0 Z" fill="url(#chao)"/>` +
    `<path d="M90 820 L160 620 L230 820 Z M60 830 L160 560 L260 830" fill="#2fbf71" ${st(6)}/><circle cx="160" cy="560" r="16" fill="#ffd166"/>` +
    `<circle cx="500" cy="850" r="230" fill="url(#neve)" ${st()}/>` +
    `<circle cx="500" cy="600" r="175" fill="url(#neve)" ${st()}/>` +
    `<g fill="${K}"><circle cx="500" cy="560" r="14"/><circle cx="500" cy="620" r="14"/><circle cx="500" cy="800" r="16"/></g>` +
    `<path d="M330 560 L200 470 M220 485 L190 440 M220 485 L170 495 M670 560 L800 470 M780 485 L810 440 M780 485 L830 495" fill="none" stroke="#6e4320" stroke-width="12" stroke-linecap="round"/>` +
    `<circle cx="500" cy="360" r="160" fill="url(#neve)" ${st()}/>` +
    `<path d="M360 470 Q500 520 640 470 L650 520 Q500 570 350 520 Z" fill="url(#cachecol)" ${st(6)}/><path d="M590 510 L610 640 L660 630 L640 500 Z" fill="url(#cachecol)" ${st(6)}/>` +
    `<circle cx="450" cy="330" r="20" fill="${K}"/><circle cx="550" cy="330" r="20" fill="${K}"/><circle cx="444" cy="323" r="6" fill="#fff"/><circle cx="544" cy="323" r="6" fill="#fff"/>` +
    `<path d="M495 385 L520 400 L600 410 Z" fill="#ff8a1f" ${st(5)}/>` +
    `<g fill="${K}">${[[440, 455], [470, 468], [500, 472], [530, 468], [560, 455]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="9"/>`).join('')}</g>` +
    bochecha(415, 395, 24) + bochecha(585, 395, 24) + brilho('M400 250 Q450 220 510 218', 12))
};

/* ------------------------------ itens ------------------------------ */
// encaixe: ponto do desenho (0..1) que cai sobre o lugar certo; escala: largura do item / tam do lugar.
const I = {};
I['peruca-oculos'] = { nome: { pt: 'Peruca com óculos', en: 'Wig with glasses' }, lugar: 'olhos', encaixe: { x: 0.5, y: 0.72 }, escala: 1.7,
  svg: () => svg(400, 360, rg('cabelo', '#ff9ad2', '#d42a86') + lg('lente', '#bff6ff', '#4fc3e8'),
    `<path d="M40 300 C10 200 40 90 120 50 C170 10 240 10 290 40 C370 80 400 190 365 300 C350 250 330 230 320 200 C300 170 260 160 200 170 C140 160 100 170 80 200 C70 230 55 250 40 300 Z" fill="url(#cabelo)" ${st()}/>` +
    `<g fill="url(#cabelo)" ${st(6)}>${[[70, 90], [120, 50], [180, 35], [240, 40], [300, 70], [340, 120], [55, 160], [355, 190], [45, 240], [360, 250]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="38"/>`).join('')}</g>` +
    brilho('M120 70 Q170 40 230 45', 12) +
    `<circle cx="145" cy="259" r="52" fill="url(#lente)" fill-opacity=".55" ${st(9)}/><circle cx="255" cy="259" r="52" fill="url(#lente)" fill-opacity=".55" ${st(9)}/>` +
    `<path d="M197 255 Q200 243 203 255" fill="none" ${st(9)}/><path d="M125 240 L145 228" stroke="#fff" stroke-width="7" stroke-linecap="round"/><path d="M235 240 L255 228" stroke="#fff" stroke-width="7" stroke-linecap="round"/>`) };
I['boca-tubarao'] = { nome: { pt: 'Boca de tubarão', en: 'Shark mouth' }, lugar: 'boca', encaixe: { x: 0.5, y: 0.5 }, escala: 1.5,
  svg: () => svg(400, 220, lg('dentro', '#8a1030', '#3a0612'),
    `<path d="M20 60 Q200 -10 380 60 Q360 190 200 210 Q40 190 20 60 Z" fill="url(#dentro)" ${st()}/>` +
    `<path d="M40 65 ${Array.from({ length: 9 }, (_, i) => `L${58 + i * 36} 120 L${76 + i * 36} 55`).join(' ')} Z" fill="#fff" ${st(5)}/>` +
    `<path d="M60 170 ${Array.from({ length: 7 }, (_, i) => `L${80 + i * 40} 115 L${100 + i * 40} 180`).join(' ')}" fill="#fff" ${st(5)}/>` +
    `<ellipse cx="200" cy="175" rx="50" ry="16" fill="#ff6b8a" opacity=".8"/>`) };
I.coroa = { nome: { pt: 'Coroa', en: 'Crown' }, lugar: 'cabeca', encaixe: { x: 0.5, y: 0.9 }, escala: 0.8,
  svg: () => svg(300, 210, lg('ouro', '#fff1a8', '#e6a400'),
    `<path d="M20 190 L10 50 L85 115 L150 20 L215 115 L290 50 L280 190 Z" fill="url(#ouro)" ${st()}/>` +
    `<rect x="18" y="160" width="264" height="36" rx="8" fill="url(#ouro)" ${st()}/>` +
    `<circle cx="150" cy="178" r="13" fill="#ff4fa3" ${st(4)}/><circle cx="85" cy="178" r="10" fill="#3ee8ff" ${st(4)}/><circle cx="215" cy="178" r="10" fill="#c6ff3d" ${st(4)}/>` +
    `<circle cx="10" cy="45" r="13" fill="#ffd166" ${st(5)}/><circle cx="150" cy="18" r="15" fill="#ff4fa3" ${st(5)}/><circle cx="290" cy="45" r="13" fill="#ffd166" ${st(5)}/>` +
    brilho('M45 150 L40 80', 8))};
I.cartola = { nome: { pt: 'Cartola', en: 'Top hat' }, lugar: 'cabeca', encaixe: { x: 0.5, y: 0.94 }, escala: 0.85,
  svg: () => svg(300, 300, lg('feltro', '#3a3550', '#0f0d1c'),
    `<path d="M65 250 L80 30 Q150 10 220 30 L235 250 Z" fill="url(#feltro)" ${st()}/>` +
    `<path d="M70 205 L230 205 L233 245 L67 245 Z" fill="#ff4fa3" ${st(6)}/>` +
    `<ellipse cx="150" cy="268" rx="140" ry="26" fill="url(#feltro)" ${st()}/>` +
    `<path d="M200 205 l18 -22 6 30 z" fill="#ffd166" ${st(4)}/>` + brilho('M100 60 L95 180', 10, 0.35)) };
I.bigode = { nome: { pt: 'Bigode', en: 'Mustache' }, lugar: 'boca', encaixe: { x: 0.5, y: 0.95 }, escala: 1.35,
  svg: () => svg(360, 140, lg('pelo', '#7a4a26', '#3a1f0c'),
    `<path d="M180 50 C140 10 80 20 60 60 C45 90 20 95 6 70 C10 120 70 135 120 110 C150 95 170 85 180 80 C190 85 210 95 240 110 C290 135 350 120 354 70 C340 95 315 90 300 60 C280 20 220 10 180 50 Z" fill="url(#pelo)" ${st()}/>` +
    brilho('M90 55 Q120 40 150 55', 8, 0.4) + brilho('M210 55 Q240 40 270 55', 8, 0.4)) };
I['nariz-palhaco'] = { nome: { pt: 'Nariz de palhaço', en: 'Clown nose' }, lugar: 'nariz', encaixe: { x: 0.5, y: 0.5 }, escala: 1.4,
  svg: () => svg(200, 200, rg('verm', '#ff8a8a', '#d1102c'),
    `<circle cx="100" cy="100" r="88" fill="url(#verm)" ${st()}/><ellipse cx="72" cy="66" rx="24" ry="16" fill="#fff" opacity=".75"/>`) };
I['oculos-escuros'] = { nome: { pt: 'Óculos escuros', en: 'Sunglasses' }, lugar: 'olhos', encaixe: { x: 0.5, y: 0.4 }, escala: 1.1,
  svg: () => svg(400, 160, lg('lente', '#4a3f7a', '#0b0a1f'),
    `<path d="M10 40 H390" ${st(12)}/>` +
    `<path d="M25 40 H180 Q185 140 105 145 Q30 140 25 40 Z" fill="url(#lente)" ${st()}/><path d="M220 40 H375 Q370 140 295 145 Q215 140 220 40 Z" fill="url(#lente)" ${st()}/>` +
    `<path d="M180 50 Q200 30 220 50" fill="none" ${st(10)}/>` +
    `<path d="M50 60 L100 60 M245 60 L295 60" stroke="#3ee8ff" stroke-width="9" stroke-linecap="round" opacity=".8"/><path d="M60 80 L80 80 M255 80 L275 80" stroke="#ff4fa3" stroke-width="7" stroke-linecap="round" opacity=".8"/>`) };
I.fone = { nome: { pt: 'Fone de ouvido', en: 'Headphones' }, lugar: 'cabeca', encaixe: { x: 0.5, y: 0.08 }, escala: 1.25,
  svg: () => svg(400, 340, lg('arco', '#ff7cc0', '#c42a7c') + lg('concha', '#3ee8ff', '#1a7fa6'),
    `<path d="M50 250 C40 60 360 60 350 250" fill="none" stroke="${K}" stroke-width="44" stroke-linecap="round"/>` +
    `<path d="M50 250 C40 60 360 60 350 250" fill="none" stroke="url(#arco)" stroke-width="28" stroke-linecap="round"/>` +
    `<rect x="10" y="200" width="80" height="130" rx="34" fill="url(#concha)" ${st()}/><rect x="310" y="200" width="80" height="130" rx="34" fill="url(#concha)" ${st()}/>` +
    `<circle cx="50" cy="265" r="16" fill="#c6ff3d"/><circle cx="350" cy="265" r="16" fill="#c6ff3d"/>`) };
I.laco = { nome: { pt: 'Laço', en: 'Bow' }, lugar: 'cabeca', encaixe: { x: 0.5, y: 0.75 }, escala: 0.6,
  svg: () => svg(300, 180, lg('fita', '#ff8ccb', '#e2338a'),
    `<path d="M150 90 C110 20 20 10 15 60 C10 120 90 150 150 90 Z M150 90 C190 20 280 10 285 60 C290 120 210 150 150 90 Z" fill="url(#fita)" ${st()}/>` +
    `<path d="M140 100 L100 170 L130 160 L150 175 Z M160 100 L200 170 L170 160 L150 175 Z" fill="url(#fita)" ${st(6)}/>` +
    `<ellipse cx="150" cy="90" rx="26" ry="30" fill="#ffd166" ${st(6)}/>` + `<g fill="#fff" opacity=".85"><circle cx="70" cy="60" r="10"/><circle cx="230" cy="60" r="10"/><circle cx="100" cy="95" r="7"/><circle cx="200" cy="95" r="7"/></g>`) };
I.bone = { nome: { pt: 'Boné', en: 'Cap' }, lugar: 'cabeca', encaixe: { x: 0.5, y: 0.82 }, escala: 1.05,
  svg: () => svg(360, 220, lg('pano', '#e4ff8a', '#8fd400') + lg('aba', '#ff7cc0', '#c42a7c'),
    `<path d="M30 175 C30 60 100 15 180 15 C260 15 330 60 330 175 Z" fill="url(#pano)" ${st()}/>` +
    `<path d="M180 18 V170 M105 35 Q90 100 95 170 M255 35 Q270 100 265 170" fill="none" stroke="#5a8a00" stroke-width="5"/>` +
    `<circle cx="180" cy="16" r="12" fill="#ff4fa3" ${st(5)}/>` +
    `<path d="M20 170 Q180 140 340 170 Q350 205 300 210 Q180 195 60 210 Q10 205 20 170 Z" fill="url(#aba)" ${st()}/>` +
    `<path d="M150 95 l12 -26 12 26 -24 -16 h24 z" fill="#ffd166" ${st(4)}/>` + brilho('M80 90 Q100 50 140 38', 10, 0.5)) };
I['chapeu-pirata'] = { nome: { pt: 'Chapéu de pirata', en: 'Pirate hat' }, lugar: 'cabeca', encaixe: { x: 0.5, y: 0.88 }, escala: 1.15,
  svg: () => svg(400, 230, lg('feltro', '#3a3550', '#0f0d1c'),
    `<path d="M10 190 C60 150 90 30 200 30 C310 30 340 150 390 190 C300 175 280 215 200 215 C120 215 100 175 10 190 Z" fill="url(#feltro)" ${st()}/>` +
    `<path d="M30 185 C120 170 280 170 370 185" fill="none" stroke="#ffd166" stroke-width="10"/>` +
    `<circle cx="200" cy="105" r="34" fill="#fff" ${st(5)}/><circle cx="188" cy="100" r="8" fill="${K}"/><circle cx="212" cy="100" r="8" fill="${K}"/><path d="M190 122 h20 M195 116 v12 M205 116 v12" stroke="${K}" stroke-width="4"/>` +
    `<path d="M150 150 L250 60 M150 60 L250 150" stroke="#fff" stroke-width="12" stroke-linecap="round"/><circle cx="200" cy="105" r="34" fill="#fff" ${st(5)}/><circle cx="188" cy="100" r="8" fill="${K}"/><circle cx="212" cy="100" r="8" fill="${K}"/>`) };
I['capacete-viking'] = { nome: { pt: 'Capacete viking', en: 'Viking helmet' }, lugar: 'cabeca', encaixe: { x: 0.5, y: 0.9 }, escala: 1.5,
  svg: () => svg(460, 260, lg('metal', '#e6ecf5', '#7b88a0') + lg('chifre', '#fff8e6', '#e0c890'),
    `<path d="M120 170 C80 160 40 120 30 40 C70 80 110 100 150 110 Z" fill="url(#chifre)" ${st()}/><path d="M340 170 C380 160 420 120 430 40 C390 80 350 100 310 110 Z" fill="url(#chifre)" ${st()}/>` +
    `<path d="M110 235 C110 100 160 50 230 50 C300 50 350 100 350 235 Z" fill="url(#metal)" ${st()}/>` +
    `<rect x="100" y="205" width="260" height="40" rx="10" fill="#c98a3a" ${st()}/>` +
    `<path d="M230 52 V205" stroke="#c98a3a" stroke-width="24"/><path d="M230 52 V205" ${st(4)} fill="none"/>` +
    `<g fill="#7b5a2a">${[130, 170, 290, 330].map(x => `<circle cx="${x}" cy="225" r="7"/>`).join('')}</g>` + brilho('M150 150 Q160 90 200 70', 12, 0.6)) };

/* ---------------------------- gravar ---------------------------- */
const listaC = [], listaI = [];
for (const [id, c] of Object.entries(C)) {
  fs.writeFileSync(path.join(pasta, 'cenarios', id + '.svg'), c.svg());
  const lug = {}; for (const [k, v] of Object.entries(c.lugares)) lug[k] = Object.assign({ rot: 0 }, v);
  listaC.push({ id, nome: c.nome, arquivo: id + '.svg', largura: 1000, altura: 1000, lugares: lug });
}
for (const [id, it] of Object.entries(I)) {
  fs.writeFileSync(path.join(pasta, 'itens', id + '.svg'), it.svg());
  listaI.push({ id, nome: it.nome, arquivo: id + '.svg', lugar: it.lugar, encaixe: it.encaixe, escala: it.escala });
}
const linhas = l => '[\n' + l.map(o => '  ' + JSON.stringify(o)).join(',\n') + '\n]\n';
fs.writeFileSync(path.join(pasta, 'cenarios', 'cenarios.json'), linhas(listaC));
fs.writeFileSync(path.join(pasta, 'itens', 'itens.json'), linhas(listaI));
console.log('cenários:', listaC.length, 'itens:', listaI.length);
