import { useNavigate } from "react-router-dom";
import Dashboard from "../components/Dashboard";

interface AuthUser {
  id: string;
  user: string;
  name: string;
}

interface DashboardPageProps {
  currentUser: AuthUser | null;
}

const DashboardPage: React.FC<DashboardPageProps> = ({ currentUser }) => {
  const navigate = useNavigate();

  // Redireccionar si no hay usuario o no es administrador
  if (!currentUser || currentUser.user !== "admin") {
    // Redireccionar a la página principal
    navigate("/");
    return null;
  }

  return (
    <Dashboard onClose={() => navigate("/")} />
  );
};

export default DashboardPage;