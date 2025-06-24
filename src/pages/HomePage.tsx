import { useState, useEffect } from "react";
import { FaShoppingCart, FaUser, FaTachometerAlt } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import mariaLogo from "../assets/maria_logo.svg";
import bannerImage from "../assets/banner.webp";
import LoginForm from "../components/LoginForm";
import RegisterForm from "../components/RegisterForm";
import ShoppingCart from "../components/ShoppingCart";
import ProductCatalog from "../components/ProductCatalog";
import useUserStore from "../../store/userStore";
import authApi from "../api/auth.api";
import type { Product } from "../domain/IProduct";
import MyOrders from "../components/MyOrders";
import MyProfile from "../components/MyProfile";

// Definición de la interfaz para elementos del carrito (sincronizada con ShoppingCart)
interface CartItem extends Product {
  id: number;
  quantity: number;
}

const HomePage: React.FC = () => {
  const navigate = useNavigate();

  // Obtener datos del usuario desde el store
  const { isAuthenticated, user } = useUserStore();
  const isAdmin = useUserStore((state) => state.isAdmin());
  const userName = useUserStore((state) => state.getUserName());

  // Estado para los elementos del carrito
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // Estado para manejo de modales
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isLoginForm, setIsLoginForm] = useState(true);
  const [showCart, setShowCart] = useState(false);
  const [showMyOrders, setShowMyOrders] = useState<boolean>(false);
  const [showMyProfile, setShowMyProfile] = useState<boolean>(false);
  
  // Nuevo estado para controlar si debemos mostrar el checkout después del login/registro
  const [redirectToCheckout, setRedirectToCheckout] = useState<boolean>(false);
  // Nuevo estado para el paso inicial del carrito
  const [cartInitialStep, setCartInitialStep] = useState<"cart" | "checkout" | "confirmation" | "complete">("cart");

  // Estado para controlar si la imagen del banner se cargó
  const [bannerImageLoaded, setBannerImageLoaded] = useState<boolean>(false);

  // Efecto para redirigir al checkout después del login/registro
  useEffect(() => {
    if (isAuthenticated && redirectToCheckout && cartItems.length > 0) {
      // Mostrar el carrito con el paso inicial en checkout
      setCartInitialStep("checkout");
      setShowCart(true);
      // Resetear el flag de redirección
      setRedirectToCheckout(false);
    }
  }, [isAuthenticated, redirectToCheckout, cartItems.length]);

  // Función para cerrar sesión
  const handleLogout = () => {
    authApi.clearSession();
  };

  // Función para ir al dashboard
  const goToDashboard = () => {
    navigate("/dashboard");
  };

  // Función para añadir productos al carrito (ACTUALIZADA)
  const addToCart = (producto: Product) => {
    // No permitir añadir productos al carrito si es admin
    if (isAdmin) return;
    
    setCartItems((prevItems) => {
      // Verificar si el producto ya está en el carrito
      const existingItem = prevItems.find(
        (item) => item.name === producto.name
      );

      if (existingItem) {
        // Si ya existe, incrementar la cantidad
        return prevItems.map((item) =>
          item.name === producto.name
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        // Si no existe, añadirlo con cantidad 1 y generar un ID único
        // Usaremos el timestamp como ID temporal hasta que se obtenga el ID real del producto
        const newCartItem: CartItem = {
          ...producto,
          id: producto.id || Date.now(), // Usar el ID del producto o timestamp como fallback
          quantity: 1,
        };
        return [...prevItems, newCartItem];
      }
    });
  };

  // Funciones para manejar el carrito
  const updateCartItemQuantity = (name: string, newQuantity: number) => {
    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.name === name ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const removeCartItem = (name: string) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.name !== name));
  };

  // Función para limpiar completamente el carrito
  const clearCart = () => {
    setCartItems([]);
  };

  // Calcular el total de elementos en el carrito
  const totalItems = cartItems.reduce(
    (total, item) => total + item.quantity,
    0
  );

  // Función que maneja el cierre del carrito
  const handleCartClose = () => {
    setShowCart(false);
    setCartInitialStep("cart"); // Resetear el paso inicial al cerrar
  };

  return (
    <>
      {/* Navbar responsiva */}
      <nav className="navbar navbar-expand-lg navbar-light bg-light sticky-top">
        <div className="container">
          <Link className="navbar-brand me-3 me-lg-5" to="/">
            <img 
              src={mariaLogo} 
              alt="María Almenara" 
              height="40" 
              className="d-inline-block align-text-top"
            />
          </Link>
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarNav"
            aria-controls="navbarNav"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav me-auto">
              <li className="nav-item mx-1 mx-lg-3">
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
              <li className="nav-item mx-1 mx-lg-3">
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
              <li className="nav-item mx-1 mx-lg-3">
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
              {isAdmin && (
                <li className="nav-item mx-1 mx-lg-3">
                  <Link className="nav-link text-danger" to="/dashboard">
                    <FaTachometerAlt className="me-1" /> Dashboard
                  </Link>
                </li>
              )}
            </ul>
            
            {/* Controles de usuario - responsivos */}
            <div className="d-flex flex-column flex-lg-row align-items-stretch align-items-lg-center gap-2 mt-3 mt-lg-0">
              {isAuthenticated ? (
                <div className="dropdown">
                  <button
                    className="btn btn-danger dropdown-toggle w-100"
                    type="button"
                    id="userDropdown"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                  >
                    <FaUser className="me-2" /> 
                    <span className="d-none d-sm-inline">{userName}</span>
                    <span className="d-inline d-sm-none">Perfil</span>
                  </button>
                  <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="userDropdown">
                    {/* Solo mostrar Mi Perfil y Mis Pedidos si NO es admin */}
                    {!isAdmin && (
                      <>
                        <li>
                          <button
                            className="dropdown-item"
                            onClick={() => setShowMyProfile(true)}
                          >
                            Mi Perfil
                          </button>
                        </li>
                        <li>
                          <button
                            className="dropdown-item"
                            onClick={() => setShowMyOrders(true)}
                          >
                            Mis Pedidos
                          </button>
                        </li>
                      </>
                    )}
                    {isAdmin && (
                      <li>
                        <button
                          className="dropdown-item d-flex align-items-center"
                          onClick={goToDashboard}
                        >
                          <FaTachometerAlt className="me-2" />
                          Dashboard de Admin
                        </button>
                      </li>
                    )}
                    <li>
                      <hr className="dropdown-divider" />
                    </li>
                    <li>
                      <button className="dropdown-item" onClick={handleLogout}>
                        Cerrar Sesión
                      </button>
                    </li>
                  </ul>
                </div>
              ) : (
                <button
                  className="btn btn-danger"
                  onClick={() => {
                    setIsLoginForm(true);
                    setShowLoginModal(true);
                  }}
                >
                  Iniciar Sesión
                </button>
              )}
              
              {/* Mostrar el botón de carrito solo si NO es admin */}
              {!isAdmin && (
                <button
                  className="btn btn-outline-danger position-relative"
                  onClick={() => setShowCart(true)}
                >
                  <FaShoppingCart size={20} />
                  <span className="d-none d-sm-inline ms-2">Carrito</span>
                  {totalItems > 0 && (
                    <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                      {totalItems}
                    </span>
                  )}
                </button>
              )}
              
              {showCart && !isAdmin && (
                <ShoppingCart
                  items={cartItems}
                  onClose={handleCartClose}
                  onUpdateQuantity={updateCartItemQuantity}
                  onRemoveItem={removeCartItem}
                  onClearCart={clearCart}
                  currentUser={
                    isAuthenticated && user
                      ? {
                          id: user.id ? user.id.toString() : "0",
                          user: user.email || "",
                          name: userName,
                        }
                      : null
                  }
                  onLogin={() => {
                    setShowLoginModal(false);
                  }}
                  onRegister={() => {
                    setShowLoginModal(false);
                  }}
                  initialStep={cartInitialStep}
                  onNeedAuth={() => {
                    // Cuando el carrito necesita autenticación, mostrar el modal de login
                    // y configurar para redirección posterior al checkout
                    setShowCart(false);
                    setRedirectToCheckout(true);
                    setIsLoginForm(true);
                    setShowLoginModal(true);
                  }}
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
                onLogin={() => {
                  setShowLoginModal(false);
                  // No hacemos nada más aquí, el useEffect manejará la redirección
                }}
                onClose={() => {
                  setShowLoginModal(false);
                  setRedirectToCheckout(false); // Cancelar la redirección si se cierra el modal
                }}
                onSwitchToRegister={() => setIsLoginForm(false)}
              />
            ) : (
              <RegisterForm
                onRegister={() => {
                  setShowLoginModal(false);
                  // No hacemos nada más aquí, el useEffect manejará la redirección
                }}
                onClose={() => {
                  setShowLoginModal(false);
                  setRedirectToCheckout(false); // Cancelar la redirección si se cierra el modal
                }}
                onSwitchToLogin={() => setIsLoginForm(true)}
              />
            )}
          </div>
        </div>
      )}

      {/* Banner optimizado para móviles */}
      <div 
        className="banner-container position-relative"
        style={{
          minHeight: "280px", // Reducido para móviles
          height: "35vh", // Altura menor en móviles
          maxHeight: "450px", // Altura máxima reducida
          overflow: "hidden"
        }}
      >
        {/* Overlay oscuro */}
        <div
          className="position-absolute top-0 start-0 w-100 h-100"
          style={{
            backgroundColor: "rgba(0,0,0,0.65)",
            zIndex: 2,
          }}
        ></div>

        {/* Imagen del banner optimizada */}
        <img
          src={bannerImage}
          alt="María Almenara banner"
          className="position-absolute top-0 start-0 w-100 h-100"
          style={{ 
            objectFit: "cover",
            objectPosition: "center 30%", // Mejor posición para móviles
            opacity: bannerImageLoaded ? 1 : 0,
            transition: "opacity 0.3s ease-in-out"
          }}
          onLoad={() => setBannerImageLoaded(true)}
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            // Imagen de fallback si no carga
            target.src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzM0NDA0ZSIvPjx0ZXh0IHg9IjUwIiB5PSI1NSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE0IiBmaWxsPSIjZmZmIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5JbWFnZW48L3RleHQ+PC9zdmc+";
            setBannerImageLoaded(true);
          }}
        />

        {/* Fondo de color como fallback */}
        {!bannerImageLoaded && (
          <div 
            className="position-absolute top-0 start-0 w-100 h-100"
            style={{
              background: "linear-gradient(135deg, #dc3545 0%, #c82333 100%)",
              zIndex: 1
            }}
          />
        )}

        {/* Contenido del banner - optimizado para móviles */}
        <div
          className="position-absolute top-50 start-50 translate-middle text-center"
          style={{
            padding: "15px",
            width: "95%",
            maxWidth: "600px",
            zIndex: 3,
          }}
        >
          <h1
            className="fw-bold text-white mb-2 mb-md-3"
            style={{ 
              textShadow: "2px 2px 4px rgba(0,0,0,0.9)",
              fontSize: "clamp(1.5rem, 6vw, 2.5rem)", // Tamaño más apropiado para móviles
              lineHeight: "1.2"
            }}
          >
            Bienvenidos a María Almenara
          </h1>
          <p
            className="text-white mb-3 mb-md-4"
            style={{ 
              textShadow: "1px 1px 2px rgba(0,0,0,0.9)",
              fontSize: "clamp(0.9rem, 3.5vw, 1.1rem)", // Tamaño más pequeño
              lineHeight: "1.3"
            }}
          >
            Los mejores productos horneados frescos todos los días
          </p>

          {/* Botón para acceder al Dashboard - más pequeño en móviles */}
          {isAdmin && (
            <Link 
              to="/dashboard" 
              className="btn btn-danger"
              style={{ 
                fontSize: "clamp(0.85rem, 2.5vw, 1rem)",
                padding: "8px 16px"
              }}
            >
              <FaTachometerAlt className="me-2" />
              <span className="d-none d-sm-inline">Acceder al </span>Dashboard
            </Link>
          )}
        </div>
      </div>

      {/* Catálogo de Productos con estilos mejorados para móviles */}
      <style>{`
        @media (max-width: 768px) {
          .btn-group .btn {
            font-size: 0.85rem !important;
            padding: 10px 12px !important;
            border-radius: 8px !important;
            margin: 2px !important;
            min-width: auto !important;
            white-space: nowrap;
          }
          
          .btn-group {
            display: flex !important;
            flex-wrap: wrap !important;
            gap: 4px !important;
            justify-content: center !important;
            border-radius: 0 !important;
          }
          
          .btn-group > .btn:not(:first-child) {
            margin-left: 0 !important;
            border-top-left-radius: 8px !important;
            border-bottom-left-radius: 8px !important;
          }
          
          .btn-group > .btn:not(:last-child) {
            border-top-right-radius: 8px !important;
            border-bottom-right-radius: 8px !important;
          }
        }
        
        @media (max-width: 576px) {
          .btn-group .btn {
            font-size: 0.8rem !important;
            padding: 8px 10px !important;
            flex: 1 1 auto !important;
            max-width: calc(50% - 4px) !important;
          }
          
          .container {
            padding-left: 12px !important;
            padding-right: 12px !important;
          }
        }
      `}</style>

      <ProductCatalog onAddToCart={addToCart} />

      {/* Footer responsive */}
      <footer id="footer" className="bg-dark text-white mt-5 py-4">
        <div className="container">
          <div className="row gy-3">
            <div className="col-md-6 text-center text-md-start">
              <h5>María Almenara</h5>
              <p className="mb-0">Horneando tradición desde 2017</p>
            </div>
            <div className="col-md-6 text-center text-md-end">
              <p className="mb-1">Calle Principal #123, Ciudad</p>
              <p className="mb-0">Teléfono: (123) 456-7890</p>
            </div>
          </div>
          <div className="text-center mt-3 pt-3 border-top border-secondary">
            <p className="mb-0">
              &copy; {new Date().getFullYear()} María Almenara. Todos los
              derechos reservados.
            </p>
          </div>
        </div>
      </footer>
      
      {/* Mostrar estos modales solo si el usuario NO es admin */}
      {isAuthenticated && !isAdmin && (
        <MyOrders show={showMyOrders} onClose={() => setShowMyOrders(false)} />
      )}
      {isAuthenticated && !isAdmin && (
        <MyProfile
          show={showMyProfile}
          onClose={() => setShowMyProfile(false)}
        />
      )}
    </>
  );
};

export default HomePage;