import { useState } from "react";
import { useNavigate } from "react-router-dom";
import authApi from "../api/auth.api";

interface LoginFormProps {
    onLogin: (userData: { id: string; user: string; name: string }) => void;
    onClose: () => void;
    onSwitchToRegister: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({
    onLogin,
    onClose,
    onSwitchToRegister,
}) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        // Validar campos
        if (!email || !password) {
            setError("Por favor complete todos los campos.");
            return;
        }

        setIsLoading(true);

        try {
            // Llamada a la API para autenticar
            const response = await authApi.login({ email, password });

            // La API ya almacena los datos en el store, pero también actualizamos
            // el estado local de la aplicación para mantener la compatibilidad
            onLogin({
                id: response.user.id.toString(), // Cambiado de id_user a id
                user: response.user.email,
                name: `${response.user.name} ${response.user.surname}`,
            });

            // Cerrar el modal
            onClose();

            // Si el usuario es admin, redirigir al dashboard
            // Actualizado a "ADMIN" en mayúsculas para coincidir con la nueva estructura
            if (response.user.role === "ADMIN") {
                setTimeout(() => {
                    navigate("/dashboard");
                }, 100); // pequeño retraso para asegurar que el estado se actualice
            }
        } catch (err: any) {
            // Mostrar mensaje de error
            setError(err.message || "Error al iniciar sesión. Inténtelo de nuevo.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="modal-content">
            <div className="modal-header bg-danger text-white">
                <h5 className="modal-title">Iniciar Sesión</h5>
                <button
                    type="button"
                    className="btn-close btn-close-white"
                    onClick={onClose}
                    disabled={isLoading}
                />
            </div>
            <div className="modal-body">
                {error && <div className="alert alert-danger">{error}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <label htmlFor="email" className="form-label">
                            Correo electrónico
                        </label>
                        <input
                            type="email"
                            className="form-control"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={isLoading}
                            placeholder="ejemplo@correo.com"
                            required
                        />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="password" className="form-label">
                            Contraseña
                        </label>
                        <input
                            type="password"
                            className="form-control"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={isLoading}
                            required
                        />
                    </div>
                    <div className="d-grid gap-2">
                        <button
                            type="submit"
                            className="btn btn-danger"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <span
                                        className="spinner-border spinner-border-sm me-2"
                                        role="status"
                                        aria-hidden="true"
                                    ></span>
                                    Iniciando sesión...
                                </>
                            ) : (
                                "Iniciar Sesión"
                            )}
                        </button>
                    </div>
                </form>
            </div>
            <div className="modal-footer justify-content-center">
                <p className="mb-0">
                    ¿No tienes una cuenta?{" "}
                    <button
                        type="button"
                        className="btn btn-link p-0 text-danger"
                        onClick={onSwitchToRegister}
                        disabled={isLoading}
                    >
                        Regístrate
                    </button>
                </p>
            </div>
        </div>
    );
};

export default LoginForm;