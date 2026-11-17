import { api } from "@/lib/api";
import type { CatalogImage } from "@/lib/catalog";
import type { ApiProduct, ApiVariant, POSSaleItem, POSSeller } from "@/data/pos-types";

interface ImageLink { ordemNoCatalogo: number; image: CatalogImage }
interface EmployeeResponse {
  cpf: string;
  ativo: boolean;
  role_perfil: string;
  codigo_funcionario: string | null;
  person?: { nome: string };
}

/** A imagem e o saldo físico vêm dos mesmos recursos usados pelo inventário. */
export async function loadPOSProducts(): Promise<ApiProduct[]> {
  const response = await api.get<{ data: ApiProduct[] }>("/products?limit=100");
  return Promise.all(response.data.map(async (product) => ({
    ...product,
    precoBase: Number(product.precoBase),
    variants: await Promise.all(product.variants.map(async (variant) => {
      const sku = encodeURIComponent(variant.codigoSku);
      const [stock, images] = await Promise.allSettled([
        api.get<NonNullable<ApiVariant["stock"]>>("/inventory/" + sku),
        api.get<ImageLink[]>("/images/catalog/" + sku),
      ]);
      return {
        ...variant,
        precoVariante: variant.precoVariante == null ? product.precoBase : Number(variant.precoVariante),
        stock: stock.status === "fulfilled" ? stock.value : undefined,
        images: images.status === "fulfilled" ? [...images.value].sort((a, b) => a.ordemNoCatalogo - b.ordemNoCatalogo).map((link) => link.image) : [],
      };
    })),
  })));
}

export async function loadPOSSellers(): Promise<POSSeller[]> {
  const employees: EmployeeResponse[] = [];
  let page = 1;
  let totalPages = 1;
  do {
    const response = await api.get<{ data: EmployeeResponse[]; meta?: { totalPages: number } }>("/employees", { limit: 100, page });
    employees.push(...response.data);
    totalPages = response.meta?.totalPages ?? 1;
    page += 1;
  } while (page <= totalPages);
  return employees.filter((employee) => employee.ativo && ["vendedor", "caixa", "gerente", "administrador"].includes(employee.role_perfil))
    .map((employee) => ({ cpf: employee.cpf, name: employee.person?.nome || "Funcionário", code: employee.codigo_funcionario }))
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
}

/** O carrinho também consome o saldo que ainda pode ser adicionado à venda. */
export function remainingPhysicalStock(variant: ApiVariant | undefined, items: POSSaleItem[]): number {
  if (!variant || variant.ativo === false || !variant.stock) return 0;
  const inSale = items.filter((item) => item.variantSku === variant.codigoSku).reduce((total, item) => total + item.quantity, 0);
  return Math.max(0, variant.stock.qtdLojaFisica - inSale);
}
