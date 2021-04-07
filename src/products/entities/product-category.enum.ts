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
  MAE_LOUCA_POR_FRIDA = 'MAE_LOUCA_POR_FRIDA',
  MAE_CASEIRA = 'MAE_CASEIRA',
  MAE_DESCOLADA = 'MAE_DESCOLADA',
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
    case ProductCategory.MAE_LOUCA_POR_FRIDA:
      return 'Mãe Louca Por Frida';
    case ProductCategory.MAE_CASEIRA:
      return 'Mãe Caseira';
    case ProductCategory.MAE_DESCOLADA:
      return 'Mãe Descolada';
    case ProductCategory.MAE_CLASSICA:
      return 'Mãe Clássica';
  }
}
