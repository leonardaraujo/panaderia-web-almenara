import { useState } from "react";
import { FaTrash, FaMinus, FaPlus } from "react-icons/fa";
import orders from "../data/orders";
import type { Order, ShippingInfo } from "../data/orders";

interface Producto {
	name: string;
	img: string;
	text: string;
	price: number;
}

interface CartItem extends Producto {
	quantity: number;
}

interface ShoppingCartProps {
	items: CartItem[];
	onClose: () => void;
	onUpdateQuantity: (name: string, newQuantity: number) => void;
	onRemoveItem: (name: string) => void;
}

const ShoppingCart: React.FC<ShoppingCartProps> = ({
	items,
	onClose,
	onUpdateQuantity,
	onRemoveItem,
}) => {
	const [step, setStep] = useState<"cart" | "shipping" | "payment">("cart");
	const [shippingInfo, setShippingInfo] = useState({
		name: "",
		address: "",
		city: "",
		phone: "",
		email: "",
	});

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
			shippingInfo: shippingInfo as ShippingInfo,
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

		// Mostrar confirmación al usuario
		alert("¡Gracias por tu compra! Tu pedido ha sido procesado.");
		onClose();

		// En una aplicación real, aquí enviaríamos la orden a una API
		console.log("Nuevo pedido creado:", newOrder);
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

	return (
		<div
			className="modal d-block"
			tabIndex={-1}
			style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
		>
			<div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
				<div className="modal-content border-0">
					<div className="modal-header bg-danger text-white">
						<h5 className="modal-title">
							{step === "cart" && "Carrito de Compras"}
							{step === "shipping" && "Información de Envío"}
							{step === "payment" && "Finalizar Compra"}
						</h5>
						<button
							type="button"
							className="btn-close btn-close-white"
							onClick={onClose}
							aria-label="Close"
						/>
					</div>

					<div className="modal-body">
						{step === "cart" &&
							(items.length === 0 ? (
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
										Seguir comprando
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
																		const target = e.target as HTMLImageElement;
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
							))}

						{step === "shipping" && (
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

						{step === "payment" && (
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
					</div>

					<div className="modal-footer">
						{step === "cart" && items.length > 0 && (
							<>
								<button className="btn btn-outline-secondary" onClick={onClose}>
									Seguir comprando
								</button>
								<button
									className="btn btn-danger"
									onClick={() => setStep("shipping")}
								>
									Continuar con el envío
								</button>
							</>
						)}

						{step === "shipping" && (
							<>
								<button
									className="btn btn-outline-secondary"
									onClick={() => setStep("cart")}
								>
									Volver al carrito
								</button>
								<button
									className="btn btn-danger"
									onClick={() => setStep("payment")}
									disabled={!isShippingFormValid()}
								>
									Continuar al pago
								</button>
							</>
						)}

						{step === "payment" && (
							<>
								<button
									className="btn btn-outline-secondary"
									onClick={() => setStep("shipping")}
								>
									Volver
								</button>
								<button className="btn btn-danger" onClick={handleSubmitOrder}>
									Finalizar compra
								</button>
							</>
						)}
					</div>
				</div>
			</div>
		</div>
	);
};

// Componente FaShoppingCart para el carrito vacío
const FaShoppingCart = ({
	size,
	className,
}: { size: number; className: string }) => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width={size}
		height={size}
		fill="currentColor"
		className={className}
		viewBox="0 0 16 16"
	>
		<path d="M0 1.5A.5.5 0 0 1 .5 1H2a.5.5 0 0 1 .485.379L2.89 3H14.5a.5.5 0 0 1 .491.592l-1.5 8A.5.5 0 0 1 13 12H4a.5.5 0 0 1-.491-.408L2.01 3.607 1.61 2H.5a.5.5 0 0 1-.5-.5zM3.102 4l1.313 7h8.17l1.313-7H3.102zM5 12a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm7 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm-7 1a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm7 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2z" />
	</svg>
);

export default ShoppingCart;
