import { useState } from "react";
import { useNavigate } from "react-router-dom";
import users from "../data/users";

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
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const navigate = useNavigate();

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		// Validar campos
		if (!username || !password) {
			setError("Por favor complete todos los campos.");
			return;
		}

		// Verificar credenciales
		const user = users.find(
			(user) => user.user === username && user.password === password,
		);

		if (user) {
			// Login exitoso
			onLogin({ id: user.id, user: user.user, name: user.name });
			onClose();
			
			// Si el usuario es admin, redirigir al dashboard
			if (user.user === "admin") {
				setTimeout(() => {
					navigate("/dashboard");
				}, 100); // pequeño retraso para asegurar que el estado se actualice
			}
		} else {
			setError("Usuario o contraseña incorrectos.");
		}
	};

	return (
		<div className="modal-content">
			<div className="modal-header">
				<h5 className="modal-title">Iniciar Sesión</h5>
				<button type="button" className="btn-close" onClick={onClose}></button>
			</div>
			<div className="modal-body">
				{error && <div className="alert alert-danger">{error}</div>}
				<form onSubmit={handleSubmit}>
					<div className="mb-3">
						<label htmlFor="username" className="form-label">
							Usuario
						</label>
						<input
							type="text"
							className="form-control"
							id="username"
							value={username}
							onChange={(e) => setUsername(e.target.value)}
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
						/>
					</div>
					<div className="d-grid gap-2">
						<button type="submit" className="btn btn-danger">
							Iniciar Sesión
						</button>
					</div>
				</form>
			</div>
			<div className="modal-footer justify-content-center">
				<p className="mb-0">
					¿No tienes una cuenta?{" "}
					<button
						className="btn btn-link p-0 text-danger"
						onClick={onSwitchToRegister}
					>
						Regístrate
					</button>
				</p>
			</div>
		</div>
	);
};

export default LoginForm;
