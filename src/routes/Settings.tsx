import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { APP_CONFIG } from "../config/appConfig";
import { api } from "../lib/api";
import { formatErrorMessage } from "../lib/errorUtils";
import { usePageTitle } from "../hooks/usePageTitle";

type LogoInfo = {
  file_name: string;
  uploaded_at: string;
} | null;

export default function Settings() {
  const [logoInfo, setLogoInfo] = useState<LogoInfo>(null);
  const [loadingLogo, setLoadingLogo] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  usePageTitle("Settings");

  const loadLogo = async () => {
    try {
      setLoadingLogo(true);
      const docs = await api.documents.list("company", 1);
      const logoDoc =
        docs.find((d: any) => d.document_type === "logo") ?? docs[0] ?? null;
      if (logoDoc) {
        setLogoInfo({
          file_name: logoDoc.file_name,
          uploaded_at: logoDoc.uploaded_at,
        });
      } else {
        setLogoInfo(null);
      }
    } catch (e) {
      console.error("Failed to load logo info:", e);
    } finally {
      setLoadingLogo(false);
    }
  };

  useEffect(() => {
    loadLogo();
  }, []);

  const handleUploadLogo = async () => {
    try {
      setUploadingLogo(true);
      await api.documents.upload("company", 1, "logo");
      await loadLogo();
      toast.success("Logo uploaded successfully.");
    } catch (error: any) {
      if (!error?.message?.includes("canceled")) {
        toast.error(
          "Failed to upload logo: " +
            formatErrorMessage(error, "Please try again.")
        );
      }
    } finally {
      setUploadingLogo(false);
    }
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h1 style={{ marginBottom: "1.5rem" }}>Settings</h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.4fr 1fr",
          gap: "1.5rem",
          alignItems: "stretch",
        }}
      >
        {/* Company Details + Branding */}
        <div
          style={{
            backgroundColor: "white",
            padding: "1.75rem",
            borderRadius: "12px",
            boxShadow: "0 10px 25px rgba(15, 23, 42, 0.08)",
            border: "1px solid #e5e7eb",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "1.25rem",
            }}
          >
            <div>
              <h2
                style={{
                  margin: 0,
                  marginBottom: "0.35rem",
                  fontSize: "1.2rem",
                  fontWeight: 700,
                  color: "#111827",
                }}
              >
                Company Profile
              </h2>
              <p
                style={{
                  margin: 0,
                  fontSize: "0.9rem",
                  color: "#6b7280",
                }}
              >
                These details are used across the application and on letter
                pads.
              </p>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.2fr 1fr",
              gap: "1.5rem",
              alignItems: "flex-start",
            }}
          >
            {/* Text details */}
            <div style={{ display: "grid", gap: "0.75rem" }}>
              <div>
                <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>
                  Name
                </div>
                <div style={{ fontSize: "1.05rem", fontWeight: 600 }}>
                  {APP_CONFIG.companyName || "-"}
                </div>
              </div>
              <div>
                <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>
                  Address
                </div>
                <div
                  style={{
                    whiteSpace: "pre-line",
                    fontSize: "0.95rem",
                    color: "#111827",
                  }}
                >
                  {[APP_CONFIG.addressLine1, APP_CONFIG.addressLine2]
                    .filter(Boolean)
                    .join("\n") || "-"}
                </div>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                  gap: "0.75rem",
                }}
              >
                <div>
                  <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>
                    Phone
                  </div>
                  <div style={{ fontSize: "0.95rem" }}>
                    {APP_CONFIG.phone || "-"}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>
                    Email
                  </div>
                  <div style={{ fontSize: "0.95rem" }}>
                    {APP_CONFIG.email || "-"}
                  </div>
                </div>
              </div>
              <div>
                <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>
                  Website
                </div>
                <div style={{ fontSize: "0.95rem", color: "#2563eb" }}>
                  {APP_CONFIG.website || "-"}
                </div>
              </div>
            </div>

            {/* Logo upload card */}
            <div
              style={{
                borderRadius: "10px",
                border: "1px dashed #d1d5db",
                padding: "1rem",
                background:
                  "linear-gradient(135deg, rgba(239,246,255,0.9), rgba(255,251,235,0.9))",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  textAlign: "center",
                  gap: "0.5rem",
                }}
              >
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 16,
                    background:
                      "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    fontWeight: 700,
                    fontSize: "1.1rem",
                    boxShadow: "0 10px 25px rgba(129,140,248,0.45)",
                  }}
                >
                  {(APP_CONFIG.companyName || "SK")
                    .split(" ")
                    .map((w) => w[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
                <div style={{ fontSize: "0.95rem", fontWeight: 600 }}>
                  Company Logo
                </div>
                <div
                  style={{
                    fontSize: "0.8rem",
                    color: "#6b7280",
                    marginBottom: "0.25rem",
                  }}
                >
                  Upload a logo to use on letter pads and reports.
                </div>
                <button
                  type="button"
                  onClick={handleUploadLogo}
                  disabled={uploadingLogo}
                  style={{
                    marginTop: "0.25rem",
                    padding: "0.5rem 1.25rem",
                    borderRadius: "999px",
                    border: "none",
                    cursor: uploadingLogo ? "not-allowed" : "pointer",
                    background: uploadingLogo
                      ? "#9ca3af"
                      : "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                    color: "white",
                    fontSize: "0.9rem",
                    fontWeight: 600,
                    boxShadow: uploadingLogo
                      ? "none"
                      : "0 8px 18px rgba(129,140,248,0.55)",
                    transition: "all 0.15s ease-out",
                  }}
                >
                  {uploadingLogo ? "Uploading..." : "Upload Logo"}
                </button>
                <div
                  style={{
                    marginTop: "0.5rem",
                    fontSize: "0.75rem",
                    color: "#6b7280",
                  }}
                >
                  Accepted: JPG, PNG, PDF (stored securely on this computer).
                </div>
                <div
                  style={{
                    marginTop: "0.35rem",
                    fontSize: "0.75rem",
                    color: "#4b5563",
                  }}
                >
                  {loadingLogo
                    ? "Checking current logo..."
                    : logoInfo
                    ? `Current: ${logoInfo.file_name} (uploaded ${new Date(
                        logoInfo.uploaded_at
                      ).toLocaleDateString("en-IN")})`
                    : "No logo uploaded yet."}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* About / Developer Profile */}
        <div
          style={{
            backgroundColor: "white",
            padding: "1.75rem",
            borderRadius: "12px",
            boxShadow: "0 10px 25px rgba(15, 23, 42, 0.08)",
            border: "1px solid #e5e7eb",
          }}
        >
          <h2
            style={{
              marginTop: 0,
              marginBottom: "0.75rem",
              fontSize: "1.2rem",
              fontWeight: 700,
              color: "#111827",
            }}
          >
            About
          </h2>
          <p
            style={{
              marginTop: 0,
              marginBottom: "1rem",
              fontSize: "0.9rem",
              color: "#6b7280",
            }}
          >
            Information about this application and the developer.
          </p>

          <div style={{ marginBottom: "1.5rem" }}>
            <div style={{ fontSize: "0.8rem", color: "#6b7280" }}>
              Application
            </div>
            <div style={{ fontWeight: 600, marginTop: "0.25rem" }}>
              Loan Management System
            </div>
            <div
              style={{
                fontSize: "0.85rem",
                color: "#6b7280",
                marginTop: "0.25rem",
              }}
            >
              Designed for {APP_CONFIG.companyName || "your company"} to manage
              customers, loans, payments and reports efficiently.
            </div>
          </div>

          <div>
            <div style={{ fontSize: "0.8rem", color: "#6b7280" }}>
              Developer Profile
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                marginTop: "0.5rem",
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "999px",
                  background:
                    "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontWeight: 700,
                  fontSize: "0.9rem",
                }}
              >
                {(
                  APP_CONFIG.developerInitials ||
                  (APP_CONFIG.developerName || "")
                    .split(" ")
                    .map((w) => w[0])
                    .join("")
                    .slice(0, 2) ||
                  "DV"
                ).toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight: 600 }}>
                  {APP_CONFIG.developerName || "Developer"}
                </div>
                <div style={{ fontSize: "0.8rem", color: "#6b7280" }}>
                  {APP_CONFIG.developerRole || "Developer"}
                </div>
              </div>
            </div>
            <div
              style={{
                fontSize: "0.85rem",
                color: "#6b7280",
                marginTop: "0.5rem",
              }}
            >
              Email: {APP_CONFIG.developerEmail || "not specified"}
            </div>
            {(APP_CONFIG.developerWebsite ||
              APP_CONFIG.developerLinkedIn ||
              APP_CONFIG.developerGithub) && (
              <div
                style={{
                  fontSize: "0.85rem",
                  color: "#6b7280",
                  marginTop: "0.5rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.2rem",
                }}
              >
                {APP_CONFIG.developerWebsite && (
                  <div>
                    Website:{" "}
                    <a
                      href={APP_CONFIG.developerWebsite}
                      style={{ color: "#2563eb", textDecoration: "none" }}
                    >
                      {APP_CONFIG.developerWebsite}
                    </a>
                  </div>
                )}
                {APP_CONFIG.developerLinkedIn && (
                  <div>
                    LinkedIn:{" "}
                    <a
                      href={APP_CONFIG.developerLinkedIn}
                      style={{ color: "#2563eb", textDecoration: "none" }}
                    >
                      {APP_CONFIG.developerLinkedIn}
                    </a>
                  </div>
                )}
                {APP_CONFIG.developerGithub && (
                  <div>
                    GitHub:{" "}
                    <a
                      href={APP_CONFIG.developerGithub}
                      style={{ color: "#2563eb", textDecoration: "none" }}
                    >
                      {APP_CONFIG.developerGithub}
                    </a>
                  </div>
                )}
                {APP_CONFIG.developerMobile && (
                  <div>Mobile: {APP_CONFIG.developerMobile}</div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
