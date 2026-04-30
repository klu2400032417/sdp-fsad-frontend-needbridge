import { useState } from "react";
import "../styles/layout.css";

export default function Header({ role, setSection }) {
  const [showMenu, setShowMenu] = useState(false);

  const user = JSON.parse(localStorage.getItem("user"));
  const canShowProfile = Boolean(role);

  const roleLabelMap = {
    admin: "ADMIN",
    recipient: "RECIPIENT",
    donor: "DONOR",
    logistics: "COORDINATOR",
  };

  const roleLabel = roleLabelMap[role] || "";

  return (
    <div className="navbar">
      {/* ================= LEFT LOGO ================= */}
      <div className="logo-container">
        <img src="/logo.png" className="app-logo" alt="logo" />

        <h2 className="app-title">
          <span className="need">Need</span>
          <span className="bridge">Bridge</span>
        </h2>
      </div>

      {/* ================= NAV BUTTONS ================= */}

      {/* ADMIN */}
      {role === "admin" && (
        <div className="nav-links">
          <button onClick={() => setSection("home")}>Home</button>
          <button onClick={() => setSection("donors")}>Donors</button>
          <button onClick={() => setSection("recipients")}>Recipients</button>
          <button onClick={() => setSection("coordinators")}>
            Coordinators
          </button>
          <button onClick={() => setSection("add")}>Add Coordinator</button>
        </div>
      )}

      {/* DONOR */}
      {role === "donor" && (
        <div className="nav-links">
          <button onClick={() => setSection("home")}>Home</button>
          <button onClick={() => setSection("add")}>Add Donation</button>
          <button onClick={() => setSection("view")}>My Donations</button>
          <button onClick={() => setSection("status")}>Status</button>
        </div>
      )}

      {/* RECIPIENT */}
      {role === "recipient" && (
        <div className="nav-links">
          <button onClick={() => setSection("home")}>Home</button>
          <button onClick={() => setSection("request")}>Request Item</button>
          <button onClick={() => setSection("view")}>My Requests</button>
          <button onClick={() => setSection("status")}>Status</button>
          <button onClick={() => setSection("feedback")}>Feedback</button>
        </div>
      )}

      {/* LOGISTICS */}
      {role === "logistics" && (
        <div className="nav-links">
          <button onClick={() => setSection("home")}>Home</button>
          <button onClick={() => setSection("recipients")}>Recipient</button>
          <button onClick={() => setSection("donors")}>Donors</button>
          <button onClick={() => setSection("tasks")}>Tasks</button>
          <button onClick={() => setSection("details")}>Details</button>
        </div>
      )}

      {/* ================= PROFILE ================= */}
      {canShowProfile && (
        <div className="profile" onClick={() => setShowMenu(!showMenu)}>
          <div className="profile-stack">
            <div className="avatar">
              {user?.name?.charAt(0) || user?.username?.charAt(0) || "A"}
            </div>
            <span className="role-under-avatar">{roleLabel}</span>
          </div>

          {showMenu && (
            <div className="dropdown">
              <p
                onClick={() => {
                  if (setSection) {
                    setSection("profile");
                  }
                  setShowMenu(false);
                }}
              >
                Profile
              </p>
              <p
                onClick={() => {
                  localStorage.clear();
                  window.location.href = "/login";
                }}
              >
                Logout
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
