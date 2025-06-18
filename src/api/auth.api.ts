import api from "./api.base";
import useUserStore from "../../store/userStore";

// Interfaces para la autenticación
interface LoginCredentials {
    email: string;
    password: string;
}

interface RegisterData {
    name: string;
    surname: string;
    role: string; // Añadido role
    email: string;
    password: string;
    phoneNumber: string; // Cambiado de phone_number a phoneNumber
    district: string;
    address: string;
}

// Actualizada para coincidir con la nueva estructura de respuesta
interface LoginResponse {
    token: string;
    user: {
        id: number; // Cambiado de id_user a id
        name: string;
        surname: string;
        email: string;
        role: string;
    };
}

// Respuesta de registro
interface RegisterResponse {
    id: number;
    name: string;
    surname: string;
    email: string;
    phoneNumber: string;
    district: string;
    address: string;
    role: string;
}

/**
 * Servicio de autenticación para manejar el login y registro de usuarios
 */
const authApi = {
    /**
     * Iniciar sesión con email y contraseña
     * @param credentials - Credenciales del usuario (email y password)
     * @returns Respuesta con token y datos del usuario
     */
    login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
        try {
            // Actualización del endpoint a /api/users/login
            const response = await api.post<LoginResponse>(
                "/users/login",
                credentials,
            );

            // Guardar los datos de sesión en el store
            if (response && response.token) {
                useUserStore.getState().login(response);
            }

            return response;
        } catch (error: any) {
            // Personalizar el mensaje de error según la respuesta
            if (error.response && error.response.status === 401) {
                throw new Error("Email o contraseña incorrectos");
            }

            throw error; // Propagar otros errores
        }
    },

    /**
     * Registrar un nuevo usuario
     * @param userData - Datos del nuevo usuario
     * @returns Respuesta del servidor con los datos del usuario registrado
     */
    register: async (userData: RegisterData): Promise<RegisterResponse> => {
        try {
            // Si no se proporciona un rol, asignar USER por defecto
            if (!userData.role) {
                userData.role = "USER";
            }

            // Actualización del endpoint a /api/users/register
            const response = await api.post<RegisterResponse>(
                "/users/register",
                userData,
            );
            
            return response;
        } catch (error: any) {
            // Personalizar el mensaje de error según la respuesta
            if (error.response) {
                switch (error.response.status) {
                    case 400:
                        throw new Error("Los datos proporcionados no son válidos");
                    case 409:
                        throw new Error("El email ya está registrado");
                    default:
                        throw new Error(error.message || "Error al registrar usuario");
                }
            }

            throw error; // Propagar otros errores
        }
    },

    /**
     * Función para cerrar sesión en el cliente (solo limpia el state)
     * Esta función no realiza llamada a la API
     */
    clearSession: (): void => {
        // Limpiar datos de sesión locales
        useUserStore.getState().logout();
    },
};

export default authApi;