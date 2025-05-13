import { useState, useEffect } from "react";
import {
	FaTrash,
	FaMinus,
	FaPlus,
	FaShoppingCart,

} from "react-icons/fa";
import orders from "../data/orders";
import type { Order, ShippingInfo } from "../data/orders";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";

interface Producto {
	name: string;
	img: string;
	text: string;
	price: number;
}

interface CartItem extends Producto {
	quantity: number;
}

interface AuthUser {
	id: string;
	user: string;
	name: string;
}

interface ShoppingCartProps {
	items: CartItem[];
	onClose: () => void;
	onUpdateQuantity: (name: string, newQuantity: number) => void;
	onRemoveItem: (name: string) => void;
	currentUser: AuthUser | null;
	onLogin: (userData: AuthUser) => void;
	onRegister: (userData: AuthUser) => void;
}

const ShoppingCart: React.FC<ShoppingCartProps> = ({
	items,
	onClose,
	onUpdateQuantity,
	onRemoveItem,
	currentUser,
	onLogin,
	onRegister,
}) => {
	// Estado para controlar el flujo según el diagrama
	const [step, setStep] = useState<
		"cart" | "auth" | "checkout" | "confirmation" | "complete"
	>("cart");

	// Estado para mostrar formulario de login/registro
	const [isLoginForm, setIsLoginForm] = useState(true);

	const [shippingInfo, setShippingInfo] = useState<ShippingInfo>({
		name: currentUser?.name || "",
		address: "",
		city: "",
		phone: "",
		email: "",
	});

	// Actualizar datos de envío si el usuario inicia sesión
	useEffect(() => {
		if (currentUser) {
			setShippingInfo((prev) => ({
				...prev,
				name: currentUser.name,
			}));
		}
	}, [currentUser]);

	// Calcular subtotal
	const subtotal = items.reduce(
		(total, item) => total + item.price * item.quantity,
		0,
	);

	// Costo de envío fijo
	const shippingCost = 15.0;

	// Total final
	const total = subtotal + (items.length > 0 ? shippingCost : 0);

	const handleShippingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setShippingInfo((prev) => ({
			...prev,
			[name]: value,
		}));
	};

	const handleSubmitOrder = () => {
		// Crear un nuevo pedido
		const newOrder: Order = {
			id: `ORD-${String(orders.length + 1).padStart(3, "0")}`,
			date: new Date().toISOString(),
			shippingInfo,
			items: items.map((item) => ({
				name: item.name,
				img: item.img,
				price: item.price,
				quantity: item.quantity,
			})),
			subtotal,
			shippingCost,
			total,
			status: "pendiente",
		};

		// Añadir el pedido al array de pedidos
		orders.push(newOrder);

		// Avanzar al paso de confirmación
		setStep("complete");
	};

	// Validar formulario de envío
	const isShippingFormValid = () => {
		return (
			shippingInfo.name !== "" &&
			shippingInfo.address !== "" &&
			shippingInfo.city !== "" &&
			shippingInfo.phone !== "" &&
			shippingInfo.email !== ""
		);
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
				// Si no está logueado, mostrar pantalla de autenticación
				setStep("auth");
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
				return isLoginForm ? "Inicia sesion para proceder" : "Registrarse";
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
			<div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
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
										<div className="table-responsive">
											<table className="table align-middle">
												<thead>
													<tr>
														<th scope="col">Producto</th>
														<th scope="col" className="text-center">
															Cantidad
														</th>
														<th scope="col" className="text-end">
															Precio
														</th>
														<th scope="col" className="text-end">
															Subtotal
														</th>
														<th scope="col" />
													</tr>
												</thead>
												<tbody>
													{items.map((item) => (
														<tr key={item.name}>
															<td>
																<div className="d-flex align-items-center">
																	<img
																		src={item.img}
																		alt={item.name}
																		style={{
																			width: "60px",
																			height: "60px",
																			objectFit: "cover",
																			marginRight: "15px",
																		}}
																		onError={(e) => {
																			const target =
																				e.target as HTMLImageElement;
																			target.src =
																				"https://via.placeholder.com/60?text=Imagen+No+Disponible";
																		}}
																	/>
																	<div>
																		<h6 className="mb-0">{item.name}</h6>
																		<small
																			className="text-muted d-block text-truncate"
																			style={{ maxWidth: "200px" }}
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
																				Math.max(1, item.quantity - 1),
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
																				item.quantity + 1,
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
															<td className="text-end">
																S/ {(item.price * item.quantity).toFixed(2)}
															</td>
															<td className="text-end">
																<button
																	type="button"
																	className="btn btn-sm btn-outline-danger"
																	onClick={() => onRemoveItem(item.name)}
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
												<div className="d-flex justify-content-between mb-2">
													<span>Subtotal:</span>
													<span>S/ {subtotal.toFixed(2)}</span>
												</div>
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
							<div className="p-2">
								<h6 className="fw-bold mb-3">Información de entrega</h6>
								<form>
									<div className="mb-3">
										<label htmlFor="name" className="form-label">
											Nombre completo
										</label>
										<input
											type="text"
											className="form-control"
											id="name"
											name="name"
											value={shippingInfo.name}
											onChange={handleShippingChange}
											required
										/>
									</div>
									<div className="mb-3">
										<label htmlFor="address" className="form-label">
											Dirección
										</label>
										<input
											type="text"
											className="form-control"
											id="address"
											name="address"
											value={shippingInfo.address}
											onChange={handleShippingChange}
											required
										/>
									</div>
									<div className="mb-3">
										<label htmlFor="city" className="form-label">
											Ciudad
										</label>
										<input
											type="text"
											className="form-control"
											id="city"
											name="city"
											value={shippingInfo.city}
											onChange={handleShippingChange}
											required
										/>
									</div>
									<div className="mb-3">
										<label htmlFor="phone" className="form-label">
											Teléfono
										</label>
										<input
											type="tel"
											className="form-control"
											id="phone"
											name="phone"
											value={shippingInfo.phone}
											onChange={handleShippingChange}
											required
										/>
									</div>
									<div className="mb-3">
										<label htmlFor="email" className="form-label">
											Email
										</label>
										<input
											type="email"
											className="form-control"
											id="email"
											name="email"
											value={shippingInfo.email}
											onChange={handleShippingChange}
											required
										/>
									</div>
								</form>

								<div className="card mt-3 border-0 bg-light">
									<div className="card-body">
										<h6 className="fw-bold mb-3">Resumen del pedido</h6>
										<div className="d-flex justify-content-between mb-2">
											<span>Subtotal ({items.length} productos):</span>
											<span>S/ {subtotal.toFixed(2)}</span>
										</div>
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
											<strong>Ciudad:</strong> {shippingInfo.city}
										</p>
										<p className="mb-1">
											<strong>Teléfono:</strong> {shippingInfo.phone}
										</p>
										<p className="mb-1">
											<strong>Email:</strong> {shippingInfo.email}
										</p>
									</div>
								</div>

								<div className="card mb-3 border-0 bg-light">
									<div className="card-body">
										<h6 className="fw-bold mb-3">Productos ({items.length})</h6>
										{items.map((item) => (
											<div
												key={item.name}
												className="d-flex justify-content-between mb-2"
											>
												<span>
													{item.name}{" "}
													<span className="text-muted">x {item.quantity}</span>
												</span>
												<span>
													S/ {(item.price * item.quantity).toFixed(2)}
												</span>
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
										<div className="d-flex justify-content-between mb-2">
											<span>Envío:</span>
											<span>S/ {shippingCost.toFixed(2)}</span>
										</div>
										<hr />
										<div className="d-flex justify-content-between fw-bold">
											<span>Total a pagar:</span>
											<span>S/ {total.toFixed(2)}</span>
										</div>
									</div>
								</div>

								<div className="mt-4">
									<h6 className="fw-bold mb-3">Método de pago</h6>
									<div className="form-check mb-2">
										<input
											className="form-check-input"
											type="radio"
											name="paymentMethod"
											id="creditCard"
											checked
											readOnly
										/>
										<label className="form-check-label" htmlFor="creditCard">
											Tarjeta de crédito/débito
										</label>
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
									Tu número de pedido es:{" "}
									<strong>{`ORD-${String(orders.length).padStart(3, "0")}`}</strong>
								</p>
								<p className="mb-4">
									Te hemos enviado un correo con los detalles de tu compra.
									<br />
									Pronto recibirás una confirmación del estado de tu envío.
								</p>
								<div className="d-grid gap-2 col-6 mx-auto">
									<button
										className="btn btn-outline-secondary"
										onClick={onClose}
									>
										Volver a la tienda
									</button>
								</div>
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
