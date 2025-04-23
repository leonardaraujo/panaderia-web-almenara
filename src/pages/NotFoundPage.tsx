import { Link } from "react-router-dom";
import { FaHome } from "react-icons/fa";

const NotFoundPage: React.FC = () => {
  return (
    <div className="container py-5 text-center">
      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="card shadow-lg border-0">
            <div className="card-body p-5">
              <h1 className="display-1 text-danger fw-bold">404</h1>
              <h2 className="mb-4">Página no encontrada</h2>
              <p className="lead mb-4">
                Lo sentimos, la página que estás buscando no existe o ha sido movida.
              </p>
              <Link to="/" className="btn btn-danger btn-lg">
                <FaHome className="me-2" />
                Volver al inicio
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;