import React, { useEffect, useState } from "react";
import {
    Link,
    useLocation,
    useNavigate,
} from "react-router-dom";

const API = "https://trustfound-backend.onrender.com/api";

const DEFAULT_SETTINGS = {
    primary_color: "#2563eb",
    secondary_color: "#1d4ed8",
    background_color: "#f8fbfb",
    text_color: "#475569",
    heading_color: "#131616",
    card_color: "#ffffff",
    button_text_color: "#ffffff",
    border_color: "#ffffff",
    border_line_color: "#e2e8f0",
    border_style: "solid",
    border_width: 1,
    border_radius: 16,
    content_width: 512,
    font_family: "Inter",
};


// ============================================================
// VALIDATE COLOR
// ============================================================

function getValidColor(value, fallback) {
    if (typeof value !== "string") return fallback;

    const color = value.trim();

    const valid =
        /^#[0-9a-f]{3,8}$/i.test(color) ||
        /^rgba?\([\d\s.,%/+-]+\)$/i.test(color) ||
        /^hsla?\([\d\s.,%/+-]+\)$/i.test(color) ||
        /^[a-z]+$/i.test(color);

    return valid ? color : fallback;
}


// ============================================================
// NORMALIZE WEBSITE SETTINGS
// ============================================================

function normalizeSettings(data) {
    const source =
        data?.settings ||
        data?.website_settings ||
        data?.websiteSettings ||
        data ||
        {};

    const allowedBorderStyles = [
        "solid",
        "dashed",
        "dotted",
        "double",
        "none",
    ];

    const borderWidth = Number(source.border_width);
    const borderRadius = Number(source.border_radius);
    const contentWidth = Number(source.content_width);

    const requestedFont = source.font_family;

    const fontFamily =
        typeof requestedFont === "string" &&
        requestedFont.trim() &&
        /^[a-zA-Z0-9 ,'"-]+$/.test(requestedFont)
            ? requestedFont
            : DEFAULT_SETTINGS.font_family;

    return {
        primary_color: getValidColor(
            source.primary_color,
            DEFAULT_SETTINGS.primary_color
        ),
        secondary_color: getValidColor(
            source.secondary_color,
            DEFAULT_SETTINGS.secondary_color
        ),
        background_color: getValidColor(
            source.background_color,
            DEFAULT_SETTINGS.background_color
        ),
        text_color: getValidColor(
            source.text_color,
            DEFAULT_SETTINGS.text_color
        ),
        heading_color: getValidColor(
            source.heading_color,
            DEFAULT_SETTINGS.heading_color
        ),
        card_color: getValidColor(
            source.card_color,
            DEFAULT_SETTINGS.card_color
        ),
        button_text_color: getValidColor(
            source.button_text_color,
            DEFAULT_SETTINGS.button_text_color
        ),

        // Fill inside bordered elements.
        border_color: getValidColor(
            source.border_color,
            DEFAULT_SETTINGS.border_color
        ),

        // Actual border line.
        border_line_color: getValidColor(
            source.border_line_color,
            DEFAULT_SETTINGS.border_line_color
        ),

        border_style: allowedBorderStyles.includes(
            source.border_style
        )
            ? source.border_style
            : DEFAULT_SETTINGS.border_style,

        border_width:
            Number.isFinite(borderWidth) &&
            borderWidth >= 0 &&
            borderWidth <= 12
                ? borderWidth
                : DEFAULT_SETTINGS.border_width,

        border_radius:
            Number.isFinite(borderRadius) &&
            borderRadius >= 0 &&
            borderRadius <= 100
                ? borderRadius
                : DEFAULT_SETTINGS.border_radius,

        content_width:
            Number.isFinite(contentWidth) &&
            contentWidth >= 320 &&
            contentWidth <= 2400
                ? contentWidth
                : DEFAULT_SETTINGS.content_width,

        font_family: fontFamily,
    };
}


// ============================================================
// SIGNUP PAGE
// ============================================================

function SignupPage() {
    const navigate = useNavigate();
    const location = useLocation();

    const searchParams = new URLSearchParams(location.search);
    const companySlug = searchParams.get("company");

    // ==========================================================
    // STATE
    // ==========================================================

    const [company, setCompany] = useState(null);
    const [companyLoading, setCompanyLoading] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [websiteSettings, setWebsiteSettings] = useState(
        DEFAULT_SETTINGS
    );

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
                setError(
                    "No company was selected. Please open the signup page from a company page."
                );
                setCompanyLoading(false);
                return;
            }

            try {
                setCompanyLoading(true);
                setError("");

                const response = await fetch(
                    `${API}/company/public/${encodeURIComponent(
                        companySlug
                    )}/`,
                    {
                        headers: {
                            Accept: "application/json",
                        },
                    }
                );

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(
                        data.error ||
                        data.message ||
                        "Company could not be found."
                    );
                }

                const companyData = data.company || data;

                if (!companyData?.slug) {
                    throw new Error(
                        "The company information returned by the server is incomplete."
                    );
                }

                if (cancelled) return;

                setCompany(companyData);

                // Load website settings without breaking signup
                // if the settings endpoint is unavailable.
                try {
                    const settingsResponse = await fetch(
                        `${API}/company/public/${encodeURIComponent(
                            companyData.slug
                        )}/website/`,
                        {
                            headers: {
                                Accept: "application/json",
                            },
                        }
                    );

                    if (settingsResponse.ok) {
                        const settingsData =
                            await settingsResponse.json();

                        if (!cancelled) {
                            setWebsiteSettings(
                                normalizeSettings(settingsData)
                            );
                        }
                    }
                } catch (settingsError) {
                    console.warn(
                        "Unable to load website settings:",
                        settingsError
                    );
                }
            } catch (err) {
                console.error(
                    "Company loading error:",
                    err
                );

                if (!cancelled) {
                    setError(
                        err instanceof Error
                            ? err.message
                            : "Unable to load company."
                    );
                }
            } finally {
                if (!cancelled) {
                    setCompanyLoading(false);
                }
            }
        };

        loadCompany();

        return () => {
            cancelled = true;
        };
    }, [companySlug]);


    // ==========================================================
    // THEME STYLES
    // ==========================================================

    const themeStyle = {
        "--signup-primary": websiteSettings.primary_color,
        "--signup-secondary": websiteSettings.secondary_color,
        "--signup-background": websiteSettings.background_color,
        "--signup-text": websiteSettings.text_color,
        "--signup-heading": websiteSettings.heading_color,
        "--signup-card": websiteSettings.card_color,
        "--signup-button-text": websiteSettings.button_text_color,

        // Fill inside bordered elements.
        "--signup-border-fill": websiteSettings.border_color,

        // Actual border stroke.
        "--signup-border-line": websiteSettings.border_line_color,

        "--signup-border-style": websiteSettings.border_style,
        "--signup-border-width": `${websiteSettings.border_width}px`,
        "--signup-radius": `${websiteSettings.border_radius}px`,
        "--signup-content-width": `${websiteSettings.content_width}px`,
        "--signup-font": websiteSettings.font_family,

        backgroundColor: websiteSettings.background_color,
        color: websiteSettings.text_color,
        fontFamily: websiteSettings.font_family,
    };


    // ==========================================================
    // HANDLE INPUT
    // ==========================================================

    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value,
        }));
    };


    // ==========================================================
    // SUBMIT
    // ==========================================================

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!company || !company.slug) {
            alert("Company information is missing.");
            return;
        }

        if (
            formData.password !==
            formData.confirmPassword
        ) {
            alert("Passwords do not match.");
            return;
        }

        if (formData.password.length < 8) {
            alert(
                "Password must be at least 8 characters."
            );
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(
                `${API}/register/`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        company_slug: company.slug,
                        full_name: formData.fullName,
                        username: formData.username,
                        email: formData.email,
                        password: formData.password,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error ||
                    data.message ||
                    "Registration failed."
                );
            }

            alert(
                "Account created successfully. A verification code has been sent to your email."
            );

            navigate(
                `/verify-code?company=${encodeURIComponent(
                    company.slug
                )}`,
                {
                    state: {
                        email: formData.email,
                        purpose: "signup",
                        companySlug: company.slug,
                    },
                }
            );
        } catch (err) {
            console.error(
                "Registration error:",
                err
            );

            alert(
                err instanceof Error
                    ? err.message
                    : "Registration failed."
            );
        } finally {
            setLoading(false);
        }
    };


    // ==========================================================
    // SHARED PAGE STYLES
    // ==========================================================

    const themeCSS = `
        .signup-theme {
            background: var(--signup-background);
            color: var(--signup-text);
            font-family: var(--signup-font);
        }

        .signup-theme .signup-card {
            background: var(--signup-card);
            border: var(--signup-border-width)
                var(--signup-border-style)
                var(--signup-border-line);
            border-radius: var(--signup-radius);
        }

        .signup-theme .signup-bordered-fill {
            background: var(--signup-border-fill);
            border: var(--signup-border-width)
                var(--signup-border-style)
                var(--signup-border-line);
            border-radius: var(--signup-radius);
        }

        .signup-theme .signup-heading {
            color: var(--signup-heading);
        }

        .signup-theme .signup-primary-text {
            color: var(--signup-primary);
        }

        .signup-theme .signup-primary-button {
            background: var(--signup-primary);
            color: var(--signup-button-text);
            border: var(--signup-border-width)
                var(--signup-border-style)
                var(--signup-border-line);
            border-radius: var(--signup-radius);
            transition: background-color 0.2s ease;
        }

        .signup-theme .signup-primary-button:hover {
            background: var(--signup-secondary);
        }

        .signup-theme .signup-input {
            background: var(--signup-card);
            color: var(--signup-text);
            border: var(--signup-border-width)
                var(--signup-border-style)
                var(--signup-border-line);
            border-radius: var(--signup-radius);
        }

        .signup-theme .signup-input:focus {
            outline: 2px solid var(--signup-primary);
            outline-offset: 1px;
        }

        .signup-theme .signup-content {
            width: 100%;
            max-width: var(--signup-content-width);
        }
    `;


    // ==========================================================
    // LOADING
    // ==========================================================

    if (companyLoading) {
        return (
            <div
                className="signup-theme min-h-screen flex items-center justify-center px-4"
                style={themeStyle}
            >
                <style>{themeCSS}</style>

                <div className="text-center">
                    <div
                        className="w-16 h-16 mx-auto mb-5 rounded-2xl flex items-center justify-center font-black text-xl"
                        style={{
                            backgroundColor: websiteSettings.primary_color,
                            color: websiteSettings.button_text_color,
                        }}
                    >
                        LF
                    </div>

                    <h1 className="text-2xl font-black signup-heading">
                        Loading organization...
                    </h1>

                    <p className="mt-2">
                        Please wait.
                    </p>
                </div>
            </div>
        );
    }


    // ==========================================================
    // ERROR
    // ==========================================================

    if (error || !company) {
        return (
            <div
                className="signup-theme min-h-screen flex items-center justify-center px-4"
                style={themeStyle}
            >
                <style>{themeCSS}</style>

                <div className="signup-card w-full max-w-lg shadow-xl p-10 text-center">
                    <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-red-100 flex items-center justify-center text-red-600 font-black">
                        !
                    </div>

                    <h1 className="text-3xl font-black signup-heading">
                        Company Not Found
                    </h1>

                    <p className="mt-3">
                        {error ||
                            "We could not determine which company you belong to."}
                    </p>

                    <div className="flex flex-col gap-3 mt-7">
                        <Link
                            to="/"
                            className="signup-primary-button block w-full py-3 font-bold"
                        >
                            Back to Home
                        </Link>
                    </div>
                </div>
            </div>
        );
    }


    // ==========================================================
    // COMPANY LOGO / FALLBACK
    // ==========================================================

    const companyLogo = company.logo || company.logo_url;


    // ==========================================================
    // SIGNUP PAGE
    // ==========================================================

    return (
        <div
            className="signup-theme min-h-screen flex items-center justify-center px-4 py-12"
            style={themeStyle}
        >
            <style>{themeCSS}</style>

            <div className="signup-card signup-content shadow-xl p-8">

                {/* COMPANY HEADER */}

                <div className="text-center mb-8">
                    {companyLogo ? (
                        <img
                            src={companyLogo}
                            alt={company.name}
                            className="w-20 h-20 mx-auto rounded-2xl object-cover mb-5"
                            style={{
                                border: `${websiteSettings.border_width}px ${websiteSettings.border_style} ${websiteSettings.border_line_color}`,
                            }}
                        />
                    ) : (
                        <div
                            className="w-20 h-20 mx-auto rounded-2xl flex items-center justify-center font-black text-2xl mb-5"
                            style={{
                                backgroundColor: websiteSettings.primary_color,
                                color: websiteSettings.button_text_color,
                                border: `${websiteSettings.border_width}px ${websiteSettings.border_style} ${websiteSettings.border_line_color}`,
                            }}
                        >
                            LF
                        </div>
                    )}

                    <h2 className="text-xl font-black signup-primary-text">
                        {company.name}
                    </h2>

                    <h1 className="text-4xl font-black signup-heading mt-3">
                        Create Account
                    </h1>

                    <p className="mt-2">
                        Join {company.name}'s Lost &amp; Found platform
                    </p>
                </div>


                {/* COMPANY INFORMATION */}

                <div className="mb-7 signup-bordered-fill p-4">
                    <div className="flex items-center gap-3">
                        {companyLogo ? (
                            <img
                                src={companyLogo}
                                alt={company.name}
                                className="w-12 h-12 rounded-xl object-cover"
                            />
                        ) : (
                            <div
                                className="w-12 h-12 rounded-xl flex items-center justify-center font-black"
                                style={{
                                    backgroundColor: websiteSettings.primary_color,
                                    color: websiteSettings.button_text_color,
                                }}
                            >
                                LF
                            </div>
                        )}

                        <div>
                            <p className="text-xs">
                                Creating account for
                            </p>

                            <p className="font-black signup-heading">
                                {company.name}
                            </p>
                        </div>
                    </div>
                </div>


                {/* FORM */}

                <form
                    onSubmit={handleSubmit}
                    className="space-y-5"
                >
                    {/* FULL NAME */}

                    <div>
                        <label
                            htmlFor="fullName"
                            className="block mb-2 font-semibold"
                        >
                            Full Name
                        </label>

                        <input
                            id="fullName"
                            name="fullName"
                            type="text"
                            value={formData.fullName}
                            onChange={handleChange}
                            required
                            disabled={loading}
                            autoComplete="name"
                            className="signup-input w-full px-4 py-3 outline-none"
                            placeholder="John Doe"
                        />
                    </div>


                    {/* USERNAME */}

                    <div>
                        <label
                            htmlFor="username"
                            className="block mb-2 font-semibold"
                        >
                            Username
                        </label>

                        <input
                            id="username"
                            name="username"
                            type="text"
                            value={formData.username}
                            onChange={handleChange}
                            required
                            disabled={loading}
                            autoComplete="username"
                            className="signup-input w-full px-4 py-3 outline-none"
                            placeholder="johndoe"
                        />
                    </div>


                    {/* EMAIL */}

                    <div>
                        <label
                            htmlFor="email"
                            className="block mb-2 font-semibold"
                        >
                            Email
                        </label>

                        <input
                            id="email"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            disabled={loading}
                            autoComplete="email"
                            className="signup-input w-full px-4 py-3 outline-none"
                            placeholder="john@example.com"
                        />
                    </div>


                    {/* PASSWORD */}

                    <div>
                        <label
                            htmlFor="password"
                            className="block mb-2 font-semibold"
                        >
                            Password
                        </label>

                        <input
                            id="password"
                            name="password"
                            type="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            disabled={loading}
                            minLength={8}
                            autoComplete="new-password"
                            className="signup-input w-full px-4 py-3 outline-none"
                            placeholder="********"
                        />

                        <p className="text-xs mt-1">
                            Minimum 8 characters.
                        </p>
                    </div>


                    {/* CONFIRM PASSWORD */}

                    <div>
                        <label
                            htmlFor="confirmPassword"
                            className="block mb-2 font-semibold"
                        >
                            Confirm Password
                        </label>

                        <input
                            id="confirmPassword"
                            name="confirmPassword"
                            type="password"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            required
                            disabled={loading}
                            minLength={8}
                            autoComplete="new-password"
                            className="signup-input w-full px-4 py-3 outline-none"
                            placeholder="********"
                        />
                    </div>


                    {/* SUBMIT */}

                    <button
                        type="submit"
                        disabled={loading}
                        className="signup-primary-button w-full py-4 font-bold transition disabled:opacity-50"
                    >
                        {loading
                            ? "Creating Account..."
                            : `Create ${company.name} Account`}
                    </button>
                </form>


                {/* LOGIN */}

                <div className="text-center mt-6">
                    <p>
                        Already have an account?{" "}

                        <Link
                            to={`/login-page?company=${encodeURIComponent(
                                company.slug
                            )}`}
                            className="signup-primary-text font-bold hover:underline"
                        >
                            Login
                        </Link>
                    </p>
                </div>


                {/* BACK TO COMPANY */}

                <div className="text-center mt-4">
                    <Link
                        to={`/company/${encodeURIComponent(
                            company.slug
                        )}`}
                        className="text-sm hover:underline"
                        style={{
                            color: websiteSettings.secondary_color,
                        }}
                    >
                        ← Back to {company.name}
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default SignupPage;