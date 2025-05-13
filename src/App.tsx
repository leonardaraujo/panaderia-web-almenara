import { useState, useEffect } from "react";
import {
	Routes,
	Route,
	Navigate,
	useNavigate,
	useLocation,
} from "react-router-dom";
import HomePage from "./pages/HomePage";
import DashboardPage from "./pages/admin/DashboardPage";
import NotFoundPage from "./pages/NotFoundPage";

// Definición de la interfaz para usuario autenticado
interface AuthUser {
	id: string;
	user: string;
	name: string;
}

function App() {
	// Estado para usuario autenticado
	const [currentUser] = useState<AuthUser | null>(null);
	const navigate = useNavigate();
	const location = useLocation();

	// Efecto para redireccionar al dashboard cuando el admin inicia sesión
	useEffect(() => {
		if (currentUser?.user === "admin" && location.pathname === "/") {
			navigate("/dashboard");
		}
	}, [currentUser, navigate, location.pathname]);

	return (
		<Routes>
			<Route path="/" element={<HomePage />} />
			<Route path="/dashboard" element={<DashboardPage />} />
			<Route path="/404" element={<NotFoundPage />} />
			<Route path="*" element={<Navigate to="/404" replace />} />
		</Routes>
	);
}

export default App;
