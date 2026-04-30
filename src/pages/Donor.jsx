import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import axios from "../api/axios";
import "../styles/donor.css";
import "react-toastify/dist/ReactToastify.css";

const initialDonationForm = {
  donationCategory: "",
  itemName: "",
  itemDescription: "",
  quantity: "",
  itemCondition: "",
  availabilityDate: "",
  expiryDate: "",
};

const itemCategoryOptions = [
  "Food",
  "Clothes",
  "Medicine",
  "Books",
  "Water",
  "Hygiene",
  "Shelter",
  "Baby Care",
  "Educational",
  "Other",
];

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

const findNestedValue = (record, keyPattern, visited = new WeakSet()) => {
  if (!record || typeof record !== "object") {
    return "";
  }

  if (visited.has(record)) {
    return "";
  }

  visited.add(record);

  for (const [rawKey, rawValue] of Object.entries(record)) {
    if (
      keyPattern.test(String(rawKey)) &&
      rawValue !== undefined &&
      rawValue !== null &&
      String(rawValue).trim() !== ""
    ) {
      return rawValue;
    }
  }

  for (const rawValue of Object.values(record)) {
    if (rawValue && typeof rawValue === "object") {
      const nestedValue = findNestedValue(rawValue, keyPattern, visited);
      if (
        nestedValue !== "" &&
        nestedValue !== null &&
        nestedValue !== undefined
      ) {
        return nestedValue;
      }
    }
  }

  return "";
};

const findFirstMeaningfulText = (record, visited = new WeakSet()) => {
  if (!record || typeof record !== "object") {
    return "";
  }

  if (visited.has(record)) {
    return "";
  }

  visited.add(record);

  for (const [rawKey, rawValue] of Object.entries(record)) {
    const key = String(rawKey).toLowerCase();
    if (
      typeof rawValue === "string" &&
      rawValue.trim() !== "" &&
      !/(?:^|[_-])(id|email|phone|date|time|status|location|address|route|transport|pickup|delivery|quantity|qty|count|amount)(?:[_-]|$)/i.test(
        key,
      )
    ) {
      return rawValue;
    }
  }

  for (const rawValue of Object.values(record)) {
    if (rawValue && typeof rawValue === "object") {
      const nestedValue = findFirstMeaningfulText(rawValue, visited);
      if (nestedValue) {
        return nestedValue;
      }
    }
  }

  return "";
};

const findFirstMeaningfulNumber = (record, visited = new WeakSet()) => {
  if (!record || typeof record !== "object") {
    return null;
  }

  if (visited.has(record)) {
    return null;
  }

  visited.add(record);

  for (const [rawKey, rawValue] of Object.entries(record)) {
    const key = String(rawKey).toLowerCase();
    const numericValue =
      typeof rawValue === "number"
        ? rawValue
        : rawValue !== null && rawValue !== undefined && rawValue !== ""
          ? Number(rawValue)
          : Number.NaN;

    if (
      !Number.isNaN(numericValue) &&
      !/(?:^|[_-])(id|email|phone|date|time|status|location|address|route|transport|pickup|delivery)(?:[_-]|$)/i.test(
        key,
      )
    ) {
      return numericValue;
    }
  }

  for (const rawValue of Object.values(record)) {
    if (rawValue && typeof rawValue === "object") {
      const nestedValue = findFirstMeaningfulNumber(rawValue, visited);
      if (nestedValue !== null) {
        return nestedValue;
      }
    }
  }

  return null;
};

const getItemName = (record) =>
  pickText(
    record.itemName,
    record.item_name,
    record.item,
    record.itemLabel,
    record.item_label,
    record.donationItemName,
    record.donation_item_name,
    record.request?.itemName,
    record.request?.item_name,
    record.request?.item,
    record.request?.itemLabel,
    record.request?.item_label,
    record.request?.requestItemName,
    record.request?.request_item_name,
    record.donation?.itemName,
    record.donation?.item_name,
    record.donation?.item,
    record.donation?.itemLabel,
    record.donation?.item_label,
    record.donation?.donationItemName,
    record.donation?.donation_item_name,
    record.donation?.request?.itemName,
    record.donation?.request?.item_name,
    record.donation?.request?.item,
    record.donation?.request?.itemLabel,
    record.donation?.request?.item_label,
    record.donationItem?.itemName,
    record.donationItem?.item_name,
    record.donationItem?.item,
    record.donationItem?.itemLabel,
    record.donationItem?.item_label,
    record.donationItem?.donationItemName,
    record.donationItem?.donation_item_name,
    record.requestItem?.itemName,
    record.requestItem?.item_name,
    record.requestItem?.item,
    record.requestItem?.itemLabel,
    record.requestItem?.item_label,
    record.resourceName,
    record.resource_name,
    record.productName,
    record.product_name,
    record.needName,
    record.need_name,
    record.title,
    record.donation?.title,
    record.request?.title,
    findNestedValue(
      record,
      /(?:^|[_-])(item|name|label|product|resource|need|title)(?:[_-]|$)/i,
    ),
    findFirstMeaningfulText(record),
  ) || "Not provided";

const getQuantity = (record) =>
  pickNumber(
    record.quantity,
    record.itemQuantity,
    record.item_quantity,
    record.qty,
    record.quantityRequested,
    record.requestedQuantity,
    record.request_quantity,
    record.noOfItems,
    record.no_of_items,
    record.totalItems,
    record.total_items,
    record.request?.quantity,
    record.request?.itemQuantity,
    record.request?.item_quantity,
    record.request?.qty,
    record.request?.requestedQuantity,
    record.request?.request_quantity,
    record.request?.noOfItems,
    record.request?.no_of_items,
    record.request?.totalItems,
    record.request?.total_items,
    record.donation?.quantity,
    record.donation?.itemQuantity,
    record.donation?.item_quantity,
    record.donation?.qty,
    record.donation?.quantityRequested,
    record.donation?.requestedQuantity,
    record.donation?.request_quantity,
    record.donation?.noOfItems,
    record.donation?.no_of_items,
    record.donation?.totalItems,
    record.donation?.total_items,
    record.donation?.request?.quantity,
    record.donation?.request?.itemQuantity,
    record.donation?.request?.item_quantity,
    record.donation?.request?.qty,
    record.donation?.request?.requestedQuantity,
    record.donation?.request?.request_quantity,
    record.donation?.request?.noOfItems,
    record.donation?.request?.no_of_items,
    record.donation?.request?.totalItems,
    record.donation?.request?.total_items,
    record.donationItem?.quantity,
    record.donationItem?.itemQuantity,
    record.donationItem?.item_quantity,
    record.donationItem?.qty,
    record.donationItem?.quantityRequested,
    record.donationItem?.requestedQuantity,
    record.donationItem?.request_quantity,
    record.donationItem?.noOfItems,
    record.donationItem?.no_of_items,
    record.donationItem?.totalItems,
    record.donationItem?.total_items,
    record.requestItem?.quantity,
    record.requestItem?.itemQuantity,
    record.requestItem?.item_quantity,
    record.requestItem?.qty,
    record.requestItem?.requestedQuantity,
    record.requestItem?.request_quantity,
    record.requestItem?.noOfItems,
    record.requestItem?.no_of_items,
    record.requestItem?.totalItems,
    record.requestItem?.total_items,
    findNestedValue(
      record,
      /(?:^|[_-])(quantity|qty|amount|count|items?|units?)(?:[_-]|$)/i,
    ),
    findFirstMeaningfulNumber(record),
  ) ?? "Not provided";

export default function Donor() {
  const context = useOutletContext();
  const section = context?.section || "home";

  const user = JSON.parse(localStorage.getItem("user"));

  const [donations, setDonations] = useState([]);
  const [donationForm, setDonationForm] = useState(initialDonationForm);
  const [loadingDonations, setLoadingDonations] = useState(false);
  const [addingDonation, setAddingDonation] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusResult, setStatusResult] = useState("");

  const fetchDonations = async () => {
    if (!user?.donorId) {
      setDonations([]);
      return;
    }

    setLoadingDonations(true);

    try {
      const res = await axios.get(`/donorapi/myDonations/${user.donorId}`);
      setDonations(Array.isArray(res.data) ? res.data : []);
    } catch {
      toast.error("Unable to load your donations right now.", {
        autoClose: 6000,
      });
    } finally {
      setLoadingDonations(false);
    }
  };

  useEffect(() => {
    if (user?.donorId) {
      fetchDonations();
    }
  }, [user?.donorId]);

  useEffect(() => {
    if (user?.donorId && ["home", "view", "status"].includes(section)) {
      fetchDonations();
    }
  }, [section]);

  const pendingDonationsCount = useMemo(() => {
    return donations.filter((donation) => {
      const status = String(donation.deliveryStatus || "pending").toLowerCase();
      return status === "pending" || status === "in transit";
    }).length;
  }, [donations]);

  const deliveredDonationsCount = useMemo(() => {
    return donations.filter((donation) => {
      const status = String(donation.deliveryStatus || "").toLowerCase();
      return status === "delivered" || status === "completed";
    }).length;
  }, [donations]);

  const addDonation = async (event) => {
    event.preventDefault();

    if (!user?.donorId) {
      toast.error("Donor session not found. Please login again.", {
        autoClose: 6000,
      });
      return;
    }

    if (!donationForm.itemName.trim() || !donationForm.quantity.trim()) {
      toast.error("Item name and quantity are required.", {
        autoClose: 6000,
      });
      return;
    }

    setAddingDonation(true);

    try {
      const payload = {
        ...donationForm,
        quantity: Number(donationForm.quantity),
        donorId: user.donorId,
        deliveryStatus: "Pending",
        donor: {
          donorId: user.donorId,
        },
      };

      await axios.post("/donorapi/addDonation", payload);
      toast.success("Donation added successfully.", {
        autoClose: 6000,
      });
      setDonationForm(initialDonationForm);
      setStatusResult("");
      await fetchDonations();
    } catch {
      toast.error("Donation submission failed.", {
        autoClose: 6000,
      });
    } finally {
      setAddingDonation(false);
    }
  };

  const checkStatus = async () => {
    if (!user?.donorId) {
      toast.error("Donor session not found. Please login again.", {
        autoClose: 6000,
      });
      return;
    }

    setStatusLoading(true);

    try {
      const res = await axios.get(`/donorapi/status/${user.donorId}`);
      setStatusResult(String(res.data || "No status returned."));
      toast.success("Delivery status loaded.", {
        autoClose: 6000,
      });
      await fetchDonations();
    } catch {
      toast.error("Unable to fetch delivery status.", {
        autoClose: 6000,
      });
    } finally {
      setStatusLoading(false);
    }
  };

  const donationCards = donations.map((donation) => {
    const donationId = donation.donationId || donation.id;
    const deliveryStatus = String(donation.deliveryStatus || "Pending");
    const itemName = getItemName(donation);
    const quantity = getQuantity(donation);

    return (
      <article key={donationId} className="donor-donation-card">
        <div className="donor-donation-card-header">
          <div>
            <p className="donor-card-label">Donation ID</p>
            <h3>#{donationId}</h3>
          </div>
          <span
            className={`donor-status-pill ${deliveryStatus.toLowerCase().replace(/\s+/g, "-")}`}
          >
            {deliveryStatus}
          </span>
        </div>

        <div className="donor-donation-meta">
          <div>
            <span>Item</span>
            <strong>{itemName}</strong>
          </div>
          <div>
            <span>Category</span>
            <strong>{donation.donationCategory || "General"}</strong>
          </div>
          <div>
            <span>Quantity</span>
            <strong>{quantity}</strong>
          </div>
          <div>
            <span>Condition</span>
            <strong>{donation.itemCondition || "Standard"}</strong>
          </div>
        </div>

        <p className="donor-donation-description">
          {donation.itemDescription ||
            "No description added for this donation."}
        </p>

        <div className="donor-donation-actions">
          <button type="button" onClick={checkStatus}>
            Check Delivery Status
          </button>
        </div>
      </article>
    );
  });

  const donationRows = donations.map((donation) => {
    const donationId = donation.donationId || donation.id;
    const deliveryStatus = String(donation.deliveryStatus || "Pending");
    const itemName = getItemName(donation);
    const quantity = getQuantity(donation);

    return (
      <tr key={donationId}>
        <td>{donationId || "-"}</td>
        <td>{itemName}</td>
        <td>{donation.donationCategory || "General"}</td>
        <td>{quantity}</td>
        <td>{donation.itemCondition || "Standard"}</td>
        <td>
          <span
            className={`donor-status-pill ${deliveryStatus.toLowerCase().replace(/\s+/g, "-")}`}
          >
            {deliveryStatus}
          </span>
        </td>
      </tr>
    );
  });

  return (
    <div className="donor-layout">
      <ToastContainer position="top-right" pauseOnHover={true} />

      <div className="donor-shell">
        {section === "home" && (
          <section className="donor-hero-card">
            <div className="donor-hero-copy">
              <p className="donor-eyebrow">Donor dashboard</p>
              <h1>Welcome back, {user?.name || "Donor"}</h1>
              <p>
                Manage your donations in centered workflow cards and keep every
                operation synced with donation service endpoints.
              </p>
            </div>

            <div className="donor-profile-card">
              <p className="donor-card-label">Profile</p>
              <strong>{user?.email || "No email available"}</strong>
              <span>Donor ID: {user?.donorId || "N/A"}</span>
            </div>
          </section>
        )}

        {section === "home" && (
          <>
            <section className="donor-stats-grid">
              <article className="donor-stat-card accent-blue">
                <span>Donations</span>
                <strong>{donations.length}</strong>
                <p>Total donations submitted</p>
              </article>
              <article className="donor-stat-card accent-gold">
                <span>Pending</span>
                <strong>{pendingDonationsCount}</strong>
                <p>Awaiting pickup or delivery</p>
              </article>
              <article className="donor-stat-card accent-green">
                <span>Delivered</span>
                <strong>{deliveredDonationsCount}</strong>
                <p>Completed delivery records</p>
              </article>
            </section>
          </>
        )}

        {section === "add" && (
          <section className="donor-single-column">
            <article className="donor-card">
              <div className="donor-card-heading">
                <div>
                  <p className="donor-card-label">Donation service</p>
                  <h2>Add Donation</h2>
                </div>
                <span className="donor-card-subtitle">
                  Backend: /donorapi/addDonation
                </span>
              </div>

              <form className="donor-form-grid" onSubmit={addDonation}>
                <div className="donor-field">
                  <label htmlFor="donationCategory">Item Category</label>
                  <select
                    id="donationCategory"
                    value={donationForm.donationCategory}
                    onChange={(event) =>
                      setDonationForm({
                        ...donationForm,
                        donationCategory: event.target.value,
                      })
                    }
                  >
                    <option value="">Select category</option>
                    {itemCategoryOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="donor-field">
                  <label htmlFor="itemName">Item Name</label>
                  <input
                    id="itemName"
                    value={donationForm.itemName}
                    onChange={(event) =>
                      setDonationForm({
                        ...donationForm,
                        itemName: event.target.value,
                      })
                    }
                    placeholder="Enter item name"
                  />
                </div>

                <div className="donor-field full-width">
                  <label htmlFor="itemDescription">Description</label>
                  <textarea
                    id="itemDescription"
                    rows="4"
                    value={donationForm.itemDescription}
                    onChange={(event) =>
                      setDonationForm({
                        ...donationForm,
                        itemDescription: event.target.value,
                      })
                    }
                    placeholder="Add donation description"
                  />
                </div>

                <div className="donor-field">
                  <label htmlFor="quantity">Quantity</label>
                  <input
                    id="quantity"
                    type="number"
                    value={donationForm.quantity}
                    onChange={(event) =>
                      setDonationForm({
                        ...donationForm,
                        quantity: event.target.value,
                      })
                    }
                    placeholder="Enter quantity"
                  />
                </div>

                <div className="donor-field">
                  <label htmlFor="itemCondition">Item Condition</label>
                  <input
                    id="itemCondition"
                    value={donationForm.itemCondition}
                    onChange={(event) =>
                      setDonationForm({
                        ...donationForm,
                        itemCondition: event.target.value,
                      })
                    }
                    placeholder="New / Good / Usable"
                  />
                </div>

                <div className="donor-field">
                  <label htmlFor="availabilityDate">Availability Date</label>
                  <input
                    id="availabilityDate"
                    type="date"
                    value={donationForm.availabilityDate}
                    onChange={(event) =>
                      setDonationForm({
                        ...donationForm,
                        availabilityDate: event.target.value,
                      })
                    }
                  />
                </div>

                <div className="donor-field">
                  <label htmlFor="expiryDate">Expiry Date</label>
                  <input
                    id="expiryDate"
                    type="date"
                    value={donationForm.expiryDate}
                    onChange={(event) =>
                      setDonationForm({
                        ...donationForm,
                        expiryDate: event.target.value,
                      })
                    }
                  />
                </div>

                <button
                  className="donor-primary-button full-width"
                  type="submit"
                  disabled={addingDonation}
                >
                  {addingDonation ? "Submitting..." : "Add Donation"}
                </button>
              </form>
            </article>
          </section>
        )}

        {section === "view" && (
          <section className="donor-card">
            <div className="donor-card-heading">
              <div>
                <p className="donor-card-label">My donations</p>
                <h2>Donation history</h2>
              </div>
              <button
                type="button"
                className="donor-secondary-button"
                onClick={fetchDonations}
              >
                {loadingDonations ? "Refreshing..." : "Refresh"}
              </button>
            </div>

            {loadingDonations ? (
              <div className="donor-empty-state">Loading your donations...</div>
            ) : donationRows.length === 0 ? (
              <div className="donor-empty-state">
                No donations yet. Use Add Donation to create your first record.
              </div>
            ) : (
              <div className="donor-table-wrap">
                <table className="donor-data-table">
                  <thead>
                    <tr>
                      <th>Donation ID</th>
                      <th>Item Name</th>
                      <th>Category</th>
                      <th>Quantity</th>
                      <th>Condition</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>{donationRows}</tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {section === "status" && (
          <section className="donor-single-column">
            <article className="donor-card">
              <div className="donor-card-heading">
                <div>
                  <p className="donor-card-label">Status service</p>
                  <h2>Check Delivery Status</h2>
                </div>
                <span className="donor-card-subtitle">
                  Backend: /donorapi/status/{"{"}donorId{"}"}
                </span>
              </div>

              <div className="donor-inline-actions">
                <button
                  type="button"
                  onClick={checkStatus}
                  disabled={statusLoading}
                >
                  {statusLoading ? "Checking..." : "Check Status"}
                </button>
              </div>

              <div className="donor-result-stack">
                <div className="donor-result-card">
                  <span>Delivery Status</span>
                  <strong>{statusResult || "No status loaded yet."}</strong>
                </div>
              </div>
            </article>
          </section>
        )}
      </div>
    </div>
  );
}
