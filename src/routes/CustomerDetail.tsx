import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { api } from "../lib/api";
import { formatErrorMessage } from "../lib/errorUtils";
import { Customer } from "../types";
import { ConfirmWithPasswordModal } from "../components/ConfirmWithPasswordModal";
import { APP_CONFIG } from "../config/appConfig";
import { usePageTitle } from "../hooks/usePageTitle";

function CustomerLoansTab({ customerId }: { customerId: number }) {
  const [loans, setLoans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLoans();
  }, [customerId]);

  const loadLoans = async () => {
    try {
      const data = await api.loans.list({ customer_id: customerId });
      setLoans(data);
    } catch (error) {
      console.error("Failed to load loans:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "#28a745";
      case "overdue":
        return "#dc3545";
      case "closed":
        return "#6c757d";
      default:
        return "#6c757d";
    }
  };

  if (loading) return <div>Loading loans...</div>;

  return (
    <div>
      <h3 style={{ marginBottom: "1rem" }}>Loans</h3>
      {loans.length === 0 ? (
        <p style={{ color: "#666" }}>No loans found for this customer</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: "#f8f9fa" }}>
              <th style={{ padding: "0.75rem", textAlign: "left" }}>Loan #</th>
              <th style={{ padding: "0.75rem", textAlign: "right" }}>
                Principal
              </th>
              <th style={{ padding: "0.75rem", textAlign: "right" }}>
                Outstanding
              </th>
              <th style={{ padding: "0.75rem", textAlign: "left" }}>
                Next Due
              </th>
              <th style={{ padding: "0.75rem", textAlign: "center" }}>
                Status
              </th>
              <th style={{ padding: "0.75rem", textAlign: "left" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loans.map((loan) => (
              <tr key={loan.id} style={{ borderBottom: "1px solid #dee2e6" }}>
                <td style={{ padding: "0.75rem" }}>{loan.loan_number}</td>
                <td style={{ padding: "0.75rem", textAlign: "right" }}>
                  ${loan.principal.toLocaleString("en-IN")}
                </td>
                <td style={{ padding: "0.75rem", textAlign: "right" }}>
                  ${loan.outstanding_principal.toLocaleString("en-IN")}
                </td>
                <td style={{ padding: "0.75rem" }}>
                  {loan.next_due_date
                    ? new Date(loan.next_due_date).toLocaleDateString()
                    : "-"}
                </td>
                <td style={{ padding: "0.75rem", textAlign: "center" }}>
                  <span
                    style={{
                      padding: "0.25rem 0.75rem",
                      borderRadius: "12px",
                      backgroundColor: getStatusColor(loan.status) + "20",
                      color: getStatusColor(loan.status),
                      fontSize: "0.875rem",
                      textTransform: "capitalize",
                    }}
                  >
                    {loan.status}
                  </span>
                </td>
                <td style={{ padding: "0.75rem" }}>
                  <button
                    onClick={() => (window.location.href = `/loans/${loan.id}`)}
                    style={{
                      padding: "0.5rem 1rem",
                      backgroundColor: "#007bff",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "0.875rem",
                    }}
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function CustomerNotesTab({
  customer,
  onUpdate,
}: {
  customer: Customer;
  onUpdate: () => void;
}) {
  const [notes, setNotes] = useState(customer.notes || "");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.customers.update(customer.id, { notes });
      setEditing(false);
      onUpdate();
    } catch (error: any) {
      toast.error(
        "Failed to update notes: " +
          formatErrorMessage(error, "Please try again.")
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1rem",
        }}
      >
        <h3>Notes</h3>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: "#007bff",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            {notes ? "Edit Notes" : "Add Notes"}
          </button>
        )}
      </div>
      {editing ? (
        <div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add internal notes or comments..."
            style={{
              width: "100%",
              minHeight: "200px",
              padding: "1rem",
              border: "1px solid #ddd",
              borderRadius: "4px",
              fontSize: "1rem",
              fontFamily: "inherit",
            }}
          />
          <div
            style={{
              marginTop: "1rem",
              display: "flex",
              gap: "1rem",
              justifyContent: "flex-end",
            }}
          >
            <button
              onClick={() => {
                setNotes(customer.notes || "");
                setEditing(false);
              }}
              style={{
                padding: "0.75rem 1.5rem",
                backgroundColor: "#6c757d",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                padding: "0.75rem 1.5rem",
                backgroundColor: saving ? "#ccc" : "#28a745",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: saving ? "not-allowed" : "pointer",
              }}
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      ) : (
        <div
          style={{
            padding: "1rem",
            backgroundColor: "#f8f9fa",
            borderRadius: "4px",
            minHeight: "100px",
          }}
        >
          {notes || (
            <p style={{ color: "#666", fontStyle: "italic" }}>
              No notes added yet
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function CustomerDocumentsTab({ customerId }: { customerId: number }) {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadDocuments();
  }, [customerId]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const data = await api.documents.list("customer", customerId);
      setDocuments(data);
    } catch (error) {
      console.error("Failed to load documents:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (documentType?: string) => {
    try {
      setUploading(true);
      await api.documents.upload("customer", customerId, documentType);
      await loadDocuments();
      toast.success("Document uploaded successfully!");
    } catch (error: any) {
      if (!error?.message?.includes("canceled")) {
        toast.error(
          "Failed to upload document: " +
            formatErrorMessage(error, "Please try again.")
        );
      }
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (documentId: number, _fileName: string) => {
    try {
      const result = await api.documents.download(documentId);
      if (result) {
        toast.success(`Document saved to: ${result.path}`);
      }
    } catch (error: any) {
      if (!error?.message?.includes("canceled")) {
        toast.error(
          "Failed to download document: " +
            formatErrorMessage(error, "Please try again.")
        );
      }
    }
  };

  const handleDelete = async (documentId: number) => {
    if (!confirm("Are you sure you want to delete this document?")) {
      return;
    }
    try {
      await api.documents.delete(documentId);
      await loadDocuments();
      toast.success("Document deleted successfully!");
    } catch (error: any) {
      toast.error(
        "Failed to delete document: " +
          formatErrorMessage(error, "Please try again.")
      );
    }
  };

  const getDocumentTypeLabel = (type?: string) => {
    if (!type) return "Other";
    const labels: { [key: string]: string } = {
      kyc: "KYC Document",
      id_proof: "ID Proof",
      address_proof: "Address Proof",
      photo: "Photo",
      agreement: "Agreement",
      other: "Other",
    };
    return labels[type] || type;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  if (loading) return <div>Loading documents...</div>;

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1rem",
        }}
      >
        <h3>Documents</h3>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            onClick={() => handleUpload("kyc")}
            disabled={uploading}
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: uploading ? "#ccc" : "#007bff",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: uploading ? "not-allowed" : "pointer",
              fontSize: "0.875rem",
            }}
          >
            {uploading ? "Uploading..." : "+ Upload KYC"}
          </button>
          <button
            onClick={() => handleUpload()}
            disabled={uploading}
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: uploading ? "#ccc" : "#28a745",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: uploading ? "not-allowed" : "pointer",
              fontSize: "0.875rem",
            }}
          >
            {uploading ? "Uploading..." : "+ Upload Document"}
          </button>
        </div>
      </div>

      {documents.length === 0 ? (
        <div
          style={{
            padding: "2rem",
            textAlign: "center",
            color: "#666",
            backgroundColor: "#f8f9fa",
            borderRadius: "4px",
          }}
        >
          <p>No documents uploaded yet</p>
          <p style={{ fontSize: "0.875rem", marginTop: "0.5rem" }}>
            Click "Upload Document" to add KYC documents or other files
          </p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
            gap: "1rem",
          }}
        >
          {documents.map((doc) => (
            <div
              key={doc.id}
              style={{
                border: "1px solid #dee2e6",
                borderRadius: "8px",
                padding: "1rem",
                backgroundColor: "white",
              }}
            >
              <div style={{ marginBottom: "0.75rem" }}>
                <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>
                  {doc.mime_type?.startsWith("image/")
                    ? "🖼️"
                    : doc.mime_type === "application/pdf"
                    ? "📄"
                    : "📎"}
                </div>
                <div style={{ fontWeight: "500", marginBottom: "0.25rem" }}>
                  {doc.file_name}
                </div>
                <div style={{ fontSize: "0.875rem", color: "#666" }}>
                  {getDocumentTypeLabel(doc.document_type)}
                </div>
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: "#999",
                    marginTop: "0.25rem",
                  }}
                >
                  {formatFileSize(doc.file_size)} •{" "}
                  {new Date(doc.uploaded_at).toLocaleDateString()}
                </div>
              </div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  onClick={() => handleDownload(doc.id, doc.file_name)}
                  style={{
                    flex: 1,
                    padding: "0.5rem",
                    backgroundColor: "#007bff",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "0.875rem",
                  }}
                >
                  Download
                </button>
                <button
                  onClick={() => handleDelete(doc.id)}
                  style={{
                    padding: "0.5rem",
                    backgroundColor: "#dc3545",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "0.875rem",
                  }}
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CustomerPaymentsTab({ customerId }: { customerId: number }) {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPayments();
  }, [customerId]);

  const loadPayments = async () => {
    try {
      const data = await api.payments.list({ customer_id: customerId });
      setPayments(data);
    } catch (error) {
      console.error("Failed to load payments:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading payments...</div>;

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1rem",
        }}
      >
        <h3>Payment History</h3>
        <button
          onClick={async () => {
            try {
              const result = await api.reports.generateCustomerStatement(
                customerId
              );
              if (result.success) {
                toast.success(
                  `Customer statement PDF saved to: ${result.path}`
                );
              }
            } catch (error: any) {
              if (!error.message.includes("canceled")) {
                toast.error("Failed to generate statement: " + error.message);
              }
            }
          }}
          style={{
            padding: "0.5rem 1rem",
            backgroundColor: "#28a745",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "0.875rem",
          }}
        >
          📄 Download Statement (PDF)
        </button>
      </div>
      {payments.length === 0 ? (
        <p style={{ color: "#666" }}>No payments found</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: "#f8f9fa" }}>
              <th style={{ padding: "0.75rem", textAlign: "left" }}>Date</th>
              <th style={{ padding: "0.75rem", textAlign: "left" }}>Loan #</th>
              <th style={{ padding: "0.75rem", textAlign: "right" }}>Amount</th>
              <th style={{ padding: "0.75rem", textAlign: "left" }}>Mode</th>
              <th style={{ padding: "0.75rem", textAlign: "left" }}>
                Reference
              </th>
            </tr>
          </thead>
          <tbody>
            {payments.map((payment) => (
              <tr
                key={payment.id}
                style={{ borderBottom: "1px solid #dee2e6" }}
              >
                <td style={{ padding: "0.75rem" }}>
                  {new Date(payment.payment_date).toLocaleDateString()}
                </td>
                <td style={{ padding: "0.75rem" }}>{payment.loan_number}</td>
                <td
                  style={{
                    padding: "0.75rem",
                    textAlign: "right",
                    fontWeight: "500",
                  }}
                >
                  ${payment.amount.toLocaleString("en-IN")}
                </td>
                <td style={{ padding: "0.75rem", textTransform: "capitalize" }}>
                  {payment.payment_mode}
                </td>
                <td style={{ padding: "0.75rem", color: "#666" }}>
                  {payment.reference_number || "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default function CustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "loans" | "payments" | "documents" | "notes"
  >("loans");
  const [showDeleteCustomerModal, setShowDeleteCustomerModal] = useState(false);
  const [deletingCustomer, setDeletingCustomer] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  usePageTitle(customer ? customer.name : "Customer Details");

  useEffect(() => {
    if (id) {
      loadCustomer();
      loadStats();
    }
  }, [id]);

  const loadCustomer = async () => {
    try {
      const data = await api.customers.get(Number(id));
      setCustomer(data);
    } catch (error) {
      console.error("Failed to load customer:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await api.customers.getStats(Number(id));
      setStats(data);
    } catch (error) {
      console.error("Failed to load stats:", error);
    }
  };

  const handleConfirmDeleteCustomer = async (adminPassword: string) => {
    if (!customer) return;
    setDeletingCustomer(true);
    try {
      await api.customers.delete(customer.id, adminPassword);
      toast.success("Customer deleted successfully.");
      navigate("/customers");
    } catch (error: any) {
      toast.error(
        "Failed to delete customer: " +
          (error?.message ||
            "Unknown error. Please check admin password and try again.")
      );
    } finally {
      setDeletingCustomer(false);
      setShowDeleteCustomerModal(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>Loading...</div>
    );
  }

  if (!customer) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        Customer not found
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem" }}>
      <div style={{ marginBottom: "2rem" }}>
        <button
          onClick={() => navigate("/customers")}
          style={{
            padding: "0.5rem 1rem",
            backgroundColor: "#6c757d",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            marginBottom: "1rem",
          }}
        >
          ← Back to Customers
        </button>
        <h1 style={{ marginTop: "1rem" }}>{customer.name}</h1>
        {APP_CONFIG.companyName && (
          <div
            style={{
              marginTop: "0.25rem",
              color: "#6c757d",
              fontSize: "0.9rem",
            }}
          >
            {APP_CONFIG.companyName}
          </div>
        )}
      </div>

      {/* Customer Info Card */}
      <div
        style={{
          backgroundColor: "white",
          padding: "1.5rem",
          borderRadius: "8px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          marginBottom: "2rem",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "1rem",
          }}
        >
          <div>
            <strong>Phone:</strong> {customer.phone}
          </div>
          <div>
            <strong>Address:</strong> {customer.address || "-"}
          </div>
          {customer.pan && (
            <div>
              <strong>PAN:</strong> {customer.pan}
            </div>
          )}
          {customer.aadhaar && (
            <div>
              <strong>Aadhaar:</strong> {customer.aadhaar}
            </div>
          )}
        </div>
        {stats && (
          <div
            style={{
              marginTop: "1.5rem",
              paddingTop: "1.5rem",
              borderTop: "1px solid #dee2e6",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: "1rem",
              }}
            >
              <div>
                <div style={{ fontSize: "0.875rem", color: "#666" }}>
                  Total Loans
                </div>
                <div style={{ fontSize: "1.5rem", fontWeight: "bold" }}>
                  {stats.total_loans}
                </div>
              </div>
              <div>
                <div style={{ fontSize: "0.875rem", color: "#666" }}>
                  Active Loans
                </div>
                <div style={{ fontSize: "1.5rem", fontWeight: "bold" }}>
                  {stats.active_loans}
                </div>
              </div>
              <div>
                <div style={{ fontSize: "0.875rem", color: "#666" }}>
                  Outstanding
                </div>
                <div style={{ fontSize: "1.5rem", fontWeight: "bold" }}>
                  ${stats.outstanding_amount.toLocaleString("en-IN")}
                </div>
              </div>
              <div>
                <div style={{ fontSize: "0.875rem", color: "#666" }}>
                  Last Payment
                </div>
                <div style={{ fontSize: "1rem" }}>
                  {stats.last_payment_date
                    ? new Date(stats.last_payment_date).toLocaleDateString()
                    : "Never"}
                </div>
              </div>
            </div>
          </div>
        )}
        <div style={{ marginTop: "1rem", display: "flex", gap: "1rem" }}>
          <button
            onClick={() => navigate(`/loans/new?customerId=${customer.id}`)}
            style={{
              padding: "0.75rem 1.5rem",
              backgroundColor: "#28a745",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            + New Loan
          </button>
          <button
            onClick={() => setShowEditModal(true)}
            style={{
              padding: "0.75rem 1.5rem",
              backgroundColor: "#007bff",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Edit Customer
          </button>
          <button
            onClick={() => setShowDeleteCustomerModal(true)}
            style={{
              padding: "0.75rem 1.5rem",
              backgroundColor: "#dc3545",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Delete Customer
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ marginBottom: "1rem", borderBottom: "2px solid #dee2e6" }}>
        <div style={{ display: "flex", gap: "1rem" }}>
          {(["loans", "payments", "documents", "notes"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: "0.75rem 1.5rem",
                backgroundColor: "transparent",
                border: "none",
                borderBottom:
                  activeTab === tab
                    ? "2px solid #007bff"
                    : "2px solid transparent",
                color: activeTab === tab ? "#007bff" : "#666",
                cursor: "pointer",
                fontWeight: activeTab === tab ? "600" : "400",
                textTransform: "capitalize",
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div
        style={{
          backgroundColor: "white",
          padding: "1.5rem",
          borderRadius: "8px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        }}
      >
        {activeTab === "loans" && <CustomerLoansTab customerId={customer.id} />}
        {activeTab === "payments" && (
          <CustomerPaymentsTab customerId={customer.id} />
        )}
        {activeTab === "documents" && (
          <CustomerDocumentsTab customerId={customer.id} />
        )}
        {activeTab === "notes" && (
          <CustomerNotesTab customer={customer} onUpdate={loadCustomer} />
        )}
      </div>

      {showEditModal && (
        <EditCustomerModal
          customer={customer}
          onClose={() => setShowEditModal(false)}
          onUpdated={() => {
            setShowEditModal(false);
            loadCustomer();
            loadStats();
          }}
        />
      )}

      {showDeleteCustomerModal && (
        <ConfirmWithPasswordModal
          title="Delete Customer"
          message={
            "Are you sure you want to delete this customer?\nThis action is permanent and will remove all associated data.\n\nTo proceed, please enter the admin password."
          }
          confirmLabel="Delete Customer"
          isProcessing={deletingCustomer}
          onConfirm={handleConfirmDeleteCustomer}
          onCancel={() => {
            if (!deletingCustomer) {
              setShowDeleteCustomerModal(false);
            }
          }}
        />
      )}
    </div>
  );
}

type CustomerFormData = {
  name: string;
  phone: string;
  address: string;
  pan: string;
  aadhaar: string;
  notes: string;
};

function EditCustomerModal({
  customer,
  onClose,
  onUpdated,
}: {
  customer: Customer;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const [formData, setFormData] = useState<CustomerFormData>({
    name: customer.name || "",
    phone: customer.phone || "",
    address: customer.address || "",
    pan: customer.pan || "",
    aadhaar: customer.aadhaar || "",
    notes: customer.notes || "",
  });
  const [errors, setErrors] = useState<{
    phone?: string;
    pan?: string;
    aadhaar?: string;
  }>({});
  const [submitting, setSubmitting] = useState(false);

  const validate = (data: CustomerFormData) => {
    const newErrors: { phone?: string; pan?: string; aadhaar?: string } = {};

    if (!/^[0-9]{10}$/.test(data.phone)) {
      newErrors.phone = "Phone number must be exactly 10 digits.";
    }

    if (data.pan) {
      const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
      if (!panRegex.test(data.pan.toUpperCase())) {
        newErrors.pan = "PAN must be 10 characters (e.g. ABCDE1234F).";
      }
    }

    if (data.aadhaar) {
      if (!/^[0-9]{12}$/.test(data.aadhaar)) {
        newErrors.aadhaar = "Aadhaar must be exactly 12 digits.";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate(formData)) {
      return;
    }
    setSubmitting(true);
    try {
      await api.customers.update(customer.id, {
        ...formData,
        pan: formData.pan ? formData.pan.toUpperCase() : "",
        aadhaar: formData.aadhaar,
      });
      onUpdated();
    } catch (error: any) {
      toast.error(
        "Failed to update customer: " + (error?.message || "Unknown error")
      );
    } finally {
      setSubmitting(false);
    }
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
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          backgroundColor: "white",
          padding: "2rem",
          borderRadius: "8px",
          width: "90%",
          maxWidth: "600px",
          maxHeight: "90vh",
          overflow: "auto",
        }}
      >
        <h2 style={{ marginBottom: "1.5rem" }}>Edit Customer</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "1rem" }}>
            <label
              style={{
                display: "block",
                marginBottom: "0.5rem",
                fontWeight: "500",
              }}
            >
              Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
              style={{
                width: "100%",
                padding: "0.75rem",
                border: "1px solid #ddd",
                borderRadius: "4px",
                fontSize: "1rem",
              }}
            />
          </div>
          <div style={{ marginBottom: "1rem" }}>
            <label
              style={{
                display: "block",
                marginBottom: "0.5rem",
                fontWeight: "500",
              }}
            >
              Phone *
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => {
                const digitsOnly = e.target.value
                  .replace(/[^0-9]/g, "")
                  .slice(0, 10);
                setFormData({ ...formData, phone: digitsOnly });
              }}
              required
              maxLength={10}
              style={{
                width: "100%",
                padding: "0.75rem",
                border: "1px solid #ddd",
                borderRadius: "4px",
                fontSize: "1rem",
              }}
            />
            {errors.phone && (
              <div
                style={{
                  marginTop: "0.25rem",
                  color: "#dc3545",
                  fontSize: "0.85rem",
                }}
              >
                {errors.phone}
              </div>
            )}
          </div>
          <div style={{ marginBottom: "1rem" }}>
            <label
              style={{
                display: "block",
                marginBottom: "0.5rem",
                fontWeight: "500",
              }}
            >
              Address
            </label>
            <textarea
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
              style={{
                width: "100%",
                padding: "0.75rem",
                border: "1px solid #ddd",
                borderRadius: "4px",
                fontSize: "1rem",
                minHeight: "80px",
              }}
            />
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "1rem",
              marginBottom: "1rem",
            }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "0.5rem",
                  fontWeight: "500",
                }}
              >
                PAN
              </label>
              <input
                type="text"
                value={formData.pan}
                onChange={(e) => {
                  const value = e.target.value.toUpperCase().slice(0, 10);
                  setFormData({ ...formData, pan: value });
                }}
                maxLength={10}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  fontSize: "1rem",
                }}
              />
              {errors.pan && (
                <div
                  style={{
                    marginTop: "0.25rem",
                    color: "#dc3545",
                    fontSize: "0.85rem",
                  }}
                >
                  {errors.pan}
                </div>
              )}
            </div>
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "0.5rem",
                  fontWeight: "500",
                }}
              >
                Aadhaar
              </label>
              <input
                type="text"
                value={formData.aadhaar}
                onChange={(e) => {
                  const digitsOnly = e.target.value
                    .replace(/[^0-9]/g, "")
                    .slice(0, 12);
                  setFormData({ ...formData, aadhaar: digitsOnly });
                }}
                maxLength={12}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  fontSize: "1rem",
                }}
              />
              {errors.aadhaar && (
                <div
                  style={{
                    marginTop: "0.25rem",
                    color: "#dc3545",
                    fontSize: "0.85rem",
                  }}
                >
                  {errors.aadhaar}
                </div>
              )}
            </div>
          </div>
          <div style={{ marginBottom: "1.5rem" }}>
            <label
              style={{
                display: "block",
                marginBottom: "0.5rem",
                fontWeight: "500",
              }}
            >
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              style={{
                width: "100%",
                padding: "0.75rem",
                border: "1px solid #ddd",
                borderRadius: "4px",
                fontSize: "1rem",
                minHeight: "80px",
              }}
            />
          </div>
          <div
            style={{ display: "flex", gap: "1rem", justifyContent: "flex-end" }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "0.75rem 1.5rem",
                backgroundColor: "#6c757d",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !formData.name || !formData.phone}
              style={{
                padding: "0.75rem 1.5rem",
                backgroundColor:
                  submitting || !formData.name || !formData.phone
                    ? "#ccc"
                    : "#007bff",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor:
                  submitting || !formData.name || !formData.phone
                    ? "not-allowed"
                    : "pointer",
              }}
            >
              {submitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
