export interface EmployeeSale {
  id: string;
  employeeId: string;
  orderId: string;
  customer: string;
  product: string;
  amount: number;
  commission: number;
  date: string;
  channel: "online" | "loja";
}

export const MOCK_EMPLOYEE_SALES: EmployeeSale[] = [
  // Ana Vendas (u-003)
  { id: "s-001", employeeId: "u-003", orderId: "PED-2026-003", customer: "Ana Beatriz", product: "Vestido Noiva Clássico", amount: 4500, commission: 225, date: "2026-03-30", channel: "loja" },
  { id: "s-002", employeeId: "u-003", orderId: "PED-2026-006", customer: "Luciana Freitas", product: "Vestido Dourado Luxo", amount: 3200, commission: 160, date: "2026-03-28", channel: "loja" },
  { id: "s-003", employeeId: "u-003", orderId: "PED-2026-007", customer: "Rafaela Gomes", product: "Vestido Rosa Encanto", amount: 1890, commission: 94.5, date: "2026-03-25", channel: "loja" },
  { id: "s-004", employeeId: "u-003", orderId: "PED-2026-008", customer: "Patricia Lemos", product: "Vestido Lilás Encantado", amount: 1450, commission: 72.5, date: "2026-03-22", channel: "loja" },
  { id: "s-005", employeeId: "u-003", orderId: "PED-2026-009", customer: "Daniela Souza", product: "Vestido Verde Esmeralda", amount: 1980, commission: 99, date: "2026-03-18", channel: "loja" },
  { id: "s-006", employeeId: "u-003", orderId: "PED-2026-010", customer: "Camila Torres", product: "Vestido Azul Safira", amount: 2350, commission: 117.5, date: "2026-03-15", channel: "loja" },
  { id: "s-007", employeeId: "u-003", orderId: "PED-2026-011", customer: "Sandra Lima", product: "Vestido Preto Glamour", amount: 2100, commission: 105, date: "2026-03-10", channel: "loja" },
  { id: "s-008", employeeId: "u-003", orderId: "PED-2026-012", customer: "Vanessa Reis", product: "Vestido Rubi Passion", amount: 1650, commission: 82.5, date: "2026-03-05", channel: "loja" },

  // Carlos Moda (u-004)
  { id: "s-009", employeeId: "u-004", orderId: "PED-2026-005", customer: "Carolina Mendes", product: "Vestido Dourado Luxo", amount: 3200, commission: 144, date: "2026-03-20", channel: "loja" },
  { id: "s-010", employeeId: "u-004", orderId: "PED-2026-013", customer: "Joana Alves", product: "Vestido Azul Safira", amount: 2350, commission: 105.75, date: "2026-03-18", channel: "loja" },
  { id: "s-011", employeeId: "u-004", orderId: "PED-2026-014", customer: "Marina Costa", product: "Vestido Rosa Encanto", amount: 1890, commission: 85.05, date: "2026-03-15", channel: "loja" },
  { id: "s-012", employeeId: "u-004", orderId: "PED-2026-015", customer: "Larissa Duarte", product: "Vestido Preto Glamour", amount: 2100, commission: 94.5, date: "2026-03-12", channel: "loja" },
  { id: "s-013", employeeId: "u-004", orderId: "PED-2026-016", customer: "Fernanda Melo", product: "Vestido Lilás Encantado", amount: 1450, commission: 65.25, date: "2026-03-08", channel: "loja" },
  { id: "s-014", employeeId: "u-004", orderId: "PED-2026-017", customer: "Isabela Nunes", product: "Vestido Noiva Clássico", amount: 4500, commission: 202.5, date: "2026-03-05", channel: "loja" },

  // Beatriz Estilo (u-005)
  { id: "s-015", employeeId: "u-005", orderId: "PED-2026-018", customer: "Mariana Pires", product: "Vestido Noiva Clássico", amount: 4500, commission: 247.5, date: "2026-03-29", channel: "loja" },
  { id: "s-016", employeeId: "u-005", orderId: "PED-2026-019", customer: "Claudia Ramos", product: "Vestido Dourado Luxo", amount: 3800, commission: 209, date: "2026-03-26", channel: "loja" },
  { id: "s-017", employeeId: "u-005", orderId: "PED-2026-020", customer: "Priscila Matos", product: "Vestido Verde Esmeralda", amount: 1980, commission: 108.9, date: "2026-03-23", channel: "loja" },
  { id: "s-018", employeeId: "u-005", orderId: "PED-2026-021", customer: "Roberta Farias", product: "Vestido Rubi Passion", amount: 1650, commission: 90.75, date: "2026-03-20", channel: "loja" },
  { id: "s-019", employeeId: "u-005", orderId: "PED-2026-022", customer: "Thaís Carvalho", product: "Vestido Azul Safira", amount: 2350, commission: 129.25, date: "2026-03-17", channel: "loja" },
  { id: "s-020", employeeId: "u-005", orderId: "PED-2026-023", customer: "Viviane Santos", product: "Vestido Rosa Encanto", amount: 1890, commission: 103.95, date: "2026-03-14", channel: "loja" },
  { id: "s-021", employeeId: "u-005", orderId: "PED-2026-024", customer: "Aline Monteiro", product: "Vestido Preto Glamour", amount: 2100, commission: 115.5, date: "2026-03-11", channel: "loja" },
  { id: "s-022", employeeId: "u-005", orderId: "PED-2026-025", customer: "Juliana Tavares", product: "Vestido Lilás Encantado", amount: 1450, commission: 79.75, date: "2026-03-08", channel: "loja" },
];
