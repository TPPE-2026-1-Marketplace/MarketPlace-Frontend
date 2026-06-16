export interface Coupon {
  id: string;
  campaignName: string;
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  startDate: string;
  endDate: string;
  usageLimit: number;
  usageCount: number;
  partner: string;
  active: boolean;
  applicableProducts: string[]; // product IDs, empty = all products
  createdAt: string;
}

export const MOCK_COUPONS: Coupon[] = [
  {
    id: "c-001",
    campaignName: "Black Friday 2024",
    code: "BLACK2024",
    discountType: "percentage",
    discountValue: 20,
    startDate: "2024-11-20",
    endDate: "2024-11-30",
    usageLimit: 500,
    usageCount: 234,
    partner: "Marketing DK",
    active: true,
    applicableProducts: [],
    createdAt: "2024-11-01",
  },
  {
    id: "c-002",
    campaignName: "Influencer @mariafestas",
    code: "MARIA10",
    discountType: "percentage",
    discountValue: 10,
    startDate: "2024-11-01",
    endDate: "2024-12-31",
    usageLimit: 100,
    usageCount: 67,
    partner: "Maria Festas",
    active: true,
    applicableProducts: ["1", "2", "3"],
    createdAt: "2024-10-28",
  },
  {
    id: "c-003",
    campaignName: "Primeira Compra",
    code: "BEMVINDA50",
    discountType: "fixed",
    discountValue: 50,
    startDate: "2024-01-01",
    endDate: "2024-12-31",
    usageLimit: 1000,
    usageCount: 456,
    partner: "Marketing DK",
    active: true,
    applicableProducts: [],
    createdAt: "2024-01-01",
  },
  {
    id: "c-004",
    campaignName: "Embaixadora Ana Silva",
    code: "ANA15",
    discountType: "percentage",
    discountValue: 15,
    startDate: "2024-10-01",
    endDate: "2025-03-31",
    usageLimit: 200,
    usageCount: 89,
    partner: "Ana Silva",
    active: true,
    applicableProducts: ["4", "5", "6", "7"],
    createdAt: "2024-09-25",
  },
  {
    id: "c-005",
    campaignName: "Liquidação Verão",
    code: "VERAO2024",
    discountType: "percentage",
    discountValue: 30,
    startDate: "2024-01-15",
    endDate: "2024-02-28",
    usageLimit: 300,
    usageCount: 300,
    partner: "Marketing DK",
    active: false,
    applicableProducts: [],
    createdAt: "2024-01-10",
  },
];
