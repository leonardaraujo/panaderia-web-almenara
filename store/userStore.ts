import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { User } from "../src/domain/IUser";

// Definición de la interfaz para la respuesta de login
interface LoginResponse {
    token: string;
    user: User;
}

// Definición de la interfaz para la respuesta de registro
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

// Definición de la interfaz para el estado del store
interface UserState {
    isAuthenticated: boolean;
    token: string | null;
    user: User | null;
    message: string | null;

    // Acciones
    login: (authData: LoginResponse) => void;
    loginWithRegisterResponse: (token: string, userData: RegisterResponse) => void;
    logout: () => void;
    updateUserProfile: (userData: Partial<User>) => void;

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

            // Acción para iniciar sesión con respuesta de login
            login: (authData: LoginResponse) =>
                set({
                    isAuthenticated: true,
                    token: authData.token,
                    user: authData.user,
                    message: "Inicio de sesión exitoso",
                }),

            // Acción para iniciar sesión con respuesta de registro
            // (útil si quieres iniciar sesión automáticamente después del registro)
            loginWithRegisterResponse: (token: string, userData: RegisterResponse) =>
                set({
                    isAuthenticated: true,
                    token: token,
                    user: {
                        id: userData.id,
                        name: userData.name,
                        surname: userData.surname,
                        email: userData.email,
                        role: userData.role,
                        phoneNumber: userData.phoneNumber,
                        district: userData.district,
                        address: userData.address,
                    },
                    message: "Registro exitoso",
                }),

            // Acción para actualizar perfil de usuario
            updateUserProfile: (userData: Partial<User>) =>
                set((state) => ({
                    user: state.user ? { ...state.user, ...userData } : null,
                })),

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
                // Actualizado para coincidir con el rol 'ADMIN' en mayúsculas
                return user?.role === "ADMIN";
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