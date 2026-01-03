import { useState } from "react";
import { FiEye, FiEyeOff, FiLoader } from "react-icons/fi";

interface ConfirmWithPasswordModalProps {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isProcessing?: boolean;
  onConfirm: (adminPassword: string) => Promise<void> | void;
  onCancel: () => void;
}

export function ConfirmWithPasswordModal({
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  isProcessing = false,
  onConfirm,
  onCancel,
}: ConfirmWithPasswordModalProps) {
  const [adminPassword, setAdminPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminPassword.trim()) {
      setError("Admin password is required.");
      return;
    }
    setError(null);
    await onConfirm(adminPassword);
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1100,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isProcessing) {
          onCancel();
        }
      }}
    >
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "8px",
          padding: "1.75rem",
          width: "90%",
          maxWidth: "420px",
          boxShadow: "0 4px 8px rgba(0,0,0,0.15)",
        }}
      >
        <h2 style={{ marginTop: 0, marginBottom: "0.75rem" }}>{title}</h2>
        <p style={{ marginBottom: "1rem", color: "#444", whiteSpace: "pre-line" }}>
          {message}
        </p>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "0.75rem" }}>
            <label
              style={{
                display: "block",
                marginBottom: "0.35rem",
                fontWeight: 500,
              }}
            >
              Admin Password
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                autoFocus
                disabled={isProcessing}
                style={{
                  width: "100%",
                  padding: "0.6rem 2.25rem 0.6rem 0.75rem",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  fontSize: "0.95rem",
                  boxSizing: "border-box",
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                style={{
                  position: "absolute",
                  right: "0.5rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  padding: 0,
                  margin: 0,
                  cursor: "pointer",
                  color: "#6c757d",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                aria-label={showPassword ? "Hide password" : "Show password"}
                disabled={isProcessing}
              >
                {showPassword ? (
                  <FiEyeOff style={{ fontSize: "1rem" }} />
                ) : (
                  <FiEye style={{ fontSize: "1rem" }} />
                )}
              </button>
            </div>
            {error && (
              <div style={{ marginTop: "0.35rem", color: "#dc3545", fontSize: "0.85rem" }}>
                {error}
              </div>
            )}
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "0.75rem",
              marginTop: "1.25rem",
            }}
          >
            <button
              type="button"
              onClick={onCancel}
              disabled={isProcessing}
              style={{
                padding: "0.6rem 1.1rem",
                backgroundColor: "#6c757d",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: isProcessing ? "not-allowed" : "pointer",
                fontSize: "0.9rem",
              }}
            >
              {cancelLabel}
            </button>
            <button
              type="submit"
              disabled={isProcessing}
              style={{
                padding: "0.6rem 1.3rem",
                backgroundColor: isProcessing ? "#ccc" : "#dc3545",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: isProcessing ? "not-allowed" : "pointer",
                fontSize: "0.9rem",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
              }}
            >
              {isProcessing && (
                <FiLoader
                  style={{
                    fontSize: "1rem",
                  }}
                />
              )}
              {isProcessing ? "Processing..." : confirmLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


