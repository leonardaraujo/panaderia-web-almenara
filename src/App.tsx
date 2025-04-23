import { useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import HomePage from "./pages/HomePage";
import DashboardPage from "./pages/DashboardPage";
import NotFoundPage from "./pages/NotFoundPage";

// Definición de la interfaz para usuario autenticado
interface AuthUser {
	id: string;
	user: string;
	name: string;
}

function App() {
	// Estado para usuario autenticado
	const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
	const navigate = useNavigate();
	const location = useLocation();

	// Efecto para redireccionar al dashboard cuando el admin inicia sesión
	useEffect(() => {
		if (currentUser?.user === "admin" && location.pathname === "/") {
			navigate("/dashboard");
		}
	}, [currentUser, navigate, location.pathname]);

	// Manejar inicio de sesión
	const handleLogin = (userData: AuthUser) => {
		setCurrentUser(userData);
	};

	// Manejar registro
	const handleRegister = (userData: AuthUser) => {
		setCurrentUser(userData);
	};

	// Manejar cierre de sesión
	const handleLogout = () => {
		setCurrentUser(null);
		navigate("/");
	};

	return (
		<Routes>
			<Route 
				path="/" 
				element={
					<HomePage 
						currentUser={currentUser}
						onLogin={handleLogin}
						onRegister={handleRegister}
						onLogout={handleLogout}
					/>
				} 
			/>
			<Route 
				path="/dashboard" 
				element={<DashboardPage currentUser={currentUser} onLogout={handleLogout} />}
			/>
			<Route path="/404" element={<NotFoundPage />} />
			<Route path="*" element={<Navigate to="/404" replace />} />
		</Routes>
	);
}

export default App;
