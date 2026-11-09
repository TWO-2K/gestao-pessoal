// Catálogo base de produtos de uso residencial, por setor.
// Usado para pré-cadastrar produtos em um mercado (corredor/prateleira ficam em branco).
const CATALOGO = {
  Hortifruti: [
    "Alface", "Rúcula", "Couve", "Espinafre", "Agrião", "Repolho", "Brócolis", "Couve-flor", "Cenoura", "Beterraba",
    "Batata", "Batata-doce", "Mandioca", "Inhame", "Cebola", "Cebola roxa", "Alho", "Tomate", "Tomate cereja", "Pepino",
    "Pimentão", "Abobrinha", "Berinjela", "Chuchu", "Abóbora", "Vagem", "Milho verde", "Gengibre", "Cheiro-verde",
    "Salsinha", "Cebolinha", "Coentro", "Manjericão", "Limão", "Laranja", "Banana", "Maçã", "Pera", "Uva", "Mamão",
    "Melancia", "Melão", "Abacaxi", "Manga", "Morango", "Abacate", "Kiwi", "Maracujá", "Goiaba", "Tangerina", "Coco",
    "Ovos",
  ],
  Açougue: [
    "Peito de frango", "Coxa e sobrecoxa", "Frango inteiro", "Asa de frango", "Filé de frango", "Carne moída",
    "Patinho", "Acém", "Alcatra", "Contrafilé", "Picanha", "Costela bovina", "Fraldinha", "Maminha", "Cupim",
    "Músculo", "Lombo suíno", "Costelinha suína", "Bisteca suína", "Linguiça toscana", "Linguiça calabresa",
    "Salsicha", "Bacon", "Hambúrguer", "Filé de peixe", "Tilápia", "Salmão", "Sardinha", "Camarão", "Peixe congelado",
  ],
  Padaria: [
    "Pão francês", "Pão de forma", "Pão integral", "Pão de hambúrguer", "Pão de hot dog", "Pão de queijo",
    "Bisnaguinha", "Bolo", "Torrada", "Biscoito de padaria", "Rosca", "Croissant", "Sonho", "Tortilla / wrap",
  ],
  Laticínios: [
    "Leite integral", "Leite desnatado", "Leite sem lactose", "Leite em pó", "Leite condensado", "Creme de leite",
    "Manteiga", "Margarina", "Requeijão", "Cream cheese", "Queijo mussarela", "Queijo prato", "Queijo minas",
    "Queijo parmesão", "Queijo ralado", "Queijo coalho", "Ricota", "Presunto", "Peito de peru", "Mortadela",
    "Iogurte natural", "Iogurte de frutas", "Iogurte grego", "Bebida láctea", "Leite fermentado", "Nata", "Chantilly",
  ],
  Mercearia: [
    "Arroz", "Feijão carioca", "Feijão preto", "Lentilha", "Grão-de-bico", "Macarrão espaguete", "Macarrão parafuso",
    "Macarrão instantâneo", "Lasanha", "Farinha de trigo", "Farinha de mandioca", "Farofa pronta", "Fubá", "Amido de milho",
    "Açúcar refinado", "Açúcar cristal", "Açúcar mascavo", "Adoçante", "Sal", "Óleo de soja", "Azeite", "Vinagre",
    "Molho de tomate", "Extrato de tomate", "Ketchup", "Maionese", "Mostarda", "Molho shoyu", "Molho de pimenta",
    "Milho em conserva", "Ervilha em conserva", "Azeitona", "Palmito", "Atum em lata", "Sardinha em lata", "Café",
    "Café solúvel", "Achocolatado", "Chá", "Leite de coco", "Coco ralado", "Gelatina", "Pudim em pó", "Fermento em pó",
    "Fermento biológico", "Chocolate em barra", "Chocolate em pó", "Granulado", "Doce de leite", "Goiabada", "Geleia",
    "Mel", "Pasta de amendoim", "Biscoito recheado", "Biscoito água e sal", "Biscoito maisena", "Bolacha cream cracker",
    "Cereal matinal", "Aveia", "Granola", "Tapioca", "Pipoca de micro-ondas", "Milho de pipoca", "Salgadinho",
    "Amendoim", "Castanhas", "Barra de cereal", "Sopa instantânea", "Tempero pronto", "Colorau", "Pimenta-do-reino",
    "Orégano", "Cominho", "Louro", "Canela", "Caldo de carne", "Caldo de galinha", "Palha de aço de cozinha",
  ],
  Bebidas: [
    "Água mineral", "Água com gás", "Refrigerante", "Refrigerante zero", "Suco de caixinha", "Suco em pó",
    "Suco concentrado", "Água de coco", "Isotônico", "Energético", "Cerveja", "Vinho", "Espumante", "Cachaça",
    "Whisky", "Vodka", "Gelo",
  ],
  Limpeza: [
    "Detergente", "Sabão em pó", "Sabão líquido", "Sabão em barra", "Amaciante", "Alvejante / água sanitária",
    "Desinfetante", "Multiuso", "Limpa vidros", "Limpa piso", "Desengordurante", "Limpador de banheiro",
    "Limpa forno", "Cloro", "Esponja de cozinha", "Esponja de aço", "Bucha", "Pano de chão", "Pano multiuso",
    "Flanela", "Rodo", "Vassoura", "Pá de lixo", "Balde", "Luvas de limpeza", "Saco de lixo", "Papel toalha",
    "Papel alumínio", "Filme plástico", "Papel manteiga", "Guardanapo", "Palito de dente", "Inseticida", "Repelente",
    "Naftalina", "Odorizador de ambiente", "Vela aromática", "Fósforo", "Isqueiro", "Pilha", "Lâmpada", "Fita adesiva",
    "Sacos plásticos / zip", "Marmita descartável", "Copo descartável", "Prato descartável", "Talheres descartáveis",
  ],
  Higiene: [
    "Papel higiênico", "Sabonete", "Sabonete líquido", "Shampoo", "Condicionador", "Creme de cabelo", "Gel / pomada de cabelo",
    "Creme dental", "Escova de dentes", "Fio dental", "Enxaguante bucal", "Desodorante", "Perfume", "Hidratante",
    "Protetor solar", "Aparelho de barbear", "Espuma / gel de barbear", "Absorvente", "Protetor diário", "Cotonete",
    "Algodão", "Lenço umedecido", "Lenço de papel", "Fralda", "Pomada para assadura", "Acetona", "Esmalte",
    "Tintura de cabelo", "Cortador de unhas", "Lixa de unha", "Curativo", "Álcool 70%", "Álcool em gel",
    "Água oxigenada", "Analgésico", "Antitérmico", "Pente / escova de cabelo", "Preservativo",
  ],
  Congelados: [
    "Pizza congelada", "Lasanha congelada", "Nuggets", "Empanado de frango", "Hambúrguer congelado", "Batata palito congelada",
    "Legumes congelados", "Polpa de fruta", "Sorvete", "Picolé", "Açaí", "Pão de queijo congelado", "Massa folhada",
    "Massa de pastel", "Vegetais congelados", "Peixe empanado",
  ],
  Pet: [
    "Ração para cachorro", "Ração para gato", "Petisco para cachorro", "Petisco para gato", "Areia sanitária",
    "Tapete higiênico", "Sachê para gato", "Shampoo pet", "Antipulgas", "Brinquedo pet",
  ],
  Outros: [
    "Carvão", "Acendedor de churrasco", "Espeto / palito de churrasco", "Vela", "Pilha recarregável", "Extensão elétrica",
    "Película / filme PVC", "Potes plásticos", "Garrafa térmica", "Copo / caneca", "Caderno", "Caneta", "Papel A4",
    "Cartão / presente", "Guarda-chuva",
  ],
};

export const CATALOGO_PRODUTOS = Object.entries(CATALOGO).flatMap(([setor, nomes]) =>
  nomes.map((nome) => ({ nome, setor }))
);
