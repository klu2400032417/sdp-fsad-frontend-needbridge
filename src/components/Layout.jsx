import { Outlet } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import { useState, useEffect } from "react";
import ProfilePanel from "./ProfilePanel";

export default function Layout() {
  const [section, setSection] = useState("home");
  const [role, setRole] = useState("");

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user?.role) {
      setRole(user.role);
    }
  }, []);

  return (
    <div className="app-container">
      <Header role={role} setSection={setSection} />

      <div className="main-content">
        {section === "profile" ? (
          <ProfilePanel role={role} />
        ) : (
          <Outlet context={{ section }} />
        )}
      </div>

      <Footer />
    </div>
  );
}
