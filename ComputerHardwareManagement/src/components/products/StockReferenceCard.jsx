import React from "react";

export const StockReferenceCard = ({ references = [] }) => {
  if (!references || references.length === 0) {
    return (
      <div className="ref-box">
        <div className="ric">📄</div>
        <div>
          <div className="dt" style={{ marginBottom: "2px" }}>Record Reference</div>
          <div className="dd" style={{ color: "var(--text-500)", fontWeight: "normal" }}>
            No physical register reference recorded.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="references-grid">
      {references.map((ref, idx) => (
        <div key={idx} className="ref-box">
          <div className="ric" aria-hidden="true">📄</div>
          <div style={{ display: "flex", gap: "28px", flexWrap: "wrap" }}>
            <div>
              <div className="dt" style={{ marginBottom: "2px" }}>Sheet / Register</div>
              <div className="dd" style={{ fontWeight: 600 }}>{ref.sheet || "—"}</div>
            </div>
            <div>
              <div className="dt" style={{ marginBottom: "2px" }}>Page Number</div>
              <div className="dd" style={{ fontWeight: 600 }}>Page {ref.page || "—"}</div>
            </div>
            {ref.note && (
              <div>
                <div className="dt" style={{ marginBottom: "2px" }}>Note</div>
                <div className="dd" style={{ color: "var(--text-600)", fontSize: "0.85rem" }}>{ref.note}</div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default StockReferenceCard;
