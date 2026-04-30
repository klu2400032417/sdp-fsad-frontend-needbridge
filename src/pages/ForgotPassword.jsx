import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Header from "../components/Header";
import API from "../api/axios";
import "../styles/login.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const endpointMap = {
  recipient: [
    "/recipient/forgotpassword",
    "/recipient/resetpassword",
    "/recipient/reset-password",
    "/recipient/resetpwd",
    "/recipient/changepassword",
    "/recipient/updatepassword",
    "/recipient/update-password",
  ],
  donor: [
    "/donorapi/forgotpassword",
    "/donorapi/resetpassword",
    "/donorapi/reset-password",
    "/donorapi/resetpwd",
    "/donorapi/changepassword",
    "/donorapi/updatepassword",
    "/donorapi/update-password",
  ],
  logistics: [
    "/logisticsapi/forgotpassword",
    "/logisticsapi/resetpassword",
    "/logisticsapi/reset-password",
    "/logisticsapi/resetpwd",
    "/logisticsapi/changepassword",
    "/logisticsapi/updatepassword",
    "/logisticsapi/update-password",
  ],
  admin: [
    "/adminapi/forgotpassword",
    "/adminapi/resetpassword",
    "/adminapi/reset-password",
    "/adminapi/resetpwd",
    "/adminapi/changepassword",
    "/adminapi/updatepassword",
    "/adminapi/update-password",
  ],
};

const roleBaseMap = {
  recipient: "/recipient",
  donor: "/donorapi",
  logistics: "/logisticsapi",
  admin: "/adminapi",
};

async function submitAcrossVariants(urls, body) {
  let lastError = null;

  for (const url of urls) {
    for (const method of ["post", "put", "patch"]) {
      try {
        if (method === "post") {
          await API.post(url, body);
        } else if (method === "put") {
          await API.put(url, body);
        } else {
          await API.patch(url, body);
        }

        return url;
      } catch (error) {
        lastError = error;
      }
    }
  }

  throw lastError || new Error("No variant worked");
}

export default function ForgotPassword() {
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({
    role: "",
    email: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const resetToken = searchParams.get("token") || "";
  const prefilledRole = searchParams.get("role") || "";
  const prefilledEmail = searchParams.get("email") || "";
  const isResetMode = Boolean(resetToken);

  useEffect(() => {
    if (prefilledRole || prefilledEmail) {
      setForm((current) => ({
        ...current,
        role: prefilledRole || current.role,
        email: prefilledEmail || current.email,
      }));
    }
  }, [prefilledRole, prefilledEmail]);

  const handleSubmit = async () => {
    const identifier = form.email.trim();

    if (!form.role || !identifier) {
      toast.error("Please select role and enter email.", {
        autoClose: 6000,
      });
      return;
    }

    const dynamicBase = roleBaseMap[form.role] || "";
    const urls = [
      ...(endpointMap[form.role] || []),
      `${dynamicBase}/updateprofile`,
      `${dynamicBase}/updatepasswordbyemail`,
      `${dynamicBase}/resetpasswordbyemail`,
      `${dynamicBase}/changepasswordbyemail`,
    ].filter(Boolean);

    if (urls.length === 0) {
      toast.error("No reset endpoint configured for selected role.", {
        autoClose: 6000,
      });
      return;
    }

    setSaving(true);

    try {
      if (!isResetMode) {
        const payload = {
          role: form.role.toUpperCase(),
          email: identifier,
          username: identifier,
        };

        await submitAcrossVariants(urls, payload);

        toast.success("Reset link sent to your email inbox.", {
          autoClose: 6000,
        });

        return;
      }

      if (!form.newPassword || !form.confirmPassword) {
        toast.error("Please enter the new password and confirm it.", {
          autoClose: 6000,
        });
        return;
      }

      if (form.newPassword !== form.confirmPassword) {
        toast.error("New password and confirm password do not match.", {
          autoClose: 6000,
        });
        return;
      }

      const payload = {
        role: form.role.toUpperCase(),
        email: identifier,
        username: identifier,
        token: resetToken,
        password: form.newPassword,
        newPassword: form.newPassword,
        confirmPassword: form.confirmPassword,
        pwd: form.newPassword,
        cpwd: form.confirmPassword,
      };

      await submitAcrossVariants(urls, payload);

      toast.success("Password updated successfully. Please login.", {
        autoClose: 6000,
      });

      setTimeout(() => {
        navigate("/login");
      }, 900);
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
          error?.response?.data ||
          "Unable to update password right now.",
        {
          autoClose: 6000,
        },
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Header />
      <ToastContainer position="top-right" pauseOnHover={true} />

      <div className="login-container">
        <div className="login-card">
          <h2>{isResetMode ? "Reset Password" : "Forgot Password"}</h2>

          {!isResetMode && (
            <p
              style={{ marginBottom: "16px", color: "#666", fontSize: "14px" }}
            >
              Enter your role and registered email. A reset link will be sent to
              your inbox.
            </p>
          )}

          <select
            value={form.role}
            onChange={(event) => setForm({ ...form, role: event.target.value })}
            disabled={isResetMode}
          >
            <option value="">Select Role</option>
            <option value="donor">Donor</option>
            <option value="recipient">Recipient</option>
            <option value="admin">Admin</option>
            <option value="logistics">Logistics</option>
          </select>

          <input
            type="email"
            placeholder="Registered Email"
            value={form.email}
            onChange={(event) =>
              setForm({ ...form, email: event.target.value })
            }
            disabled={isResetMode}
          />

          {isResetMode && (
            <>
              <input
                type="password"
                placeholder="New Password"
                value={form.newPassword}
                onChange={(event) =>
                  setForm({ ...form, newPassword: event.target.value })
                }
              />

              <input
                type="password"
                placeholder="Confirm New Password"
                value={form.confirmPassword}
                onChange={(event) =>
                  setForm({ ...form, confirmPassword: event.target.value })
                }
              />
            </>
          )}

          <button
            className="login-btn"
            type="button"
            onClick={handleSubmit}
            disabled={saving}
          >
            {saving
              ? isResetMode
                ? "Updating..."
                : "Sending Link..."
              : isResetMode
                ? "Update Password"
                : "Send Reset Link"}
          </button>

          <p style={{ marginTop: "20px", color: "#666", fontSize: "14px" }}>
            Back to login?{" "}
            <a
              href="#"
              onClick={(event) => {
                event.preventDefault();
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
