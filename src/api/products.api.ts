import api from "./api.base";
// Interfaces para los tipos de datos
export interface Category {
    id_category: number;
    name: string;
}

// Nueva estructura del producto que viene de la API
export interface Product {
    id: number;
    name: string;
    imgUrl: string;
    description: string;
    price: number; // Ahora es number en lugar de string
    category: string; // Ahora es string en lugar de objeto
}

export interface Pagination {
    totalProducts: number;
    totalPages: number;
    currentPage: number;
    limit: number;
}

export interface ProductsResponse {
    products: Product[];
    pagination: Pagination;
}

// Respuesta específica para productos por categoría
export interface ProductsByCategoryResponse extends ProductsResponse {
    category: string;
}

// Parámetros opcionales para la consulta de productos
export interface GetProductsParams {
    page?: number;
    limit?: number;
    name?: string; // cambiado de search a name para coincidir con el backend
}

const productsApi = {
    /**
     * Obtiene todos los productos con paginación y filtrado opcional
     * @param params - Parámetros opcionales para paginar y filtrar productos
     * @returns Promise con la respuesta de productos y paginación
     */
    getProducts: async (
        params?: GetProductsParams,
    ): Promise<ProductsResponse> => {
        try {
            // Crear query string a partir de los parámetros
            const queryParams = new URLSearchParams();

            if (params) {
                if (params.page) queryParams.append("page", params.page.toString());
                if (params.limit) queryParams.append("limit", params.limit.toString());
                if (params.name) queryParams.append("name", params.name);
            }

            // Construir URL con query params si existen
            const url = queryParams.toString()
                ? `/products?${queryParams.toString()}`
                : "/products";
            
            return await api.get<ProductsResponse>(url);
        } catch (error) {
            console.error("Error al obtener productos:", error);
            throw error;
        }
    },

    /**
     * Obtiene productos por nombre de categoría con paginación opcional
     * @param categoryName - Nombre de la categoría a consultar
     * @param params - Parámetros opcionales para paginación
     * @returns Promise con la respuesta de productos por categoría
     */
    getProductsByCategory: async (
        categoryName: string,
        params?: Omit<GetProductsParams, "name">,
    ): Promise<ProductsByCategoryResponse> => {
        try {
            // Crear query string para parámetros adicionales
            const queryParams = new URLSearchParams();

            if (params) {
                if (params.page) queryParams.append("page", params.page.toString());
                if (params.limit) queryParams.append("limit", params.limit.toString());
            }

            // Construir URL con nombre de categoría y query params si existen
            const url = queryParams.toString()
                ? `/products/category/${encodeURIComponent(categoryName)}?${queryParams.toString()}`
                : `/products/category/${encodeURIComponent(categoryName)}`;

            return await api.get<ProductsByCategoryResponse>(url);
        } catch (error: any) {
            console.error(
                `Error al obtener productos para la categoría "${categoryName}":`,
                error,
            );

            // Si el error es 404, podemos hacer un manejo específico
            if (error.response && error.response.status === 404) {
                // Devolver un objeto con estructura similar pero con arrays vacíos
                return {
                    category: categoryName,
                    products: [],
                    pagination: {
                        totalProducts: 0,
                        totalPages: 0,
                        currentPage: params?.page || 1,
                        limit: params?.limit || 10,
                    },
                };
            }

            throw error;
        }
    },
};

export default productsApi;