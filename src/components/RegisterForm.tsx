import { useState } from "react";
import users from "../data/users"; // Importar la "base de datos" de usuarios

interface RegisterFormProps {
	onRegister: (userData: { id: string; user: string; name: string }) => void;
	onClose: () => void;
	onSwitchToLogin: () => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({
	onRegister,
	onClose,
	onSwitchToLogin,
}) => {
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [name, setName] = useState("");
	const [error, setError] = useState("");

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		// Validar campos
		if (!username || !password || !confirmPassword || !name) {
			setError("Por favor complete todos los campos.");
			return;
		}

		if (password !== confirmPassword) {
			setError("Las contraseñas no coinciden.");
			return;
		}

		// Verificar si el usuario ya existe
		const userExists = users.some((user) => user.user === username);
		if (userExists) {
			setError("Este nombre de usuario ya está registrado.");
			return;
		}

		// Crear nuevo usuario (en una app real esto se haría en el backend)
		const newUser = {
			id: (users.length + 1).toString(),
			user: username,
			password: password,
			name: name,
		};

		users.push(newUser); // Añadir a la "base de datos" local

		// Registro exitoso
		onRegister({ id: newUser.id, user: newUser.user, name: newUser.name });
		onClose();
	};

	return (
		<div className="modal-content">
			<div className="modal-header">
				<h5 className="modal-title">Crear Cuenta</h5>
				<button type="button" className="btn-close" onClick={onClose}></button>
			</div>
			<div className="modal-body">
				{error && <div className="alert alert-danger">{error}</div>}
				<form onSubmit={handleSubmit}>
					<div className="mb-3">
						<label htmlFor="name" className="form-label">
							Nombre Completo
						</label>
						<input
							type="text"
							className="form-control"
							id="name"
							value={name}
							onChange={(e) => setName(e.target.value)}
						/>
					</div>
					<div className="mb-3">
						<label htmlFor="reg-username" className="form-label">
							Usuario
						</label>
						<input
							type="text"
							className="form-control"
							id="reg-username"
							value={username}
							onChange={(e) => setUsername(e.target.value)}
						/>
					</div>
					<div className="mb-3">
						<label htmlFor="reg-password" className="form-label">
							Contraseña
						</label>
						<input
							type="password"
							className="form-control"
							id="reg-password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
						/>
					</div>
					<div className="mb-3">
						<label htmlFor="confirm-password" className="form-label">
							Confirmar Contraseña
						</label>
						<input
							type="password"
							className="form-control"
							id="confirm-password"
							value={confirmPassword}
							onChange={(e) => setConfirmPassword(e.target.value)}
						/>
					</div>
					<div className="d-grid gap-2">
						<button type="submit" className="btn btn-danger">
							Registrarse
						</button>
					</div>
				</form>
			</div>
			<div className="modal-footer justify-content-center">
				<p className="mb-0">
					¿Ya tienes una cuenta?{" "}
					<button
						className="btn btn-link p-0 text-danger"
						onClick={onSwitchToLogin}
					>
						Iniciar Sesión
					</button>
				</p>
			</div>
		</div>
	);
};

export default RegisterForm;
