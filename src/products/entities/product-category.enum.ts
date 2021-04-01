export enum ProductCategory {
  ACESSORIOS = 'ACESSORIOS',
  ANEIS = 'ANEIS',
  BERLOQUES = 'BERLOQUES',
  BRINCOS = 'BRINCOS',
  CAMISETAS = 'CAMISETAS',
  COLARES = 'COLARES',
  CONJUNTOS = 'CONJUNTOS',
  DECORACAO = 'DECORACAO',
  PULSEIRAS = 'PULSEIRAS',
  // TEMP
  MAE_EMPREENDEDORA = 'MAE_EMPREENDEDORA',
  MAE_ARTISTA = 'MAE_ARTISTA',
  MAE_CASEIRA = 'MAE_CASEIRA',
  MAE_ESTILOSA = 'MAE_ESTILOSA',
  MAE_CLASSICA = 'MAE_CLÁSSICA',
}

export function categoryDescription(category: ProductCategory) {
  switch (category) {
    case ProductCategory.ACESSORIOS:
      return 'Acessórios';
    case ProductCategory.ANEIS:
      return 'Anéis';
    case ProductCategory.BERLOQUES:
      return 'Berloques';
    case ProductCategory.BRINCOS:
      return 'Brincos';
    case ProductCategory.CAMISETAS:
      return 'Camisetas';
    case ProductCategory.COLARES:
      return 'Colares';
    case ProductCategory.CONJUNTOS:
      return 'Conjuntos';
    case ProductCategory.DECORACAO:
      return 'Decoração';
    case ProductCategory.PULSEIRAS:
      return 'Pulseiras';
    case ProductCategory.MAE_EMPREENDEDORA:
      return 'Mãe Empreendedora';
    case ProductCategory.MAE_ARTISTA:
      return 'Mãe Artista';
    case ProductCategory.MAE_CASEIRA:
      return 'Mãe Caseira';
    case ProductCategory.MAE_ESTILOSA:
      return 'Mãe Estilosa';
    case ProductCategory.MAE_CLASSICA:
      return 'Mãe Clássica';
  }
}
