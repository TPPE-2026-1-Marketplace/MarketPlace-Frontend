export interface Product {
  id: string;
  sku: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: "debutante" | "formatura" | "casamento" | "festa";
  categories?: string[]; // múltiplas categorias simultâneas
  tipo?: "midi" | "longo" | "longuete";
  images: string[];
  sizes: string[];
  colors: string[];
  stockEcommerce: number;
  stockPhysical: number;
  featured: boolean;
  brand?: string;
  tags?: string[];
}

export interface Order {
  id: string;
  customer: string;
  email: string;
  phone: string;
  items: { product: Product; size: string; color: string; quantity: number }[];
  total: number;
  status: "pendente" | "confirmado" | "enviado" | "entregue" | "cancelado";
  type: "online" | "loja";
  date: string;
  address?: string;
  payment?: string;
  trackingCode?: string;
}

export const PRODUCTS: Product[] = [
  {
    id: "1",
    sku: "DK-001",
    name: "Vestido Rosa Encanto",
    description:
      "Vestido de festa longo em tule rose com brilhos delicados. Perfeito para debutantes que desejam um visual sofisticado e elegante. Tecido de alta qualidade com saia volumosa e corpete bordado.",
    price: 1890.0,
    originalPrice: 2200.0,
    category: "debutante",
    categories: ["debutante", "longo"],
    tipo: "longo",
    images: [
      "https://images.unsplash.com/photo-1608022770735-726e05d6bfe0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbGVnYW50JTIwYmFsbCUyMGdvd24lMjBldmVuaW5nJTIwZHJlc3MlMjBwaW5rfGVufDF8fHx8MTc3NTA0MjQ1M3ww&ixlib=rb-4.1.0&q=80&w=1080",
    ],
    sizes: ["38", "40", "42", "44", "46", "48"],
    colors: ["Rosa", "Branco", "Champagne"],
    stockEcommerce: 8,
    stockPhysical: 5,
    featured: true,
    brand: "DK Exclusivo",
    tags: ["debutante", "longo", "tule", "brilhos"],
  },
  {
    id: "2",
    sku: "DK-002",
    name: "Vestido Azul Safira",
    description:
      "Vestido longo com paetês azul safira, ideal para formaturas e festas de gala. Corte sereia valoriza a silhueta com elegância incomparável.",
    price: 2350.0,
    originalPrice: 2800.0,
    category: "formatura",
    categories: ["formatura", "festa", "longo"],
    tipo: "longo",
    images: [
      "https://images.unsplash.com/photo-1759349394750-f85f5c3fc4b2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwYXJ0eSUyMGRyZXNzJTIwYmx1ZSUyMHNlcXVpbiUyMGZvcm1hbHxlbnwxfHx8fDE3NzUwNDI0NTR8MA&ixlib=rb-4.1.0&q=80&w=1080",
    ],
    sizes: ["38", "40", "42", "44", "46"],
    colors: ["Azul Safira", "Azul Royal", "Navy"],
    stockEcommerce: 6,
    stockPhysical: 4,
    featured: true,
    brand: "DK Premium",
    tags: ["formatura", "paetê", "sereia", "longo"],
  },
  {
    id: "3",
    sku: "DK-003",
    name: "Vestido Rubi Passion",
    description:
      "Vestido vermelho intenso com decote profundo e fenda lateral. Design moderno e ousado para mulheres que querem se destacar em qualquer evento especial.",
    price: 1650.0,
    category: "festa",
    categories: ["festa", "longo"],
    tipo: "longo",
    images: [
      "https://images.unsplash.com/photo-1765229278873-edd7918dd31d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyZWQlMjBmb3JtYWwlMjBnb3duJTIwd29tZW4lMjBmYXNoaW9ufGVufDF8fHx8MTc3NTA0MjQ1NXww&ixlib=rb-4.1.0&q=80&w=1080",
    ],
    sizes: ["38", "40", "42", "44", "46", "48", "50"],
    colors: ["Vermelho", "Bordô", "Coral"],
    stockEcommerce: 12,
    stockPhysical: 7,
    featured: true,
    brand: "DK Fashion",
    tags: ["festa", "vermelho", "decote", "fenda"],
  },
  {
    id: "4",
    sku: "DK-004",
    name: "Vestido Dourado Luxo",
    description:
      "Vestido dourado com bordados artesanais e tecido nobre. Um verdadeiro luxo para noites especiais, casamentos e formaturas de prestígio.",
    price: 3200.0,
    originalPrice: 3800.0,
    category: "casamento",
    categories: ["casamento", "formatura", "longo"],
    tipo: "longo",
    images: [
      "https://images.unsplash.com/photo-1765229294711-69b1c8d769db?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnb2xkJTIwY2hhbXBhZ25lJTIwcHJvbSUyMGRyZXNzJTIwZWxlZ2FudHxlbnwxfHx8fDE3NzUwNDI0NTZ8MA&ixlib=rb-4.1.0&q=80&w=1080",
    ],
    sizes: ["38", "40", "42", "44", "46"],
    colors: ["Dourado", "Champagne", "Bronze"],
    stockEcommerce: 3,
    stockPhysical: 2,
    featured: true,
    brand: "DK Couture",
    tags: ["casamento", "dourado", "bordado", "luxo"],
  },
  {
    id: "6",
    sku: "DK-006",
    name: "Vestido Lilás Encantado",
    description:
      "Vestido lilás com sobreposição em organza e detalhes florais. Ideal para festas ao ar livre, formaturas e eventos sociais elegantes.",
    price: 1450.0,
    originalPrice: 1750.0,
    category: "formatura",
    categories: ["formatura", "longuete"],
    tipo: "longuete",
    images: [
      "https://images.unsplash.com/photo-1559034750-cdab70a66b8e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwdXJwbGUlMjBsYXZlbmRlciUyMGV2ZW5pbmclMjBnb3duJTIwZmFzaGlvbnxlbnwxfHx8fDE3NzUwNDI0NTZ8MA&ixlib=rb-4.1.0&q=80&w=1080",
    ],
    sizes: ["38", "40", "42", "44", "46", "48", "50"],
    colors: ["Lilás", "Lavanda", "Rosa Bebê"],
    stockEcommerce: 10,
    stockPhysical: 6,
    featured: false,
    brand: "DK Fashion",
    tags: ["formatura", "lilás", "organza", "floral"],
  },
  {
    id: "7",
    sku: "DK-007",
    name: "Vestido Verde Esmeralda",
    description:
      "Vestido verde esmeralda com brilhos e decote em V. Um vestido impactante para quem quer arrasar nas festas mais exclusivas.",
    price: 1980.0,
    category: "festa",
    categories: ["festa", "midi"],
    tipo: "midi",
    images: [
      "https://images.unsplash.com/photo-1765229280487-a0dd5add4f1d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxncmVlbiUyMGVtZXJhbGQlMjBjb2NrdGFpbCUyMGRyZXNzJTIwZmFzaGlvbiUyMG1vZGVsfGVufDF8fHx8MTc3NTA0MjQ2Mnww&ixlib=rb-4.1.0&q=80&w=1080",
    ],
    sizes: ["38", "40", "42", "44", "46"],
    colors: ["Verde Esmeralda", "Verde Musgo", "Tiffany"],
    stockEcommerce: 7,
    stockPhysical: 4,
    featured: false,
    brand: "DK Premium",
    tags: ["festa", "verde", "brilhos", "decote"],
  },
  {
    id: "8",
    sku: "DK-008",
    name: "Vestido Preto Glamour",
    description:
      "Vestido preto longo com fenda e detalhe em pedraria. O clássico atemporal reinventado com muito glamour e sofisticação para eventos noturnos.",
    price: 2100.0,
    originalPrice: 2500.0,
    category: "festa",
    categories: ["festa", "casamento", "longo"],
    tipo: "longo",
    images: [
      "https://images.unsplash.com/photo-1764593822643-3a6d3502c176?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxibGFjayUyMGVsZWdhbnQlMjBsb25nJTIwZHJlc3MlMjB3b21hbiUyMGdvd258ZW58MXx8fHwxNzc1MDQyNDYzfDA&ixlib=rb-4.1.0&q=80&w=1080",
    ],
    sizes: ["38", "40", "42", "44", "46", "48", "50", "52"],
    colors: ["Preto", "Grafite"],
    stockEcommerce: 15,
    stockPhysical: 8,
    featured: false,
    brand: "DK Fashion",
    tags: ["festa", "preto", "glamour", "clássico", "pedraria"],
  },
  {
    id: "9",
    sku: "DK-009",
    name: "Vestido Champagne Midi",
    description:
      "Vestido midi em champagne com tecido fluido e bordados em renda. Elegante e versátil, ideal para formaturas, casamentos e eventos sociais.",
    price: 1280.0,
    originalPrice: 1590.0,
    category: "formatura",
    categories: ["formatura", "casamento", "midi"],
    tipo: "midi",
    images: [
      "https://images.unsplash.com/photo-1645903807096-03481cb28cbb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaGFtcGFnbmUlMjBwcm9tJTIwZHJlc3MlMjBlbGVnYW50JTIwZ3JhZHVhdGlvbiUyMGdvd258ZW58MXx8fHwxNzc2MjEzNzgyfDA&ixlib=rb-4.1.0&q=80&w=1080",
    ],
    sizes: ["38", "40", "42", "44", "46", "48", "50", "52", "54"],
    colors: ["Champagne", "Nude", "Creme"],
    stockEcommerce: 9,
    stockPhysical: 5,
    featured: true,
    brand: "DK Premium",
    tags: ["formatura", "midi", "champagne", "renda"],
  },
  {
    id: "10",
    sku: "DK-010",
    name: "Vestido Branco Debutante",
    description:
      "Vestido branco longuete com corpete estruturado e saia em camadas de tule. O sonho de toda debutante, com leveza e sofisticação inigualáveis.",
    price: 2450.0,
    category: "debutante",
    categories: ["debutante", "longuete"],
    tipo: "longuete",
    images: [
      "https://images.unsplash.com/photo-1763959951334-575a221bec82?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3aGl0ZSUyMGJhbGwlMjBnb3duJTIwZGVidXRhbnRlJTIwcHJpbmNlc3MlMjBmb3JtYWx8ZW58MXx8fHwxNzc2MjEzNzgyfDA&ixlib=rb-4.1.0&q=80&w=1080",
    ],
    sizes: ["38", "40", "42", "44", "46"],
    colors: ["Branco", "Off-White", "Marfim"],
    stockEcommerce: 5,
    stockPhysical: 3,
    featured: true,
    brand: "DK Exclusivo",
    tags: ["debutante", "longuete", "branco", "tule"],
  },
  {
    id: "11",
    sku: "DK-011",
    name: "Vestido Nude Elegance",
    description:
      "Vestido longuete nude com recortes estratégicos e tecido aderente de alta qualidade. Sofisticação pura para eventos de gala e formaturas.",
    price: 1760.0,
    category: "festa",
    categories: ["festa", "formatura", "longuete"],
    tipo: "longuete",
    images: [
      "https://images.unsplash.com/photo-1765229279146-2acf43b5a553?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsb25ndWV0ZSUyMGZvcm1hbCUyMGdvd24lMjB3b21hbiUyMGVsZWdhbnQlMjBldmVuaW5nfGVufDF8fHx8MTc3NjIxMzc3N3ww&ixlib=rb-4.1.0&q=80&w=1080",
    ],
    sizes: ["38", "40", "42", "44", "46", "48", "50", "52", "54", "56", "58"],
    colors: ["Nude", "Champagne", "Rosê"],
    stockEcommerce: 8,
    stockPhysical: 4,
    featured: false,
    brand: "DK Fashion",
    tags: ["festa", "nude", "longuete", "gala"],
  },
  {
    id: "12",
    sku: "DK-012",
    name: "Vestido Cocktail Bordô",
    description:
      "Vestido midi bordô com decote elegante e cintura marcada. Perfeito para festas sofisticadas, jantares e eventos sociais de alto padrão.",
    price: 1120.0,
    category: "festa",
    categories: ["festa", "casamento", "midi"],
    tipo: "midi",
    images: [
      "https://images.unsplash.com/photo-1704775989614-8435994e4e97?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbGVnYW50JTIwbWlkaSUyMGNvY2t0YWlsJTIwZHJlc3MlMjBmYXNoaW9uJTIwbW9kZWx8ZW58MXx8fHwxNzc2MjEzNzc3fDA&ixlib=rb-4.1.0&q=80&w=1080",
    ],
    sizes: ["38", "40", "42", "44", "46", "48", "50", "52", "54", "56"],
    colors: ["Bordô", "Vinho", "Marsala"],
    stockEcommerce: 11,
    stockPhysical: 6,
    featured: false,
    brand: "DK Fashion",
    tags: ["festa", "midi", "bordô", "cocktail"],
  },
];

export const MOCK_ORDERS: Order[] = [
  {
    id: "PED-2026-001",
    customer: "Maria Silva",
    email: "maria@email.com",
    phone: "(61) 98765-4321",
    items: [
      {
        product: PRODUCTS[0],
        size: "40",
        color: "Rosa",
        quantity: 1,
      },
    ],
    total: 1890.0,
    status: "confirmado",
    type: "online",
    date: "2026-03-28",
    address: "SQN 415, Bloco A, Apt 301 - Asa Norte, Brasília, DF",
    payment: "Cartão de Crédito",
  },
  {
    id: "PED-2026-002",
    customer: "Juliana Costa",
    email: "juliana@email.com",
    phone: "(61) 97654-3210",
    items: [
      {
        product: PRODUCTS[1],
        size: "42",
        color: "Azul Safira",
        quantity: 1,
      },
    ],
    total: 2350.0,
    status: "enviado",
    type: "online",
    date: "2026-03-25",
    address: "SHIS QI 09, Bloco F - Lago Sul, Brasília, DF",
    payment: "PIX",
  },
  {
    id: "PED-2026-003",
    customer: "Ana Beatriz",
    email: "ana@email.com",
    phone: "(61) 96543-2109",
    items: [
      {
        product: PRODUCTS[8],
        size: "40",
        color: "Champagne",
        quantity: 1,
      },
    ],
    total: 2450.0,
    status: "pendente",
    type: "loja",
    date: "2026-03-30",
    payment: "Boleto Bancário",
  },
  {
    id: "PED-2026-004",
    customer: "Fernanda Lima",
    email: "fernanda@email.com",
    phone: "(61) 95432-1098",
    items: [
      {
        product: PRODUCTS[2],
        size: "44",
        color: "Vermelho",
        quantity: 1,
      },
      {
        product: PRODUCTS[6],
        size: "44",
        color: "Preto",
        quantity: 1,
      },
    ],
    total: 3750.0,
    status: "entregue",
    type: "online",
    date: "2026-03-15",
    address: "CLN 206, Bloco C - Asa Norte, Brasília, DF",
    payment: "Cartão de Crédito",
  },
  {
    id: "PED-2026-005",
    customer: "Carolina Mendes",
    email: "carolina@email.com",
    phone: "(61) 94321-0987",
    items: [
      {
        product: PRODUCTS[3],
        size: "40",
        color: "Dourado",
        quantity: 1,
      },
    ],
    total: 3200.0,
    status: "cancelado",
    type: "loja",
    date: "2026-03-20",
    payment: "Cartão de Débito",
  },
];
