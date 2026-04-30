import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import "../styles/login.css";

export default function SignUp() {
  const [role, setRole] = useState("");
  const navigate = useNavigate();

  const handleRoleSelect = () => {
    if (role === "donor") {
      navigate("/register/donor");
    } else if (role === "recipient") {
      navigate("/register/recipient");
    }
  };

  return (
    <>
      <Header />

      <div className="login-container">
        <div className="login-card">
          <h2>Sign Up</h2>

          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="">Select Role</option>
            <option value="donor">Donor</option>
            <option value="recipient">Recipient</option>
          </select>

          <button
            className="login-btn"
            onClick={handleRoleSelect}
            disabled={!role}
            style={{
              opacity: role ? 1 : 0.5,
              cursor: role ? "pointer" : "not-allowed",
            }}
          >
            Continue
          </button>

          {/* Back to Login Link */}
          <p style={{ marginTop: "20px", color: "#666", fontSize: "14px" }}>
            Already have an account?{" "}
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                navigate("/login");
              }}
              style={{
                color: "#0e64bb",
                textDecoration: "none",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              Sign in
            </a>
          </p>
        </div>
      </div>
    </>
  );
}
