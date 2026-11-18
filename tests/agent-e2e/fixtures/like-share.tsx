"use client";

import { useState, type CSSProperties } from "react";

const button: CSSProperties = {
  height: 36,
  padding: "0 14px",
  borderRadius: 999,
  border: "1px solid #d4d4d4",
  background: "#fff",
  font: "inherit",
  cursor: "pointer",
};

/** A sample component with no ghost-cursor attributes, like one an agent meets in a real project. */
export function LikeShare() {
  const [liked, setLiked] = useState(false);
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState("");

  const pick = (label: string) => {
    setOpen(false);
    setStatus(label === "Copy link" ? "Link copied" : "Email draft opened");
  };

  return (
    <div style={{ display: "grid", justifyItems: "center", gap: 12, padding: 32, fontFamily: "system-ui, sans-serif" }}>
      <div style={{ position: "relative", display: "flex", gap: 8 }}>
        <button type="button" aria-pressed={liked} onClick={() => setLiked((l) => !l)} style={button}>
          {liked ? "Liked" : "Like"} · {liked ? 13 : 12}
        </button>
        <button
          type="button"
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          style={button}
        >
          Share
        </button>
        {open && (
          <div
            role="menu"
            style={{
              position: "absolute",
              top: 44,
              right: 0,
              display: "grid",
              minWidth: 150,
              padding: 4,
              borderRadius: 10,
              border: "1px solid #e5e5e5",
              background: "#fff",
              boxShadow: "0 8px 24px -6px rgb(0 0 0 / 0.15)",
            }}
          >
            {["Copy link", "Email"].map((label) => (
              <button
                key={label}
                type="button"
                role="menuitem"
                onClick={() => pick(label)}
                style={{ ...button, border: 0, borderRadius: 6, textAlign: "left" }}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>
      <p role="status" style={{ minHeight: 24, margin: 0, color: "#525252" }}>
        {status}
      </p>
    </div>
  );
}
