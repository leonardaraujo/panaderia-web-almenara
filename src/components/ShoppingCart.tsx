import { useState, useEffect } from "react";
import { FaTrash, FaMinus, FaPlus, FaShoppingCart } from "react-icons/fa";
import type { ShippingInfo } from "../data/orders";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";
import type { Product } from "../domain/IProduct";
import useUserStore from "../../store/userStore";
import { createOrder, PaymentMethod, DeliveryMethod } from "../api/order.api";

// Constante para el cálculo de impuestos
const IGV_RATE = 0.18;

// Función para calcular el precio base (sin IGV) a partir del precio total
const calcularPrecioBase = (precioTotal: number): number => {
  return precioTotal / (1 + IGV_RATE);
};

// Función para calcular el monto del IGV
const calcularIGV = (precioTotal: number): number => {
  const precioBase = calcularPrecioBase(precioTotal);
  return precioTotal - precioBase;
};

interface CartItem extends Product {
  id: number;
  quantity: number;
}

interface AuthUser {
  id: string;
  user: string;
  name: string;
  address?: string;
  district?: string;
  phoneNumber?: string;
}

interface ShoppingCartProps {
  items: CartItem[];
  onClose: () => void;
  onUpdateQuantity: (name: string, newQuantity: number) => void;
  onRemoveItem: (name: string) => void;
  onClearCart: () => void;
  currentUser: AuthUser | null;
  onLogin: (userData: AuthUser) => void;
  onRegister: (userData: AuthUser) => void;
  initialStep?: "cart" | "checkout" | "confirmation" | "complete";
  onNeedAuth?: () => void;
}

const ShoppingCart: React.FC<ShoppingCartProps> = ({
  items,
  onClose,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  currentUser,
  onLogin,
  onRegister,
  initialStep = "cart",
  onNeedAuth,
}) => {
  const { user } = useUserStore();

  const [step, setStep] = useState<"cart" | "auth" | "checkout" | "confirmation" | "complete">(initialStep);
  const [isLoginForm, setIsLoginForm] = useState(true);
  const [showTaxBreakdown, setShowTaxBreakdown] = useState<boolean>(false);

  const paymentMethods = [
    { value: "tarjeta", label: "Tarjeta débito/crédito" },
    { value: "yape", label: "Yape/Plin" },
    { value: "contraentrega", label: "Pago contraentrega" },
  ];

  const [paymentMethod, setPaymentMethod] = useState<string>("tarjeta");

  const [shippingInfo, setShippingInfo] = useState<ShippingInfo>({
    name: currentUser?.name || "",
    address: "",
    city: "",
    phone: "",
    email: "",
  });

  useEffect(() => {
    setStep(initialStep);
  }, [initialStep]);

  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  useEffect(() => {
    if (user) {
      setShippingInfo({
        name: `${user.name} ${user.surname || ""}`,
        address: user.address || "",
        city: user.district || "",
        phone: user.phoneNumber || "",
        email: user.email || "",
      });
    } else if (currentUser) {
      setShippingInfo((prev) => ({
        ...prev,
        name: currentUser.name,
        email: currentUser.user || "",
      }));
    }
  }, [user, currentUser]);

  const subtotal = items.reduce((total, item) => total + item.price * item.quantity, 0);
  const shippingCost = 15.0;
  const total = subtotal + (items.length > 0 && shippingInfo.address !== "RECOJO EN TIENDA" ? shippingCost : 0);

  const subtotalBase = calcularPrecioBase(subtotal);
  const totalIGV = calcularIGV(subtotal);

  const handleSubmitOrder = async () => {
    try {
      const finalShippingCost = shippingInfo.address === "RECOJO EN TIENDA" ? 0 : shippingCost;
      const finalTotal = subtotal + finalShippingCost;

      const deliveryMethod = shippingInfo.address === "RECOJO EN TIENDA"
        ? DeliveryMethod.RECOJO_EN_TIENDA
        : DeliveryMethod.ENVIO_A_DIRECCION;

      let paymentMethodEnum = PaymentMethod.TARJETA;
      if (paymentMethod === "yape") paymentMethodEnum = PaymentMethod.YAPE;
      if (paymentMethod === "contraentrega") paymentMethodEnum = PaymentMethod.CONTRAENTREGA;

      const shippingAddress = deliveryMethod === DeliveryMethod.ENVIO_A_DIRECCION
        ? `${shippingInfo.address} - ${shippingInfo.city} - ${shippingInfo.phone} - ${shippingInfo.name}`
        : `RECOJO EN TIENDA - Av. Primavera 120, San Borja - ${shippingInfo.phone} - ${shippingInfo.name}`;

      const orderData = {
        userId: user!.id,
        deliveryMethod,
        paymentMethod: paymentMethodEnum,
        shippingInfo: shippingAddress,
        items: items.map((item) => ({
          productId: item.id,
          price: item.price,
          quantity: item.quantity,
        })),
        subtotal,
        shippingCost: finalShippingCost,
        total: finalTotal,
      };

      console.log("Enviando orden:", orderData);
      const createdOrder = await createOrder(orderData);
      console.log("Orden creada exitosamente:", createdOrder);
      
      onClearCart();
      setStep("complete");
    } catch (error) {
      console.error("Error al crear la orden:", error);
      alert("Error al procesar tu pedido. Por favor, inténtalo de nuevo.");
    }
  };

  const isShippingFormValid = () => {
    if (shippingInfo.address === "RECOJO EN TIENDA") {
      return true;
    }
    return shippingInfo.address !== "";
  };

  const handleMainAction = () => {
    if (items.length === 0) return;

    if (step === "cart") {
      if (currentUser) {
        setStep("checkout");
      } else {
        if (onNeedAuth) {
          onNeedAuth();
        } else {
          setStep("auth");
        }
      }
    } else if (step === "checkout") {
      setStep("confirmation");
    } else if (step === "confirmation") {
      handleSubmitOrder();
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case "cart": return "Carrito de Compras";
      case "auth": return isLoginForm ? "Inicia sesión para proceder" : "Registrarse";
      case "checkout": return "Información de Envío";
      case "confirmation": return "Revisar y Confirmar";
      case "complete": return "¡Pedido Completado!";
      default: return "Carrito de Compras";
    }
  };

  const renderActionButtons = () => {
    switch (step) {
      case "cart":
        return (
          <>
            <button className="btn btn-outline-secondary" onClick={onClose}>
              Seguir comprando
            </button>
            <button
              className="btn btn-danger"
              onClick={handleMainAction}
              disabled={items.length === 0}
            >
              Proceder al pedido
            </button>
          </>
        );
      case "auth":
        return null;
      case "checkout":
        return (
          <>
            <button className="btn btn-outline-secondary" onClick={() => setStep("cart")}>
              Volver al carrito
            </button>
            <button
              className="btn btn-danger"
              onClick={handleMainAction}
              disabled={!isShippingFormValid()}
            >
              Continuar al pago
            </button>
          </>
        );
      case "confirmation":
        return (
          <>
            <button className="btn btn-outline-secondary" onClick={() => setStep("checkout")}>
              Modificar información
            </button>
            <button className="btn btn-danger" onClick={handleMainAction}>
              Finalizar compra
            </button>
          </>
        );
      case "complete":
        return (
          <button className="btn btn-danger" onClick={onClose}>
            Cerrar
          </button>
        );
    }
  };

  return (
    <>
      {/* Estilos CSS responsivos para móviles */}
      <style>{`
        @media (max-width: 768px) {
          .shopping-cart-modal .modal-dialog {
            max-width: 100% !important;
            width: 100% !important;
            height: 100vh !important;
            margin: 0 !important;
          }
          
          .shopping-cart-modal .modal-content {
            height: 100vh !important;
            border-radius: 0 !important;
            border: none !important;
          }
          
          .shopping-cart-modal .modal-body {
            padding: 15px !important;
            overflow-y: auto !important;
            flex: 1 !important;
          }
          
          .shopping-cart-modal .modal-header {
            padding: 12px 15px !important;
            flex-shrink: 0 !important;
          }
          
          .shopping-cart-modal .modal-footer {
            padding: 12px 15px !important;
            flex-shrink: 0 !important;
            border-top: 1px solid #dee2e6 !important;
          }
          
          .cart-item-mobile {
            background: #f8f9fa;
            border-radius: 8px;
            padding: 12px;
            margin-bottom: 12px;
            border: 1px solid #e9ecef;
          }
          
          .cart-item-image {
            width: 60px !important;
            height: 60px !important;
            border-radius: 6px !important;
            background: #e9ecef !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            font-size: 0.7rem !important;
            color: #6c757d !important;
            text-align: center !important;
          }
          
          .quantity-controls {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
          }
          
          .quantity-btn {
            width: 36px !important;
            height: 36px !important;
            border-radius: 50% !important;
            padding: 0 !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            border: 2px solid #dc3545 !important;
            background: white !important;
            color: #dc3545 !important;
          }
          
          .quantity-btn:hover {
            background: #dc3545 !important;
            color: white !important;
          }
          
          .quantity-btn:disabled {
            border-color: #dee2e6 !important;
            color: #6c757d !important;
            background: #f8f9fa !important;
          }
          
          .mobile-summary {
            background: #f8f9fa;
            border-radius: 8px;
            padding: 15px;
            margin-top: 15px;
            border: 1px solid #e9ecef;
          }
          
          .delivery-option-mobile {
            border: 2px solid #e9ecef !important;
            border-radius: 8px !important;
            margin-bottom: 12px !important;
            transition: all 0.2s ease !important;
          }
          
          .delivery-option-mobile.selected {
            border-color: #dc3545 !important;
            background-color: #fff5f5 !important;
          }
          
          .delivery-option-mobile .card-body {
            padding: 12px !important;
          }
          
          .payment-method-mobile {
            padding: 12px !important;
            border: 1px solid #e9ecef !important;
            border-radius: 6px !important;
            margin-bottom: 8px !important;
          }
          
          .confirmation-section {
            background: #f8f9fa;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 15px;
            border: 1px solid #e9ecef;
          }
        }
        
        @media (max-width: 576px) {
          .shopping-cart-modal .modal-header h5 {
            font-size: 1.1rem !important;
          }
          
          .shopping-cart-modal .btn {
            padding: 10px 16px !important;
            font-size: 0.9rem !important;
          }
          
          .cart-item-mobile {
            padding: 10px !important;
          }
          
          .mobile-summary {
            padding: 12px !important;
          }
          
          .quantity-controls {
            gap: 8px !important;
          }
        }
      `}</style>

      <div
        className="modal d-block shopping-cart-modal"
        tabIndex={-1}
        style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      >
        <div
          className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable"
          style={{ maxWidth: "95%" }}
        >
          <div className="modal-content border-0">
            <div className="modal-header bg-danger text-white">
              <h5 className="modal-title">{getStepTitle()}</h5>
              {step !== "auth" && (
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={onClose}
                  aria-label="Close"
                />
              )}
            </div>

            <div className="modal-body">
              {/* PASO 1 y 2: Carrito */}
              {step === "cart" && (
                <>
                  {items.length === 0 ? (
                    <div className="text-center py-5">
                      <div className="mb-4">
                        <FaShoppingCart size={60} className="text-muted" />
                      </div>
                      <h4>Tu carrito está vacío</h4>
                      <p className="text-muted">
                        Agrega productos a tu carrito para continuar
                      </p>
                      <button
                        type="button"
                        className="btn btn-danger mt-3"
                        onClick={onClose}
                      >
                        Explorar productos
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <h6 className="mb-0">Productos ({items.length})</h6>
                        <div className="form-check form-switch">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="showTaxBreakdown"
                            checked={showTaxBreakdown}
                            onChange={() => setShowTaxBreakdown((prev) => !prev)}
                          />
                          <label
                            className="form-check-label text-muted small"
                            htmlFor="showTaxBreakdown"
                          >
                            IGV
                          </label>
                        </div>
                      </div>

                      {/* Vista móvil: Lista de productos */}
                      <div className="d-block d-md-none">
                        {items.map((item) => (
                          <div key={item.name} className="cart-item-mobile">
                            <div className="d-flex align-items-start">
                              <div className="cart-item-image me-3">
                                <img
                                  src={item.imgUrl}
                                  alt={item.name}
                                  style={{ 
                                    width: "100%", 
                                    height: "100%", 
                                    objectFit: "cover",
                                    borderRadius: "6px"
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
                              <div className="flex-grow-1">
                                <div className="d-flex justify-content-between align-items-start mb-2">
                                  <div className="flex-grow-1 me-2">
                                    <h6 className="mb-1 fw-bold">{item.name}</h6>
                                    <p className="text-muted small mb-2 text-truncate" style={{ maxWidth: "200px" }}>
                                      {item.text}
                                    </p>
                                  </div>
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-outline-danger"
                                    onClick={() => onRemoveItem(item.name)}
                                    style={{ minWidth: "32px", padding: "4px 8px" }}
                                  >
                                    <FaTrash size={12} />
                                  </button>
                                </div>
                                
                                <div className="d-flex justify-content-between align-items-center">
                                  <div className="quantity-controls">
                                    <button
                                      type="button"
                                      className="quantity-btn"
                                      onClick={() =>
                                        onUpdateQuantity(
                                          item.name,
                                          Math.max(1, item.quantity - 1)
                                        )
                                      }
                                      disabled={item.quantity <= 1}
                                    >
                                      <FaMinus size={12} />
                                    </button>
                                    <span className="fw-bold fs-6">{item.quantity}</span>
                                    <button
                                      type="button"
                                      className="quantity-btn"
                                      onClick={() =>
                                        onUpdateQuantity(
                                          item.name,
                                          item.quantity + 1
                                        )
                                      }
                                    >
                                      <FaPlus size={12} />
                                    </button>
                                  </div>
                                  
                                  <div className="text-end">
                                    <div className="small text-muted">S/ {item.price.toFixed(2)} c/u</div>
                                    <div className="fw-bold text-danger">
                                      S/ {(item.price * item.quantity).toFixed(2)}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Vista desktop: Tabla */}
                      <div className="d-none d-md-block">
                        <div className="table-responsive">
                          <table className="table align-middle table-hover">
                            <thead className="table-light">
                              <tr>
                                <th scope="col" style={{ width: "40%" }}>Producto</th>
                                <th scope="col" className="text-center">Cantidad</th>
                                <th scope="col" className="text-end">Precio</th>
                                {showTaxBreakdown && <th scope="col" className="text-end">Base</th>}
                                {showTaxBreakdown && <th scope="col" className="text-end">IGV (18%)</th>}
                                <th scope="col" className="text-end">Subtotal</th>
                                <th scope="col" className="text-center" style={{ width: "80px" }} />
                              </tr>
                            </thead>
                            <tbody>
                              {items.map((item) => (
                                <tr key={item.name}>
                                  <td>
                                    <div className="d-flex align-items-center">
                                      <div 
                                        style={{
                                          width: "70px",
                                          height: "70px",
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
                                          src={item.imgUrl}
                                          alt={item.name}
                                          style={{
                                            width: "100%",
                                            height: "100%",
                                            objectFit: "cover",
                                            borderRadius: "4px",
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
                                      <div>
                                        <h6 className="mb-0">{item.name}</h6>
                                        <small
                                          className="text-muted d-block text-truncate"
                                          style={{ maxWidth: "300px" }}
                                        >
                                          {item.text}
                                        </small>
                                      </div>
                                    </div>
                                  </td>
                                  <td>
                                    <div className="d-flex justify-content-center align-items-center">
                                      <button
                                        type="button"
                                        className="btn btn-sm btn-outline-secondary"
                                        onClick={() =>
                                          onUpdateQuantity(
                                            item.name,
                                            Math.max(1, item.quantity - 1)
                                          )
                                        }
                                        disabled={item.quantity <= 1}
                                      >
                                        <FaMinus size={12} />
                                      </button>
                                      <span className="mx-2">{item.quantity}</span>
                                      <button
                                        type="button"
                                        className="btn btn-sm btn-outline-secondary"
                                        onClick={() =>
                                          onUpdateQuantity(
                                            item.name,
                                            item.quantity + 1
                                          )
                                        }
                                      >
                                        <FaPlus size={12} />
                                      </button>
                                    </div>
                                  </td>
                                  <td className="text-end">S/ {item.price.toFixed(2)}</td>
                                  {showTaxBreakdown && (
                                    <td className="text-end text-muted">
                                      S/ {calcularPrecioBase(item.price).toFixed(2)}
                                    </td>
                                  )}
                                  {showTaxBreakdown && (
                                    <td className="text-end text-muted">
                                      S/ {calcularIGV(item.price).toFixed(2)}
                                    </td>
                                  )}
                                  <td className="text-end fw-bold">
                                    S/ {(item.price * item.quantity).toFixed(2)}
                                  </td>
                                  <td className="text-center">
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-outline-danger"
                                      onClick={() => onRemoveItem(item.name)}
                                      title="Eliminar producto"
                                    >
                                      <FaTrash />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Resumen del pedido */}
                      <div className="mobile-summary">
                        <h6 className="fw-bold mb-3">Resumen del pedido</h6>
                        <div className="d-flex justify-content-between mb-2">
                          <span>Subtotal:</span>
                          <span>S/ {subtotal.toFixed(2)}</span>
                        </div>

                        {showTaxBreakdown && (
                          <>
                            <div className="d-flex justify-content-between mb-2 text-muted small">
                              <span>Base imponible:</span>
                              <span>S/ {subtotalBase.toFixed(2)}</span>
                            </div>
                            <div className="d-flex justify-content-between mb-2 text-muted small">
                              <span>IGV (18%):</span>
                              <span>S/ {totalIGV.toFixed(2)}</span>
                            </div>
                          </>
                        )}

                        <div className="d-flex justify-content-between mb-2">
                          <span>Envío:</span>
                          <span>S/ {shippingCost.toFixed(2)}</span>
                        </div>
                        <hr />
                        <div className="d-flex justify-content-between fw-bold fs-6">
                          <span>Total:</span>
                          <span className="text-danger">S/ {total.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* PASO 3: Autenticación */}
              {step === "auth" && (
                <div className="p-0">
                  {isLoginForm ? (
                    <LoginForm
                      onLogin={(userData) => {
                        onLogin(userData);
                        setStep("checkout");
                      }}
                      onClose={onClose}
                      onSwitchToRegister={() => setIsLoginForm(false)}
                    />
                  ) : (
                    <RegisterForm
                      onRegister={(userData) => {
                        onRegister(userData);
                        setStep("checkout");
                      }}
                      onClose={onClose}
                      onSwitchToLogin={() => setIsLoginForm(true)}
                    />
                  )}
                </div>
              )}

              {/* PASO 4: Checkout */}
              {step === "checkout" && (
                <div>
                  <h6 className="fw-bold mb-3">Método de entrega</h6>

                  <div className="mb-4">
                    {/* Envío a domicilio */}
                    <div
                      className={`card delivery-option-mobile ${
                        shippingInfo.address !== "RECOJO EN TIENDA" ? "selected" : ""
                      }`}
                      onClick={() => {
                        if (user) {
                          setShippingInfo({
                            name: `${user.name} ${user.surname || ""}`,
                            address: user.address || "",
                            city: user.district || "",
                            phone: user.phoneNumber || "",
                            email: user.email || "",
                          });
                        }
                      }}
                      style={{ cursor: "pointer" }}
                    >
                      <div className="card-body">
                        <div className="d-flex justify-content-between align-items-center">
                          <div className="d-flex align-items-center">
                            <input
                              className="form-check-input me-3"
                              type="radio"
                              name="deliveryMethod"
                              checked={shippingInfo.address !== "RECOJO EN TIENDA"}
                              onChange={() => {}}
                            />
                            <div>
                              <p className="fw-bold mb-1">Envío a domicilio</p>
                              <p className="text-muted mb-0 small">Entrega en 24-48 horas</p>
                            </div>
                          </div>
                          <span className="badge bg-danger">S/ 15.00</span>
                        </div>

                        {shippingInfo.address !== "RECOJO EN TIENDA" && (
                          <div className="mt-3 p-3 bg-light rounded">
                            <h6 className="fw-semibold mb-2 small">Datos de envío</h6>
                            <div className="small">
                              <p className="mb-1"><strong>Nombre:</strong> {shippingInfo.name}</p>
                              <p className="mb-1"><strong>Dirección:</strong> {shippingInfo.address}</p>
                              <p className="mb-1"><strong>Distrito:</strong> {shippingInfo.city}</p>
                              <p className="mb-1"><strong>Teléfono:</strong> {shippingInfo.phone}</p>
                              <p className="mb-0"><strong>Email:</strong> {shippingInfo.email}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Recojo en tienda */}
                    <div
                      className={`card delivery-option-mobile ${
                        shippingInfo.address === "RECOJO EN TIENDA" ? "selected" : ""
                      }`}
                      onClick={() => {
                        if (user) {
                          setShippingInfo({
                            name: `${user.name} ${user.surname || ""}`,
                            address: "RECOJO EN TIENDA",
                            city: "Lima",
                            phone: user.phoneNumber || "",
                            email: user.email || "",
                          });
                        }
                      }}
                      style={{ cursor: "pointer" }}
                    >
                      <div className="card-body">
                        <div className="d-flex justify-content-between align-items-center">
                          <div className="d-flex align-items-center">
                            <input
                              className="form-check-input me-3"
                              type="radio"
                              name="deliveryMethod"
                              checked={shippingInfo.address === "RECOJO EN TIENDA"}
                              onChange={() => {}}
                            />
                            <div>
                              <p className="fw-bold mb-1">Recojo en tienda</p>
                              <p className="text-muted mb-0 small">Disponible el mismo día</p>
                            </div>
                          </div>
                          <span className="badge bg-success">GRATIS</span>
                        </div>

                        {shippingInfo.address === "RECOJO EN TIENDA" && (
                          <div className="mt-3 p-3 bg-light rounded">
                            <h6 className="fw-semibold mb-2 small">Nuestra tienda</h6>
                            <div className="small">
                              <p className="fw-bold mb-1">María Almenara - Sede Principal</p>
                              <p className="mb-1">Av. Primavera 120, San Borja</p>
                              <p className="mb-0 text-muted">Horario: Lun-Dom 8:00 am - 9:00 pm</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Resumen en checkout */}
                  <div className="mobile-summary">
                    <h6 className="fw-bold mb-3">Resumen del pedido</h6>
                    <div className="d-flex justify-content-between mb-2">
                      <span>Subtotal ({items.length} productos):</span>
                      <span>S/ {subtotal.toFixed(2)}</span>
                    </div>

                    {shippingInfo.address !== "RECOJO EN TIENDA" ? (
                      <div className="d-flex justify-content-between mb-2">
                        <span>Envío:</span>
                        <span>S/ {shippingCost.toFixed(2)}</span>
                      </div>
                    ) : (
                      <div className="d-flex justify-content-between mb-2">
                        <span>Envío:</span>
                        <span className="text-success">GRATIS</span>
                      </div>
                    )}

                    <hr />
                    <div className="d-flex justify-content-between fw-bold">
                      <span>Total:</span>
                      <span className="text-danger">
                        S/ {(subtotal + (shippingInfo.address !== "RECOJO EN TIENDA" ? shippingCost : 0)).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* PASO 5: Confirmación */}
              {step === "confirmation" && (
                <div>
                  <div className="alert alert-info">
                    <h6 className="fw-bold">¡Un paso más!</h6>
                    <p className="mb-0 small">
                      Para finalizar tu compra, revisa los detalles y confirma tu pedido.
                    </p>
                  </div>

                  {/* Información de entrega */}
                  <div className="confirmation-section">
                    <h6 className="fw-bold mb-3">Información de entrega</h6>
                    <div className="small">
                      <p className="mb-1"><strong>Nombre:</strong> {shippingInfo.name}</p>
                      <p className="mb-1"><strong>Dirección:</strong> {shippingInfo.address}</p>
                      <p className="mb-1"><strong>Ciudad/Distrito:</strong> {shippingInfo.city}</p>
                      {shippingInfo.address !== "RECOJO EN TIENDA" && (
                        <p className="mb-1"><strong>Teléfono:</strong> {shippingInfo.phone}</p>
                      )}
                      <p className="mb-0"><strong>Email:</strong> {shippingInfo.email}</p>
                    </div>
                  </div>

                  {/* Método de pago */}
                  <div className="confirmation-section">
                    <h6 className="fw-bold mb-3">Método de pago</h6>
                    {paymentMethods.map((method) => (
                      <div className="payment-method-mobile" key={method.value}>
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="radio"
                            name="paymentMethod"
                            id={method.value}
                            value={method.value}
                            checked={paymentMethod === method.value}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                          />
                          <label className="form-check-label small" htmlFor={method.value}>
                            {method.label}
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Resumen final */}
                  <div className="mobile-summary">
                    <h6 className="fw-bold mb-3">Resumen del pedido</h6>
                    <div className="d-flex justify-content-between mb-2">
                      <span>Subtotal ({items.length} productos):</span>
                      <span>S/ {subtotal.toFixed(2)}</span>
                    </div>

                    {shippingInfo.address !== "RECOJO EN TIENDA" ? (
                      <div className="d-flex justify-content-between mb-2">
                        <span>Envío:</span>
                        <span>S/ {shippingCost.toFixed(2)}</span>
                      </div>
                    ) : (
                      <div className="d-flex justify-content-between mb-2">
                        <span>Envío:</span>
                        <span className="text-success">GRATIS</span>
                      </div>
                    )}

                    <hr />
                    <div className="d-flex justify-content-between fw-bold">
                      <span>Total a pagar:</span>
                      <span className="text-danger">S/ {total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* PASO 6: Completado */}
              {step === "complete" && (
                <div className="text-center py-4">
                  <div className="mb-4">
                    <div
                      className="bg-success text-white rounded-circle d-flex align-items-center justify-content-center mx-auto"
                      style={{ width: "80px", height: "80px" }}
                    >
                      ✓
                    </div>
                  </div>
                  <h3 className="mb-3">¡Pedido Realizado con Éxito!</h3>
                  <p className="mb-4">
                    Pronto recibirás una confirmación del estado de tu{" "}
                    {shippingInfo.address === "RECOJO EN TIENDA" ? "pedido" : "envío"}.
                  </p>
                </div>
              )}
            </div>

            {step !== "auth" && step !== "complete" && (
              <div className="modal-footer d-flex gap-2">
                {renderActionButtons()}
              </div>
            )}

            {step === "complete" && (
              <div className="modal-footer justify-content-center">
                {renderActionButtons()}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ShoppingCart;