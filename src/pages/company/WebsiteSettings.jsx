import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Save,
  Eye,
  Globe,
  Palette,
  LayoutTemplate,
  Type,
  CheckCircle,
  AlertCircle,
  Loader2,
  ExternalLink,
  Image as ImageIcon,
  Upload,
  Trash2,
  Square,
  RotateCcw,
} from "lucide-react";

import { API } from "../../config";
import { DEFAULT_WEBSITE_SETTINGS, resolveMediaUrl, upgradeLegacyColor } from "../../theme";

// ============================================================
// TRUSTFOUND DEFAULT SETTINGS
// The Orange & Graphite defaults used by Restore Defaults.
// Defined once in src/theme.js and mirrored by the backend
// model defaults (accounts.models.CompanyWebsiteSettings).
// ============================================================

const DEFAULT_SETTINGS = DEFAULT_WEBSITE_SETTINGS;

// ============================================================
// STORAGE
// ============================================================

function getStoredObject(key) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

// ============================================================
// SETTINGS HELPERS
// ============================================================

function normalizeColor(value, fallback) {
    value = upgradeLegacyColor(value);
  return typeof value === "string" &&
    /^#[0-9a-fA-F]{6}$/.test(value)
    ? value
    : fallback;
}

function normalizeBorderStyle(value) {
  const allowedStyles = [
    "none",
    "solid",
    "dashed",
    "dotted",
    "double",
  ];

  return allowedStyles.includes(value) ? value : "solid";
}

function normalizeSettings(data = {}) {
  const source =
    data && typeof data === "object" ? data : {};

  return {
    ...DEFAULT_SETTINGS,
    ...source,

    primary_color: normalizeColor(
      source.primary_color,
      DEFAULT_SETTINGS.primary_color
    ),

    secondary_color: normalizeColor(
      source.secondary_color,
      DEFAULT_SETTINGS.secondary_color
    ),

    background_color: normalizeColor(
      source.background_color,
      DEFAULT_SETTINGS.background_color
    ),

    border_color: normalizeColor(
      source.border_color,
      DEFAULT_SETTINGS.border_color
    ),

    border_line_color: normalizeColor(
      source.border_line_color,
      DEFAULT_SETTINGS.border_line_color
    ),

    border_style: normalizeBorderStyle(
      source.border_style
    ),

    border_width: Math.min(
      10,
      Math.max(
        0,
        Number(
          source.border_width ??
            DEFAULT_SETTINGS.border_width
        )
      )
    ),

    show_about:
      source.show_about ?? DEFAULT_SETTINGS.show_about,

    show_featured_items:
      source.show_featured_items ??
      DEFAULT_SETTINGS.show_featured_items,

    show_contact:
      source.show_contact ?? DEFAULT_SETTINGS.show_contact,

    is_published:
      source.is_published ??
      DEFAULT_SETTINGS.is_published,

    logo: source.logo ?? null,
  };
}

function getHexRgb(hex) {
  const value = String(hex || "").replace("#", "");

  if (!/^[0-9a-fA-F]{6}$/.test(value)) {
    return null;
  }

  return [
    parseInt(value.slice(0, 2), 16),
    parseInt(value.slice(2, 4), 16),
    parseInt(value.slice(4, 6), 16),
  ].join(" ");
}

const getImageUrl = resolveMediaUrl;

function getResponseError(data, fallback) {
  if (!data || typeof data !== "object") {
    return fallback;
  }

  if (data.detail) return String(data.detail);
  if (data.error) return String(data.error);
  if (data.message && data.success === false) {
    return String(data.message);
  }

  const errors = [];

  Object.entries(data).forEach(([field, value]) => {
    if (["success", "settings", "company"].includes(field)) {
      return;
    }

    if (Array.isArray(value)) {
      errors.push(`${field}: ${value.join(", ")}`);
    } else if (value && typeof value === "object") {
      Object.entries(value).forEach(([nestedField, nestedValue]) => {
        if (Array.isArray(nestedValue)) {
          errors.push(
            `${field}.${nestedField}: ${nestedValue.join(", ")}`
          );
        }
      });
    }
  });

  return errors.length ? errors.join("; ") : fallback;
}

// ============================================================
// APPLY COMPANY THEME
// ============================================================

function applyCompanyTheme(settings, companySlug) {
  if (!settings) return;

  const root = document.documentElement;

  const theme = {
    primary_color: normalizeColor(
      settings.primary_color,
      DEFAULT_SETTINGS.primary_color
    ),

    secondary_color: normalizeColor(
      settings.secondary_color,
      DEFAULT_SETTINGS.secondary_color
    ),

    background_color: normalizeColor(
      settings.background_color,
      DEFAULT_SETTINGS.background_color
    ),

    // Fill colour inside bordered elements
    border_color: normalizeColor(
      settings.border_color,
      DEFAULT_SETTINGS.border_color
    ),

    // Actual visible border line
    border_line_color: normalizeColor(
      settings.border_line_color,
      DEFAULT_SETTINGS.border_line_color
    ),

    border_style: normalizeBorderStyle(
      settings.border_style
    ),

    border_width: Number(
      settings.border_width ?? DEFAULT_SETTINGS.border_width
    ),
  };

  root.style.setProperty(
    "--company-primary",
    theme.primary_color
  );

  root.style.setProperty(
    "--company-secondary",
    theme.secondary_color
  );

  root.style.setProperty(
    "--company-background",
    theme.background_color
  );

  root.style.setProperty(
    "--company-border-fill-color",
    theme.border_color
  );

  root.style.setProperty(
    "--company-border-line-color",
    theme.border_line_color
  );

  // Legacy variable remains mapped to the outline colour.
  root.style.setProperty(
    "--company-border-color",
    theme.border_line_color
  );

  root.style.setProperty(
    "--company-border-style",
    theme.border_style
  );

  root.style.setProperty(
    "--company-border-width",
    `${theme.border_width}px`
  );

  const primaryRgb = getHexRgb(theme.primary_color);
  const secondaryRgb = getHexRgb(theme.secondary_color);

  if (primaryRgb) {
    root.style.setProperty(
      "--company-primary-rgb",
      primaryRgb
    );
  }

  if (secondaryRgb) {
    root.style.setProperty(
      "--company-secondary-rgb",
      secondaryRgb
    );
  }

  if (companySlug) {
    localStorage.setItem(
      `trustfound_theme_${companySlug}`,
      JSON.stringify({
        ...theme,
        logo: settings.logo || null,
      })
    );
  }

  window.dispatchEvent(
    new CustomEvent("company-theme-changed", {
      detail: {
        companySlug,
        ...theme,
        logo: settings.logo || null,
      },
    })
  );
}

// ============================================================
// WEBSITE SETTINGS PAGE
// ============================================================

function WebsiteSettings() {
  const navigate = useNavigate();
  const { companySlug } = useParams();

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

  const access =
    localStorage.getItem("access_token") ||
    localStorage.getItem("access");

  const [settings, setSettings] = useState(() =>
    normalizeSettings(DEFAULT_SETTINGS)
  );

  const [company, setCompany] = useState(
    storedCompany || {}
  );

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);

  // True only when the user explicitly removes the saved logo.
  // False means the current saved logo should remain untouched.
  const [logoRemoved, setLogoRemoved] = useState(false);

  // ============================================================
  // COMPANY ROUTING
  // ============================================================

  const companyRoute = useCallback(
    (path = "") => {
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
    },
    [activeCompanySlug]
  );

  const goToDashboard = () => {
    navigate("/company-dashboard");
  };

  const previewWebsite = () => {
    if (!activeCompanySlug) {
      setError(
        "Your company slug could not be identified."
      );
      return;
    }

    navigate(companyRoute("/website-preview"));
  };

  const goToCompanyLogin = useCallback(() => {
    navigate("/company/login", {
      replace: true,
    });
  }, [navigate]);

  // ============================================================
  // LOAD WEBSITE SETTINGS
  // ============================================================

  useEffect(() => {
    let cancelled = false;

    async function loadSettings() {
      if (!access) {
        goToCompanyLogin();
        return;
      }

      setLoading(true);
      setError("");

      try {
        const response = await fetch(
          `${API}/company/website-settings/`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${access}`,
              Accept: "application/json",
            },
          }
        );

        const data = await response
          .json()
          .catch(() => ({}));

        if (
          response.status === 401 ||
          response.status === 403
        ) {
          goToCompanyLogin();
          return;
        }

        if (!response.ok) {
          throw new Error(
            getResponseError(
              data,
              "Unable to load website settings."
            )
          );
        }

        if (cancelled) return;

        const returnedSettings =
          data.settings ||
          data.website_settings ||
          data;

        const loadedSettings =
          normalizeSettings(returnedSettings);

        setSettings(loadedSettings);
        setLogoFile(null);
        setLogoRemoved(false);

        if (data.company) {
          setCompany(data.company);
        }

        applyCompanyTheme(
          loadedSettings,
          activeCompanySlug
        );

        if (
          loadedSettings.logo &&
          typeof loadedSettings.logo === "string"
        ) {
          setLogoPreview(
            getImageUrl(loadedSettings.logo)
          );
        } else {
          setLogoPreview(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err.message ||
              "Unable to load website settings."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadSettings();

    return () => {
      cancelled = true;
    };
  }, [
    access,
    activeCompanySlug,
    goToCompanyLogin,
  ]);

  // ============================================================
  // UPDATE SETTINGS
  // ============================================================

  const updateField = (field, value) => {
    setSettings((previous) => {
      const updated = normalizeSettings({
        ...previous,
        [field]: value,
      });

      applyCompanyTheme(
        updated,
        activeCompanySlug
      );

      return updated;
    });

    setSuccess("");
    setError("");
  };

  // ============================================================
  // SAVE SETTINGS / RESTORE DEFAULTS / PUBLISH
  //
  // Normal save:
  // - Sends the complete settings payload.
  // - Leaves the existing logo alone if it was not changed.
  //
  // Logo upload:
  // - Uses FormData because the request contains a file.
  //
  // Logo removal:
  // - Sends JSON with logo: null, which is appropriate for
  //   the model's ImageField(null=True, blank=True).
  // ============================================================

  const saveSettings = async (
    publish = false,
    options = {}
  ) => {
    if (!access) {
      goToCompanyLogin();
      return false;
    }

    const targetSettings = normalizeSettings(
      options.settings || settings
    );

    const removeLogo =
      options.removeLogo ?? logoRemoved;

    const fileToUpload = removeLogo ? null : logoFile;

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const fields = [
        "hero_title",
        "hero_subtitle",
        "about_title",
        "about_text",
        "template",
        "primary_color",
        "secondary_color",
        "background_color",
        "border_style",
        "border_color",
        "border_line_color",
        "border_width",
        "show_about",
        "show_featured_items",
        "show_contact",
        "footer_text",
      ];

      const payload = {};

      fields.forEach((field) => {
        payload[field] = targetSettings[field];
      });

      payload.border_width = Number(
        targetSettings.border_width
      );

      payload.show_about = Boolean(
        targetSettings.show_about
      );

      payload.show_featured_items = Boolean(
        targetSettings.show_featured_items
      );

      payload.show_contact = Boolean(
        targetSettings.show_contact
      );

      payload.is_published = publish
        ? true
        : Boolean(targetSettings.is_published);

      let requestBody;
      const headers = {
        Authorization: `Bearer ${access}`,
        Accept: "application/json",
      };

      if (fileToUpload) {
        // Image upload requires multipart/form-data.
        requestBody = new FormData();

        Object.entries(payload).forEach(([key, value]) => {
          requestBody.append(key, String(value ?? ""));
        });

        requestBody.append("logo", fileToUpload);
      } else {
        // JSON avoids submitting an invalid empty file.
        // Omit logo if unchanged, or send null to remove it.
        if (removeLogo) {
          payload.logo = null;
        }

        headers["Content-Type"] = "application/json";
        requestBody = JSON.stringify(payload);
      }

      const response = await fetch(
        `${API}/company/website-settings/`,
        {
          method: "PUT",
          headers,
          body: requestBody,
        }
      );

      const data = await response
        .json()
        .catch(() => ({}));

      if (
        response.status === 401 ||
        response.status === 403
      ) {
        goToCompanyLogin();
        return false;
      }

      if (!response.ok) {
        throw new Error(
          getResponseError(
            data,
            "Unable to save website settings."
          )
        );
      }

      const savedSettings =
        data.settings ||
        data.website_settings ||
        data;

      const updatedSettings = normalizeSettings({
        ...targetSettings,
        ...savedSettings,
        is_published: publish
          ? true
          : savedSettings.is_published ??
            targetSettings.is_published,
      });

      setSettings(updatedSettings);
      setLogoFile(null);
      setLogoRemoved(false);

      if (
        updatedSettings.logo &&
        typeof updatedSettings.logo === "string"
      ) {
        setLogoPreview(
          getImageUrl(updatedSettings.logo)
        );
      } else {
        setLogoPreview(null);
      }

      applyCompanyTheme(
        updatedSettings,
        activeCompanySlug
      );

      setSuccess(
        options.successMessage ||
          (publish
            ? "Your company website has been published!"
            : "Website settings saved successfully.")
      );

      return true;
    } catch (err) {
      setError(
        err.message || "Unable to save settings."
      );

      return false;
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // RESTORE DEFAULTS
  //
  // This now saves to Django immediately. It does not require
  // the user to click Save Settings afterwards.
  // ============================================================

  const restoreDefaults = async () => {
    const confirmed = window.confirm(
      "Restore the TrustFound default website design? This will immediately save the default content, colours, template, border settings and section options to this company's website. The saved logo will also be removed, and the website will be set to unpublished."
    );

    if (!confirmed) return;

    // Snapshot the current state so a failed save can be undone.
    const previous = {
      settings,
      logoFile,
      logoPreview,
      logoRemoved,
    };

    const defaults = normalizeSettings({
      ...DEFAULT_SETTINGS,
      logo: null,
      is_published: false,
    });

    setSettings(defaults);
    setLogoFile(null);
    setLogoPreview(null);
    setLogoRemoved(true);
    setError("");
    setSuccess("");

    // Update the local theme (sidebar, buttons) immediately.
    applyCompanyTheme(
      defaults,
      activeCompanySlug
    );

    // Persist the defaults and remove the saved logo.
    // The save uses the defaults object directly rather than
    // relying on React state to update before the request.
    const saved = await saveSettings(false, {
      settings: defaults,
      removeLogo: true,
      successMessage:
        "TrustFound default settings (Orange & Graphite) have been restored and saved.",
    });

    if (saved) {
      if (previous.logoPreview?.startsWith("blob:")) {
        URL.revokeObjectURL(previous.logoPreview);
      }
      return;
    }

    // Save failed: put everything back the way it was so the
    // screen never shows defaults that were not actually saved.
    setSettings(previous.settings);
    setLogoFile(previous.logoFile);
    setLogoPreview(previous.logoPreview);
    setLogoRemoved(previous.logoRemoved);
    applyCompanyTheme(previous.settings, activeCompanySlug);
  };

  // ============================================================
  // LOGO UPLOAD
  // ============================================================

  const handleLogoChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const allowedTypes = [
      "image/png",
      "image/jpeg",
      "image/webp",
      "image/svg+xml",
    ];

    if (!allowedTypes.includes(file.type)) {
      setError(
        "Choose a PNG, JPG, WEBP, or SVG image."
      );

      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError(
        "The logo must be smaller than 5MB."
      );

      event.target.value = "";
      return;
    }

    if (logoPreview?.startsWith("blob:")) {
      URL.revokeObjectURL(logoPreview);
    }

    const previewUrl = URL.createObjectURL(file);

    setLogoFile(file);
    setLogoPreview(previewUrl);
    setLogoRemoved(false);

    updateField("logo", file);

    setSuccess("");
    setError("");
  };

  const removeLogo = () => {
    if (logoPreview?.startsWith("blob:")) {
      URL.revokeObjectURL(logoPreview);
    }

    setLogoFile(null);
    setLogoPreview(null);
    setLogoRemoved(true);

    updateField("logo", null);
  };

  // ============================================================
  // BORDER STYLES
  //
  // border_color      = inside/fill colour
  // border_line_color = actual outline colour
  // ============================================================

  const borderPreviewStyle = {
    backgroundColor:
      settings.border_color ||
      DEFAULT_SETTINGS.border_color,

    borderStyle: normalizeBorderStyle(
      settings.border_style
    ),

    borderColor:
      settings.border_line_color ||
      DEFAULT_SETTINGS.border_line_color,

    borderWidth: `${settings.border_width ?? 1}px`,
  };

  const cardStyle = {
    borderRadius: "1rem",
    ...borderPreviewStyle,
  };

  const inputStyle = {
    ...borderPreviewStyle,
    borderRadius: "0.75rem",
    color: "#292524",
  };

  const lineOnlyStyle = {
    borderStyle: normalizeBorderStyle(
      settings.border_style
    ),

    borderColor:
      settings.border_line_color ||
      DEFAULT_SETTINGS.border_line_color,

    borderWidth: `${settings.border_width ?? 1}px`,
  };

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2
          className="animate-spin"
          size={36}
          style={{
            color: "var(--company-primary, #EA580C)",
          }}
        />
      </div>
    );
  }

  // ============================================================
  // PAGE
  // ============================================================

  return (
    <div
      className="min-h-screen text-slate-800"
      style={{
        backgroundColor:
          settings.background_color || "#FFF7ED",
      }}
    >
      {/* HEADER */}
      <header
        className="sticky top-0 z-20 bg-white"
        style={{
          borderBottomStyle: normalizeBorderStyle(
            settings.border_style
          ),
          borderBottomColor:
            settings.border_line_color ||
            DEFAULT_SETTINGS.border_line_color,
          borderBottomWidth: `${
            settings.border_width ?? 1
          }px`,
        }}
      >
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={goToDashboard}
              className="rounded-xl p-2 transition hover:opacity-80"
              style={lineOnlyStyle}
              aria-label="Back to company dashboard"
              title="Back to company dashboard"
            >
              <ArrowLeft size={20} />
            </button>

            {logoPreview ? (
              <img
                src={logoPreview}
                alt={`${company.name || "Company"} logo`}
                className="h-11 w-11 rounded-xl object-contain"
                style={lineOnlyStyle}
              />
            ) : (
              <div
                className="flex h-11 w-11 items-center justify-center rounded-xl"
                style={{
                  backgroundColor:
                    "rgb(var(--company-primary-rgb, 234 88 12) / 10%)",
                  ...lineOnlyStyle,
                }}
              >
                <Globe
                  size={22}
                  style={{
                    color: "var(--company-primary, #EA580C)",
                  }}
                />
              </div>
            )}

            <div>
              <h1 className="text-xl font-bold sm:text-2xl">
                Website Settings
              </h1>

              <p className="text-sm text-slate-500">
                {company.name || "TrustFound"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={previewWebsite}
              className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold hover:opacity-80"
              style={lineOnlyStyle}
            >
              <Eye size={17} />
              Preview
            </button>

            <button
              type="button"
              onClick={restoreDefaults}
              disabled={saving}
              className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-60"
              style={{
                backgroundColor:
                  settings.border_color ||
                  DEFAULT_SETTINGS.border_color,
                borderStyle: normalizeBorderStyle(
                  settings.border_style
                ),
                borderWidth: `${
                  settings.border_width ?? 1
                }px`,
                borderColor:
                  settings.border_line_color ||
                  DEFAULT_SETTINGS.border_line_color,
                color:
                  settings.secondary_color || "#292524",
              }}
            >
              {saving ? (
                <Loader2
                  size={17}
                  className="animate-spin"
                />
              ) : (
                <RotateCcw size={17} />
              )}
              Restore Defaults
            </button>

            <button
              type="button"
              disabled={saving}
              onClick={() => saveSettings(false)}
              className="company-primary-button flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold disabled:opacity-60"
            >
              {saving ? (
                <Loader2
                  className="animate-spin"
                  size={17}
                />
              ) : (
                <Save size={17} />
              )}
              Save Settings
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_380px] lg:px-8">
        <section className="space-y-6">
          {/* MESSAGES */}
          {error && (
            <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <AlertCircle size={20} className="shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {success && (
            <div className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
              <CheckCircle size={20} className="shrink-0" />
              <p>{success}</p>
            </div>
          )}

          {/* HOMEPAGE CONTENT */}
          <div className="p-6 shadow-sm" style={cardStyle}>
            <div className="mb-6 flex items-center gap-3">
              <div
                className="rounded-xl p-3"
                style={{
                  backgroundColor:
                    "rgb(var(--company-primary-rgb, 234 88 12) / 10%)",
                }}
              >
                <Type
                  size={21}
                  style={{
                    color: "var(--company-primary, #EA580C)",
                  }}
                />
              </div>

              <div>
                <h2 className="font-bold">
                  Homepage Content
                </h2>
                <p className="text-sm text-slate-500">
                  Customize the words visitors see.
                </p>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <label
                  htmlFor="hero_title"
                  className="mb-2 block text-sm font-semibold"
                >
                  Main heading
                </label>
                <input
                  id="hero_title"
                  value={settings.hero_title || ""}
                  onChange={(e) =>
                    updateField("hero_title", e.target.value)
                  }
                  className="w-full px-4 py-3 outline-none"
                  style={inputStyle}
                  placeholder="Welcome to our lost and found platform"
                />
              </div>

              <div>
                <label
                  htmlFor="hero_subtitle"
                  className="mb-2 block text-sm font-semibold"
                >
                  Introduction
                </label>
                <textarea
                  id="hero_subtitle"
                  rows={4}
                  value={settings.hero_subtitle || ""}
                  onChange={(e) =>
                    updateField("hero_subtitle", e.target.value)
                  }
                  className="w-full px-4 py-3 outline-none"
                  style={inputStyle}
                />
              </div>

              <div>
                <label
                  htmlFor="about_title"
                  className="mb-2 block text-sm font-semibold"
                >
                  About section heading
                </label>
                <input
                  id="about_title"
                  value={settings.about_title || ""}
                  onChange={(e) =>
                    updateField("about_title", e.target.value)
                  }
                  className="w-full px-4 py-3 outline-none"
                  style={inputStyle}
                />
              </div>

              <div>
                <label
                  htmlFor="about_text"
                  className="mb-2 block text-sm font-semibold"
                >
                  About your company
                </label>
                <textarea
                  id="about_text"
                  rows={5}
                  value={settings.about_text || ""}
                  onChange={(e) =>
                    updateField("about_text", e.target.value)
                  }
                  className="w-full px-4 py-3 outline-none"
                  style={inputStyle}
                />
              </div>

              <div>
                <label
                  htmlFor="footer_text"
                  className="mb-2 block text-sm font-semibold"
                >
                  Footer text
                </label>
                <input
                  id="footer_text"
                  value={settings.footer_text || ""}
                  onChange={(e) =>
                    updateField("footer_text", e.target.value)
                  }
                  className="w-full px-4 py-3 outline-none"
                  style={inputStyle}
                />
              </div>
            </div>
          </div>

          {/* BRAND COLOURS */}
          <div className="p-6 shadow-sm" style={cardStyle}>
            <div className="mb-6 flex items-center gap-3">
              <Palette
                size={23}
                style={{
                  color: "var(--company-primary, #EA580C)",
                }}
              />
              <div>
                <h2 className="font-bold">Brand Colours</h2>
                <p className="text-sm text-slate-500">
                  Choose your company's main website colours.
                </p>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              {[
                {
                  field: "primary_color",
                  label: "Primary colour",
                  fallback: "#EA580C",
                },
                {
                  field: "secondary_color",
                  label: "Secondary colour",
                  fallback: "#292524",
                },
              ].map((item) => (
                <div key={item.field}>
                  <label
                    htmlFor={item.field}
                    className="mb-2 block text-sm font-semibold"
                  >
                    {item.label}
                  </label>

                  <div
                    className="flex items-center gap-3 rounded-xl p-3"
                    style={lineOnlyStyle}
                  >
                    <input
                      id={item.field}
                      type="color"
                      value={
                        settings[item.field] || item.fallback
                      }
                      onChange={(e) =>
                        updateField(item.field, e.target.value)
                      }
                      className="h-10 w-12 cursor-pointer"
                    />
                    <span className="text-sm font-medium uppercase">
                      {settings[item.field] || item.fallback}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* WEBSITE APPEARANCE */}
          <div className="p-6 shadow-sm" style={cardStyle}>
            <div className="mb-6 flex items-center gap-3">
              <Palette
                size={23}
                style={{
                  color: "var(--company-primary, #EA580C)",
                }}
              />
              <div>
                <h2 className="font-bold">
                  Website Appearance
                </h2>
                <p className="text-sm text-slate-500">
                  Customize the background, borders and logo.
                </p>
              </div>
            </div>

            <div className="space-y-7">
              {/* WEBSITE BACKGROUND */}
              <div>
                <label
                  htmlFor="background_color"
                  className="mb-2 block text-sm font-semibold"
                >
                  Website background colour
                </label>
                <div
                  className="flex items-center gap-3 rounded-xl p-3"
                  style={lineOnlyStyle}
                >
                  <input
                    id="background_color"
                    type="color"
                    value={
                      settings.background_color || "#FFF7ED"
                    }
                    onChange={(e) =>
                      updateField(
                        "background_color",
                        e.target.value
                      )
                    }
                    className="h-10 w-12 cursor-pointer"
                  />
                  <span className="text-sm font-medium uppercase">
                    {settings.background_color || "#FFF7ED"}
                  </span>
                </div>
              </div>

              {/* BORDER STYLE */}
              <div>
                <label
                  htmlFor="border_style"
                  className="mb-2 block text-sm font-semibold"
                >
                  Website border style
                </label>
                <select
                  id="border_style"
                  value={settings.border_style || "solid"}
                  onChange={(e) =>
                    updateField("border_style", e.target.value)
                  }
                  className="w-full px-4 py-3 outline-none"
                  style={inputStyle}
                >
                  <option value="none">No border</option>
                  <option value="solid">Solid</option>
                  <option value="dashed">Dashed</option>
                  <option value="dotted">Dotted</option>
                  <option value="double">Double</option>
                </select>
              </div>

              {/* BORDER FILL COLOUR */}
              <div>
                <label
                  htmlFor="border_color"
                  className="mb-2 block text-sm font-semibold"
                >
                  Border fill colour
                </label>
                <div
                  className="flex items-center gap-3 rounded-xl p-3"
                  style={{
                    backgroundColor:
                      settings.border_color ||
                      DEFAULT_SETTINGS.border_color,
                    ...lineOnlyStyle,
                  }}
                >
                  <input
                    id="border_color"
                    type="color"
                    value={
                      settings.border_color || "#ffffff"
                    }
                    onChange={(e) =>
                      updateField("border_color", e.target.value)
                    }
                    className="h-10 w-12 cursor-pointer"
                  />
                  <span className="text-sm font-medium uppercase">
                    {settings.border_color || "#ffffff"}
                  </span>
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  Controls the inside/background colour of bordered
                  cards, inputs and preview elements.
                </p>
              </div>

              {/* BORDER LINE COLOUR */}
              <div>
                <label
                  htmlFor="border_line_color"
                  className="mb-2 block text-sm font-semibold"
                >
                  Border line colour
                </label>
                <div
                  className="flex items-center gap-3 rounded-xl p-3"
                  style={{
                    backgroundColor:
                      settings.border_color ||
                      DEFAULT_SETTINGS.border_color,
                    ...lineOnlyStyle,
                  }}
                >
                  <input
                    id="border_line_color"
                    type="color"
                    value={
                      settings.border_line_color || "#E9E1D8"
                    }
                    onChange={(e) =>
                      updateField(
                        "border_line_color",
                        e.target.value
                      )
                    }
                    className="h-10 w-12 cursor-pointer"
                  />
                  <span className="text-sm font-medium uppercase">
                    {settings.border_line_color || "#E9E1D8"}
                  </span>
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  Controls the visible outline around cards, inputs
                  and sections.
                </p>
              </div>

              {/* BORDER WIDTH */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label
                    htmlFor="border_width"
                    className="block text-sm font-semibold"
                  >
                    Border thickness
                  </label>
                  <span
                    className="rounded-lg px-3 py-1 text-sm font-bold"
                    style={{
                      backgroundColor:
                        "rgb(var(--company-primary-rgb, 234 88 12) / 10%)",
                      color: "var(--company-primary, #EA580C)",
                    }}
                  >
                    {settings.border_width ?? 1}px
                  </span>
                </div>
                <input
                  id="border_width"
                  type="range"
                  min="0"
                  max="10"
                  step="1"
                  value={settings.border_width ?? 1}
                  onChange={(e) =>
                    updateField(
                      "border_width",
                      Number(e.target.value)
                    )
                  }
                  className="w-full"
                  style={{
                    accentColor: "var(--company-primary, #EA580C)",
                  }}
                />
                <div className="mt-1 flex justify-between text-xs text-slate-400">
                  <span>0px</span>
                  <span>5px</span>
                  <span>10px</span>
                </div>
              </div>

              {/* LIVE BORDER PREVIEW */}
              <div>
                <p className="mb-2 text-sm font-semibold">
                  Border preview
                </p>
                <div
                  className="flex min-h-24 items-center justify-center rounded-xl p-4 text-center text-sm font-semibold text-slate-700"
                  style={borderPreviewStyle}
                >
                  Your website border will look like this
                </div>
              </div>

              {/* WEBSITE LOGO */}
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <ImageIcon
                    size={18}
                    style={{
                      color: "var(--company-primary, #EA580C)",
                    }}
                  />
                  <label
                    htmlFor="website_logo"
                    className="text-sm font-semibold"
                  >
                    Website logo
                  </label>
                </div>

                <div
                  className="rounded-2xl p-5"
                  style={{
                    backgroundColor:
                      settings.border_color ||
                      DEFAULT_SETTINGS.border_color,
                    borderStyle: normalizeBorderStyle(
                      settings.border_style
                    ),
                    borderColor:
                      settings.border_line_color ||
                      DEFAULT_SETTINGS.border_line_color,
                    borderWidth: `${
                      settings.border_width ?? 1
                    }px`,
                  }}
                >
                  {logoPreview && (
                    <div className="mb-4 flex flex-col items-center gap-3">
                      <img
                        src={logoPreview}
                        alt="Company logo preview"
                        className="h-24 w-24 rounded-xl object-contain p-2"
                        style={borderPreviewStyle}
                      />
                      <button
                        type="button"
                        onClick={removeLogo}
                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                      >
                        <Trash2 size={16} />
                        Remove logo
                      </button>
                    </div>
                  )}

                  <label
                    htmlFor="website_logo"
                    className="flex cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold"
                    style={{
                      backgroundColor:
                        "rgb(var(--company-primary-rgb, 234 88 12) / 10%)",
                      color: "var(--company-primary, #EA580C)",
                    }}
                  >
                    <Upload size={18} />
                    {logoPreview ? "Change logo" : "Upload logo"}
                    <input
                      id="website_logo"
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/svg+xml"
                      onChange={handleLogoChange}
                      className="hidden"
                    />
                  </label>

                  <p className="mt-3 text-center text-xs leading-5 text-slate-500">
                    PNG, JPG, WEBP or SVG. Maximum size: 5MB.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* WEBSITE TEMPLATE */}
          <div className="p-6 shadow-sm" style={cardStyle}>
            <div className="mb-6 flex items-center gap-3">
              <LayoutTemplate
                size={23}
                style={{
                  color: "var(--company-primary, #EA580C)",
                }}
              />
              <div>
                <h2 className="font-bold">Website Template</h2>
                <p className="text-sm text-slate-500">
                  Choose your preferred layout.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {[
                {
                  value: "modern",
                  title: "Modern",
                  description:
                    "Bold colours and spacious sections.",
                },
                {
                  value: "professional",
                  title: "Professional",
                  description:
                    "Clean and business-focused.",
                },
                {
                  value: "minimal",
                  title: "Minimal",
                  description:
                    "Simple and distraction-free.",
                },
              ].map((template) => {
                const selected =
                  settings.template === template.value;

                return (
                  <button
                    type="button"
                    key={template.value}
                    onClick={() =>
                      updateField("template", template.value)
                    }
                    className="rounded-xl p-4 text-left transition"
                    style={{
                      borderStyle: normalizeBorderStyle(
                        settings.border_style
                      ),
                      borderWidth: `${
                        settings.border_width ?? 1
                      }px`,
                      borderColor: selected
                        ? settings.primary_color || "#EA580C"
                        : settings.border_line_color || "#E9E1D8",
                      backgroundColor: selected
                        ? "rgb(var(--company-primary-rgb, 234 88 12) / 8%)"
                        : settings.border_color || "#ffffff",
                    }}
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <span className="font-bold">
                        {template.title}
                      </span>
                      {selected && (
                        <CheckCircle
                          size={19}
                          style={{
                            color:
                              "var(--company-primary, #EA580C)",
                          }}
                        />
                      )}
                    </div>
                    <p className="text-sm text-slate-500">
                      {template.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* HOMEPAGE SECTIONS */}
          <div className="p-6 shadow-sm" style={cardStyle}>
            <h2 className="mb-2 font-bold">Homepage Sections</h2>
            <p className="mb-5 text-sm text-slate-500">
              Choose which sections appear on your public website.
            </p>

            {[
              {
                field: "show_about",
                title: "About section",
                description:
                  "Show information about your company.",
              },
              {
                field: "show_featured_items",
                title: "Lost and found items",
                description:
                  "Show the featured items section.",
              },
              {
                field: "show_contact",
                title: "Contact section",
                description:
                  "Show your company's contact information.",
              },
            ].map((section) => (
              <label
                key={section.field}
                className="flex cursor-pointer items-center justify-between gap-4 py-4"
                style={{
                  borderBottomStyle: normalizeBorderStyle(
                    settings.border_style
                  ),
                  borderBottomColor:
                    settings.border_line_color || "#E9E1D8",
                  borderBottomWidth: `${
                    settings.border_width ?? 1
                  }px`,
                }}
              >
                <div>
                  <p className="font-semibold">
                    {section.title}
                  </p>
                  <p className="text-sm text-slate-500">
                    {section.description}
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={Boolean(settings[section.field])}
                  onChange={(e) =>
                    updateField(
                      section.field,
                      e.target.checked
                    )
                  }
                  className="h-5 w-5 cursor-pointer"
                  style={{
                    accentColor: "var(--company-primary, #EA580C)",
                  }}
                />
              </label>
            ))}
          </div>
        </section>

        {/* RIGHT SIDEBAR */}
        <aside className="space-y-6">
          {/* PUBLISHING */}
          <div className="p-6 shadow-sm" style={cardStyle}>
            <div className="mb-4 flex items-center gap-3">
              <Globe
                size={22}
                style={{
                  color: "var(--company-primary, #EA580C)",
                }}
              />
              <h2 className="font-bold">Publishing</h2>
            </div>

            <div
              className="mb-5 rounded-xl p-4"
              style={{
                backgroundColor:
                  settings.border_color ||
                  DEFAULT_SETTINGS.border_color,
                ...lineOnlyStyle,
              }}
            >
              <div className="mb-2 flex items-center gap-2">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    settings.is_published
                      ? "bg-green-500"
                      : "bg-amber-500"
                  }`}
                />
                <span className="text-sm font-semibold">
                  {settings.is_published
                    ? "Website published"
                    : "Website not published"}
                </span>
              </div>

              <p className="text-sm text-slate-500">
                {settings.is_published
                  ? "Your website is marked as published."
                  : "Save your content and publish when you are ready."}
              </p>
            </div>

            <button
              type="button"
              onClick={previewWebsite}
              className="mb-3 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 font-semibold transition hover:opacity-80"
              style={lineOnlyStyle}
            >
              <Eye size={18} />
              Preview website
            </button>

            <button
              type="button"
              disabled={saving}
              onClick={() => saveSettings(true)}
              className="company-primary-button flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 font-semibold disabled:opacity-60"
            >
              {saving ? (
                <Loader2
                  size={18}
                  className="animate-spin"
                />
              ) : (
                <ExternalLink size={18} />
              )}
              Publish Website
            </button>

            <p className="mt-3 text-xs leading-5 text-slate-500">
              Publishing makes your saved homepage available
              through the public company website endpoint.
            </p>
          </div>

          {/* LIVE PREVIEW */}
          <div
            className="overflow-hidden shadow-sm"
            style={cardStyle}
          >
            <div
              className="flex items-center gap-3 px-5 py-4"
              style={{
                backgroundColor:
                  settings.border_color ||
                  DEFAULT_SETTINGS.border_color,
                borderBottomStyle: normalizeBorderStyle(
                  settings.border_style
                ),
                borderBottomColor:
                  settings.border_line_color || "#E9E1D8",
                borderBottomWidth: `${
                  settings.border_width ?? 1
                }px`,
              }}
            >
              {logoPreview ? (
                <img
                  src={logoPreview}
                  alt="Company logo"
                  className="h-10 w-10 rounded-lg object-contain"
                  style={lineOnlyStyle}
                />
              ) : (
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-lg"
                  style={{
                    backgroundColor:
                      settings.primary_color || "#EA580C",
                  }}
                >
                  <Square size={19} className="text-white" />
                </div>
              )}

              <div>
                <p className="text-sm font-bold">
                  {company.name || "Your Company"}
                </p>
                <p className="text-xs text-slate-500">
                  Website Preview
                </p>
              </div>
            </div>

            {/* HERO PREVIEW */}
            <div
              className="p-6 text-white"
              style={{
                backgroundColor:
                  settings.primary_color || "#EA580C",
              }}
            >
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider opacity-80">
                Homepage Preview
              </p>
              <h3 className="text-2xl font-bold">
                {settings.hero_title || "Your homepage heading"}
              </h3>
              <p className="mt-3 text-sm leading-6 opacity-90">
                {settings.hero_subtitle ||
                  "Your homepage introduction"}
              </p>
              <span className="mt-5 inline-block rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-900">
                Explore Items
              </span>
            </div>

            {/* PREVIEW SECTIONS */}
            <div
              className="space-y-4 p-5"
              style={{
                backgroundColor:
                  settings.background_color || "#FFF7ED",
              }}
            >
              {settings.show_about && (
                <div
                  className="rounded-xl p-4"
                  style={borderPreviewStyle}
                >
                  <h3
                    className="font-bold"
                    style={{
                      color:
                        settings.secondary_color || "#292524",
                    }}
                  >
                    {settings.about_title ||
                      "About your company"}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {settings.about_text ||
                      "Your company description will appear here."}
                  </p>
                </div>
              )}

              {settings.show_featured_items && (
                <div
                  className="rounded-xl p-4"
                  style={borderPreviewStyle}
                >
                  <p
                    className="text-sm font-bold"
                    style={{
                      color: settings.primary_color || "#EA580C",
                    }}
                  >
                    Lost &amp; Found Items
                  </p>
                  <p className="mt-1 text-xs text-slate-600">
                    Featured items will appear here.
                  </p>
                </div>
              )}

              {settings.show_contact && (
                <div
                  className="rounded-xl p-4"
                  style={borderPreviewStyle}
                >
                  <p className="text-sm font-bold">Contact</p>
                  <p className="mt-1 text-xs text-slate-600">
                    Visitors will be able to contact your company
                    here.
                  </p>
                </div>
              )}

              {/* SETTINGS SUMMARY */}
              <div
                className="rounded-xl p-3 text-xs text-slate-700"
                style={borderPreviewStyle}
              >
                <div className="flex items-center justify-between gap-3">
                  <span>Template</span>
                  <strong>{settings.template}</strong>
                </div>

                <div className="mt-2 flex items-center justify-between gap-3">
                  <span>Border</span>
                  <strong>
                    {settings.border_style}{" "}
                    {settings.border_width ?? 1}px
                  </strong>
                </div>

                <div className="mt-2 flex items-center justify-between gap-3">
                  <span>Border fill colour</span>
                  <strong>
                    {settings.border_color || "#ffffff"}
                  </strong>
                </div>

                <div className="mt-2 flex items-center justify-between gap-3">
                  <span>Border line colour</span>
                  <strong>
                    {settings.border_line_color || "#E9E1D8"}
                  </strong>
                </div>
              </div>

              {/* FOOTER PREVIEW */}
              <div className="pt-2 text-center">
                <p className="text-xs text-slate-500">
                  {settings.footer_text ||
                    "Helping people find what matters."}
                </p>
              </div>
            </div>
          </div>

          {/* RETURN TO DASHBOARD */}
          <button
            type="button"
            onClick={goToDashboard}
            className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 font-semibold transition hover:opacity-80"
            style={lineOnlyStyle}
          >
            <ArrowLeft size={18} />
            Back to Company Dashboard
          </button>
        </aside>
      </main>
    </div>
  );
}

export default WebsiteSettings;