import React from "react";

export const StatusBadge = ({ status, type = "badge" }) => {
  if (type === "transaction") {
    const isOut = status === "OUT";
    return <span className={isOut ? "tag-out" : "tag-in"}>{status}</span>;
  }

  // Determine badge styling based on status text or category
  let badgeClass = "badge-grey";
  const normalized = (status || "").toLowerCase();

  if (normalized.includes("available") || normalized.includes("normal") || normalized.includes("approved") || normalized.includes("completed")) {
    badgeClass = "badge-green";
  } else if (normalized.includes("low") || normalized.includes("critical") || normalized.includes("below") || normalized.includes("rejected")) {
    badgeClass = "badge-red";
  } else if (normalized.includes("nearing") || normalized.includes("pending") || normalized.includes("warning")) {
    badgeClass = "badge-amber";
  } else if (normalized.includes("recommended") || normalized.includes("issued") || normalized.includes("info")) {
    badgeClass = "badge-blue";
  }

  return <span className={`badge ${badgeClass}`}>{status}</span>;
};

export default StatusBadge;
