import React from "react";

export const Loading = ({ message = "Loading..." }) => {
  return (
    <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--text-500)" }}>
      <div
        style={{
          width: "32px",
          height: "32px",
          border: "3px solid var(--blue-100)",
          borderTopColor: "var(--blue-700)",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
          margin: "0 auto 12px"
        }}
      />
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
      <p style={{ margin: 0, fontSize: "0.85rem" }}>{message}</p>
    </div>
  );
};

export default Loading;
