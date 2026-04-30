import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import axios from "../api/axios";
import "../styles/logistics.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const initialTaskState = {
  logisticsId: "",
  coordinatorId: "",
  pickupDate: "",
  deliveryStatus: "",
  transportType: "",
  donorId: "",
  recipientId: "",
  requestId: "",
  route: "",
  pickupLocation: "",
  deliveryLocation: "",
};

const pickText = (...values) => {
  for (const value of values) {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return value;
    }
  }

  return "Not provided";
};

const pickNumber = (...values) => {
  for (const value of values) {
    if (value !== undefined && value !== null && value !== "") {
      return value;
    }
  }

  return "Not provided";
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
      row.productName,
      row.product_name,
      row.needName,
      row.need_name,
      row.title,
      row.request?.title,
      row.request?.requestTitle,
    );

    if (item) {
      return item;
    }
  }

  return "";
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
      row.request?.quantity,
      row.request?.itemQuantity,
      row.request?.item_quantity,
      row.request?.qty,
      row.request?.requestedQuantity,
      row.request?.request_quantity,
      row.request?.noOfItems,
      row.request?.no_of_items,
      row.request?.totalItems,
      row.request?.total_items,
    );

    if (quantity !== null) {
      return quantity;
    }
  }

  return null;
};

const getCoordinatorLabel = (record) =>
  pickText(
    record.coordinatorId,
    record.logisticsCoordinatorId,
    record.logisticsCoordinator?.id,
    record.logisticsCoordinator?.username,
    record.coordinator?.id,
    record.coordinator?.username,
  );

const getDonorLabel = (record) =>
  pickText(record.donorId, record.donor?.donorId, record.donor?.id);

const getRecipientLabel = (record) =>
  pickText(
    record.recipientId,
    record.recipient?.recipientId,
    record.recipient?.id,
  );

const getRequestLabel = (record) =>
  pickText(record.requestId, record.request?.requestId, record.request?.id);

const getRequestId = (record) =>
  pickText(
    record.requestId,
    record.reqId,
    record.request_id,
    record.request?.requestId,
    record.request?.request_id,
    record.request?.id,
  );

const getDetailId = (record) =>
  pickText(record.detailId, record.logisticsDetailId, record.id);

const getDetailStatus = (record) =>
  pickText(record.deliveryStatus, record.status, record.detailStatus) ||
  "PENDING";

const getRequestStatus = (record) =>
  pickText(
    record.requestStatus,
    record.status,
    record.approvalStatus,
    record.adminStatus,
    record.request?.requestStatus,
    record.request?.status,
  );

const getLogisticsEntryId = (record) =>
  pickText(
    record.logisticsId,
    record.logistics_id,
    record.id,
    record.logisticsDetailId,
    record.detailId,
  );

const endpointVariants = {
  pickup: [
    { method: "put", url: "/logisticsapi/updatepickupschedule" },
    { method: "post", url: "/logisticsapi/updatepickupschedule" },
    { method: "put", url: "/logisticsapi/pickup" },
  ],
  delivery: [
    { method: "put", url: "/logisticsapi/updatedeliverystatus" },
    { method: "post", url: "/logisticsapi/updatedeliverystatus" },
    { method: "put", url: "/logisticsapi/delivery" },
  ],
  driver: [
    { method: "put", url: "/logisticsapi/assigndriver" },
    { method: "post", url: "/logisticsapi/assigndriver" },
    { method: "put", url: "/logisticsapi/assigntransport" },
  ],
  route: [
    { method: "put", url: "/logisticsapi/updateroute" },
    { method: "post", url: "/logisticsapi/updateroute" },
  ],
  locations: [
    { method: "put", url: "/logisticsapi/updatelocations" },
    { method: "post", url: "/logisticsapi/updatelocations" },
    { method: "put", url: "/logisticsapi/locations" },
  ],
  detailsSave: [
    { method: "post", url: "/logisticsapi/addlogisticsdetails" },
    { method: "post", url: "/logisticsapi/savelogisticsdetails" },
    { method: "put", url: "/logisticsapi/updatelogisticsdetails" },
    { method: "post", url: "/logisticsapi/logisticsdetails" },
    { method: "post", url: "/logisticsapi/adddetails" },
    { method: "put", url: "/logisticsapi/updatedetails" },
  ],
  detailsUpdate: [
    { method: "put", url: "/logisticsapi/updatelogisticsdetails" },
    { method: "post", url: "/logisticsapi/updatelogisticsdetails" },
    { method: "put", url: "/logisticsapi/updatedetails" },
    { method: "post", url: "/logisticsapi/updatedetails" },
  ],
  detailsView: [
    { method: "get", url: "/logisticsapi/viewalllogisticsdetails" },
    { method: "get", url: "/logisticsapi/viewlogisticsdetails" },
    { method: "get", url: "/logisticsapi/viewalllogistics" },
  ],
};

async function executeVariant(actionKey, payload) {
  const variants = endpointVariants[actionKey] || [];
  let lastError;

  for (const variant of variants) {
    try {
      if (variant.method === "put") {
        return await axios.put(variant.url, payload);
      }

      if (variant.method === "get") {
        return await axios.get(variant.url);
      }

      return await axios.post(variant.url, payload);
    } catch (error) {
      lastError = error;
    }

    try {
      return await axios.post(variant.url, null, { params: payload });
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error("Action failed");
}

async function fetchVariantData(actionKey) {
  const variants = endpointVariants[actionKey] || [];
  let lastError;

  for (const variant of variants) {
    try {
      if (variant.method !== "get") {
        continue;
      }

      const res = await axios.get(variant.url);
      return Array.isArray(res.data) ? res.data : [];
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error("Load failed");
}

export default function Logistics() {
  const context = useOutletContext();
  const section = context?.section || "home";

  const user = JSON.parse(localStorage.getItem("user"));

  const [donors, setDonors] = useState([]);
  const [donorDonationMap, setDonorDonationMap] = useState({});
  const [recipients, setRecipients] = useState([]);
  const [recipientRequestMap, setRecipientRequestMap] = useState({});
  const [logisticsEntries, setLogisticsEntries] = useState([]);
  const [logisticsDetails, setLogisticsDetails] = useState([]);
  const [taskForm, setTaskForm] = useState(initialTaskState);
  const [loadingData, setLoadingData] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [taskLoading, setTaskLoading] = useState(false);

  const loadData = async () => {
    setLoadingData(true);

    try {
      const donorRes = await axios.get("/logisticsapi/viewdonors");
      const recipientRes = await axios.get("/logisticsapi/viewrecipients");
      let logisticsData = [];

      try {
        const logisticsRes = await axios.get("/logisticsapi/viewalllogistics");
        logisticsData = Array.isArray(logisticsRes.data)
          ? logisticsRes.data
          : [];
      } catch {
        logisticsData = [];
      }

      const donorList = Array.isArray(donorRes.data) ? donorRes.data : [];
      setDonors(donorList);
      const recipientList = Array.isArray(recipientRes.data)
        ? recipientRes.data
        : [];
      setRecipients(recipientList);
      setLogisticsEntries(logisticsData);

      const donationMap = {};
      await Promise.all(
        donorList.map(async (donor) => {
          const donorId = donor.donorId || donor.id;
          if (!donorId) {
            return;
          }

          try {
            const donationRes = await axios.get(
              `/donorapi/myDonations/${donorId}`,
            );
            donationMap[String(donorId)] = Array.isArray(donationRes.data)
              ? donationRes.data
              : [];
          } catch {
            donationMap[String(donorId)] = asArray(
              donor.donations,
              donor.donationList,
              donor.donorDonations,
              donor.donation ? [donor.donation] : [],
            );
          }
        }),
      );
      setDonorDonationMap(donationMap);

      const requestMap = {};
      await Promise.all(
        recipientList.map(async (recipient) => {
          const recipientId = recipient.recipientId || recipient.id;
          if (!recipientId) {
            return;
          }

          try {
            const reqRes = await axios.get(
              `/recipient/requests/${recipientId}`,
            );
            requestMap[String(recipientId)] = Array.isArray(reqRes.data)
              ? reqRes.data
              : [];
          } catch {
            requestMap[String(recipientId)] = asArray(
              recipient.requests,
              recipient.requestList,
              recipient.recipientRequests,
              recipient.needRequests,
              recipient.request ? [recipient.request] : [],
            );
          }
        }),
      );
      setRecipientRequestMap(requestMap);

      try {
        setLoadingDetails(true);
        const details = await fetchVariantData("detailsView");
        setLogisticsDetails(details);
      } catch {
        setLogisticsDetails([]);
      } finally {
        setLoadingDetails(false);
      }
    } catch {
      toast.error("Unable to load logistics data.", {
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
    if (
      ["home", "donors", "recipients", "details", "tasks"].includes(section)
    ) {
      loadData();
    }
  }, [section]);

  const activeEntries = useMemo(() => {
    return logisticsEntries.filter((entry) => {
      const status = String(entry.deliveryStatus || "pending").toLowerCase();
      return status === "pending" || status === "out_for_delivery";
    }).length;
  }, [logisticsEntries]);

  const completedEntries = useMemo(() => {
    return logisticsEntries.filter((entry) => {
      const status = String(entry.deliveryStatus || "").toLowerCase();
      return status === "delivered" || status === "completed";
    }).length;
  }, [logisticsEntries]);

  const onTaskUpdate = (field, value) => {
    setTaskForm((current) => ({ ...current, [field]: value }));
  };

  const resolveLogisticsId = () => {
    if (taskForm.logisticsId) {
      return Number(taskForm.logisticsId);
    }

    const matchFromEntries = logisticsEntries.find((entry) => {
      const donorMatch =
        !taskForm.donorId ||
        String(getDonorLabel(entry) || "") === String(taskForm.donorId);
      const recipientMatch =
        !taskForm.recipientId ||
        String(getRecipientLabel(entry) || "") === String(taskForm.recipientId);
      const requestMatch =
        !taskForm.requestId ||
        String(getRequestId(entry) || "") === String(taskForm.requestId);

      return donorMatch && recipientMatch && requestMatch;
    });

    if (matchFromEntries) {
      const resolved = Number(getLogisticsEntryId(matchFromEntries));
      return Number.isNaN(resolved) ? 0 : resolved;
    }

    const matchFromDetails = logisticsDetails.find((entry) => {
      const donorMatch =
        !taskForm.donorId ||
        String(getDonorLabel(entry) || "") === String(taskForm.donorId);
      const recipientMatch =
        !taskForm.recipientId ||
        String(getRecipientLabel(entry) || "") === String(taskForm.recipientId);
      const requestMatch =
        !taskForm.requestId ||
        String(getRequestId(entry) || "") === String(taskForm.requestId);

      return donorMatch && recipientMatch && requestMatch;
    });

    if (!matchFromDetails) {
      return 0;
    }

    const resolved = Number(getLogisticsEntryId(matchFromDetails));
    return Number.isNaN(resolved) ? 0 : resolved;
  };

  const toDetailsPayload = (source) => ({
    detailId: source.detailId || source.logisticsDetailId || "",
    logisticsDetailId: source.detailId || source.logisticsDetailId || "",
    coordinatorId: Number(
      source.coordinatorId || user?.id || user?.coordinatorId || 0,
    ),
    donorId: Number(source.donorId || 0),
    recipientId: Number(source.recipientId || 0),
    requestId: Number(source.requestId || 0),
    pickupDate: source.pickupDate || "",
    deliveryStatus: source.deliveryStatus || source.status || "PENDING",
    status: source.deliveryStatus || source.status || "PENDING",
    transportType: source.transportType || "",
    pickupLocation: source.pickupLocation || "",
    deliveryLocation: source.deliveryLocation || "",
    route: source.route || "",
  });

  const persistTaskDetails = async (taskPayload) => {
    const detailsPayload = toDetailsPayload(taskPayload);

    if (
      !detailsPayload.coordinatorId ||
      !detailsPayload.donorId ||
      !detailsPayload.recipientId
    ) {
      return;
    }

    try {
      await executeVariant("detailsSave", detailsPayload);
    } catch {
      toast.warning("Task updated but logistics_details sync failed.", {
        autoClose: 6000,
      });
    }
  };

  const submitTaskAction = async (actionKey) => {
    const logisticsId = resolveLogisticsId();
    const coordinatorId =
      taskForm.coordinatorId || user?.id || user?.coordinatorId || "";

    const commonPayload = {
      logisticsId,
      coordinatorId: Number(coordinatorId),
      donorId: Number(taskForm.donorId),
      recipientId: Number(taskForm.recipientId),
      requestId: Number(taskForm.requestId),
      pickupDate: taskForm.pickupDate,
      status: taskForm.deliveryStatus,
      deliveryStatus: taskForm.deliveryStatus,
      transportType: taskForm.transportType,
      route: taskForm.route,
      pickupLocation: taskForm.pickupLocation,
      deliveryLocation: taskForm.deliveryLocation,
    };

    let payload = commonPayload;

    if (actionKey === "pickup") {
      payload = {
        logisticsId,
        pickupDate: taskForm.pickupDate,
      };
      if (!payload.logisticsId || !payload.pickupDate) {
        toast.error("Logistics ID and pickup date are required.", {
          autoClose: 6000,
        });
        return;
      }
    }

    if (actionKey === "delivery") {
      payload = {
        logisticsId,
        status: taskForm.deliveryStatus,
        deliveryStatus: taskForm.deliveryStatus,
      };
      if (!payload.logisticsId || !payload.status) {
        toast.error("Logistics ID and delivery status are required.", {
          autoClose: 6000,
        });
        return;
      }
    }

    if (actionKey === "driver") {
      payload = {
        logisticsId,
        transportType: taskForm.transportType,
        coordinatorId: Number(coordinatorId),
      };
      if (
        !payload.logisticsId ||
        !payload.transportType ||
        !payload.coordinatorId
      ) {
        toast.error(
          "Logistics ID, transport type, and coordinator ID are required.",
          {
            autoClose: 6000,
          },
        );
        return;
      }
    }

    if (actionKey === "route") {
      payload = {
        coordinatorId: Number(coordinatorId),
        route: taskForm.route,
      };
      if (!payload.coordinatorId || !payload.route) {
        toast.error("Coordinator ID and route are required.", {
          autoClose: 6000,
        });
        return;
      }
    }

    if (actionKey === "locations") {
      payload = {
        logisticsId,
        pickupLocation: taskForm.pickupLocation,
        deliveryLocation: taskForm.deliveryLocation,
      };
      if (
        !payload.logisticsId ||
        !payload.pickupLocation ||
        !payload.deliveryLocation
      ) {
        toast.error(
          "Logistics ID, pickup location, and delivery location are required.",
          {
            autoClose: 6000,
          },
        );
        return;
      }
    }

    setTaskLoading(true);

    try {
      await executeVariant(actionKey, payload);
      await persistTaskDetails(commonPayload);
      toast.success("Logistics operation completed.", {
        autoClose: 6000,
      });
      await loadData();
    } catch {
      toast.error("Unable to complete logistics operation.", {
        autoClose: 6000,
      });
    } finally {
      setTaskLoading(false);
    }
  };

  const assignTaskToDetails = async () => {
    const coordinatorId =
      taskForm.coordinatorId || user?.id || user?.coordinatorId || "";

    if (!taskForm.donorId || !taskForm.recipientId || !taskForm.requestId) {
      toast.error(
        "Donor ID, recipient ID, and request ID are required for assignment.",
        {
          autoClose: 6000,
        },
      );
      return;
    }

    const detailsPayload = toDetailsPayload({
      logisticsId: resolveLogisticsId(),
      coordinatorId,
      donorId: taskForm.donorId,
      recipientId: taskForm.recipientId,
      requestId: taskForm.requestId,
      pickupDate: taskForm.pickupDate,
      deliveryStatus: taskForm.deliveryStatus || "PENDING",
      transportType: taskForm.transportType,
      pickupLocation: taskForm.pickupLocation,
      deliveryLocation: taskForm.deliveryLocation,
      route: taskForm.route,
    });

    setTaskLoading(true);
    try {
      await executeVariant("detailsSave", detailsPayload);
      toast.success(
        "Donor assigned to recipient request and saved to logistics_details.",
        {
          autoClose: 6000,
        },
      );
      await loadData();
    } catch {
      toast.error("Unable to assign donor to recipient request.", {
        autoClose: 6000,
      });
    } finally {
      setTaskLoading(false);
    }
  };

  const updateLogisticsDetailRow = async (entry, overrides = {}) => {
    const payload = {
      detailId: getDetailId(entry),
      logisticsDetailId: getDetailId(entry),
      coordinatorId: Number(
        entry.coordinatorId ||
          entry.logisticsCoordinatorId ||
          entry.coordinator?.id ||
          user?.id ||
          0,
      ),
      donorId: Number(
        entry.donorId || entry.donor?.donorId || entry.donor?.id || 0,
      ),
      recipientId: Number(
        entry.recipientId ||
          entry.recipient?.recipientId ||
          entry.recipient?.id ||
          0,
      ),
      requestId: Number(
        entry.requestId || entry.request?.requestId || entry.request?.id || 0,
      ),
      pickupDate: overrides.pickupDate ?? entry.pickupDate ?? "",
      deliveryStatus: overrides.deliveryStatus ?? getDetailStatus(entry),
      status: overrides.deliveryStatus ?? getDetailStatus(entry),
      transportType: entry.transportType || "",
      pickupLocation: entry.pickupLocation || "",
      deliveryLocation: entry.deliveryLocation || "",
      route: entry.route || "",
    };

    try {
      await executeVariant("detailsUpdate", payload);
      toast.success("Logistics detail updated.", { autoClose: 6000 });
      await loadData();
    } catch {
      toast.error("Unable to update logistics detail.", { autoClose: 6000 });
    }
  };

  const detailSource =
    logisticsDetails.length > 0 ? logisticsDetails : logisticsEntries;

  const detailRows = detailSource.map((entry) => {
    const detailId = getDetailId(entry);
    const coordinatorLabel = getCoordinatorLabel(entry);
    const donorLabel = getDonorLabel(entry);
    const recipientLabel = getRecipientLabel(entry);
    const requestLabel = getRequestLabel(entry);

    return (
      <tr
        key={detailId || `${coordinatorLabel}-${donorLabel}-${recipientLabel}`}
      >
        <td>{detailId || "-"}</td>
        <td>{coordinatorLabel || "N/A"}</td>
        <td>{donorLabel || "N/A"}</td>
        <td>{recipientLabel || "N/A"}</td>
        <td>{requestLabel || "N/A"}</td>
        <td>
          <input
            type="date"
            value={entry.pickupDate || ""}
            onChange={(event) =>
              updateLogisticsDetailRow(entry, {
                pickupDate: event.target.value,
              })
            }
          />
        </td>
        <td>
          <select
            value={getDetailStatus(entry)}
            onChange={(event) =>
              updateLogisticsDetailRow(entry, {
                deliveryStatus: event.target.value,
              })
            }
          >
            <option value="PENDING">PENDING</option>
            <option value="IN_STAGE">IN_STAGE</option>
            <option value="OUT_FOR_DELIVERY">OUT_FOR_DELIVERY</option>
            <option value="DELIVERED">DELIVERED</option>
          </select>
        </td>
        <td>{entry.transportType || "N/A"}</td>
        <td>{entry.pickupLocation || "N/A"}</td>
        <td>{entry.deliveryLocation || "N/A"}</td>
        <td>{entry.route || "N/A"}</td>
        <td>
          <div className="logistics-row-actions">
            <button
              type="button"
              className="logistics-secondary-button"
              onClick={() => updateLogisticsDetailRow(entry)}
            >
              Save
            </button>
          </div>
        </td>
      </tr>
    );
  });

  const donorRows = donors.flatMap((donor) => {
    const donorId = donor.donorId || donor.id;
    const donationRows = asArray(
      donorDonationMap[String(donorId)],
      donor.donations,
      donor.donationList,
      donor.donorDonations,
      donor.donation ? [donor.donation] : [],
    );

    if (donationRows.length === 0) {
      return (
        <tr key={`${donorId}-no-donation`}>
          <td>{donorId || "-"}</td>
          <td>{"-"}</td>
          <td>{donor.name || "N/A"}</td>
          <td>{donor.email || "N/A"}</td>
          <td>{"Check donor donations table"}</td>
          <td>{"Check donor donations table"}</td>
          <td>{"N/A"}</td>
          <td>{"PENDING"}</td>
          <td>{donor.address || donor.location || "N/A"}</td>
        </tr>
      );
    }

    return donationRows.map((donation) => {
      const row = { ...donor, donation };
      const donationId = pickText(
        donation.donationId,
        donation.donation_id,
        donation.id,
      );
      const itemName = getItemName(row);
      const quantity = getQuantity(row);
      const status = pickText(
        donation.deliveryStatus,
        donation.status,
        row.deliveryStatus,
      );

      return (
        <tr key={`${donorId}-${donationId || itemName || "donation"}`}>
          <td>{donorId || "-"}</td>
          <td>{donationId || "-"}</td>
          <td>{donor.name || "N/A"}</td>
          <td>{donor.email || "N/A"}</td>
          <td>{itemName}</td>
          <td>{quantity}</td>
          <td>
            {donation.donationCategory || donation.category || "Not provided"}
          </td>
          <td>{status || "PENDING"}</td>
          <td>{donor.address || donor.location || "N/A"}</td>
        </tr>
      );
    });
  });

  const recipientRows = recipients.flatMap((recipient) => {
    const recipientId = recipient.recipientId || recipient.id;
    const requestRows = asArray(
      recipientRequestMap[String(recipientId)],
      recipient.requests,
      recipient.requestList,
      recipient.recipientRequests,
      recipient.needRequests,
      recipient.request ? [recipient.request] : [],
    );

    if (requestRows.length === 0) {
      const linkedDetailsRows = detailSource.filter(
        (entry) =>
          String(getRecipientLabel(entry) || "") === String(recipientId),
      );

      if (linkedDetailsRows.length > 0) {
        return linkedDetailsRows.map((entry) => {
          const row = {
            ...recipient,
            ...entry,
            request: entry.request || null,
          };
          const itemName = getItemName(row);
          const quantity = getQuantity(row);

          return (
            <tr
              key={`${recipientId}-${getRequestId(row) || getDetailId(row) || "linked"}`}
            >
              <td>{recipientId || "-"}</td>
              <td>{getRequestId(row) || "-"}</td>
              <td>{recipient.name || "N/A"}</td>
              <td>{recipient.email || "N/A"}</td>
              <td>{itemName}</td>
              <td>{quantity}</td>
              <td>{recipient.location || recipient.address || "N/A"}</td>
              <td>{getRequestStatus(row) || "PENDING"}</td>
            </tr>
          );
        });
      }

      return (
        <tr key={`${recipientId}-no-request`}>
          <td>{recipientId || "-"}</td>
          <td>{"-"}</td>
          <td>{recipient.name || "N/A"}</td>
          <td>{recipient.email || "N/A"}</td>
          <td>{"Not provided"}</td>
          <td>{"Not provided"}</td>
          <td>{recipient.location || recipient.address || "N/A"}</td>
          <td>{getRequestStatus(recipient) || "PENDING"}</td>
        </tr>
      );
    }

    return requestRows.map((request) => {
      const row = { ...recipient, request };
      const requestId = getRequestId(row) || "-";
      const itemName = getItemName(row);
      const quantity = getQuantity(row);

      return (
        <tr key={`${recipientId}-${requestId}`}>
          <td>{recipientId || "-"}</td>
          <td>{requestId || "-"}</td>
          <td>{recipient.name || "N/A"}</td>
          <td>{recipient.email || "N/A"}</td>
          <td>{itemName}</td>
          <td>{quantity}</td>
          <td>{recipient.location || recipient.address || "N/A"}</td>
          <td>{getRequestStatus(row) || "PENDING"}</td>
        </tr>
      );
    });
  });

  return (
    <div className="logistics-container">
      <ToastContainer position="top-right" pauseOnHover={true} />

      <div className="logistics-shell">
        {section === "home" && (
          <section className="logistics-hero-card">
            <div className="logistics-hero-copy">
              <p className="logistics-eyebrow">Logistics dashboard</p>
              <h1>Welcome Logistics Coordinator</h1>
              <p>
                Manage pickup, delivery, assignment, and routing operations from
                centered service cards linked to logistics workflows.
              </p>
            </div>

            <div className="logistics-profile-card">
              <p className="logistics-card-label">Coordinator profile</p>
              <strong>{user?.email || user?.name || "Coordinator"}</strong>
              <span>
                Coordinator ID: {user?.id || user?.coordinatorId || "N/A"}
              </span>
            </div>
          </section>
        )}

        {section === "home" && (
          <>
            <section className="logistics-stats-grid">
              <article className="logistics-stat-card accent-blue">
                <span>Donors</span>
                <strong>{donors.length}</strong>
                <p>Available pickup sources</p>
              </article>
              <article className="logistics-stat-card accent-gold">
                <span>Recipients</span>
                <strong>{recipients.length}</strong>
                <p>Pending delivery destinations</p>
              </article>
              <article className="logistics-stat-card accent-green">
                <span>Logistics Entries</span>
                <strong>{logisticsEntries.length}</strong>
                <p>Tracked logistics records</p>
              </article>
            </section>

            <section className="logistics-stats-grid">
              <article className="logistics-stat-card accent-blue">
                <span>Active</span>
                <strong>{activeEntries}</strong>
                <p>Pending or out for delivery</p>
              </article>
              <article className="logistics-stat-card accent-green">
                <span>Completed</span>
                <strong>{completedEntries}</strong>
                <p>Delivered entries</p>
              </article>
            </section>
          </>
        )}

        {section === "donors" && (
          <section className="logistics-card">
            <div className="logistics-card-heading">
              <div>
                <p className="logistics-card-label">Donor service</p>
                <h2>View All Donors</h2>
              </div>
              <button
                type="button"
                className="logistics-secondary-button"
                onClick={loadData}
              >
                {loadingData ? "Refreshing..." : "Refresh"}
              </button>
            </div>

            {loadingData ? (
              <div className="logistics-empty-state">Loading donors...</div>
            ) : donorRows.length === 0 ? (
              <div className="logistics-empty-state">No donors available.</div>
            ) : (
              <div className="logistics-table-wrap">
                <table className="logistics-data-table">
                  <thead>
                    <tr>
                      <th>Donor ID</th>
                      <th>Donation ID</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Item Name</th>
                      <th>Quantity</th>
                      <th>Category</th>
                      <th>Status</th>
                      <th>Address</th>
                    </tr>
                  </thead>
                  <tbody>{donorRows}</tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {section === "recipients" && (
          <section className="logistics-card">
            <div className="logistics-card-heading">
              <div>
                <p className="logistics-card-label">Recipient service</p>
                <h2>View All Recipients</h2>
              </div>
              <button
                type="button"
                className="logistics-secondary-button"
                onClick={loadData}
              >
                {loadingData ? "Refreshing..." : "Refresh"}
              </button>
            </div>

            {loadingData ? (
              <div className="logistics-empty-state">Loading recipients...</div>
            ) : recipientRows.length === 0 ? (
              <div className="logistics-empty-state">
                No recipients available.
              </div>
            ) : (
              <div className="logistics-table-wrap">
                <table className="logistics-data-table">
                  <thead>
                    <tr>
                      <th>Recipient ID</th>
                      <th>Request ID</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Item Name</th>
                      <th>Quantity</th>
                      <th>Location</th>
                      <th>Request Status</th>
                    </tr>
                  </thead>
                  <tbody>{recipientRows}</tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {section === "details" && (
          <section className="logistics-details-table-panel">
            <div className="logistics-card-heading">
              <div>
                <p className="logistics-card-label">Assigned logistics list</p>
                <h2>Donor to recipient tracking table</h2>
              </div>
              <button
                type="button"
                className="logistics-secondary-button"
                onClick={loadData}
              >
                {loadingDetails ? "Loading..." : "Refresh Details"}
              </button>
            </div>

            {loadingDetails ? (
              <div className="logistics-empty-state">
                Loading logistics details...
              </div>
            ) : detailRows.length === 0 ? (
              <div className="logistics-empty-state">
                No logistics details found.
              </div>
            ) : (
              <div className="logistics-table-wrap">
                <table className="logistics-data-table logistics-details-table">
                  <thead>
                    <tr>
                      <th>Detail ID</th>
                      <th>Coordinator ID</th>
                      <th>Donor ID</th>
                      <th>Recipient ID</th>
                      <th>Request ID</th>
                      <th>Pickup Date</th>
                      <th>Delivery Status</th>
                      <th>Transport Type</th>
                      <th>Pickup Location</th>
                      <th>Delivery Location</th>
                      <th>Route</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>{detailRows}</tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {section === "tasks" && (
          <section className="logistics-single-column">
            <article className="logistics-card">
              <div className="logistics-card-heading">
                <div>
                  <p className="logistics-card-label">Coordinator operations</p>
                  <h2>Live logistics updates</h2>
                </div>
                <span className="logistics-card-subtitle">
                  Update pickup, delivery, transport, and location data
                </span>
              </div>

              <div className="logistics-form-grid">
                <div className="logistics-id-row full-width">
                  <div className="logistics-field">
                    <label htmlFor="coordinatorTaskId">Coordinator ID</label>
                    <input
                      id="coordinatorTaskId"
                      value={taskForm.coordinatorId}
                      onChange={(event) =>
                        onTaskUpdate("coordinatorId", event.target.value)
                      }
                      placeholder="Coordinator ID"
                    />
                  </div>

                  <div className="logistics-field">
                    <label htmlFor="donorTaskId">Donor ID</label>
                    <input
                      id="donorTaskId"
                      value={taskForm.donorId}
                      onChange={(event) =>
                        onTaskUpdate("donorId", event.target.value)
                      }
                      placeholder="Donor ID"
                    />
                  </div>

                  <div className="logistics-field">
                    <label htmlFor="recipientTaskId">Recipient ID</label>
                    <input
                      id="recipientTaskId"
                      value={taskForm.recipientId}
                      onChange={(event) =>
                        onTaskUpdate("recipientId", event.target.value)
                      }
                      placeholder="Recipient ID"
                    />
                  </div>
                </div>

                <div className="logistics-field">
                  <label htmlFor="requestId">Request ID</label>
                  <input
                    id="requestId"
                    value={taskForm.requestId}
                    onChange={(event) =>
                      onTaskUpdate("requestId", event.target.value)
                    }
                    placeholder="Recipient request ID"
                  />
                </div>

                <div className="logistics-field">
                  <label htmlFor="pickupDate">Pickup Date</label>
                  <input
                    id="pickupDate"
                    type="date"
                    value={taskForm.pickupDate}
                    onChange={(event) =>
                      onTaskUpdate("pickupDate", event.target.value)
                    }
                  />
                  <button
                    type="button"
                    onClick={() => submitTaskAction("pickup")}
                    disabled={taskLoading}
                  >
                    Update Pickup Schedule
                  </button>
                </div>

                <div className="logistics-field">
                  <label htmlFor="deliveryStatus">Delivery Status</label>
                  <select
                    id="deliveryStatus"
                    value={taskForm.deliveryStatus}
                    onChange={(event) =>
                      onTaskUpdate("deliveryStatus", event.target.value)
                    }
                  >
                    <option value="">Select status</option>
                    <option value="PENDING">PENDING</option>
                    <option value="IN_STAGE">IN_STAGE</option>
                    <option value="OUT_FOR_DELIVERY">OUT_FOR_DELIVERY</option>
                    <option value="DELIVERED">DELIVERED</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => submitTaskAction("delivery")}
                    disabled={taskLoading}
                  >
                    Update Delivery Status
                  </button>
                </div>

                <div className="logistics-field">
                  <label htmlFor="transportType">Transport Type</label>
                  <input
                    id="transportType"
                    value={taskForm.transportType}
                    onChange={(event) =>
                      onTaskUpdate("transportType", event.target.value)
                    }
                    placeholder="Bike / Van / Truck"
                  />
                  <button
                    type="button"
                    onClick={() => submitTaskAction("driver")}
                    disabled={taskLoading}
                  >
                    Assign Driver / Transport
                  </button>
                </div>

                <div className="logistics-field">
                  <label htmlFor="route">Route</label>
                  <input
                    id="route"
                    value={taskForm.route}
                    onChange={(event) =>
                      onTaskUpdate("route", event.target.value)
                    }
                    placeholder="Route assignment"
                  />
                  <button
                    type="button"
                    onClick={() => submitTaskAction("route")}
                    disabled={taskLoading}
                  >
                    Update Route
                  </button>
                </div>

                <div className="logistics-field full-width">
                  <label htmlFor="pickupLocation">Pickup Location</label>
                  <input
                    id="pickupLocation"
                    value={taskForm.pickupLocation}
                    onChange={(event) =>
                      onTaskUpdate("pickupLocation", event.target.value)
                    }
                    placeholder="Pickup location"
                  />
                </div>

                <div className="logistics-field full-width">
                  <label htmlFor="deliveryLocation">Delivery Location</label>
                  <input
                    id="deliveryLocation"
                    value={taskForm.deliveryLocation}
                    onChange={(event) =>
                      onTaskUpdate("deliveryLocation", event.target.value)
                    }
                    placeholder="Delivery location"
                  />
                </div>

                <button
                  className="logistics-primary-button full-width"
                  type="button"
                  onClick={assignTaskToDetails}
                  disabled={taskLoading}
                >
                  {taskLoading
                    ? "Assigning..."
                    : "Assign Donor to Recipient Request"}
                </button>

                <div className="logistics-empty-state">
                  Logistics ID is auto-resolved from the assigned Donor ID,
                  Recipient ID, and Request ID.
                </div>

                <button
                  className="logistics-primary-button full-width"
                  type="button"
                  onClick={() => submitTaskAction("locations")}
                  disabled={taskLoading}
                >
                  {taskLoading
                    ? "Updating..."
                    : "Update Pickup & Delivery Locations"}
                </button>
              </div>
            </article>
          </section>
        )}
      </div>
    </div>
  );
}
