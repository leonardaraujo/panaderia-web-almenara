import { useNavigate, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  FaHome,
  FaSignOutAlt,
  FaUserCog,
  FaTachometerAlt,
  FaEye,
  FaEdit,
  FaTrash,
  FaFilter,
  FaSearch,
  FaBoxes,
  FaShoppingBag,
  FaInfoCircle,
  FaArrowLeft,
  FaUser,
  FaCalendar,
  FaBox,
} from "react-icons/fa";
import mariaLogo from "../../assets/maria_logo.svg";
import useUserStore from "../../../store/userStore";
import authApi from "../../api/auth.api";
import ProductsManager from "../../components/admin/ProductsManager";
import { getAllOrders, updateOrderStatus, deleteOrder as apiDeleteOrder, OrderStatus } from "../../api/order.api";

// Tipo para las pestañas del dashboard
type DashboardTab = "orders" | "products";

// Definir el tipo SaleOrder según la estructura que viene del backend
interface OrderItem {
  id: number;
  productId: number;
  price: number;
  quantity: number;
  product: {
    id: number;
    name: string;
    imgUrl: string;
    price: number;
    description: string;
    category: string;
  };
}

interface OrderUser {
  id: number;
  name: string;
  surname: string;
  email: string;
  phoneNumber: string;
}

interface SaleOrder {
  id: number;
  items: OrderItem[];
  paymentMethod: string;
  shippingInfo: string;
  deliveryMethod: string;
  userId: number;
  user: OrderUser;
  date: string;
  status: string;
  subtotal?: number;
  shippingCost?: number;
  total?: number;
}

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [ordersList, setOrdersList] = useState<SaleOrder[]>([]);
  const [filter, setFilter] = useState<string>("todos");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedOrder, setSelectedOrder] = useState<SaleOrder | null>(null);
  const [editingOrder, setEditingOrder] = useState<SaleOrder | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Estado para la pestaña activa
  const [activeTab, setActiveTab] = useState<DashboardTab>("orders");

  // Obtenemos el usuario y el estado de autenticación directamente del store
  const { isAuthenticated, isAdmin } = useUserStore();

  // Efecto para redirigir si no hay usuario o no es admin
  useEffect(() => {
    if (!isAuthenticated || !isAdmin()) {
      navigate("/");
      return;
    }
    setLoading(true);
    getAllOrders()
      .then((response:any) => {
        const orders = response.data ?? response;
        
        // Calcular subtotal, shippingCost y total si no vienen del backend
        const processedOrders = orders.map((order: SaleOrder) => {
          if (order.total === undefined) {
            const subtotal = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            const shippingCost = order.deliveryMethod === "ENVIO_A_DIRECCION" ? 15 : 0;
            const total = subtotal + shippingCost;
            
            return {
              ...order,
              subtotal,
              shippingCost,
              total
            };
          }
          return order;
        });
        
        setOrdersList(processedOrders);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error al cargar pedidos:", error);
        setLoading(false);
      });
  }, [isAuthenticated, isAdmin, navigate]);

  // Función para cerrar sesión usando authApi
  const handleLogout = () => {
    authApi.clearSession();
    navigate("/");
  };

  // Función para filtrar pedidos
  const filteredOrders = ordersList.filter((order) => {
    // Filtrar por estado
    const statusFilter = filter === "todos" || order.status === filter;

    // Filtrar por término de búsqueda (en ID, nombre del cliente o email)
    const searchFilter =
      searchTerm === "" ||
      order.id.toString().includes(searchTerm.toLowerCase()) ||
      (order.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
      (order.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);

    return statusFilter && searchFilter;
  });

  // Función para cambiar el estado de un pedido (API)
  const handleStatusChange = async (orderId: number, newStatus: OrderStatus) => {
    try {
      await updateOrderStatus(orderId, { status: newStatus });
      setOrdersList((prev) =>
        prev.map((order) =>
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      );
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
      if (editingOrder && editingOrder.id === orderId) {
        setEditingOrder(null);
      }
    } catch (e) {
      alert("Error al actualizar el estado del pedido.");
      console.error(e);
    }
  };

  // Función para eliminar un pedido (API)
  const handleDeleteOrder = async (orderId: number) => {
    if (window.confirm("¿Estás seguro de que deseas eliminar este pedido?")) {
      try {
        await apiDeleteOrder(orderId);
        setOrdersList((prev) => prev.filter((order) => order.id !== orderId));
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder(null);
        }
      } catch (e) {
        alert("Error al eliminar el pedido.");
        console.error(e);
      }
    }
  };

  // Formatear fecha para mostrar
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

  // Calcular total de un pedido
  const calculateOrderTotal = (order: SaleOrder): number => {
    if (order.total) return order.total;
    const itemsTotal = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const shippingCost = order.deliveryMethod === "ENVIO_A_DIRECCION" ? 15 : 0;
    return itemsTotal + shippingCost;
  };

  // Colores para los estados
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

  // Renderizar tarjeta móvil para pedido
  const renderMobileOrderCard = (order: SaleOrder) => (
    <div key={order.id} className="order-card-mobile">
      <div className="order-card-header">
        <div className="order-info">
          <h6 className="order-id">#{order.id}</h6>
          <p className="order-date">
            <FaCalendar className="me-1" size={12} />
            {formatDate(order.date)}
          </p>
        </div>
        <div className="order-status-total">
          <span className={`badge ${getStatusBadgeClass(order.status)} mb-1`}>
            {order.status}
          </span>
          <div className="order-total">S/ {calculateOrderTotal(order).toFixed(2)}</div>
        </div>
      </div>
      
      <div className="order-customer">
        <FaUser className="me-2" size={12} />
        <span className="customer-name">{order.user?.name} {order.user?.surname}</span>
      </div>
      
      <div className="order-items-preview">
        <FaBox className="me-2" size={12} />
        <span className="text-muted small">
          {order.items.length} producto{order.items.length > 1 ? 's' : ''}
        </span>
      </div>
      
      <div className="order-actions">
        <button
          className="btn btn-sm btn-outline-primary"
          onClick={() => setSelectedOrder(order)}
          title="Ver detalles"
        >
          <FaEye className="me-1" size={12} />
          <span className="d-none d-sm-inline">Ver</span>
        </button>
        {order.status !== "TERMINADO" && (
          <button
            className="btn btn-sm btn-outline-secondary"
            onClick={() => setEditingOrder(order)}
            title="Editar estado"
          >
            <FaEdit className="me-1" size={12} />
            <span className="d-none d-sm-inline">Editar</span>
          </button>
        )}
        <button
          className="btn btn-sm btn-outline-danger"
          onClick={() => handleDeleteOrder(order.id)}
          title="Eliminar pedido"
        >
          <FaTrash className="me-1" size={12} />
          <span className="d-none d-sm-inline">Eliminar</span>
        </button>
      </div>
    </div>
  );

  // Modal para editar el estado de un pedido
  const renderEditStatusModal = () => {
    if (!editingOrder) return null;

    return (
      <div
        className="modal d-block edit-status-modal"
        tabIndex={-1}
        style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">
                <span className="d-none d-sm-inline">Actualizar Estado - Pedido {editingOrder.id}</span>
                <span className="d-inline d-sm-none">Estado #{editingOrder.id}</span>
              </h5>
              <button
                type="button"
                className="btn-close"
                onClick={() => setEditingOrder(null)}
              ></button>
            </div>
            <div className="modal-body">
              <div className="current-status-info">
                <p>
                  Estado actual:{" "}
                  <span
                    className={`badge ${getStatusBadgeClass(editingOrder.status)}`}
                  >
                    {editingOrder.status}
                  </span>
                </p>
                <p>Cliente: {editingOrder.user?.name} {editingOrder.user?.surname || ""}</p>
                <p>Total: S/ {calculateOrderTotal(editingOrder).toFixed(2)}</p>
              </div>

              <div className="mt-4">
                <h6 className="mb-3">Seleccionar nuevo estado:</h6>
                {editingOrder.status !== "TERMINADO" ? (
                  <div className="status-buttons-grid">
                    <button
                      className={`btn ${
                        editingOrder.status === "PENDIENTE"
                          ? "btn-warning"
                          : "btn-outline-warning"
                      }`}
                      onClick={() =>
                        handleStatusChange(editingOrder.id, "PENDIENTE" as OrderStatus)
                      }
                    >
                      Pendiente
                    </button>
                    <button
                      className={`btn ${
                        editingOrder.status === "PREPARACION"
                          ? "btn-primary"
                          : "btn-outline-primary"
                      }`}
                      onClick={() =>
                        handleStatusChange(editingOrder.id, "PREPARACION" as OrderStatus)
                      }
                    >
                      Preparación
                    </button>
                    <button
                      className={`btn ${
                        editingOrder.status === "TERMINADO"
                          ? "btn-success"
                          : "btn-outline-success"
                      }`}
                      onClick={() =>
                        handleStatusChange(editingOrder.id, "TERMINADO" as OrderStatus)
                      }
                    >
                      Terminado
                    </button>
                  </div>
                ) : (
                  <div className="alert alert-success">
                    <FaInfoCircle className="me-2" />
                    Este pedido ha sido marcado como terminado y no puede cambiarse.
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setEditingOrder(null)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Vista detallada de un pedido
  const renderOrderDetailView = () => {
    if (!selectedOrder) return null;

    const orderTotal = calculateOrderTotal(selectedOrder);
    const subtotal = selectedOrder.subtotal || 
      selectedOrder.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shippingCost = selectedOrder.shippingCost || 
      (selectedOrder.deliveryMethod === "ENVIO_A_DIRECCION" ? 15 : 0);

    return (
      <div>
        {/* Header responsivo */}
        <div className="order-detail-header">
          <button
            className="btn btn-sm btn-outline-secondary d-flex align-items-center"
            onClick={() => setSelectedOrder(null)}
          >
            <FaArrowLeft className="me-2" size={12} />
            <span className="d-none d-sm-inline">Volver a la lista</span>
            <span className="d-inline d-sm-none">Volver</span>
          </button>
          <div className="order-detail-title">
            <h4 className="mb-1">
              <span className="d-none d-md-inline">Pedido {selectedOrder.id}</span>
              <span className="d-inline d-md-none">#{selectedOrder.id}</span>
            </h4>
            <div className="d-flex align-items-center flex-wrap">
              <span
                className={`badge ${getStatusBadgeClass(selectedOrder.status)} me-2`}
              >
                {selectedOrder.status}
              </span>
              <span className="text-muted small">
                {formatDate(selectedOrder.date)}
              </span>
            </div>
          </div>
        </div>

        {/* Vista móvil: Cards apiladas */}
        <div className="d-block d-lg-none">
          <div className="mobile-detail-card">
            <h6 className="card-title">Información del Cliente</h6>
            <div className="customer-info">
              <p><strong>Nombre:</strong> {selectedOrder.user?.name} {selectedOrder.user?.surname}</p>
              <p><strong>Email:</strong> {selectedOrder.user?.email}</p>
              <p><strong>Teléfono:</strong> {selectedOrder.user?.phoneNumber}</p>
              <p><strong>Dirección:</strong> {selectedOrder.shippingInfo}</p>
              <p><strong>Entrega:</strong> {
                selectedOrder.deliveryMethod === "ENVIO_A_DIRECCION" 
                  ? "Envío a domicilio" 
                  : "Recojo en tienda"
              }</p>
              <p><strong>Pago:</strong> {
                selectedOrder.paymentMethod === "TARJETA"
                  ? "Tarjeta"
                  : selectedOrder.paymentMethod === "YAPE"
                  ? "Yape/Plin"
                  : "Contraentrega"
              }</p>
            </div>
          </div>

          <div className="mobile-detail-card">
            <h6 className="card-title">Resumen del Pedido</h6>
            <div className="order-summary">
              <div className="summary-row">
                <span>Subtotal:</span>
                <span>S/ {subtotal.toFixed(2)}</span>
              </div>
              <div className="summary-row">
                <span>Envío:</span>
                <span>{shippingCost > 0 ? `S/ ${shippingCost.toFixed(2)}` : "GRATIS"}</span>
              </div>
              <div className="summary-total">
                <span>Total:</span>
                <span>S/ {orderTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Botones de estado - Vista móvil */}
            {selectedOrder.status !== "TERMINADO" && (
              <div className="status-update-mobile">
                <h6 className="mb-2">Actualizar estado:</h6>
                <div className="status-buttons">
                  <button
                    className={`btn btn-sm ${
                      selectedOrder.status === "PENDIENTE"
                        ? "btn-warning"
                        : "btn-outline-warning"
                    }`}
                    onClick={() =>
                      handleStatusChange(selectedOrder.id, "PENDIENTE" as OrderStatus)
                    }
                  >
                    Pendiente
                  </button>
                  <button
                    className={`btn btn-sm ${
                      selectedOrder.status === "PREPARACION"
                        ? "btn-primary"
                        : "btn-outline-primary"
                    }`}
                    onClick={() =>
                      handleStatusChange(selectedOrder.id, "PREPARACION" as OrderStatus)
                    }
                  >
                    Preparación
                  </button>
                  <button
                    className={`btn btn-sm ${
                      selectedOrder.status === "TERMINADO"
                        ? "btn-success"
                        : "btn-outline-success"
                    }`}
                    onClick={() =>
                      handleStatusChange(selectedOrder.id, "TERMINADO" as OrderStatus)
                    }
                  >
                    Terminado
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Vista desktop: Cards lado a lado */}
        <div className="d-none d-lg-block">
          <div className="row">
            <div className="col-md-6 mb-4">
              <div className="card h-100">
                <div className="card-header">
                  <h5 className="mb-0">Información del Cliente</h5>
                </div>
                <div className="card-body">
                  <p className="mb-1">
                    <strong>Nombre:</strong> {selectedOrder.user?.name} {selectedOrder.user?.surname}
                  </p>
                  <p className="mb-1">
                    <strong>Email:</strong> {selectedOrder.user?.email}
                  </p>
                  <p className="mb-1">
                    <strong>Teléfono:</strong> {selectedOrder.user?.phoneNumber}
                  </p>
                  <p className="mb-1">
                    <strong>Dirección de envío:</strong> {selectedOrder.shippingInfo}
                  </p>
                  <p className="mb-1">
                    <strong>Método de entrega:</strong> {
                      selectedOrder.deliveryMethod === "ENVIO_A_DIRECCION" 
                        ? "Envío a domicilio" 
                        : "Recojo en tienda"
                    }
                  </p>
                  <p className="mb-0">
                    <strong>Método de pago:</strong> {
                      selectedOrder.paymentMethod === "TARJETA"
                        ? "Tarjeta de crédito/débito"
                        : selectedOrder.paymentMethod === "YAPE"
                        ? "Yape/Plin"
                        : "Pago contraentrega"
                    }
                  </p>
                </div>
              </div>
            </div>

            <div className="col-md-6 mb-4">
              <div className="card h-100">
                <div className="card-header">
                  <h5 className="mb-0">Resumen del Pedido</h5>
                </div>
                <div className="card-body">
                  <p className="mb-1">
                    <strong>Subtotal:</strong> S/ {subtotal.toFixed(2)}
                  </p>
                  <p className="mb-1">
                    <strong>Costo de envío:</strong> {
                      shippingCost > 0 
                        ? `S/ ${shippingCost.toFixed(2)}`
                        : "GRATIS"
                    }
                  </p>
                  <p className="mb-3 fs-5 fw-bold">
                    <strong>Total:</strong> S/ {orderTotal.toFixed(2)}
                  </p>

                  <div className="mt-3">
                    <h6 className="mb-2">Actualizar estado:</h6>
                    {selectedOrder.status !== "TERMINADO" ? (
                      <div className="d-flex flex-wrap gap-2">
                        <button
                          className={`btn btn-sm ${
                            selectedOrder.status === "PENDIENTE"
                              ? "btn-warning"
                              : "btn-outline-warning"
                          }`}
                          onClick={() =>
                            handleStatusChange(selectedOrder.id, "PENDIENTE" as OrderStatus)
                          }
                        >
                          Pendiente
                        </button>
                        <button
                          className={`btn btn-sm ${
                            selectedOrder.status === "PREPARACION"
                              ? "btn-primary"
                              : "btn-outline-primary"
                          }`}
                          onClick={() =>
                            handleStatusChange(selectedOrder.id, "PREPARACION" as OrderStatus)
                          }
                        >
                          Preparación
                        </button>
                        <button
                          className={`btn btn-sm ${
                            selectedOrder.status === "TERMINADO"
                              ? "btn-success"
                              : "btn-outline-success"
                          }`}
                          onClick={() =>
                            handleStatusChange(selectedOrder.id, "TERMINADO" as OrderStatus)
                          }
                        >
                          Terminado
                        </button>
                      </div>
                    ) : (
                      <div className="alert alert-success py-2 mb-0">
                        <small>
                          <FaInfoCircle className="me-1" /> 
                          Este pedido ha sido marcado como terminado y no puede cambiarse.
                        </small>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Productos */}
        <div className="products-detail-section">
          <h6 className="section-title">Productos</h6>
          
          {/* Vista móvil: Lista de productos */}
          <div className="d-block d-lg-none">
            <div className="mobile-products-list">
              {selectedOrder.items.map((item, index) => (
                <div key={index} className="product-item-mobile">
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
                    <div className="product-unit-price">S/ {item.price.toFixed(2)} c/u</div>
                  </div>
                  <div className="product-total-price">
                    S/ {(item.price * item.quantity).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Vista desktop: Tabla */}
          <div className="d-none d-lg-block">
            <div className="card">
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table align-middle">
                    <thead className="table-light">
                      <tr>
                        <th>Producto</th>
                        <th className="text-center">Cantidad</th>
                        <th className="text-end">Precio unitario</th>
                        <th className="text-end">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.items.map((item, index) => (
                        <tr key={index}>
                          <td>
                            <div className="d-flex align-items-center">
                              <div
                                style={{
                                  width: "60px",
                                  height: "60px",
                                  marginRight: "15px",
                                  borderRadius: "4px",
                                  background: "#e9ecef",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontSize: "0.7rem",
                                  color: "#6c757d"
                                }}
                              >
                                <img
                                  src={item.product?.imgUrl}
                                  alt={item.product?.name}
                                  style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                    borderRadius: "4px"
                                  }}
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    const parent = target.parentElement;
                                    if (parent) {
                                      parent.innerHTML = "Sin imagen";
                                    }
                                  }}
                                />
                              </div>
                              <div>{item.product?.name}</div>
                            </div>
                          </td>
                          <td className="text-center">{item.quantity}</td>
                          <td className="text-end">S/ {item.price.toFixed(2)}</td>
                          <td className="text-end">
                            S/ {(item.price * item.quantity).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Vista principal del dashboard de pedidos
  const renderOrdersView = () => (
    <>
      {/* Header responsivo */}
      <div className="dashboard-header">
        <div className="dashboard-title">
          <h4 className="mb-0">Gestión de Pedidos</h4>
          <p className="text-muted mb-0">Total: {ordersList.length} pedidos</p>
        </div>
        
        {/* Filtros móviles */}
        <div className="dashboard-filters">
          <div className="search-input">
            <div className="input-group">
              <span className="input-group-text bg-white border-end-0">
                <FaSearch className="text-muted" size={14} />
              </span>
              <input
                type="text"
                className="form-control border-start-0"
                placeholder="Buscar pedido..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div className="filter-dropdown">
            <div className="dropdown">
              <button
                className="btn btn-outline-secondary dropdown-toggle"
                type="button"
                data-bs-toggle="dropdown"
              >
                <FaFilter className="me-1" size={12} />
                <span className="d-none d-md-inline">
                  {filter === "todos"
                    ? "Todos"
                    : filter === "PENDIENTE"
                    ? "Pendientes"
                    : filter === "PREPARACION"
                    ? "En preparación"
                    : "Terminados"}
                </span>
                <span className="d-inline d-md-none">
                  {filter === "todos" ? "Todos" : filter.charAt(0)}
                </span>
              </button>
              <ul className="dropdown-menu">
                <li>
                  <button
                    className="dropdown-item"
                    onClick={() => setFilter("todos")}
                  >
                    Todos
                  </button>
                </li>
                <li>
                  <button
                    className="dropdown-item"
                    onClick={() => setFilter("PENDIENTE")}
                  >
                    Pendientes
                  </button>
                </li>
                <li>
                  <button
                    className="dropdown-item"
                    onClick={() => setFilter("PREPARACION")}
                  >
                    En preparación
                  </button>
                </li>
                <li>
                  <button
                    className="dropdown-item"
                    onClick={() => setFilter("TERMINADO")}
                  >
                    Terminados
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="alert alert-info">Cargando pedidos...</div>
      ) : filteredOrders.length === 0 ? (
        <div className="alert alert-info">
          No se encontraron pedidos con los criterios seleccionados.
        </div>
      ) : (
        <>
          {/* Vista móvil: Tarjetas */}
          <div className="d-block d-lg-none">
            <div className="mobile-orders-list">
              {filteredOrders.map((order) => renderMobileOrderCard(order))}
            </div>
          </div>

          {/* Vista desktop: Tabla */}
          <div className="d-none d-lg-block">
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    <th>ID</th>
                    <th>Fecha</th>
                    <th>Cliente</th>
                    <th>Total</th>
                    <th>Estado</th>
                    <th className="text-end">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => (
                    <tr key={order.id}>
                      <td>{order.id}</td>
                      <td>{formatDate(order.date)}</td>
                      <td>
                        <div>{order.user?.name} {order.user?.surname}</div>
                        <small className="text-muted">
                          {order.user?.email}
                        </small>
                      </td>
                      <td>S/ {calculateOrderTotal(order).toFixed(2)}</td>
                      <td>
                        <span
                          className={`badge ${getStatusBadgeClass(order.status)}`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td>
                        <div className="d-flex gap-2 justify-content-end">
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => setSelectedOrder(order)}
                            title="Ver detalles"
                          >
                            <FaEye />
                          </button>
                          {order.status !== "TERMINADO" && (
                            <button
                              className="btn btn-sm btn-outline-secondary"
                              onClick={() => setEditingOrder(order)}
                              title="Editar estado"
                            >
                              <FaEdit />
                            </button>
                          )}
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDeleteOrder(order.id)}
                            title="Eliminar pedido"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </>
  );

  // Función para renderizar las estadísticas
  const renderStatistics = () => (
    <div className="stats-container">
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-content">
            <div className="stat-info">
              <div className="stat-label">Total Pedidos</div>
              <h3 className="stat-value">{ordersList.length}</h3>
            </div>
            <div className="stat-icon bg-primary">
              <FaTachometerAlt size={20} />
            </div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-content">
            <div className="stat-info">
              <div className="stat-label">Pendientes</div>
              <h3 className="stat-value">
                {ordersList.filter((o) => o.status === "PENDIENTE").length}
              </h3>
            </div>
            <div className="stat-icon bg-warning">
              <FaEye size={20} />
            </div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-content">
            <div className="stat-info">
              <div className="stat-label">Completados</div>
              <h3 className="stat-value">
                {ordersList.filter((o) => o.status === "TERMINADO").length}
              </h3>
            </div>
            <div className="stat-icon bg-success">
              <FaEdit size={20} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Estilos CSS responsivos */}
      <style>{`
        @media (max-width: 768px) {
          .dashboard-header {
            margin-bottom: 20px;
          }
          
          .dashboard-title {
            margin-bottom: 15px;
          }
          
          .dashboard-title h4 {
            font-size: 1.2rem !important;
          }
          
          .dashboard-filters {
            display: flex;
            flex-direction: column;
            gap: 12px;
          }
          
          .search-input {
            flex: 1;
          }
          
          .filter-dropdown {
            align-self: flex-start;
          }
          
          .mobile-orders-list {
            display: flex;
            flex-direction: column;
            gap: 12px;
          }
          
          .order-card-mobile {
            background: #f8f9fa;
            border: 1px solid #e9ecef;
            border-radius: 8px;
            padding: 15px;
            transition: all 0.2s ease;
          }
          
          .order-card-mobile:hover {
            background: #e9ecef;
            border-color: #dc3545;
          }
          
          .order-card-header {
            display: flex;
            justify-content: space-between;
            align-items: start;
            margin-bottom: 12px;
          }
          
          .order-info {
            flex: 1;
          }
          
          .order-id {
            margin: 0 0 4px 0;
            font-size: 1rem;
            font-weight: 600;
            color: #dc3545;
          }
          
          .order-date {
            margin: 0;
            font-size: 0.8rem;
            color: #6c757d;
            display: flex;
            align-items: center;
          }
          
          .order-status-total {
            text-align: right;
            display: flex;
            flex-direction: column;
            align-items: flex-end;
          }
          
          .order-total {
            font-weight: 600;
            font-size: 1rem;
            color: #dc3545;
            margin-top: 4px;
          }
          
          .order-customer {
            display: flex;
            align-items: center;
            margin-bottom: 8px;
            font-size: 0.9rem;
          }
          
          .customer-name {
            font-weight: 500;
          }
          
          .order-items-preview {
            display: flex;
            align-items: center;
            margin-bottom: 15px;
            font-size: 0.85rem;
          }
          
          .order-actions {
            display: flex;
            gap: 8px;
            justify-content: flex-end;
            flex-wrap: wrap;
          }
          
          .order-detail-header {
            display: flex;
            justify-content: space-between;
            align-items: start;
            margin-bottom: 20px;
            flex-wrap: wrap;
            gap: 12px;
          }
          
          .order-detail-title {
            flex: 1;
            min-width: 0;
          }
          
          .mobile-detail-card {
            background: #f8f9fa;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 15px;
            border: 1px solid #e9ecef;
          }
          
          .mobile-detail-card .card-title {
            font-size: 1rem;
            font-weight: 600;
            margin-bottom: 12px;
            color: #495057;
          }
          
          .customer-info p {
            margin-bottom: 8px;
            font-size: 0.9rem;
          }
          
          .customer-info p:last-child {
            margin-bottom: 0;
          }
          
          .order-summary {
            margin-bottom: 20px;
          }
          
          .summary-row {
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
          
          .status-update-mobile h6 {
            font-size: 0.95rem;
            margin-bottom: 12px;
          }
          
          .status-buttons {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
          }
          
          .status-buttons .btn {
            font-size: 0.8rem !important;
            padding: 6px 12px !important;
          }
          
          .products-detail-section {
            margin-bottom: 20px;
          }
          
          .section-title {
            font-size: 1rem;
            font-weight: 600;
            margin-bottom: 15px;
            color: #495057;
          }
          
          .mobile-products-list {
            display: flex;
            flex-direction: column;
            gap: 12px;
          }
          
          .product-item-mobile {
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
            margin-bottom: 2px;
          }
          
          .product-unit-price {
            font-size: 0.75rem;
            color: #6c757d;
          }
          
          .product-total-price {
            font-weight: 600;
            color: #dc3545;
            font-size: 0.9rem;
            text-align: right;
            flex-shrink: 0;
          }
          
          .stats-container {
            margin-bottom: 20px;
          }
          
          .stats-grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: 12px;
          }
          
          .stat-card {
            background: #f8f9fa;
            border: 1px solid #e9ecef;
            border-radius: 8px;
            padding: 15px;
          }
          
          .stat-content {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          
          .stat-label {
            font-size: 0.9rem;
            color: #6c757d;
            margin-bottom: 4px;
          }
          
          .stat-value {
            font-size: 1.5rem;
            font-weight: 600;
            margin: 0;
          }
          
          .stat-icon {
            width: 40px;
            height: 40px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
          }
          
          .edit-status-modal .current-status-info p {
            margin-bottom: 8px;
            font-size: 0.9rem;
          }
          
          .status-buttons-grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: 10px;
          }
        }
        
        @media (max-width: 576px) {
          .dashboard-title h4 {
            font-size: 1.1rem !important;
          }
          
          .order-card-mobile {
            padding: 12px !important;
          }
          
          .mobile-detail-card {
            padding: 12px !important;
          }
          
          .product-item-mobile {
            padding: 10px !important;
          }
          
          .order-actions {
            justify-content: center;
          }
          
          .order-actions .btn {
            font-size: 0.8rem !important;
            padding: 6px 8px !important;
          }
          
          .stats-grid {
            gap: 10px;
          }
          
          .stat-card {
            padding: 12px !important;
          }
          
          .stat-value {
            font-size: 1.3rem !important;
          }
          
          .stat-icon {
            width: 35px !important;
            height: 35px !important;
          }
        }
        
        @media (min-width: 768px) and (max-width: 991px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        
        @media (min-width: 992px) {
          .dashboard-filters {
            flex-direction: row;
            align-items: center;
            justify-content: flex-end;
            gap: 15px;
          }
          
          .search-input {
            width: 300px;
          }
          
          .stats-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }
      `}</style>

      {/* Cabecera */}
      <header className="bg-white shadow-sm">
        <div className="container">
          <div className="d-flex justify-content-between align-items-center py-3">
            <Link
              to="/"
              className="d-flex align-items-center text-decoration-none"
            >
              <img
                src={mariaLogo}
                alt="María Almenara"
                height="40"
                className="me-3"
              />
            </Link>
            <div className="d-flex align-items-center">
              <div className="me-4 text-end d-none d-md-block">
                <div className="fs-6 fw-bold">
                  {useUserStore.getState().getUserName()}
                </div>
                <div className="text-muted small">Administrador</div>
              </div>
              <div className="dropdown">
                <button
                  className="btn btn-outline-secondary rounded-circle"
                  type="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  <FaUserCog />
                </button>
                <ul className="dropdown-menu dropdown-menu-end">
                  <li>
                    <Link to="/" className="dropdown-item">
                      <FaHome className="me-2" /> Ir al inicio
                    </Link>
                  </li>
                  <li>
                    <hr className="dropdown-divider" />
                  </li>
                  <li>
                    <button
                      className="dropdown-item text-danger"
                      onClick={handleLogout}
                    >
                      <FaSignOutAlt className="me-2" /> Cerrar sesión
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <div className="container py-4">
        <div className="row mb-4">
          <div className="col-12">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h2 className="mb-1 d-none d-md-block">Dashboard de Administración</h2>
                <h4 className="mb-1 d-block d-md-none">Dashboard Admin</h4>
                <nav aria-label="breadcrumb">
                  <ol className="breadcrumb">
                    <li className="breadcrumb-item">
                      <Link to="/">Inicio</Link>
                    </li>
                    <li className="breadcrumb-item active" aria-current="page">
                      Dashboard
                    </li>
                  </ol>
                </nav>
              </div>
            </div>
          </div>
        </div>

        {/* Pestañas de navegación */}
        <ul className="nav nav-tabs mb-4">
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === "orders" ? "active" : ""}`}
              onClick={() => setActiveTab("orders")}
            >
              <FaShoppingBag className="me-2" /> 
              <span className="d-none d-sm-inline">Pedidos</span>
              <span className="d-inline d-sm-none">Pedidos</span>
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === "products" ? "active" : ""}`}
              onClick={() => setActiveTab("products")}
            >
              <FaBoxes className="me-2" /> 
              <span className="d-none d-sm-inline">Productos</span>
              <span className="d-inline d-sm-none">Productos</span>
            </button>
          </li>
        </ul>

        {/* Mostrar estadísticas solo en pestaña de pedidos */}
        {activeTab === "orders" && renderStatistics()}

        {/* Panel principal */}
        <div className="card border-0 shadow-sm">
          <div className="card-body p-4">
            {activeTab === "orders" &&
              (selectedOrder ? renderOrderDetailView() : renderOrdersView())}

            {activeTab === "products" && <ProductsManager />}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-light mt-auto py-4">
        <div className="container">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <span className="text-muted">
                &copy; {new Date().getFullYear()} María Almenara. Todos los
                derechos reservados.
              </span>
            </div>
            <div>
              <Link to="/" className="text-decoration-none text-muted">
                Volver al sitio principal
              </Link>
            </div>
          </div>
        </div>
      </footer>

      {renderEditStatusModal()}
    </>
  );
};

export default DashboardPage;