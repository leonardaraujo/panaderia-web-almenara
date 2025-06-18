import { useState, useEffect } from "react";
import { FaSpinner, FaInfoCircle } from "react-icons/fa";
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
      // Guardar el valor original de overflow
      const originalStyle = window.getComputedStyle(document.body).overflow;
      // Bloquear el scroll
      document.body.style.overflow = "hidden";

      // Restaurar el scroll cuando se desmonta el componente o cierra el modal
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
      
      const response = await getOrdersByUserId(user.id);
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
      <div className="list-group">
        {orders.map((order) => (
          <button
            key={order.id}
            className="list-group-item list-group-item-action"
            onClick={() => setSelectedOrder(order)}
          >
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h6 className="mb-1">Pedido #{order.id}</h6>
                <p className="mb-1 text-muted small">
                  {formatDate(order.date)}
                </p>
              </div>
              <div className="text-end">
                <div className="mb-1">
                  <span className={`badge ${getStatusBadgeClass(order.status)}`}>
                    {translateStatus(order.status)}
                  </span>
                </div>
                <div>S/ {calculateOrderTotal(order).toFixed(2)}</div>
              </div>
            </div>
          </button>
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
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h5 className="m-0">
            Detalles del Pedido #{selectedOrder.id}
          </h5>
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary"
            onClick={() => setSelectedOrder(null)}
          >
            Volver a la lista
          </button>
        </div>

        <div className="mb-3 p-3 bg-light rounded">
          <div className="d-flex justify-content-between mb-2">
            <span>Estado:</span>
            <span className={`badge ${getStatusBadgeClass(selectedOrder.status)}`}>
              {translateStatus(selectedOrder.status)}
            </span>
          </div>
          <div className="d-flex justify-content-between mb-2">
            <span>Fecha:</span>
            <span>{formatDate(selectedOrder.date)}</span>
          </div>
          <div className="d-flex justify-content-between mb-2">
            <span>Método de entrega:</span>
            <span>{translateDeliveryMethod(selectedOrder.deliveryMethod)}</span>
          </div>
          <div className="d-flex justify-content-between mb-2">
            <span>Dirección:</span>
            <span className="text-end">{selectedOrder.shippingInfo}</span>
          </div>
          <div className="d-flex justify-content-between">
            <span>Método de pago:</span>
            <span>{translatePaymentMethod(selectedOrder.paymentMethod)}</span>
          </div>
        </div>

        <div className="card mb-3">
          <div className="card-header bg-light">
            <h6 className="m-0">Productos</h6>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-borderless mb-0">
                <thead>
                  <tr className="table-light">
                    <th>Producto</th>
                    <th className="text-center">Cantidad</th>
                    <th className="text-end">Precio</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOrder.items.map((item, index) => (
                    <tr key={index}>
                      <td>
                        <div className="d-flex align-items-center">
                          <img
                            src={item.product?.imgUrl}
                            alt={item.product?.name}
                            className="me-2 rounded"
                            style={{ width: "48px", height: "48px", objectFit: "cover" }}
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src =
                                "https://via.placeholder.com/48?text=Imagen+No+Disponible";
                            }}
                          />
                          <div>{item.product?.name}</div>
                        </div>
                      </td>
                      <td className="text-center">{item.quantity}</td>
                      <td className="text-end">S/ {item.price.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="card mb-3">
          <div className="card-header bg-light">
            <h6 className="m-0">Resumen</h6>
          </div>
          <div className="card-body">
            <div className="d-flex justify-content-between mb-2">
              <span>Subtotal:</span>
              <span>S/ {subtotal.toFixed(2)}</span>
            </div>
            <div className="d-flex justify-content-between mb-2">
              <span>Envío:</span>
              <span>
                {shippingCost > 0 ? `S/ ${shippingCost.toFixed(2)}` : "GRATIS"}
              </span>
            </div>
            <div className="d-flex justify-content-between fw-bold">
              <span>Total:</span>
              <span>S/ {orderTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {selectedOrder.status === "PENDIENTE" && (
          <div className="alert alert-info">
            <FaInfoCircle className="me-2" />
            Tu pedido está siendo procesado. Te notificaremos cuando entre en preparación.
          </div>
        )}

        {selectedOrder.status === "PREPARACION" && (
          <div className="alert alert-primary">
            <FaInfoCircle className="me-2" />
            Tu pedido está en preparación. Pronto estará listo para entrega.
          </div>
        )}

        {selectedOrder.status === "TERMINADO" && (
          <div className="alert alert-success">
            <FaInfoCircle className="me-2" />
            Tu pedido ha sido completado. ¡Gracias por tu compra!
          </div>
        )}
      </>
    );
  };

  // Si el modal no está activo, no renderizar nada
  if (!show) return null;

  return (
    <div
      className="modal d-block"
      tabIndex={-1}
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
    >
      <div
        className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable"
        style={{ maxWidth: "55%" }}
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
  );
};

export default MyOrders;