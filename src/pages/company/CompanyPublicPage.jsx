import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import {
    AlertCircle,
    ArrowRight,
    CheckCircle,
    Globe,
    Heart,
    Loader2,
    Mail,
    MapPin,
    Package,
    Phone,
    Search,
    ShieldCheck,
    Sparkles,
} from "lucide-react";

import { API } from "../../config";
const DEFAULT_SETTINGS = {
    hero_title: "Welcome to our Lost & Found",
    hero_subtitle:
        "Helping our community reconnect with the things that matter.",
    about_title: "About our service",
    about_text:
        "We help people report lost belongings, register found items, and reconnect owners with their property.",
    template: "modern",
    primary_color: "#EA580C",
    secondary_color: "#292524",
    background_color: "#FFF7ED",
    border_color: "#ffffff",
    border_line_color: "#E9E1D8",
    border_style: "solid",
    border_width: 1,
    show_about: true,
    show_featured_items: true,
    show_contact: true,
    footer_text: "Helping people find what matters.",
    is_published: false,
    logo: null,
};

function normalizeColor(value, fallback) {
    return typeof value === "string" &&
        /^#[0-9a-fA-F]{6}$/.test(value)
        ? value
        : fallback;
}

function normalizeSettings(data) {
    const source =
        data?.settings ??
        data?.website_settings ??
        data?.data?.settings ??
        data?.data ??
        data ??
        {};

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

        // Interior/background fill of bordered elements.
        border_color: normalizeColor(
            source.border_color,
            DEFAULT_SETTINGS.border_color
        ),

        // Actual outline/line colour.
        border_line_color: normalizeColor(
            source.border_line_color,
            DEFAULT_SETTINGS.border_line_color
        ),

        border_style: [
            "none",
            "solid",
            "dashed",
            "dotted",
            "double",
        ].includes(source.border_style)
            ? source.border_style
            : DEFAULT_SETTINGS.border_style,

        border_width: Math.min(
            10,
            Math.max(
                0,
                Number(
                    source.border_width ??
                        DEFAULT_SETTINGS.border_width
                ) || 0
            )
        ),

        show_about:
            source.show_about ?? DEFAULT_SETTINGS.show_about,

        show_featured_items:
            source.show_featured_items ??
            DEFAULT_SETTINGS.show_featured_items,

        show_contact:
            source.show_contact ?? DEFAULT_SETTINGS.show_contact,
    };
}

async function readResponse(response) {
    const contentType =
        response.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
        return response.json();
    }

    const message = await response.text();

    return {
        error:
            message ||
            `Request failed with status ${response.status}.`,
    };
}

function getImageUrl(value) {
    if (!value) return "";

    // DRF ImageField may return a URL or a relative media path.
    if (typeof value === "object") {
        value = value.url || "";
    }

    if (typeof value !== "string" || !value.trim()) {
        return "";
    }

    if (/^(https?:\/\/|data:|blob:)/i.test(value)) {
        return value;
    }

    const backendOrigin = API.replace(/\/api\/?$/, "");

    return `${backendOrigin}${
        value.startsWith("/") ? "" : "/"
    }${value}`;
}

function getBorderStyle(settings) {
    return [
        "none",
        "solid",
        "dashed",
        "dotted",
        "double",
    ].includes(settings.border_style)
        ? settings.border_style
        : "solid";
}

function getCompanyFromResponse(data) {
    return (
        data?.company ??
        data?.data?.company ??
        (data?.name || data?.slug ? data : null)
    );
}

function getSettingsFromResponse(data) {
    return (
        data?.settings ??
        data?.website_settings ??
        data?.data?.settings ??
        null
    );
}

export default function CompanyPublicPage() {
    const { slug: routeSlug } = useParams();

    const [company, setCompany] = useState(null);
    const [settings, setSettings] = useState(DEFAULT_SETTINGS);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [settingsNotice, setSettingsNotice] = useState("");

    useEffect(() => {
        let cancelled = false;

        async function loadCompanyWebsite() {
            setLoading(true);
            setError("");
            setSettingsNotice("");
            setCompany(null);
            setSettings(DEFAULT_SETTINGS);

            if (!routeSlug) {
                setError("Company platform not found.");
                setLoading(false);
                return;
            }

            const encodedSlug = encodeURIComponent(routeSlug);

            try {
                // Load the company first.
                const companyResponse = await fetch(
                    `${API}/company/public/${encodedSlug}/`
                );

                const companyData =
                    await readResponse(companyResponse);

                if (!companyResponse.ok) {
                    throw new Error(
                        companyData.error ||
                            companyData.detail ||
                            "Company platform not found."
                    );
                }

                const loadedCompany =
                    getCompanyFromResponse(companyData);

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

                // Use settings from the company endpoint if it supplies them.
                const companySettings =
                    getSettingsFromResponse(companyData);

                if (companySettings) {
                    setSettings(
                        normalizeSettings(companySettings)
                    );
                }

                // Fetch the dedicated public website settings.
                const settingsResponse = await fetch(
                    `${API}/company/public/${encodedSlug}/website/`
                );

                const settingsData =
                    await readResponse(settingsResponse);

                if (cancelled) return;

                if (settingsResponse.ok) {
                    const returnedCompany =
                        getCompanyFromResponse(settingsData);

                    const returnedSettings =
                        getSettingsFromResponse(settingsData);

                    if (returnedCompany) {
                        setCompany((previous) => ({
                            ...(previous || {}),
                            ...returnedCompany,
                        }));
                    }

                    if (returnedSettings) {
                        setSettings(
                            normalizeSettings(returnedSettings)
                        );
                    } else if (!companySettings) {
                        setSettingsNotice(
                            "No website settings were returned by the server. Default display settings are being used."
                        );
                    }
                } else if (settingsResponse.status === 404) {
                    // Your current backend returns 404 when unpublished.
                    if (!companySettings) {
                        setSettingsNotice(
                            settingsData.error ||
                                settingsData.detail ||
                                "Saved website settings are unavailable. The website may not be published."
                        );
                    }
                } else {
                    setSettingsNotice(
                        settingsData.error ||
                            settingsData.detail ||
                            "Website settings could not be loaded."
                    );
                }
            } catch (err) {
                if (!cancelled) {
                    setError(
                        err.message ||
                            "Unable to load the company platform."
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        loadCompanyWebsite();

        return () => {
            cancelled = true;
        };
    }, [routeSlug]);

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
                <div className="text-center">
                    <Loader2
                        size={42}
                        className="mx-auto animate-spin text-indigo-400"
                    />
                    <p className="mt-5 text-sm text-slate-300">
                        Loading company platform...
                    </p>
                </div>
            </div>
        );
    }

    if (error || !company) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-950 px-5">
                <div className="max-w-md text-center text-white">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 text-red-400">
                        <AlertCircle size={34} />
                    </div>

                    <h1 className="mt-6 text-3xl font-black">
                        Company Not Found
                    </h1>

                    <p className="mt-3 leading-7 text-slate-400">
                        {error ||
                            "This company platform is currently unavailable."}
                    </p>

                    <Link
                        to="/"
                        className="mt-7 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 font-bold text-white transition hover:bg-indigo-700"
                    >
                        Back to TrustFound
                        <ArrowRight size={18} />
                    </Link>
                </div>
            </div>
        );
    }

    const companyName = company.name || "TrustFound";
    const companySlug = company.slug || routeSlug;

    const primaryColor = settings.primary_color;
    const secondaryColor = settings.secondary_color;
    const backgroundColor = settings.background_color;
    const borderStyle = getBorderStyle(settings);
    const borderWidth = settings.border_width;

    // border_color is the inside fill.
    // border_line_color is the visible outline.
    const borderColor = settings.border_color;
    const borderLineColor = settings.border_line_color;

    const sectionCardStyle = {
        backgroundColor: borderColor,
        borderColor: borderLineColor,
        borderStyle,
        borderWidth: `${borderWidth}px`,
    };

    const logoUrl = getImageUrl(
        settings.logo_url ||
            settings.logo ||
            company.logo_url ||
            company.logo
    );

    const template = [
        "modern",
        "professional",
        "minimal",
    ].includes(settings.template)
        ? settings.template
        : "modern";

    const isProfessional = template === "professional";
    const isMinimal = template === "minimal";

    const companyBasePath =
        `/company/${encodeURIComponent(companySlug)}`;

    const loginPath =
        `/login-page?company=${encodeURIComponent(companySlug)}`;

    const signupPath =
        `/signup-page?company=${encodeURIComponent(companySlug)}`;

    const reportLostPath = loginPath;
    const reportFoundPath = loginPath;

    return (
        <div
            className="min-h-screen text-slate-900"
            style={{ backgroundColor }}
        >
            {settingsNotice && (
                <div className="mx-auto max-w-7xl px-4 pt-3 sm:px-6 lg:px-8">
                    <div className="flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
                        <AlertCircle
                            size={18}
                            className="mt-0.5 shrink-0"
                        />
                        <p>{settingsNotice}</p>
                    </div>
                </div>
            )}

            {/* HEADER */}
            <header
                className="sticky top-0 z-40 border-b bg-white/95 backdrop-blur"
                style={{
                    borderColor: borderLineColor,
                    borderStyle,
                    borderBottomWidth: `${borderWidth}px`,
                }}
            >
                <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
                    <Link
                        to={companyBasePath}
                        className="flex min-w-0 items-center gap-3"
                    >
                        {logoUrl ? (
                            <img
                                src={logoUrl}
                                alt={`${companyName} logo`}
                                className="h-12 w-12 shrink-0 rounded-xl object-contain bg-white p-0.5"
                                onError={(event) => {
                                    event.currentTarget.style.display =
                                        "none";
                                }}
                            />
                        ) : (
                            <div
                                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white"
                                style={{
                                    backgroundColor: primaryColor,
                                }}
                            >
                                <Package size={25} />
                            </div>
                        )}

                        <div className="min-w-0">
                            <h1 className="truncate text-lg font-black sm:text-xl">
                                {companyName}
                            </h1>
                            <p className="text-xs text-slate-500">
                                Lost &amp; Found Platform
                            </p>
                        </div>
                    </Link>

                    <nav className="hidden items-center gap-7 md:flex">
                        <a
                            href="#home"
                            className="text-sm font-medium text-slate-600 hover:text-slate-950"
                        >
                            Home
                        </a>

                        {settings.show_about && (
                            <a
                                href="#about"
                                className="text-sm font-medium text-slate-600 hover:text-slate-950"
                            >
                                About
                            </a>
                        )}

                        {settings.show_featured_items && (
                            <a
                                href="#items"
                                className="text-sm font-medium text-slate-600 hover:text-slate-950"
                            >
                                Lost &amp; Found
                            </a>
                        )}

                        {settings.show_contact && (
                            <a
                                href="#contact"
                                className="text-sm font-medium text-slate-600 hover:text-slate-950"
                            >
                                Contact
                            </a>
                        )}
                    </nav>

                    <div className="flex shrink-0 items-center gap-2">
                        <Link
                            to={loginPath}
                            className="rounded-xl px-3 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-100 sm:px-5"
                        >
                            Login
                        </Link>

                        <Link
                            to={signupPath}
                            className="rounded-xl px-3 py-2.5 text-sm font-bold text-white transition hover:opacity-90 sm:px-5"
                            style={{
                                backgroundColor: primaryColor,
                            }}
                        >
                            Sign Up
                        </Link>
                    </div>
                </div>
            </header>

            <main>
                {/* HERO */}
                <section
                    id="home"
                    className={`relative overflow-hidden ${
                        isMinimal ? "" : "text-white"
                    }`}
                    style={{
                        backgroundColor: isMinimal
                            ? backgroundColor
                            : primaryColor,
                    }}
                >
                    {!isMinimal && (
                        <>
                            <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full border-[50px] border-white/5" />
                            <div className="pointer-events-none absolute -bottom-36 -left-20 h-96 w-96 rounded-full border-[60px] border-white/5" />
                        </>
                    )}

                    <div
                        className={`relative mx-auto grid max-w-7xl items-center gap-12 px-5 py-20 sm:px-8 sm:py-28 ${
                            isProfessional
                                ? "text-center"
                                : "lg:grid-cols-2"
                        }`}
                    >
                        <div
                            className={
                                isProfessional
                                    ? "mx-auto max-w-4xl"
                                    : ""
                            }
                        >
                            <div
                                className={`mb-6 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold ${
                                    isMinimal
                                        ? "bg-white text-slate-700"
                                        : "bg-white/10 text-white"
                                }`}
                            >
                                <Sparkles size={16} />
                                <span>Welcome to {companyName}</span>
                            </div>

                            <h2
                                className={`text-4xl font-black leading-tight sm:text-5xl lg:text-6xl ${
                                    isMinimal
                                        ? "text-slate-950"
                                        : "text-white"
                                }`}
                                style={
                                    isMinimal
                                        ? { color: secondaryColor }
                                        : {}
                                }
                            >
                                {settings.hero_title}
                            </h2>

                            <p
                                className={`mt-6 max-w-2xl text-lg leading-8 ${
                                    isProfessional ? "mx-auto" : ""
                                } ${
                                    isMinimal
                                        ? "text-slate-600"
                                        : "text-white/80"
                                }`}
                            >
                                {settings.hero_subtitle}
                            </p>

                            <div
                                className={`mt-9 flex flex-wrap gap-4 ${
                                    isProfessional ? "justify-center" : ""
                                }`}
                            >
                                <Link
                                    to={reportLostPath}
                                    className="inline-flex items-center gap-2 rounded-xl px-6 py-4 font-bold text-white shadow-lg transition hover:-translate-y-0.5 hover:opacity-90"
                                    style={{
                                        backgroundColor: secondaryColor,
                                    }}
                                >
                                    <Search size={19} />
                                    Report Lost Item
                                    <ArrowRight size={18} />
                                </Link>

                                <Link
                                    to={reportFoundPath}
                                    className={`inline-flex items-center gap-2 rounded-xl border px-6 py-4 font-bold transition hover:-translate-y-0.5 ${
                                        isMinimal
                                            ? "text-slate-800 hover:bg-white"
                                            : "text-white hover:bg-white/10"
                                    }`}
                                    style={{
                                        borderColor: isMinimal
                                            ? borderLineColor
                                            : "rgba(255,255,255,0.3)",
                                        borderStyle,
                                        borderWidth: `${borderWidth}px`,
                                    }}
                                >
                                    <Package size={19} />
                                    Report Found Item
                                </Link>
                            </div>

                            <div
                                className={`mt-8 flex flex-wrap gap-5 text-sm ${
                                    isProfessional ? "justify-center" : ""
                                } ${
                                    isMinimal
                                        ? "text-slate-500"
                                        : "text-white/70"
                                }`}
                            >
                                <span className="flex items-center gap-2">
                                    <ShieldCheck size={17} />
                                    Trusted platform
                                </span>

                                <span className="flex items-center gap-2">
                                    <Heart size={17} />
                                    Helping reunite owners
                                </span>
                            </div>
                        </div>

                        {!isProfessional && (
                            <div className="hidden lg:block">
                                <div
                                    className={`mx-auto max-w-md rounded-3xl border p-8 ${
                                        isMinimal
                                            ? "shadow-xl"
                                            : "border-white/10 bg-white/10 shadow-2xl backdrop-blur"
                                    }`}
                                    style={
                                        isMinimal
                                            ? sectionCardStyle
                                            : {}
                                    }
                                >
                                    <div
                                        className="flex h-16 w-16 items-center justify-center rounded-2xl"
                                        style={{
                                            backgroundColor: isMinimal
                                                ? `${primaryColor}18`
                                                : "rgba(255,255,255,0.15)",
                                            color: isMinimal
                                                ? primaryColor
                                                : "#ffffff",
                                        }}
                                    >
                                        <Package size={34} />
                                    </div>

                                    <h3
                                        className="mt-6 text-2xl font-black"
                                        style={
                                            isMinimal
                                                ? { color: secondaryColor }
                                                : {}
                                        }
                                    >
                                        One community.
                                        <br />
                                        One shared purpose.
                                    </h3>

                                    <p
                                        className={`mt-4 leading-7 ${
                                            isMinimal
                                                ? "text-slate-600"
                                                : "text-white/75"
                                        }`}
                                    >
                                        Report belongings, help others find
                                        missing items, and make recovery easier
                                        for everyone.
                                    </p>

                                    <div
                                        className="mt-7 rounded-xl border p-4"
                                        style={{
                                            backgroundColor: isMinimal
                                                ? borderColor
                                                : "rgba(255,255,255,0.08)",
                                            borderColor: isMinimal
                                                ? borderLineColor
                                                : "rgba(255,255,255,0.15)",
                                            borderStyle,
                                            borderWidth: `${borderWidth}px`,
                                        }}
                                    >
                                        <div className="flex items-center gap-3">
                                            <CheckCircle
                                                size={23}
                                                style={{
                                                    color: isMinimal
                                                        ? primaryColor
                                                        : "#ffffff",
                                                }}
                                            />

                                            <div>
                                                <p
                                                    className="font-bold"
                                                    style={
                                                        isMinimal
                                                            ? {
                                                                  color: secondaryColor,
                                                              }
                                                            : {}
                                                    }
                                                >
                                                    Every item matters
                                                </p>

                                                <p
                                                    className={`mt-1 text-sm ${
                                                        isMinimal
                                                            ? "text-slate-500"
                                                            : "text-white/70"
                                                    }`}
                                                >
                                                    Let's help it find its way
                                                    home.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </section>

                {/* ABOUT */}
                {settings.show_about && (
                    <section
                        id="about"
                        className="px-5 py-20 sm:px-8 sm:py-24"
                        style={{ backgroundColor }}
                    >
                        <div className="mx-auto max-w-5xl">
                            <div className="mx-auto max-w-3xl text-center">
                                <span
                                    className="text-sm font-bold uppercase tracking-widest"
                                    style={{ color: primaryColor }}
                                >
                                    Our Story
                                </span>

                                <h3
                                    className="mt-4 text-3xl font-black sm:text-4xl"
                                    style={{ color: secondaryColor }}
                                >
                                    {settings.about_title}
                                </h3>

                                <p className="mt-6 whitespace-pre-wrap text-lg leading-8 text-slate-600">
                                    {settings.about_text}
                                </p>
                            </div>

                            <div className="mt-12 grid gap-5 sm:grid-cols-3">
                                {[
                                    {
                                        icon: Search,
                                        title: "Report",
                                        text: "Tell us about a lost or found item.",
                                    },
                                    {
                                        icon: Globe,
                                        title: "Connect",
                                        text: "Make it easier for owners and finders to connect.",
                                    },
                                    {
                                        icon: Heart,
                                        title: "Recover",
                                        text: "Help belongings return to their rightful owners.",
                                    },
                                ].map((item) => {
                                    const Icon = item.icon;

                                    return (
                                        <div
                                            key={item.title}
                                            className="rounded-2xl border p-6"
                                            style={sectionCardStyle}
                                        >
                                            <div
                                                className="inline-flex rounded-xl p-3"
                                                style={{
                                                    backgroundColor: `${primaryColor}18`,
                                                    color: primaryColor,
                                                }}
                                            >
                                                <Icon size={24} />
                                            </div>

                                            <h4
                                                className="mt-5 text-lg font-bold"
                                                style={{ color: secondaryColor }}
                                            >
                                                {item.title}
                                            </h4>

                                            <p className="mt-2 leading-7 text-slate-600">
                                                {item.text}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </section>
                )}

                {/* LOST AND FOUND */}
                {settings.show_featured_items && (
                    <section
                        id="items"
                        className="border-y px-5 py-20 sm:px-8 sm:py-24"
                        style={{
                            backgroundColor: borderColor,
                            borderTopColor: borderLineColor,
                            borderBottomColor: borderLineColor,
                            borderTopStyle: borderStyle,
                            borderBottomStyle: borderStyle,
                            borderTopWidth: `${borderWidth}px`,
                            borderBottomWidth: `${borderWidth}px`,
                        }}
                    >
                        <div className="mx-auto max-w-7xl">
                            <div className="mb-10 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
                                <div>
                                    <span
                                        className="text-sm font-bold uppercase tracking-widest"
                                        style={{ color: primaryColor }}
                                    >
                                        Community Listings
                                    </span>

                                    <h3
                                        className="mt-3 text-3xl font-black sm:text-4xl"
                                        style={{ color: secondaryColor }}
                                    >
                                        Lost &amp; Found Items
                                    </h3>

                                    <p className="mt-3 max-w-2xl leading-7 text-slate-600">
                                        Find out how you can help someone
                                        recover a missing possession.
                                    </p>
                                </div>

                                <Link
                                    to={reportLostPath}
                                    className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 font-bold text-white"
                                    style={{ backgroundColor: primaryColor }}
                                >
                                    Report an Item
                                    <ArrowRight size={18} />
                                </Link>
                            </div>

                            <div className="grid gap-6 md:grid-cols-2">
                                <article
                                    className="rounded-2xl border p-7 transition hover:shadow-md"
                                    style={sectionCardStyle}
                                >
                                    <div
                                        className="inline-flex rounded-xl p-3 text-white"
                                        style={{ backgroundColor: primaryColor }}
                                    >
                                        <Search size={25} />
                                    </div>

                                    <h4
                                        className="mt-5 text-xl font-bold"
                                        style={{ color: secondaryColor }}
                                    >
                                        Lost an Item?
                                    </h4>

                                    <p className="mt-3 leading-7 text-slate-600">
                                        Submit a lost-item report with details
                                        that can help identify your belongings.
                                    </p>

                                    <Link
                                        to={reportLostPath}
                                        className="mt-5 inline-flex items-center gap-2 font-bold"
                                        style={{ color: primaryColor }}
                                    >
                                        Report Lost Item
                                        <ArrowRight size={17} />
                                    </Link>
                                </article>

                                <article
                                    className="rounded-2xl border p-7 transition hover:shadow-md"
                                    style={sectionCardStyle}
                                >
                                    <div
                                        className="inline-flex rounded-xl p-3 text-white"
                                        style={{
                                            backgroundColor: secondaryColor,
                                        }}
                                    >
                                        <Package size={25} />
                                    </div>

                                    <h4
                                        className="mt-5 text-xl font-bold"
                                        style={{ color: secondaryColor }}
                                    >
                                        Found an Item?
                                    </h4>

                                    <p className="mt-3 leading-7 text-slate-600">
                                        Report something you have found so its
                                        owner has a better chance of recovering
                                        it.
                                    </p>

                                    <Link
                                        to={reportFoundPath}
                                        className="mt-5 inline-flex items-center gap-2 font-bold"
                                        style={{ color: primaryColor }}
                                    >
                                        Report Found Item
                                        <ArrowRight size={17} />
                                    </Link>
                                </article>
                            </div>

                            <p className="mt-6 text-sm text-slate-500">
                                These are reporting links. Live lost and found
                                listings need to be connected to your public
                                items API.
                            </p>
                        </div>
                    </section>
                )}

                {/* CONTACT */}
                {settings.show_contact && (
                    <section
                        id="contact"
                        className="px-5 py-20 sm:px-8 sm:py-24"
                        style={{ backgroundColor }}
                    >
                        <div className="mx-auto max-w-5xl">
                            <div className="mb-10 text-center">
                                <span
                                    className="text-sm font-bold uppercase tracking-widest"
                                    style={{ color: primaryColor }}
                                >
                                    Get in Touch
                                </span>

                                <h3
                                    className="mt-3 text-3xl font-black sm:text-4xl"
                                    style={{ color: secondaryColor }}
                                >
                                    Contact {companyName}
                                </h3>

                                <p className="mt-4 text-slate-600">
                                    We're here to help with your lost and found
                                    enquiries.
                                </p>
                            </div>

                            <div className="grid gap-5 sm:grid-cols-3">
                                {company.email && (
                                    <a
                                        href={`mailto:${company.email}`}
                                        className="rounded-2xl border p-6 transition hover:shadow-md"
                                        style={sectionCardStyle}
                                    >
                                        <Mail
                                            size={25}
                                            style={{ color: primaryColor }}
                                        />

                                        <h4 className="mt-4 font-bold">
                                            Email Us
                                        </h4>

                                        <p className="mt-2 break-all text-sm text-slate-600">
                                            {company.email}
                                        </p>
                                    </a>
                                )}

                                {company.phone && (
                                    <a
                                        href={`tel:${company.phone}`}
                                        className="rounded-2xl border p-6 transition hover:shadow-md"
                                        style={sectionCardStyle}
                                    >
                                        <Phone
                                            size={25}
                                            style={{ color: primaryColor }}
                                        />

                                        <h4 className="mt-4 font-bold">
                                            Call Us
                                        </h4>

                                        <p className="mt-2 text-sm text-slate-600">
                                            {company.phone}
                                        </p>
                                    </a>
                                )}

                                {company.location && (
                                    <div
                                        className="rounded-2xl border p-6"
                                        style={sectionCardStyle}
                                    >
                                        <MapPin
                                            size={25}
                                            style={{ color: primaryColor }}
                                        />

                                        <h4 className="mt-4 font-bold">
                                            Our Location
                                        </h4>

                                        <p className="mt-2 text-sm leading-6 text-slate-600">
                                            {company.location}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>
                )}
            </main>

            {/* FOOTER */}
            <footer
                className="px-5 py-10 text-white sm:px-8"
                style={{ backgroundColor: secondaryColor }}
            >
                <div className="mx-auto flex max-w-7xl flex-col justify-between gap-5 sm:flex-row sm:items-center">
                    <div>
                        <h4 className="text-xl font-black">
                            {companyName}
                        </h4>

                        <p className="mt-2 max-w-xl text-sm leading-6 text-white/70">
                            {settings.footer_text}
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-5 text-sm text-white/80">
                        <Link to={loginPath} className="hover:text-white">
                            Login
                        </Link>

                        <Link to={signupPath} className="hover:text-white">
                            Sign Up
                        </Link>

                        <Link
                            to={reportLostPath}
                            className="hover:text-white"
                        >
                            Report Lost Item
                        </Link>
                    </div>
                </div>

                <div
                    className="mx-auto mt-8 max-w-7xl border-t pt-6 text-xs text-white/50"
                    style={{
                        borderColor: borderLineColor,
                        borderStyle,
                        borderTopWidth: `${borderWidth}px`,
                    }}
                >
                    © {new Date().getFullYear()} {companyName}. All rights
                    reserved.
                </div>
            </footer>
        </div>
    );
}