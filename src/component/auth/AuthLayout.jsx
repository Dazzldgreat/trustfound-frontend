import { useState } from "react";
import { Link } from "react-router-dom";
import {
    AlertCircle,
    ArrowLeft,
    CheckCircle2,
    Eye,
    EyeOff,
    Loader2,
} from "lucide-react";

import { BRAND, readableTextColor, withAlpha } from "../../theme";

/* ============================================================
   SHARED AUTH UI (login, signup)
   Uses the company's colours when available and falls back to
   the TrustFound Orange & Graphite palette.
============================================================ */

const HIGHLIGHTS = [
    "Report lost or found items in a minute",
    "Get notified the moment a match is found",
    "Collect your item safely with a QR code",
];

export function CompanyMark({ name, logoUrl, primary, size = "md" }) {
    const [failed, setFailed] = useState(false);
    const dims = size === "lg" ? "h-14 w-14 text-lg" : "h-11 w-11 text-sm";

    if (logoUrl && !failed) {
        return (
            <img
                src={logoUrl}
                alt={`${name} logo`}
                onError={() => setFailed(true)}
                className={`${dims} shrink-0 rounded-xl bg-white object-contain p-1 shadow-sm`}
            />
        );
    }

    return (
        <div
            className={`${dims} flex shrink-0 items-center justify-center rounded-xl font-extrabold shadow-sm`}
            style={{
                backgroundColor: primary,
                color: readableTextColor(primary),
            }}
        >
            {(name || "TF").substring(0, 2).toUpperCase()}
        </div>
    );
}

export default function AuthLayout({
    companyName = "TrustFound",
    logoUrl = "",
    primary = BRAND.primary,
    secondary = BRAND.graphite,
    background = BRAND.background,
    backTo = "/",
    backLabel,
    tagline,
    children,
}) {
    const panelText = readableTextColor(secondary);

    return (
        <div
            className="min-h-screen lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]"
            style={{ backgroundColor: background }}
        >
            {/* BRAND PANEL (desktop) */}
            <aside
                className="relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-between lg:p-12"
                style={{ backgroundColor: secondary, color: panelText }}
            >
                <div
                    className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full blur-3xl"
                    style={{ backgroundColor: withAlpha(primary, 0.35) }}
                />
                <div
                    className="pointer-events-none absolute -bottom-32 -left-20 h-80 w-80 rounded-full blur-3xl"
                    style={{ backgroundColor: withAlpha(primary, 0.18) }}
                />

                <Link
                    to={backTo}
                    className="relative inline-flex w-fit items-center gap-3"
                >
                    <CompanyMark
                        name={companyName}
                        logoUrl={logoUrl}
                        primary={primary}
                    />
                    <span className="text-lg font-bold">{companyName}</span>
                </Link>

                <div className="relative max-w-md">
                    <h2 className="text-4xl font-extrabold leading-tight tracking-tight">
                        Lost &amp; Found,
                        <br />
                        <span style={{ color: primary }}>handled with care.</span>
                    </h2>

                    {tagline && (
                        <p className="mt-4 leading-relaxed opacity-75">
                            {tagline}
                        </p>
                    )}

                    <ul className="mt-8 space-y-4">
                        {HIGHLIGHTS.map((item) => (
                            <li key={item} className="flex items-start gap-3">
                                <CheckCircle2
                                    size={20}
                                    className="mt-0.5 shrink-0"
                                    style={{ color: primary }}
                                />
                                <span className="opacity-90">{item}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                <p className="relative text-sm opacity-60">
                    © {new Date().getFullYear()} {companyName} · Powered by TrustFound
                </p>
            </aside>

            {/* FORM SIDE */}
            <main className="flex min-h-screen flex-col px-4 py-6 sm:px-8 lg:min-h-0 lg:py-10">
                <Link
                    to={backTo}
                    className="inline-flex w-fit items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-semibold text-stone-600 transition hover:bg-white hover:text-graphite"
                >
                    <ArrowLeft size={16} />
                    {backLabel || `Back to ${companyName}`}
                </Link>

                <div className="flex flex-1 items-center justify-center py-8">
                    <div className="w-full max-w-md">
                        {/* Mobile brand header */}
                        <div className="mb-6 flex items-center gap-3 lg:hidden">
                            <CompanyMark
                                name={companyName}
                                logoUrl={logoUrl}
                                primary={primary}
                            />
                            <div>
                                <p className="font-bold text-graphite">
                                    {companyName}
                                </p>
                                <p className="text-xs text-stone-500">
                                    Lost &amp; Found
                                </p>
                            </div>
                        </div>

                        <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-xl shadow-stone-900/5 sm:p-8">
                            {children}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

/* ============================================================
   FORM PIECES
============================================================ */

export function AuthHeading({ title, subtitle }) {
    return (
        <div className="mb-6">
            <h1 className="text-2xl font-extrabold tracking-tight text-graphite sm:text-3xl">
                {title}
            </h1>
            {subtitle && (
                <p className="mt-1.5 text-sm text-stone-500">{subtitle}</p>
            )}
        </div>
    );
}

export function AuthAlert({ children, tone = "error" }) {
    if (!children) return null;

    const styles =
        tone === "success"
            ? "border-green-200 bg-green-50 text-green-800"
            : "border-red-200 bg-red-50 text-red-700";

    const Icon = tone === "success" ? CheckCircle2 : AlertCircle;

    return (
        <div
            role="alert"
            className={`mb-5 flex items-start gap-2.5 rounded-xl border px-4 py-3 text-sm ${styles}`}
        >
            <Icon size={18} className="mt-0.5 shrink-0" />
            <span>{children}</span>
        </div>
    );
}

export function AuthField({
    id,
    label,
    icon: Icon,
    type = "text",
    hint,
    action,
    primary = BRAND.primary,
    ...inputProps
}) {
    const [visible, setVisible] = useState(false);
    const isPassword = type === "password";

    return (
        <div>
            <div className="mb-1.5 flex items-center justify-between gap-3">
                <label
                    htmlFor={id}
                    className="text-sm font-semibold text-graphite"
                >
                    {label}
                </label>
                {action}
            </div>

            <div className="relative">
                {Icon && (
                    <Icon
                        size={18}
                        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400"
                    />
                )}

                <input
                    id={id}
                    name={id}
                    type={isPassword && visible ? "text" : type}
                    className={`w-full rounded-xl border border-stone-200 bg-white py-3 text-graphite outline-none transition placeholder:text-stone-400 focus:ring-4 disabled:opacity-60 ${
                        Icon ? "pl-11" : "pl-4"
                    } ${isPassword ? "pr-12" : "pr-4"}`}
                    style={{
                        "--tw-ring-color": withAlpha(primary, 0.15),
                    }}
                    onFocus={(event) => {
                        event.currentTarget.style.borderColor = primary;
                    }}
                    onBlur={(event) => {
                        event.currentTarget.style.borderColor = "";
                    }}
                    {...inputProps}
                />

                {isPassword && (
                    <button
                        type="button"
                        onClick={() => setVisible((v) => !v)}
                        aria-label={visible ? "Hide password" : "Show password"}
                        className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-stone-400 transition hover:bg-stone-100 hover:text-graphite"
                    >
                        {visible ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                )}
            </div>

            {hint && <p className="mt-1.5 text-xs text-stone-500">{hint}</p>}
        </div>
    );
}

export function AuthSubmit({ loading, loadingText, children, primary = BRAND.primary }) {
    return (
        <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 font-bold shadow-lg transition hover:-translate-y-0.5 hover:brightness-95 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
            style={{
                backgroundColor: primary,
                color: readableTextColor(primary),
                boxShadow: `0 10px 24px -10px ${withAlpha(primary, 0.6)}`,
            }}
        >
            {loading ? (
                <>
                    <Loader2 size={18} className="animate-spin" />
                    {loadingText}
                </>
            ) : (
                children
            )}
        </button>
    );
}

/** Full-screen message for loading / error states. */
export function AuthMessage({
    loading = false,
    title,
    message,
    actionTo = "/",
    actionLabel = "Back to TrustFound",
    primary = BRAND.primary,
    background = BRAND.background,
}) {
    return (
        <div
            className="flex min-h-screen items-center justify-center px-4 py-10"
            style={{ backgroundColor: background }}
        >
            <div className="w-full max-w-md rounded-3xl border border-stone-200 bg-white p-8 text-center shadow-xl shadow-stone-900/5">
                {loading ? (
                    <Loader2
                        size={36}
                        className="mx-auto animate-spin"
                        style={{ color: primary }}
                    />
                ) : (
                    <div
                        className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl"
                        style={{
                            backgroundColor: withAlpha(primary, 0.1),
                            color: primary,
                        }}
                    >
                        <AlertCircle size={28} />
                    </div>
                )}

                {title && (
                    <h1 className="mt-5 text-2xl font-extrabold text-graphite">
                        {title}
                    </h1>
                )}

                {message && (
                    <p className="mt-2 text-sm leading-relaxed text-stone-500">
                        {message}
                    </p>
                )}

                {!loading && actionTo && (
                    <Link
                        to={actionTo}
                        className="mt-6 inline-flex items-center gap-2 rounded-xl px-5 py-3 font-bold"
                        style={{
                            backgroundColor: primary,
                            color: readableTextColor(primary),
                        }}
                    >
                        <ArrowLeft size={17} />
                        {actionLabel}
                    </Link>
                )}
            </div>
        </div>
    );
}
