import { useState, useEffect } from "react";
import "../styles/login.css";
import Header from "../components/Header";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function Login() {
  const [role, setRole] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [captcha, setCaptcha] = useState("");
  const [userCaptcha, setUserCaptcha] = useState("");

  const navigate = useNavigate();

  // 🔥 Generate CAPTCHA
  const generateCaptcha = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
    let cap = "";
    for (let i = 0; i < 6; i++) {
      cap += chars[Math.floor(Math.random() * chars.length)];
    }
    setCaptcha(cap);
  };

  // 🔥 Load CAPTCHA
  useEffect(() => {
    generateCaptcha();
  }, []);

  const tryAdminLogin = async (identifier, adminPassword) => {
    const endpoints = [
      "/adminapi/login",
      "/adminapi/adminlogin",
      "/adminapi/checkadminlogin",
    ];

    const payloadVariants = [
      { username: identifier, password: adminPassword },
      { email: identifier, password: adminPassword },
      { username: identifier, pwd: adminPassword },
      { email: identifier, pwd: adminPassword },
    ];

    let lastError;

    for (const endpoint of endpoints) {
      for (const payload of payloadVariants) {
        try {
          const res = await API.post(endpoint, payload);
          return res;
        } catch (error) {
          lastError = error;
        }
      }

      try {
        const res = await API.get(endpoint, {
          params: {
            username: identifier,
            email: identifier,
            password: adminPassword,
            pwd: adminPassword,
          },
        });
        return res;
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError || new Error("Admin login failed");
  };

  const handleLogin = async () => {
    const identifier = email.trim();

    if (!identifier || !password || !role) {
      toast.error("Please fill Email, Password and Role.", {
        autoClose: 6000,
      });
      return;
    }

    // 🔥 CAPTCHA VALIDATION
    if (userCaptcha !== captcha) {
      toast.error("Invalid Captcha.", {
        autoClose: 6000,
      });
      generateCaptcha();
      return;
    }

    try {
      let res;

      if (role === "admin") {
  const res = await API.post("/adminapi/login", {
    email: identifier,
    password: password,
  });

  const payload = res.data;

  localStorage.setItem(
    "user",
    JSON.stringify({
      role: "admin",
      id: payload?.id,
      email: payload?.email,
      token: payload?.token,
    })
  );

  navigate("/admin/dashboard");
  return;
}

      if (role === "logistics") {
        res = await API.post("/logisticsapi/login", { email, password });
        const payload = res?.data && typeof res.data === "object" ? res.data : {};
        const coordinator = payload.coordinator ?? payload;

        localStorage.setItem(
          "user",
          JSON.stringify({
            role: "logistics",
            id: coordinator?.id,
            name: coordinator?.name,
            email: coordinator?.email,
            token: payload.token,
            raw: res.data,
          }),
        );
        navigate("/logistics/dashboard");
        return;
      }

      if (role === "donor") {
        res = await API.post("/donorapi/login", { email, password });
        const payload = res?.data && typeof res.data === "object" ? res.data : {};
        const donor = payload.donor ?? payload;
        localStorage.setItem(
          "user",
          JSON.stringify({
            role: "donor",
            donorId: donor?.donorId,
            name: donor?.name,
            email: donor?.email,
            token: payload.token,
            raw: res.data,
          }),
        );
        navigate("/donor/dashboard");
        return;
      }

      // recipient
      res = await API.post("/recipient/login", { email, password });
      const payload = res?.data && typeof res.data === "object" ? res.data : {};
      const recipient = payload.recipient ?? payload;
      localStorage.setItem(
        "user",
        JSON.stringify({
          role: "recipient",
          recipientId: recipient?.recipientId,
          name: recipient?.name,
          email: recipient?.email,
          token: payload.token,
          raw: res.data,
        }),
      );
      navigate("/recipient/dashboard");
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.response?.data ||
        "Unable to login. Check credentials / backend.";
      toast.error(String(message), {
        autoClose: 6000,
      });
    }
  };

  return (
    <>
      <Header />
      <ToastContainer position="top-right" pauseOnHover={true} />

      <div className="login-container">
        <div className="login-card">
          <h2>Login</h2>

          <input
            type="text"
            placeholder={role === "admin" ? "Username" : "Email"}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <select onChange={(e) => setRole(e.target.value)}>
            <option value="">Select Role</option>
            <option value="donor">Donor</option>
            <option value="recipient">Recipient</option>
            <option value="admin">Admin</option>
            <option value="logistics">Logistics</option>
          </select>

          {/* 🔥 CAPTCHA UI */}
          <div className="captcha-wrap">
            <div className="captcha-row">
              <div className="captcha-box">{captcha}</div>
              <button
                type="button"
                className="captcha-refresh-icon"
                onClick={generateCaptcha}
                aria-label="Refresh captcha"
                title="Refresh captcha"
              >
                ↻
              </button>
            </div>

            <input
              placeholder="Enter Captcha"
              value={userCaptcha}
              onChange={(e) => setUserCaptcha(e.target.value)}
            />
          </div>

          {/* 🔥 LOGIN BUTTON (INSIDE CARD) */}
          <button type="button" className="login-btn" onClick={handleLogin}>
            Login
          </button>

          <button
            className="forgot-link-btn"
            type="button"
            onClick={() => navigate("/forgot-password")}
          >
            Forgot Password?
          </button>

          {/* Sign Up Link */}
          <p style={{ marginTop: "20px", color: "#666", fontSize: "14px" }}>
            Don't have an account?{" "}
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                navigate("/signup");
              }}
              style={{
                color: "#0e64bb",
                textDecoration: "none",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              Sign up
            </a>
          </p>
        </div>
      </div>
    </>
  );
}
