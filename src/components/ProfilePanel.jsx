import { useMemo, useState } from "react";
import API from "../api/axios";
import "../styles/profile.css";

const roleConfig = {
  admin: {
    idKeys: ["adminId", "id", "username"],
    fields: ["username", "password"],
    endpoints: [
      { method: "put", url: "/adminapi/updateprofile" },
      { method: "post", url: "/adminapi/updateprofile" },
      { method: "put", url: "/adminapi/update" },
    ],
  },
  donor: {
    idKeys: ["donorId", "id"],
    fields: ["name", "email", "phoneNumber", "address"],
    endpoints: [
      { method: "put", url: "/donorapi/updateprofile" },
      { method: "post", url: "/donorapi/updateprofile" },
      { method: "put", url: "/donorapi/update" },
    ],
  },
  recipient: {
    idKeys: ["recipientId", "id"],
    fields: ["name", "email", "phoneNumber", "location"],
    endpoints: [
      { method: "put", url: "/recipient/updateprofile" },
      { method: "post", url: "/recipient/updateprofile" },
      { method: "put", url: "/recipient/update" },
    ],
  },
  logistics: {
    idKeys: ["id", "coordinatorId"],
    fields: ["name", "email", "phoneNumber", "transportType"],
    endpoints: [
      { method: "put", url: "/logisticsapi/updateprofile" },
      { method: "post", url: "/logisticsapi/updateprofile" },
      { method: "put", url: "/logisticsapi/update" },
    ],
  },
};

function normalizeUser(user) {
  const raw = user?.raw || {};
  return {
    username: user?.username || raw.username || "",
    password: "",
    name: user?.name || user?.username || raw.name || raw.username || "",
    email: user?.email || raw.email || "",
    phoneNumber: raw.phoneNumber || raw.phone || "",
    address: raw.address || raw.location || "",
    location: raw.location || raw.address || "",
    transportType: raw.transportType || "",
  };
}

async function tryEndpoints(endpoints, payload) {
  let lastError;

  for (const endpoint of endpoints) {
    try {
      if (endpoint.method === "put") {
        const res = await API.put(endpoint.url, payload);
        return res;
      }

      const res = await API.post(endpoint.url, payload);
      return res;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error("Profile update failed.");
}

export default function ProfilePanel({ role }) {
  const savedUser = JSON.parse(localStorage.getItem("user"));
  const config = roleConfig[role] || roleConfig.recipient;
  const normalized = useMemo(() => normalizeUser(savedUser), [savedUser]);

  const [form, setForm] = useState(() => ({
    username: normalized.username,
    password: normalized.password,
    name: normalized.name,
    email: normalized.email,
    phoneNumber: normalized.phoneNumber,
    address: normalized.address,
    location: normalized.location,
    transportType: normalized.transportType,
  }));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const roleId = useMemo(() => {
    for (const key of config.idKeys) {
      const value = savedUser?.[key] ?? savedUser?.raw?.[key];
      if (value !== undefined && value !== null && value !== "") {
        return value;
      }
    }
    return "";
  }, [config.idKeys, savedUser]);

  const roleFieldAlias = role === "recipient" ? "location" : "address";

  const payload = {
    ...savedUser?.raw,
    ...form,
    [roleFieldAlias]: form[roleFieldAlias] || "",
    role: (role || "").toUpperCase(),
  };

  if (role === "admin") {
    payload.username = form.username;
    payload.password = form.password;
    payload.pwd = form.password;
  }

  config.idKeys.forEach((key) => {
    if (roleId) {
      payload[key] = roleId;
    }
  });

  const onSave = async (event) => {
    event.preventDefault();

    if (role === "admin") {
      if (!form.username.trim() || !form.password.trim()) {
        setMessage({
          type: "error",
          text: "Username and password are required to update admin profile.",
        });
        return;
      }
    } else if (!form.name.trim() || !form.email.trim()) {
      setMessage({
        type: "error",
        text: "Name and email are required to update profile.",
      });
      return;
    }

    setSaving(true);

    try {
      const res = await tryEndpoints(config.endpoints, payload);
      const data = res?.data || {};

      const nextUser = {
        ...savedUser,
        username:
          role === "admin"
            ? data.username || form.username
            : savedUser?.username,
        name:
          role === "admin"
            ? data.username || form.username
            : data.name || form.name,
        email:
          role === "admin"
            ? savedUser?.email || data.email || form.username
            : data.email || form.email,
        raw: {
          ...savedUser?.raw,
          ...payload,
          ...data,
        },
      };

      localStorage.setItem("user", JSON.stringify(nextUser));
      setMessage({
        type: "success",
        text: "Profile updated successfully. Changes are synced with your role table.",
      });
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error?.response?.data?.message ||
          error?.response?.data ||
          "Unable to update profile right now.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="profile-page-wrap">
      <div className="profile-page-card">
        <div className="profile-page-head">
          <p>Account profile</p>
          <h2>{(role || "user").toUpperCase()} Profile</h2>
          <span>
            Auto-filled from login details. Edit and save to update role-wise
            data.
          </span>
        </div>

        {message.text && (
          <div className={`profile-message ${message.type || "info"}`}>
            {message.text}
          </div>
        )}

        <form className="profile-form" onSubmit={onSave}>
          {config.fields.includes("username") && (
            <label>
              Username
              <input
                value={form.username}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    username: event.target.value,
                  }))
                }
                placeholder="Enter admin username"
              />
            </label>
          )}

          {config.fields.includes("password") && (
            <label>
              Password
              <input
                type="password"
                value={form.password}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    password: event.target.value,
                  }))
                }
                placeholder="Enter admin password"
              />
            </label>
          )}

          {config.fields.includes("name") && (
            <label>
              Full Name
              <input
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                placeholder="Enter full name"
              />
            </label>
          )}

          {config.fields.includes("email") && (
            <label>
              Email
              <input
                type="email"
                value={form.email}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    email: event.target.value,
                  }))
                }
                placeholder="Enter email"
              />
            </label>
          )}

          {config.fields.includes("phoneNumber") && (
            <label>
              Phone Number
              <input
                value={form.phoneNumber}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    phoneNumber: event.target.value,
                  }))
                }
                placeholder="Enter phone number"
              />
            </label>
          )}

          {config.fields.includes("address") && (
            <label>
              Address
              <textarea
                rows="3"
                value={form.address}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    address: event.target.value,
                  }))
                }
                placeholder="Enter address"
              />
            </label>
          )}

          {config.fields.includes("location") && (
            <label>
              Location
              <textarea
                rows="3"
                value={form.location}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    location: event.target.value,
                  }))
                }
                placeholder="Enter location"
              />
            </label>
          )}

          {config.fields.includes("transportType") && (
            <label>
              Transport Type
              <input
                value={form.transportType}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    transportType: event.target.value,
                  }))
                }
                placeholder="Bike, Van, Truck..."
              />
            </label>
          )}

          <button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save Profile"}
          </button>
        </form>
      </div>
    </div>
  );
}
