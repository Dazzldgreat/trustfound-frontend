import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { ArrowRight, Hash, KeyRound, LockKeyhole, Mail, ShieldCheck } from "lucide-react";

import { API } from "../config";
import { BRAND, resolveMediaUrl, withAlpha, upgradeLegacyColor } from "../theme";
import AuthLayout, {
  AuthAlert,
  AuthField,
  AuthHeading,
  AuthMessage,
  AuthSubmit,
} from "../component/auth/AuthLayout";

const DEFAULT_THEME = {
  primary_color: BRAND.primary,
  secondary_color: BRAND.graphite,
  background_color: BRAND.background,
};

function pickColor(value, fallback) {
    value = upgradeLegacyColor(value);
  return typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value.trim())
    ? value.trim()
    : fallback;
}

function StaffLoginPage() {
  const navigate = useNavigate();
  const params = useParams();

  // Supports either:
  // /company/:companySlug/staff-login
  // OR
  // /company/:slug/staff-login
  const slug = params.companySlug || params.slug;

  console.log("STAFF LOGIN COMPANY SLUG:", slug);

  // ============================================================
  // COMPANY
  // ============================================================

  const [company, setCompany] = useState(null);
  const [companyLoading, setCompanyLoading] = useState(true);
  const [companyError, setCompanyError] = useState("");

  // ============================================================
  // LOGIN
  // ============================================================

  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
  });

  const [loginLoading, setLoginLoading] = useState(false);
  const [loginMessage, setLoginMessage] = useState("");

  // ============================================================
  // FORGOT PASSWORD
  // ============================================================

  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState("");

  // ============================================================
  // RESET PASSWORD
  // ============================================================

  const [resetForm, setResetForm] = useState({
    email: "",
    code: "",
    new_password: "",
    confirm_password: "",
    
  });

  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState("");

  // ============================================================
  // CHANGE PASSWORD
  // ============================================================

  const [changeForm, setChangeForm] = useState({
    old_password: "",
    new_password: "",
    confirm_password: "",
  });

  const [changeLoading, setChangeLoading] = useState(false);
  const [changeMessage, setChangeMessage] = useState("");

  // ============================================================
  // ACTIVE PANEL
  // ============================================================

  const [activePanel, setActivePanel] = useState("login");

  // ============================================================
  // COMPANY THEME (optional: falls back to Orange & Graphite)
  // ============================================================

  const [theme, setTheme] = useState(DEFAULT_THEME);

  useEffect(() => {
    if (!slug) return undefined;

    let cancelled = false;

    fetch(`${API}/company/public/${encodeURIComponent(slug)}/website/`)
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        const source = data?.settings || data?.website_settings;
        if (!source || cancelled) return;

        setTheme({
          primary_color: pickColor(source.primary_color, DEFAULT_THEME.primary_color),
          secondary_color: pickColor(source.secondary_color, DEFAULT_THEME.secondary_color),
          background_color: pickColor(source.background_color, DEFAULT_THEME.background_color),
        });
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [slug]);

  // ============================================================
  // LOAD COMPANY
  // ============================================================

  useEffect(() => {
    const loadCompany = async () => {
      console.log("LOADING COMPANY:", slug);

      if (!slug) {
        setCompanyError(
          "Company platform was not specified."
        );
        setCompanyLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `${API}/company/public/${encodeURIComponent(slug)}/`
        );

        const data = await response.json();

        console.log("PUBLIC COMPANY RESPONSE:", data);

        if (!response.ok) {
          throw new Error(
            data.error ||
              data.detail ||
              "Company platform not found."
          );
        }

        const companyData =
          data.company || data;

        setCompany(companyData);

        localStorage.setItem(
          "company",
          JSON.stringify(companyData)
        );
      } catch (error) {
        console.error(
          "COMPANY LOAD ERROR:",
          error
        );

        setCompanyError(
          error.message ||
            "Unable to load company information."
        );
      } finally {
        setCompanyLoading(false);
      }
    };

    loadCompany();
  }, [slug]);

  // ============================================================
  // FORM CHANGE
  // ============================================================

  const handleLoginChange = (e) => {
    setLoginForm((previous) => ({
      ...previous,
      [e.target.name]: e.target.value,
    }));
  };

  // ============================================================
  // STAFF LOGIN
  // ============================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!slug) {
      setLoginMessage(
        "Company platform was not specified."
      );
      return;
    }

    setLoginLoading(true);
    setLoginMessage("");

    try {
      const response = await fetch(
        `${API}/staff/login/`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            email: loginForm.email
              .trim()
              .toLowerCase(),

            password: loginForm.password,

            company_slug: slug,
          }),
        }
      );

      const data = await response.json();

      console.log(
        "STAFF LOGIN RESPONSE:",
        data
      );

      if (!response.ok) {
        throw new Error(
          data.error ||
            data.detail ||
            "Invalid email or password."
        );
      }

      // ========================================================
      // TOKENS
      // ========================================================

      localStorage.setItem(
        "access",
        data.access
      );

      localStorage.setItem(
        "refresh",
        data.refresh
      );

      localStorage.setItem(
        "access_token",
        data.access
      );

      localStorage.setItem(
        "refresh_token",
        data.refresh
      );

      // ========================================================
      // STAFF
      // ========================================================

      const staffData = {
        id: data.user?.id,
        username: data.user?.username,
        name: data.user?.name,
        email: data.user?.email,
        role: data.user?.role,
      };

      localStorage.setItem(
        "staff",
        JSON.stringify(staffData)
      );

      // ========================================================
      // COMPANY
      // ========================================================

      const companyData = {
        id:
          data.company?.id ||
          company?.id,

        name:
          data.company?.name ||
          company?.name,

        slug:
          data.company?.slug ||
          slug,

        logo:
          data.company?.logo ||
          company?.logo ||
          null,
      };

      localStorage.setItem(
        "company",
        JSON.stringify(companyData)
      );

      // ========================================================
      // GO TO COMPANY STAFF DASHBOARD
      // ========================================================

      navigate(
        `/company/${slug}/staff-dashboard`
      );

    } catch (error) {
      console.error(
        "STAFF LOGIN ERROR:",
        error
      );

      setLoginMessage(
        error.message
      );
    } finally {
      setLoginLoading(false);
    }
  };

  // ============================================================
  // FORGOT PASSWORD
  // ============================================================

  const handleForgotPassword = async (e) => {
    e.preventDefault();

    if (!slug) {
      setForgotMessage(
        "Company platform was not specified."
      );
      return;
    }

    setForgotLoading(true);
    setForgotMessage("");

    try {
      const email =
        forgotEmail
          .trim()
          .toLowerCase();

      const response = await fetch(
        `${API}/staff/forgot-password/`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            email,
            company_slug: slug,
          }),
        }
      );

      const data = await response.json();

      console.log(
        "STAFF FORGOT PASSWORD:",
        data
      );

      if (!response.ok) {
        throw new Error(
          data.error ||
            data.detail ||
            "Unable to send reset code."
        );
      }

      setResetForm({
        email,
        code: "",
        new_password: "",
        confirm_password: "",
      });

      setForgotMessage(
        data.message ||
          "A reset code has been sent to your email."
      );

      setTimeout(() => {
        setForgotMessage("");
        setActivePanel("reset");
      }, 1000);

    } catch (error) {
      console.error(
        "FORGOT PASSWORD ERROR:",
        error
      );

      setForgotMessage(
        error.message
      );
    } finally {
      setForgotLoading(false);
    }
  };

  // ============================================================
  // RESET FORM CHANGE
  // ============================================================

  const handleResetChange = (e) => {
    setResetForm((previous) => ({
      ...previous,
      [e.target.name]: e.target.value,
    }));
  };

  // ============================================================
  // RESET STAFF PASSWORD
  // ============================================================

  const handleResetPassword = async (e) => {
    e.preventDefault();

    setResetLoading(true);
    setResetMessage("");

    if (
      resetForm.new_password !==
      resetForm.confirm_password
    ) {
      setResetMessage(
        "Passwords do not match."
      );

      setResetLoading(false);
      return;
    }

    if (
      resetForm.new_password.length < 8
    ) {
      setResetMessage(
        "Password must contain at least 8 characters."
      );

      setResetLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `${API}/staff/reset-password/`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            email: resetForm.email.trim().toLowerCase(),
            company_slug: slug, 
            code: resetForm.code.trim(),
            new_password: resetForm.new_password,
            confirm_password: resetForm.confirm_password,
          })
        }
      );
      const data = await response.json();

      console.log(
        "STAFF RESET RESPONSE:",
        data
      );

      if (!response.ok) {
        throw new Error(
          data.error ||
            data.detail ||
            "Unable to reset password."
        );
      }

      setResetMessage(
        data.message ||
          "Password reset successfully."
      );

      setTimeout(() => {
        setLoginForm({
          email: resetForm.email,
          password: "",
        });

        setResetForm({
          email: "",
          code: "",
          new_password: "",
          confirm_password: "",
        });

        setResetMessage("");
        setActivePanel("login");
      }, 1500);

    } catch (error) {
      console.error(
        "STAFF RESET ERROR:",
        error
      );

      setResetMessage(
        error.message
      );
    } finally {
      setResetLoading(false);
    }
  };

  // ============================================================
  // CHANGE PASSWORD
  // ============================================================

  const handleChangePasswordChange = (e) => {
    setChangeForm((previous) => ({
      ...previous,
      [e.target.name]: e.target.value,
    }));
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    setChangeLoading(true);
    setChangeMessage("");

    if (
      changeForm.new_password !==
      changeForm.confirm_password
    ) {
      setChangeMessage(
        "New passwords do not match."
      );

      setChangeLoading(false);
      return;
    }

    if (
      changeForm.new_password.length < 8
    ) {
      setChangeMessage(
        "Password must contain at least 8 characters."
      );

      setChangeLoading(false);
      return;
    }

    const token =
      localStorage.getItem(
        "access_token"
      ) ||
      localStorage.getItem("access");

    if (!token) {
      setChangeMessage(
        "Please login first before changing your password."
      );

      setChangeLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `${API}/staff/change-password/`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${token}`,
          },

          body: JSON.stringify({
            old_password:
              changeForm.old_password,

            new_password:
              changeForm.new_password,
          }),
        }
      );

      const data = await response.json();

      console.log(
        "STAFF CHANGE PASSWORD:",
        data
      );

      if (
        response.status === 401
      ) {
        localStorage.removeItem(
          "access"
        );

        localStorage.removeItem(
          "access_token"
        );

        localStorage.removeItem(
          "refresh"
        );

        localStorage.removeItem(
          "refresh_token"
        );

        setChangeMessage(
          "Your session has expired. Please login again."
        );

        setTimeout(() => {
          setActivePanel("login");
        }, 1200);

        return;
      }

      if (!response.ok) {
        throw new Error(
          data.error ||
            data.detail ||
            "Unable to change password."
        );
      }

      setChangeMessage(
        data.message ||
          "Password changed successfully."
      );

      setChangeForm({
        old_password: "",
        new_password: "",
        confirm_password: "",
      });

    } catch (error) {
      console.error(
        "CHANGE PASSWORD ERROR:",
        error
      );

      setChangeMessage(
        error.message
      );
    } finally {
      setChangeLoading(false);
    }
  };

  // ============================================================
  // THEME + MESSAGE TONE
  // ============================================================

  const primary = theme.primary_color;

  // Messages share one state per panel; pick green for success.
  const toneOf = (message) =>
    /success|sent|changed|reset\b|verified/i.test(message || "") &&
    !/unable|invalid|expired|error|failed|not /i.test(message || "")
      ? "success"
      : "error";

  const linkButton =
    "w-full rounded-xl px-4 py-3 text-sm font-semibold text-stone-600 transition hover:bg-stone-50 hover:text-graphite";

  // ============================================================
  // LOGIN PANEL
  // ============================================================

  const renderLogin = () => (
    <>
      <AuthHeading
        title="Staff sign in"
        subtitle={`Access the ${company?.name || "company"} staff portal`}
      />

      <AuthAlert>{loginMessage}</AuthAlert>

      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthField
          id="email"
          label="Email"
          icon={Mail}
          type="email"
          value={loginForm.email}
          onChange={handleLoginChange}
          required
          autoComplete="email"
          placeholder="staff@company.com"
          primary={primary}
        />

        <AuthField
          id="password"
          label="Password"
          icon={LockKeyhole}
          type="password"
          value={loginForm.password}
          onChange={handleLoginChange}
          required
          autoComplete="current-password"
          placeholder="Enter your password"
          primary={primary}
          action={
            <button
              type="button"
              onClick={() => {
                setForgotEmail(loginForm.email);
                setForgotMessage("");
                setActivePanel("forgot");
              }}
              className="text-sm font-semibold hover:underline"
              style={{ color: primary }}
            >
              Forgot password?
            </button>
          }
        />

        <div className="pt-2">
          <AuthSubmit
            loading={loginLoading}
            loadingText="Signing in..."
            primary={primary}
          >
            Sign in
            <ArrowRight size={18} />
          </AuthSubmit>
        </div>
      </form>

      <div className="mt-6 border-t border-stone-100 pt-5">
        <button
          type="button"
          onClick={() => setActivePanel("change")}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-stone-200 px-4 py-3 text-sm font-semibold text-graphite transition hover:border-stone-300 hover:bg-stone-50"
        >
          <KeyRound size={17} style={{ color: primary }} />
          Change password
        </button>
      </div>
    </>
  );

  // ============================================================
  // FORGOT PASSWORD PANEL
  // ============================================================

  const renderForgot = () => (
    <>
      <AuthHeading
        title="Forgot password"
        subtitle="Enter your staff email and we'll send you a 6-digit code."
      />

      <AuthAlert tone={toneOf(forgotMessage)}>{forgotMessage}</AuthAlert>

      <form onSubmit={handleForgotPassword} className="space-y-4">
        <AuthField
          id="forgot-email"
          name="forgot-email"
          label="Email"
          icon={Mail}
          type="email"
          value={forgotEmail}
          onChange={(e) => setForgotEmail(e.target.value)}
          required
          autoComplete="email"
          placeholder="staff@company.com"
          primary={primary}
        />

        <div className="pt-2">
          <AuthSubmit
            loading={forgotLoading}
            loadingText="Sending code..."
            primary={primary}
          >
            Send reset code
          </AuthSubmit>
        </div>

        <button
          type="button"
          onClick={() => setActivePanel("reset")}
          className={linkButton}
        >
          I already have a code
        </button>

        <button
          type="button"
          onClick={() => setActivePanel("login")}
          className={linkButton}
        >
          ← Back to sign in
        </button>
      </form>
    </>
  );

  // ============================================================
  // RESET PASSWORD PANEL
  // ============================================================

  const renderReset = () => (
    <>
      <AuthHeading
        title="Reset password"
        subtitle="Enter the 6-digit code from your email and choose a new password."
      />

      <AuthAlert tone={toneOf(resetMessage)}>{resetMessage}</AuthAlert>

      <form onSubmit={handleResetPassword} className="space-y-4">
        <AuthField
          id="reset-email"
          name="email"
          label="Email"
          icon={Mail}
          type="email"
          value={resetForm.email}
          onChange={handleResetChange}
          required
          primary={primary}
        />

        <AuthField
          id="reset-code"
          name="code"
          label="Verification code"
          icon={Hash}
          value={resetForm.code}
          onChange={handleResetChange}
          required
          maxLength={6}
          inputMode="numeric"
          placeholder="123456"
          primary={primary}
        />

        <AuthField
          id="reset-new-password"
          name="new_password"
          label="New password"
          icon={LockKeyhole}
          type="password"
          value={resetForm.new_password}
          onChange={handleResetChange}
          required
          autoComplete="new-password"
          primary={primary}
        />

        <AuthField
          id="reset-confirm-password"
          name="confirm_password"
          label="Confirm new password"
          icon={LockKeyhole}
          type="password"
          value={resetForm.confirm_password}
          onChange={handleResetChange}
          required
          autoComplete="new-password"
          primary={primary}
        />

        <div className="pt-2">
          <AuthSubmit
            loading={resetLoading}
            loadingText="Resetting..."
            primary={primary}
          >
            Reset password
          </AuthSubmit>
        </div>

        <button
          type="button"
          onClick={() => setActivePanel("login")}
          className={linkButton}
        >
          ← Back to sign in
        </button>
      </form>
    </>
  );

  // ============================================================
  // CHANGE PASSWORD PANEL
  // ============================================================

  const renderChangePassword = () => (
    <>
      <AuthHeading
        title="Change password"
        subtitle="Update the password for your staff account."
      />

      <AuthAlert tone={toneOf(changeMessage)}>{changeMessage}</AuthAlert>

      <form onSubmit={handleChangePassword} className="space-y-4">
        <AuthField
          id="old_password"
          label="Current password"
          icon={LockKeyhole}
          type="password"
          value={changeForm.old_password}
          onChange={handleChangePasswordChange}
          required
          autoComplete="current-password"
          primary={primary}
        />

        <AuthField
          id="change-new-password"
          name="new_password"
          label="New password"
          icon={LockKeyhole}
          type="password"
          value={changeForm.new_password}
          onChange={handleChangePasswordChange}
          required
          autoComplete="new-password"
          primary={primary}
        />

        <AuthField
          id="change-confirm-password"
          name="confirm_password"
          label="Confirm new password"
          icon={LockKeyhole}
          type="password"
          value={changeForm.confirm_password}
          onChange={handleChangePasswordChange}
          required
          autoComplete="new-password"
          primary={primary}
        />

        <div className="pt-2">
          <AuthSubmit
            loading={changeLoading}
            loadingText="Changing password..."
            primary={primary}
          >
            Change password
          </AuthSubmit>
        </div>

        <button
          type="button"
          onClick={() => setActivePanel("login")}
          className={linkButton}
        >
          ← Back to sign in
        </button>
      </form>
    </>
  );

  // ============================================================
  // LOADING / ERROR
  // ============================================================

  if (companyLoading) {
    return (
      <AuthMessage
        loading
        message="Loading staff portal..."
        primary={primary}
        background={theme.background_color}
      />
    );
  }

  if (companyError) {
    return (
      <AuthMessage
        title="Company not found"
        message={companyError}
        actionTo="/"
        actionLabel="Back to TrustFound"
        primary={primary}
        background={theme.background_color}
      />
    );
  }

  // ============================================================
  // PAGE
  // ============================================================

  const companyName = company?.name || "Company";

  return (
    <AuthLayout
      companyName={companyName}
      logoUrl={resolveMediaUrl(company?.logo || company?.logo_url)}
      primary={primary}
      secondary={theme.secondary_color}
      background={theme.background_color}
      backTo={`/company/${encodeURIComponent(slug || "")}`}
      tagline="Staff portal for verifying, matching and returning items. Authorised personnel only."
    >
      <span
        className="mb-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide"
        style={{
          backgroundColor: withAlpha(primary, 0.1),
          color: primary,
        }}
      >
        <ShieldCheck size={14} />
        Staff portal
      </span>

      {activePanel === "login" && renderLogin()}
      {activePanel === "forgot" && renderForgot()}
      {activePanel === "reset" && renderReset()}
      {activePanel === "change" && renderChangePassword()}

      <p className="mt-6 text-center text-xs text-stone-400">
        Authorised personnel only · {companyName}
      </p>
    </AuthLayout>
  );
}

export default StaffLoginPage;
