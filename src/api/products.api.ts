import api from "./api.base";

// Interfaces para los tipos de datos
export interface Category {
	id_category: number;
	name: string;
}

export interface Product {
	id_producto: number;
	name: string;
	img: string;
	img_public_id: string;
	description: string;
	price: string;
	category_id: number;
	createdAt: string;
	updatedAt: string;
	category: Category;
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
	 * Obtiene productos por ID de categoría con paginación opcional
	 * @param categoryId - ID de la categoría a consultar
	 * @param params - Parámetros opcionales para paginación
	 * @returns Promise con la respuesta de productos por categoría
	 */
	getProductsByCategory: async (
		categoryId: number,
		params?: Omit<GetProductsParams, "name">,
	): Promise<ProductsByCategoryResponse> => {
		try {
			// Crear query string para parámetros adicionales
			const queryParams = new URLSearchParams();

			if (params) {
				if (params.page) queryParams.append("page", params.page.toString());
				if (params.limit) queryParams.append("limit", params.limit.toString());
			}

			// Construir URL con ID de categoría y query params si existen
			const url = queryParams.toString()
				? `/products/category/${categoryId}?${queryParams.toString()}`
				: `/products/category/${categoryId}`;

			return await api.get<ProductsByCategoryResponse>(url);
		} catch (error:any) {
			console.error(
				`Error al obtener productos para la categoría ${categoryId}:`,
				error,
			);

			// Si el error es 404, podemos hacer un manejo específico
			if (error.response && error.response.status === 404) {
				// Devolver un objeto con estructura similar pero con arrays vacíos
				return {
					category: "",
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
