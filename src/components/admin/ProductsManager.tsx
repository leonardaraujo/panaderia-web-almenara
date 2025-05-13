import React, { useState } from "react";
import {
	FaEdit,
	FaEye,
	FaFilter,
	FaPlus,
	FaSearch,
	FaTrash,
} from "react-icons/fa";
import productos from "../../data/products";

// Definimos interfaces para los productos
interface Producto {
	name: string;
	img: string;
	text: string;
	price: number;
	category: string;
}

interface ProductsManagerProps {
	onAddProduct?: () => void;
}

const ProductsManager: React.FC<ProductsManagerProps> = ({ onAddProduct }) => {
	// Estado para categoría seleccionada
	const [categoriaSeleccionada, setCategoriaSeleccionada] =
		useState<string>("todos");

	// Estado para búsqueda
	const [searchTerm, setSearchTerm] = useState<string>("");

	// Estado para producto seleccionado para ver detalles
	const [selectedProduct, setSelectedProduct] = useState<Producto | null>(null);

	// Estado para producto en edición
	const [editingProduct, setEditingProduct] = useState<Producto | null>(null);

	// Creamos una lista plana de todos los productos
	const todosLosProductos: Producto[] = Object.entries(
		productos.categorias,
	).flatMap(([category, items]) =>
		items.map((item) => ({
			...item,
			category,
		})),
	);

	// Filtramos los productos según la categoría seleccionada y el término de búsqueda
	const filteredProducts = todosLosProductos.filter((producto) => {
		// Filtrar por categoría
		const categoryFilter =
			categoriaSeleccionada === "todos" ||
			producto.category === categoriaSeleccionada;

		// Filtrar por término de búsqueda
		const searchFilter =
			searchTerm === "" ||
			producto.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
			producto.text.toLowerCase().includes(searchTerm.toLowerCase());

		return categoryFilter && searchFilter;
	});

	// Función para eliminar un producto
	const handleDeleteProduct = (name: string) => {
		if (window.confirm("¿Estás seguro de que deseas eliminar este producto?")) {
			// Aquí iría la lógica para eliminar el producto
			// Por ahora solo mostramos un mensaje
			alert(`Producto ${name} eliminado`);

			// Si estamos viendo el producto que se eliminó, cerrar el modal
			if (selectedProduct && selectedProduct.name === name) {
				setSelectedProduct(null);
			}
		}
	};

	// Vista detallada de un producto
	const renderProductDetailView = () => {
		if (!selectedProduct) return null;

		return (
			<div>
				<div className="d-flex justify-content-between align-items-center mb-4">
					<div>
						<h4 className="mb-1">{selectedProduct.name}</h4>
						<div className="d-flex align-items-center">
							<span className="badge bg-info me-2">
								{selectedProduct.category}
							</span>
							<span className="text-muted">
								S/ {selectedProduct.price.toFixed(2)}
							</span>
						</div>
					</div>
					<button
						className="btn btn-sm btn-outline-primary"
						onClick={() => setSelectedProduct(null)}
					>
						Volver a la lista
					</button>
				</div>

				<div className="row">
					<div className="col-md-4 mb-4">
						<img
							src={selectedProduct.img}
							alt={selectedProduct.name}
							className="img-fluid rounded"
							style={{ maxHeight: "300px", objectFit: "cover" }}
							onError={(e) => {
								const target = e.target as HTMLImageElement;
								target.src =
									"https://via.placeholder.com/300x300?text=Imagen+No+Disponible";
							}}
						/>
					</div>
					<div className="col-md-8 mb-4">
						<div className="card h-100">
							<div className="card-header">
								<h5 className="mb-0">Información del Producto</h5>
							</div>
							<div className="card-body">
								<p className="mb-3">{selectedProduct.text}</p>
								<p className="mb-1">
									<strong>Categoría:</strong> {selectedProduct.category}
								</p>
								<p className="mb-3 fs-5 fw-bold">
									<strong>Precio:</strong> S/ {selectedProduct.price.toFixed(2)}
								</p>

								<div className="d-flex gap-2 mt-4">
									<button
										className="btn btn-primary"
										onClick={() => setEditingProduct(selectedProduct)}
									>
										<FaEdit className="me-2" /> Editar producto
									</button>
									<button
										className="btn btn-danger"
										onClick={() => handleDeleteProduct(selectedProduct.name)}
									>
										<FaTrash className="me-2" /> Eliminar producto
									</button>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		);
	};

	// Modal para editar un producto
	const renderEditProductModal = () => {
		if (!editingProduct) return null;

		// Aquí iría un formulario para editar el producto
		// Por simplicidad, no lo implementaremos completamente
		return (
			<div
				className="modal d-block"
				tabIndex={-1}
				style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
			>
				<div className="modal-dialog modal-lg modal-dialog-centered">
					<div className="modal-content">
						<div className="modal-header">
							<h5 className="modal-title">
								{editingProduct.name ? "Editar Producto" : "Nuevo Producto"}
							</h5>
							<button
								type="button"
								className="btn-close"
								onClick={() => setEditingProduct(null)}
							></button>
						</div>
						<div className="modal-body">
							<div className="mb-3">
								<label htmlFor="productName" className="form-label">
									Nombre del producto
								</label>
								<input
									type="text"
									className="form-control"
									id="productName"
									defaultValue={editingProduct.name}
								/>
							</div>
							<div className="mb-3">
								<label htmlFor="productDescription" className="form-label">
									Descripción
								</label>
								<textarea
									className="form-control"
									id="productDescription"
									rows={3}
									defaultValue={editingProduct.text}
								></textarea>
							</div>
							<div className="row mb-3">
								<div className="col-md-6">
									<label htmlFor="productPrice" className="form-label">
										Precio (S/)
									</label>
									<input
										type="number"
										className="form-control"
										id="productPrice"
										step="0.01"
										defaultValue={editingProduct.price}
									/>
								</div>
								<div className="col-md-6">
									<label htmlFor="productCategory" className="form-label">
										Categoría
									</label>
									<select
										className="form-select"
										id="productCategory"
										defaultValue={editingProduct.category}
									>
										<option value="birthday">Cumpleaños</option>
										<option value="catering">Catering</option>
										<option value="tortas">Tortas</option>
										<option value="box_regalos">Cajas Regalo</option>
									</select>
								</div>
							</div>
							<div className="mb-3">
								<label htmlFor="productImage" className="form-label">
									URL de la imagen
								</label>
								<input
									type="text"
									className="form-control"
									id="productImage"
									defaultValue={editingProduct.img}
								/>
								{editingProduct.img && (
									<img
										src={editingProduct.img}
										alt="Vista previa"
										className="mt-2 img-thumbnail"
										style={{ height: "100px" }}
										onError={(e) => {
											const target = e.target as HTMLImageElement;
											target.src =
												"https://via.placeholder.com/100x100?text=Imagen+No+Disponible";
										}}
									/>
								)}
							</div>
						</div>
						<div className="modal-footer">
							<button
								type="button"
								className="btn btn-secondary"
								onClick={() => setEditingProduct(null)}
							>
								Cancelar
							</button>
							<button
								type="button"
								className="btn btn-primary"
								onClick={() => {
									alert("Cambios guardados (simulación)");
									setEditingProduct(null);
								}}
							>
								Guardar cambios
							</button>
						</div>
					</div>
				</div>
			</div>
		);
	};

	// Vista principal de lista de productos
	const renderProductsListView = () => (
		<>
			<div className="row mb-4 align-items-center">
				<div className="col-md-6">
					<h4 className="mb-0">Gestión de Productos</h4>
					<p className="text-muted">
						Total: {filteredProducts.length} productos
					</p>
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
								placeholder="Buscar producto..."
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
								{categoriaSeleccionada === "todos"
									? "Todas las categorías"
									: categoriaSeleccionada === "birthday"
										? "Cumpleaños"
										: categoriaSeleccionada === "catering"
											? "Catering"
											: categoriaSeleccionada === "tortas"
												? "Tortas"
												: "Cajas Regalo"}
							</button>
							<ul className="dropdown-menu">
								<li>
									<button
										className="dropdown-item"
										onClick={() => setCategoriaSeleccionada("todos")}
									>
										Todas las categorías
									</button>
								</li>
								<li>
									<button
										className="dropdown-item"
										onClick={() => setCategoriaSeleccionada("birthday")}
									>
										Cumpleaños
									</button>
								</li>
								<li>
									<button
										className="dropdown-item"
										onClick={() => setCategoriaSeleccionada("catering")}
									>
										Catering
									</button>
								</li>
								<li>
									<button
										className="dropdown-item"
										onClick={() => setCategoriaSeleccionada("tortas")}
									>
										Tortas
									</button>
								</li>
								<li>
									<button
										className="dropdown-item"
										onClick={() => setCategoriaSeleccionada("box_regalos")}
									>
										Cajas Regalo
									</button>
								</li>
							</ul>
						</div>
						<button
							className="btn btn-primary"
							onClick={() => {
								setEditingProduct({
									name: "",
									img: "",
									text: "",
									price: 0,
									category: "tortas",
								});
								if (onAddProduct) onAddProduct();
							}}
						>
							<FaPlus className="me-1" /> Nuevo producto
						</button>
					</div>
				</div>
			</div>

			{filteredProducts.length === 0 ? (
				<div className="alert alert-info">
					No se encontraron productos con los criterios seleccionados.
				</div>
			) : (
				<div className="table-responsive">
					<table className="table table-hover align-middle">
						<thead className="table-light">
							<tr>
								<th>Producto</th>
								<th>Categoría</th>
								<th>Precio</th>
								<th className="text-end">Acciones</th>
							</tr>
						</thead>
						<tbody>
							{filteredProducts.map((producto) => (
								<tr key={`${producto.name}-${producto.category}`}>
									<td>
										<div className="d-flex align-items-center">
											<img
												src={producto.img}
												alt={producto.name}
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
											<div>
												<div>{producto.name}</div>
												<small
													className="text-muted text-truncate d-inline-block"
													style={{ maxWidth: "300px" }}
												>
													{producto.text}
												</small>
											</div>
										</div>
									</td>
									<td>
										<span className="badge bg-info">
											{producto.category === "birthday"
												? "Cumpleaños"
												: producto.category === "catering"
													? "Catering"
													: producto.category === "tortas"
														? "Tortas"
														: "Cajas Regalo"}
										</span>
									</td>
									<td>S/ {producto.price.toFixed(2)}</td>
									<td>
										<div className="d-flex gap-2 justify-content-end">
											<button
												className="btn btn-sm btn-outline-primary"
												onClick={() => setSelectedProduct(producto)}
												title="Ver detalles"
											>
												<FaEye />
											</button>
											<button
												className="btn btn-sm btn-outline-secondary"
												onClick={() => setEditingProduct(producto)}
												title="Editar producto"
											>
												<FaEdit />
											</button>
											<button
												className="btn btn-sm btn-outline-danger"
												onClick={() => handleDeleteProduct(producto.name)}
												title="Eliminar producto"
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
			{selectedProduct ? renderProductDetailView() : renderProductsListView()}
			{renderEditProductModal()}
		</>
	);
};

export default ProductsManager;
