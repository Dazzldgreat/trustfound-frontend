
import { useEffect, useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  Loader2,
  LockKeyhole,
  Mail,
  MapPin,
  Package,
  ShieldCheck,
} from "lucide-react";

const API = "https://trustfound-backend.onrender.com/api";
const SERVER_ORIGIN = "https://trustfound-backend.onrender.com";

const DEFAULT_SETTINGS = {
  hero_title: "Welcome to our Lost & Found",
  hero_subtitle:
    "Helping our community reconnect with the things that matter.",
  about_title: "About our service",
  about_text:
    "We help people report lost belongings, register found items, and reconnect owners with their property.",
  template: "modern",
  primary_color: "#2563eb",
  secondary_color: "#0f172a",
  background_color: "#f8fafc",
  border_color: "#ffffff",
  border_line_color: "#e2e8f0",
  border_style: "solid",
  border_width: 1,
  logo: "",
  logo_url: "",
  footer_text: "Helping people find what matters.",
  is_published: false,
};

function getStoredObject(key) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

function normalizeColor(value, fallback) {
  return typeof value === "string" &&
    /^#[0-9a-fA-F]{6}$/.test(value)
    ? value
    : fallback;
}

function normalizeSettings(payload) {
  const raw =
    payload?.settings ||
    payload?.website_settings ||
    payload?.data?.settings ||
    payload?.data?.website_settings ||
    payload?.data ||
    payload ||
    {};

  const allowedBorderStyles = [
    "none",
    "solid",
    "dashed",
    "dotted",
    "double",
  ];

  const parsedWidth = Number(
    raw.border_width ?? DEFAULT_SETTINGS.border_width
  );

  return {
    ...DEFAULT_SETTINGS,
    ...raw,

    primary_color: normalizeColor(
      raw.primary_color,
      DEFAULT_SETTINGS.primary_color
    ),

    secondary_color: normalizeColor(
      raw.secondary_color,
      DEFAULT_SETTINGS.secondary_color
    ),

    background_color: normalizeColor(
      raw.background_color,
      DEFAULT_SETTINGS.background_color
    ),

    border_color: normalizeColor(
      raw.border_color,
      DEFAULT_SETTINGS.border_color
    ),

    border_line_color: normalizeColor(
      raw.border_line_color,
      DEFAULT_SETTINGS.border_line_color
    ),

    border_style: allowedBorderStyles.includes(
      raw.border_style
    )
      ? raw.border_style
      : DEFAULT_SETTINGS.border_style,

    border_width: Number.isFinite(parsedWidth)
      ? Math.min(10, Math.max(0, parsedWidth))
      : DEFAULT_SETTINGS.border_width,

    template: [
      "modern",
      "professional",
      "minimal",
    ].includes(raw.template)
      ? raw.template
      : DEFAULT_SETTINGS.template,
  };
}

function getImageUrl(value) {
  if (!value || typeof value !== "string") {
    return "";
  }

  if (
    /^(https?:)?\/\//i.test(value) ||
    value.startsWith("data:")
  ) {
    return value;
  }

  return `${SERVER_ORIGIN}${
    value.startsWith("/") ? "" : "/"
  }${value}`;
}

async function readResponse(response) {
  const contentType =
    response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  const responseText = await response.text();

  return {
    error:
      responseText ||
      `Request failed with status ${response.status}`,
  };
}

function getErrorMessage(data, fallback) {
  return (
    data?.error ||
    data?.message ||
    data?.detail ||
    data?.data?.error ||
    fallback
  );
}

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { companySlug: routeCompanySlug, slug } = useParams();

  const searchParams = new URLSearchParams(location.search);

  const storedCompany = getStoredObject("company");
  const storedUser = getStoredObject("user");

  const companySlug =
    routeCompanySlug ||
    slug ||
    searchParams.get("company") ||
    localStorage.getItem("companySlug") ||
    localStorage.getItem("company_slug") ||
    storedCompany?.slug ||
    storedUser?.company_slug ||
    storedUser?.companySlug ||
    storedUser?.organization_slug ||
    storedUser?.organizationSlug ||
    "";

  const [company, setCompany] = useState(storedCompany || null);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  const [companyLoading, setCompanyLoading] = useState(true);
  const [companyError, setCompanyError] = useState("");
  const [websiteUnpublished, setWebsiteUnpublished] =
    useState(false);

  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  // Keep navigation within the selected company's pages.
  const companyRoute = (path = "") => {
    const cleanPath = path
      ? path.startsWith("/")
        ? path
        : `/${path}`
      : "";

    if (!companySlug) {
      return cleanPath || "/";
    }

    return `/company/${encodeURIComponent(
      companySlug
    )}${cleanPath}`;
  };

  // Global signup route, retaining the company slug.
  const signupPath = companySlug
    ? `/signup-page?company=${encodeURIComponent(
        companySlug
      )}`
    : "/signup-page";

  const forgotPasswordPath = companySlug
    ? `/forgot-password?company=${encodeURIComponent(
        companySlug
      )}`
    : "/forgot-password";

  const publicCompanyPath = companyRoute("");

  // Company-aware staff login route.
  const staffLoginPath = companyRoute("/staff-login");

  // Load company profile and published website settings.
  useEffect(() => {
    let cancelled = false;

    async function loadCompanyAndSettings() {
      setCompanyLoading(true);
      setCompanyError("");
      setWebsiteUnpublished(false);
      setSettings(DEFAULT_SETTINGS);

      if (!companySlug) {
        setCompanyError(
          "No company was selected. Open the login page from your company's Lost & Found website."
        );
        setCompanyLoading(false);
        return;
      }

      const encodedSlug = encodeURIComponent(companySlug);

      try {
        const companyResponse = await fetch(
          `${API}/company/public/${encodedSlug}/`
        );

        const companyData = await readResponse(
          companyResponse
        );

        if (!companyResponse.ok) {
          throw new Error(
            getErrorMessage(
              companyData,
              "Company platform not found."
            )
          );
        }

        const loadedCompany =
          companyData?.company ||
          companyData?.data?.company ||
          companyData?.data ||
          companyData;

        if (
          !loadedCompany ||
          (!loadedCompany.name && !loadedCompany.slug)
        ) {
          throw new Error(
            "The company information could not be loaded."
          );
        }

        if (cancelled) return;

        setCompany(loadedCompany);

        const embeddedSettings =
          companyData?.settings ||
          companyData?.website_settings ||
          companyData?.data?.settings ||
          companyData?.data?.website_settings;

        if (embeddedSettings) {
          setSettings(normalizeSettings(embeddedSettings));
        }

        const settingsResponse = await fetch(
          `${API}/company/public/${encodedSlug}/website/`
        );

        const settingsData = await readResponse(
          settingsResponse
        );

        if (cancelled) return;

        if (!settingsResponse.ok) {
          const errorMessage = getErrorMessage(
            settingsData,
            "The company website settings could not be loaded."
          );

          if (settingsResponse.status === 404) {
            setWebsiteUnpublished(true);

            if (!embeddedSettings) {
              setCompanyError("");
            }

            console.warn(
              "Company website settings are not published:",
              errorMessage
            );

            return;
          }

          throw new Error(errorMessage);
        }

        const loadedSettings = normalizeSettings(settingsData);

        setSettings(loadedSettings);

        // Apply saved website theme variables.
        const root = document.documentElement;

        root.style.setProperty(
          "--company-primary",
          loadedSettings.primary_color
        );

        root.style.setProperty(
          "--company-secondary",
          loadedSettings.secondary_color
        );

        root.style.setProperty(
          "--company-background",
          loadedSettings.background_color
        );

        root.style.setProperty(
          "--company-border-color",
          loadedSettings.border_color
        );

        root.style.setProperty(
          "--company-border-line-color",
          loadedSettings.border_line_color
        );

        root.style.setProperty(
          "--company-border-style",
          loadedSettings.border_style
        );

        root.style.setProperty(
          "--company-border-width",
          `${loadedSettings.border_width}px`
        );
      } catch (error) {
        if (!cancelled) {
          setCompanyError(
            error instanceof Error
              ? error.message
              : "Unable to load company information."
          );
        }
      } finally {
        if (!cancelled) {
          setCompanyLoading(false);
        }
      }
    }

    loadCompanyAndSettings();

    return () => {
      cancelled = true;
    };
  }, [companySlug]);

  // Update form values.
  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    if (formError) {
      setFormError("");
    }
  };

  // Submit customer login credentials.
  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");

    if (!companySlug) {
      setFormError(
        "Company information is missing. Return to the company website and try again."
      );
      return;
    }

    if (
      !formData.email.trim() ||
      !formData.password
    ) {
      setFormError(
        "Please enter your email address and password."
      );
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API}/login/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
          company_slug: companySlug,
        }),
      });

      const data = await readResponse(response);

      if (!response.ok) {
        throw new Error(
          getErrorMessage(
            data,
            "Invalid email or password."
          )
        );
      }

      // Store supported token formats.
      if (data.token) {
        localStorage.setItem("token", data.token);
      }

      if (data.access) {
        localStorage.setItem("access", data.access);
        localStorage.setItem("access_token", data.access);
      }

      if (data.access_token) {
        localStorage.setItem("access_token", data.access_token);
        localStorage.setItem("access", data.access_token);
      }

      if (data.refresh) {
        localStorage.setItem("refresh", data.refresh);
        localStorage.setItem("refresh_token", data.refresh);
      }

      if (data.refresh_token) {
        localStorage.setItem("refresh_token", data.refresh_token);
        localStorage.setItem("refresh", data.refresh_token);
      }

      if (data.user) {
        localStorage.setItem(
          "user",
          JSON.stringify(data.user)
        );
      }

      const loggedInCompany = data.company || company;

      if (loggedInCompany) {
        localStorage.setItem(
          "company",
          JSON.stringify(loggedInCompany)
        );
      }

      localStorage.setItem("companySlug", companySlug);
      localStorage.setItem("company_slug", companySlug);

      navigate(companyRoute("/dashboard"), {
        replace: true,
      });
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Login failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const companyName = company?.name || "TrustFound";

  const logoUrl = getImageUrl(
    settings.logo_url ||
      settings.logo ||
      company?.logo_url ||
      company?.logo
  );

  const cardBorder = {
    borderColor: settings.border_line_color,
    borderStyle: settings.border_style,
    borderWidth: `${settings.border_width}px`,
  };

  const inputStyle = {
    backgroundColor: "#ffffff",
    color: settings.secondary_color,
    borderColor: settings.border_line_color,
    borderStyle: settings.border_style,
    borderWidth: `${settings.border_width}px`,
    "--tw-ring-color": `${settings.primary_color}30`,
  };

  const isMinimal = settings.template === "minimal";
  const isProfessional = settings.template === "professional";

  const pageStyle = {
    backgroundColor: settings.background_color,
    color: settings.secondary_color,
    "--company-primary": settings.primary_color,
    "--company-secondary": settings.secondary_color,
    "--company-background": settings.background_color,
    "--company-border-color": settings.border_color,
    "--company-border-line-color": settings.border_line_color,
    "--company-border-style": settings.border_style,
    "--company-border-width": `${settings.border_width}px`,
  };

  // Loading screen.
  if (companyLoading) {
    return (
      <div
        className="flex min-h-screen items-center justify-center px-4"
        style={pageStyle}
      >
        <div className="text-center">
          <Loader2
            size={40}
            className="mx-auto animate-spin"
            style={{ color: settings.primary_color }}
          />

          <p className="mt-4 text-sm opacity-70">
            Loading company login...
          </p>
        </div>
      </div>
    );
  }

  // Company not found or profile unavailable.
  if (companyError || !company) {
    return (
      <div
        className="flex min-h-screen items-center justify-center px-4 py-10"
        style={pageStyle}
      >
        <div
          className="w-full max-w-md rounded-3xl p-8 text-center shadow-xl"
          style={{
            ...cardBorder,
            backgroundColor: settings.border_color,
          }}
        >
          <AlertCircle
            className="mx-auto text-red-500"
            size={36}
          />

          <h1
            className="mt-5 text-2xl font-black"
            style={{ color: settings.secondary_color }}
          >
            Company Not Found
          </h1>

          <p className="mt-3 text-sm leading-6 opacity-75">
            {companyError ||
              "This company platform is currently unavailable."}
          </p>

          <Link
            to="/"
            className="mt-6 inline-flex items-center gap-2 rounded-xl px-5 py-3 font-bold text-white"
            style={{ backgroundColor: settings.primary_color }}
          >
            <ArrowLeft size={17} />
            Back to TrustFound
          </Link>
        </div>
      </div>
    );
  }

  // Unpublished website screen.
  if (websiteUnpublished) {
    return (
      <main
        className="flex min-h-screen items-center justify-center px-4 py-10"
        style={pageStyle}
      >
        <section
          className="w-full max-w-md rounded-3xl p-8 text-center shadow-xl"
          style={{
            ...cardBorder,
            backgroundColor: settings.border_color,
          }}
        >
          <AlertCircle
            size={40}
            className="mx-auto"
            style={{ color: settings.primary_color }}
          />

          <h1
            className="mt-5 text-2xl font-black"
            style={{ color: settings.secondary_color }}
          >
            Website Not Published
          </h1>

          <p className="mt-3 text-sm leading-6 opacity-75">
            {companyName} has not published its public website
            settings yet. Please contact the company
            administrator.
          </p>

          <Link
            to={publicCompanyPath}
            className="mt-6 inline-flex items-center gap-2 rounded-xl px-5 py-3 font-bold text-white"
            style={{ backgroundColor: settings.primary_color }}
          >
            <ArrowLeft size={17} />
            Back to {companyName}
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main
      className="login-page-theme relative flex min-h-screen items-center justify-center px-4 py-10 sm:px-6"
      style={pageStyle}
    >
      <div
        className={`w-full max-w-md ${
          isProfessional ? "text-center" : ""
        }`}
      >
        {/* Company header */}
        <header className="mb-7 text-center">
          <Link
            to={publicCompanyPath}
            className="inline-flex items-center gap-2 text-sm font-semibold opacity-70 transition hover:opacity-100"
          >
            <ArrowLeft size={16} />
            Back to {companyName}
          </Link>

          {/* Company logo */}
          <div className="mt-6 flex justify-center">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={`${companyName} logo`}
                className="h-20 w-20 rounded-2xl object-cover shadow-lg"
                style={{
                  ...cardBorder,
                  backgroundColor: settings.border_color,
                }}
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                }}
              />
            ) : (
              <div
                className="flex h-20 w-20 items-center justify-center rounded-2xl text-2xl font-black text-white shadow-lg"
                style={{
                  backgroundColor: settings.primary_color,
                  ...cardBorder,
                }}
              >
                {companyName.substring(0, 2).toUpperCase() || (
                  <Package size={28} />
                )}
              </div>
            )}
          </div>

          <h1
            className="mt-5 text-2xl font-black sm:text-3xl"
            style={{ color: settings.secondary_color }}
          >
            {companyName}
          </h1>

          <p className="mt-2 text-sm opacity-70">
            Lost &amp; Found Platform
          </p>

          {company?.description && (
            <p className="mx-auto mt-3 max-w-sm text-sm leading-6 opacity-75">
              {company.description}
            </p>
          )}

          {company?.location && (
            <p className="mt-2 inline-flex items-center gap-1 text-sm opacity-70">
              <MapPin size={14} />
              {company.location}
            </p>
          )}
        </header>

        {/* Login card */}
        <section
          className={`rounded-3xl p-6 shadow-2xl sm:p-8 ${
            isMinimal ? "shadow-md" : ""
          }`}
          style={{
            ...cardBorder,
            backgroundColor: settings.border_color,
          }}
        >
          <div className="mb-7 text-center">
            <div
              className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl"
              style={{
                backgroundColor: `${settings.primary_color}18`,
                color: settings.primary_color,
              }}
            >
              <LockKeyhole size={23} />
            </div>

            <h2
              className="text-3xl font-black"
              style={{ color: settings.secondary_color }}
            >
              Welcome Back
            </h2>

            <p className="mt-2 text-sm opacity-70">
              Login to your {companyName} account
            </p>
          </div>

          {/* Login error */}
          {formError && (
            <div
              role="alert"
              className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {formError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-semibold"
                style={{ color: settings.secondary_color }}
              >
                Email Address
              </label>

              <div className="relative">
                <Mail
                  size={18}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email address"
                  required
                  disabled={loading}
                  autoComplete="email"
                  className="w-full rounded-xl py-3.5 pl-11 pr-4 outline-none transition focus:ring-2"
                  style={inputStyle}
                />
              </div>

              <p className="mt-2 text-xs opacity-60">
                Use the email address you registered with.
              </p>
            </div>

            {/* Password */}
            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <label
                  htmlFor="password"
                  className="text-sm font-semibold"
                  style={{ color: settings.secondary_color }}
                >
                  Password
                </label>

                <Link
                  to={forgotPasswordPath}
                  className="text-sm font-semibold hover:underline"
                  style={{ color: settings.primary_color }}
                >
                  Forgot password?
                </Link>
              </div>

              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                required
                disabled={loading}
                autoComplete="current-password"
                className="w-full rounded-xl px-4 py-3.5 outline-none transition focus:ring-2"
                style={inputStyle}
              />
            </div>

            {/* Login button */}
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl px-5 py-4 font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              style={{ backgroundColor: settings.primary_color }}
            >
              {loading ? (
                <>
                  <Loader2
                    size={18}
                    className="animate-spin"
                  />
                  Logging in...
                </>
              ) : (
                <>
                  <ShieldCheck size={18} />
                  Login
                </>
              )}
            </button>
          </form>

          {/* Signup and Staff Login links */}
          <div className="mt-7 space-y-4 text-center text-sm">
            <p className="opacity-75">
              Don&apos;t have an account?{" "}
              <Link
                to={signupPath}
                className="font-bold hover:underline"
                style={{ color: settings.primary_color }}
              >
                Sign Up
              </Link>
            </p>

            <p>
              <Link
                to={staffLoginPath}
                className="inline-flex items-center justify-center gap-2 font-bold hover:underline"
                style={{ color: settings.primary_color }}
              >
                <ShieldCheck size={17} />
                Staff Login
              </Link>
            </p>
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-6 text-center text-xs opacity-60">
          © {new Date().getFullYear()} {companyName}. All rights
          reserved.
        </footer>
      </div>
    </main>
  );
}
