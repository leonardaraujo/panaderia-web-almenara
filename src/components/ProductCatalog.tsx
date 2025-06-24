import React, { useState, useEffect } from "react";
import productos from "../data/products";
import productsApi, { Product as ApiProduct } from "../api/products.api";
import type { Product } from "../domain/IProduct";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { FaSpinner } from "react-icons/fa";
import useUserStore from "../../store/userStore";

interface ProductCatalogProps {
  onAddToCart: (producto: Product) => void;
  config?: {
    showCategories?: string[];
  };
}

type SortOrder = "none" | "asc" | "desc";

interface LocalProduct {
  name: string;
  img: string;
  text: string;
  price: number;
}

const AVAILABLE_CATEGORIES = [
  { key: "todos", name: "Todos" },
  { key: "birthday", name: "Cumpleaños" },
  { key: "catering", name: "Catering" },
  { key: "cakes", name: "Tortas" },
  { key: "gift_boxes", name: "Cajas Regalo" },
];

const adaptLocalProductsToProduct = (localProducts: LocalProduct[], startId: number = 1): Product[] => {
  return localProducts.map((product, index) => ({
    id: startId + index,
    name: product.name,
    imgUrl: product.img,
    text: product.text,
    price: product.price,
  }));
};

// Componente para manejar la carga de imágenes con spinner
const ProductImage: React.FC<{
  src: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
}> = ({ src, alt, className, style }) => {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  const handleImageError = () => {
    setImageLoading(false);
    setImageError(true);
  };

  return (
    <div className="position-relative" style={style}>
      {imageLoading && (
        <div 
          className="position-absolute top-50 start-50 translate-middle d-flex align-items-center justify-content-center"
          style={{ 
            width: '100%', 
            height: '100%', 
            backgroundColor: '#f8f9fa',
            zIndex: 1 
          }}
        >
          <FaSpinner className="fa-spin text-muted" size={24} />
        </div>
      )}
      {imageError ? (
        <div 
          className="d-flex align-items-center justify-content-center text-muted"
          style={{ 
            width: '100%', 
            height: '100%', 
            backgroundColor: '#f8f9fa',
            fontSize: '0.8rem',
            textAlign: 'center',
            padding: '10px'
          }}
        >
          Imagen no disponible
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          className={className}
          style={{
            ...style,
            display: imageLoading ? 'none' : 'block'
          }}
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
      )}
    </div>
  );
};

const ProductCatalog: React.FC<ProductCatalogProps> = ({
  onAddToCart,
  config,
}) => {
  const isAdmin = useUserStore((state) => state.isAdmin());
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string>("todos");
  const [addedProducts, setAddedProducts] = useState<Record<string, boolean>>({});
  const [apiProducts, setApiProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [sortOrder, setSortOrder] = useState<SortOrder>("none");

  const visibleCategories = config?.showCategories
    ? AVAILABLE_CATEGORIES.filter((cat) =>
        config.showCategories?.includes(cat.key)
      )
    : AVAILABLE_CATEGORIES;

  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      setError(null);
      try {
        let response;

        if (categoriaSeleccionada === "todos") {
          response = await productsApi.getProducts({
            page: currentPage,
            limit: 12,
          });
        } else {
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

        const formattedProducts = response.products.map(
          (apiProduct: ApiProduct) => ({
            id: apiProduct.id,
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
        
        if (categoriaSeleccionada !== "todos") {
          const localProducts =
            productos.categorias[
              categoriaSeleccionada as keyof typeof productos.categorias
            ] || [];
          
          const transformedLocalProducts = adaptLocalProductsToProduct(
            localProducts as LocalProduct[], 
            Date.now()
          );
          
          setApiProducts(transformedLocalProducts);
          setTotalPages(1);
        } else {
          const allLocalProducts: Product[] = [];
          let idCounter = Date.now();
          
          Object.values(productos.categorias).forEach((category) => {
            const transformedProducts = adaptLocalProductsToProduct(
              category as LocalProduct[], 
              idCounter
            );
            allLocalProducts.push(...transformedProducts);
            idCounter += category.length;
          });
          
          setApiProducts(allLocalProducts);
          setTotalPages(1);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [categoriaSeleccionada, currentPage]);

  const toggleSortOrder = () => {
    setSortOrder((prevOrder) => {
      if (prevOrder === "none") return "asc";
      if (prevOrder === "asc") return "desc";
      return "none";
    });
  };

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

  const handleAddToCart = (producto: Product) => {
    if (isAdmin) return;
    
    setAddedProducts((prev) => ({
      ...prev,
      [producto.name]: true,
    }));

    setTimeout(() => {
      setAddedProducts((prev) => ({
        ...prev,
        [producto.name]: false,
      }));
    }, 1500);

    onAddToCart(producto);
  };

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

  // Componente de esqueleto mejorado
  const ProductSkeleton = () => (
    <div className="col-md-4 mb-4">
      <div className="card h-100">
        <div className="d-flex align-items-center justify-content-center bg-light" style={{ height: "200px" }}>
          <FaSpinner className="fa-spin text-muted" size={30} />
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
                setCurrentPage(1);
              }}
            >
              {categoria.name}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="alert alert-warning mb-4" role="alert">
          {error}
        </div>
      )}

      <div className="productos-container" style={{ minHeight: "800px" }}>
        {isLoading ? (
          <div className="row">
            {Array(12)
              .fill(0)
              .map((_, index) => (
                <ProductSkeleton key={index} />
              ))}
          </div>
        ) : (
          <>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div>
                {apiProducts.length > 0 && (
                  <span className="text-muted">
                    Mostrando {apiProducts.length} productos
                  </span>
                )}
              </div>

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

            <div className="row">
              {sortedProducts.length > 0 ? (
                sortedProducts.map((producto: Product, index: number) => (
                  <div
                    className="col-md-4 mb-4"
                    key={`${producto.id}-${producto.name}-${index}`}
                  >
                    <div className="card h-100">
                      <ProductImage
                        src={producto.imgUrl}
                        alt={producto.name}
                        className="card-img-top"
                        style={{ height: "200px", objectFit: "cover" }}
                      />
                      <div className="card-body d-flex flex-column">
                        <h5 className="card-title">{producto.name}</h5>
                        <p className="card-text flex-grow-1">{producto.text}</p>
                        <div className="d-flex justify-content-between align-items-center mt-3">
                          <h5 className="m-0 text-danger">
                            S/ {producto.price.toFixed(2)}
                          </h5>
                          
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