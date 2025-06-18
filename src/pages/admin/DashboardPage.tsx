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
      .then((response) => {
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

  // Modal para editar el estado de un pedido
  const renderEditStatusModal = () => {
    if (!editingOrder) return null;

    return (
      <div
        className="modal d-block"
        tabIndex={-1}
        style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">
                Actualizar Estado - Pedido {editingOrder.id}
              </h5>
              <button
                type="button"
                className="btn-close"
                onClick={() => setEditingOrder(null)}
              ></button>
            </div>
            <div className="modal-body">
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

              <div className="mt-4">
                <h6 className="mb-3">Seleccionar nuevo estado:</h6>
                {editingOrder.status !== "TERMINADO" ? (
                  <div className="d-grid gap-2">
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
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h4 className="mb-1">Pedido {selectedOrder.id}</h4>
            <div className="d-flex align-items-center">
              <span
                className={`badge ${getStatusBadgeClass(selectedOrder.status)} me-2`}
              >
                {selectedOrder.status}
              </span>
              <span className="text-muted">
                {formatDate(selectedOrder.date)}
              </span>
            </div>
          </div>
          <button
            className="btn btn-sm btn-outline-primary"
            onClick={() => setSelectedOrder(null)}
          >
            Volver a la lista
          </button>
        </div>

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

        <div className="card mb-4">
          <div className="card-header">
            <h5 className="mb-0">Productos</h5>
          </div>
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
                          <img
                            src={item.product?.imgUrl}
                            alt={item.product?.name}
                            className="me-3"
                            style={{
                              width: "60px",
                              height: "60px",
                              objectFit: "cover",
                            }}
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src =
                                "https://via.placeholder.com/60?text=Imagen+No+Disponible";
                            }}
                          />
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
    );
  };

  // Vista principal del dashboard de pedidos
  const renderOrdersView = () => (
    <>
      <div className="row mb-4 align-items-center">
        <div className="col-md-6">
          <h4 className="mb-0">Gestión de Pedidos</h4>
          <p className="text-muted">Total: {ordersList.length} pedidos</p>
        </div>
        <div className="col-md-6">
          <div className="d-flex gap-2 justify-content-md-end">
            <div className="input-group">
              <span className="input-group-text bg-white border-end-0">
                <FaSearch className="text-muted" />
              </span>
              <input
                type="text"
                className="form-control border-start-0"
                placeholder="Buscar pedido..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="dropdown">
              <button
                className="btn btn-outline-secondary dropdown-toggle"
                type="button"
                data-bs-toggle="dropdown"
              >
                <FaFilter className="me-1" />
                {filter === "todos"
                  ? "Todos"
                  : filter === "PENDIENTE"
                  ? "Pendientes"
                  : filter === "PREPARACION"
                  ? "En preparación"
                  : "Terminados"}
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
      )}
    </>
  );

  // Función para renderizar las estadísticas
  const renderStatistics = () => (
    <div className="row mb-4">
      <div className="col-md-4 mb-3">
        <div className="card h-100 border-0 shadow-sm">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <div className="text-muted mb-1">Total Pedidos</div>
                <h3 className="mb-0">{ordersList.length}</h3>
              </div>
              <div className="bg-primary text-white p-2 rounded">
                <FaTachometerAlt size={20} />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="col-md-4 mb-3">
        <div className="card h-100 border-0 shadow-sm">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <div className="text-muted mb-1">Pendientes</div>
                <h3 className="mb-0">
                  {ordersList.filter((o) => o.status === "PENDIENTE").length}
                </h3>
              </div>
              <div className="bg-warning text-white p-2 rounded">
                <FaEye size={20} />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="col-md-4 mb-3">
        <div className="card h-100 border-0 shadow-sm">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <div className="text-muted mb-1">Completados</div>
                <h3 className="mb-0">
                  {ordersList.filter((o) => o.status === "TERMINADO").length}
                </h3>
              </div>
              <div className="bg-success text-white p-2 rounded">
                <FaEdit size={20} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
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
              <div className="me-4 text-end">
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
                <h2 className="mb-1">Dashboard de Administración</h2>
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
              <FaShoppingBag className="me-2" /> Pedidos
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === "products" ? "active" : ""}`}
              onClick={() => setActiveTab("products")}
            >
              <FaBoxes className="me-2" /> Productos
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