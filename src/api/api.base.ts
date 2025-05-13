import type {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import axios from "axios";
import useUserStore from "../../store/userStore";

// Crear una instancia de Axios con la configuración base
const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api/",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  timeout: 10000, // 10 segundos de timeout por defecto
});

// Interceptor para añadir el token de autenticación a las solicitudes
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    const token = useUserStore.getState().token;

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error: any) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores comunes
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: any) => {
    // Manejar errores de autenticación (401)
    if (error.response && error.response.status === 401) {
      // Cerrar sesión automáticamente si el token no es válido
      useUserStore.getState().logout();
      // Redirigir al login o mostrar mensaje
      window.location.href = "/login";
    }

    // Personalizar mensajes de error según el código HTTP
    if (error.response) {
      switch (error.response.status) {
        case 400:
          error.message = "Solicitud incorrecta";
          break;
        case 403:
          error.message = "Acceso denegado";
          break;
        case 404:
          error.message = "Recurso no encontrado";
          break;
        case 500:
          error.message = "Error interno del servidor";
          break;
        default:
          error.message = `Error: ${error.response.status}`;
      }
    } else if (error.request) {
      error.message = "No se pudo conectar con el servidor";
    } else {
      error.message = "Error en la configuración de la solicitud";
    }

    return Promise.reject(error);
  }
);

// Utilidades para simplificar las llamadas API
export const api = {
  /**
   * Realizar una petición GET
   * @param url - Endpoint a consultar
   * @param config - Configuración opcional de Axios
   */
  get: <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    return apiClient.get<T>(url, config).then((response) => response.data);
  },

  /**
   * Realizar una petición POST
   * @param url - Endpoint a consultar
   * @param data - Datos a enviar
   * @param config - Configuración opcional de Axios
   */
  post: <T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> => {
    return apiClient
      .post<T>(url, data, config)
      .then((response) => response.data);
  },

  /**
   * Realizar una petición PUT
   * @param url - Endpoint a consultar
   * @param data - Datos a enviar
   * @param config - Configuración opcional de Axios
   */
  put: <T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> => {
    return apiClient
      .put<T>(url, data, config)
      .then((response) => response.data);
  },

  /**
   * Realizar una petición PATCH
   * @param url - Endpoint a consultar
   * @param data - Datos a enviar
   * @param config - Configuración opcional de Axios
   */
  patch: <T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> => {
    return apiClient
      .patch<T>(url, data, config)
      .then((response) => response.data);
  },

  /**
   * Realizar una petición DELETE
   * @param url - Endpoint a consultar
   * @param config - Configuración opcional de Axios
   */
  delete: <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    return apiClient.delete<T>(url, config).then((response) => response.data);
  },

  // Acceso a la instancia base de Axios para casos especiales
  client: apiClient,
};

export default api;
