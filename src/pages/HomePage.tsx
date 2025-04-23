import { useState } from "react";
import { FaShoppingCart, FaUser, FaTachometerAlt } from "react-icons/fa";
import { Link } from "react-router-dom";
import mariaLogo from "../assets/maria_logo.svg";
import bannerImage from "../assets/banner.webp";
import productos from "../data/products";
import LoginForm from "../components/LoginForm";
import RegisterForm from "../components/RegisterForm";
import ShoppingCart from "../components/ShoppingCart";

// Definición de la interfaz para los productos
interface Producto {
  name: string;
  img: string;
  text: string;
  price: number;
}

// Definición de la interfaz para elementos del carrito
interface CartItem extends Producto {
  quantity: number;
}

// Definición de la interfaz para usuario autenticado
interface AuthUser {
  id: string;
  user: string;
  name: string;
}

interface HomePageProps {
  currentUser: AuthUser | null;
  onLogin: (userData: AuthUser) => void;
  onRegister: (userData: AuthUser) => void;
  onLogout: () => void;
}

const HomePage: React.FC<HomePageProps> = ({ 
  currentUser, 
  onLogin, 
  onRegister, 
  onLogout 
}) => {
  // Estado para la categoría seleccionada (incluye "todos" como opción)
  const [categoriaSeleccionada, setCategoriaSeleccionada] =
    useState<string>("todos");

  // Estado para los elementos del carrito
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // Estado para manejo de modales
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isLoginForm, setIsLoginForm] = useState(true);
  const [showCart, setShowCart] = useState(false);

  // Añade este estado para seguir qué productos se añadieron recientemente
  const [addedProducts, setAddedProducts] = useState<Record<string, boolean>>({});

  // Verificar si el usuario actual es administrador
  const isAdmin = currentUser?.user === "admin";

  // Modifica la función addToCart para incluir el cambio de estado del botón
  const addToCart = (producto: Producto) => {
    // Marcar el producto como agregado
    setAddedProducts((prev) => ({
      ...prev,
      [producto.name]: true,
    }));

    // Restablecer el estado del botón después de 1.5 segundos
    setTimeout(() => {
      setAddedProducts((prev) => ({
        ...prev,
        [producto.name]: false,
      }));
    }, 1500);

    setCartItems((prevItems) => {
      // Verificar si el producto ya está en el carrito
      const existingItem = prevItems.find(
        (item) => item.name === producto.name,
      );

      if (existingItem) {
        // Si ya existe, incrementar la cantidad
        return prevItems.map((item) =>
          item.name === producto.name
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      } else {
        // Si no existe, añadirlo con cantidad 1
        return [...prevItems, { ...producto, quantity: 1 }];
      }
    });
  };

  // Funciones para manejar el carrito
  const updateCartItemQuantity = (name: string, newQuantity: number) => {
    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.name === name ? { ...item, quantity: newQuantity } : item,
      ),
    );
  };

  const removeCartItem = (name: string) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.name !== name));
  };

  // Obtener todos los productos en un solo array para la categoría "todos"
  const todosLosProductos = Object.values(productos.categorias).flat();

  // Determinar qué productos mostrar según la categoría seleccionada
  const productosMostrados =
    categoriaSeleccionada === "todos"
      ? todosLosProductos
      : productos.categorias[
          categoriaSeleccionada as keyof typeof productos.categorias
        ] || [];

  // Calcular el total de elementos en el carrito
  const totalItems = cartItems.reduce(
    (total, item) => total + item.quantity,
    0,
  );

  return (
    <>
      <nav className="navbar navbar-expand-lg navbar-light bg-light">
        <div className="container">
          <Link className="navbar-brand me-5" to="/">
            <img src={mariaLogo} alt="María Almenara" height="40" />
          </Link>
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarNav"
          >
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav me-auto">
              <li className="nav-item mx-3">
                <a
                  className="nav-link"
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                >
                  Inicio
                </a>
              </li>
              <li className="nav-item mx-3">
                <a
                  className="nav-link"
                  href="#catalogo"
                  onClick={(e) => {
                    e.preventDefault();
                    document
                      .getElementById("catalogo")
                      ?.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  Productos
                </a>
              </li>
              <li className="nav-item mx-3">
                <a
                  className="nav-link"
                  href="#footer"
                  onClick={(e) => {
                    e.preventDefault();
                    document
                      .getElementById("footer")
                      ?.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  Contacto
                </a>
              </li>
            </ul>
            <div className="d-flex align-items-center">
              {currentUser ? (
                <div className="dropdown me-3">
                  <button
                    className="btn btn-danger dropdown-toggle"
                    type="button"
                    id="userDropdown"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                  >
                    <FaUser className="me-2" /> {currentUser.name}
                  </button>
                  <ul className="dropdown-menu" aria-labelledby="userDropdown">
                    <li>
                      <a className="dropdown-item" href="#">
                        Mi Perfil
                      </a>
                    </li>
                    <li>
                      <a className="dropdown-item" href="#">
                        Mis Pedidos
                      </a>
                    </li>
                    {isAdmin && (
                      <li>
                        <Link className="dropdown-item" to="/dashboard">
                          Dashboard de Admin
                        </Link>
                      </li>
                    )}
                    <li>
                      <hr className="dropdown-divider" />
                    </li>
                    <li>
                      <button className="dropdown-item" onClick={onLogout}>
                        Cerrar Sesión
                      </button>
                    </li>
                  </ul>
                </div>
              ) : (
                <button
                  className="btn btn-danger me-3"
                  onClick={() => {
                    setIsLoginForm(true);
                    setShowLoginModal(true);
                  }}
                >
                  Iniciar Sesión
                </button>
              )}
              <button
                className="btn btn-outline-danger position-relative"
                onClick={() => setShowCart(true)}
              >
                <FaShoppingCart size={20} />
                <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                  {totalItems}
                </span>
              </button>
              {showCart && (
                <ShoppingCart
                  items={cartItems}
                  onClose={() => setShowCart(false)}
                  onUpdateQuantity={updateCartItemQuantity}
                  onRemoveItem={removeCartItem}
                />
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Modal de Login/Registro */}
      {showLoginModal && (
        <div
          className="modal d-block"
          tabIndex={-1}
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            {isLoginForm ? (
              <LoginForm
                onLogin={onLogin}
                onClose={() => setShowLoginModal(false)}
                onSwitchToRegister={() => setIsLoginForm(false)}
              />
            ) : (
              <RegisterForm
                onRegister={onRegister}
                onClose={() => setShowLoginModal(false)}
                onSwitchToLogin={() => setIsLoginForm(true)}
              />
            )}
          </div>
        </div>
      )}

      <div className="banner-container position-relative">
        {/* Overlay oscuro en toda la imagen */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0,0,0,0.6)",
            zIndex: 1,
          }}
        ></div>

        <img
          src={bannerImage}
          alt="María Almenara banner"
          className="img-fluid w-100"
          style={{ maxHeight: "500px", objectFit: "cover" }}
        />
        <div
          className="position-absolute top-50 start-50 translate-middle text-center"
          style={{
            padding: "30px",
            width: "80%",
            maxWidth: "700px",
            zIndex: 2,
          }}
        >
          <h1
            className="display-4 fw-bold text-white"
            style={{ textShadow: "2px 2px 4px rgba(0,0,0,0.9)" }}
          >
            Bienvenidos a María Almenara
          </h1>
          <p
            className="fs-5 text-white"
            style={{ textShadow: "1px 1px 2px rgba(0,0,0,0.9)" }}
          >
            Los mejores productos horneados frescos todos los días
          </p>
          
          {/* Botón para acceder al Dashboard */}
          {isAdmin && (
            <Link to="/dashboard" className="btn btn-danger btn-lg mt-3">
              <FaTachometerAlt className="me-2" /> 
              Acceder al Dashboard
            </Link>
          )}
          
          {!currentUser && (
            <button 
              className="btn btn-danger btn-lg mt-3"
              onClick={() => {
                setIsLoginForm(true);
                setShowLoginModal(true);
              }}
            >
              <FaUser className="me-2" />
              Iniciar Sesión
            </button>
          )}
        </div>
      </div>

      {/* Catálogo de Productos */}
      <div id="catalogo" className="container mt-5">
        <h2 className="mb-4 text-center">Catálogo de Productos</h2>

        <div className="d-flex justify-content-center mb-4">
          <div className="btn-group" role="group">
            <button
              className={`btn ${categoriaSeleccionada === "todos" ? "btn-danger" : "btn-outline-danger"}`}
              onClick={() => setCategoriaSeleccionada("todos")}
            >
              Todos
            </button>
            <button
              className={`btn ${categoriaSeleccionada === "birthday" ? "btn-danger" : "btn-outline-danger"}`}
              onClick={() => setCategoriaSeleccionada("birthday")}
            >
              Cumpleaños
            </button>
            <button
              className={`btn ${categoriaSeleccionada === "catering" ? "btn-danger" : "btn-outline-danger"}`}
              onClick={() => setCategoriaSeleccionada("catering")}
            >
              Catering
            </button>
            <button
              className={`btn ${categoriaSeleccionada === "tortas" ? "btn-danger" : "btn-outline-danger"}`}
              onClick={() => setCategoriaSeleccionada("tortas")}
            >
              Tortas
            </button>
            <button
              className={`btn ${categoriaSeleccionada === "box_regalos" ? "btn-danger" : "btn-outline-danger"}`}
              onClick={() => setCategoriaSeleccionada("box_regalos")}
            >
              Cajas Regalo
            </button>
          </div>
        </div>

        {/* Tarjetas de Productos */}
        <div className="row">
          {productosMostrados.map((producto: Producto, index: number) => (
            <div className="col-md-4 mb-4" key={`${producto.name}-${index}`}>
              <div className="card h-100">
                <img
                  src={producto.img}
                  className="card-img-top"
                  alt={producto.name}
                  style={{ height: "200px", objectFit: "cover" }}
                />
                <div className="card-body d-flex flex-column">
                  <h5 className="card-title">{producto.name}</h5>
                  <p className="card-text flex-grow-1">{producto.text}</p>
                  <div className="d-flex justify-content-between align-items-center mt-3">
                    <h5 className="m-0 text-danger">
                      S/ {producto.price.toFixed(2)}
                    </h5>
                    <button
                      className={`btn ${addedProducts[producto.name] ? "btn-success" : "btn-outline-danger"}`}
                      onClick={() => addToCart(producto)}
                      disabled={addedProducts[producto.name]}
                    >
                      {addedProducts[producto.name]
                        ? "¡Agregado!"
                        : "Añadir al carrito"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <footer id="footer" className="bg-dark text-white mt-5 py-4">
        <div className="container">
          <div className="row">
            <div className="col-md-6">
              <h5>María Almenara</h5>
              <p>Horneando tradición desde 2017</p>
            </div>
            <div className="col-md-6 text-md-end">
              <p>Calle Principal #123, Ciudad</p>
              <p>Teléfono: (123) 456-7890</p>
            </div>
          </div>
          <div className="text-center mt-3">
            <p>
              &copy; {new Date().getFullYear()} María Almenara. Todos los
              derechos reservados.
            </p>
          </div>
        </div>
      </footer>
    </>
  );
};

export default HomePage;