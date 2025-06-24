import { useState, useEffect } from "react";
import { FaSpinner, FaInfoCircle, FaArrowLeft } from "react-icons/fa";
import useUserStore from "../../store/userStore";
import { getOrdersByUserId, SaleOrder } from "../api/order.api";

interface MyOrdersProps {
  show: boolean;
  onClose: () => void;
}

const MyOrders: React.FC<MyOrdersProps> = ({ show, onClose }) => {
  const [orders, setOrders] = useState<SaleOrder[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<SaleOrder | null>(null);
  const { user } = useUserStore();

  // Cargar pedidos del usuario cuando se abre el modal
  useEffect(() => {
    if (show && user?.id) {
      loadUserOrders();
    }
  }, [show, user?.id]);

  // Bloquear el scroll del body cuando se abre el modal
  useEffect(() => {
    if (show) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [show]);

  const loadUserOrders = async () => {
    setLoading(true);
    setError(null);
    
    try {
      if (!user?.id) {
        setError("Usuario no identificado");
        setLoading(false);
        return;
      }
      
      const response:any = await getOrdersByUserId(user.id);
      setOrders(response.data ?? response);
      setLoading(false);
    } catch (err) {
      console.error("Error al cargar pedidos:", err);
      setError("No se pudieron cargar tus pedidos. Por favor, intenta de nuevo más tarde.");
      setLoading(false);
    }
  };

  // Formatear fecha
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Obtener la clase para el badge del estado
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "PENDIENTE":
        return "bg-warning";
      case "PREPARACION":
        return "bg-primary";
      case "TERMINADO":
        return "bg-success";
      default:
        return "bg-secondary";
    }
  };

  // Traducir estados
  const translateStatus = (status: string) => {
    switch (status) {
      case "PENDIENTE":
        return "Pendiente";
      case "PREPARACION":
        return "En preparación";
      case "TERMINADO":
        return "Terminado";
      default:
        return status;
    }
  };

  // Traducir métodos de pago
  const translatePaymentMethod = (method: string) => {
    switch (method) {
      case "TARJETA":
        return "Tarjeta débito/crédito";
      case "YAPE":
        return "Yape/Plin";
      case "CONTRAENTREGA":
        return "Pago contraentrega";
      default:
        return method;
    }
  };

  // Traducir métodos de entrega
  const translateDeliveryMethod = (method: string) => {
    switch (method) {
      case "ENVIO_A_DIRECCION":
        return "Envío a domicilio";
      case "RECOJO_EN_TIENDA":
        return "Recojo en tienda";
      default:
        return method;
    }
  };

  // Calcular total de un pedido
  const calculateOrderTotal = (order: SaleOrder): number => {
    if (order.total) return order.total;
    const itemsTotal = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const shippingCost = order.deliveryMethod === "ENVIO_A_DIRECCION" ? 15 : 0;
    return itemsTotal + shippingCost;
  };

  // Renderizar lista de pedidos
  const renderOrdersList = () => {
    if (loading) {
      return (
        <div className="text-center py-5">
          <FaSpinner className="fa-spin mb-3" size={30} />
          <p>Cargando tus pedidos...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="alert alert-danger m-3">
          <FaInfoCircle className="me-2" />
          {error}
        </div>
      );
    }

    if (orders.length === 0) {
      return (
        <div className="text-center py-5">
          <div className="mb-3">
            <FaInfoCircle size={30} />
          </div>
          <p>No has realizado ningún pedido aún</p>
          <button
            className="btn btn-danger mt-2"
            onClick={onClose}
          >
            Explorar productos
          </button>
        </div>
      );
    }

    return (
      <div className="order-list">
        {orders.map((order) => (
          <div
            key={order.id}
            className="order-card"
            onClick={() => setSelectedOrder(order)}
          >
            <div className="order-card-header">
              <div className="order-info">
                <h6 className="order-number">Pedido #{order.id}</h6>
                <p className="order-date">{formatDate(order.date)}</p>
              </div>
              <div className="order-status-price">
                <span className={`badge ${getStatusBadgeClass(order.status)} mb-2`}>
                  {translateStatus(order.status)}
                </span>
                <div className="order-total">S/ {calculateOrderTotal(order).toFixed(2)}</div>
              </div>
            </div>
            <div className="order-preview">
              <span className="text-muted small">
                {order.items.length} producto{order.items.length > 1 ? 's' : ''} • {translateDeliveryMethod(order.deliveryMethod)}
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Renderizar detalle de un pedido
  const renderOrderDetail = () => {
    if (!selectedOrder) return null;

    const orderTotal = calculateOrderTotal(selectedOrder);
    const subtotal = selectedOrder.subtotal || 
      selectedOrder.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shippingCost = selectedOrder.shippingCost || 
      (selectedOrder.deliveryMethod === "ENVIO_A_DIRECCION" ? 15 : 0);

    return (
      <>
        <div className="order-detail-header">
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary d-flex align-items-center"
            onClick={() => setSelectedOrder(null)}
          >
            <FaArrowLeft className="me-2" size={12} />
            <span className="d-none d-sm-inline">Volver a la lista</span>
            <span className="d-inline d-sm-none">Volver</span>
          </button>
          <h5 className="order-detail-title">
            <span className="d-none d-sm-inline">Detalles del Pedido #{selectedOrder.id}</span>
            <span className="d-inline d-sm-none">Pedido #{selectedOrder.id}</span>
          </h5>
        </div>

        <div className="order-info-card">
          <div className="info-row">
            <span>Estado:</span>
            <span className={`badge ${getStatusBadgeClass(selectedOrder.status)}`}>
              {translateStatus(selectedOrder.status)}
            </span>
          </div>
          <div className="info-row">
            <span>Fecha:</span>
            <span className="text-end">{formatDate(selectedOrder.date)}</span>
          </div>
          <div className="info-row">
            <span>Método de entrega:</span>
            <span className="text-end">{translateDeliveryMethod(selectedOrder.deliveryMethod)}</span>
          </div>
          <div className="info-row">
            <span>Dirección:</span>
            <span className="text-end small">{selectedOrder.shippingInfo}</span>
          </div>
          <div className="info-row">
            <span>Método de pago:</span>
            <span className="text-end">{translatePaymentMethod(selectedOrder.paymentMethod)}</span>
          </div>
        </div>

        <div className="products-section">
          <h6 className="section-title">Productos</h6>
          <div className="products-list">
            {selectedOrder.items.map((item, index) => (
              <div key={index} className="product-item">
                <div className="product-image">
                  <img
                    src={item.product?.imgUrl}
                    alt={item.product?.name}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      const parent = target.parentElement;
                      if (parent) {
                        parent.innerHTML = "Sin imagen";
                        parent.style.fontSize = "0.7rem";
                        parent.style.color = "#6c757d";
                      }
                    }}
                  />
                </div>
                <div className="product-details">
                  <div className="product-name">{item.product?.name}</div>
                  <div className="product-quantity">Cantidad: {item.quantity}</div>
                </div>
                <div className="product-price">
                  S/ {(item.price * item.quantity).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="summary-section">
          <h6 className="section-title">Resumen</h6>
          <div className="summary-item">
            <span>Subtotal:</span>
            <span>S/ {subtotal.toFixed(2)}</span>
          </div>
          <div className="summary-item">
            <span>Envío:</span>
            <span>{shippingCost > 0 ? `S/ ${shippingCost.toFixed(2)}` : "GRATIS"}</span>
          </div>
          <div className="summary-total">
            <span>Total:</span>
            <span>S/ {orderTotal.toFixed(2)}</span>
          </div>
        </div>

        {selectedOrder.status === "PENDIENTE" && (
          <div className="alert alert-warning">
            <FaInfoCircle className="me-2" />
            <span className="small">Tu pedido está siendo procesado. Te notificaremos cuando entre en preparación.</span>
          </div>
        )}

        {selectedOrder.status === "PREPARACION" && (
          <div className="alert alert-primary">
            <FaInfoCircle className="me-2" />
            <span className="small">Tu pedido está en preparación. Pronto estará listo para entrega.</span>
          </div>
        )}

        {selectedOrder.status === "TERMINADO" && (
          <div className="alert alert-success">
            <FaInfoCircle className="me-2" />
            <span className="small">Tu pedido ha sido completado. ¡Gracias por tu compra!</span>
          </div>
        )}
      </>
    );
  };

  // Si el modal no está activo, no renderizar nada
  if (!show) return null;

  return (
    <>
      {/* Estilos CSS optimizados para móviles */}
      <style>{`
        @media (max-width: 768px) {
          .my-orders-modal .modal-dialog {
            max-width: 100% !important;
            width: 100% !important;
            height: 100vh !important;
            margin: 0 !important;
          }
          
          .my-orders-modal .modal-content {
            height: 100vh !important;
            border-radius: 0 !important;
            border: none !important;
          }
          
          .my-orders-modal .modal-body {
            padding: 15px !important;
            overflow-y: auto !important;
            flex: 1 !important;
          }
          
          .my-orders-modal .modal-header {
            padding: 12px 15px !important;
            flex-shrink: 0 !important;
          }
          
          .my-orders-modal .modal-footer {
            padding: 12px 15px !important;
            flex-shrink: 0 !important;
          }
          
          .order-list {
            display: flex;
            flex-direction: column;
            gap: 12px;
          }
          
          .order-card {
            background: #f8f9fa;
            border: 1px solid #e9ecef;
            border-radius: 8px;
            padding: 15px;
            cursor: pointer;
            transition: all 0.2s ease;
          }
          
          .order-card:hover {
            background: #e9ecef;
            border-color: #dc3545;
          }
          
          .order-card-header {
            display: flex;
            justify-content: space-between;
            align-items: start;
            margin-bottom: 8px;
          }
          
          .order-info {
            flex: 1;
          }
          
          .order-number {
            margin: 0 0 4px 0;
            font-size: 1rem;
            font-weight: 600;
          }
          
          .order-date {
            margin: 0;
            font-size: 0.85rem;
            color: #6c757d;
          }
          
          .order-status-price {
            text-align: right;
            display: flex;
            flex-direction: column;
            align-items: flex-end;
          }
          
          .order-total {
            font-weight: 600;
            font-size: 1rem;
            color: #dc3545;
          }
          
          .order-preview {
            font-size: 0.8rem;
            color: #6c757d;
          }
          
          .order-detail-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            flex-wrap: wrap;
            gap: 10px;
          }
          
          .order-detail-title {
            margin: 0;
            font-size: 1.1rem;
            font-weight: 600;
          }
          
          .order-info-card {
            background: #f8f9fa;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 20px;
            border: 1px solid #e9ecef;
          }
          
          .info-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;
            font-size: 0.9rem;
          }
          
          .info-row:last-child {
            margin-bottom: 0;
          }
          
          .info-row span:first-child {
            font-weight: 500;
            flex-shrink: 0;
            margin-right: 15px;
          }
          
          .info-row span:last-child {
            text-align: right;
            max-width: 60%;
            word-break: break-word;
          }
          
          .products-section {
            margin-bottom: 20px;
          }
          
          .section-title {
            font-size: 1rem;
            font-weight: 600;
            margin-bottom: 12px;
            color: #495057;
          }
          
          .products-list {
            display: flex;
            flex-direction: column;
            gap: 12px;
          }
          
          .product-item {
            display: flex;
            align-items: center;
            background: #f8f9fa;
            border-radius: 8px;
            padding: 12px;
            border: 1px solid #e9ecef;
          }
          
          .product-image {
            width: 50px;
            height: 50px;
            border-radius: 6px;
            background: #e9ecef;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-right: 12px;
            flex-shrink: 0;
            font-size: 0.7rem;
            color: #6c757d;
          }
          
          .product-image img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            border-radius: 6px;
          }
          
          .product-details {
            flex: 1;
            min-width: 0;
          }
          
          .product-name {
            font-weight: 500;
            font-size: 0.9rem;
            margin-bottom: 4px;
          }
          
          .product-quantity {
            font-size: 0.8rem;
            color: #6c757d;
          }
          
          .product-price {
            font-weight: 600;
            color: #dc3545;
            font-size: 0.9rem;
            text-align: right;
            flex-shrink: 0;
          }
          
          .summary-section {
            background: #f8f9fa;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 15px;
            border: 1px solid #e9ecef;
          }
          
          .summary-item {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            font-size: 0.9rem;
          }
          
          .summary-total {
            display: flex;
            justify-content: space-between;
            font-weight: 600;
            font-size: 1rem;
            padding-top: 8px;
            border-top: 1px solid #dee2e6;
            margin-top: 8px;
          }
          
          .alert {
            padding: 12px !important;
            margin-bottom: 15px !important;
            border-radius: 6px !important;
          }
        }
        
        @media (max-width: 576px) {
          .my-orders-modal .modal-header h5 {
            font-size: 1.1rem !important;
          }
          
          .order-card {
            padding: 12px !important;
          }
          
          .order-info-card {
            padding: 12px !important;
          }
          
          .product-item {
            padding: 10px !important;
          }
          
          .summary-section {
            padding: 12px !important;
          }
          
          .info-row {
            font-size: 0.85rem !important;
          }
          
          .order-detail-header {
            margin-bottom: 15px !important;
          }
        }
        
        @media (min-width: 769px) {
          .my-orders-modal .modal-dialog {
            max-width: 55% !important;
          }
          
          .order-list {
            display: block;
          }
          
          .order-card {
            background: transparent;
            border: 1px solid #dee2e6;
            border-radius: 0;
            padding: 15px;
            cursor: pointer;
            transition: background-color 0.2s ease;
          }
          
          .order-card:hover {
            background: #f8f9fa;
          }
          
          .order-card + .order-card {
            border-top: none;
          }
          
          .order-card:first-child {
            border-top-left-radius: 8px;
            border-top-right-radius: 8px;
          }
          
          .order-card:last-child {
            border-bottom-left-radius: 8px;
            border-bottom-right-radius: 8px;
          }
        }
      `}</style>

      <div
        className="modal d-block my-orders-modal"
        tabIndex={-1}
        style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      >
        <div
          className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable"
          style={{ maxWidth: "95%" }}
        >
          <div className="modal-content border-0">
            <div className="modal-header bg-danger text-white">
              <h5 className="modal-title">Mis Pedidos</h5>
              <button
                type="button"
                className="btn-close btn-close-white"
                onClick={onClose}
                aria-label="Close"
              />
            </div>
            <div className="modal-body">
              {selectedOrder ? renderOrderDetail() : renderOrdersList()}
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline-secondary" onClick={onClose}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default MyOrders;