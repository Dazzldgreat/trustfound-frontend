import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const API = "http://127.0.0.1:8000/api";

const DEFAULT_WEBSITE_SETTINGS = {
  primary_color: "#2563eb",
  secondary_color: "#1d4ed8",
  background_color: "#f8fbfb",
  text_color: "#374151",
  heading_color: "#111827",
  card_color: "#ffffff",
  button_text_color: "#ffffff",
  border_color: "#ffffff",
  border_line_color: "#e5e7eb",
  border_style: "solid",
  border_width: 1,
  border_radius: 16,
  content_width: 448,
  font_family: "Inter",
};

const ALLOWED_BORDER_STYLES = [
  "solid",
  "dashed",
  "dotted",
  "double",
  "none",
];

const ALLOWED_FONTS = [
  "Inter",
  "Arial",
  "Roboto",
  "Poppins",
  "Montserrat",
  "Open Sans",
  "Lato",
  "system-ui",
  "Georgia",
  "Verdana",
];

function isValidColor(value) {
  if (typeof value !== "string") return false;

  return (
    /^#[0-9a-fA-F]{3,8}$/.test(value) ||
    /^rgba?\(\s*[\d.%\s,]+\)$/.test(value) ||
    /^hsla?\(\s*[\d.%\s,deg]+\)$/.test(value)
  );
}

function getValidColor(value, fallback) {
  return isValidColor(value) ? value : fallback;
}

function getValidNumber(value, fallback, min, max) {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  const number = Number(value);

  if (!Number.isFinite(number)) return fallback;

  return Math.min(max, Math.max(min, number));
}

function applyWebsiteTheme(settings = {}) {
  const source =
    settings?.settings ||
    settings?.website_settings ||
    settings?.websiteSettings ||
    settings;

  return {
    primary_color: getValidColor(
      source.primary_color,
      DEFAULT_WEBSITE_SETTINGS.primary_color
    ),
    secondary_color: getValidColor(
      source.secondary_color,
      DEFAULT_WEBSITE_SETTINGS.secondary_color
    ),
    background_color: getValidColor(
      source.background_color,
      DEFAULT_WEBSITE_SETTINGS.background_color
    ),
    text_color: getValidColor(
      source.text_color,
      DEFAULT_WEBSITE_SETTINGS.text_color
    ),
    heading_color: getValidColor(
      source.heading_color,
      DEFAULT_WEBSITE_SETTINGS.heading_color
    ),
    card_color: getValidColor(
      source.card_color,
      DEFAULT_WEBSITE_SETTINGS.card_color
    ),
    button_text_color: getValidColor(
      source.button_text_color,
      DEFAULT_WEBSITE_SETTINGS.button_text_color
    ),
    border_color: getValidColor(
      source.border_color,
      DEFAULT_WEBSITE_SETTINGS.border_color
    ),
    border_line_color: getValidColor(
      source.border_line_color,
      DEFAULT_WEBSITE_SETTINGS.border_line_color
    ),
    border_style: ALLOWED_BORDER_STYLES.includes(
      source.border_style
    )
      ? source.border_style
      : DEFAULT_WEBSITE_SETTINGS.border_style,
    border_width: getValidNumber(
      source.border_width,
      DEFAULT_WEBSITE_SETTINGS.border_width,
      0,
      10
    ),
    border_radius: getValidNumber(
      source.border_radius,
      DEFAULT_WEBSITE_SETTINGS.border_radius,
      0,
      100
    ),
    content_width: getValidNumber(
      source.content_width,
      DEFAULT_WEBSITE_SETTINGS.content_width,
      320,
      2000
    ),
    font_family: ALLOWED_FONTS.includes(source.font_family)
      ? source.font_family
      : DEFAULT_WEBSITE_SETTINGS.font_family,
  };
}

function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { companySlug } = useParams();

  // =========================================================
  // COMPANY
  // =========================================================

  const getStoredObject = (key) => {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch {
      return null;
    }
  };

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

  const companyRoute = (path = "") => {
    const cleanPath = path
      ? path.startsWith("/")
        ? path
        : `/${path}`
      : "";

    if (!activeCompanySlug) {
      return cleanPath || "/";
    }

    return `/company/${encodeURIComponent(
      activeCompanySlug
    )}${cleanPath}`;
  };

  // =========================================================
  // WEBSITE SETTINGS
  // =========================================================

  const [websiteSettings, setWebsiteSettings] = useState(
    DEFAULT_WEBSITE_SETTINGS
  );

  useEffect(() => {
    let cancelled = false;

    const fetchWebsiteSettings = async () => {
      if (!activeCompanySlug) return;

      try {
        const response = await fetch(
          `${API}/company/public/${encodeURIComponent(
            activeCompanySlug
          )}/website/`
        );

        if (!response.ok) return;

        const result = await response.json();

        if (!cancelled) {
          setWebsiteSettings(applyWebsiteTheme(result));
        }
      } catch (error) {
        console.error(
          "WEBSITE SETTINGS ERROR:",
          error
        );
      }
    };

    fetchWebsiteSettings();

    return () => {
      cancelled = true;
    };
  }, [activeCompanySlug]);

  const themeStyle = {
    "--site-primary": websiteSettings.primary_color,
    "--site-secondary": websiteSettings.secondary_color,
    "--site-background": websiteSettings.background_color,
    "--site-text": websiteSettings.text_color,
    "--site-heading": websiteSettings.heading_color,
    "--site-card": websiteSettings.card_color,
    "--site-button-text": websiteSettings.button_text_color,
    "--site-border-fill": websiteSettings.border_color,
    "--site-border-line": websiteSettings.border_line_color,
    "--site-border-style": websiteSettings.border_style,
    "--site-border-width": `${websiteSettings.border_width}px`,
    "--site-radius": `${websiteSettings.border_radius}px`,
    "--site-content-width": `${websiteSettings.content_width}px`,
    "--site-font": `"${websiteSettings.font_family}", sans-serif`,
    backgroundColor: "var(--site-background)",
    color: "var(--site-text)",
    fontFamily: "var(--site-font)",
  };

  // =========================================================
  // FORM STATE
  // =========================================================

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  // =========================================================
  // SUBMIT
  // =========================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);

    try {
      const response = await fetch(
        `${API}/forgot-password/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
          data.message ||
          "Unable to send verification code"
        );
      }

      alert("Verification code sent to your email.");

      navigate(companyRoute("/verify-code"), {
        state: {
          email,
          purpose: "forgot-password",
        },
      });
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // PAGE
  // =========================================================

  return (
    <div
      className="forgot-password-theme min-h-screen flex items-center justify-center px-4 py-8"
      style={themeStyle}
    >
      <style>{`
        .forgot-password-theme {
          background-color: var(--site-background);
          color: var(--site-text);
          font-family: var(--site-font);
        }

        .forgot-password-theme .site-card {
          background-color: var(--site-card);
          border-color: var(--site-border-line);
          border-style: var(--site-border-style);
          border-width: var(--site-border-width);
          border-radius: var(--site-radius);
        }

        .forgot-password-theme .site-heading {
          color: var(--site-heading);
        }

        .forgot-password-theme .site-text {
          color: var(--site-text);
        }

        .forgot-password-theme .site-muted {
          color: var(--site-text);
          opacity: 0.72;
        }

        .forgot-password-theme .site-field {
          background-color: var(--site-border-fill);
          color: var(--site-text);
          border-color: var(--site-border-line);
          border-style: var(--site-border-style);
          border-width: var(--site-border-width);
          border-radius: var(--site-radius);
        }

        .forgot-password-theme .site-field::placeholder {
          color: var(--site-text);
          opacity: 0.6;
        }

        .forgot-password-theme .site-field:focus {
          outline: none;
          border-color: var(--site-primary);
          box-shadow: 0 0 0 2px var(--site-primary);
        }

        .forgot-password-theme .site-button {
          background-color: var(--site-primary);
          color: var(--site-button-text);
          border-radius: var(--site-radius);
        }

        .forgot-password-theme .site-button:hover {
          background-color: var(--site-secondary);
        }

        .forgot-password-theme .site-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>

      <form
        onSubmit={handleSubmit}
        className="site-card shadow-lg w-full p-8"
        style={{
          maxWidth: "var(--site-content-width)",
        }}
      >
        <h1 className="text-3xl font-bold mb-2 site-heading">
          Forgot Password
        </h1>

        <p className="site-muted mb-6">
          Enter your email address and we'll send you a verification code.
        </p>

        <input
          type="email"
          placeholder="Enter your email"
          className="site-field w-full p-4 mb-4"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="site-button w-full py-4 font-bold transition"
        >
          {loading ? "Sending..." : "Send Code"}
        </button>
      </form>
    </div>
  );
}

export default ForgotPasswordPage;
