import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { api } from "../lib/api";
import { formatErrorMessage } from "../lib/errorUtils";
import { Loan, LoanSchedule } from "../types";
import { ConfirmWithPasswordModal } from "../components/ConfirmWithPasswordModal";
import { usePageTitle } from "../hooks/usePageTitle";

function PaymentForm({
  loanId,
  onSuccess,
}: {
  loanId: number;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    amount: "",
    date: new Date().toISOString().split("T")[0],
    mode: "cash" as "cash" | "upi" | "bank" | "cheque",
    reference: "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [schedule, setSchedule] = useState<LoanSchedule[]>([]);
  const [nextDue, setNextDue] = useState<{
    amount: number;
    dueDate: string;
    installment: number;
  } | null>(null);

  useEffect(() => {
    loadSchedule();
  }, [loanId]);

  const loadSchedule = async () => {
    try {
      const data = await api.loans.getSchedule(loanId);
      setSchedule(data);

      // Find next pending installment
      const pending = data.find((s: LoanSchedule) => s.status === "pending");
      if (pending) {
        const pendingAmount = pending.total_amount - pending.paid_amount;
        setNextDue({
          amount: pendingAmount,
          dueDate: pending.due_date,
          installment: pending.installment_number,
        });
      }
    } catch (error) {
      console.error("Failed to load schedule:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const result = await api.loans.recordPayment(loanId, {
        amount: Number(formData.amount),
        date: formData.date,
        mode: formData.mode,
        reference: formData.reference || undefined,
        notes: formData.notes || undefined,
      });

      // Generate receipt PDF automatically after payment
      if (result.paymentId) {
        try {
          const pdfResult = await api.reports.generatePaymentReceipt(
            result.paymentId
          );
          if (pdfResult.success) {
            toast.success(
              `Payment recorded successfully! Receipt saved to: ${pdfResult.path}`
            );
          } else {
            toast.success("Payment recorded successfully!");
          }
        } catch (pdfError: any) {
          // Payment was recorded, PDF generation failed
          if (!pdfError.message || !pdfError.message.includes("canceled")) {
            toast.warn(
              "Payment recorded successfully! (Receipt generation skipped)"
            );
          } else {
            toast.success("Payment recorded successfully!");
          }
        }
      } else {
        toast.success("Payment recorded successfully!");
      }

      onSuccess();
    } catch (error: any) {
      toast.error(
        "Failed to record payment: " +
          formatErrorMessage(error, "Please try again.")
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleAmountChange = (value: string) => {
    setFormData({ ...formData, amount: value });
  };

  const fillFullAmount = () => {
    if (nextDue) {
      setFormData({ ...formData, amount: nextDue.amount.toFixed(2) });
    }
  };

  const calculateAllocation = () => {
    if (!formData.amount || !nextDue) return null;
    const amount = Number(formData.amount);
    if (amount <= 0) return null;

    const allocations: Array<{
      installment: number;
      amount: number;
      status: string;
    }> = [];
    let remaining = amount;

    for (const sched of schedule
      .filter((s) => s.status === "pending")
      .sort((a, b) => a.installment_number - b.installment_number)) {
      if (remaining <= 0) break;
      const pending = sched.total_amount - sched.paid_amount;
      const allocate = Math.min(remaining, pending);
      const isFull = allocate >= pending;
      allocations.push({
        installment: sched.installment_number,
        amount: allocate,
        status: isFull ? "Full Payment" : "Partial Payment",
      });
      remaining -= allocate;
    }

    return { allocations, remaining };
  };

  const allocation = calculateAllocation();

  return (
    <form onSubmit={handleSubmit}>
      {/* Next Due Info */}
      {nextDue && (
        <div
          style={{
            backgroundColor: "#e7f3ff",
            border: "1px solid #b3d9ff",
            borderRadius: "8px",
            padding: "1rem",
            marginBottom: "1.5rem",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "0.5rem",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "0.875rem",
                  color: "#666",
                  marginBottom: "0.25rem",
                }}
              >
                Next Due: Installment #{nextDue.installment}
              </div>
              <div
                style={{
                  fontSize: "1.25rem",
                  fontWeight: "bold",
                  color: "#007bff",
                }}
              >
                $
                {nextDue.amount.toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
              <div
                style={{
                  fontSize: "0.875rem",
                  color: "#666",
                  marginTop: "0.25rem",
                }}
              >
                Due Date:{" "}
                {new Date(nextDue.dueDate).toLocaleDateString("en-IN")}
              </div>
            </div>
            <button
              type="button"
              onClick={fillFullAmount}
              style={{
                padding: "0.5rem 1rem",
                backgroundColor: "#007bff",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "0.875rem",
                whiteSpace: "nowrap",
              }}
            >
              Pay Full Amount
            </button>
          </div>
          <div
            style={{
              fontSize: "0.75rem",
              color: "#666",
              marginTop: "0.5rem",
              fontStyle: "italic",
            }}
          >
            💡 You can pay any amount - partial payments are automatically
            allocated across installments
          </div>
        </div>
      )}

      <div style={{ marginBottom: "1rem" }}>
        <label
          style={{
            display: "block",
            marginBottom: "0.5rem",
            fontWeight: "500",
            fontSize: "0.95rem",
          }}
        >
          Payment Amount ($) *
        </label>
        <input
          type="number"
          value={formData.amount}
          onChange={(e) => handleAmountChange(e.target.value)}
          required
          min="0.01"
          step="0.01"
          placeholder={
            nextDue
              ? `Enter amount (Next due: $${nextDue.amount.toFixed(2)})`
              : "Enter payment amount"
          }
          style={{
            width: "100%",
            padding: "0.875rem",
            border: "2px solid #ddd",
            borderRadius: "6px",
            fontSize: "1.1rem",
            fontWeight: "500",
            transition: "border-color 0.2s",
            boxSizing: "border-box",
          }}
          onFocus={(e) => (e.target.style.borderColor = "#007bff")}
          onBlur={(e) => (e.target.style.borderColor = "#ddd")}
        />
        {formData.amount && nextDue && Number(formData.amount) > 0 && (
          <div
            style={{ marginTop: "0.5rem", fontSize: "0.875rem", color: "#666" }}
          >
            {(() => {
              const amount = Number(formData.amount);
              const due = nextDue.amount;
              const diff = Math.abs(amount - due);
              // Within ±1 rupee tolerance
              if (diff <= 1.0) {
                return (
                  <span style={{ color: "#28a745" }}>
                    ✓ This will fully pay installment #{nextDue.installment}{" "}
                    (rounding adjustment: ${diff.toFixed(2)})
                  </span>
                );
              } else if (amount >= due) {
                return (
                  <span style={{ color: "#28a745" }}>
                    ✓ This will fully pay installment #{nextDue.installment}
                  </span>
                );
              } else {
                return (
                  <span style={{ color: "#ffc107" }}>
                    ⚠ This is a partial payment for installment #
                    {nextDue.installment} (short by ${(due - amount).toFixed(2)}
                    )
                  </span>
                );
              }
            })()}
          </div>
        )}
      </div>

      {/* Payment Allocation Preview */}
      {allocation && allocation.allocations.length > 0 && (
        <div
          style={{
            backgroundColor: "#f8f9fa",
            border: "1px solid #dee2e6",
            borderRadius: "6px",
            padding: "1rem",
            marginBottom: "1rem",
          }}
        >
          <div
            style={{
              fontSize: "0.875rem",
              fontWeight: "600",
              marginBottom: "0.75rem",
              color: "#495057",
            }}
          >
            Payment Allocation Preview:
          </div>
          {allocation.allocations.map((alloc, idx) => (
            <div
              key={idx}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "0.5rem",
                backgroundColor: "white",
                borderRadius: "4px",
                marginBottom: "0.5rem",
                border: "1px solid #e9ecef",
              }}
            >
              <div>
                <span style={{ fontWeight: "500" }}>
                  Installment #{alloc.installment}
                </span>
                <span
                  style={{
                    fontSize: "0.75rem",
                    color: "#6c757d",
                    marginLeft: "0.5rem",
                  }}
                >
                  ({alloc.status})
                </span>
              </div>
              <span style={{ fontWeight: "600", color: "#007bff" }}>
                $
                {alloc.amount.toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          ))}
          {allocation.remaining > 0 && (
            <div
              style={{
                padding: "0.5rem",
                backgroundColor: "#fff3cd",
                borderRadius: "4px",
                fontSize: "0.875rem",
                color: "#856404",
                marginTop: "0.5rem",
              }}
            >
              ⚠ Remaining ${allocation.remaining.toFixed(2)} will be allocated
              to future installments
            </div>
          )}
        </div>
      )}
      <div style={{ marginBottom: "1rem" }}>
        <label
          style={{
            display: "block",
            marginBottom: "0.5rem",
            fontWeight: "500",
            fontSize: "0.95rem",
          }}
        >
          Payment Date *
        </label>
        <input
          type="date"
          value={formData.date}
          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          required
          max={new Date().toISOString().split("T")[0]}
          style={{
            width: "100%",
            padding: "0.875rem",
            border: "2px solid #ddd",
            borderRadius: "6px",
            fontSize: "1rem",
            transition: "border-color 0.2s",
            boxSizing: "border-box",
          }}
          onFocus={(e) => (e.target.style.borderColor = "#007bff")}
          onBlur={(e) => (e.target.style.borderColor = "#ddd")}
        />
        {formData.date &&
          nextDue &&
          new Date(formData.date) < new Date(nextDue.dueDate) && (
            <div
              style={{
                marginTop: "0.5rem",
                fontSize: "0.875rem",
                color: "#28a745",
              }}
            >
              ✓ Payment made before due date - installment will be marked as
              paid
            </div>
          )}
      </div>
      <div style={{ marginBottom: "1rem" }}>
        <label
          style={{
            display: "block",
            marginBottom: "0.5rem",
            fontWeight: "500",
            fontSize: "0.95rem",
          }}
        >
          Payment Mode *
        </label>
        <select
          value={formData.mode}
          onChange={(e) =>
            setFormData({ ...formData, mode: e.target.value as any })
          }
          required
          style={{
            width: "100%",
            padding: "0.875rem",
            border: "2px solid #ddd",
            borderRadius: "6px",
            fontSize: "1rem",
            backgroundColor: "white",
            cursor: "pointer",
            transition: "border-color 0.2s",
            boxSizing: "border-box",
          }}
          onFocus={(e) => (e.target.style.borderColor = "#007bff")}
          onBlur={(e) => (e.target.style.borderColor = "#ddd")}
        >
          <option value="cash">💵 Cash</option>
          <option value="upi">📱 UPI</option>
          <option value="bank">🏦 Bank Transfer</option>
          <option value="cheque">📝 Cheque</option>
        </select>
      </div>
      <div style={{ marginBottom: "1rem" }}>
        <label
          style={{
            display: "block",
            marginBottom: "0.5rem",
            fontWeight: "500",
            fontSize: "0.95rem",
          }}
        >
          Reference Number{" "}
          <span style={{ color: "#6c757d", fontWeight: "normal" }}>
            (Optional)
          </span>
        </label>
        <input
          type="text"
          value={formData.reference}
          onChange={(e) =>
            setFormData({ ...formData, reference: e.target.value })
          }
          placeholder={
            formData.mode === "upi"
              ? "UPI Transaction ID"
              : formData.mode === "bank"
              ? "Bank Transaction ID"
              : formData.mode === "cheque"
              ? "Cheque Number"
              : "Reference number"
          }
          style={{
            width: "100%",
            padding: "0.875rem",
            border: "2px solid #ddd",
            borderRadius: "6px",
            fontSize: "1rem",
            transition: "border-color 0.2s",
            boxSizing: "border-box",
          }}
          onFocus={(e) => (e.target.style.borderColor = "#007bff")}
          onBlur={(e) => (e.target.style.borderColor = "#ddd")}
        />
      </div>
      <div style={{ marginBottom: "1.5rem" }}>
        <label
          style={{
            display: "block",
            marginBottom: "0.5rem",
            fontWeight: "500",
            fontSize: "0.95rem",
          }}
        >
          Notes{" "}
          <span style={{ color: "#6c757d", fontWeight: "normal" }}>
            (Optional)
          </span>
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Additional notes about this payment..."
          rows={3}
          style={{
            width: "100%",
            padding: "0.875rem",
            border: "2px solid #ddd",
            borderRadius: "6px",
            fontSize: "1rem",
            fontFamily: "inherit",
            resize: "vertical",
            transition: "border-color 0.2s",
            boxSizing: "border-box",
          }}
          onFocus={(e) => (e.target.style.borderColor = "#007bff")}
          onBlur={(e) => (e.target.style.borderColor = "#ddd")}
        />
      </div>
      <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end" }}>
        <button
          type="button"
          onClick={onSuccess}
          style={{
            padding: "0.875rem 2rem",
            backgroundColor: "#6c757d",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "1rem",
            fontWeight: "500",
            transition: "background-color 0.2s",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor = "#5a6268")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor = "#6c757d")
          }
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting || !formData.amount}
          style={{
            padding: "0.875rem 2rem",
            backgroundColor:
              submitting || !formData.amount ? "#ccc" : "#28a745",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: submitting || !formData.amount ? "not-allowed" : "pointer",
            fontSize: "1rem",
            fontWeight: "600",
            transition: "background-color 0.2s, transform 0.1s",
            boxShadow:
              submitting || !formData.amount
                ? "none"
                : "0 2px 4px rgba(40, 167, 69, 0.3)",
          }}
          onMouseEnter={(e) => {
            if (!submitting && formData.amount) {
              e.currentTarget.style.backgroundColor = "#218838";
              e.currentTarget.style.transform = "translateY(-1px)";
            }
          }}
          onMouseLeave={(e) => {
            if (!submitting && formData.amount) {
              e.currentTarget.style.backgroundColor = "#28a745";
              e.currentTarget.style.transform = "translateY(0)";
            }
          }}
        >
          {submitting ? "⏳ Processing..." : "✅ Record Payment"}
        </button>
      </div>
    </form>
  );
}

function LoanDocumentsTab({ loanId }: { loanId: number }) {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadDocuments();
  }, [loanId]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const data = await api.documents.list("loan", loanId);
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
      await api.documents.upload("loan", loanId, documentType);
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

  const handleDownload = async (documentId: number) => {
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
            onClick={() => handleUpload("agreement")}
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
            {uploading ? "Uploading..." : "+ Upload Agreement"}
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
            Upload loan agreements, receipts, or other documents
          </p>
        </div>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: "#f8f9fa" }}>
              <th style={{ padding: "0.75rem", textAlign: "left" }}>
                File Name
              </th>
              <th style={{ padding: "0.75rem", textAlign: "left" }}>Type</th>
              <th style={{ padding: "0.75rem", textAlign: "right" }}>Size</th>
              <th style={{ padding: "0.75rem", textAlign: "left" }}>
                Uploaded
              </th>
              <th style={{ padding: "0.75rem", textAlign: "left" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {documents.map((doc) => (
              <tr key={doc.id} style={{ borderBottom: "1px solid #dee2e6" }}>
                <td style={{ padding: "0.75rem" }}>
                  <span style={{ marginRight: "0.5rem" }}>
                    {doc.mime_type?.startsWith("image/")
                      ? "🖼️"
                      : doc.mime_type === "application/pdf"
                      ? "📄"
                      : "📎"}
                  </span>
                  {doc.file_name}
                </td>
                <td style={{ padding: "0.75rem", color: "#666" }}>
                  {doc.document_type || "Other"}
                </td>
                <td
                  style={{
                    padding: "0.75rem",
                    textAlign: "right",
                    color: "#666",
                  }}
                >
                  {formatFileSize(doc.file_size)}
                </td>
                <td style={{ padding: "0.75rem", color: "#666" }}>
                  {new Date(doc.uploaded_at).toLocaleDateString()}
                </td>
                <td style={{ padding: "0.75rem" }}>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button
                      onClick={() => handleDownload(doc.id)}
                      style={{
                        padding: "0.25rem 0.75rem",
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
                        padding: "0.25rem 0.75rem",
                        backgroundColor: "#dc3545",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "0.875rem",
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function LoanPaymentsTab({ loanId }: { loanId: number }) {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPayments();
  }, [loanId]);

  const loadPayments = async () => {
    try {
      const data = await api.payments.list({ loan_id: loanId });
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
      </div>
      {payments.length === 0 ? (
        <p style={{ color: "#666" }}>No payments recorded yet</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: "#f8f9fa" }}>
              <th style={{ padding: "0.75rem", textAlign: "left" }}>Date</th>
              <th style={{ padding: "0.75rem", textAlign: "right" }}>Amount</th>
              <th style={{ padding: "0.75rem", textAlign: "left" }}>Mode</th>
              <th style={{ padding: "0.75rem", textAlign: "left" }}>
                Reference
              </th>
              <th style={{ padding: "0.75rem", textAlign: "left" }}>Notes</th>
              <th style={{ padding: "0.75rem", textAlign: "left" }}>Actions</th>
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
                <td style={{ padding: "0.75rem", color: "#666" }}>
                  {payment.notes || "-"}
                </td>
                <td style={{ padding: "0.75rem" }}>
                  <button
                    onClick={async () => {
                      try {
                        const result = await api.reports.generatePaymentReceipt(
                          payment.id
                        );
                        if (result.success) {
                          alert(`Receipt saved to: ${result.path}`);
                        }
                      } catch (error: any) {
                        if (!error?.message?.includes("canceled")) {
                          alert(
                            "Failed to generate receipt: " +
                              formatErrorMessage(error, "Please try again.")
                          );
                        }
                      }
                    }}
                    style={{
                      padding: "0.25rem 0.75rem",
                      backgroundColor: "#28a745",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "0.875rem",
                    }}
                  >
                    📄 Receipt
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

function LoanCollateralTab({ loanId }: { loanId: number }) {
  const [collaterals, setCollaterals] = useState<any[]>([]);
  const [allCollaterals, setAllCollaterals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    loadCollaterals();
    loadAllCollaterals();
  }, [loanId]);

  const loadCollaterals = async () => {
    try {
      setLoading(true);
      const data = await api.collaterals.list({ loan_id: loanId });
      setCollaterals(data);
    } catch (error) {
      console.error("Failed to load collaterals:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadAllCollaterals = async () => {
    try {
      const data = await api.collaterals.list({});
      setAllCollaterals(
        data.filter((c: any) => !c.loan_id || c.loan_id === loanId)
      );
    } catch (error) {
      console.error("Failed to load all collaterals:", error);
    }
  };

  const handleLink = async (collateralId: number) => {
    try {
      await api.collaterals.linkToLoan(collateralId, loanId);
      await loadCollaterals();
      await loadAllCollaterals();
      setShowLinkModal(false);
      toast.success("Collateral linked successfully!");
    } catch (error: any) {
      toast.error(
        "Failed to link collateral: " +
          formatErrorMessage(error, "Please try again.")
      );
    }
  };

  const handleUnlink = async (collateralId: number) => {
    if (
      !confirm("Are you sure you want to unlink this collateral from the loan?")
    ) {
      return;
    }
    try {
      await api.collaterals.unlinkFromLoan(collateralId);
      await loadCollaterals();
      await loadAllCollaterals();
      toast.success("Collateral unlinked successfully!");
    } catch (error: any) {
      toast.error(
        "Failed to unlink collateral: " +
          formatErrorMessage(error, "Please try again.")
      );
    }
  };

  const handleDelete = async (collateralId: number) => {
    if (
      !confirm(
        "Are you sure you want to delete this collateral? This action cannot be undone."
      )
    ) {
      return;
    }
    try {
      await api.collaterals.delete(collateralId);
      await loadCollaterals();
      await loadAllCollaterals();
      toast.success("Collateral deleted successfully!");
    } catch (error: any) {
      toast.error(
        "Failed to delete collateral: " +
          formatErrorMessage(error, "Please try again.")
      );
    }
  };

  if (loading) return <div>Loading collaterals...</div>;

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1.5rem",
        }}
      >
        <h3>Linked Collaterals</h3>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            onClick={() => setShowAddModal(true)}
            style={{
              padding: "0.75rem 1.5rem",
              backgroundColor: "#007bff",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "0.875rem",
              fontWeight: "500",
            }}
          >
            + Add New
          </button>
          <button
            onClick={() => setShowLinkModal(true)}
            style={{
              padding: "0.75rem 1.5rem",
              backgroundColor: "#28a745",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "0.875rem",
              fontWeight: "500",
            }}
          >
            🔗 Link Existing
          </button>
        </div>
      </div>

      {collaterals.length === 0 ? (
        <div
          style={{
            padding: "3rem",
            textAlign: "center",
            backgroundColor: "#f8f9fa",
            borderRadius: "8px",
            border: "2px dashed #dee2e6",
          }}
        >
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🏠</div>
          <p
            style={{
              color: "#666",
              fontSize: "1.1rem",
              marginBottom: "0.5rem",
            }}
          >
            No collaterals linked to this loan
          </p>
          <p style={{ color: "#999", fontSize: "0.875rem" }}>
            Add a new collateral or link an existing one to secure this loan
          </p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
            gap: "1.5rem",
          }}
        >
          {collaterals.map((collateral) => (
            <div
              key={collateral.id}
              style={{
                backgroundColor: "white",
                border: "1px solid #dee2e6",
                borderRadius: "8px",
                padding: "1.5rem",
                boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: "1rem",
                }}
              >
                <div>
                  <div
                    style={{
                      display: "inline-block",
                      padding: "0.25rem 0.75rem",
                      borderRadius: "12px",
                      backgroundColor: "#e7f3ff",
                      color: "#007bff",
                      fontSize: "0.75rem",
                      fontWeight: "600",
                      textTransform: "uppercase",
                      marginBottom: "0.5rem",
                    }}
                  >
                    {collateral.asset_type}
                  </div>
                  {collateral.at_risk && (
                    <div
                      style={{
                        display: "inline-block",
                        marginLeft: "0.5rem",
                        padding: "0.25rem 0.75rem",
                        borderRadius: "12px",
                        backgroundColor: "#dc354520",
                        color: "#dc3545",
                        fontSize: "0.75rem",
                        fontWeight: "600",
                      }}
                    >
                      ⚠ At Risk
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", gap: "0.25rem" }}>
                  <button
                    onClick={() =>
                      (window.location.href = `/assets/${collateral.id}/valuation`)
                    }
                    style={{
                      padding: "0.25rem 0.5rem",
                      backgroundColor: "#007bff",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "0.75rem",
                    }}
                    title="View Valuation"
                  >
                    📊
                  </button>
                  <button
                    onClick={() => handleUnlink(collateral.id)}
                    style={{
                      padding: "0.25rem 0.5rem",
                      backgroundColor: "#ffc107",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "0.75rem",
                    }}
                    title="Unlink"
                  >
                    🔗
                  </button>
                  <button
                    onClick={() => handleDelete(collateral.id)}
                    style={{
                      padding: "0.25rem 0.5rem",
                      backgroundColor: "#dc3545",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "0.75rem",
                    }}
                    title="Delete"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              {collateral.description && (
                <p
                  style={{
                    marginBottom: "1rem",
                    color: "#333",
                    fontWeight: "500",
                  }}
                >
                  {collateral.description}
                </p>
              )}

              {collateral.registration_number && (
                <div
                  style={{
                    marginBottom: "0.5rem",
                    fontSize: "0.875rem",
                    color: "#666",
                  }}
                >
                  <strong>Registration:</strong>{" "}
                  {collateral.registration_number}
                </div>
              )}

              {collateral.serial_number && (
                <div
                  style={{
                    marginBottom: "0.5rem",
                    fontSize: "0.875rem",
                    color: "#666",
                  }}
                >
                  <strong>Serial:</strong> {collateral.serial_number}
                </div>
              )}

              {collateral.owner_name && (
                <div
                  style={{
                    marginBottom: "1rem",
                    fontSize: "0.875rem",
                    color: "#666",
                  }}
                >
                  <strong>Owner:</strong> {collateral.owner_name}
                </div>
              )}

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "1rem",
                  padding: "1rem",
                  backgroundColor: "#f8f9fa",
                  borderRadius: "6px",
                  marginBottom: "1rem",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: "0.75rem",
                      color: "#666",
                      marginBottom: "0.25rem",
                    }}
                  >
                    Original Value
                  </div>
                  <div
                    style={{
                      fontSize: "1.1rem",
                      fontWeight: "bold",
                      color: "#333",
                    }}
                  >
                    ${collateral.original_value.toLocaleString("en-IN")}
                  </div>
                </div>
                <div>
                  <div
                    style={{
                      fontSize: "0.75rem",
                      color: "#666",
                      marginBottom: "0.25rem",
                    }}
                  >
                    Current Value
                  </div>
                  <div
                    style={{
                      fontSize: "1.1rem",
                      fontWeight: "bold",
                      color: "#28a745",
                    }}
                  >
                    ${collateral.current_value.toLocaleString("en-IN")}
                  </div>
                </div>
              </div>

              <div style={{ fontSize: "0.75rem", color: "#666" }}>
                Last valued:{" "}
                {new Date(collateral.valuation_date).toLocaleDateString(
                  "en-IN"
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showLinkModal && (
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
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "8px",
              padding: "2rem",
              width: "90%",
              maxWidth: "600px",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            <h2 style={{ marginBottom: "1.5rem" }}>Link Existing Collateral</h2>
            {allCollaterals.filter((c: any) => !c.loan_id).length === 0 ? (
              <p style={{ color: "#666", marginBottom: "1rem" }}>
                No unlinked collaterals available. Create a new collateral
                first.
              </p>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.75rem",
                }}
              >
                {allCollaterals
                  .filter((c) => !c.loan_id)
                  .map((collateral) => (
                    <div
                      key={collateral.id}
                      style={{
                        padding: "1rem",
                        border: "1px solid #dee2e6",
                        borderRadius: "6px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div>
                        <div
                          style={{ fontWeight: "500", marginBottom: "0.25rem" }}
                        >
                          {collateral.asset_type.charAt(0).toUpperCase() +
                            collateral.asset_type.slice(1)}
                          {collateral.description &&
                            ` - ${collateral.description}`}
                        </div>
                        <div style={{ fontSize: "0.875rem", color: "#666" }}>
                          Value: $
                          {collateral.current_value.toLocaleString("en-IN")}
                        </div>
                      </div>
                      <button
                        onClick={() => handleLink(collateral.id)}
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
                        Link
                      </button>
                    </div>
                  ))}
              </div>
            )}
            <div
              style={{
                marginTop: "1.5rem",
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              <button
                onClick={() => setShowLinkModal(false)}
                style={{
                  padding: "0.75rem 1.5rem",
                  backgroundColor: "#6c757d",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "1rem",
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <CollateralFormModal
          loanId={loanId}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            loadCollaterals();
            loadAllCollaterals();
          }}
        />
      )}
    </div>
  );
}

function CollateralFormModal({
  loanId,
  onClose,
  onSuccess,
}: {
  loanId: number;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    asset_type: "vehicle" as "vehicle" | "gold" | "property" | "other",
    description: "",
    serial_number: "",
    registration_number: "",
    original_value: "",
    current_value: "",
    owner_name: "",
    valuation_date: new Date().toISOString().split("T")[0],
    risk_threshold: 0.2,
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.collaterals.create({
        ...formData,
        loan_id: loanId,
        original_value: Number(formData.original_value),
        current_value: Number(formData.current_value),
        risk_threshold: Number(formData.risk_threshold),
      });
      alert("Collateral created and linked successfully!");
      onSuccess();
    } catch (error: any) {
      alert(
        "Failed to create collateral: " +
          formatErrorMessage(error, "Please try again.")
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
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "8px",
          padding: "2rem",
          width: "90%",
          maxWidth: "600px",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        <h2 style={{ marginBottom: "1.5rem" }}>Add New Collateral</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "1rem" }}>
            <label
              style={{
                display: "block",
                marginBottom: "0.5rem",
                fontWeight: "500",
              }}
            >
              Asset Type *
            </label>
            <select
              value={formData.asset_type}
              onChange={(e) =>
                setFormData({ ...formData, asset_type: e.target.value as any })
              }
              required
              style={{
                width: "100%",
                padding: "0.75rem",
                border: "1px solid #ddd",
                borderRadius: "4px",
                fontSize: "1rem",
              }}
            >
              <option value="vehicle">Vehicle</option>
              <option value="gold">Gold</option>
              <option value="property">Property</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label
              style={{
                display: "block",
                marginBottom: "0.5rem",
                fontWeight: "500",
              }}
            >
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={3}
              style={{
                width: "100%",
                padding: "0.75rem",
                border: "1px solid #ddd",
                borderRadius: "4px",
                fontSize: "1rem",
                fontFamily: "inherit",
              }}
            />
          </div>

          {formData.asset_type === "vehicle" && (
            <>
              <div style={{ marginBottom: "1rem" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    fontWeight: "500",
                  }}
                >
                  Registration Number
                </label>
                <input
                  type="text"
                  value={formData.registration_number}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      registration_number: e.target.value,
                    })
                  }
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
                  Serial/Chassis Number
                </label>
                <input
                  type="text"
                  value={formData.serial_number}
                  onChange={(e) =>
                    setFormData({ ...formData, serial_number: e.target.value })
                  }
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    fontSize: "1rem",
                  }}
                />
              </div>
            </>
          )}

          <div style={{ marginBottom: "1rem" }}>
            <label
              style={{
                display: "block",
                marginBottom: "0.5rem",
                fontWeight: "500",
              }}
            >
              Original Value ($) *
            </label>
            <input
              type="number"
              value={formData.original_value || ""}
              onChange={(e) => {
                const val = e.target.value;
                setFormData({ ...formData, original_value: val });
              }}
              required
              min="0"
              step="0.01"
              placeholder="Enter original value"
              style={{
                width: "100%",
                padding: "0.75rem",
                border: "1px solid #ddd",
                borderRadius: "4px",
                fontSize: "1rem",
                boxSizing: "border-box",
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
              Current Value ($) *
            </label>
            <input
              type="number"
              value={formData.current_value || ""}
              onChange={(e) => {
                const val = e.target.value;
                setFormData({ ...formData, current_value: val });
              }}
              required
              min="0"
              step="0.01"
              placeholder="Enter current value"
              style={{
                width: "100%",
                padding: "0.75rem",
                border: "1px solid #ddd",
                borderRadius: "4px",
                fontSize: "1rem",
                boxSizing: "border-box",
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
              Valuation Date *
            </label>
            <input
              type="date"
              value={formData.valuation_date}
              onChange={(e) =>
                setFormData({ ...formData, valuation_date: e.target.value })
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
              Owner Name
            </label>
            <input
              type="text"
              value={formData.owner_name}
              onChange={(e) =>
                setFormData({ ...formData, owner_name: e.target.value })
              }
              style={{
                width: "100%",
                padding: "0.75rem",
                border: "1px solid #ddd",
                borderRadius: "4px",
                fontSize: "1rem",
              }}
            />
          </div>

          <div
            style={{
              display: "flex",
              gap: "1rem",
              justifyContent: "flex-end",
              marginTop: "2rem",
            }}
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
                fontSize: "1rem",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: "0.75rem 1.5rem",
                backgroundColor: submitting ? "#ccc" : "#007bff",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: submitting ? "not-allowed" : "pointer",
                fontSize: "1rem",
              }}
            >
              {submitting ? "Creating..." : "Create & Link"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function LoanDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loan, setLoan] = useState<Loan | null>(null);
  const [schedule, setSchedule] = useState<LoanSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "schedule" | "payments" | "collateral" | "documents"
  >("schedule");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDeleteLoanModal, setShowDeleteLoanModal] = useState(false);
  const [deletingLoan, setDeletingLoan] = useState(false);
  const [showCloseLoanModal, setShowCloseLoanModal] = useState(false);
  const [showReopenLoanModal, setShowReopenLoanModal] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  usePageTitle(loan ? `Loan ${loan.loan_number}` : "Loan Details");

  useEffect(() => {
    if (id) {
      loadLoan();
      loadSchedule();
    }
  }, [id]);

  const loadLoan = async () => {
    try {
      const data = await api.loans.get(Number(id));
      setLoan(data);
    } catch (error) {
      console.error("Failed to load loan:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadSchedule = async () => {
    try {
      const data = await api.loans.getSchedule(Number(id));
      setSchedule(data);
    } catch (error) {
      console.error("Failed to load schedule:", error);
    }
  };

  const canCloseLoan = () => {
    if (!loan || schedule.length === 0) return false;
    const hasPending = schedule.some((s) => s.status === "pending");
    return (
      // Allow small rounding tolerance (≤ $1) for closing
      loan.outstanding_principal <= 1 && !hasPending && loan.status !== "closed"
    );
  };

  const handleConfirmCloseLoan = async (_adminPassword: string) => {
    if (!loan) return;
    setUpdatingStatus(true);
    try {
      // Optional: verify admin password by attempting a no-op protected action in future
      await api.loans.close(loan.id);
      toast.success("Loan closed successfully.");
      await loadLoan();
    } catch (error: any) {
      toast.error(
        "Failed to close loan: " +
          (error?.message || "Unknown error. Please try again.")
      );
    } finally {
      setUpdatingStatus(false);
      setShowCloseLoanModal(false);
    }
  };

  const handleConfirmReopenLoan = async (_adminPassword: string) => {
    if (!loan) return;
    setUpdatingStatus(true);
    try {
      await api.loans.reopen(loan.id);
      toast.success("Loan reopened successfully.");
      await loadLoan();
    } catch (error: any) {
      toast.error(
        "Failed to reopen loan: " +
          (error?.message || "Unknown error. Please try again.")
      );
    } finally {
      setUpdatingStatus(false);
      setShowReopenLoanModal(false);
    }
  };

  const handleConfirmDeleteLoan = async (adminPassword: string) => {
    if (!loan) return;
    setDeletingLoan(true);
    try {
      await api.loans.delete(loan.id, adminPassword);
      toast.success("Loan deleted successfully.");
      navigate("/loans");
    } catch (error: any) {
      toast.error(
        "Failed to delete loan: " +
          (error?.message ||
            "Unknown error. Please check admin password and try again.")
      );
    } finally {
      setDeletingLoan(false);
      setShowDeleteLoanModal(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>Loading...</div>
    );
  }

  if (!loan) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>Loan not found</div>
    );
  }

  return (
    <div style={{ padding: "2rem" }}>
      <div style={{ marginBottom: "2rem" }}>
        <button
          onClick={() => navigate("/loans")}
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
          ← Back to Loans
        </button>
        <h1 style={{ marginTop: "1rem" }}>Loan {loan.loan_number}</h1>
      </div>

      {/* Loan Summary Card */}
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
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "1rem",
            marginBottom: "1.5rem",
          }}
        >
          <div>
            <div style={{ fontSize: "0.875rem", color: "#666" }}>Principal</div>
            <div style={{ fontSize: "1.5rem", fontWeight: "bold" }}>
              ${loan.principal.toLocaleString("en-IN")}
            </div>
          </div>
          <div>
            <div style={{ fontSize: "0.875rem", color: "#666" }}>
              Outstanding
            </div>
            <div style={{ fontSize: "1.5rem", fontWeight: "bold" }}>
              ${loan.outstanding_principal.toLocaleString("en-IN")}
            </div>
          </div>
          <div>
            <div style={{ fontSize: "0.875rem", color: "#666" }}>
              EMI Amount
            </div>
            <div style={{ fontSize: "1.5rem", fontWeight: "bold" }}>
              ${loan.emi_amount.toLocaleString("en-IN")}
            </div>
          </div>
          <div>
            <div style={{ fontSize: "0.875rem", color: "#666" }}>
              Interest Rate
            </div>
            <div style={{ fontSize: "1.5rem", fontWeight: "bold" }}>
              {loan.interest_rate}% p.a.
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <button
            onClick={() => setShowPaymentModal(true)}
            style={{
              padding: "0.75rem 1.5rem",
              backgroundColor: "#28a745",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Record Payment
          </button>
          <button
            onClick={() => setShowDeleteLoanModal(true)}
            style={{
              padding: "0.75rem 1.5rem",
              backgroundColor: "#dc3545",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Delete Loan
          </button>
          {loan.status !== "closed" && (
            <button
              onClick={() => setShowCloseLoanModal(true)}
              disabled={!canCloseLoan()}
              style={{
                padding: "0.75rem 1.5rem",
                backgroundColor: canCloseLoan() ? "#007bff" : "#ccc",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: canCloseLoan() ? "pointer" : "not-allowed",
              }}
            >
              Close Loan
            </button>
          )}
          {loan.status === "closed" && (
            <button
              onClick={() => setShowReopenLoanModal(true)}
              style={{
                padding: "0.75rem 1.5rem",
                backgroundColor: "#ffc107",
                color: "#212529",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Reopen Loan
            </button>
          )}
          <div
            style={{ marginLeft: "auto", fontSize: "0.875rem", color: "#666" }}
          >
            Status:{" "}
            <span
              style={{
                textTransform: "capitalize",
                fontWeight: "600",
              }}
            >
              {loan.status}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ marginBottom: "1rem", borderBottom: "2px solid #dee2e6" }}>
        <div style={{ display: "flex", gap: "1rem" }}>
          {(["schedule", "payments", "collateral", "documents"] as const).map(
            (tab) => (
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
            )
          )}
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
        {activeTab === "schedule" && (
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1rem",
              }}
            >
              <h3>EMI Schedule</h3>
              <button
                onClick={async () => {
                  try {
                    const result = await api.reports.generateLoanSchedule(
                      loan.id
                    );
                    if (result.success) {
                      toast.success(`Schedule PDF saved to: ${result.path}`);
                    }
                  } catch (error: any) {
                    if (!error?.message?.includes("canceled")) {
                      toast.error(
                        "Failed to generate PDF: " +
                          formatErrorMessage(error, "Please try again.")
                      );
                    }
                  }
                }}
                style={{
                  padding: "0.5rem 1rem",
                  backgroundColor: "#dc3545",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "0.875rem",
                }}
              >
                📄 Export Schedule PDF
              </button>
            </div>
            {schedule.length === 0 ? (
              <p>No schedule found</p>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ backgroundColor: "#f8f9fa" }}>
                    <th style={{ padding: "0.75rem", textAlign: "left" }}>#</th>
                    <th style={{ padding: "0.75rem", textAlign: "left" }}>
                      Due Date
                    </th>
                    <th style={{ padding: "0.75rem", textAlign: "right" }}>
                      Principal
                    </th>
                    <th style={{ padding: "0.75rem", textAlign: "right" }}>
                      Interest
                    </th>
                    <th style={{ padding: "0.75rem", textAlign: "right" }}>
                      Total
                    </th>
                    <th style={{ padding: "0.75rem", textAlign: "center" }}>
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {schedule.map((item) => (
                    <tr
                      key={item.id}
                      style={{ borderBottom: "1px solid #dee2e6" }}
                    >
                      <td style={{ padding: "0.75rem" }}>
                        {item.installment_number}
                      </td>
                      <td style={{ padding: "0.75rem" }}>
                        {new Date(item.due_date).toLocaleDateString()}
                      </td>
                      <td style={{ padding: "0.75rem", textAlign: "right" }}>
                        ${item.principal_component.toFixed(2)}
                      </td>
                      <td style={{ padding: "0.75rem", textAlign: "right" }}>
                        ${item.interest_component.toFixed(2)}
                      </td>
                      <td style={{ padding: "0.75rem", textAlign: "right" }}>
                        ${item.total_amount.toFixed(2)}
                      </td>
                      <td style={{ padding: "0.75rem", textAlign: "center" }}>
                        <span
                          style={{
                            padding: "0.25rem 0.5rem",
                            borderRadius: "4px",
                            backgroundColor:
                              item.status === "paid"
                                ? "#28a74520"
                                : "#ffc10720",
                            color:
                              item.status === "paid" ? "#28a745" : "#ffc107",
                            fontSize: "0.875rem",
                            textTransform: "capitalize",
                          }}
                        >
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
        {activeTab === "payments" && <LoanPaymentsTab loanId={loan.id} />}
        {activeTab === "collateral" && <LoanCollateralTab loanId={loan.id} />}
        {activeTab === "documents" && <LoanDocumentsTab loanId={loan.id} />}
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
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
            padding: "1rem",
            overflowY: "auto",
          }}
          onClick={(e) => {
            // Close modal when clicking on backdrop
            if (e.target === e.currentTarget) {
              setShowPaymentModal(false);
            }
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              padding: "2rem",
              borderRadius: "8px",
              width: "100%",
              maxWidth: "600px",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
              margin: "auto",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1.5rem",
              }}
            >
              <h2 style={{ margin: 0 }}>Record Payment</h2>
              <button
                onClick={() => setShowPaymentModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "1.5rem",
                  cursor: "pointer",
                  color: "#666",
                  padding: "0",
                  width: "30px",
                  height: "30px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "4px",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#f0f0f0";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                ×
              </button>
            </div>
            <PaymentForm
              loanId={loan.id}
              onSuccess={async () => {
                setShowPaymentModal(false);
                // Reload both loan and schedule to reflect payment changes
                await loadLoan();
                await loadSchedule();
              }}
            />
          </div>
        </div>
      )}

      {/* Delete Loan Confirmation Modal */}
      {showDeleteLoanModal && (
        <ConfirmWithPasswordModal
          title="Delete Loan"
          message={
            "Are you sure you want to delete this loan?\nThis action is permanent and will remove all associated data.\n\nTo proceed, please enter the admin password."
          }
          confirmLabel="Delete Loan"
          isProcessing={deletingLoan}
          onConfirm={handleConfirmDeleteLoan}
          onCancel={() => {
            if (!deletingLoan) {
              setShowDeleteLoanModal(false);
            }
          }}
        />
      )}

      {/* Close Loan Confirmation Modal */}
      {showCloseLoanModal && (
        <ConfirmWithPasswordModal
          title="Close Loan"
          message={
            "Are you sure you want to close this loan?\nThis is typically done only after all installments are fully paid and collateral is released.\n\nTo proceed, please enter the admin password."
          }
          confirmLabel="Close Loan"
          isProcessing={updatingStatus}
          onConfirm={handleConfirmCloseLoan}
          onCancel={() => {
            if (!updatingStatus) {
              setShowCloseLoanModal(false);
            }
          }}
        />
      )}

      {/* Reopen Loan Confirmation Modal */}
      {showReopenLoanModal && (
        <ConfirmWithPasswordModal
          title="Reopen Loan"
          message={
            "Are you sure you want to reopen this loan?\nThis will change the loan status back to Active.\n\nTo proceed, please enter the admin password."
          }
          confirmLabel="Reopen Loan"
          isProcessing={updatingStatus}
          onConfirm={handleConfirmReopenLoan}
          onCancel={() => {
            if (!updatingStatus) {
              setShowReopenLoanModal(false);
            }
          }}
        />
      )}
    </div>
  );
}
