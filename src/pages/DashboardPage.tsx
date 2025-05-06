import { useNavigate, Link } from "react-router-dom";
import { useState } from "react";
import { FaHome, FaSignOutAlt, FaUserCog, FaTachometerAlt, FaEye, FaEdit, FaTrash, FaFilter, FaSearch } from "react-icons/fa";
import mariaLogo from "../assets/maria_logo.svg";
import orders from "../data/orders";
import type { Order } from "../data/orders";

interface AuthUser {
  id: string;
  user: string;
  name: string;
}

interface DashboardPageProps {
  currentUser: AuthUser | null;
  onLogout?: () => void;  // Añadir la función onLogout como prop opcional
}

const DashboardPage: React.FC<DashboardPageProps> = ({ currentUser, onLogout }) => {
  const navigate = useNavigate();
  const [ordersList, setOrdersList] = useState<Order[]>(orders);
  const [filter, setFilter] = useState<string>("todos");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);

  // Redireccionar si no hay usuario o no es administrador
  if (!currentUser || currentUser.user !== "admin") {
    // Redireccionar a la página principal
    navigate("/");
    return null;
  }

  // Función para cerrar sesión
  const handleLogout = () => {
    // Eliminar la información de usuario de localStorage
    localStorage.removeItem("currentUser");
    
    // Usar la función onLogout del componente padre si está disponible
    if (onLogout) {
      onLogout();  // Esto actualiza el estado en App.tsx
    } else {
      // Si no está disponible, solo navegar a la página principal
      navigate("/");
    }
  };

  // Función para filtrar pedidos
  const filteredOrders = ordersList.filter(order => {
    // Filtrar por estado
    const statusFilter = filter === "todos" || order.status === filter;
    
    // Filtrar por término de búsqueda (en ID, nombre del cliente o email)
    const searchFilter = 
      searchTerm === "" || 
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.shippingInfo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.shippingInfo.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    return statusFilter && searchFilter;
  });

  // Función para cambiar el estado de un pedido
  const handleStatusChange = (orderId: string, newStatus: Order["status"]) => {
    setOrdersList(prev => 
      prev.map(order => 
        order.id === orderId 
          ? { ...order, status: newStatus } 
          : order
      )
    );
    
    // Si estamos viendo el detalle de ese pedido, actualizarlo
    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder({ ...selectedOrder, status: newStatus });
    }
    
    // Cerrar el modal de edición si está abierto
    if (editingOrder && editingOrder.id === orderId) {
      setEditingOrder(null);
    }
  };

  // Función para eliminar un pedido
  const handleDeleteOrder = (orderId: string) => {
    if (window.confirm("¿Estás seguro de que deseas eliminar este pedido?")) {
      setOrdersList(prev => prev.filter(order => order.id !== orderId));
      
      // Si estamos viendo el pedido que se eliminó, cerrar el modal
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(null);
      }
    }
  };

  // Formatear fecha para mostrar
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { 
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Colores para los estados
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

  // Modal para editar el estado de un pedido
  const renderEditStatusModal = () => {
    if (!editingOrder) return null;

    return (
      <div className="modal d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Actualizar Estado - Pedido {editingOrder.id}</h5>
              <button
                type="button"
                className="btn-close"
                onClick={() => setEditingOrder(null)}
              ></button>
            </div>
            <div className="modal-body">
              <p>Estado actual: <span className={`badge ${getStatusBadgeClass(editingOrder.status)}`}>{editingOrder.status}</span></p>
              <p>Cliente: {editingOrder.shippingInfo.name}</p>
              <p>Total: S/ {editingOrder.total.toFixed(2)}</p>
              
              <div className="mt-4">
                <h6 className="mb-3">Seleccionar nuevo estado:</h6>
                <div className="d-grid gap-2">
                  <button 
                    className={`btn ${editingOrder.status === "pendiente" ? "btn-warning" : "btn-outline-warning"}`}
                    onClick={() => handleStatusChange(editingOrder.id, "pendiente")}
                  >
                    Pendiente
                  </button>
                  <button 
                    className={`btn ${editingOrder.status === "en proceso" ? "btn-primary" : "btn-outline-primary"}`}
                    onClick={() => handleStatusChange(editingOrder.id, "en proceso")}
                  >
                    En proceso
                  </button>
                  <button 
                    className={`btn ${editingOrder.status === "enviado" ? "btn-info" : "btn-outline-info"}`}
                    onClick={() => handleStatusChange(editingOrder.id, "enviado")}
                  >
                    Enviado
                  </button>
                  <button 
                    className={`btn ${editingOrder.status === "entregado" ? "btn-success" : "btn-outline-success"}`}
                    onClick={() => handleStatusChange(editingOrder.id, "entregado")}
                  >
                    Entregado
                  </button>
                  <button 
                    className={`btn ${editingOrder.status === "cancelado" ? "btn-danger" : "btn-outline-danger"}`}
                    onClick={() => handleStatusChange(editingOrder.id, "cancelado")}
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

  // Vista detallada de un pedido
  const renderOrderDetailView = () => {
    if (!selectedOrder) return null;

    return (
      <div>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h4 className="mb-1">Pedido {selectedOrder.id}</h4>
            <div className="d-flex align-items-center">
              <span className={`badge ${getStatusBadgeClass(selectedOrder.status)} me-2`}>
                {selectedOrder.status}
              </span>
              <span className="text-muted">{formatDate(selectedOrder.date)}</span>
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
                      className={`btn btn-sm ${selectedOrder.status === "pendiente" ? "btn-warning" : "btn-outline-warning"}`}
                      onClick={() => handleStatusChange(selectedOrder.id, "pendiente")}
                    >
                      Pendiente
                    </button>
                    <button 
                      className={`btn btn-sm ${selectedOrder.status === "en proceso" ? "btn-primary" : "btn-outline-primary"}`}
                      onClick={() => handleStatusChange(selectedOrder.id, "en proceso")}
                    >
                      En proceso
                    </button>
                    <button 
                      className={`btn btn-sm ${selectedOrder.status === "enviado" ? "btn-info" : "btn-outline-info"}`}
                      onClick={() => handleStatusChange(selectedOrder.id, "enviado")}
                    >
                      Enviado
                    </button>
                    <button 
                      className={`btn btn-sm ${selectedOrder.status === "entregado" ? "btn-success" : "btn-outline-success"}`}
                      onClick={() => handleStatusChange(selectedOrder.id, "entregado")}
                    >
                      Entregado
                    </button>
                    <button 
                      className={`btn btn-sm ${selectedOrder.status === "cancelado" ? "btn-danger" : "btn-outline-danger"}`}
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
                            src={item.img}
                            alt={item.name}
                            className="me-3"
                            style={{ 
                              width: "60px", 
                              height: "60px", 
                              objectFit: "cover" 
                            }}
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = "https://via.placeholder.com/60?text=Imagen+No+Disponible";
                            }}
                          />
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
    );
  };

  // Vista principal del dashboard
  const renderDashboardView = () => (
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
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="dropdown">
              <button 
                className="btn btn-outline-secondary dropdown-toggle" 
                type="button"
                data-bs-toggle="dropdown"
              >
                <FaFilter className="me-1" /> 
                {filter === "todos" ? "Todos" : 
                  filter === "pendiente" ? "Pendientes" :
                  filter === "en proceso" ? "En proceso" :
                  filter === "enviado" ? "Enviados" :
                  filter === "entregado" ? "Entregados" :
                  "Cancelados"}
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

      {filteredOrders.length === 0 ? (
        <div className="alert alert-info">No se encontraron pedidos con los criterios seleccionados.</div>
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
              {filteredOrders.map(order => (
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
      )}
    </>
  );

  return (
    <>
      {/* Cabecera */}
      <header className="bg-white shadow-sm">
        <div className="container">
          <div className="d-flex justify-content-between align-items-center py-3">
            <Link to="/" className="d-flex align-items-center text-decoration-none">
              <img src={mariaLogo} alt="María Almenara" height="40" className="me-3" />
            </Link>
            <div className="d-flex align-items-center">
              <div className="me-4 text-end">
                <div className="fs-6 fw-bold">{currentUser.name}</div>
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
                  <li><hr className="dropdown-divider" /></li>
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
                    <li className="breadcrumb-item"><Link to="/">Inicio</Link></li>
                    <li className="breadcrumb-item active" aria-current="page">Dashboard</li>
                  </ol>
                </nav>
              </div>
            </div>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="row mb-4">
          <div className="col-md-3 mb-3">
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
          <div className="col-md-3 mb-3">
            <div className="card h-100 border-0 shadow-sm">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <div className="text-muted mb-1">Pedidos Pendientes</div>
                    <h3 className="mb-0">{ordersList.filter(o => o.status === "pendiente").length}</h3>
                  </div>
                  <div className="bg-warning text-white p-2 rounded">
                    <FaEye size={20} />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-3 mb-3">
            <div className="card h-100 border-0 shadow-sm">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <div className="text-muted mb-1">En Proceso</div>
                    <h3 className="mb-0">{ordersList.filter(o => o.status === "en proceso").length}</h3>
                  </div>
                  <div className="bg-info text-white p-2 rounded">
                    <FaEdit size={20} />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-3 mb-3">
            <div className="card h-100 border-0 shadow-sm">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <div className="text-muted mb-1">Completados</div>
                    <h3 className="mb-0">{ordersList.filter(o => o.status === "entregado").length}</h3>
                  </div>
                  <div className="bg-success text-white p-2 rounded">
                    <FaEdit size={20} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Panel principal */}
        <div className="card border-0 shadow-sm">
          <div className="card-body p-4">
            {selectedOrder ? renderOrderDetailView() : renderDashboardView()}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-light mt-auto py-4">
        <div className="container">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <span className="text-muted">
                &copy; {new Date().getFullYear()} María Almenara. Todos los derechos reservados.
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