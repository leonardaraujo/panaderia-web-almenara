import { useState } from "react";
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

const HomePage: React.FC = () => {
    const navigate = useNavigate();
    
    // Obtener datos del usuario desde el store
    const { isAuthenticated, user } = useUserStore();
    const isAdmin = useUserStore(state => state.isAdmin());
    const userName = useUserStore(state => state.getUserName());

    // Estado para los elementos del carrito
    const [cartItems, setCartItems] = useState<CartItem[]>([]);

    // Estado para manejo de modales
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [isLoginForm, setIsLoginForm] = useState(true);
    const [showCart, setShowCart] = useState(false);

    // Función para cerrar sesión
    const handleLogout = () => {
        authApi.clearSession();
    };
    
    // Función para ir al dashboard
    const goToDashboard = () => {
        navigate("/dashboard");
    };

    // Función para añadir productos al carrito
    const addToCart = (producto: Producto) => {
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
                            {isAdmin && (
                                <li className="nav-item mx-3">
                                    <Link className="nav-link text-danger" to="/dashboard">
                                        <FaTachometerAlt className="me-1" /> Dashboard
                                    </Link>
                                </li>
                            )}
                        </ul>
                        <div className="d-flex align-items-center">
                            {isAuthenticated ? (
                                <div className="dropdown me-3">
                                    <button
                                        className="btn btn-danger dropdown-toggle"
                                        type="button"
                                        id="userDropdown"
                                        data-bs-toggle="dropdown"
                                        aria-expanded="false"
                                    >
                                        <FaUser className="me-2" /> {userName}
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
                                    currentUser={isAuthenticated ? {
                                        id: user?.id_user.toString() || "",
                                        user: user?.email || "",
                                        name: userName
                                    } : null}
                                    onLogin={() => {
                                        // Esta función ya no es necesaria gracias a useUserStore,
                                        // pero la dejamos para mantener la compatibilidad
                                        setShowLoginModal(false);
                                    }}
                                    onRegister={() => {
                                        // Esta función ya no es necesaria gracias a useUserStore,
                                        // pero la dejamos para mantener la compatibilidad
                                        setShowLoginModal(false);
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
                                    // Esta función ya no es necesaria gracias a useUserStore,
                                    // pero la dejamos para mantener la compatibilidad
                                    setShowLoginModal(false);
                                }}
                                onClose={() => setShowLoginModal(false)}
                                onSwitchToRegister={() => setIsLoginForm(false)}
                            />
                        ) : (
                            <RegisterForm
                                onRegister={() => {
                                    // Esta función ya no es necesaria gracias a useUserStore,
                                    // pero la dejamos para mantener la compatibilidad
                                    setShowLoginModal(false);
                                }}
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
                </div>
            </div>

            {/* Catálogo de Productos - Ahora es un componente separado */}
            <ProductCatalog onAddToCart={addToCart} />

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