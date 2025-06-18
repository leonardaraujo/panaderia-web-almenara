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
  // Nueva prop para definir el paso inicial
  initialStep?: "cart" | "checkout" | "confirmation" | "complete";
  // Nueva prop para solicitar autenticación
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
  // Acceder al usuario desde el userStore para datos completos
  const { user } = useUserStore();

  // Estado para controlar el flujo según el diagrama
  const [step, setStep] = useState<
    "cart" | "auth" | "checkout" | "confirmation" | "complete"
  >(initialStep);

  // Estado para mostrar formulario de login/registro
  const [isLoginForm, setIsLoginForm] = useState(true);

  // Estado para mostrar desglose de impuestos
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

  // Cuando cambia initialStep, actualizar el estado step
  useEffect(() => {
    setStep(initialStep);
  }, [initialStep]);

  // Bloquear el scroll del body cuando se abre el modal
  useEffect(() => {
    // Guardar el valor original de overflow
    const originalStyle = window.getComputedStyle(document.body).overflow;
    // Bloquear el scroll
    document.body.style.overflow = "hidden";

    // Restaurar el scroll cuando se desmonta el componente
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  // Actualizar datos de envío cuando el usuario de userStore cambia
  useEffect(() => {
    if (user) {
      // Establecer los datos completos del usuario desde el userStore
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

  // Calcular subtotal
  const subtotal = items.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  // Costo de envío fijo
  const shippingCost = 15.0;

  // Total final (ajustado dependiendo del método de envío)
  const total =
    subtotal +
    (items.length > 0 && shippingInfo.address !== "RECOJO EN TIENDA"
      ? shippingCost
      : 0);

  // Calcular subtotal base (sin IGV)
  const subtotalBase = calcularPrecioBase(subtotal);

  // Calcular monto total de IGV
  const totalIGV = calcularIGV(subtotal);

  const handleSubmitOrder = async () => {
    try {
      const finalShippingCost =
        shippingInfo.address === "RECOJO EN TIENDA" ? 0 : shippingCost;
      const finalTotal = subtotal + finalShippingCost;

      // Determinar método de entrega
      const deliveryMethod =
        shippingInfo.address === "RECOJO EN TIENDA"
          ? DeliveryMethod.RECOJO_EN_TIENDA
          : DeliveryMethod.ENVIO_A_DIRECCION;

      // Determinar método de pago usando los enums de la API
      let paymentMethodEnum = PaymentMethod.TARJETA;
      if (paymentMethod === "yape") paymentMethodEnum = PaymentMethod.YAPE;
      if (paymentMethod === "contraentrega")
        paymentMethodEnum = PaymentMethod.CONTRAENTREGA;

      // Construir shippingInfo como texto según método de entrega
      const shippingAddress =
        deliveryMethod === DeliveryMethod.ENVIO_A_DIRECCION
          ? `${shippingInfo.address} - ${shippingInfo.city} - ${shippingInfo.phone} - ${shippingInfo.name}`
          : `RECOJO EN TIENDA - Av. Primavera 120, San Borja - ${shippingInfo.phone} - ${shippingInfo.name}`;

      // Preparar datos de la orden para enviar a la API
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

      // Enviar orden a la API
      const createdOrder = await createOrder(orderData);

      console.log("Orden creada exitosamente:", createdOrder);
      
      // Limpiar el carrito después de crear la orden exitosamente
      onClearCart();

      // Avanzar al paso de confirmación
      setStep("complete");
    } catch (error) {
      console.error("Error al crear la orden:", error);

      // Aquí puedes mostrar un mensaje de error al usuario
      // Por ejemplo, podrías agregar un estado para mostrar errores
      alert("Error al procesar tu pedido. Por favor, inténtalo de nuevo.");
    }
  };
  // Validar formulario de envío - simplificado ya que los datos están en userStore
  const isShippingFormValid = () => {
    // Si es recojo en tienda, solo necesitamos nombre y email
    if (shippingInfo.address === "RECOJO EN TIENDA") {
      return true; // Siempre válido ya que tomamos los datos del usuario
    }

    // Para envío a domicilio, verificamos que haya dirección
    return shippingInfo.address !== "";
  };

  // Manejar acción del botón principal según la lógica del flujo
  const handleMainAction = () => {
    // Si el carrito está vacío, no hacemos nada
    if (items.length === 0) return;

    if (step === "cart") {
      // Paso 3 del diagrama: Verificar si está logueado
      if (currentUser) {
        // Si está logueado, ir directo a checkout
        setStep("checkout");
      } else {
        // Si no está logueado, notificar al componente padre que necesitamos autenticación
        if (onNeedAuth) {
          onNeedAuth();
        } else {
          // Comportamiento anterior si no hay onNeedAuth
          setStep("auth");
        }
      }
    } else if (step === "checkout") {
      // De checkout pasamos a confirmación
      setStep("confirmation");
    } else if (step === "confirmation") {
      // Finalizar la compra
      handleSubmitOrder();
    }
  };

  // Título según el paso actual
  const getStepTitle = () => {
    switch (step) {
      case "cart":
        return "Carrito de Compras";
      case "auth":
        return isLoginForm ? "Inicia sesión para proceder" : "Registrarse";
      case "checkout":
        return "Información de Envío";
      case "confirmation":
        return "Revisar y Confirmar";
      case "complete":
        return "¡Pedido Completado!";
      default:
        return "Carrito de Compras";
    }
  };

  // Botones de acción según el paso actual
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
        // Los botones se manejan en los componentes de Login/Register
        return null;
      case "checkout":
        return (
          <>
            <button
              className="btn btn-outline-secondary"
              onClick={() => setStep("cart")}
            >
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
            <button
              className="btn btn-outline-secondary"
              onClick={() => setStep("checkout")}
            >
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
            {/* PASO 1 y 2: Explorar catálogo (ya hecho) y Carrito */}
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
                    <div className="d-flex justify-content-end mb-3">
                      <div className="form-check form-switch">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="showTaxBreakdown"
                          checked={showTaxBreakdown}
                          onChange={() => setShowTaxBreakdown((prev) => !prev)}
                        />
                        <label
                          className="form-check-label text-muted"
                          htmlFor="showTaxBreakdown"
                        >
                          Mostrar desglose de impuestos
                        </label>
                      </div>
                    </div>

                    <div className="table-responsive">
                      <table className="table align-middle table-hover">
                        <thead className="table-light">
                          <tr>
                            <th scope="col" style={{ width: "40%" }}>
                              Producto
                            </th>
                            <th scope="col" className="text-center">
                              Cantidad
                            </th>
                            <th scope="col" className="text-end">
                              Precio
                            </th>
                            {showTaxBreakdown && (
                              <th scope="col" className="text-end">
                                Base
                              </th>
                            )}
                            {showTaxBreakdown && (
                              <th scope="col" className="text-end">
                                IGV (18%)
                              </th>
                            )}
                            <th scope="col" className="text-end">
                              Subtotal
                            </th>
                            <th
                              scope="col"
                              className="text-center"
                              style={{ width: "80px" }}
                            />
                          </tr>
                        </thead>
                        <tbody>
                          {items.map((item) => (
                            <tr key={item.name}>
                              <td>
                                <div className="d-flex align-items-center">
                                  <img
                                    src={item.imgUrl}
                                    alt={item.name}
                                    style={{
                                      width: "70px",
                                      height: "70px",
                                      objectFit: "cover",
                                      marginRight: "15px",
                                      borderRadius: "4px",
                                    }}
                                    onError={(e) => {
                                      const target =
                                        e.target as HTMLImageElement;
                                      target.src =
                                        "https://via.placeholder.com/70?text=Imagen+No+Disponible";
                                    }}
                                  />
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
                              <td className="text-end">
                                S/ {item.price.toFixed(2)}
                              </td>
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

                    <div className="card mt-3 border-0 bg-light">
                      <div className="card-body">
                        <div className="row">
                          <div className="col-md-8"></div>
                          <div className="col-md-4">
                            <div className="d-flex justify-content-between mb-2">
                              <span>Subtotal:</span>
                              <span>S/ {subtotal.toFixed(2)}</span>
                            </div>

                            {showTaxBreakdown && (
                              <>
                                <div className="d-flex justify-content-between mb-2 text-muted">
                                  <span>Base imponible:</span>
                                  <span>S/ {subtotalBase.toFixed(2)}</span>
                                </div>
                                <div className="d-flex justify-content-between mb-2 text-muted">
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
                            <div className="d-flex justify-content-between fw-bold">
                              <span>Total:</span>
                              <span>S/ {total.toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* PASO 3: Autenticación (si no está logueado) */}
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

            {/* PASO 4: Checkout (información de envío) */}
            {step === "checkout" && (
              <div className="p-3">
                <h5 className="fw-bold mb-3">Método de entrega</h5>

                <div className="mb-4">
                  <div className="d-flex flex-column gap-3">
                    {/* Opción 1: Delivery a dirección */}
                    <div
                      className={`card border ${
                        shippingInfo.address !== "RECOJO EN TIENDA"
                          ? "border-danger"
                          : ""
                      } rounded cursor-pointer`}
                      onClick={() => {
                        // Usar todos los datos completos del usuario desde userStore
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
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="radio"
                            name="deliveryMethod"
                            id="deliveryOption"
                            checked={
                              shippingInfo.address !== "RECOJO EN TIENDA"
                            }
                            onChange={() => {
                              // Usar todos los datos completos del usuario desde userStore
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
                          />
                          <label
                            className="form-check-label w-100"
                            htmlFor="deliveryOption"
                          >
                            <div className="d-flex justify-content-between align-items-center">
                              <div>
                                <p className="fw-bold mb-1">
                                  Envío a domicilio
                                </p>
                                <p className="text-muted mb-0 small">
                                  Entrega en 24-48 horas
                                </p>
                              </div>
                              <span className="badge bg-danger">S/ 15.00</span>
                            </div>
                          </label>
                        </div>

                        {shippingInfo.address !== "RECOJO EN TIENDA" && (
                          <div className="mt-3 p-3 bg-light rounded">
                            <h6 className="fw-semibold mb-2">Datos de envío</h6>
                            <p className="mb-1">
                              <strong>Nombre:</strong> {shippingInfo.name}
                            </p>
                            <p className="mb-1">
                              <strong>Dirección:</strong> {shippingInfo.address}
                            </p>
                            <p className="mb-1">
                              <strong>Distrito:</strong> {shippingInfo.city}
                            </p>
                            <p className="mb-1">
                              <strong>Teléfono:</strong> {shippingInfo.phone}
                            </p>
                            <p className="mb-1">
                              <strong>Email:</strong> {shippingInfo.email}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Opción 2: Recojo en tienda */}
                    <div
                      className={`card border ${
                        shippingInfo.address === "RECOJO EN TIENDA"
                          ? "border-danger"
                          : ""
                      } rounded`}
                      onClick={() => {
                        // Mantener el nombre del usuario y su email, pero cambiar dirección a RECOJO EN TIENDA
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
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="radio"
                            name="deliveryMethod"
                            id="pickupOption"
                            checked={
                              shippingInfo.address === "RECOJO EN TIENDA"
                            }
                            onChange={() => {
                              // Mantener el nombre del usuario y su email, pero cambiar dirección a RECOJO EN TIENDA
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
                          />
                          <label
                            className="form-check-label w-100"
                            htmlFor="pickupOption"
                          >
                            <div className="d-flex justify-content-between align-items-center">
                              <div>
                                <p className="fw-bold mb-1">Recojo en tienda</p>
                                <p className="text-muted mb-0 small">
                                  Disponible el mismo día
                                </p>
                              </div>
                              <span className="badge bg-success">GRATIS</span>
                            </div>
                          </label>
                        </div>

                        {shippingInfo.address === "RECOJO EN TIENDA" && (
                          <div className="mt-3 p-3 bg-light rounded">
                            <h6 className="fw-semibold mb-2">
                              Nuestras tiendas
                            </h6>
                            <div className="mb-3 pb-2 border-bottom">
                              <p className="fw-bold mb-1">
                                María Almenara - Sede Principal
                              </p>
                              <p className="mb-1">
                                Av. Primavera 120, San Borja
                              </p>
                              <p className="mb-1 text-muted small">
                                Horario: Lunes a Domingo 8:00 am - 9:00 pm
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card mt-4 border-0 bg-light">
                  <div className="card-body">
                    <h6 className="fw-bold mb-3">Resumen del pedido</h6>
                    <div className="d-flex justify-content-between mb-2">
                      <span>Subtotal ({items.length} productos):</span>
                      <span>S/ {subtotal.toFixed(2)}</span>
                    </div>

                    <div className="form-check mb-2">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="showTaxBreakdownCheckout"
                        checked={showTaxBreakdown}
                        onChange={() => setShowTaxBreakdown((prev) => !prev)}
                      />
                      <label
                        className="form-check-label text-muted"
                        htmlFor="showTaxBreakdownCheckout"
                      >
                        Mostrar desglose de impuestos
                      </label>
                    </div>

                    {showTaxBreakdown && (
                      <>
                        <div className="d-flex justify-content-between mb-2 text-muted">
                          <span>Base imponible:</span>
                          <span>S/ {subtotalBase.toFixed(2)}</span>
                        </div>
                        <div className="d-flex justify-content-between mb-2 text-muted">
                          <span>IGV (18%):</span>
                          <span>S/ {totalIGV.toFixed(2)}</span>
                        </div>
                      </>
                    )}

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
                      <span>
                        S/{" "}
                        {(
                          subtotal +
                          (shippingInfo.address !== "RECOJO EN TIENDA"
                            ? shippingCost
                            : 0)
                        ).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Mostrar productos del carrito como resumen */}
                <div className="card mt-3 border-0">
                  <div className="card-body">
                    <h6 className="fw-bold mb-3">Productos en tu pedido</h6>
                    {items.map((item, idx) => (
                      <div key={idx} className="d-flex align-items-center mb-2">
                        <img
                          src={item.imgUrl}
                          alt={item.name}
                          style={{
                            width: "40px",
                            height: "40px",
                            objectFit: "cover",
                            marginRight: "10px",
                            borderRadius: "4px",
                          }}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src =
                              "https://via.placeholder.com/40?text=No+Disponible";
                          }}
                        />
                        <div className="flex-grow-1">
                          <div className="d-flex justify-content-between">
                            <span>
                              {item.name}{" "}
                              <small className="text-muted">
                                x{item.quantity}
                              </small>
                            </span>
                            <span className="fw-medium">
                              S/ {(item.price * item.quantity).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* PASO 4: Confirmación del pedido */}
            {step === "confirmation" && (
              <div className="p-2">
                <div className="alert alert-info">
                  <h6 className="fw-bold">¡Un paso más!</h6>
                  <p className="mb-0">
                    Para finalizar tu compra, revisa los detalles y confirma tu
                    pedido.
                  </p>
                </div>

                <div className="row">
                  <div className="col-md-6">
                    <div className="card mb-3 border-0 bg-light">
                      <div className="card-body">
                        <h6 className="fw-bold mb-3">Información de entrega</h6>
                        <p className="mb-1">
                          <strong>Nombre:</strong> {shippingInfo.name}
                        </p>
                        <p className="mb-1">
                          <strong>Dirección:</strong> {shippingInfo.address}
                        </p>
                        <p className="mb-1">
                          <strong>Ciudad/Distrito:</strong> {shippingInfo.city}
                        </p>
                        {shippingInfo.address !== "RECOJO EN TIENDA" && (
                          <p className="mb-1">
                            <strong>Teléfono:</strong> {shippingInfo.phone}
                          </p>
                        )}
                        <p className="mb-1">
                          <strong>Email:</strong> {shippingInfo.email}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4">
                      <h6 className="fw-bold mb-3">Método de pago</h6>
                      <div className="card border-0">
                        <div className="card-body">
                          {paymentMethods.map((method) => (
                            <div className="form-check mb-2" key={method.value}>
                              <input
                                className="form-check-input"
                                type="radio"
                                name="paymentMethod"
                                id={method.value}
                                value={method.value}
                                checked={paymentMethod === method.value}
                                onChange={(e) =>
                                  setPaymentMethod(e.target.value)
                                }
                              />
                              <label
                                className="form-check-label"
                                htmlFor={method.value}
                              >
                                {method.label}
                              </label>
                            </div>
                          ))}
                          <div className="mt-3 bg-light p-3 rounded">
                            <p className="text-muted mb-0 small">
                              Al confirmar tu pedido, se registrará el método de
                              pago seleccionado.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="card mb-3 border-0 bg-light">
                      <div className="card-body">
                        <h6 className="fw-bold mb-3">
                          Productos ({items.length})
                        </h6>
                        {items.map((item, idx) => (
                          <div
                            key={idx}
                            className="d-flex align-items-center mb-3"
                          >
                            <img
                              src={item.imgUrl}
                              alt={item.name}
                              style={{
                                width: "50px",
                                height: "50px",
                                objectFit: "cover",
                                marginRight: "15px",
                                borderRadius: "4px",
                              }}
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src =
                                  "https://via.placeholder.com/50?text=No+Disponible";
                              }}
                            />
                            <div className="flex-grow-1">
                              <div className="d-flex justify-content-between">
                                <div>
                                  <div>{item.name}</div>
                                  <div className="text-muted small">
                                    Cantidad: {item.quantity}
                                  </div>
                                </div>
                                <span className="fw-medium">
                                  S/ {(item.price * item.quantity).toFixed(2)}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="card mt-3 border-0 bg-light">
                      <div className="card-body">
                        <h6 className="fw-bold mb-3">Resumen del pedido</h6>
                        <div className="d-flex justify-content-between mb-2">
                          <span>Subtotal ({items.length} productos):</span>
                          <span>S/ {subtotal.toFixed(2)}</span>
                        </div>

                        <div className="form-check mb-2">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="showTaxBreakdownConfirm"
                            checked={showTaxBreakdown}
                            onChange={() =>
                              setShowTaxBreakdown((prev) => !prev)
                            }
                          />
                          <label
                            className="form-check-label text-muted"
                            htmlFor="showTaxBreakdownConfirm"
                          >
                            Mostrar desglose de impuestos
                          </label>
                        </div>

                        {showTaxBreakdown && (
                          <>
                            <div className="d-flex justify-content-between mb-2 text-muted">
                              <span>Base imponible:</span>
                              <span>S/ {subtotalBase.toFixed(2)}</span>
                            </div>
                            <div className="d-flex justify-content-between mb-2 text-muted">
                              <span>IGV (18%):</span>
                              <span>S/ {totalIGV.toFixed(2)}</span>
                            </div>
                          </>
                        )}

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
                          <span>S/ {total.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* PASO 5: Entrega del pedido (confirmación) */}
            {step === "complete" && (
              <div className="text-center py-4">
                <div className="mb-4">
                  <div
                    className="bg-success text-white rounded-circle d-flex align-items-center justify-content-center mx-auto"
                    style={{ width: "80px", height: "80px" }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="40"
                      height="40"
                      fill="currentColor"
                      viewBox="0 0 16 16"
                    >
                      <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z" />
                    </svg>
                  </div>
                </div>
                <h3 className="mb-3">¡Pedido Realizado con Éxito!</h3>
                <p className="mb-4">
                  <br />
                  Pronto recibirás una confirmación del estado de tu{" "}
                  {shippingInfo.address === "RECOJO EN TIENDA"
                    ? "pedido"
                    : "envío"}
                  .
                </p>
              </div>
            )}
          </div>

          {step !== "auth" && step !== "complete" && (
            <div className="modal-footer">{renderActionButtons()}</div>
          )}

          {step === "complete" && (
            <div className="modal-footer justify-content-center">
              {renderActionButtons()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShoppingCart;