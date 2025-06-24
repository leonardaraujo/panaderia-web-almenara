import { useEffect } from "react";
import { FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt } from "react-icons/fa";
import useUserStore from "../../store/userStore";

interface MyProfileProps {
  show: boolean;
  onClose: () => void;
}

const MyProfile: React.FC<MyProfileProps> = ({ show, onClose }) => {
  const { user } = useUserStore();

  // Bloquear el scroll del body cuando se abre el modal
  useEffect(() => {
    if (show) {
      // Guardar el valor original de overflow
      const originalStyle = window.getComputedStyle(document.body).overflow;
      // Bloquear el scroll
      document.body.style.overflow = "hidden";

      // Restaurar el scroll cuando se desmonta el componente o cierra el modal
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [show]);

  // Si el modal no está activo, no renderizar nada
  if (!show) return null;

  return (
    <div
      className="modal d-block"
      tabIndex={-1}
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
    >
      <div
        className="modal-dialog modal-dialog-centered"
        style={{ maxWidth: "500px" }}
      >
        <div className="modal-content border-0">
          <div className="modal-header bg-danger text-white">
            <h5 className="modal-title">Mi Perfil</h5>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={onClose}
              aria-label="Close"
            />
          </div>
          <div className="modal-body">
            {user ? (
              <div>
                <div className="text-center mb-4">
                  <div className="avatar-placeholder bg-light rounded-circle d-flex justify-content-center align-items-center mx-auto mb-3" style={{ width: "100px", height: "100px" }}>
                    <FaUser size={40} className="text-secondary" />
                  </div>
                  <h4>{user.name} {user.surname}</h4>
                  <span className="badge bg-secondary">{user.role === "ADMIN" ? "Administrador" : "Cliente"}</span>
                </div>

                <div className="card border-0 shadow-sm mb-3">
                  <div className="card-body">
                    <h6 className="card-title">Información de Contacto</h6>
                    <ul className="list-group list-group-flush">
                      <li className="list-group-item border-0 px-0 py-2">
                        <div className="d-flex align-items-center">
                          <div className="me-3">
                            <FaEnvelope className="text-primary" />
                          </div>
                          <div>
                            <div className="text-muted small">Correo electrónico</div>
                            <div>{user.email}</div>
                          </div>
                        </div>
                      </li>
                      <li className="list-group-item border-0 px-0 py-2">
                        <div className="d-flex align-items-center">
                          <div className="me-3">
                            <FaPhone className="text-primary" />
                          </div>
                          <div>
                            <div className="text-muted small">Teléfono</div>
                            <div>{user.phoneNumber || "No especificado"}</div>
                          </div>
                        </div>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="card border-0 shadow-sm">
                  <div className="card-body">
                    <h6 className="card-title">Dirección de Entrega</h6>
                    <ul className="list-group list-group-flush">
                      <li className="list-group-item border-0 px-0 py-2">
                        <div className="d-flex">
                          <div className="me-3">
                            <FaMapMarkerAlt className="text-danger" />
                          </div>
                          <div>
                            <div className="text-muted small">Distrito</div>
                            <div>{user.district || "No especificado"}</div>
                          </div>
                        </div>
                      </li>
                      <li className="list-group-item border-0 px-0 py-2">
                        <div className="d-flex">
                          <div className="me-3">
                            <FaMapMarkerAlt className="text-danger" />
                          </div>
                          <div>
                            <div className="text-muted small">Dirección</div>
                            <div>{user.address || "No especificado"}</div>
                          </div>
                        </div>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <FaUser size={40} className="text-secondary mb-3" />
                <p>No se encontró información del usuario</p>
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button className="btn btn-outline-secondary" onClick={onClose}>
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyProfile;