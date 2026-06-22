export interface ApiVariant {
  codigoSku: string;
  precoVariante: number;
  cor: string | null;
  tamanho: string | null;
}

export interface ApiOrder {
  idPedido: number;
  idUsuario: string | null;
  idFuncionario?: string;
  clienteNomeAvulso?: string;
  user?: {
    cpf: string;
    nome: string;
    email: string;
  };
  employee?: {
    cpf: string;
    person?: {
      nome: string;
    };
  };
  valorTotal: string;
  status: string;
  tipoRetirada: "entrega" | "loja";
  dataPedido: string;
  items: any[];
}

export interface ApiProduct {
  idProduto: number;
  titulo: string;
  descricao: string | null;
  precoBase: number;
  sku: string;
  variants: ApiVariant[];
}

export interface POSSaleItem {
  product: ApiProduct;
  variantSku: string;
  size: string;
  color: string;
  quantity: number;
  unitPrice: number;
}

export interface POSSale {
  id: string;
  items: POSSaleItem[];
  subtotal: number;
  total: number;
  paymentMethod: "pix" | "card";
  sellerId: string;
  sellerName: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  date: string;
  timestamp: number;
}
