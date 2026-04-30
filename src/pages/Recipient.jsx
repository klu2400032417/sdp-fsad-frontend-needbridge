import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import axios from "../api/axios";
import "../styles/recipient.css";
import "react-toastify/dist/ReactToastify.css";

const initialRequestForm = {
  itemName: "",
  itemDescription: "",
  quantity: "",
  emergencyType: "",
  urgencyLevel: "",
};

const initialFeedbackForm = {
  requestId: "",
  rating: "",
  feedback: "",
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
    record.requestItemName,
    record.request_item_name,
    record.request?.itemName,
    record.request?.item_name,
    record.request?.item,
    record.request?.itemLabel,
    record.request?.item_label,
    record.request?.requestItemName,
    record.request?.request_item_name,
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
    record.request?.needName,
    record.request?.need_name,
    record.request?.title,
    record.request?.requestTitle,
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
    record.requestedQuantity,
    record.request_quantity,
    record.needQuantity,
    record.need_quantity,
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
    record.request?.needQuantity,
    record.request?.need_quantity,
    record.request?.noOfItems,
    record.request?.no_of_items,
    record.request?.totalItems,
    record.request?.total_items,
    record.requestItem?.quantity,
    record.requestItem?.itemQuantity,
    record.requestItem?.item_quantity,
    record.requestItem?.qty,
    record.requestItem?.requestedQuantity,
    record.requestItem?.request_quantity,
    record.requestItem?.needQuantity,
    record.requestItem?.need_quantity,
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

const getDonorName = (record) =>
  pickText(
    record.donor?.name,
    record.donor?.fullName,
    record.donor?.donorName,
    record.donorName,
    record.donorFullName,
    record.donorEmail,
    record.donor?.email,
  );

const getDonorId = (record) =>
  pickText(
    record.donorId,
    record.donor?.donorId,
    record.donor?.id,
    record.donor_id,
  );

export default function Recipient() {
  const context = useOutletContext();
  const section = context?.section || "home";

  const user = JSON.parse(localStorage.getItem("user"));

  const [requests, setRequests] = useState([]);
  const [requestForm, setRequestForm] = useState(initialRequestForm);
  const [feedbackForm, setFeedbackForm] = useState(initialFeedbackForm);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [requestSubmitting, setRequestSubmitting] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [statusResult, setStatusResult] = useState("");
  const [deliveryResult, setDeliveryResult] = useState("");

  const fetchRequests = async () => {
    if (!user?.recipientId) {
      setRequests([]);
      return;
    }

    setLoadingRequests(true);

    try {
      const res = await axios.get(`/recipient/requests/${user.recipientId}`);
      setRequests(Array.isArray(res.data) ? res.data : []);
    } catch {
      toast.error("Unable to load your requests right now.", {
        autoClose: 6000,
      });
    } finally {
      setLoadingRequests(false);
    }
  };

  useEffect(() => {
    if (user?.recipientId) {
      fetchRequests();
    }
  }, [user?.recipientId]);

  useEffect(() => {
    if (
      user?.recipientId &&
      ["home", "view", "status", "feedback"].includes(section)
    ) {
      fetchRequests();
    }
  }, [section]);

  useEffect(() => {
    if (!feedbackForm.requestId && requests.length > 0) {
      setFeedbackForm((current) => ({
        ...current,
        requestId: String(requests[0].requestId || requests[0].id || ""),
      }));
    }
  }, [requests, feedbackForm.requestId]);

  const selectedRequestId = useMemo(() => {
    if (feedbackForm.requestId) {
      return feedbackForm.requestId;
    }

    if (requests.length > 0) {
      return String(requests[0].requestId || requests[0].id || "");
    }

    return "";
  }, [feedbackForm.requestId, requests]);

  const activeRequestCount = requests.length;
  const pendingCount = requests.filter((request) => {
    const status = String(
      request.requestStatus || request.status || "pending",
    ).toLowerCase();
    return status === "pending" || status === "in progress";
  }).length;
  const resolvedCount = requests.filter((request) => {
    const status = String(
      request.requestStatus || request.status || "",
    ).toLowerCase();
    return (
      status === "approved" || status === "delivered" || status === "completed"
    );
  }).length;

  const requestItem = async (event) => {
    event.preventDefault();

    if (!user?.recipientId) {
      toast.error("Recipient session not found. Please log in again.", {
        autoClose: 6000,
      });
      return;
    }

    if (!requestForm.itemName.trim() || !requestForm.quantity.trim()) {
      toast.error(
        "Item name and quantity are required before submitting a request.",
        {
          autoClose: 6000,
        },
      );
      return;
    }

    setRequestSubmitting(true);

    try {
      const payload = {
        ...requestForm,
        quantity: Number(requestForm.quantity),
        recipientId: user.recipientId,
        recipient: {
          recipientId: user.recipientId,
        },
        requestStatus: "Pending",
      };

      await axios.post("/recipient/request", payload);
      toast.success("Request submitted successfully.", {
        autoClose: 6000,
      });
      setRequestForm(initialRequestForm);
      setStatusResult("");
      setDeliveryResult("");
      setFeedbackForm((current) => ({
        ...current,
        requestId: String(user.recipientId || current.requestId || ""),
      }));
      await fetchRequests();
    } catch {
      toast.error(
        "Request submission failed. Please check the details and try again.",
        {
          autoClose: 6000,
        },
      );
    } finally {
      setRequestSubmitting(false);
    }
  };

  const checkStatus = async (requestId) => {
    if (!requestId) {
      toast.error("Select a request before checking its status.", {
        autoClose: 6000,
      });
      return;
    }

    setStatusLoading(true);

    try {
      const res = await axios.get(`/recipient/status/${requestId}`);
      setStatusResult(String(res.data || "No status returned."));
      setFeedbackForm((current) => ({
        ...current,
        requestId: String(requestId),
      }));
      toast.success("Request status loaded.", {
        autoClose: 6000,
      });
      await fetchRequests();
    } catch {
      toast.error("Unable to fetch request status.", {
        autoClose: 6000,
      });
    } finally {
      setStatusLoading(false);
    }
  };

  const checkDelivery = async (requestId) => {
    if (!requestId) {
      toast.error("Select a request before checking delivery date.", {
        autoClose: 6000,
      });
      return;
    }

    setStatusLoading(true);

    try {
      const res = await axios.get(`/recipient/delivery/${requestId}`);
      setDeliveryResult(String(res.data || "No delivery date returned."));
      setFeedbackForm((current) => ({
        ...current,
        requestId: String(requestId),
      }));
      toast.success("Expected delivery date loaded.", {
        autoClose: 6000,
      });
      await fetchRequests();
    } catch {
      toast.error("Unable to fetch delivery date.", {
        autoClose: 6000,
      });
    } finally {
      setStatusLoading(false);
    }
  };

  const submitFeedback = async (event) => {
    event.preventDefault();

    if (
      !feedbackForm.requestId ||
      !feedbackForm.rating ||
      !feedbackForm.feedback.trim()
    ) {
      toast.error("Request ID, rating, and feedback text are required.", {
        autoClose: 6000,
      });
      return;
    }

    setFeedbackSubmitting(true);

    try {
      await axios.post(
        `/recipient/feedback?id=${feedbackForm.requestId}&rating=${encodeURIComponent(feedbackForm.rating)}&feedback=${encodeURIComponent(feedbackForm.feedback)}`,
      );

      toast.success("Feedback submitted successfully.", {
        autoClose: 6000,
      });
      setFeedbackForm({
        requestId: selectedRequestId,
        rating: "",
        feedback: "",
      });
      setStatusResult("");
      setDeliveryResult("");
      await fetchRequests();
    } catch {
      toast.error("Feedback submission failed.", {
        autoClose: 6000,
      });
    } finally {
      setFeedbackSubmitting(false);
    }
  };

  const requestCards = requests.map((request) => {
    const requestId = request.requestId || request.id;
    const status = String(request.requestStatus || request.status || "Pending");
    const itemName = getItemName(request);
    const quantity = getQuantity(request);
    const donorName = getDonorName(request);
    const donorId = getDonorId(request);

    return (
      <article className="recipient-request-card" key={requestId}>
        <div className="recipient-request-card-header">
          <div>
            <p className="recipient-card-label">Request ID</p>
            <h3>#{requestId}</h3>
          </div>
          <span
            className={`recipient-status-pill ${status.toLowerCase().replace(/\s+/g, "-")}`}
          >
            {status}
          </span>
        </div>

        <div className="recipient-request-meta">
          <div>
            <span>Item</span>
            <strong>{itemName}</strong>
          </div>
          <div>
            <span>Quantity</span>
            <strong>{quantity}</strong>
          </div>
          <div>
            <span>Emergency</span>
            <strong>
              {request.emergencyType || request.requestType || "Standard"}
            </strong>
          </div>
          <div>
            <span>Urgency</span>
            <strong>
              {request.urgencyLevel || request.priority || "Normal"}
            </strong>
          </div>
          <div>
            <span>Donor</span>
            <strong>{donorName || donorId || "Pending allocation"}</strong>
          </div>
        </div>

        <p className="recipient-request-description">
          {request.itemDescription ||
            "No item description provided for this request."}
        </p>

        <div className="recipient-request-actions">
          <button type="button" onClick={() => checkStatus(requestId)}>
            Check Status
          </button>
          <button
            type="button"
            className="secondary"
            onClick={() => checkDelivery(requestId)}
          >
            Delivery Date
          </button>
          <button
            type="button"
            className="ghost"
            onClick={() =>
              setFeedbackForm((current) => ({
                ...current,
                requestId: String(requestId),
              }))
            }
          >
            Send Feedback
          </button>
        </div>
      </article>
    );
  });

  const requestRows = requests.map((request) => {
    const requestId = request.requestId || request.id;
    const status = String(request.requestStatus || request.status || "Pending");
    const itemName = getItemName(request);
    const quantity = getQuantity(request);
    const donorName = getDonorName(request);
    const donorId = getDonorId(request);

    return (
      <tr key={requestId}>
        <td>{requestId || "-"}</td>
        <td>{itemName}</td>
        <td>{quantity}</td>
        <td>{request.emergencyType || request.requestType || "Standard"}</td>
        <td>{request.urgencyLevel || request.priority || "Normal"}</td>
        <td>{donorName || donorId || "Pending allocation"}</td>
        <td>
          <span
            className={`recipient-status-pill ${status.toLowerCase().replace(/\s+/g, "-")}`}
          >
            {status}
          </span>
        </td>
        <td>
          <div className="recipient-table-actions">
            <button type="button" onClick={() => checkStatus(requestId)}>
              Status
            </button>
            <button
              type="button"
              className="secondary"
              onClick={() => checkDelivery(requestId)}
            >
              Delivery
            </button>
            <button
              type="button"
              className="ghost"
              onClick={() =>
                setFeedbackForm((current) => ({
                  ...current,
                  requestId: String(requestId),
                }))
              }
            >
              Feedback
            </button>
          </div>
        </td>
      </tr>
    );
  });

  return (
    <div className="recipient-layout">
      <ToastContainer position="top-right" pauseOnHover={true} />
      <div className="recipient-shell">
        {section === "home" && (
          <section className="recipient-hero-card">
            <div className="recipient-hero-copy">
              <p className="recipient-eyebrow">Recipient dashboard</p>
              <h1>Welcome back, {user?.name || "Recipient"}</h1>
              <p>
                Use the centered cards below to create requests, track their
                progress, and share feedback after delivery.
              </p>
            </div>

            <div className="recipient-profile-card">
              <p className="recipient-card-label">Profile</p>
              <strong>{user?.email || "No email available"}</strong>
              <span>Recipient ID: {user?.recipientId || "N/A"}</span>
            </div>
          </section>
        )}

        {section === "home" && (
          <>
            <section className="recipient-stats-grid">
              <article className="recipient-stat-card accent-blue">
                <span>Requests</span>
                <strong>{activeRequestCount}</strong>
                <p>Total requests submitted</p>
              </article>
              <article className="recipient-stat-card accent-green">
                <span>Pending</span>
                <strong>{pendingCount}</strong>
                <p>Waiting for processing</p>
              </article>
              <article className="recipient-stat-card accent-gold">
                <span>Completed</span>
                <strong>{resolvedCount}</strong>
                <p>Approved or delivered requests</p>
              </article>
            </section>
          </>
        )}

        {section === "request" && (
          <section className="recipient-single-column">
            <article className="recipient-card">
              <div className="recipient-card-heading">
                <div>
                  <p className="recipient-card-label">Request service</p>
                  <h2>Request Item</h2>
                </div>
                <span className="recipient-card-subtitle">
                  Backend: /recipient/request
                </span>
              </div>

              <form className="recipient-form-grid" onSubmit={requestItem}>
                <div className="recipient-field">
                  <label htmlFor="itemName">Item Name</label>
                  <input
                    id="itemName"
                    value={requestForm.itemName}
                    onChange={(event) =>
                      setRequestForm({
                        ...requestForm,
                        itemName: event.target.value,
                      })
                    }
                    placeholder="Enter item name"
                  />
                </div>

                <div className="recipient-field">
                  <label htmlFor="quantity">Quantity</label>
                  <input
                    id="quantity"
                    type="number"
                    value={requestForm.quantity}
                    onChange={(event) =>
                      setRequestForm({
                        ...requestForm,
                        quantity: event.target.value,
                      })
                    }
                    placeholder="How many units?"
                  />
                </div>

                <div className="recipient-field full-width">
                  <label htmlFor="itemDescription">Description</label>
                  <textarea
                    id="itemDescription"
                    rows="4"
                    value={requestForm.itemDescription}
                    onChange={(event) =>
                      setRequestForm({
                        ...requestForm,
                        itemDescription: event.target.value,
                      })
                    }
                    placeholder="Explain the required item or context"
                  />
                </div>

                <div className="recipient-field">
                  <label htmlFor="emergencyType">Item Category</label>
                  <select
                    id="emergencyType"
                    value={requestForm.emergencyType}
                    onChange={(event) =>
                      setRequestForm({
                        ...requestForm,
                        emergencyType: event.target.value,
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

                <div className="recipient-field">
                  <label htmlFor="urgencyLevel">Urgency Level</label>
                  <select
                    id="urgencyLevel"
                    value={requestForm.urgencyLevel}
                    onChange={(event) =>
                      setRequestForm({
                        ...requestForm,
                        urgencyLevel: event.target.value,
                      })
                    }
                  >
                    <option value="">Select urgency</option>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>

                <button
                  className="recipient-primary-button full-width"
                  type="submit"
                  disabled={requestSubmitting}
                >
                  {requestSubmitting ? "Submitting..." : "Submit Request"}
                </button>
              </form>
            </article>
          </section>
        )}

        {section === "view" && (
          <section className="recipient-card">
            <div className="recipient-card-heading">
              <div>
                <p className="recipient-card-label">My requests</p>
                <h2>Request history</h2>
              </div>
              <button
                type="button"
                className="recipient-secondary-button"
                onClick={fetchRequests}
              >
                {loadingRequests ? "Refreshing..." : "Refresh"}
              </button>
            </div>

            {loadingRequests ? (
              <div className="recipient-empty-state">
                Loading your requests...
              </div>
            ) : requestRows.length === 0 ? (
              <div className="recipient-empty-state">
                No requests yet. Use Request Item to create your first request.
              </div>
            ) : (
              <div className="recipient-table-wrap">
                <table className="recipient-data-table">
                  <thead>
                    <tr>
                      <th>Request ID</th>
                      <th>Item Name</th>
                      <th>Quantity</th>
                      <th>Emergency</th>
                      <th>Urgency</th>
                      <th>Donor Source</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>{requestRows}</tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {section === "status" && (
          <section className="recipient-single-column">
            <article className="recipient-card">
              <div className="recipient-card-heading">
                <div>
                  <p className="recipient-card-label">Status service</p>
                  <h2>Check Status and Delivery</h2>
                </div>
                <span className="recipient-card-subtitle">
                  Backend: /recipient/status and /recipient/delivery
                </span>
              </div>

              <div className="recipient-field">
                <label htmlFor="statusRequestId">Request ID</label>
                <select
                  id="statusRequestId"
                  value={selectedRequestId}
                  onChange={(event) =>
                    setFeedbackForm((current) => ({
                      ...current,
                      requestId: event.target.value,
                    }))
                  }
                >
                  <option value="">Select a request</option>
                  {requests.map((request) => {
                    const requestId = request.requestId || request.id;
                    return (
                      <option key={requestId} value={requestId}>
                        #{requestId} - {getItemName(request) || "Item request"}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="recipient-inline-actions">
                <button
                  type="button"
                  onClick={() => checkStatus(selectedRequestId)}
                  disabled={statusLoading}
                >
                  {statusLoading ? "Checking..." : "Check Status"}
                </button>
                <button
                  type="button"
                  className="secondary"
                  onClick={() => checkDelivery(selectedRequestId)}
                  disabled={statusLoading}
                >
                  {statusLoading ? "Checking..." : "Expected Delivery"}
                </button>
              </div>

              <div className="recipient-result-stack">
                <div className="recipient-result-card">
                  <span>Status</span>
                  <strong>{statusResult || "No status loaded yet."}</strong>
                </div>
                <div className="recipient-result-card">
                  <span>Delivery</span>
                  <strong>
                    {deliveryResult || "No delivery date loaded yet."}
                  </strong>
                </div>
              </div>
            </article>
          </section>
        )}

        {section === "feedback" && (
          <section className="recipient-single-column">
            <article className="recipient-card">
              <div className="recipient-card-heading">
                <div>
                  <p className="recipient-card-label">Feedback service</p>
                  <h2>Give Feedback</h2>
                </div>
                <span className="recipient-card-subtitle">
                  Backend: /recipient/feedback
                </span>
              </div>

              <form className="recipient-form-grid" onSubmit={submitFeedback}>
                <div className="recipient-field full-width">
                  <label htmlFor="feedbackRequestId">Request ID</label>
                  <select
                    id="feedbackRequestId"
                    value={feedbackForm.requestId}
                    onChange={(event) =>
                      setFeedbackForm({
                        ...feedbackForm,
                        requestId: event.target.value,
                      })
                    }
                  >
                    <option value="">Select request ID</option>
                    {requests.map((request) => {
                      const requestId = request.requestId || request.id;
                      const donorName = getDonorName(request);
                      const donorId = getDonorId(request);
                      return (
                        <option key={requestId} value={requestId}>
                          #{requestId} -{" "}
                          {getItemName(request) || "Item request"}
                          {donorName || donorId
                            ? ` | ${donorName || donorId}`
                            : ""}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="recipient-field full-width">
                  <div className="recipient-result-card">
                    <span>Donor linked to selected item</span>
                    <strong>
                      {(() => {
                        const selectedRequest = requests.find((request) => {
                          const requestKey = String(
                            request.requestId || request.id || "",
                          );
                          return (
                            requestKey ===
                            String(
                              feedbackForm.requestId || selectedRequestId || "",
                            )
                          );
                        });

                        return (
                          getDonorName(selectedRequest || {}) ||
                          getDonorId(selectedRequest || {}) ||
                          "Pending donor allocation"
                        );
                      })()}
                    </strong>
                  </div>
                </div>

                <div className="recipient-field">
                  <label htmlFor="rating">Rating</label>
                  <select
                    id="rating"
                    value={feedbackForm.rating}
                    onChange={(event) =>
                      setFeedbackForm({
                        ...feedbackForm,
                        rating: event.target.value,
                      })
                    }
                  >
                    <option value="">Select rating</option>
                    <option value="1">1 - Poor</option>
                    <option value="2">2 - Fair</option>
                    <option value="3">3 - Good</option>
                    <option value="4">4 - Very Good</option>
                    <option value="5">5 - Excellent</option>
                  </select>
                </div>

                <div className="recipient-field full-width">
                  <label htmlFor="feedback">Feedback</label>
                  <textarea
                    id="feedback"
                    rows="4"
                    value={feedbackForm.feedback}
                    onChange={(event) =>
                      setFeedbackForm({
                        ...feedbackForm,
                        feedback: event.target.value,
                      })
                    }
                    placeholder="Write your feedback about the request and delivery experience"
                  />
                </div>

                <button
                  className="recipient-primary-button full-width"
                  type="submit"
                  disabled={feedbackSubmitting}
                >
                  {feedbackSubmitting ? "Submitting..." : "Submit Feedback"}
                </button>
              </form>
            </article>
          </section>
        )}
      </div>
    </div>
  );
}
