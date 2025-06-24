import api from "./api.base";

// Tipos de enums como string para JS/TS (según tu backend)
export enum PaymentMethod {
  TARJETA = "TARJETA",
  YAPE = "YAPE", 
  CONTRAENTREGA = "CONTRAENTREGA",
}

export enum DeliveryMethod {
  ENVIO_A_DIRECCION = "ENVIO_A_DIRECCION",
  RECOJO_EN_TIENDA = "RECOJO_EN_TIENDA",
}

export enum OrderStatus {
  PENDIENTE = "PENDIENTE",
  PREPARACION = "PREPARACION", 
  TERMINADO = "TERMINADO",
}

// Interfaces para las requests
export interface CreateOrderRequest {
  items: Array<{ [key: string]: any }>; // List<Map<String, Any>> del backend
  paymentMethod: PaymentMethod;
  shippingInfo: string | null;
  deliveryMethod: DeliveryMethod;
  userId: number;
}

export interface UpdateStatusRequest {
  status: OrderStatus;
}

// Interface para el modelo de orden (basado en SaleOrderModel)
export interface SaleOrder {
  id: number;
  userId: number;
  items: Array<{ [key: string]: any }>;
  paymentMethod: PaymentMethod;
  shippingInfo: string | null;
  deliveryMethod: DeliveryMethod;
  status: OrderStatus;
  subtotal: number;
  shippingCost: number;
  total: number;
  createdAt?: string;
  updatedAt?: string;
  date:string
}

// API Methods

/**
 * Crear una nueva orden (POST /orders)
 */
export const createOrder = async (order: CreateOrderRequest): Promise<SaleOrder> => {
  return api.post<SaleOrder>("/orders", order);
};

/**
 * Obtener todas las órdenes (GET /orders)
 * - Si es admin/empleado: devuelve todas las órdenes
 * - Si es usuario normal: devuelve solo sus órdenes
 */
export const getAllOrders = async (): Promise<SaleOrder[]> => {
  return api.get<SaleOrder[]>("/orders");
};

/**
 * Obtener una orden por ID (GET /orders/{id})
 * Solo accesible por el dueño de la orden, admin o empleado
 */
export const getOrderById = async (id: number): Promise<SaleOrder> => {
  return api.get<SaleOrder>(`/orders/${id}`);
};

/**
 * Obtener órdenes por ID de usuario (GET /orders/user/{userId})
 * Requiere permisos de admin, empleado o ser el usuario actual
 */
export const getOrdersByUserId = async (userId: number): Promise<SaleOrder[]> => {
  return api.get<SaleOrder[]>(`/orders/user/${userId}`);
};

/**
 * Obtener órdenes por estado (GET /orders/status/{status})
 */
export const getOrdersByStatus = async (status: OrderStatus): Promise<SaleOrder[]> => {
  return api.get<SaleOrder[]>(`/orders/status/${status}`);
};

/**
 * Actualizar el estado de una orden (PATCH /orders/{id}/status)
 * Solo accesible por admin o empleado
 */
export const updateOrderStatus = async (
  id: number, 
  request: UpdateStatusRequest
): Promise<SaleOrder> => {
  return api.patch<SaleOrder>(`/orders/${id}/status`, request);
};

/**
 * Eliminar una orden (DELETE /orders/{id})
 * Solo accesible por admin o empleado
 */
export const deleteOrder = async (id: number): Promise<{ deleted: boolean }> => {
  return api.delete<{ deleted: boolean }>(`/orders/${id}`);
};