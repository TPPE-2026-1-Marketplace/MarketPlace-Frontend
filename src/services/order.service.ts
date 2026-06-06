import { api } from "@/lib/api";
import type { Order, CreateOrderRequest } from "@/models";

export const OrderService = {
  async createOrder(data: CreateOrderRequest): Promise<Order> {
    return api.post<Order>("/orders", data);
  },

  async getOrderById(id: number): Promise<Order> {
    return api.get<Order>(`/orders/${id}`);
  },

  async getMyOrders(): Promise<Order[]> {
    return api.get<Order[]>("/orders/my");
  },
};
