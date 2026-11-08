
import { useEffect, useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import {
  ArrowRight,
  LockKeyhole,
  Mail,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import { API } from "../../config";
import { BRAND, resolveMediaUrl } from "../../theme";
import AuthLayout, {
  AuthAlert,
  AuthField,
  AuthHeading,
  AuthMessage,
  AuthSubmit,
} from "../../component/auth/AuthLayout";

const DEFAULT_SETTINGS = {
  hero_title: "Welcome to our Lost & Found",
  hero_subtitle:
    "Helping our community reconnect with the things that matter.",
  about_title: "About our service",
  about_text:
    "We help people report lost belongings, register found items, and reconnect owners with their property.",
  template: "modern",
  primary_color: BRAND.primary,
  secondary_color: BRAND.graphite,
  background_color: BRAND.background,
  border_color: "#ffffff",
  border_line_color: "#E9E1D8",
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

const getImageUrl = resolveMediaUrl;

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

  const theme = {
    primary: settings.primary_color,
    background: settings.background_color,
  };

  // Loading screen.
  if (companyLoading) {
    return (
      <AuthMessage
        loading
        message="Loading company login..."
        {...theme}
      />
    );
  }

  // Company not found or profile unavailable.
  if (companyError || !company) {
    return (
      <AuthMessage
        title="Company not found"
        message={
          companyError ||
          "This company platform is currently unavailable."
        }
        actionTo="/"
        actionLabel="Back to TrustFound"
        {...theme}
      />
    );
  }

  // Unpublished website screen.
  if (websiteUnpublished) {
    return (
      <AuthMessage
        title="Website not published"
        message={`${companyName} has not published its public website yet. Please contact the company administrator.`}
        actionTo={publicCompanyPath}
        actionLabel={`Back to ${companyName}`}
        {...theme}
      />
    );
  }

  return (
    <AuthLayout
      companyName={companyName}
      logoUrl={logoUrl}
      primary={settings.primary_color}
      secondary={settings.secondary_color}
      background={settings.background_color}
      backTo={publicCompanyPath}
      tagline={company?.description}
    >
      <AuthHeading
        title="Welcome back"
        subtitle={`Log in to your ${companyName} account`}
      />

      {company?.location && (
        <p className="-mt-3 mb-5 inline-flex items-center gap-1.5 text-xs text-stone-500">
          <MapPin size={13} />
          {company.location}
        </p>
      )}

      <AuthAlert>{formError}</AuthAlert>

      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthField
          id="email"
          label="Email address"
          icon={Mail}
          type="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="you@example.com"
          required
          disabled={loading}
          autoComplete="email"
          primary={settings.primary_color}
        />

        <AuthField
          id="password"
          label="Password"
          icon={LockKeyhole}
          type="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="Enter your password"
          required
          disabled={loading}
          autoComplete="current-password"
          primary={settings.primary_color}
          action={
            <Link
              to={forgotPasswordPath}
              className="text-sm font-semibold hover:underline"
              style={{ color: settings.primary_color }}
            >
              Forgot password?
            </Link>
          }
        />

        <div className="pt-2">
          <AuthSubmit
            loading={loading}
            loadingText="Logging in..."
            primary={settings.primary_color}
          >
            Log in
            <ArrowRight size={18} />
          </AuthSubmit>
        </div>
      </form>

      <p className="mt-6 text-center text-sm text-stone-600">
        Don&apos;t have an account?{" "}
        <Link
          to={signupPath}
          className="font-bold hover:underline"
          style={{ color: settings.primary_color }}
        >
          Sign up
        </Link>
      </p>

      <div className="mt-6 border-t border-stone-100 pt-5">
        <Link
          to={staffLoginPath}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-stone-200 px-4 py-3 text-sm font-semibold text-graphite transition hover:border-stone-300 hover:bg-stone-50"
        >
          <ShieldCheck size={17} style={{ color: settings.primary_color }} />
          Staff login
        </Link>
      </div>
    </AuthLayout>
  );
}
