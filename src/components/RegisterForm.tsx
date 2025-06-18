import { useState } from "react";
import authApi from "../api/auth.api";

import distritosData from "../data/ubications/distritos.json";

// Filtrar solo distritos de Lima Metropolitana (department_id="15", province_id="1501")
const distritosDeLima = distritosData
    .filter(
        (distrito) =>
            distrito.department_id === "15" && distrito.province_id === "1501",
    )
    .map((distrito) => `Lima-${distrito.name}`);

interface RegisterFormProps {
    onRegister: (userData: { id: string; user: string; name: string }) => void;
    onClose: () => void;
    onSwitchToLogin: () => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({
    onClose,
    onSwitchToLogin,
}) => {
    // Estados para los campos del formulario
    const [email, setEmail] = useState("");
    const [name, setName] = useState("");
    const [surname, setSurname] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [phoneNumber, setPhoneNumber] = useState(""); // Cambiado de phone_number a phoneNumber
    const [district, setDistrict] = useState("");
    const [address, setAddress] = useState("");

    // Estado para errores y carga
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        // Validar campos
        if (
            !email ||
            !name ||
            !surname ||
            !password ||
            !confirmPassword ||
            !phoneNumber || // Cambiado de phone_number a phoneNumber
            !district ||
            !address
        ) {
            setError("Por favor complete todos los campos obligatorios.");
            return;
        }

        if (password !== confirmPassword) {
            setError("Las contraseñas no coinciden.");
            return;
        }

        // Validar formato de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setError("Por favor ingrese un correo electrónico válido.");
            return;
        }

        // Validar formato de teléfono (9 dígitos para Perú)
        const phoneRegex = /^9\d{8}$/;
        if (!phoneRegex.test(phoneNumber)) { // Cambiado de phone_number a phoneNumber
            setError("El número de teléfono debe tener 9 dígitos y comenzar con 9.");
            return;
        }

        setIsLoading(true);

        try {
            // Enviar datos a la API con la estructura correcta
            const response = await authApi.register({
                name,
                surname,
                email,
                password,
                phoneNumber, // Cambiado de phone_number a phoneNumber
                district,
                address,
                role: "USER", // Agregando el rol por defecto
            });
            
            console.log(response);
            
            // Registro exitoso - ahora iniciar sesión con las credenciales
            try {
                const loginResponse = await authApi.login({ email, password });
                
                // Otra opción sería usar loginWithRegisterResponse si quieres mantener todos los datos
                // const token = loginResponse.token;
                // useUserStore.getState().loginWithRegisterResponse(token, response);
                
                // Cerrar el modal
                onClose();

                // Opcional: redirigir al usuario
                // navigate('/perfil');
            } catch (loginError: any) {
                console.error("Error al iniciar sesión automáticamente:", loginError);
                // No mostrar error, simplemente redirigir al login
                onSwitchToLogin();
            }
        } catch (err: any) {
            // Mostrar mensaje de error
            setError(
                err.message || "Error al registrar usuario. Inténtelo de nuevo.",
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="modal-content">
            <div className="modal-header bg-danger text-white">
                <h5 className="modal-title">Crear Cuenta</h5>
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
                    <div className="row">
                        <div className="col-md-6 mb-3">
                            <label htmlFor="name" className="form-label">
                                Nombre <span className="text-danger">*</span>
                            </label>
                            <input
                                type="text"
                                className="form-control"
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                disabled={isLoading}
                                required
                            />
                        </div>
                        <div className="col-md-6 mb-3">
                            <label htmlFor="surname" className="form-label">
                                Apellido <span className="text-danger">*</span>
                            </label>
                            <input
                                type="text"
                                className="form-control"
                                id="surname"
                                value={surname}
                                onChange={(e) => setSurname(e.target.value)}
                                disabled={isLoading}
                                required
                            />
                        </div>
                    </div>

                    <div className="mb-3">
                        <label htmlFor="email" className="form-label">
                            Correo electrónico <span className="text-danger">*</span>
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

                    <div className="row">
                        <div className="col-md-6 mb-3">
                            <label htmlFor="password" className="form-label">
                                Contraseña <span className="text-danger">*</span>
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
                        <div className="col-md-6 mb-3">
                            <label htmlFor="confirm-password" className="form-label">
                                Confirmar Contraseña <span className="text-danger">*</span>
                            </label>
                            <input
                                type="password"
                                className="form-control"
                                id="confirm-password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                disabled={isLoading}
                                required
                            />
                        </div>
                    </div>

                    <div className="mb-3">
                        <label htmlFor="phoneNumber" className="form-label"> {/* Cambiado el id de phone_number a phoneNumber */}
                            Número de teléfono <span className="text-danger">*</span>
                        </label>
                        <div className="input-group">
                            <span className="input-group-text">+51</span>
                            <input
                                type="tel"
                                className="form-control"
                                id="phoneNumber" // Cambiado el id de phone_number a phoneNumber
                                value={phoneNumber} // Cambiado de phone_number a phoneNumber
                                onChange={(e) => setPhoneNumber(e.target.value)} // Cambiado de setPhoneNumber a phoneNumber
                                placeholder="912345678"
                                maxLength={9}
                                disabled={isLoading}
                                required
                            />
                        </div>
                        <div className="form-text">
                            Debe comenzar con 9 seguido de 8 dígitos
                        </div>
                    </div>

                    <div className="mb-3">
                        <label htmlFor="district" className="form-label">
                            Distrito <span className="text-danger">*</span>
                        </label>
                        <select
                            className="form-select"
                            id="district"
                            value={district}
                            onChange={(e) => setDistrict(e.target.value)}
                            disabled={isLoading}
                            required
                        >
                            <option value="">Seleccione un distrito</option>
                            {distritosDeLima.map((distrito) => (
                                <option key={distrito} value={distrito}>
                                    {distrito}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="mb-3">
                        <label htmlFor="address" className="form-label">
                            Dirección <span className="text-danger">*</span>
                        </label>
                        <input
                            type="text"
                            className="form-control"
                            id="address"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            disabled={isLoading}
                            placeholder="Av. Principal 123, Dpto 401"
                            required
                        />
                    </div>

                    <div className="d-grid gap-2 mt-4">
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
                                    />
                                    Registrando...
                                </>
                            ) : (
                                "Registrarse"
                            )}
                        </button>
                    </div>
                </form>
            </div>
            <div className="modal-footer justify-content-center">
                <p className="mb-0">
                    ¿Ya tienes una cuenta?{" "}
                    <button
                        type="button"
                        className="btn btn-link p-0 text-danger"
                        onClick={onSwitchToLogin}
                        disabled={isLoading}
                    >
                        Iniciar Sesión
                    </button>
                </p>
            </div>
        </div>
    );
};

export default RegisterForm;