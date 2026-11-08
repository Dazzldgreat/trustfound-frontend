import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
    ArrowRight,
    AtSign,
    LockKeyhole,
    Mail,
    UserRound,
} from "lucide-react";

import { API } from "../../config";
import { BRAND, resolveMediaUrl, upgradeLegacyColor } from "../../theme";
import AuthLayout, {
    AuthAlert,
    AuthField,
    AuthHeading,
    AuthMessage,
    AuthSubmit,
} from "../../component/auth/AuthLayout";

// ============================================================
// THEME
// ============================================================

const DEFAULT_THEME = {
    primary_color: BRAND.primary,
    secondary_color: BRAND.graphite,
    background_color: BRAND.background,
};

function normalizeColor(value, fallback) {
    value = upgradeLegacyColor(value);
    return typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value.trim())
        ? value.trim()
        : fallback;
}

function normalizeTheme(data) {
    const source =
        data?.settings || data?.website_settings || data?.websiteSettings || data || {};

    return {
        primary_color: normalizeColor(source.primary_color, DEFAULT_THEME.primary_color),
        secondary_color: normalizeColor(source.secondary_color, DEFAULT_THEME.secondary_color),
        background_color: normalizeColor(source.background_color, DEFAULT_THEME.background_color),
    };
}

function getStoredObject(key) {
    try {
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) : null;
    } catch {
        return null;
    }
}

async function readJson(response) {
    try {
        return await response.json();
    } catch {
        return {};
    }
}

function getErrorMessage(data, fallback) {
    if (!data || typeof data !== "object") return fallback;

    if (data.error) return String(data.error);
    if (data.message) return String(data.message);
    if (data.detail) return String(data.detail);

    // DRF field errors, e.g. { email: ["already exists"] }
    const fieldErrors = Object.entries(data)
        .filter(([, value]) => Array.isArray(value))
        .map(([field, value]) => `${field.replace(/_/g, " ")}: ${value.join(", ")}`);

    return fieldErrors.length ? fieldErrors.join(" · ") : fallback;
}

// ============================================================
// SIGNUP PAGE
// ============================================================

function SignupPage() {
    const navigate = useNavigate();
    const location = useLocation();

    const searchParams = new URLSearchParams(location.search);
    const storedCompany = getStoredObject("company");

    const companySlug =
        searchParams.get("company") ||
        localStorage.getItem("companySlug") ||
        localStorage.getItem("company_slug") ||
        storedCompany?.slug ||
        "";

    const [company, setCompany] = useState(null);
    const [companyLoading, setCompanyLoading] = useState(true);
    const [companyError, setCompanyError] = useState("");
    const [theme, setTheme] = useState(DEFAULT_THEME);

    const [loading, setLoading] = useState(false);
    const [formError, setFormError] = useState("");

    const [formData, setFormData] = useState({
        fullName: "",
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
    });

    // ==========================================================
    // LOAD COMPANY AND WEBSITE SETTINGS
    // ==========================================================

    useEffect(() => {
        let cancelled = false;

        const loadCompany = async () => {
            if (!companySlug) {
                setCompanyError(
                    "No company was selected. Please open the signup page from your company's page."
                );
                setCompanyLoading(false);
                return;
            }

            try {
                setCompanyLoading(true);
                setCompanyError("");

                const response = await fetch(
                    `${API}/company/public/${encodeURIComponent(companySlug)}/`,
                    { headers: { Accept: "application/json" } }
                );

                const data = await readJson(response);

                if (!response.ok) {
                    throw new Error(getErrorMessage(data, "Company could not be found."));
                }

                const companyData = data.company || data;

                if (!companyData?.slug) {
                    throw new Error(
                        "The company information returned by the server is incomplete."
                    );
                }

                if (cancelled) return;

                setCompany(companyData);

                // Website settings are optional for signup.
                try {
                    const settingsResponse = await fetch(
                        `${API}/company/public/${encodeURIComponent(companyData.slug)}/website/`,
                        { headers: { Accept: "application/json" } }
                    );

                    if (settingsResponse.ok && !cancelled) {
                        setTheme(normalizeTheme(await readJson(settingsResponse)));
                    }
                } catch (settingsError) {
                    console.warn("Unable to load website settings:", settingsError);
                }
            } catch (err) {
                if (!cancelled) {
                    setCompanyError(
                        err instanceof Error ? err.message : "Unable to load company."
                    );
                }
            } finally {
                if (!cancelled) setCompanyLoading(false);
            }
        };

        loadCompany();

        return () => {
            cancelled = true;
        };
    }, [companySlug]);

    // ==========================================================
    // INPUT
    // ==========================================================

    const handleChange = (event) => {
        const { name, value } = event.target;

        setFormData((previous) => ({ ...previous, [name]: value }));

        if (formError) setFormError("");
    };

    // ==========================================================
    // SUBMIT
    // ==========================================================

    const handleSubmit = async (event) => {
        event.preventDefault();
        setFormError("");

        if (!company?.slug) {
            setFormError("Company information is missing.");
            return;
        }

        if (formData.password.length < 8) {
            setFormError("Password must be at least 8 characters.");
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setFormError("Passwords do not match.");
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(`${API}/register/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    company_slug: company.slug,
                    full_name: formData.fullName.trim(),
                    username: formData.username.trim(),
                    email: formData.email.trim(),
                    password: formData.password,
                }),
            });

            const data = await readJson(response);

            if (!response.ok) {
                throw new Error(getErrorMessage(data, "Registration failed."));
            }

            navigate(`/verify-code?company=${encodeURIComponent(company.slug)}`, {
                state: {
                    email: formData.email.trim(),
                    purpose: "signup",
                    companySlug: company.slug,
                    message:
                        "Account created. We've sent a verification code to your email.",
                },
            });
        } catch (err) {
            setFormError(err instanceof Error ? err.message : "Registration failed.");
        } finally {
            setLoading(false);
        }
    };

    // ==========================================================
    // STATES
    // ==========================================================

    const messageTheme = {
        primary: theme.primary_color,
        background: theme.background_color,
    };

    if (companyLoading) {
        return <AuthMessage loading message="Loading organisation..." {...messageTheme} />;
    }

    if (companyError || !company) {
        return (
            <AuthMessage
                title="Company not found"
                message={
                    companyError || "We could not determine which company you belong to."
                }
                actionTo="/"
                actionLabel="Back to home"
                {...messageTheme}
            />
        );
    }

    const companyName = company.name || "TrustFound";
    const logoUrl = resolveMediaUrl(company.logo || company.logo_url);
    const passwordsMismatch =
        formData.confirmPassword.length > 0 &&
        formData.password !== formData.confirmPassword;

    // ==========================================================
    // PAGE
    // ==========================================================

    return (
        <AuthLayout
            companyName={companyName}
            logoUrl={logoUrl}
            primary={theme.primary_color}
            secondary={theme.secondary_color}
            background={theme.background_color}
            backTo={`/company/${encodeURIComponent(company.slug)}`}
            tagline={company.description}
        >
            <AuthHeading
                title="Create your account"
                subtitle={`Join ${companyName}'s Lost & Found`}
            />

            <AuthAlert>{formError}</AuthAlert>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                    <AuthField
                        id="fullName"
                        label="Full name"
                        icon={UserRound}
                        value={formData.fullName}
                        onChange={handleChange}
                        placeholder="Jane Doe"
                        required
                        disabled={loading}
                        autoComplete="name"
                        primary={theme.primary_color}
                    />

                    <AuthField
                        id="username"
                        label="Username"
                        icon={AtSign}
                        value={formData.username}
                        onChange={handleChange}
                        placeholder="janedoe"
                        required
                        disabled={loading}
                        autoComplete="username"
                        primary={theme.primary_color}
                    />
                </div>

                <AuthField
                    id="email"
                    label="Email"
                    icon={Mail}
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    required
                    disabled={loading}
                    autoComplete="email"
                    primary={theme.primary_color}
                />

                <AuthField
                    id="password"
                    label="Password"
                    icon={LockKeyhole}
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="At least 8 characters"
                    required
                    minLength={8}
                    disabled={loading}
                    autoComplete="new-password"
                    primary={theme.primary_color}
                />

                <AuthField
                    id="confirmPassword"
                    label="Confirm password"
                    icon={LockKeyhole}
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Repeat your password"
                    required
                    minLength={8}
                    disabled={loading}
                    autoComplete="new-password"
                    primary={theme.primary_color}
                    hint={passwordsMismatch ? "Passwords don't match yet." : undefined}
                />

                <div className="pt-2">
                    <AuthSubmit
                        loading={loading}
                        loadingText="Creating account..."
                        primary={theme.primary_color}
                    >
                        Create account
                        <ArrowRight size={18} />
                    </AuthSubmit>
                </div>
            </form>

            <p className="mt-6 text-center text-sm text-stone-600">
                Already have an account?{" "}
                <Link
                    to={`/login-page?company=${encodeURIComponent(company.slug)}`}
                    className="font-bold hover:underline"
                    style={{ color: theme.primary_color }}
                >
                    Log in
                </Link>
            </p>
        </AuthLayout>
    );
}

export default SignupPage;
