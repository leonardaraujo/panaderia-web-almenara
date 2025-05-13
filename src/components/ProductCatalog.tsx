import React, { useState, useEffect } from "react";
import productos from "../data/products";
import productsApi from "../api/products.api";

// Definición de la interfaz para los productos locales
interface Producto {
	name: string;
	img: string;
	text: string;
	price: number;
}

interface ProductCatalogProps {
	onAddToCart: (producto: Producto) => void;
	// Configuración opcional para mostrar/ocultar pestañas específicas
	config?: {
		showCategories?: number[];
	};
}

// Mapeo de categorías del frontend a IDs del backend
const CATEGORY_MAPPING: Record<string, number> = {
	todos: 0, // "todos" es un caso especial, no tiene ID
	birthday: 1, // Cumpleaños
	catering: 2, // Catering
	tortas: 3, // Tortas
	minitortas: 4, // Minitortas
	decoracion: 5, // Decoración
	box_regalos: 6, // Boxes regalo
	cookies: 7, // Cookies
	porciones: 8, // Porciones
	kekes: 9, // Kekes y galletas
	helados: 10, // Helados
};

// Categorías disponibles (nombre visible y clave)
const AVAILABLE_CATEGORIES = [
	{ key: "todos", name: "Todos" },
	{ key: "birthday", name: "Cumpleaños" },
	{ key: "catering", name: "Catering" },
	{ key: "tortas", name: "Tortas" },
	{ key: "box_regalos", name: "Cajas Regalo" },
];

const ProductCatalog: React.FC<ProductCatalogProps> = ({
	onAddToCart,
	config,
}) => {
	// Estado para la categoría seleccionada (incluye "todos" como opción)
	const [categoriaSeleccionada, setCategoriaSeleccionada] =
		useState<string>("todos");

	// Estado para seguir qué productos se añadieron recientemente
	const [addedProducts, setAddedProducts] = useState<Record<string, boolean>>(
		{},
	);

	// Estados para productos de la API
	const [apiProducts, setApiProducts] = useState<Producto[]>([]);
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [error, setError] = useState<string | null>(null);
	const [currentPage, setCurrentPage] = useState<number>(1);
	const [totalPages, setTotalPages] = useState<number>(1);

	// Determinar qué categorías mostrar
	const visibleCategories = config?.showCategories
		? AVAILABLE_CATEGORIES.filter(
				(cat) =>
					cat.key === "todos" ||
					config.showCategories?.includes(CATEGORY_MAPPING[cat.key]),
			)
		: AVAILABLE_CATEGORIES;

	// Cargar productos desde la API cuando cambia la categoría o la página
	useEffect(() => {
		const fetchProducts = async () => {
			setIsLoading(true);
			setError(null);
			try {
				let response;

				if (categoriaSeleccionada === "todos") {
					// Obtener todos los productos
					response = await productsApi.getProducts({
						page: currentPage,
						limit: 12,
					});
				} else {
					// Obtener productos por categoría
					const categoryId = CATEGORY_MAPPING[categoriaSeleccionada];
					if (!categoryId) {
						throw new Error(`Categoría no válida: ${categoriaSeleccionada}`);
					}

					response = await productsApi.getProductsByCategory(categoryId, {
						page: currentPage,
						limit: 12,
					});
				}

				// Convertir productos de la API al formato usado en la aplicación
				const formattedProducts = response.products.map((apiProduct) => ({
					name: apiProduct.name,
					img: apiProduct.img,
					text: apiProduct.description,
					price: parseFloat(apiProduct.price),
				}));

				setApiProducts(formattedProducts);
				setTotalPages(response.pagination.totalPages);
			} catch (err) {
				console.error("Error al cargar productos:", err);
				setError(
					"No se pudieron cargar los productos. Por favor, intente de nuevo más tarde.",
				);
				// Usar los productos locales como fallback si están disponibles
				if (categoriaSeleccionada !== "todos") {
					const localProducts =
						productos.categorias[
							categoriaSeleccionada as keyof typeof productos.categorias
						] || [];
					setApiProducts(localProducts);
				} else {
					setApiProducts([]);
				}
			} finally {
				setIsLoading(false);
			}
		};

		fetchProducts();
	}, [categoriaSeleccionada, currentPage]);

	// Función para manejar la adición de productos al carrito con animación
	const handleAddToCart = (producto: Producto) => {
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

		// Llamar a la función callback proporcionada por el padre
		onAddToCart(producto);
	};

	// Funciones para la paginación
	const handleNextPage = () => {
		if (currentPage < totalPages) {
			setCurrentPage(currentPage + 1);
		}
	};

	const handlePreviousPage = () => {
		if (currentPage > 1) {
			setCurrentPage(currentPage - 1);
		}
	};

	// Componente de esqueleto para usar durante la carga
	const ProductSkeleton = () => (
		<div className="col-md-4 mb-4">
			<div className="card h-100">
				<div className="bg-light placeholder-glow" style={{ height: "200px" }}>
					<span className="placeholder col-12 h-100"></span>
				</div>
				<div className="card-body d-flex flex-column">
					<h5 className="card-title placeholder-glow">
						<span className="placeholder col-6"></span>
					</h5>
					<p className="card-text placeholder-glow flex-grow-1">
						<span className="placeholder col-12"></span>
						<span className="placeholder col-10"></span>
						<span className="placeholder col-8"></span>
					</p>
					<div className="d-flex justify-content-between align-items-center mt-3">
						<h5 className="m-0 placeholder-glow">
							<span className="placeholder col-8"></span>
						</h5>
						<span
							className="placeholder col-4 bg-secondary"
							style={{ height: "38px", borderRadius: "0.375rem" }}
						></span>
					</div>
				</div>
			</div>
		</div>
	);

	return (
		<div id="catalogo" className="container mt-5">
			<h2 className="mb-4 text-center">Catálogo de Productos</h2>

			<div className="d-flex justify-content-center mb-4">
				<div className="btn-group" role="group">
					{visibleCategories.map((categoria) => (
						<button
							key={categoria.key}
							className={`btn ${
								categoriaSeleccionada === categoria.key
									? "btn-danger"
									: "btn-outline-danger"
							}`}
							onClick={() => {
								setCategoriaSeleccionada(categoria.key);
								setCurrentPage(1); // Resetear a la primera página al cambiar categoría
							}}
						>
							{categoria.name}
						</button>
					))}
				</div>
			</div>

			{/* Mensaje de error si falla la carga desde la API */}
			{error && (
				<div className="alert alert-warning mb-4" role="alert">
					{error}
				</div>
			)}

			{/* Contenedor principal de productos - se mantiene con la misma altura durante la carga */}
			<div className="productos-container" style={{ minHeight: "800px" }}>
				{isLoading ? (
					<div className="row">
						{/* Esqueletos de productos durante la carga - sin spinner adicional */}
						{Array(12)
							.fill(0)
							.map((_, index) => (
								<ProductSkeleton key={index} />
							))}
					</div>
				) : (
					<>
						{/* Tarjetas de Productos */}
						<div className="row">
							{apiProducts.length > 0 ? (
								apiProducts.map((producto: Producto, index: number) => (
									<div
										className="col-md-4 mb-4"
										key={`${producto.name}-${index}`}
									>
										<div className="card h-100">
											<img
												src={producto.img}
												className="card-img-top"
												alt={producto.name}
												style={{ height: "200px", objectFit: "cover" }}
												onError={(e) => {
													const target = e.target as HTMLImageElement;
													target.src =
														"https://via.placeholder.com/200x200?text=Imagen+No+Disponible";
												}}
											/>
											<div className="card-body d-flex flex-column">
												<h5 className="card-title">{producto.name}</h5>
												<p className="card-text flex-grow-1">{producto.text}</p>
												<div className="d-flex justify-content-between align-items-center mt-3">
													<h5 className="m-0 text-danger">
														S/ {producto.price.toFixed(2)}
													</h5>
													<button
														className={`btn ${
															addedProducts[producto.name]
																? "btn-success"
																: "btn-outline-danger"
														}`}
														onClick={() => handleAddToCart(producto)}
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
								))
							) : (
								<div className="col-12 text-center py-5">
									<p>No se encontraron productos en esta categoría.</p>
								</div>
							)}
						</div>
					</>
				)}
			</div>

			{/* Paginación (visible cuando hay más de una página y no está cargando) */}
			{!isLoading && totalPages > 1 && (
				<div className="d-flex justify-content-center mt-4 mb-5">
					<nav aria-label="Navegación de páginas de productos">
						<ul className="pagination">
							<li
								className={`page-item ${currentPage === 1 ? "disabled" : ""}`}
							>
								<button
									className="page-link"
									onClick={handlePreviousPage}
									disabled={currentPage === 1}
								>
									Anterior
								</button>
							</li>

							{/* Mostrar número de página actual */}
							<li className="page-item active">
								<span className="page-link">
									Página {currentPage} de {totalPages}
								</span>
							</li>

							<li
								className={`page-item ${
									currentPage === totalPages ? "disabled" : ""
								}`}
							>
								<button
									className="page-link"
									onClick={handleNextPage}
									disabled={currentPage === totalPages}
								>
									Siguiente
								</button>
							</li>
						</ul>
					</nav>
				</div>
			)}
		</div>
	);
};

export default ProductCatalog;
