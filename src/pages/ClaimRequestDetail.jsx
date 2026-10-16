
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  RefreshCw,
  Loader2,
  Package,
  User,
  MapPin,
  Calendar,
  Mail,
  Phone,
  AlertCircle,
  LockKeyhole,
} from "lucide-react";

import { API } from "../config";
const DEFAULT_SETTINGS = {
  primary_color: "#2563eb",
  secondary_color: "#475569",
  background_color: "#f8fafc",
  text_color: "#334155",
  heading_color: "#0f172a",
  card_color: "#ffffff",
  button_text_color: "#ffffff",
  border_color: "#ffffff",
  border_line_color: "#e2e8f0",
  border_style: "solid",
  border_width: "1px",
  border_radius: "12px",
  content_width: "1200px",
  font_family: "Inter, sans-serif",
};

function getStoredObject(key) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

function buildCompanyRoute(companySlug, path = "") {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;

  if (!companySlug) {
    return cleanPath;
  }

  return `/company/${encodeURIComponent(companySlug)}${cleanPath}`;
}

function normalizeColor(value, fallback) {
  if (typeof value !== "string" || !value.trim()) {
    return fallback;
  }

  return value.trim();
}

function normalizeBorderWidth(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return `${Math.max(0, value)}px`;
  }

  if (typeof value === "string" && value.trim()) {
    const trimmed = value.trim();
    return /^\d+(\.\d+)?$/.test(trimmed)
      ? `${trimmed}px`
      : trimmed;
  }

  return DEFAULT_SETTINGS.border_width;
}

function normalizeRadius(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return `${Math.max(0, value)}px`;
  }

  if (typeof value === "string" && value.trim()) {
    const trimmed = value.trim();
    return /^\d+(\.\d+)?$/.test(trimmed)
      ? `${trimmed}px`
      : trimmed;
  }

  return DEFAULT_SETTINGS.border_radius;
}

function normalizeContentWidth(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return `${Math.max(320, value)}px`;
  }

  if (typeof value === "string" && value.trim()) {
    const trimmed = value.trim();
    return /^\d+(\.\d+)?$/.test(trimmed)
      ? `${trimmed}px`
      : trimmed;
  }

  return DEFAULT_SETTINGS.content_width;
}

function getSettingsObject(data) {
  if (!data || typeof data !== "object") {
    return {};
  }

  const candidates = [
    data.settings,
    data.website_settings,
    data.websiteSettings,
    data.website,
    data,
  ];

  return (
    candidates.find(
      (candidate) =>
        candidate &&
        typeof candidate === "object" &&
        !Array.isArray(candidate)
    ) || {}
  );
}

function getVerificationAnswerText(question) {
  if (typeof question === "string") {
    return question;
  }

  if (!question || typeof question !== "object") {
    return "";
  }

  return (
    question.question ||
    question.label ||
    question.text ||
    question.title ||
    ""
  );
}

function formatDate(value) {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString();
}

function InfoItem({ icon, label, value }) {
  return (
    <div className="flex min-w-0 items-start gap-3">
      <div className="tf-info-icon mt-0.5 shrink-0">{icon}</div>

      <div className="min-w-0 flex-1">
        <p className="tf-muted text-sm">{label}</p>
        <p className="tf-body mt-1 break-words text-sm font-semibold">
          {value || "Not provided"}
        </p>
      </div>
    </div>
  );
}

export default function ClaimRequestDetail() {
  const navigate = useNavigate();
  const { id, companySlug } = useParams();

  const storedCompany = getStoredObject("company");
  const storedUser = getStoredObject("user");

  const activeCompanySlug =
    companySlug ||
    localStorage.getItem("companySlug") ||
    localStorage.getItem("company_slug") ||
    storedCompany?.slug ||
    storedUser?.company_slug ||
    storedUser?.companySlug ||
    storedUser?.organization_slug ||
    storedUser?.organizationSlug ||
    "";

  const companyRoute = useCallback(
    (path = "") => buildCompanyRoute(activeCompanySlug, path),
    [activeCompanySlug]
  );

  // ============================================================
  // WEBSITE SETTINGS
  // ============================================================

  const [websiteSettings, setWebsiteSettings] = useState(DEFAULT_SETTINGS);

  const loadWebsiteSettings = useCallback(async () => {
    if (!activeCompanySlug) {
      setWebsiteSettings(DEFAULT_SETTINGS);
      return;
    }

    try {
      const response = await fetch(
        `${API}/company/public/${encodeURIComponent(
          activeCompanySlug
        )}/website/`
      );

      if (!response.ok) {
        return;
      }

      const data = await response.json();
      const settings = getSettingsObject(data);

      setWebsiteSettings({
        ...DEFAULT_SETTINGS,
        ...settings,
      });
    } catch (err) {
      console.error("Unable to load website settings:", err);
    }
  }, [activeCompanySlug]);

  useEffect(() => {
    loadWebsiteSettings();
  }, [loadWebsiteSettings]);

  const themeStyle = useMemo(() => {
    const settings = {
      ...DEFAULT_SETTINGS,
      ...websiteSettings,
    };

    return {
      "--tf-primary": normalizeColor(
        settings.primary_color,
        DEFAULT_SETTINGS.primary_color
      ),
      "--tf-secondary": normalizeColor(
        settings.secondary_color,
        DEFAULT_SETTINGS.secondary_color
      ),
      "--tf-background": normalizeColor(
        settings.background_color,
        DEFAULT_SETTINGS.background_color
      ),
      "--tf-text": normalizeColor(
        settings.text_color,
        DEFAULT_SETTINGS.text_color
      ),
      "--tf-heading": normalizeColor(
        settings.heading_color,
        DEFAULT_SETTINGS.heading_color
      ),
      "--tf-card": normalizeColor(
        settings.card_color,
        DEFAULT_SETTINGS.card_color
      ),
      "--tf-button-text": normalizeColor(
        settings.button_text_color,
        DEFAULT_SETTINGS.button_text_color
      ),

      // Inside fill of bordered elements.
      "--tf-border-fill": normalizeColor(
        settings.border_color,
        DEFAULT_SETTINGS.border_color
      ),

      // Actual border stroke color.
      "--tf-border-line": normalizeColor(
        settings.border_line_color,
        DEFAULT_SETTINGS.border_line_color
      ),

      "--tf-border-style": settings.border_style || "solid",
      "--tf-border-width": normalizeBorderWidth(settings.border_width),
      "--tf-radius": normalizeRadius(settings.border_radius),
      "--tf-content-width": normalizeContentWidth(
        settings.content_width
      ),
      "--tf-font-family":
        settings.font_family || DEFAULT_SETTINGS.font_family,
    };
  }, [websiteSettings]);

  // ============================================================
  // CLAIM STATE
  // ============================================================

  const [claim, setClaim] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [recoveryCode, setRecoveryCode] = useState("");
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [recoveryVerified, setRecoveryVerified] = useState(false);

  const [identityAnswers, setIdentityAnswers] = useState({
    phone: "",
    lost_location: "",
    private_item_detail: "",
  });

  const [identityVerified, setIdentityVerified] = useState(false);
  const [identityResult, setIdentityResult] = useState(null);
  const [verifyingIdentity, setVerifyingIdentity] = useState(false);

  const [pickupNotes, setPickupNotes] = useState("");
  const [completingRecovery, setCompletingRecovery] = useState(false);
  const [completed, setCompleted] = useState(false);

  // ============================================================
  // LOAD CLAIM
  // ============================================================

  const loadClaim = useCallback(async () => {
    if (!id) {
      setError("Claim request ID is missing.");
      setLoading(false);
      return;
    }

    const token =
      localStorage.getItem("access_token") ||
      localStorage.getItem("access");

    if (!token) {
      navigate(companyRoute("/staff-login"), { replace: true });
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${API}/staff/claim-requests/${id}/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 401 || response.status === 403) {
        [
          "access",
          "access_token",
          "refresh",
          "refresh_token",
          "user",
        ].forEach((key) => localStorage.removeItem(key));

        navigate(companyRoute("/staff-login"), { replace: true });
        return;
      }

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.detail ||
            data.message ||
            "Unable to load this claim request."
        );
      }

      const claimData = data.claim || data.data || data;

      setClaim(claimData);

      setRecoveryVerified(
        Boolean(
          claimData.recovery_code_verified ||
            claimData.recovery_verified ||
            claimData.is_recovery_verified
        )
      );

      setIdentityVerified(
        Boolean(
          claimData.identity_verified ||
            claimData.customer_identity_verified ||
            claimData.ownership_verified
        )
      );

      setCompleted(
        String(claimData.status || "").toLowerCase() === "recovered"
      );
    } catch (err) {
      setError(err.message || "An error occurred while loading the claim.");
    } finally {
      setLoading(false);
    }
  }, [id, navigate, companyRoute]);

  useEffect(() => {
    loadClaim();
  }, [loadClaim]);

  // ============================================================
  // VERIFICATION QUESTIONS
  // ============================================================

  const verificationQuestions = useMemo(() => {
    if (
      Array.isArray(claim?.verification_questions) &&
      claim.verification_questions.length
    ) {
      return claim.verification_questions;
    }

    return [
      {
        key: "phone",
        label: "Customer phone number",
        question: "Confirm the phone number associated with the claim.",
      },
      {
        key: "lost_location",
        label: "Where the item was lost",
        question: "Where did the customer lose the item?",
      },
      {
        key: "private_item_detail",
        label: "Private item detail",
        question: "Ask the customer for a detail not publicly listed.",
      },
    ];
  }, [claim]);

  const handleIdentityAnswerChange = (key, value) => {
    setIdentityAnswers((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  // ============================================================
  // VERIFY RECOVERY CODE
  // ============================================================

  const verifyRecoveryCode = async (event) => {
    event?.preventDefault();

    setError("");
    setSuccessMessage("");

    const normalizedCode = recoveryCode.trim();

    if (!/^\d{6}$/.test(normalizedCode)) {
      setError("Enter the six-digit recovery code.");
      return;
    }

    const token =
      localStorage.getItem("access_token") ||
      localStorage.getItem("access");

    if (!token) {
      navigate(companyRoute("/staff-login"), { replace: true });
      return;
    }

    setVerifyingCode(true);

    try {
      const response = await fetch(
        `${API}/staff/claim-requests/${id}/verify-code/`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            recovery_code: normalizedCode,
          }),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.detail ||
            data.message ||
            "Recovery code verification failed."
        );
      }

      if (
        data.success === false ||
        data.verified === false ||
        data.recovery_code_verified === false
      ) {
        throw new Error(
          data.message || "The recovery code could not be verified."
        );
      }

      setRecoveryVerified(true);
      setSuccessMessage(
        data.message || "Recovery code verified successfully."
      );

      await loadClaim();
    } catch (err) {
      setError(err.message || "Unable to verify the recovery code.");
    } finally {
      setVerifyingCode(false);
    }
  };

  // ============================================================
  // RESET VERIFICATION
  // ============================================================

  const resetVerification = () => {
    setRecoveryCode("");
    setRecoveryVerified(false);
    setIdentityVerified(false);
    setIdentityResult(null);

    setIdentityAnswers({
      phone: "",
      lost_location: "",
      private_item_detail: "",
    });

    setPickupNotes("");
    setError("");
    setSuccessMessage("");
  };

  // ============================================================
  // VERIFY CUSTOMER IDENTITY
  // ============================================================

  const verifyCustomerIdentity = async (event) => {
    event?.preventDefault();

    setError("");
    setSuccessMessage("");
    setIdentityResult(null);

    if (!recoveryVerified) {
      setError("Verify the recovery code before verifying ownership.");
      return;
    }

    const requiredKeys = [
      "phone",
      "lost_location",
      "private_item_detail",
    ];

    const allAnswersProvided = requiredKeys.every((key) =>
      String(identityAnswers[key] || "").trim()
    );

    if (!allAnswersProvided) {
      setError("Please complete all three customer verification answers.");
      return;
    }

    const token =
      localStorage.getItem("access_token") ||
      localStorage.getItem("access");

    if (!token) {
      navigate(companyRoute("/staff-login"), { replace: true });
      return;
    }

    setVerifyingIdentity(true);

    try {
      const response = await fetch(
        `${API}/staff/claim-requests/${id}/verify-identity/`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            answers: {
              phone: identityAnswers.phone.trim(),
              lost_location: identityAnswers.lost_location.trim(),
              private_item_detail:
                identityAnswers.private_item_detail.trim(),
            },
          }),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.detail ||
            data.message ||
            "Customer identity verification failed."
        );
      }

      const verified =
        data.success === true ||
        data.identity_verified === true ||
        data.verified === true;

      setIdentityResult(data);

      if (!verified) {
        setIdentityVerified(false);
        throw new Error(
          data.message ||
            "Customer ownership could not be verified. Check the answers and try again."
        );
      }

      setIdentityVerified(true);
      setSuccessMessage(
        data.message || "Customer ownership verified successfully."
      );

      await loadClaim();
    } catch (err) {
      setError(err.message || "Unable to verify customer identity.");
    } finally {
      setVerifyingIdentity(false);
    }
  };

  // ============================================================
  // COMPLETE RECOVERY
  // ============================================================

  const completeRecovery = async (event) => {
    event?.preventDefault();

    setError("");
    setSuccessMessage("");

    if (!recoveryVerified) {
      setError("Verify the recovery code before completing recovery.");
      return;
    }

    if (!identityVerified) {
      setError("Verify the customer's identity before completing recovery.");
      return;
    }

    const token =
      localStorage.getItem("access_token") ||
      localStorage.getItem("access");

    if (!token) {
      navigate(companyRoute("/staff-login"), { replace: true });
      return;
    }

    setCompletingRecovery(true);

    try {
      const response = await fetch(
        `${API}/staff/claim-requests/${id}/complete/`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            pickup_verified: true,
            pickup_questions_passed: identityVerified ? 3 : 0,
            pickup_questions_total: 3,
            pickup_notes: pickupNotes.trim(),
          }),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.detail ||
            data.message ||
            "Unable to complete this recovery."
        );
      }

      if (data.success === false) {
        throw new Error(
          data.message || "The recovery could not be completed."
        );
      }

      setCompleted(true);
      setSuccessMessage(
        data.message || "Recovery completed successfully."
      );

      await loadClaim();
    } catch (err) {
      setError(err.message || "Unable to complete this recovery.");
    } finally {
      setCompletingRecovery(false);
    }
  };

  // ============================================================
  // LOADING STATE
  // ============================================================

  if (loading) {
    return (
      <div
        className="tf-page min-h-screen px-4 py-10"
        style={themeStyle}
      >
        <style>{themeCSS}</style>

        <div className="tf-content mx-auto flex min-h-[60vh] items-center justify-center">
          <div className="tf-card flex flex-col items-center gap-4 p-8 text-center">
            <Loader2
              className="h-10 w-10 animate-spin"
              style={{ color: "var(--tf-primary)" }}
            />
            <p className="tf-body">Loading claim request...</p>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // CLAIM NOT FOUND / ERROR STATE
  // ============================================================

  if (!claim) {
    return (
      <div
        className="tf-page min-h-screen px-4 py-10"
        style={themeStyle}
      >
        <style>{themeCSS}</style>

        <div className="tf-content mx-auto max-w-2xl">
          <div className="tf-card p-6 sm:p-8">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
              <AlertCircle className="h-6 w-6" />
            </div>

            <h1 className="tf-heading text-xl font-bold">
              Claim Request
            </h1>

            <p className="tf-body mt-2">
              {error || "This claim request could not be found."}
            </p>

            <button
              type="button"
              onClick={() =>
                navigate(companyRoute("/staff/claim-requests"))
              }
              className="tf-primary-button mt-6 inline-flex items-center gap-2 px-4 py-2.5 font-semibold"
            >
              <ArrowLeft size={18} />
              Back to Claim Requests
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // DERIVED CLAIM DATA
  // ============================================================

  const lostItem = claim.lost_item || claim.lost || {};
  const foundItem = claim.found_item || claim.found || {};
  const customer = claim.customer || claim.claimant || claim.user || {};

  const customerName =
    customer.full_name ||
    customer.name ||
    claim.customer_name ||
    claim.claimant_name ||
    customer.username ||
    "Customer";

  const customerPhone =
    customer.phone ||
    customer.phone_number ||
    claim.customer_phone ||
    claim.phone ||
    "Not provided";

  const customerEmail =
    customer.email ||
    claim.customer_email ||
    "Not provided";

  const matchConfidence =
    claim.match_confidence ??
    claim.match_percentage ??
    claim.confidence_score ??
    null;

  const isComplete =
    completed ||
    String(claim.status || "").toLowerCase() === "recovered";

  const statusLabel = isComplete
    ? "Recovered"
    : String(claim.status || "Pending").replaceAll("_", " ");

  const statusClass = isComplete
    ? "tf-status-success"
    : "tf-status-pending";

  // ============================================================
  // MAIN PAGE
  // ============================================================

  return (
    <div
      className="tf-page min-h-screen px-4 py-6 sm:px-6 lg:px-8"
      style={themeStyle}
    >
      <style>{themeCSS}</style>

      <div className="tf-content mx-auto space-y-6">
        {/* HEADER */}
        <header className="tf-card p-5 sm:p-6">
          <button
            type="button"
            onClick={() =>
              navigate(companyRoute("/staff/claim-requests"))
            }
            className="tf-back-button mb-5 inline-flex items-center gap-2 text-sm font-semibold"
          >
            <ArrowLeft size={18} />
            Back to Claim Requests
          </button>

          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div>
              <p className="tf-muted mb-2 text-sm">
                {activeCompanySlug || "TrustFound"}
              </p>

              <h1 className="tf-heading text-2xl font-bold sm:text-3xl">
                Claim Request Details
              </h1>

              <p className="tf-body mt-2 text-sm">
                Review the claim, verify the recovery code, confirm
                customer ownership, and complete the recovery.
              </p>

              <p className="tf-muted mt-3 text-sm">
                Claim ID: {claim.id || id}
              </p>
            </div>

            <span className={`tf-status ${statusClass}`}>
              {statusLabel}
            </span>
          </div>
        </header>

        {/* ERROR MESSAGE */}
        {error && (
          <div
            role="alert"
            className="tf-notice tf-notice-error flex items-start gap-3 p-4"
          >
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

            <p className="text-sm font-medium">{error}</p>

            <button
              type="button"
              onClick={() => setError("")}
              className="ml-auto shrink-0"
              aria-label="Dismiss error"
            >
              <XCircle size={18} />
            </button>
          </div>
        )}

        {/* SUCCESS MESSAGE */}
        {successMessage && (
          <div
            role="status"
            className="tf-notice tf-notice-success flex items-start gap-3 p-4"
          >
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />

            <p className="text-sm font-medium">{successMessage}</p>

            <button
              type="button"
              onClick={() => setSuccessMessage("")}
              className="ml-auto shrink-0"
              aria-label="Dismiss success message"
            >
              <XCircle size={18} />
            </button>
          </div>
        )}

        {/* RECOVERY STEPS */}
        <section className="space-y-5">
          {/* STEP 1: RECOVERY CODE */}
          <div className="tf-card overflow-hidden">
            <div className="tf-section-heading flex items-center gap-3 border-b p-5">
              <div className="tf-icon-box">
                <LockKeyhole size={21} />
              </div>

              <div className="min-w-0 flex-1">
                <h2 className="tf-heading text-lg font-bold">
                  Step 1: Verify Recovery Code
                </h2>

                <p className="tf-muted mt-1 text-sm">
                  Confirm the code supplied for this recovery.
                </p>
              </div>

              {recoveryVerified && (
                <CheckCircle2
                  className="h-6 w-6 shrink-0 text-emerald-600"
                  aria-label="Recovery code verified"
                />
              )}
            </div>

            <div className="p-5 sm:p-6">
              {recoveryVerified ? (
                <div className="tf-complete-panel flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                  <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-600" />

                  <div>
                    <p className="font-semibold">
                      Recovery code verified
                    </p>

                    <p className="tf-muted mt-1 text-sm">
                      You can proceed to customer identity verification.
                    </p>
                  </div>
                </div>
              ) : (
                <form
                  onSubmit={verifyRecoveryCode}
                  className="space-y-4"
                >
                  <label
                    htmlFor="recoveryCode"
                    className="tf-label block text-sm font-semibold"
                  >
                    Six-digit recovery code
                  </label>

                  <input
                    id="recoveryCode"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={recoveryCode}
                    onChange={(event) =>
                      setRecoveryCode(
                        event.target.value.replace(/\D/g, "").slice(0, 6)
                      )
                    }
                    placeholder="Enter 6-digit code"
                    className="tf-input w-full max-w-md px-4 py-3"
                    disabled={verifyingCode || isComplete}
                  />

                  <p className="tf-muted text-sm">
                    Enter the code exactly as provided for this claim.
                  </p>

                  <div className="flex flex-wrap gap-3">
                    <button
                      type="submit"
                      disabled={
                        verifyingCode ||
                        isComplete ||
                        recoveryCode.trim().length !== 6
                      }
                      className="tf-primary-button inline-flex items-center justify-center gap-2 px-5 py-3 font-semibold disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {verifyingCode ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <ShieldCheck size={18} />
                      )}

                      {verifyingCode
                        ? "Verifying..."
                        : "Verify Recovery Code"}
                    </button>

                    <button
                      type="button"
                      onClick={resetVerification}
                      disabled={verifyingCode || isComplete}
                      className="tf-secondary-button inline-flex items-center justify-center gap-2 px-5 py-3 font-semibold disabled:opacity-60"
                    >
                      <RefreshCw size={17} />
                      Reset
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* STEP 2: CUSTOMER IDENTITY */}
          <div className="tf-card overflow-hidden">
            <div className="tf-section-heading flex items-center gap-3 border-b p-5">
              <div className="tf-icon-box">
                <User size={21} />
              </div>

              <div className="min-w-0 flex-1">
                <h2 className="tf-heading text-lg font-bold">
                  Step 2: Verify Customer Ownership
                </h2>

                <p className="tf-muted mt-1 text-sm">
                  Confirm the customer knows the correct details about
                  the lost item.
                </p>
              </div>

              {identityVerified && (
                <CheckCircle2
                  className="h-6 w-6 shrink-0 text-emerald-600"
                  aria-label="Customer identity verified"
                />
              )}
            </div>

            <div className="p-5 sm:p-6">
              {!recoveryVerified && (
                <div className="tf-muted-panel mb-5 flex items-start gap-3 p-4">
                  <LockKeyhole className="mt-0.5 h-5 w-5 shrink-0" />

                  <p className="text-sm">
                    Verify the recovery code in Step 1 before continuing.
                  </p>
                </div>
              )}

              {identityVerified ? (
                <div className="tf-complete-panel flex items-start gap-3 p-4">
                  <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-emerald-600" />

                  <div>
                    <p className="font-semibold">
                      Customer ownership verified
                    </p>

                    <p className="tf-muted mt-1 text-sm">
                      The customer passed the ownership verification step.
                    </p>
                  </div>
                </div>
              ) : (
                <form
                  onSubmit={verifyCustomerIdentity}
                  className="space-y-5"
                >
                  {verificationQuestions.map((question, index) => {
                    const key =
                      typeof question === "object" && question?.key
                        ? question.key
                        : [
                            "phone",
                            "lost_location",
                            "private_item_detail",
                          ][index];

                    const fallbackLabels = {
                      phone: "Customer phone number",
                      lost_location: "Where the item was lost",
                      private_item_detail: "Private item detail",
                    };

                    const label =
                      (typeof question === "object" &&
                        (question.label || question.title)) ||
                      fallbackLabels[key] ||
                      `Verification question ${index + 1}`;

                    const questionText =
                      getVerificationAnswerText(question) || label;

                    return (
                      <div
                        key={`${key}-${index}`}
                        className="space-y-2"
                      >
                        <label
                          htmlFor={`identity-${key}`}
                          className="tf-label block text-sm font-semibold"
                        >
                          {index + 1}. {label}
                        </label>

                        <p className="tf-muted text-sm">{questionText}</p>

                        <input
                          id={`identity-${key}`}
                          type="text"
                          value={identityAnswers[key] || ""}
                          onChange={(event) =>
                            handleIdentityAnswerChange(
                              key,
                              event.target.value
                            )
                          }
                          placeholder={`Enter ${label.toLowerCase()}`}
                          className="tf-input w-full px-4 py-3"
                          disabled={
                            !recoveryVerified ||
                            verifyingIdentity ||
                            isComplete
                          }
                          required
                        />
                      </div>
                    );
                  })}

                  {identityResult?.message && !identityVerified && (
                    <div className="tf-muted-panel p-3 text-sm">
                      {identityResult.message}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={
                      !recoveryVerified ||
                      verifyingIdentity ||
                      isComplete
                    }
                    className="tf-primary-button inline-flex items-center justify-center gap-2 px-5 py-3 font-semibold disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {verifyingIdentity ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <ShieldCheck size={18} />
                    )}

                    {verifyingIdentity
                      ? "Verifying Customer..."
                      : "Verify Customer Ownership"}
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* STEP 3: COMPLETE RECOVERY */}
          <div className="tf-card overflow-hidden">
            <div className="tf-section-heading flex items-center gap-3 border-b p-5">
              <div className="tf-icon-box">
                <CheckCircle2 size={21} />
              </div>

              <div className="min-w-0 flex-1">
                <h2 className="tf-heading text-lg font-bold">
                  Step 3: Complete Recovery
                </h2>

                <p className="tf-muted mt-1 text-sm">
                  Record any pickup notes and finalize the recovery.
                </p>
              </div>

              {isComplete && (
                <CheckCircle2
                  className="h-6 w-6 shrink-0 text-emerald-600"
                  aria-label="Recovery completed"
                />
              )}
            </div>

            <div className="p-5 sm:p-6">
              {isComplete ? (
                <div className="tf-complete-panel flex items-start gap-3 p-4">
                  <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-emerald-600" />

                  <div>
                    <p className="font-semibold">
                      Recovery completed successfully
                    </p>

                    <p className="tf-muted mt-1 text-sm">
                      This claim is marked as recovered.
                    </p>
                  </div>
                </div>
              ) : (
                <form
                  onSubmit={completeRecovery}
                  className="space-y-4"
                >
                  <div className="tf-muted-panel p-4">
                    <p className="text-sm">
                      Recovery code:{" "}
                      <strong>
                        {recoveryVerified ? "Verified" : "Not verified"}
                      </strong>
                    </p>

                    <p className="mt-2 text-sm">
                      Customer ownership:{" "}
                      <strong>
                        {identityVerified ? "Verified" : "Not verified"}
                      </strong>
                    </p>
                  </div>

                  <label
                    htmlFor="pickupNotes"
                    className="tf-label block text-sm font-semibold"
                  >
                    Pickup notes (optional)
                  </label>

                  <textarea
                    id="pickupNotes"
                    rows={4}
                    value={pickupNotes}
                    onChange={(event) => setPickupNotes(event.target.value)}
                    placeholder="Add relevant pickup or handover notes..."
                    className="tf-input w-full px-4 py-3"
                    disabled={completingRecovery}
                  />

                  <button
                    type="submit"
                    disabled={
                      !recoveryVerified ||
                      !identityVerified ||
                      completingRecovery
                    }
                    className="tf-primary-button inline-flex items-center justify-center gap-2 px-5 py-3 font-semibold disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {completingRecovery ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <CheckCircle2 size={18} />
                    )}

                    {completingRecovery
                      ? "Completing Recovery..."
                      : "Complete Recovery"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </section>

        {/* CUSTOMER INFORMATION */}
        <section className="tf-card overflow-hidden">
          <div className="tf-section-heading flex items-center gap-3 border-b p-5">
            <div className="tf-icon-box">
              <User size={21} />
            </div>

            <div>
              <h2 className="tf-heading text-lg font-bold">
                Customer Information
              </h2>

              <p className="tf-muted mt-1 text-sm">
                Contact information associated with this claim.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2 sm:p-6">
            <InfoItem
              icon={<User size={18} />}
              label="Customer name"
              value={customerName}
            />

            <InfoItem
              icon={<Phone size={18} />}
              label="Phone number"
              value={customerPhone}
            />

            <InfoItem
              icon={<Mail size={18} />}
              label="Email address"
              value={customerEmail}
            />

            <InfoItem
              icon={<Calendar size={18} />}
              label="Claim submitted"
              value={formatDate(
                claim.created_at ||
                  claim.submitted_at ||
                  claim.date_created
              )}
            />
          </div>
        </section>

        {/* MATCH INFORMATION */}
        <section className="tf-card overflow-hidden">
          <div className="tf-section-heading flex items-center gap-3 border-b p-5">
            <div className="tf-icon-box">
              <ShieldCheck size={21} />
            </div>

            <div>
              <h2 className="tf-heading text-lg font-bold">
                Match Information
              </h2>

              <p className="tf-muted mt-1 text-sm">
                Details about the reported match.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2 sm:p-6">
            <InfoItem
              icon={<ShieldCheck size={18} />}
              label="Match confidence"
              value={
                matchConfidence !== null && matchConfidence !== undefined
                  ? `${matchConfidence}${
                      String(matchConfidence).includes("%") ? "" : "%"
                    }`
                  : "Not available"
              }
            />

            <InfoItem
              icon={<Package size={18} />}
              label="Claim status"
              value={statusLabel}
            />

            <InfoItem
              icon={<Calendar size={18} />}
              label="Last updated"
              value={formatDate(
                claim.updated_at ||
                  claim.modified_at ||
                  claim.created_at
              )}
            />

            <InfoItem
              icon={<MapPin size={18} />}
              label="Reported location"
              value={
                lostItem.location ||
                lostItem.lost_location ||
                claim.lost_location ||
                "Not provided"
              }
            />
          </div>
        </section>

        {/* LOST AND FOUND ITEMS */}
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* LOST ITEM */}
          <div className="tf-card overflow-hidden">
            <div className="tf-section-heading flex items-center gap-3 border-b p-5">
              <div className="tf-icon-box">
                <Package size={21} />
              </div>

              <div>
                <h2 className="tf-heading text-lg font-bold">Lost Item</h2>
                <p className="tf-muted mt-1 text-sm">
                  Item originally reported missing.
                </p>
              </div>
            </div>

            <div className="space-y-4 p-5 sm:p-6">
              <InfoItem
                icon={<Package size={18} />}
                label="Item name"
                value={
                  lostItem.name ||
                  lostItem.item_name ||
                  lostItem.title ||
                  claim.lost_item_name ||
                  "Not provided"
                }
              />

              <InfoItem
                icon={<Calendar size={18} />}
                label="Date lost"
                value={formatDate(
                  lostItem.date_lost ||
                    lostItem.lost_date ||
                    claim.date_lost
                )}
              />

              <InfoItem
                icon={<MapPin size={18} />}
                label="Location lost"
                value={
                  lostItem.location ||
                  lostItem.lost_location ||
                  claim.lost_location ||
                  "Not provided"
                }
              />

              <div>
                <p className="tf-label mb-2 text-sm font-semibold">
                  Description
                </p>

                <p className="tf-body whitespace-pre-wrap text-sm leading-6">
                  {lostItem.description ||
                    lostItem.details ||
                    claim.lost_item_description ||
                    "No description provided."}
                </p>
              </div>
            </div>
          </div>

          {/* FOUND ITEM */}
          <div className="tf-card overflow-hidden">
            <div className="tf-section-heading flex items-center gap-3 border-b p-5">
              <div className="tf-icon-box">
                <Package size={21} />
              </div>

              <div>
                <h2 className="tf-heading text-lg font-bold">Found Item</h2>
                <p className="tf-muted mt-1 text-sm">
                  Item associated with this claim.
                </p>
              </div>
            </div>

            <div className="space-y-4 p-5 sm:p-6">
              <InfoItem
                icon={<Package size={18} />}
                label="Item name"
                value={
                  foundItem.name ||
                  foundItem.item_name ||
                  foundItem.title ||
                  claim.found_item_name ||
                  "Not provided"
                }
              />

              <InfoItem
                icon={<Calendar size={18} />}
                label="Date found"
                value={formatDate(
                  foundItem.date_found ||
                    foundItem.found_date ||
                    claim.date_found
                )}
              />

              <InfoItem
                icon={<MapPin size={18} />}
                label="Location found"
                value={
                  foundItem.location ||
                  foundItem.found_location ||
                  claim.found_location ||
                  "Not provided"
                }
              />

              <div>
                <p className="tf-label mb-2 text-sm font-semibold">
                  Description
                </p>

                <p className="tf-body whitespace-pre-wrap text-sm leading-6">
                  {foundItem.description ||
                    foundItem.details ||
                    claim.found_item_description ||
                    "No description provided."}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="flex flex-wrap items-center justify-between gap-4 py-2">
          <p className="tf-muted text-sm">
            TrustFound · Claim recovery management
          </p>

          <button
            type="button"
            onClick={() =>
              navigate(companyRoute("/staff/claim-requests"))
            }
            className="tf-secondary-button inline-flex items-center gap-2 px-4 py-2.5 font-semibold"
          >
            <ArrowLeft size={17} />
            Back to Claim Requests
          </button>
        </footer>
      </div>
    </div>
  );
}

// ============================================================
// WEBSITE SETTINGS THEME
// ============================================================

const themeCSS = `
  .tf-page {
    background: var(--tf-background);
    color: var(--tf-text);
    font-family: var(--tf-font-family);
    transition: background-color 0.2s ease, color 0.2s ease;
  }

  .tf-content {
    width: 100%;
    max-width: var(--tf-content-width);
  }

  .tf-card {
    color: var(--tf-text);
    background: var(--tf-card);
    border: var(--tf-border-width) var(--tf-border-style) var(--tf-border-line);
    border-radius: var(--tf-radius);
    box-shadow: 0 2px 8px rgba(15, 23, 42, 0.035);
  }

  .tf-section-heading {
    border-color: var(--tf-border-line) !important;
    background: var(--tf-border-fill);
  }

  .tf-heading {
    color: var(--tf-heading);
  }

  .tf-body {
    color: var(--tf-text);
  }

  .tf-muted {
    color: var(--tf-secondary);
    opacity: 0.88;
  }

  .tf-label {
    color: var(--tf-heading);
  }

  .tf-icon-box {
    display: flex;
    height: 42px;
    width: 42px;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    border: var(--tf-border-width) var(--tf-border-style) var(--tf-border-line);
    border-radius: var(--tf-radius);
    background: var(--tf-border-fill);
    color: var(--tf-primary);
  }

  .tf-info-icon {
    color: var(--tf-primary);
  }

  .tf-primary-button {
    color: var(--tf-button-text);
    background: var(--tf-primary);
    border: var(--tf-border-width) var(--tf-border-style) var(--tf-primary);
    border-radius: var(--tf-radius);
    transition: opacity 0.2s ease, transform 0.2s ease;
  }

  .tf-primary-button:hover:not(:disabled) {
    opacity: 0.9;
    transform: translateY(-1px);
  }

  .tf-secondary-button {
    color: var(--tf-heading);
    background: var(--tf-border-fill);
    border: var(--tf-border-width) var(--tf-border-style) var(--tf-border-line);
    border-radius: var(--tf-radius);
    transition: opacity 0.2s ease;
  }

  .tf-secondary-button:hover:not(:disabled) {
    opacity: 0.8;
  }

  .tf-back-button {
    color: var(--tf-primary);
  }

  .tf-back-button:hover {
    opacity: 0.8;
  }

  .tf-input {
    color: var(--tf-text);
    background: var(--tf-card);
    border: var(--tf-border-width) var(--tf-border-style) var(--tf-border-line);
    border-radius: var(--tf-radius);
    outline: none;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
  }

  .tf-input::placeholder {
    color: var(--tf-secondary);
    opacity: 0.65;
  }

  .tf-input:focus {
    border-color: var(--tf-primary);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--tf-primary) 15%, transparent);
  }

  .tf-input:disabled {
    cursor: not-allowed;
    opacity: 0.65;
  }

  .tf-status {
    display: inline-flex;
    align-items: center;
    align-self: flex-start;
    border: var(--tf-border-width) var(--tf-border-style) var(--tf-border-line);
    border-radius: 999px;
    padding: 7px 12px;
    font-size: 0.8rem;
    font-weight: 700;
    text-transform: capitalize;
    white-space: nowrap;
  }

  .tf-status-success {
    color: #047857;
    background: #ecfdf5;
    border-color: #a7f3d0;
  }

  .tf-status-pending {
    color: #92400e;
    background: #fffbeb;
    border-color: #fde68a;
  }

  .tf-complete-panel {
    color: var(--tf-text);
    background: var(--tf-border-fill);
    border: var(--tf-border-width) var(--tf-border-style) var(--tf-border-line);
    border-radius: var(--tf-radius);
  }

  .tf-muted-panel {
    color: var(--tf-text);
    background: var(--tf-border-fill);
    border: var(--tf-border-width) var(--tf-border-style) var(--tf-border-line);
    border-radius: var(--tf-radius);
  }

  .tf-notice {
    border: var(--tf-border-width) var(--tf-border-style) var(--tf-border-line);
    border-radius: var(--tf-radius);
  }

  .tf-notice-error {
    color: #b91c1c;
    background: #fef2f2;
    border-color: #fecaca;
  }

  .tf-notice-success {
    color: #047857;
    background: #ecfdf5;
    border-color: #a7f3d0;
  }

  @media (max-width: 640px) {
    .tf-page {
      padding-left: 12px;
      padding-right: 12px;
    }

    .tf-primary-button,
    .tf-secondary-button {
      max-width: 100%;
    }
  }
`;
