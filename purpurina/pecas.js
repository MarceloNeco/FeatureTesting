/* Purpurina — catálogo: cores, partes da personagem, maquiagem, roupas, acessórios, cenários e desafios.
   Só dados (nada de tela), para dar para testar no Node e para trocar ou acrescentar peças sem mexer
   no resto. Peça nova = um item em "opcoes" (id, pt, en, tags) + o desenho dela em boneca.js.
   As "tags" dizem para que a peça combina (praia, princesa, inverno…) e são o que os desafios conferem. */
(function (raiz) {
  'use strict';

  function c(id, hex, pt, en, fam, brilho) { return { id: id, hex: hex, pt: pt, en: en, fam: fam || [], brilho: !!brilho }; }
  function o(id, pt, en, tags) { return { id: id, pt: pt, en: en, tags: tags || [] }; }
  var NENHUM = function (pt, en) { return o('nenhum', pt || 'Nenhum', en || 'None'); };

  // ---------- paletas ----------
  var CORES = {
    roupa: [
      c('chiclete', '#ff4fa3', 'Rosa chiclete', 'Bubblegum pink', ['rosa', 'vivo']),
      c('rosaclaro', '#ffb3d9', 'Rosa clarinho', 'Light pink', ['rosa', 'claro']),
      c('vermelho', '#e8384f', 'Vermelho', 'Red', ['vermelho', 'vivo']),
      c('coral', '#ff8a6b', 'Coral', 'Coral', ['laranja', 'vivo']),
      c('amarelo', '#ffd23f', 'Amarelo', 'Yellow', ['amarelo', 'vivo', 'claro']),
      c('menta', '#86ecc8', 'Verde-menta', 'Mint', ['verde', 'claro', 'mar']),
      c('verde', '#3cc46a', 'Verde', 'Green', ['verde', 'vivo', 'mar']),
      c('ceu', '#8fd0ff', 'Azul-céu', 'Sky blue', ['azul', 'claro', 'mar']),
      c('azul', '#3f6ee8', 'Azul', 'Blue', ['azul', 'vivo', 'mar']),
      c('lilas', '#cfa8ff', 'Lilás', 'Lilac', ['roxo', 'claro', 'mar']),
      c('roxo', '#8a3fd1', 'Roxo', 'Purple', ['roxo', 'vivo']),
      c('branco', '#fbf7ff', 'Branco', 'White', ['branco', 'claro']),
      c('preto', '#2f2639', 'Preto', 'Black', ['preto', 'escuro']),
      c('dourado', '#f2c14e', 'Dourado', 'Gold', ['brilho', 'amarelo'], true),
      c('prata', '#d3dae8', 'Prateado', 'Silver', ['brilho', 'claro'], true)
    ],
    pele: [
      c('p1', '#ffe5d6', 'Tom 1', 'Tone 1'), c('p2', '#fbd3b8', 'Tom 2', 'Tone 2'), c('p3', '#f1c19c', 'Tom 3', 'Tone 3'),
      c('p4', '#e0a87f', 'Tom 4', 'Tone 4'), c('p5', '#c98c63', 'Tom 5', 'Tone 5'), c('p6', '#a96e49', 'Tom 6', 'Tone 6'),
      c('p7', '#8a5336', 'Tom 7', 'Tone 7'), c('p8', '#653b22', 'Tom 8', 'Tone 8')
    ],
    cabelo: [
      c('preto', '#2a1d1b', 'Preto', 'Black'), c('escuro', '#4a2c20', 'Castanho-escuro', 'Dark brown'),
      c('castanho', '#7b4a2b', 'Castanho', 'Brown'), c('ruivo', '#c4572c', 'Ruivo', 'Red'),
      c('loiro', '#e3b85c', 'Loiro', 'Blonde'), c('platinado', '#f4e3ab', 'Loiro clarinho', 'Light blonde'),
      c('rosa', '#ff8fc8', 'Rosa', 'Pink', ['fantasia']), c('lilas', '#b892ff', 'Lilás', 'Lilac', ['fantasia']),
      c('azul', '#6fb8ff', 'Azul', 'Blue', ['fantasia']), c('menta', '#6fe0c0', 'Verde-água', 'Aqua', ['fantasia'])
    ],
    olhos: [
      c('castanho', '#6b3e26', 'Castanhos', 'Brown'), c('preto', '#2a1c1a', 'Pretos', 'Black'), c('verde', '#3e9a5a', 'Verdes', 'Green'),
      c('azul', '#3b7fd6', 'Azuis', 'Blue'), c('mel', '#b9822f', 'Cor de mel', 'Hazel'), c('violeta', '#8a55d6', 'Violeta', 'Violet')
    ],
    blush: [
      c('rosa', '#ff8fb1', 'Rosa', 'Pink'), c('pessego', '#ffab8a', 'Pêssego', 'Peach'), c('coral', '#ff7f6b', 'Coral', 'Coral'),
      c('lilas', '#d59bff', 'Lilás', 'Lilac'), c('vermelho', '#ef5a6f', 'Vermelhinho', 'Rosy red')
    ],
    sombra: [
      c('rosa', '#ff8fc8', 'Rosa', 'Pink'), c('lilas', '#b892ff', 'Lilás', 'Lilac'), c('azul', '#6fb8ff', 'Azul', 'Blue'),
      c('verde', '#6fe0a0', 'Verde', 'Green'), c('dourado', '#f2c14e', 'Dourado', 'Gold', [], true), c('marrom', '#a8724a', 'Marrom', 'Brown'),
      c('roxo', '#8a3fd1', 'Roxo', 'Purple'), c('prata', '#d3dae8', 'Prateado', 'Silver', [], true)
    ],
    delineado: [
      c('preto', '#1d1420', 'Preto', 'Black'), c('marrom', '#5a3420', 'Marrom', 'Brown'), c('azul', '#2f5fd0', 'Azul', 'Blue'),
      c('roxo', '#7a2fc0', 'Roxo', 'Purple'), c('rosa', '#ff3f9a', 'Rosa', 'Pink'), c('dourado', '#d9a227', 'Dourado', 'Gold', [], true)
    ],
    cilios: [
      c('preto', '#1d1420', 'Pretos', 'Black'), c('marrom', '#5a3420', 'Marrons', 'Brown'), c('roxo', '#7a2fc0', 'Roxos', 'Purple'),
      c('azul', '#2f5fd0', 'Azuis', 'Blue'), c('rosa', '#ff3f9a', 'Rosa', 'Pink')
    ],
    batom: [
      c('rosaclaro', '#ff9ec4', 'Rosa clarinho', 'Light pink'), c('chiclete', '#ff4fa3', 'Rosa chiclete', 'Bubblegum'),
      c('vermelho', '#d92b45', 'Vermelho', 'Red'), c('coral', '#ff6f61', 'Coral', 'Coral'), c('nude', '#d99a86', 'Natural', 'Nude'),
      c('cereja', '#a3123a', 'Cereja', 'Cherry'), c('roxo', '#9b3fb5', 'Roxo', 'Purple'), c('lilas', '#c08bf0', 'Lilás', 'Lilac')
    ],
    glitter: [
      c('dourado', '#ffd76a', 'Dourado', 'Gold', [], true), c('prata', '#eef2ff', 'Prateado', 'Silver', [], true),
      c('rosa', '#ff7cc8', 'Rosa', 'Pink', [], true), c('lilas', '#c9a3ff', 'Lilás', 'Lilac', [], true),
      c('arco', '#ff7cc8', 'Arco-íris', 'Rainbow', [], true)
    ]
  };

  // ---------- grupos (abas) ----------
  var GRUPOS = [
    { id: 'eu', ico: '👧', pt: 'Eu', en: 'Me' },
    { id: 'make', ico: '💄', pt: 'Maquiagem', en: 'Makeup' },
    { id: 'roupa', ico: '👗', pt: 'Roupas', en: 'Clothes' },
    { id: 'joias', ico: '💎', pt: 'Joias', en: 'Jewelry' },
    { id: 'acess', ico: '👑', pt: 'Acessórios', en: 'Accessories' },
    { id: 'fundo', ico: '🏞️', pt: 'Cenário', en: 'Scene' }
  ];

  /* Cada categoria: id, grupo, ícone, nome, opcoes (estilos) e/ou cores (nome da paleta).
     "area" é o pedaço do desenho que aparece na miniatura do botão (x, y, largura, altura).
     "nenhum" na primeira opção quer dizer que dá para tirar. */
  var A = { rosto: [86, 96, 228, 228], olhos: [116, 168, 168, 100], boca: [146, 224, 108, 84], cabeca: [46, 16, 308, 360],
    corpo: [70, 300, 260, 300], cintura: [70, 400, 260, 260], pes: [110, 560, 180, 120], tudo: [0, 40, 400, 660], pescoco: [90, 220, 220, 180],
    mao: [80, 456, 84, 76], anel: [80, 470, 70, 62], peito: [140, 340, 120, 100], cabeloTodo: [20, 10, 360, 640] };
  /* zoom do palco por parte (ver app.js): rosto, busto, mãos ou cabeça */
  var ZOOM = { rosto: [72, 70, 256, 260], busto: [56, 120, 288, 300], maos: [56, 428, 150, 130], cabeca: [30, 20, 340, 430] };
  var CATEGORIAS = [
    { id: 'pele', grupo: 'eu', ico: '🎨', pt: 'Pele', en: 'Skin', cores: 'pele', area: A.rosto, zoom: 'rosto' },
    { id: 'cabelo', grupo: 'eu', ico: '💇', pt: 'Cabelo', en: 'Hair', cores: 'cabelo', area: A.cabeca, zoom: 'cabeca', opcoes: [
      o('longo', 'Longo e liso', 'Long and straight'), o('ondulado', 'Ondulado', 'Wavy'), o('cacheado', 'Cacheado', 'Curly'),
      o('rabo', 'Rabo de cavalo', 'Ponytail', ['esporte']), o('chiquinhas', 'Maria-chiquinha', 'Pigtails'), o('coque', 'Coque', 'Bun', ['bailarina', 'princesa']),
      o('chanel', 'Chanel', 'Bob'), o('trancas', 'Duas tranças', 'Two braids'),
      o('franja', 'Liso com franja', 'Straight with bangs'), o('afro', 'Black power', 'Afro', ['pop']), o('puffs', 'Dois puffs', 'Two puffs', ['pop']),
      o('lateral', 'Rabo de lado', 'Side ponytail'), o('trancaLado', 'Trança de lado', 'Side braid', ['princesa', 'jardim']),
      o('meio', 'Meio preso', 'Half-up'), o('pixie', 'Joãozinho', 'Pixie cut'), o('sereia', 'Longo de sereia', 'Mermaid hair', ['sereia', 'princesa']),
      o('coqueDuplo', 'Dois coquinhos', 'Space buns', ['pop']), o('box', 'Tranças box', 'Box braids', ['pop'])
    ] },
    { id: 'mechas', grupo: 'eu', ico: '🌈', pt: 'Mechas', en: 'Highlights', cores: 'cabelo', area: A.cabeloTodo, zoom: 'cabeca', opcoes: [
      NENHUM('Sem mechas', 'No highlights'), o('pontas', 'Pontas coloridas', 'Colored tips', ['pop']), o('frente', 'Mechas na frente', 'Front streaks', ['pop']),
      o('arco', 'Arco-íris', 'Rainbow', ['pop', 'festa'])
    ] },
    { id: 'olhos', grupo: 'eu', ico: '👀', pt: 'Olhos', en: 'Eyes', cores: 'olhos', area: A.olhos, zoom: 'rosto' },

    { id: 'base', grupo: 'make', ico: '🧴', pt: 'Base', en: 'Foundation', area: A.rosto, zoom: 'rosto', opcoes: [
      NENHUM('Sem base', 'No foundation'), o('natural', 'Natural', 'Natural'), o('iluminada', 'Iluminada', 'Glowy', ['brilho', 'festa']),
      o('bronze', 'Bronzeada', 'Sun-kissed', ['praia', 'verao']), o('sardas', 'Sardinhas', 'Freckles', ['jardim'])
    ] },
    { id: 'blush', grupo: 'make', ico: '🌸', pt: 'Blush', en: 'Blush', cores: 'blush', area: A.rosto, zoom: 'rosto', opcoes: [
      NENHUM('Sem blush', 'No blush'), o('redondo', 'Bochecha redonda', 'Round cheeks'), o('coracao', 'Coraçõezinhos', 'Little hearts', ['festa']),
      o('diagonal', 'Fininho', 'Swept')
    ] },
    { id: 'sombra', grupo: 'make', ico: '🎨', pt: 'Sombra', en: 'Eyeshadow', cores: 'sombra', area: A.olhos, zoom: 'rosto', opcoes: [
      NENHUM('Sem sombra', 'No eyeshadow'), o('simples', 'Simples', 'Simple'), o('esfumada', 'Esfumada', 'Smoky'),
      o('arco', 'Arco-íris', 'Rainbow', ['pop', 'festa']), o('brilhante', 'Com brilho', 'Shimmer', ['brilho', 'festa', 'princesa'])
    ] },
    { id: 'delineado', grupo: 'make', ico: '✏️', pt: 'Delineado', en: 'Eyeliner', cores: 'delineado', area: A.olhos, zoom: 'rosto', opcoes: [
      NENHUM('Sem delineado', 'No eyeliner'), o('fino', 'Fininho', 'Thin'), o('gatinho', 'Gatinho', 'Cat eye', ['pop']), o('grosso', 'Marcado', 'Bold', ['pop'])
    ] },
    { id: 'cilios', grupo: 'make', ico: '👁️', pt: 'Cílios', en: 'Lashes', cores: 'cilios', area: A.olhos, zoom: 'rosto', opcoes: [
      o('curtos', 'Naturais', 'Natural'), o('longos', 'Longos', 'Long', ['festa']), o('boneca', 'De boneca', 'Doll lashes', ['princesa', 'pop']),
      o('gatinho', 'Gatinho', 'Cat-eye lashes', ['pop']), o('volume', 'Volume', 'Volume', ['festa', 'pop']), o('baixo', 'Em cima e embaixo', 'Top and bottom'),
      o('arco', 'Arco-íris', 'Rainbow lashes', ['pop', 'festa']), o('strass', 'Com strass', 'With rhinestones', ['brilho', 'festa', 'princesa'])
    ] },
    { id: 'batom', grupo: 'make', ico: '💋', pt: 'Batom', en: 'Lipstick', cores: 'batom', area: A.boca, zoom: 'rosto', opcoes: [
      NENHUM('Sem batom', 'No lipstick'), o('cremoso', 'Cremoso', 'Creamy'), o('gloss', 'Gloss', 'Gloss', ['festa']),
      o('brilho', 'Com glitter', 'Glitter', ['brilho', 'pop']), o('degrade', 'Degradê', 'Ombré')
    ] },
    { id: 'glitter', grupo: 'make', ico: '✨', pt: 'Glitter', en: 'Glitter', cores: 'glitter', area: A.tudo, zoom: 'rosto', opcoes: [
      NENHUM('Sem glitter', 'No glitter'), o('bochechas', 'Nas bochechas', 'On the cheeks', ['brilho']), o('olhos', 'Perto dos olhos', 'Around the eyes', ['brilho']),
      o('cabelo', 'No cabelo', 'In the hair', ['brilho']), o('tudo', 'Chuva de glitter!', 'Glitter shower!', ['brilho', 'festa'])
    ] },
    { id: 'adesivo', grupo: 'make', ico: '💟', pt: 'Adesivos', en: 'Stickers', area: A.rosto, zoom: 'rosto', opcoes: [
      NENHUM('Sem adesivo', 'No sticker'), o('coracao', 'Coração', 'Heart', ['festa']), o('estrela', 'Estrela', 'Star', ['pop', 'pijama']),
      o('lua', 'Lua', 'Moon', ['pijama']), o('borboleta', 'Borboleta', 'Butterfly', ['jardim']), o('arco', 'Arco-íris', 'Rainbow', ['festa']),
      o('flor', 'Flor', 'Flower', ['jardim']), o('floco', 'Floco de neve', 'Snowflake', ['inverno']), o('concha', 'Concha', 'Shell', ['praia', 'sereia'])
    ] },

    { id: 'vestido', grupo: 'roupa', ico: '👗', pt: 'Vestidos', en: 'Dresses', cores: 'roupa', area: A.tudo, opcoes: [
      NENHUM('Sem vestido', 'No dress'), o('princesa', 'De princesa', 'Princess gown', ['princesa', 'festa', 'longo']),
      o('rodado', 'Curto rodado', 'Short twirl dress', ['festa', 'aniversario', 'pop']), o('sereia', 'Sereia', 'Mermaid', ['sereia', 'festa', 'princesa']),
      o('verao', 'De alcinha', 'Sundress', ['praia', 'verao', 'jardim']), o('festa', 'De festa com laço', 'Party dress with bow', ['festa', 'aniversario']),
      o('camisola', 'Camisola', 'Nightgown', ['pijama']), o('gala', 'Longo de gala', 'Evening gown', ['festa', 'princesa', 'longo']),
      o('jardineira', 'Jardineira', 'Pinafore', ['jardim', 'casual', 'escola']), o('macacao', 'Macacão', 'Jumpsuit', ['pop', 'festa']),
      o('tomara', 'Tomara que caia balonê', 'Strapless bubble dress', ['festa', 'aniversario', 'pop']), o('casaco', 'Casaco longo', 'Long coat', ['inverno']),
      o('fada', 'De fada (com asas)', 'Fairy dress (with wings)', ['princesa', 'festa', 'jardim'])
    ] },
    { id: 'blusa', grupo: 'roupa', ico: '👚', pt: 'Blusas', en: 'Tops', cores: 'roupa', area: A.corpo, opcoes: [
      o('camiseta', 'Camiseta', 'T-shirt', ['casual', 'jardim']), o('regata', 'Regata', 'Tank top', ['praia', 'verao', 'pop']),
      o('babados', 'Com babados', 'Ruffle top', ['jardim', 'festa', 'princesa']), o('sueter', 'Suéter quentinho', 'Cozy sweater', ['inverno']),
      o('jaqueta', 'Jaqueta', 'Jacket', ['pop', 'inverno']), o('pijama', 'Blusa de pijama', 'Pajama top', ['pijama']),
      o('moletom', 'Moletom com capuz', 'Hoodie', ['inverno', 'casual', 'esporte']), o('camisa', 'Camisa', 'Button shirt', ['escola', 'casual']),
      o('ombro', 'Ombro a ombro', 'Off-shoulder', ['praia', 'verao', 'festa']), o('laco', 'Blusa de laço', 'Bow blouse', ['festa', 'princesa', 'aniversario']),
      o('colete', 'Colete', 'Vest', ['pop', 'casual'])
    ] },
    { id: 'saia', grupo: 'roupa', ico: '🩰', pt: 'Saias', en: 'Skirts', cores: 'roupa', area: A.cintura, opcoes: [
      NENHUM('Sem saia', 'No skirt'), o('curta', 'Curtinha', 'Mini skirt', ['pop', 'festa', 'casual']),
      o('tutu', 'Tutu de bailarina', 'Ballet tutu', ['bailarina', 'festa', 'princesa', 'pop', 'aniversario']),
      o('longa', 'Longa', 'Long skirt', ['jardim', 'princesa']), o('pregas', 'De pregas', 'Pleated', ['casual', 'escola']),
      o('balone', 'Balonê', 'Bubble skirt', ['festa', 'pop']), o('camadas', 'Em camadas', 'Tiered', ['jardim', 'festa']),
      o('jeans', 'Saia jeans', 'Denim skirt', ['casual', 'pop', 'verao'])
    ] },
    { id: 'calca', grupo: 'roupa', ico: '👖', pt: 'Calças e shorts', en: 'Pants and shorts', cores: 'roupa', area: A.cintura, opcoes: [
      NENHUM('Sem calça', 'No pants'), o('jeans', 'Calça justa', 'Skinny pants', ['casual', 'pop']), o('shorts', 'Shorts', 'Shorts', ['praia', 'verao']),
      o('legging', 'Legging', 'Leggings', ['esporte', 'inverno', 'pop']), o('pantalona', 'Pantalona', 'Flared pants', ['festa', 'pop']),
      o('pijama', 'Calça de pijama', 'Pajama pants', ['pijama']), o('bermuda', 'Bermuda', 'Bermuda shorts', ['verao', 'casual']),
      o('jogger', 'Jogger', 'Joggers', ['esporte', 'casual', 'inverno']), o('rasgada', 'Calça rasgadinha', 'Ripped jeans', ['pop', 'casual'])
    ] },
    { id: 'estampa', grupo: 'roupa', ico: '🎀', pt: 'Estampa', en: 'Pattern', cores: 'roupa', area: A.corpo, opcoes: [
      o('liso', 'Lisa', 'Plain'), o('bolinhas', 'Bolinhas', 'Polka dots', ['festa', 'pop']), o('listras', 'Listras', 'Stripes', ['praia', 'casual']),
      o('estrelas', 'Estrelinhas', 'Little stars', ['pop', 'pijama']), o('coracoes', 'Coraçõezinhos', 'Little hearts', ['festa', 'pijama']),
      o('flores', 'Florzinhas', 'Little flowers', ['jardim', 'praia']), o('xadrez', 'Xadrez', 'Plaid', ['piquenique', 'escola', 'inverno']),
      o('arcoiris', 'Arco-íris', 'Rainbow stripes', ['pop', 'festa']), o('oncinha', 'Oncinha', 'Leopard', ['pop'])
    ] },
    { id: 'sapatos', grupo: 'roupa', ico: '👟', pt: 'Sapatos', en: 'Shoes', cores: 'roupa', area: A.pes, opcoes: [
      o('tenis', 'Tênis', 'Sneakers', ['casual', 'pop', 'esporte']), o('sapatilha', 'Sapatilha', 'Ballet flats', ['bailarina', 'princesa', 'festa', 'jardim']),
      o('sandalia', 'Sandália', 'Sandals', ['praia', 'verao', 'jardim']), o('bota', 'Bota', 'Boots', ['inverno', 'pop']),
      o('salto', 'Sapato de cristal', 'Glass slippers', ['princesa', 'festa']), o('pantufa', 'Pantufa', 'Slippers', ['pijama']),
      o('boneca', 'Sapato de boneca', 'Mary Janes', ['festa', 'escola', 'princesa']), o('patins', 'Patins', 'Roller skates', ['pop', 'esporte']),
      o('chinelo', 'Chinelo', 'Flip-flops', ['praia', 'verao']), o('galocha', 'Galocha', 'Rain boots', ['inverno', 'jardim'])
    ] },

    { id: 'cabeca', grupo: 'acess', ico: '👑', pt: 'Coroas e chapéus', en: 'Crowns and hats', cores: 'roupa', area: A.cabeca, zoom: 'cabeca', opcoes: [
      NENHUM('Nada na cabeça', 'Nothing'), o('tiara', 'Tiara', 'Tiara', ['princesa', 'festa']), o('coroa', 'Coroa', 'Crown', ['princesa']),
      o('flores', 'Coroa de flores', 'Flower crown', ['jardim', 'praia']), o('chapeu', 'Chapéu de praia', 'Sun hat', ['praia', 'verao']),
      o('gorro', 'Gorro', 'Beanie', ['inverno']), o('orelhas', 'Orelhinhas de gato', 'Cat ears', ['pijama', 'pop']),
      o('diadema', 'Diadema de joias', 'Jeweled headband', ['princesa', 'festa', 'joia'])
    ] },
    { id: 'laco', grupo: 'acess', ico: '🎀', pt: 'Laços', en: 'Bows', cores: 'roupa', area: A.cabeca, zoom: 'cabeca', opcoes: [
      NENHUM('Sem laço', 'No bow'), o('alto', 'Laço no alto', 'Top bow', ['festa', 'aniversario']), o('lado', 'Laço do lado', 'Side bow', ['festa', 'aniversario']),
      o('dois', 'Dois lacinhos', 'Two little bows', ['aniversario', 'pop']), o('estrela', 'Presilha de estrela', 'Star clip', ['pop'])
    ] },
    { id: 'brincos', grupo: 'joias', ico: '💎', pt: 'Brincos', en: 'Earrings', cores: 'roupa', area: A.rosto, zoom: 'rosto', opcoes: [
      NENHUM('Sem brinco', 'No earrings'), o('bolinha', 'Bolinha', 'Studs'), o('argola', 'Argola', 'Hoops', ['pop']),
      o('estrela', 'Estrela', 'Stars', ['pop']), o('coracao', 'Coração', 'Hearts', ['festa', 'aniversario']), o('gota', 'Gota brilhante', 'Sparkly drops', ['princesa', 'festa', 'joia']),
      o('perola', 'Pérola', 'Pearl', ['princesa', 'festa', 'joia']), o('diamante', 'Diamante', 'Diamond', ['princesa', 'festa', 'joia', 'brilho']),
      o('lua', 'Lua', 'Moon', ['pijama']), o('borboleta', 'Borboleta', 'Butterfly', ['jardim']), o('flor', 'Florzinha', 'Little flower', ['jardim', 'praia']),
      o('pingente', 'Pingente longo', 'Chandelier', ['festa', 'princesa', 'joia']), o('cereja', 'Cereja', 'Cherries', ['pop', 'verao'])
    ] },
    { id: 'colar', grupo: 'joias', ico: '📿', pt: 'Colares', en: 'Necklaces', cores: 'roupa', area: A.pescoco, zoom: 'busto', opcoes: [
      NENHUM('Sem colar', 'No necklace'), o('perolas', 'Pérolas', 'Pearls', ['princesa', 'festa', 'joia']), o('coracao', 'Coração', 'Heart', ['festa', 'aniversario']),
      o('gargantilha', 'Gargantilha', 'Choker', ['pop']), o('estrela', 'Estrela', 'Star', ['pop']), o('flores', 'Colar de flores', 'Flower lei', ['praia', 'jardim']),
      o('diamantes', 'De diamantes', 'Diamond necklace', ['princesa', 'festa', 'joia', 'brilho']), o('medalhao', 'Medalhão', 'Locket', ['festa', 'joia']),
      o('micangas', 'Miçangas coloridas', 'Colorful beads', ['pop', 'praia']), o('lua', 'Lua', 'Moon', ['pijama']), o('concha', 'Concha', 'Shell', ['praia', 'sereia']),
      o('laco', 'Gargantilha de laço', 'Bow choker', ['festa', 'aniversario']), o('duplo', 'Duas correntes', 'Layered chains', ['pop', 'joia']),
      o('borboleta', 'Borboleta', 'Butterfly', ['jardim'])
    ] },
    { id: 'pulseira', grupo: 'joias', ico: '⌚', pt: 'Pulseiras', en: 'Bracelets', cores: 'roupa', area: A.mao, zoom: 'maos', opcoes: [
      NENHUM('Sem pulseira', 'No bracelet'), o('simples', 'Bracelete', 'Bangle', ['joia']), o('berloque', 'Berloques', 'Charm bracelet', ['festa', 'joia']),
      o('perolas', 'Pérolas', 'Pearls', ['princesa', 'joia']), o('micangas', 'Miçangas', 'Beads', ['pop', 'praia']), o('relogio', 'Relógio', 'Watch', ['casual', 'escola']),
      o('varias', 'Várias pulseiras', 'Stacked bangles', ['pop', 'joia']), o('amizade', 'Da amizade', 'Friendship bracelet', ['casual', 'jardim'])
    ] },
    { id: 'anel', grupo: 'joias', ico: '💍', pt: 'Anéis', en: 'Rings', cores: 'roupa', area: A.anel, zoom: 'maos', opcoes: [
      NENHUM('Sem anel', 'No ring'), o('simples', 'Aliancinha', 'Band', ['joia']), o('pedra', 'Com pedra', 'Gemstone', ['princesa', 'festa', 'joia']),
      o('coracao', 'Coração', 'Heart', ['festa', 'joia']), o('flor', 'Flor', 'Flower', ['jardim', 'joia']), o('estrela', 'Estrela', 'Star', ['pop', 'joia']),
      o('dois', 'Nas duas mãos', 'On both hands', ['festa', 'joia'])
    ] },
    { id: 'broche', grupo: 'joias', ico: '🏵️', pt: 'Broches', en: 'Brooches', cores: 'roupa', area: A.peito, zoom: 'busto', opcoes: [
      NENHUM('Sem broche', 'No brooch'), o('estrela', 'Estrela', 'Star', ['pop', 'joia']), o('laco', 'Laço', 'Bow', ['festa', 'joia']),
      o('flor', 'Flor', 'Flower', ['jardim', 'joia']), o('coracao', 'Coração', 'Heart', ['festa', 'joia']), o('borboleta', 'Borboleta', 'Butterfly', ['jardim', 'joia']),
      o('joia', 'Pedra brilhante', 'Big gem', ['princesa', 'festa', 'joia'])
    ] },
    { id: 'oculos', grupo: 'acess', ico: '🕶️', pt: 'Óculos', en: 'Glasses', cores: 'roupa', area: A.rosto, zoom: 'rosto', opcoes: [
      NENHUM('Sem óculos', 'No glasses'), o('sol', 'De sol', 'Sunglasses', ['praia', 'verao', 'pop']), o('coracao', 'De coração', 'Heart glasses', ['pop', 'festa']),
      o('estrela', 'De estrela', 'Star glasses', ['pop', 'festa']), o('redondo', 'Redondinho', 'Round glasses', ['casual', 'escola'])
    ] },
    { id: 'bolsa', grupo: 'acess', ico: '👜', pt: 'Bolsas', en: 'Bags', cores: 'roupa', area: A.corpo, opcoes: [
      NENHUM('Sem bolsa', 'No bag'), o('mao', 'Bolsinha de mão', 'Clutch', ['festa', 'princesa']), o('ombro', 'Bolsa de ombro', 'Shoulder bag', ['casual', 'pop']),
      o('coracao', 'Bolsa de coração', 'Heart bag', ['festa', 'aniversario', 'pop']), o('cesta', 'Cesta de piquenique', 'Picnic basket', ['jardim', 'piquenique']),
      o('praia', 'Bolsa de palha', 'Straw beach bag', ['praia', 'verao'])
    ] },

    { id: 'cenario', grupo: 'fundo', ico: '🏞️', pt: 'Cenário', en: 'Scene', area: null, opcoes: [
      o('quarto', 'Meu quarto', 'My bedroom', ['pijama']), o('praia', 'Praia', 'Beach', ['praia']), o('castelo', 'Baile no castelo', 'Castle ball', ['princesa']),
      o('palco', 'Palco do show', 'Concert stage', ['pop']), o('jardim', 'Jardim', 'Garden', ['jardim']), o('neve', 'Neve', 'Snow', ['inverno']),
      o('festa', 'Festa de aniversário', 'Birthday party', ['aniversario']), o('mar', 'Fundo do mar', 'Under the sea', ['sereia'])
    ] }
  ];

  // como a personagem começa (e o que volta no "começar de novo")
  var PADRAO = {
    pele: 'p3', cabelo: 'ondulado', cabeloCor: 'castanho', mechas: 'nenhum', mechasCor: 'rosa', olhos: 'castanho',
    base: 'nenhum', blush: 'nenhum', blushCor: 'rosa', sombra: 'nenhum', sombraCor: 'lilas', delineado: 'nenhum', delineadoCor: 'preto',
    cilios: 'curtos', ciliosCor: 'preto', batom: 'nenhum', batomCor: 'rosaclaro', glitter: 'nenhum', glitterCor: 'dourado', adesivo: 'nenhum',
    vestido: 'nenhum', vestidoCor: 'lilas', blusa: 'camiseta', blusaCor: 'rosaclaro', saia: 'nenhum', saiaCor: 'chiclete',
    calca: 'jeans', calcaCor: 'ceu', estampa: 'liso', estampaCor: 'branco', sapatos: 'tenis', sapatosCor: 'branco',
    cabeca: 'nenhum', cabecaCor: 'dourado', laco: 'nenhum', lacoCor: 'chiclete', brincos: 'nenhum', brincosCor: 'dourado', pulseira: 'nenhum', pulseiraCor: 'dourado', anel: 'nenhum', anelCor: 'dourado', broche: 'nenhum', brocheCor: 'dourado',
    colar: 'nenhum', colarCor: 'dourado', oculos: 'nenhum', oculosCor: 'chiclete', bolsa: 'nenhum', bolsaCor: 'chiclete', cenario: 'quarto'
  };

  /* Desafios: cada um tem 3 dicas. Estrelas = dicas cumpridas, mas sempre pelo menos 1 (ninguém perde).
     Forma das dicas (conferidas em visual.js):
       { c: 'sapatos', tag: 'praia' }        a peça visível da categoria tem essa tag
       { c: 'cabeca', v: ['coroa','tiara'] } a categoria está numa dessas opções
       { c: 'glitter', algum: true }         a categoria não está em "nenhum"
       { roupa: true, tag: 'praia' }         alguma roupa visível (vestido, blusa, saia, calça) tem a tag
       { roupa: true, fam: ['azul'] }        alguma roupa visível é de uma cor dessa família
       { qualquer: [ … ] } / { todos: [ … ] } */
  var DESAFIOS = [
    { id: 'praia', ico: '🏖️', cenario: 'praia', pt: 'Festa na praia', en: 'Beach party', dicas: [
      { pt: 'Roupa fresquinha de verão', en: 'Cool summer clothes', t: { roupa: true, tag: 'verao' } },
      { pt: 'Algo para o sol: chapéu ou óculos de sol', en: 'Something for the sun: hat or sunglasses', t: { qualquer: [{ c: 'cabeca', v: ['chapeu'] }, { c: 'oculos', v: ['sol'] }] } },
      { pt: 'Sandália nos pés', en: 'Sandals on your feet', t: { c: 'sapatos', v: ['sandalia'] } }
    ] },
    { id: 'baile', ico: '👑', cenario: 'castelo', pt: 'Baile de princesa', en: 'Princess ball', dicas: [
      { pt: 'Vestido de princesa ou de sereia', en: 'Princess or mermaid gown', t: { c: 'vestido', v: ['princesa', 'sereia'] } },
      { pt: 'Coroa ou tiara', en: 'Crown or tiara', t: { c: 'cabeca', v: ['coroa', 'tiara'] } },
      { pt: 'Muito brilho: glitter ou sombra brilhante', en: 'Lots of sparkle: glitter or shimmer shadow', t: { qualquer: [{ c: 'glitter', algum: true }, { c: 'sombra', v: ['brilhante'] }] } }
    ] },
    { id: 'show', ico: '🎤', cenario: 'palco', pt: 'Show de pop star', en: 'Pop star concert', dicas: [
      { pt: 'Roupa de pop star', en: 'Pop star outfit', t: { roupa: true, tag: 'pop' } },
      { pt: 'Estrela: nos óculos, nos brincos, no laço ou no rosto', en: 'A star: glasses, earrings, clip or face', t: { qualquer: [{ c: 'oculos', v: ['estrela'] }, { c: 'brincos', v: ['estrela'] }, { c: 'laco', v: ['estrela'] }, { c: 'adesivo', v: ['estrela'] }] } },
      { pt: 'Delineado e batom', en: 'Eyeliner and lipstick', t: { todos: [{ c: 'delineado', algum: true }, { c: 'batom', algum: true }] } }
    ] },
    { id: 'piquenique', ico: '🌸', cenario: 'jardim', pt: 'Piquenique no jardim', en: 'Garden picnic', dicas: [
      { pt: 'Uma flor: na cabeça, no rosto, no colar ou na estampa', en: 'A flower: head, face, necklace or pattern', t: { qualquer: [{ c: 'cabeca', v: ['flores'] }, { c: 'adesivo', v: ['flor', 'borboleta'] }, { c: 'colar', v: ['flores'] }, { c: 'estampa', v: ['flores'] }] } },
      { pt: 'Cesta de piquenique', en: 'Picnic basket', t: { c: 'bolsa', v: ['cesta'] } },
      { pt: 'Roupa de cor clarinha', en: 'Light-colored clothes', t: { roupa: true, fam: ['claro'] } }
    ] },
    { id: 'pijama', ico: '🌙', cenario: 'quarto', pt: 'Festa do pijama', en: 'Sleepover', dicas: [
      { pt: 'Pijama ou camisola', en: 'Pajamas or nightgown', t: { roupa: true, tag: 'pijama' } },
      { pt: 'Pantufa', en: 'Slippers', t: { c: 'sapatos', v: ['pantufa'] } },
      { pt: 'Adesivo de lua ou estrela', en: 'Moon or star sticker', t: { c: 'adesivo', v: ['lua', 'estrela'] } }
    ] },
    { id: 'neve', ico: '❄️', cenario: 'neve', pt: 'Dia de neve', en: 'Snow day', dicas: [
      { pt: 'Gorro na cabeça', en: 'Beanie on your head', t: { c: 'cabeca', v: ['gorro'] } },
      { pt: 'Roupa quentinha', en: 'Warm clothes', t: { roupa: true, tag: 'inverno' } },
      { pt: 'Bota nos pés', en: 'Boots on your feet', t: { c: 'sapatos', v: ['bota'] } }
    ] },
    { id: 'aniversario', ico: '🎂', cenario: 'festa', pt: 'Festa de aniversário', en: 'Birthday party', dicas: [
      { pt: 'Roupa de festa', en: 'Party clothes', t: { roupa: true, tag: 'festa' } },
      { pt: 'Laço no cabelo', en: 'A bow in your hair', t: { c: 'laco', v: ['alto', 'lado', 'dois'] } },
      { pt: 'Um coração: bolsa, colar, brincos ou rosto', en: 'A heart: bag, necklace, earrings or face', t: { qualquer: [{ c: 'bolsa', v: ['coracao'] }, { c: 'colar', v: ['coracao'] }, { c: 'brincos', v: ['coracao'] }, { c: 'adesivo', v: ['coracao'] }, { c: 'blush', v: ['coracao'] }] } }
    ] },
    { id: 'sereia', ico: '🧜‍♀️', cenario: 'mar', pt: 'Sereia no fundo do mar', en: 'Mermaid under the sea', dicas: [
      { pt: 'Vestido de sereia', en: 'Mermaid dress', t: { c: 'vestido', v: ['sereia'] } },
      { pt: 'Concha no rosto', en: 'Shell on your face', t: { c: 'adesivo', v: ['concha'] } },
      { pt: 'Cores do mar: azul, verde ou lilás', en: 'Sea colors: blue, green or lilac', t: { roupa: true, fam: ['mar'] } }
    ] },
    { id: 'joias', ico: '💎', cenario: 'castelo', pt: 'Noite das joias', en: 'Jewelry night', dicas: [
      { pt: 'Brincos de joia: pérola, diamante, gota ou pingente', en: 'Jewel earrings: pearl, diamond, drop or chandelier', t: { c: 'brincos', tag: 'joia' } },
      { pt: 'Colar de joia', en: 'A jewel necklace', t: { c: 'colar', tag: 'joia' } },
      { pt: 'Pulseira ou anel', en: 'A bracelet or a ring', t: { qualquer: [{ c: 'pulseira', algum: true }, { c: 'anel', algum: true }] } }
    ] },
    { id: 'maluco', ico: '🤪', cenario: 'festa', pt: 'Dia do cabelo maluco', en: 'Crazy hair day', dicas: [
      { pt: 'Cabelo de cor divertida (rosa, lilás, azul ou verde-água)', en: 'Fun hair color (pink, lilac, blue or aqua)', t: { c: 'cabeloCor', v: ['rosa', 'lilas', 'azul', 'menta'] } },
      { pt: 'Mechas coloridas', en: 'Colored highlights', t: { c: 'mechas', algum: true } },
      { pt: 'Penteado divertido: puffs, coquinhos, chiquinhas ou black power', en: 'Fun hairdo: puffs, space buns, pigtails or afro', t: { c: 'cabelo', v: ['puffs', 'coqueDuplo', 'chiquinhas', 'afro'] } }
    ] }
  ];

  var porId = {};
  CATEGORIAS.forEach(function (cat) { porId[cat.id] = cat; });
  function categoria(id) { return porId[id] || null; }
  function opcao(catId, id) { var cat = porId[catId]; if (!cat || !cat.opcoes) return null; for (var i = 0; i < cat.opcoes.length; i++) if (cat.opcoes[i].id === id) return cat.opcoes[i]; return null; }
  function cor(paleta, id) { var l = CORES[paleta] || []; for (var i = 0; i < l.length; i++) if (l[i].id === id) return l[i]; return l[0] || null; }

  var API = { ZOOM: ZOOM, CORES: CORES, GRUPOS: GRUPOS, CATEGORIAS: CATEGORIAS, PADRAO: PADRAO, DESAFIOS: DESAFIOS, categoria: categoria, opcao: opcao, cor: cor };
  raiz.PurpurinaPecas = API;
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
})(typeof window !== 'undefined' ? window : this);
