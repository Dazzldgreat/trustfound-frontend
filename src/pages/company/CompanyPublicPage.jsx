import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { currentCustomDomain } from "../../utils/site";

import {
    AlertCircle,
    ArrowRight,
    Bell,
    CheckCircle,
    Globe,
    Heart,
    LayoutDashboard,
    Loader2,
    Mail,
    MapPin,
    Menu,
    Package,
    Phone,
    QrCode,
    Search,
    ShieldCheck,
    Sparkles,
    X,
} from "lucide-react";

import { API } from "../../config";
import { DEFAULT_WEBSITE_SETTINGS, readableTextColor, withAlpha, upgradeLegacyColor } from "../../theme";
import { CompanyMark } from "../../component/auth/AuthLayout";
const DEFAULT_SETTINGS = DEFAULT_WEBSITE_SETTINGS;

function normalizeColor(value, fallback) {
    value = upgradeLegacyColor(value);
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

export default function CompanyPublicPage({ slug: slugProp } = {}) {
    const params = useParams();
    // On a custom domain the slug comes from DomainGate, not the URL.
    const routeSlug = slugProp || params.slug;

    const [company, setCompany] = useState(null);
    const [settings, setSettings] = useState(DEFAULT_SETTINGS);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [settingsNotice, setSettingsNotice] = useState("");
    const [menuOpen, setMenuOpen] = useState(false);

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

                // A company with its own (real) domain: always send
                // visitors there, so the site and every login live on
                // the company's domain.
                const site = companyData.site;
                if (
                    site?.uses_custom_domain &&
                    site.domain_url &&
                    !site.domain_is_sandbox &&
                    !currentCustomDomain() &&
                    !["localhost", "127.0.0.1"].includes(window.location.hostname)
                ) {
                    window.location.replace(site.domain_url);
                    return;
                }

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
            <div className="flex min-h-screen items-center justify-center bg-cream">
                <div className="text-center">
                    <Loader2
                        size={40}
                        className="mx-auto animate-spin text-primary"
                    />
                    <p className="mt-4 text-sm font-semibold text-stone-500">
                        Loading company platform...
                    </p>
                </div>
            </div>
        );
    }

    if (error || !company) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-cream px-5">
                <div className="w-full max-w-md rounded-3xl border border-stone-200 bg-white p-8 text-center shadow-xl shadow-stone-900/5">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-primary">
                        <AlertCircle size={28} />
                    </div>

                    <h1 className="mt-5 text-2xl font-extrabold text-graphite">
                        Company not found
                    </h1>

                    <p className="mt-2 text-sm leading-relaxed text-stone-500">
                        {error ||
                            "This company platform is currently unavailable."}
                    </p>

                    <Link
                        to="/"
                        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 font-bold text-white transition hover:bg-primary-dark"
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

    const onPrimary = readableTextColor(primaryColor);
    const onSecondary = readableTextColor(secondaryColor);

    const cardStyle = {
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

    // Hero colours per template.
    const heroBackground = isProfessional ? secondaryColor : backgroundColor;
    const heroText = isProfessional ? onSecondary : secondaryColor;
    const heroMuted = isProfessional
        ? withAlpha(onSecondary, 0.75)
        : withAlpha(secondaryColor, 0.7);

    const encodedSlug = encodeURIComponent(companySlug);
    const companyBasePath = `/company/${encodedSlug}`;
    const loginPath = `/login-page?company=${encodedSlug}`;
    const signupPath = `/signup-page?company=${encodedSlug}`;
    const staffLoginPath = `${companyBasePath}/staff-login`;

    // A signed-in customer of this company goes straight to the forms.
    const signedIn = isSignedInTo(companySlug);
    const reportLostPath = signedIn
        ? `${companyBasePath}/customer-report`
        : loginPath;
    const reportFoundPath = signedIn
        ? `${companyBasePath}/found-item`
        : loginPath;
    const dashboardPath = `${companyBasePath}/dashboard`;

    const websiteUrl = company.website
        ? /^https?:\/\//i.test(company.website)
            ? company.website
            : `https://${company.website}`
        : "";

    const navLinks = [
        { href: "#how-it-works", label: "How it works", show: true },
        { href: "#about", label: "About", show: settings.show_about },
        { href: "#report", label: "Report an item", show: settings.show_featured_items },
        { href: "#contact", label: "Contact", show: settings.show_contact },
    ].filter((link) => link.show);

    const contactCards = [
        company.email && {
            icon: Mail,
            title: "Email us",
            value: company.email,
            href: `mailto:${company.email}`,
        },
        company.phone && {
            icon: Phone,
            title: "Call us",
            value: company.phone,
            href: `tel:${company.phone}`,
        },
        company.location && {
            icon: MapPin,
            title: "Visit us",
            value: company.location,
            href: `https://www.google.com/maps/search/${encodeURIComponent(company.location)}`,
        },
        websiteUrl && {
            icon: Globe,
            title: "Website",
            value: company.website.replace(/^https?:\/\//i, ""),
            href: websiteUrl,
        },
    ].filter(Boolean);

    const steps = [
        {
            icon: Search,
            title: "Report",
            text: "Describe what you lost or found and add a photo.",
        },
        {
            icon: Sparkles,
            title: "Match",
            text: `${companyName} staff and our matching system look for the right item.`,
        },
        {
            icon: QrCode,
            title: "Recover",
            text: "Verify it's yours and collect it safely with a QR code.",
        },
    ];

    return (
        <div
            className="min-h-screen text-ink"
            style={{ backgroundColor }}
        >
            {settingsNotice && (
                <div className="border-b border-amber-200 bg-amber-50">
                    <div className="mx-auto flex max-w-6xl items-start gap-2 px-4 py-2.5 text-sm text-amber-900 sm:px-6">
                        <AlertCircle size={17} className="mt-0.5 shrink-0" />
                        <p>{settingsNotice}</p>
                    </div>
                </div>
            )}

            {/* ======================= HEADER ======================= */}
            <header
                className="sticky top-0 z-40 bg-white/90 backdrop-blur-md"
                style={{
                    borderBottom: `${borderWidth}px ${borderStyle} ${borderLineColor}`,
                }}
            >
                <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:h-20 sm:px-6">
                    <Link
                        to={companyBasePath}
                        onClick={() => setMenuOpen(false)}
                        className="flex min-w-0 items-center gap-3"
                    >
                        <CompanyMark
                            name={companyName}
                            logoUrl={logoUrl}
                            primary={primaryColor}
                        />
                        <div className="min-w-0">
                            <p className="truncate font-extrabold text-graphite sm:text-lg">
                                {companyName}
                            </p>
                            <p className="text-xs text-stone-500">
                                Lost &amp; Found
                            </p>
                        </div>
                    </Link>

                    <nav className="hidden items-center gap-7 md:flex">
                        {navLinks.map((link) => (
                            <a
                                key={link.href}
                                href={link.href}
                                className="text-sm font-semibold text-stone-600 transition hover:text-graphite"
                            >
                                {link.label}
                            </a>
                        ))}
                    </nav>

                    <div className="hidden shrink-0 items-center gap-2 sm:flex">
                        {signedIn ? (
                            <Link
                                to={dashboardPath}
                                className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold shadow-md transition hover:brightness-95"
                                style={{ backgroundColor: primaryColor, color: onPrimary }}
                            >
                                <LayoutDashboard size={16} />
                                My dashboard
                            </Link>
                        ) : (
                            <>
                                <Link
                                    to={loginPath}
                                    className="rounded-xl px-4 py-2.5 text-sm font-semibold text-graphite transition hover:bg-stone-100"
                                >
                                    Log in
                                </Link>
                                <Link
                                    to={signupPath}
                                    className="rounded-xl px-4 py-2.5 text-sm font-bold shadow-md transition hover:brightness-95"
                                    style={{ backgroundColor: primaryColor, color: onPrimary }}
                                >
                                    Sign up
                                </Link>
                            </>
                        )}
                    </div>

                    <button
                        type="button"
                        onClick={() => setMenuOpen((open) => !open)}
                        aria-label={menuOpen ? "Close menu" : "Open menu"}
                        aria-expanded={menuOpen}
                        className="flex h-10 w-10 items-center justify-center rounded-xl text-graphite transition hover:bg-stone-100 sm:hidden"
                    >
                        {menuOpen ? <X size={22} /> : <Menu size={22} />}
                    </button>
                </div>

                {menuOpen && (
                    <div className="border-t border-stone-200 bg-white px-4 pb-5 pt-2 sm:hidden">
                        <nav className="flex flex-col">
                            {navLinks.map((link) => (
                                <a
                                    key={link.href}
                                    href={link.href}
                                    onClick={() => setMenuOpen(false)}
                                    className="rounded-lg px-2 py-3 font-semibold text-ink hover:bg-stone-50"
                                >
                                    {link.label}
                                </a>
                            ))}
                        </nav>
                        <div className="mt-3 grid grid-cols-2 gap-2">
                            {signedIn ? (
                                <Link
                                    to={dashboardPath}
                                    className="col-span-2 rounded-xl py-3 text-center font-bold"
                                    style={{ backgroundColor: primaryColor, color: onPrimary }}
                                >
                                    My dashboard
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        to={loginPath}
                                        className="rounded-xl border border-stone-200 py-3 text-center font-semibold text-graphite"
                                    >
                                        Log in
                                    </Link>
                                    <Link
                                        to={signupPath}
                                        className="rounded-xl py-3 text-center font-bold"
                                        style={{ backgroundColor: primaryColor, color: onPrimary }}
                                    >
                                        Sign up
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </header>

            <main>
                {/* ======================== HERO ======================== */}
                <section
                    id="home"
                    className="relative overflow-hidden"
                    style={{ backgroundColor: heroBackground, color: heroText }}
                >
                    {!isMinimal && (
                        <>
                            <div
                                className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full blur-3xl"
                                style={{ backgroundColor: withAlpha(primaryColor, isProfessional ? 0.35 : 0.2) }}
                            />
                            <div
                                className="pointer-events-none absolute -bottom-32 -left-24 h-80 w-80 rounded-full blur-3xl"
                                style={{ backgroundColor: withAlpha(primaryColor, 0.12) }}
                            />
                        </>
                    )}

                    <div
                        className={`relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 md:py-24 ${
                            isProfessional ? "text-center" : "md:grid-cols-[1.15fr_1fr]"
                        }`}
                    >
                        <div className={isProfessional ? "mx-auto max-w-3xl" : ""}>
                            <span
                                className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide"
                                style={{
                                    backgroundColor: isProfessional
                                        ? "rgba(255,255,255,0.12)"
                                        : withAlpha(primaryColor, 0.12),
                                    color: isProfessional ? onSecondary : primaryColor,
                                }}
                            >
                                <Sparkles size={14} />
                                {companyName} Lost &amp; Found
                            </span>

                            <h1 className="mt-5 text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl">
                                {settings.hero_title}
                            </h1>

                            <p
                                className={`mt-5 max-w-xl text-lg leading-relaxed ${
                                    isProfessional ? "mx-auto" : ""
                                }`}
                                style={{ color: heroMuted }}
                            >
                                {settings.hero_subtitle}
                            </p>

                            <div
                                className={`mt-8 flex flex-wrap gap-3 ${
                                    isProfessional ? "justify-center" : ""
                                }`}
                            >
                                <Link
                                    to={reportLostPath}
                                    className="inline-flex items-center gap-2 rounded-xl px-6 py-3.5 font-bold shadow-lg transition hover:-translate-y-0.5 hover:brightness-95"
                                    style={{
                                        backgroundColor: primaryColor,
                                        color: onPrimary,
                                        boxShadow: `0 12px 28px -12px ${withAlpha(primaryColor, 0.7)}`,
                                    }}
                                >
                                    <Search size={18} />
                                    I lost something
                                </Link>

                                <Link
                                    to={reportFoundPath}
                                    className="inline-flex items-center gap-2 rounded-xl border px-6 py-3.5 font-bold transition hover:-translate-y-0.5"
                                    style={{
                                        backgroundColor: isProfessional ? "transparent" : "#FFFFFF",
                                        borderColor: isProfessional
                                            ? "rgba(255,255,255,0.3)"
                                            : borderLineColor,
                                        color: isProfessional ? onSecondary : secondaryColor,
                                    }}
                                >
                                    <Package size={18} />
                                    I found something
                                </Link>
                            </div>

                            <div
                                className={`mt-7 flex flex-wrap gap-x-6 gap-y-2 text-sm ${
                                    isProfessional ? "justify-center" : ""
                                }`}
                                style={{ color: heroMuted }}
                            >
                                <span className="inline-flex items-center gap-2">
                                    <ShieldCheck size={16} style={{ color: primaryColor }} />
                                    Owners verified by staff
                                </span>
                                <span className="inline-flex items-center gap-2">
                                    <CheckCircle size={16} style={{ color: primaryColor }} />
                                    Free to use
                                </span>
                            </div>
                        </div>

                        {!isProfessional && (
                            <div className="relative hidden md:block">
                                <div
                                    className="rounded-3xl p-6 shadow-xl shadow-stone-900/5"
                                    style={cardStyle}
                                >
                                    <div className="flex items-center gap-4">
                                        <CompanyMark
                                            name={companyName}
                                            logoUrl={logoUrl}
                                            primary={primaryColor}
                                            size="lg"
                                        />
                                        <div className="min-w-0">
                                            <p className="truncate text-lg font-extrabold text-graphite">
                                                {companyName}
                                            </p>
                                            {company.location && (
                                                <p className="mt-0.5 flex items-center gap-1.5 truncate text-sm text-stone-500">
                                                    <MapPin size={14} />
                                                    {company.location}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {company.description && (
                                        <p className="mt-5 line-clamp-4 leading-relaxed text-stone-600">
                                            {company.description}
                                        </p>
                                    )}

                                    <div className="mt-6 space-y-2.5">
                                        {steps.map((step, index) => (
                                            <div
                                                key={step.title}
                                                className="flex items-center gap-3 rounded-2xl px-3 py-2.5"
                                                style={{ backgroundColor: withAlpha(primaryColor, 0.06) }}
                                            >
                                                <span
                                                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-extrabold"
                                                    style={{ backgroundColor: primaryColor, color: onPrimary }}
                                                >
                                                    {index + 1}
                                                </span>
                                                <span className="font-semibold text-graphite">
                                                    {step.title}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </section>

                {/* ==================== HOW IT WORKS ==================== */}
                <section id="how-it-works" className="scroll-mt-24 bg-white px-4 py-16 sm:px-6 md:py-20">
                    <div className="mx-auto max-w-6xl">
                        <SectionTitle
                            eyebrow="How it works"
                            title="From lost to returned in three steps"
                            primary={primaryColor}
                            secondary={secondaryColor}
                        />

                        <div className="mt-10 grid gap-5 md:grid-cols-3">
                            {steps.map((step, index) => (
                                <div
                                    key={step.title}
                                    className="rounded-3xl p-6 transition hover:-translate-y-1 hover:shadow-lg hover:shadow-stone-900/5"
                                    style={{ ...cardStyle, backgroundColor: backgroundColor }}
                                >
                                    <div className="flex items-center justify-between">
                                        <div
                                            className="flex h-12 w-12 items-center justify-center rounded-2xl"
                                            style={{ backgroundColor: primaryColor, color: onPrimary }}
                                        >
                                            <step.icon size={22} />
                                        </div>
                                        <span
                                            className="text-4xl font-extrabold"
                                            style={{ color: withAlpha(primaryColor, 0.25) }}
                                        >
                                            0{index + 1}
                                        </span>
                                    </div>
                                    <h3
                                        className="mt-5 text-xl font-bold"
                                        style={{ color: secondaryColor }}
                                    >
                                        {step.title}
                                    </h3>
                                    <p className="mt-2 leading-relaxed text-stone-600">
                                        {step.text}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ======================== ABOUT ======================== */}
                {settings.show_about && (
                    <section id="about" className="scroll-mt-24 px-4 py-16 sm:px-6 md:py-20">
                        <div className="mx-auto grid max-w-6xl items-center gap-10 md:grid-cols-[1fr_1.2fr]">
                            <div>
                                <SectionTitle
                                    eyebrow="About us"
                                    title={settings.about_title}
                                    primary={primaryColor}
                                    secondary={secondaryColor}
                                />
                                <p className="mt-5 whitespace-pre-wrap text-lg leading-relaxed text-stone-600">
                                    {settings.about_text ||
                                        company.description ||
                                        `${companyName} uses TrustFound to reunite people with their belongings.`}
                                </p>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                {[
                                    { icon: ShieldCheck, title: "Verified handover", text: "Staff confirm the owner before any item is released." },
                                    { icon: Sparkles, title: "Smart matching", text: "Photos and descriptions are compared to find matches fast." },
                                    { icon: Bell, title: "Instant updates", text: "You're notified as soon as there's news about your item." },
                                    { icon: Heart, title: "Community driven", text: "Everyone who reports a find helps someone get theirs back." },
                                ].map((feature) => (
                                    <div
                                        key={feature.title}
                                        className="rounded-2xl p-5"
                                        style={cardStyle}
                                    >
                                        <feature.icon size={22} style={{ color: primaryColor }} />
                                        <h4
                                            className="mt-3 font-bold"
                                            style={{ color: secondaryColor }}
                                        >
                                            {feature.title}
                                        </h4>
                                        <p className="mt-1 text-sm leading-relaxed text-stone-600">
                                            {feature.text}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                {/* ===================== REPORT ITEMS ===================== */}
                {settings.show_featured_items && (
                    <section id="report" className="scroll-mt-24 bg-white px-4 py-16 sm:px-6 md:py-20">
                        <div className="mx-auto max-w-6xl">
                            <SectionTitle
                                eyebrow="Report an item"
                                title="Lost or found something?"
                                description={
                                    signedIn
                                        ? "Pick one below to open the report form."
                                        : "Log in or create a free account to send a report. It only takes a minute."
                                }
                                primary={primaryColor}
                                secondary={secondaryColor}
                            />

                            <div className="mt-10 grid gap-5 md:grid-cols-2">
                                {[
                                    {
                                        to: reportLostPath,
                                        icon: Search,
                                        title: "I lost an item",
                                        text: "Tell us what it looks like and where you last had it. We'll alert you when there's a match.",
                                        cta: "Report lost item",
                                        dark: false,
                                    },
                                    {
                                        to: reportFoundPath,
                                        icon: Package,
                                        title: "I found an item",
                                        text: "Report what you found so its owner can be identified and get it back safely.",
                                        cta: "Report found item",
                                        dark: true,
                                    },
                                ].map((card) => (
                                    <Link
                                        key={card.title}
                                        to={card.to}
                                        className="group rounded-3xl p-7 transition hover:-translate-y-1 hover:shadow-xl hover:shadow-stone-900/10"
                                        style={
                                            card.dark
                                                ? { backgroundColor: secondaryColor, color: onSecondary }
                                                : { ...cardStyle, backgroundColor }
                                        }
                                    >
                                        <div
                                            className="flex h-12 w-12 items-center justify-center rounded-2xl"
                                            style={{ backgroundColor: primaryColor, color: onPrimary }}
                                        >
                                            <card.icon size={22} />
                                        </div>
                                        <h3
                                            className="mt-5 text-2xl font-extrabold"
                                            style={card.dark ? {} : { color: secondaryColor }}
                                        >
                                            {card.title}
                                        </h3>
                                        <p
                                            className="mt-2 leading-relaxed"
                                            style={{
                                                color: card.dark
                                                    ? withAlpha(onSecondary, 0.75)
                                                    : undefined,
                                            }}
                                        >
                                            {card.text}
                                        </p>
                                        <span
                                            className="mt-6 inline-flex items-center gap-2 font-bold"
                                            style={{ color: card.dark ? onSecondary : primaryColor }}
                                        >
                                            {card.cta}
                                            <ArrowRight size={17} className="transition group-hover:translate-x-1" />
                                        </span>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                {/* ======================= CONTACT ======================= */}
                {settings.show_contact && (
                    <section id="contact" className="scroll-mt-24 px-4 py-16 sm:px-6 md:py-20">
                        <div className="mx-auto max-w-6xl">
                            <SectionTitle
                                eyebrow="Get in touch"
                                title={`Contact ${companyName}`}
                                description="Questions about a lost or found item? We're here to help."
                                primary={primaryColor}
                                secondary={secondaryColor}
                            />

                            {contactCards.length > 0 ? (
                                <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                    {contactCards.map((card) => (
                                        <a
                                            key={card.title}
                                            href={card.href}
                                            target={card.href.startsWith("http") ? "_blank" : undefined}
                                            rel={card.href.startsWith("http") ? "noreferrer" : undefined}
                                            className="group rounded-2xl p-5 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-stone-900/5"
                                            style={cardStyle}
                                        >
                                            <div
                                                className="flex h-11 w-11 items-center justify-center rounded-xl"
                                                style={{
                                                    backgroundColor: withAlpha(primaryColor, 0.1),
                                                    color: primaryColor,
                                                }}
                                            >
                                                <card.icon size={20} />
                                            </div>
                                            <p
                                                className="mt-4 font-bold"
                                                style={{ color: secondaryColor }}
                                            >
                                                {card.title}
                                            </p>
                                            <p className="mt-1 break-words text-sm text-stone-600 group-hover:underline">
                                                {card.value}
                                            </p>
                                        </a>
                                    ))}
                                </div>
                            ) : (
                                <p className="mt-8 rounded-2xl p-5 text-stone-600" style={cardStyle}>
                                    Contact details haven&apos;t been added yet.
                                </p>
                            )}
                        </div>
                    </section>
                )}

                {/* ======================= CTA BAND ======================= */}
                {!signedIn && (
                    <section className="px-4 pb-16 sm:px-6 md:pb-20">
                        <div
                            className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 rounded-[2rem] p-8 sm:p-10 md:flex-row md:items-center"
                            style={{ backgroundColor: secondaryColor, color: onSecondary }}
                        >
                            <div>
                                <h2 className="text-2xl font-extrabold sm:text-3xl">
                                    Ready to get started?
                                </h2>
                                <p className="mt-2" style={{ color: withAlpha(onSecondary, 0.7) }}>
                                    Create a free {companyName} account to report and track items.
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-3">
                                <Link
                                    to={signupPath}
                                    className="inline-flex items-center gap-2 rounded-xl px-6 py-3.5 font-bold transition hover:brightness-95"
                                    style={{ backgroundColor: primaryColor, color: onPrimary }}
                                >
                                    Create account
                                    <ArrowRight size={18} />
                                </Link>
                                <Link
                                    to={loginPath}
                                    className="inline-flex items-center rounded-xl border px-6 py-3.5 font-semibold transition hover:bg-white/10"
                                    style={{ borderColor: withAlpha(onSecondary, 0.25) }}
                                >
                                    Log in
                                </Link>
                            </div>
                        </div>
                    </section>
                )}
            </main>

            {/* ======================== FOOTER ======================== */}
            <footer
                className="bg-white"
                style={{ borderTop: `${borderWidth}px ${borderStyle} ${borderLineColor}` }}
            >
                <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1.5fr_1fr_1fr]">
                    <div>
                        <div className="flex items-center gap-3">
                            <CompanyMark
                                name={companyName}
                                logoUrl={logoUrl}
                                primary={primaryColor}
                            />
                            <p className="font-extrabold text-graphite">{companyName}</p>
                        </div>
                        <p className="mt-3 max-w-sm text-sm leading-relaxed text-stone-500">
                            {settings.footer_text}
                        </p>
                    </div>

                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-stone-400">
                            Customers
                        </p>
                        <ul className="mt-3 space-y-2 text-sm">
                            {(signedIn
                                ? [
                                      { to: dashboardPath, label: "My dashboard" },
                                      { to: reportLostPath, label: "Report lost item" },
                                      { to: reportFoundPath, label: "Report found item" },
                                  ]
                                : [
                                      { to: loginPath, label: "Log in" },
                                      { to: signupPath, label: "Create account" },
                                      { to: reportLostPath, label: "Report lost item" },
                                  ]
                            ).map((link) => (
                                <li key={link.label}>
                                    <Link
                                        to={link.to}
                                        className="font-semibold text-stone-600 transition hover:text-graphite"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-stone-400">
                            Staff
                        </p>
                        <ul className="mt-3 space-y-2 text-sm">
                            <li>
                                <Link
                                    to={staffLoginPath}
                                    className="inline-flex items-center gap-1.5 font-semibold text-stone-600 transition hover:text-graphite"
                                >
                                    <ShieldCheck size={15} style={{ color: primaryColor }} />
                                    Staff login
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-stone-100">
                    <p className="mx-auto max-w-6xl px-4 py-5 text-xs text-stone-400 sm:px-6">
                        © {new Date().getFullYear()} {companyName} · Powered by{" "}
                        <Link to="/" className="font-semibold hover:text-primary">
                            TrustFound
                        </Link>
                    </p>
                </div>
            </footer>
        </div>
    );
}

function SectionTitle({ eyebrow, title, description, primary, secondary }) {
    return (
        <div className="max-w-2xl">
            <p
                className="text-sm font-bold uppercase tracking-wide"
                style={{ color: primary }}
            >
                {eyebrow}
            </p>
            <h2
                className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl"
                style={{ color: secondary }}
            >
                {title}
            </h2>
            {description && (
                <p className="mt-3 leading-relaxed text-stone-600">{description}</p>
            )}
        </div>
    );
}

function isSignedInTo(slug) {
    try {
        const token =
            localStorage.getItem("access_token") ||
            localStorage.getItem("access");

        if (!token) return false;

        const user = JSON.parse(localStorage.getItem("user") || "{}");
        const storedSlug =
            localStorage.getItem("companySlug") ||
            localStorage.getItem("company_slug");

        // Only customers of this company (not staff or admins).
        const role = String(user.role || "user").toLowerCase();

        return storedSlug === slug && ["user", "customer"].includes(role);
    } catch {
        return false;
    }
}
