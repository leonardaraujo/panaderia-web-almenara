import React, { useState, useEffect } from "react";
import productos from "../data/products";
import productsApi, { Product as ApiProduct } from "../api/products.api";
import type { Product } from "../domain/IProduct";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"; // Importar iconos de Lucide
import useUserStore from "../../store/userStore";

interface ProductCatalogProps {
  onAddToCart: (producto: Product) => void;
  // Configuración opcional para mostrar/ocultar pestañas específicas
  config?: {
    showCategories?: string[];
  };
}

// Tipo para el estado de ordenamiento
type SortOrder = "none" | "asc" | "desc";

// Categorías disponibles (nombre visible y clave)
const AVAILABLE_CATEGORIES = [
  { key: "todos", name: "Todos" },
  { key: "birthday", name: "Cumpleaños" },
  { key: "catering", name: "Catering" },
  { key: "cakes", name: "Tortas" },
  { key: "gift_boxes", name: "Cajas Regalo" },
];

const ProductCatalog: React.FC<ProductCatalogProps> = ({
  onAddToCart,
  config,
}) => {
  // Verificar si el usuario es admin
  const isAdmin = useUserStore((state) => state.isAdmin());

  // Estado para la categoría seleccionada (incluye "todos" como opción)
  const [categoriaSeleccionada, setCategoriaSeleccionada] =
    useState<string>("todos");

  // Estado para seguir qué productos se añadieron recientemente
  const [addedProducts, setAddedProducts] = useState<Record<string, boolean>>(
    {}
  );

  // Estados para productos de la API
  const [apiProducts, setApiProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);

  // Estado para ordenamiento por precio
  const [sortOrder, setSortOrder] = useState<SortOrder>("none");

  // Determinar qué categorías mostrar
  const visibleCategories = config?.showCategories
    ? AVAILABLE_CATEGORIES.filter((cat) =>
        config.showCategories?.includes(cat.key)
      )
    : AVAILABLE_CATEGORIES;

  // Cargar productos desde la API
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
          // Mapeo actualizado para enviar el nombre exacto que necesitas
          const categoryNames: Record<string, string> = {
            birthday: "birthday",
            catering: "catering",
            cakes: "cakes",
            gift_boxes: "gift_boxes",
          };

          const categoryName = categoryNames[categoriaSeleccionada];
          if (!categoryName) {
            throw new Error(`Categoría no válida: ${categoriaSeleccionada}`);
          }

          response = await productsApi.getProductsByCategory(categoryName, {
            page: currentPage,
            limit: 12,
          });
        }

        // Convertir productos de la API al formato usado en la aplicación
        const formattedProducts = response.products.map(
          (apiProduct: ApiProduct) => ({
            id: apiProduct.id, // <-- AGREGA ESTA LÍNEA
            name: apiProduct.name,
            imgUrl: apiProduct.imgUrl,
            text: apiProduct.description,
            price: apiProduct.price,
          })
        );

        setApiProducts(formattedProducts);
        setTotalPages(response.pagination.totalPages);
      } catch (err) {
        console.error("Error al cargar productos:", err);
        setError(
          "No se pudieron cargar los productos. Por favor, intente de nuevo más tarde."
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

  // Función para cambiar el orden de los productos
  const toggleSortOrder = () => {
    setSortOrder((prevOrder) => {
      if (prevOrder === "none") return "asc";
      if (prevOrder === "asc") return "desc";
      return "none"; // Si es desc, volver a none
    });
  };

  // Obtener productos ordenados según el estado actual
  const getSortedProducts = () => {
    if (sortOrder === "none") return apiProducts;

    return [...apiProducts].sort((a, b) => {
      if (sortOrder === "asc") {
        return a.price - b.price;
      } else {
        return b.price - a.price;
      }
    });
  };

  // Obtener el icono adecuado según el estado de ordenamiento
  const getSortIcon = () => {
    switch (sortOrder) {
      case "asc":
        return <ArrowUp size={16} />;
      case "desc":
        return <ArrowDown size={16} />;
      default:
        return <ArrowUpDown size={16} />;
    }
  };

  // Función para manejar la adición de productos al carrito con animación
  const handleAddToCart = (producto: Product) => {
    // No permitir añadir productos si es admin
    if (isAdmin) return;
    
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

  // Productos ordenados según el estado actual
  const sortedProducts = getSortedProducts();

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
            {/* Barra de filtros y ordenamiento */}
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div>
                {apiProducts.length > 0 && (
                  <span className="text-muted">
                    Mostrando {apiProducts.length} productos
                  </span>
                )}
              </div>

              {/* Botón de ordenamiento por precio */}
              <button
                className={`btn ${
                  sortOrder !== "none" ? "btn-danger" : "btn-outline-danger"
                } d-flex align-items-center`}
                onClick={toggleSortOrder}
                title={
                  sortOrder === "asc"
                    ? "Precio: Menor a Mayor"
                    : sortOrder === "desc"
                    ? "Precio: Mayor a Menor"
                    : "Ordenar por precio"
                }
              >
                <span className="me-2">
                  {sortOrder === "asc"
                    ? "Precio ascendente"
                    : sortOrder === "desc"
                    ? "Precio descendente"
                    : "Sin ordenar"}
                </span>
                {getSortIcon()}
              </button>
            </div>

            {/* Tarjetas de Productos */}
            <div className="row">
              {sortedProducts.length > 0 ? (
                sortedProducts.map((producto: Product, index: number) => (
                  <div
                    className="col-md-4 mb-4"
                    key={`${producto.name}-${index}`}
                  >
                    <div className="card h-100">
                      <img
                        src={producto.imgUrl}
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
                          
                          {/* Botón condicional basado en si el usuario es administrador */}
                          {isAdmin ? (
                            <button
                              className="btn btn-outline-secondary"
                              disabled
                              title="Los administradores no pueden comprar"
                            >
                              No disponible
                            </button>
                          ) : (
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
                          )}
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