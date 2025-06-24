import { useEffect, useState } from "react";
import { FaEye, FaEdit, FaTrash, FaFilter, FaSearch, FaSpinner, FaArrowLeft, FaUser, FaBox, FaCalendar } from "react-icons/fa";
import orders, { Order } from "../data/orders";
import { getAllOrders } from "../api/order.api";

interface DashboardProps {
  onClose: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onClose }) => {
  const [ordersList, setOrdersList] = useState<Order[]>(orders);
  const [filter, setFilter] = useState<string>("todos");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    
    getAllOrders()
      .then((response: any) => {
        setOrdersList(response.data ?? response);
        console.log("Respuesta de la API de pedidos:", response);
      })
      .catch((error) => {
        console.error("Error al cargar los pedidos:", error);
        setError("Error al cargar los pedidos desde la API");
        setOrdersList(orders);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // Bloquear el scroll del body cuando se abre el modal
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  const filteredOrders = ordersList.filter((order) => {
    const statusFilter = filter === "todos" || order.status === filter;
    const searchFilter =
      searchTerm === "" ||
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.shippingInfo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.shippingInfo.email.toLowerCase().includes(searchTerm.toLowerCase());

    return statusFilter && searchFilter;
  });

  const handleStatusChange = (orderId: string, newStatus: Order["status"]) => {
    setOrdersList((prev) =>
      prev.map((order) =>
        order.id === orderId ? { ...order, status: newStatus } : order
      )
    );

    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder({ ...selectedOrder, status: newStatus });
    }
  };

  const handleDeleteOrder = (orderId: string) => {
    if (window.confirm("¿Estás seguro de que deseas eliminar este pedido?")) {
      setOrdersList((prev) => prev.filter((order) => order.id !== orderId));

      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(null);
      }
    }
  };

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

  const getStatusBadgeClass = (status: Order["status"]) => {
    switch (status) {
      case "pendiente":
        return "bg-warning";
      case "en proceso":
        return "bg-primary";
      case "enviado":
        return "bg-info";
      case "entregado":
        return "bg-success";
      case "cancelado":
        return "bg-danger";
      default:
        return "bg-secondary";
    }
  };

  const translateStatus = (status: string) => {
    switch (status) {
      case "pendiente":
        return "Pendiente";
      case "en proceso":
        return "En proceso";
      case "enviado":
        return "Enviado";
      case "entregado":
        return "Entregado";
      case "cancelado":
        return "Cancelado";
      default:
        return status;
    }
  };

  const renderLoadingState = () => (
    <div className="d-flex justify-content-center align-items-center py-5">
      <div className="text-center">
        <FaSpinner className="fa-spin fa-2x text-primary mb-3" />
        <p className="text-muted">Cargando pedidos...</p>
      </div>
    </div>
  );

  const renderErrorState = () => (
    <div className="alert alert-warning" role="alert">
      <strong>Atención:</strong> {error}
    </div>
  );

  const renderMobileOrderCard = (order: Order) => (
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
            {translateStatus(order.status)}
          </span>
          <div className="order-total">S/ {order.total.toFixed(2)}</div>
        </div>
      </div>
      
      <div className="order-customer">
        <FaUser className="me-2" size={12} />
        <span className="customer-name">{order.shippingInfo.name}</span>
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
        <button
          className="btn btn-sm btn-outline-secondary"
          onClick={() => setEditingOrder(order)}
          title="Editar estado"
        >
          <FaEdit className="me-1" size={12} />
          <span className="d-none d-sm-inline">Editar</span>
        </button>
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

  const renderDashboardView = () => (
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
                  {filter === "todos" ? "Todos" : translateStatus(filter)}
                </span>
                <span className="d-inline d-md-none">
                  {filter === "todos" ? "Todos" : filter.charAt(0).toUpperCase()}
                </span>
              </button>
              <ul className="dropdown-menu">
                <li><button className="dropdown-item" onClick={() => setFilter("todos")}>Todos</button></li>
                <li><button className="dropdown-item" onClick={() => setFilter("pendiente")}>Pendientes</button></li>
                <li><button className="dropdown-item" onClick={() => setFilter("en proceso")}>En proceso</button></li>
                <li><button className="dropdown-item" onClick={() => setFilter("enviado")}>Enviados</button></li>
                <li><button className="dropdown-item" onClick={() => setFilter("entregado")}>Entregados</button></li>
                <li><button className="dropdown-item" onClick={() => setFilter("cancelado")}>Cancelados</button></li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {error && renderErrorState()}

      {loading ? (
        renderLoadingState()
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
                        <div>{order.shippingInfo.name}</div>
                        <small className="text-muted">{order.shippingInfo.email}</small>
                      </td>
                      <td>S/ {order.total.toFixed(2)}</td>
                      <td>
                        <span className={`badge ${getStatusBadgeClass(order.status)}`}>
                          {translateStatus(order.status)}
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
                          <button
                            className="btn btn-sm btn-outline-secondary"
                            onClick={() => setEditingOrder(order)}
                            title="Editar estado"
                          >
                            <FaEdit />
                          </button>
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

  const renderOrderDetailView = () => {
    if (!selectedOrder) return null;

    return (
      <div>
        {/* Header del detalle */}
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
            <h5 className="mb-1">
              <span className="d-none d-md-inline">Pedido #{selectedOrder.id}</span>
              <span className="d-inline d-md-none">#{selectedOrder.id}</span>
            </h5>
            <div className="d-flex align-items-center flex-wrap">
              <span className={`badge ${getStatusBadgeClass(selectedOrder.status)} me-2`}>
                {translateStatus(selectedOrder.status)}
              </span>
              <span className="text-muted small">{formatDate(selectedOrder.date)}</span>
            </div>
          </div>
        </div>

        {/* Información del cliente y resumen - Vista móvil */}
        <div className="d-block d-lg-none">
          <div className="mobile-detail-card">
            <h6 className="card-title">Información del Cliente</h6>
            <div className="customer-info">
              <p><strong>Nombre:</strong> {selectedOrder.shippingInfo.name}</p>
              <p><strong>Email:</strong> {selectedOrder.shippingInfo.email}</p>
              <p><strong>Teléfono:</strong> {selectedOrder.shippingInfo.phone}</p>
              <p><strong>Dirección:</strong> {selectedOrder.shippingInfo.address}</p>
              <p><strong>Ciudad:</strong> {selectedOrder.shippingInfo.city}</p>
            </div>
          </div>

          <div className="mobile-detail-card">
            <h6 className="card-title">Resumen del Pedido</h6>
            <div className="order-summary">
              <div className="summary-row">
                <span>Subtotal:</span>
                <span>S/ {selectedOrder.subtotal.toFixed(2)}</span>
              </div>
              <div className="summary-row">
                <span>Envío:</span>
                <span>S/ {selectedOrder.shippingCost.toFixed(2)}</span>
              </div>
              <div className="summary-total">
                <span>Total:</span>
                <span>S/ {selectedOrder.total.toFixed(2)}</span>
              </div>
            </div>

            {/* Actualizar estado - Vista móvil */}
            <div className="status-update-mobile">
              <h6 className="mb-2">Actualizar estado:</h6>
              <div className="status-buttons">
                <button
                  className={`btn btn-sm ${
                    selectedOrder.status === "pendiente" ? "btn-warning" : "btn-outline-warning"
                  }`}
                  onClick={() => handleStatusChange(selectedOrder.id, "pendiente")}
                >
                  Pendiente
                </button>
                <button
                  className={`btn btn-sm ${
                    selectedOrder.status === "en proceso" ? "btn-primary" : "btn-outline-primary"
                  }`}
                  onClick={() => handleStatusChange(selectedOrder.id, "en proceso")}
                >
                  En proceso
                </button>
                <button
                  className={`btn btn-sm ${
                    selectedOrder.status === "enviado" ? "btn-info" : "btn-outline-info"
                  }`}
                  onClick={() => handleStatusChange(selectedOrder.id, "enviado")}
                >
                  Enviado
                </button>
                <button
                  className={`btn btn-sm ${
                    selectedOrder.status === "entregado" ? "btn-success" : "btn-outline-success"
                  }`}
                  onClick={() => handleStatusChange(selectedOrder.id, "entregado")}
                >
                  Entregado
                </button>
                <button
                  className={`btn btn-sm ${
                    selectedOrder.status === "cancelado" ? "btn-danger" : "btn-outline-danger"
                  }`}
                  onClick={() => handleStatusChange(selectedOrder.id, "cancelado")}
                >
                  Cancelado
                </button>
              </div>
            </div>
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
                  <p className="mb-1"><strong>Nombre:</strong> {selectedOrder.shippingInfo.name}</p>
                  <p className="mb-1"><strong>Email:</strong> {selectedOrder.shippingInfo.email}</p>
                  <p className="mb-1"><strong>Teléfono:</strong> {selectedOrder.shippingInfo.phone}</p>
                  <p className="mb-1"><strong>Dirección:</strong> {selectedOrder.shippingInfo.address}</p>
                  <p className="mb-0"><strong>Ciudad:</strong> {selectedOrder.shippingInfo.city}</p>
                </div>
              </div>
            </div>

            <div className="col-md-6 mb-4">
              <div className="card h-100">
                <div className="card-header">
                  <h5 className="mb-0">Resumen del Pedido</h5>
                </div>
                <div className="card-body">
                  <p className="mb-1"><strong>Subtotal:</strong> S/ {selectedOrder.subtotal.toFixed(2)}</p>
                  <p className="mb-1"><strong>Costo de envío:</strong> S/ {selectedOrder.shippingCost.toFixed(2)}</p>
                  <p className="mb-3 fs-5 fw-bold"><strong>Total:</strong> S/ {selectedOrder.total.toFixed(2)}</p>

                  <div className="mt-3">
                    <h6 className="mb-2">Actualizar estado:</h6>
                    <div className="d-flex flex-wrap gap-2">
                      <button
                        className={`btn btn-sm ${
                          selectedOrder.status === "pendiente" ? "btn-warning" : "btn-outline-warning"
                        }`}
                        onClick={() => handleStatusChange(selectedOrder.id, "pendiente")}
                      >
                        Pendiente
                      </button>
                      <button
                        className={`btn btn-sm ${
                          selectedOrder.status === "en proceso" ? "btn-primary" : "btn-outline-primary"
                        }`}
                        onClick={() => handleStatusChange(selectedOrder.id, "en proceso")}
                      >
                        En proceso
                      </button>
                      <button
                        className={`btn btn-sm ${
                          selectedOrder.status === "enviado" ? "btn-info" : "btn-outline-info"
                        }`}
                        onClick={() => handleStatusChange(selectedOrder.id, "enviado")}
                      >
                        Enviado
                      </button>
                      <button
                        className={`btn btn-sm ${
                          selectedOrder.status === "entregado" ? "btn-success" : "btn-outline-success"
                        }`}
                        onClick={() => handleStatusChange(selectedOrder.id, "entregado")}
                      >
                        Entregado
                      </button>
                      <button
                        className={`btn btn-sm ${
                          selectedOrder.status === "cancelado" ? "btn-danger" : "btn-outline-danger"
                        }`}
                        onClick={() => handleStatusChange(selectedOrder.id, "cancelado")}
                      >
                        Cancelado
                      </button>
                    </div>
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
                      src={item.img}
                      alt={item.name}
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
                    <div className="product-name">{item.name}</div>
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
                                  src={item.img}
                                  alt={item.name}
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
                              <div>{item.name}</div>
                            </div>
                          </td>
                          <td className="text-center">{item.quantity}</td>
                          <td className="text-end">S/ {item.price.toFixed(2)}</td>
                          <td className="text-end">S/ {(item.price * item.quantity).toFixed(2)}</td>
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

  const renderEditStatusModal = () => {
    if (!editingOrder) return null;

    return (
      <div
        className="modal d-block dashboard-modal"
        tabIndex={-1}
        style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">
                <span className="d-none d-sm-inline">Actualizar Estado - Pedido {editingOrder.id}</span>
                <span className="d-inline d-sm-none">Estado - #{editingOrder.id}</span>
              </h5>
              <button
                type="button"
                className="btn-close"
                onClick={() => setEditingOrder(null)}
              ></button>
            </div>
            <div className="modal-body">
              <div className="current-status">
                <p>
                  Estado actual:{" "}
                  <span className={`badge ${getStatusBadgeClass(editingOrder.status)}`}>
                    {translateStatus(editingOrder.status)}
                  </span>
                </p>
                <p>Cliente: {editingOrder.shippingInfo.name}</p>
                <p>Total: S/ {editingOrder.total.toFixed(2)}</p>
              </div>

              <div className="mt-4">
                <h6 className="mb-3">Seleccionar nuevo estado:</h6>
                <div className="d-grid gap-2">
                  <button
                    className={`btn ${
                      editingOrder.status === "pendiente" ? "btn-warning" : "btn-outline-warning"
                    }`}
                    onClick={() => {
                      handleStatusChange(editingOrder.id, "pendiente");
                      setEditingOrder(null);
                    }}
                  >
                    Pendiente
                  </button>
                  <button
                    className={`btn ${
                      editingOrder.status === "en proceso" ? "btn-primary" : "btn-outline-primary"
                    }`}
                    onClick={() => {
                      handleStatusChange(editingOrder.id, "en proceso");
                      setEditingOrder(null);
                    }}
                  >
                    En proceso
                  </button>
                  <button
                    className={`btn ${
                      editingOrder.status === "enviado" ? "btn-info" : "btn-outline-info"
                    }`}
                    onClick={() => {
                      handleStatusChange(editingOrder.id, "enviado");
                      setEditingOrder(null);
                    }}
                  >
                    Enviado
                  </button>
                  <button
                    className={`btn ${
                      editingOrder.status === "entregado" ? "btn-success" : "btn-outline-success"
                    }`}
                    onClick={() => {
                      handleStatusChange(editingOrder.id, "entregado");
                      setEditingOrder(null);
                    }}
                  >
                    Entregado
                  </button>
                  <button
                    className={`btn ${
                      editingOrder.status === "cancelado" ? "btn-danger" : "btn-outline-danger"
                    }`}
                    onClick={() => {
                      handleStatusChange(editingOrder.id, "cancelado");
                      setEditingOrder(null);
                    }}
                  >
                    Cancelado
                  </button>
                </div>
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

  return (
    <>
      {/* Estilos CSS responsivos para móviles */}
      <style>{`
        @media (max-width: 768px) {
          .dashboard-modal .modal-dialog {
            max-width: 100% !important;
            width: 100% !important;
            height: 100vh !important;
            margin: 0 !important;
          }
          
          .dashboard-modal .modal-content {
            height: 100vh !important;
            border-radius: 0 !important;
            border: none !important;
          }
          
          .dashboard-modal .modal-body {
            padding: 15px !important;
            overflow-y: auto !important;
            flex: 1 !important;
          }
          
          .dashboard-modal .modal-header {
            padding: 12px 15px !important;
            flex-shrink: 0 !important;
          }
          
          .dashboard-modal .modal-footer {
            padding: 12px 15px !important;
            flex-shrink: 0 !important;
          }
          
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
        }
        
        @media (max-width: 576px) {
          .dashboard-header h4 {
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
            flex-wrap: wrap;
          }
          
          .order-actions .btn {
            font-size: 0.8rem !important;
            padding: 6px 8px !important;
          }
          
          .dashboard-filters {
            gap: 10px;
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
        }
      `}</style>

      <div
        className="modal d-block dashboard-modal"
        tabIndex={-1}
        style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      >
        <div className="modal-dialog modal-dialog-centered modal-xl">
          <div className="modal-content">
            <div className="modal-header bg-danger text-white">
              <h5 className="modal-title">Dashboard de Administrador</h5>
              <button
                type="button"
                className="btn-close btn-close-white"
                onClick={onClose}
                aria-label="Close"
              ></button>
            </div>
            <div className="modal-body p-4">
              {selectedOrder ? renderOrderDetailView() : renderDashboardView()}
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
        {renderEditStatusModal()}
      </div>
    </>
  );
};

export default Dashboard;