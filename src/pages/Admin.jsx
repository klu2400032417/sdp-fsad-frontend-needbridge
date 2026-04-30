import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import API from "../api/axios";
import "../styles/admin.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const initialCoordinatorForm = {
  name: "",
  email: "",
  phoneNumber: "",
  transportType: "",
  route: "",
  password: "Lg@12345",
};

const pickText = (...values) => {
  for (const value of values) {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return value;
    }
  }
  return "";
};

const pickNumber = (...values) => {
  for (const value of values) {
    if (value !== undefined && value !== null && value !== "") {
      return value;
    }
  }
  return null;
};

const asArray = (...values) => {
  for (const value of values) {
    if (Array.isArray(value) && value.length > 0) {
      return value;
    }
  }
  return [];
};

const expandRecords = (record) => {
  const nested = [
    record,
    record.request,
    record.requestItem,
    record.donation,
    record.donationItem,
    ...asArray(
      record.requests,
      record.requestList,
      record.recipientRequests,
      record.needRequests,
      record.donations,
      record.donationList,
      record.donorDonations,
    ),
  ];

  return nested.filter(Boolean);
};

const getItemName = (record) => {
  const expanded = expandRecords(record);

  for (const row of expanded) {
    const item = pickText(
      row.itemName,
      row.item_name,
      row.item,
      row.itemLabel,
      row.item_label,
      row.requestItemName,
      row.request_item_name,
      row.resourceName,
      row.resource_name,
      row.item,
      row.productName,
      row.product_name,
      row.needName,
      row.need_name,
      row.title,
    );

    if (item) {
      return item;
    }
  }

  return "Not provided";
};

const getQuantity = (record) => {
  const expanded = expandRecords(record);

  for (const row of expanded) {
    const quantity = pickNumber(
      row.quantity,
      row.itemQuantity,
      row.item_quantity,
      row.qty,
      row.requestedQuantity,
      row.request_quantity,
      row.noOfItems,
      row.no_of_items,
      row.totalQuantity,
      row.total_quantity,
      row.totalItems,
      row.total_items,
    );

    if (quantity !== null) {
      return quantity;
    }
  }

  return "Not provided";
};

const getRequestStatus = (record) => {
  return pickText(
    record.requestStatus,
    record.status,
    record.approvalStatus,
    record.adminStatus,
    record.request?.requestStatus,
    record.request?.status,
  );
};

const getRequestId = (record) => {
  return pickText(
    record.requestId,
    record.reqId,
    record.request_id,
    record.request?.requestId,
    record.request?.request_id,
    record.request?.id,
  );
};

export default function Admin() {
  const context = useOutletContext();
  const section = context?.section || "home";

  const user = JSON.parse(localStorage.getItem("user"));

  const [donors, setDonors] = useState([]);
  const [recipients, setRecipients] = useState([]);
  const [coordinators, setCoordinators] = useState([]);
  const [newCoord, setNewCoord] = useState(initialCoordinatorForm);
  const [loadingData, setLoadingData] = useState(false);
  const [addingCoordinator, setAddingCoordinator] = useState(false);
  const [deletingCoordinatorId, setDeletingCoordinatorId] = useState(null);
  const [coordinatorWorkMap, setCoordinatorWorkMap] = useState({});
  const [recipientStatusDrafts, setRecipientStatusDrafts] = useState({});
  const [updatingRecipientId, setUpdatingRecipientId] = useState(null);

  const generateSamplePassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#$";
    let password = "";
    for (let i = 0; i < 10; i += 1) {
      password += chars[Math.floor(Math.random() * chars.length)];
    }
    return password;
  };

  const loadData = async () => {
    setLoadingData(true);

    try {
      const d = await API.get("/adminapi/viewalldonor");
      const r = await API.get("/adminapi/viewallrecipient");
      const c = await API.get("/adminapi/viewalllogisticscoordinator");
      let logisticsEntries = [];

      try {
        const l = await API.get("/logisticsapi/viewalllogistics");
        logisticsEntries = Array.isArray(l.data) ? l.data : [];
      } catch {
        logisticsEntries = [];
      }

      setDonors(Array.isArray(d.data) ? d.data : []);
      setRecipients(Array.isArray(r.data) ? r.data : []);
      setCoordinators(Array.isArray(c.data) ? c.data : []);

      const workMap = {};
      logisticsEntries.forEach((entry) => {
        const coordinatorId =
          entry.coordinatorId ||
          entry.logisticsCoordinatorId ||
          entry.logisticsCoordinator?.id;

        if (coordinatorId !== undefined && coordinatorId !== null) {
          const key = String(coordinatorId);
          workMap[key] = (workMap[key] || 0) + 1;
        }
      });

      setCoordinatorWorkMap(workMap);
    } catch {
      toast.error("Unable to load admin dashboard data.", {
        autoClose: 6000,
      });
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (["home", "donors", "recipients", "coordinators"].includes(section)) {
      loadData();
    }
  }, [section]);

  useEffect(() => {
    const drafts = {};
    recipients.forEach((recipient) => {
      const requestRows = asArray(
        recipient.requests,
        recipient.requestList,
        recipient.recipientRequests,
        recipient.needRequests,
      );

      if (requestRows.length === 0) {
        const recipientId = recipient.recipientId || recipient.id;
        const requestId = getRequestId(recipient) || "none";
        drafts[`${recipientId}-${requestId}`] =
          getRequestStatus(recipient) || "PENDING";
        return;
      }

      requestRows.forEach((request) => {
        const recipientId = recipient.recipientId || recipient.id;
        const requestId =
          request.requestId || request.request_id || request.id || "none";
        drafts[`${recipientId}-${requestId}`] =
          getRequestStatus({ ...recipient, request }) || "PENDING";
      });
    });
    setRecipientStatusDrafts(drafts);
  }, [recipients]);

  const pendingDonorCount = useMemo(() => {
    return donors.filter((donor) => {
      const status = String(donor.deliveryStatus || "pending").toLowerCase();
      return status === "pending" || status === "in transit";
    }).length;
  }, [donors]);

  const activeRecipientCount = useMemo(() => {
    return recipients.filter((recipient) => {
      const status = String(recipient.requestStatus || "pending").toLowerCase();
      return status === "pending" || status === "approved";
    }).length;
  }, [recipients]);

  const addCoordinator = async () => {
    if (
      !newCoord.name.trim() ||
      !newCoord.email.trim() ||
      !newCoord.phoneNumber.trim() ||
      !newCoord.password.trim()
    ) {
      toast.error("Name, email, phone and sample password are required.", {
        autoClose: 6000,
      });
      return;
    }

    setAddingCoordinator(true);

    try {
      const payload = {
        ...newCoord,
        role: "LOGISTICS",
        pwd: newCoord.password,
      };

      await API.post("/adminapi/addlogisticcoordinator", payload);

      toast.success("Logistics coordinator added successfully.", {
        autoClose: 6000,
      });

      setNewCoord(initialCoordinatorForm);
      await loadData();
    } catch {
      toast.error("Unable to add logistics coordinator.", {
        autoClose: 6000,
      });
    } finally {
      setAddingCoordinator(false);
    }
  };

  const deleteCoordinator = async (id) => {
    setDeletingCoordinatorId(id);

    try {
      await API.delete(`/adminapi/deletelogisticscoordinator/${id}`);

      toast.success("Coordinator removed successfully.", {
        autoClose: 6000,
      });

      await loadData();
    } catch {
      toast.error("Unable to delete coordinator.", {
        autoClose: 6000,
      });
    } finally {
      setDeletingCoordinatorId(null);
    }
  };

  const updateRecipientRequestStatus = async (recipientRow) => {
    const recipientId = recipientRow.recipientId || recipientRow.id;
    const requestId = getRequestId(recipientRow);
    const mapKey =
      recipientRow.__rowKey || `${recipientId}-${requestId || "none"}`;
    const draftStatus = recipientStatusDrafts[mapKey] || "PENDING";

    const payload = {
      recipientId,
      requestId,
      requestStatus: draftStatus,
      status: draftStatus,
      approvalStatus: draftStatus,
      adminStatus: draftStatus,
    };

    const variants = [
      { method: "put", url: "/adminapi/updaterecipientrequeststatus" },
      { method: "post", url: "/adminapi/updaterecipientrequeststatus" },
      { method: "put", url: "/adminapi/updaterequeststatus" },
      { method: "post", url: "/adminapi/updaterequeststatus" },
      { method: "post", url: "/adminapi/verifyrecipientrequest" },
      { method: "post", url: "/adminapi/approverequest" },
    ];

    setUpdatingRecipientId(mapKey);

    try {
      let success = false;

      for (const variant of variants) {
        try {
          if (variant.method === "put") {
            await API.put(variant.url, payload);
          } else {
            await API.post(variant.url, payload);
          }
          success = true;
          break;
        } catch {
          try {
            await API.post(variant.url, null, { params: payload });
            success = true;
            break;
          } catch {
            // Try next variant.
          }
        }
      }

      if (!success) {
        throw new Error("Status update failed");
      }

      toast.success("Recipient request status updated.", {
        autoClose: 6000,
      });
      await loadData();
    } catch {
      toast.error("Unable to update recipient request status.", {
        autoClose: 6000,
      });
    } finally {
      setUpdatingRecipientId(null);
    }
  };

  const donorTableRows = donors.flatMap((donor) => {
    const donationRows = asArray(
      donor.donations,
      donor.donationList,
      donor.donorDonations,
    );

    if (donationRows.length === 0) {
      return [donor];
    }

    return donationRows.map((donation) => ({ ...donor, donation }));
  });

  const recipientTableRows = recipients.flatMap((recipient) => {
    const requestRows = asArray(
      recipient.requests,
      recipient.requestList,
      recipient.recipientRequests,
      recipient.needRequests,
    );

    if (requestRows.length === 0) {
      return [recipient];
    }

    return requestRows.map((request) => ({ ...recipient, request }));
  });

  const donorRows = donorTableRows.map((donor) => {
    const donorId = donor.donorId || donor.id;
    const status = String(donor.deliveryStatus || "Pending");
    const donorItem = getItemName(donor);
    const donorQuantity = getQuantity(donor);

    return (
      <tr key={donorId}>
        <td>{donorId || "-"}</td>
        <td>{donor.name || "N/A"}</td>
        <td>{donor.email || "N/A"}</td>
        <td>{donorItem}</td>
        <td>{donorQuantity}</td>
        <td>
          <span
            className={`admin-status-pill ${status.toLowerCase().replace(/\s+/g, "-")}`}
          >
            {status}
          </span>
        </td>
      </tr>
    );
  });

  const recipientRows = recipientTableRows.map((recipient) => {
    const recipientId = recipient.recipientId || recipient.id;
    const requestId = getRequestId(recipient);
    const status = getRequestStatus(recipient) || "Pending";
    const item = getItemName(recipient);
    const quantity = getQuantity(recipient);
    const mapKey = `${recipientId}-${requestId || "none"}`;

    return (
      <tr key={mapKey}>
        <td>{recipientId || "-"}</td>
        <td>{requestId || "-"}</td>
        <td>{recipient.name || "N/A"}</td>
        <td>{recipient.email || "N/A"}</td>
        <td>{item}</td>
        <td>{quantity}</td>
        <td>
          <span
            className={`admin-status-pill ${String(status).toLowerCase().replace(/\s+/g, "-")}`}
          >
            {status}
          </span>
        </td>
        <td>
          <div className="admin-table-actions">
            <select
              className="admin-status-select"
              value={recipientStatusDrafts[mapKey] || "PENDING"}
              onChange={(event) =>
                setRecipientStatusDrafts((current) => ({
                  ...current,
                  [mapKey]: event.target.value,
                }))
              }
            >
              <option value="PENDING">PENDING</option>
              <option value="IN_STAGES">IN_STAGES</option>
              <option value="IN_STAGE">IN_STAGE</option>
              <option value="ACCEPTED">ACCEPTED</option>
            </select>
            <button
              type="button"
              className="admin-secondary-button"
              onClick={() => updateRecipientRequestStatus(recipient)}
              disabled={updatingRecipientId === mapKey}
            >
              {updatingRecipientId === mapKey ? "Saving..." : "Save"}
            </button>
          </div>
        </td>
      </tr>
    );
  });

  const coordinatorCards = coordinators.map((coordinator) => {
    const coordinatorId = coordinator.id || coordinator.coordinatorId;
    const assignedWorkCount = coordinatorWorkMap[String(coordinatorId)] || 0;
    const isWorking = assignedWorkCount > 0;

    return (
      <article key={coordinatorId} className="admin-entity-card">
        <div className="admin-entity-card-header">
          <div>
            <p className="admin-card-label">Coordinator ID</p>
            <h3>#{coordinatorId}</h3>
          </div>
          <span className="admin-status-pill active">Active</span>
        </div>

        <div className="admin-entity-meta">
          <div>
            <span>Name</span>
            <strong>{coordinator.name || "N/A"}</strong>
          </div>
          <div>
            <span>Email</span>
            <strong>{coordinator.email || "N/A"}</strong>
          </div>
          <div>
            <span>Phone</span>
            <strong>{coordinator.phoneNumber || "N/A"}</strong>
          </div>
          <div>
            <span>Transport</span>
            <strong>{coordinator.transportType || "Not Assigned"}</strong>
          </div>
          <div>
            <span>Route</span>
            <strong>{coordinator.route || "Not Assigned"}</strong>
          </div>
          <div>
            <span>Assigned Work</span>
            <strong>{assignedWorkCount}</strong>
          </div>
        </div>

        <button
          className={`admin-danger-button ${isWorking ? "blocked" : ""}`}
          type="button"
          onClick={() => deleteCoordinator(coordinatorId)}
          disabled={deletingCoordinatorId === coordinatorId || isWorking}
        >
          {deletingCoordinatorId === coordinatorId
            ? "Removing..."
            : isWorking
              ? "In Service - Cannot Delete"
              : "Delete Coordinator"}
        </button>
      </article>
    );
  });

  return (
    <div className="admin-container">
      <ToastContainer position="top-right" pauseOnHover={true} />

      <div className="admin-shell">
        {section === "home" && (
          <section className="admin-hero-card">
            <div className="admin-hero-copy">
              <p className="admin-eyebrow">Admin dashboard</p>
              <h1>Welcome back, {user?.username || "Admin"}</h1>
              <p>
                Monitor donors, recipients, and logistics coordinators in one
                centered module, and manage coordinator onboarding from service
                cards.
              </p>
            </div>

            <div className="admin-profile-card">
              <p className="admin-card-label">Admin profile</p>
              <strong>{user?.email || user?.username || "Admin"}</strong>
              <span>Role: ADMIN</span>
            </div>
          </section>
        )}

        {section === "home" && (
          <>
            <section className="admin-stats-grid">
              <article className="admin-stat-card accent-blue">
                <span>Donors</span>
                <strong>{donors.length}</strong>
                <p>Total registered donors</p>
              </article>
              <article className="admin-stat-card accent-gold">
                <span>Recipients</span>
                <strong>{recipients.length}</strong>
                <p>Total registered recipients</p>
              </article>
              <article className="admin-stat-card accent-green">
                <span>Coordinators</span>
                <strong>{coordinators.length}</strong>
                <p>Active logistics coordinators</p>
              </article>
            </section>

            <section className="admin-stats-grid">
              <article className="admin-stat-card accent-blue">
                <span>Donor Pending</span>
                <strong>{pendingDonorCount}</strong>
                <p>Donor deliveries in progress</p>
              </article>
              <article className="admin-stat-card accent-gold">
                <span>Recipient Active</span>
                <strong>{activeRecipientCount}</strong>
                <p>Current recipient demand</p>
              </article>
            </section>
          </>
        )}

        {section === "donors" && (
          <section className="admin-card">
            <div className="admin-card-heading">
              <div>
                <p className="admin-card-label">Donor service</p>
                <h2>View All Donors</h2>
              </div>
              <button
                type="button"
                className="admin-secondary-button"
                onClick={loadData}
              >
                {loadingData ? "Refreshing..." : "Refresh"}
              </button>
            </div>

            {loadingData ? (
              <div className="admin-empty-state">Loading donors...</div>
            ) : donorRows.length === 0 ? (
              <div className="admin-empty-state">
                No donor records available.
              </div>
            ) : (
              <div className="admin-table-wrap">
                <table className="admin-data-table">
                  <thead>
                    <tr>
                      <th>Donor ID</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Item Name</th>
                      <th>Quantity</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>{donorRows}</tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {section === "recipients" && (
          <section className="admin-card">
            <div className="admin-card-heading">
              <div>
                <p className="admin-card-label">Recipient service</p>
                <h2>View All Recipients & Verify Requests</h2>
              </div>
              <button
                type="button"
                className="admin-secondary-button"
                onClick={loadData}
              >
                {loadingData ? "Refreshing..." : "Refresh"}
              </button>
            </div>

            {loadingData ? (
              <div className="admin-empty-state">Loading recipients...</div>
            ) : recipientRows.length === 0 ? (
              <div className="admin-empty-state">
                No recipient records available.
              </div>
            ) : (
              <div className="admin-table-wrap">
                <table className="admin-data-table">
                  <thead>
                    <tr>
                      <th>Recipient ID</th>
                      <th>Request ID</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Item</th>
                      <th>Quantity</th>
                      <th>Current Status</th>
                      <th>Admin Action</th>
                    </tr>
                  </thead>
                  <tbody>{recipientRows}</tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {section === "coordinators" && (
          <section className="admin-card">
            <div className="admin-card-heading">
              <div>
                <p className="admin-card-label">Coordinator service</p>
                <h2>View All Logistics Coordinators</h2>
              </div>
              <button
                type="button"
                className="admin-secondary-button"
                onClick={loadData}
              >
                {loadingData ? "Refreshing..." : "Refresh"}
              </button>
            </div>

            {loadingData ? (
              <div className="admin-empty-state">Loading coordinators...</div>
            ) : coordinatorCards.length === 0 ? (
              <div className="admin-empty-state">
                No coordinator records available.
              </div>
            ) : (
              <div className="admin-entity-grid">{coordinatorCards}</div>
            )}
          </section>
        )}

        {section === "add" && (
          <section className="admin-single-column">
            <article className="admin-card">
              <div className="admin-card-heading">
                <div>
                  <p className="admin-card-label">Coordinator onboarding</p>
                  <h2>Add Logistics Coordinator</h2>
                </div>
                <span className="admin-card-subtitle">
                  Backend: /adminapi/addlogisticcoordinator
                </span>
              </div>

              <div className="admin-form-grid">
                <div className="admin-field">
                  <label htmlFor="coordName">Name</label>
                  <input
                    id="coordName"
                    value={newCoord.name}
                    onChange={(event) =>
                      setNewCoord({ ...newCoord, name: event.target.value })
                    }
                    placeholder="Coordinator full name"
                  />
                </div>

                <div className="admin-field">
                  <label htmlFor="coordEmail">Email</label>
                  <input
                    id="coordEmail"
                    value={newCoord.email}
                    onChange={(event) =>
                      setNewCoord({ ...newCoord, email: event.target.value })
                    }
                    placeholder="Coordinator email"
                  />
                </div>

                <div className="admin-field">
                  <label htmlFor="coordPhone">Phone</label>
                  <input
                    id="coordPhone"
                    value={newCoord.phoneNumber}
                    onChange={(event) =>
                      setNewCoord({
                        ...newCoord,
                        phoneNumber: event.target.value,
                      })
                    }
                    placeholder="Coordinator phone"
                  />
                </div>

                <div className="admin-field">
                  <label htmlFor="coordTransport">Transport Type</label>
                  <input
                    id="coordTransport"
                    value={newCoord.transportType}
                    onChange={(event) =>
                      setNewCoord({
                        ...newCoord,
                        transportType: event.target.value,
                      })
                    }
                    placeholder="Bike / Van / Truck"
                  />
                </div>

                <div className="admin-field full-width">
                  <label htmlFor="coordRoute">Route</label>
                  <input
                    id="coordRoute"
                    value={newCoord.route}
                    onChange={(event) =>
                      setNewCoord({ ...newCoord, route: event.target.value })
                    }
                    placeholder="Route assignment"
                  />
                </div>

                <div className="admin-field">
                  <label htmlFor="coordPassword">Sample Password</label>
                  <input
                    id="coordPassword"
                    type="text"
                    value={newCoord.password}
                    onChange={(event) =>
                      setNewCoord({ ...newCoord, password: event.target.value })
                    }
                    placeholder="Set login password for coordinator"
                  />
                </div>

                <button
                  className="admin-secondary-button"
                  type="button"
                  onClick={() =>
                    setNewCoord((current) => ({
                      ...current,
                      password: generateSamplePassword(),
                    }))
                  }
                >
                  Generate Sample Password
                </button>

                <button
                  className="admin-primary-button full-width"
                  type="button"
                  onClick={addCoordinator}
                  disabled={addingCoordinator}
                >
                  {addingCoordinator ? "Adding..." : "Add Coordinator"}
                </button>
              </div>
            </article>
          </section>
        )}
      </div>
    </div>
  );
}
