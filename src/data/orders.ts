// Interfaz para la información de envío
export interface ShippingInfo {
  name: string;
  address: string;
  city: string;
  phone: string;
  email: string;
}

// Interfaz para los items del pedido
export interface OrderItem {
  name: string;
  img: string;
  price: number;
  quantity: number;
}

// Interfaz para el pedido completo
export interface Order {
  id: string;
  date: string;
  shippingInfo: ShippingInfo;
  items: OrderItem[];
  subtotal: number;
  shippingCost: number;
  total: number;
  status: 'pendiente' | 'en proceso' | 'enviado' | 'entregado' | 'cancelado';
}

// Lista de pedidos para mostrar en el dashboard
const orders: Order[] = [
  {
    id: "ORD-001",
    date: "2025-04-20T14:30:00Z",
    shippingInfo: {
      name: "Juan Pérez",
      address: "Av. Arequipa 123",
      city: "Lima",
      phone: "987654321",
      email: "juan@example.com"
    },
    items: [
      {
        name: "Torta de Chocolate",
        img: "/src/assets/products/torta_1.jpeg",
        price: 75.00,
        quantity: 1
      },
      {
        name: "Caja de Galletas",
        img: "/src/assets/products/box_2.jpg",
        price: 45.00,
        quantity: 2
      }
    ],
    subtotal: 165.00,
    shippingCost: 15.00,
    total: 180.00,
    status: "pendiente"
  },
  {
    id: "ORD-002",
    date: "2025-04-18T10:15:00Z",
    shippingInfo: {
      name: "María Rodríguez",
      address: "Jr. Cusco 456",
      city: "Lima",
      phone: "912345678",
      email: "maria@example.com"
    },
    items: [
      {
        name: "Torta de Fresa",
        img: "/src/assets/products/torta_2.jpg",
        price: 80.00,
        quantity: 1
      }
    ],
    subtotal: 80.00,
    shippingCost: 15.00,
    total: 95.00,
    status: "en proceso"
  },
  {
    id: "ORD-003",
    date: "2025-04-15T16:45:00Z",
    shippingInfo: {
      name: "Carlos Gómez",
      address: "Av. La Marina 789",
      city: "Lima",
      phone: "945678123",
      email: "carlos@example.com"
    },
    items: [
      {
        name: "Catering Ejecutivo",
        img: "/src/assets/products/catering_1.jpg",
        price: 250.00,
        quantity: 1
      },
      {
        name: "Torta de Cumpleaños",
        img: "/src/assets/products/cumple_1.jpg",
        price: 90.00,
        quantity: 1
      }
    ],
    subtotal: 340.00,
    shippingCost: 15.00,
    total: 355.00,
    status: "entregado"
  }
];

export default orders;