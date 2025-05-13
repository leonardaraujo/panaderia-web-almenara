import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// Definición de la interfaz para el usuario
interface User {
	id_user: number;
	name: string;
	surname: string;
	email: string;
	role: string;
}

// Definición de la interfaz para la respuesta de autenticación
interface AuthResponse {
	message: string;
	token: string;
	user: User;
}

// Definición de la interfaz para el estado del store
interface UserState {
	isAuthenticated: boolean;
	token: string | null;
	user: User | null;
	message: string | null;

	// Acciones
	login: (authData: AuthResponse) => void;
	logout: () => void;

	// Getters para información del usuario
	isAdmin: () => boolean;
	getUserName: () => string;
	getUserEmail: () => string;
}

// Creación del store con persistencia en sessionStorage
export const useUserStore = create<UserState>()(
	persist(
		(set, get) => ({
			// Estado inicial
			isAuthenticated: false,
			token: null,
			user: null,
			message: null,

			// Acción para iniciar sesión
			login: (authData: AuthResponse) =>
				set({
					isAuthenticated: true,
					token: authData.token,
					user: authData.user,
					message: authData.message,
				}),

			// Acción para cerrar sesión
			logout: () =>
				set({
					isAuthenticated: false,
					token: null,
					user: null,
					message: null,
				}),

			// Verificar si el usuario es administrador
			isAdmin: () => {
				const user = get().user;
				return user?.role === "admin";
			},

			// Obtener el nombre completo del usuario
			getUserName: () => {
				const user = get().user;
				return user ? `${user.name} ${user.surname}` : "";
			},

			// Obtener el email del usuario
			getUserEmail: () => {
				const user = get().user;
				return user?.email || "";
			},
		}),
		{
			name: "user-storage", // Nombre para la clave en sessionStorage
			storage: createJSONStorage(() => sessionStorage), // Usar sessionStorage en vez de localStorage
			partialize: (state) => ({
				isAuthenticated: state.isAuthenticated,
				token: state.token,
				user: state.user,
			}),
		},
	),
);

export default useUserStore;
