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
	email: string;
	password: string;
	phone_number: string;
	district: string;
	address: string;
}

interface LoginResponse {
	message: string;
	token: string;
	user: {
		id_user: number;
		name: string;
		surname: string;
		email: string;
		role: string;
	};
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
			const response = await api.post<LoginResponse>(
				"/auth/login",
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
	 * @returns Respuesta del servidor
	 */
	register: async (userData: RegisterData): Promise<{ message: string }> => {
		try {
			const response = await api.post<{ message: string }>(
				"/auth/register",
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
