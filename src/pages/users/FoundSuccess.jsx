
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import QRCode from "react-qr-code";
import {
    CheckCircle,
    Clock,
    Copy,
    ScanLine,
    ShieldCheck,
} from "lucide-react";

import { API, API_BASE_URL } from "../../config";
import { upgradeLegacyColor } from "../../theme";

const DEFAULT_WEBSITE_SETTINGS = {
    primary_color: "#EA580C",
    secondary_color: "#C2410C",
    background_color: "#F6EFE7",
    text_color: "#44403C",
    heading_color: "#292524",
    card_color: "#ffffff",
    button_text_color: "#ffffff",
    border_color: "#ffffff",
    border_line_color: "#E9E1D8",
    border_style: "solid",
    border_width: 1,
    border_radius: 16,
    content_width: 1024,
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

function getStoredObject(key) {
    try {
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) : null;
    } catch {
        return null;
    }
}

function isValidColor(value) {
    if (typeof value !== "string") return false;

    return (
        /^#[0-9a-fA-F]{3,8}$/.test(value) ||
        /^rgba?\(\s*[\d.%\s,]+\)$/.test(value) ||
        /^hsla?\(\s*[\d.%\s,deg]+\)$/.test(value)
    );
}

function getValidColor(value, fallback) {
    value = upgradeLegacyColor(value);
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

function FoundSuccess() {
    const { id, companySlug } = useParams();
    const navigate = useNavigate();

    const storedCompany = getStoredObject("company");
    const storedUser = getStoredObject("user");

    const access =
        localStorage.getItem("access_token") ||
        localStorage.getItem("access");

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

    // COMPANY ROUTE

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

    // WEBSITE SETTINGS

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
                console.error("WEBSITE SETTINGS ERROR:", error);
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
    };

    // ITEM STATE

    const [item, setItem] = useState(null);
    const [loading, setLoading] = useState(true);

    // FETCH REPORTED ITEM

    const fetchItem = useCallback(async () => {
        if (!id) {
            navigate(companyRoute("/dashboard"));
            return;
        }

        if (!access) {
            alert("Your session has expired. Please login again.");
            navigate(companyRoute("/login-page"));
            return;
        }

        try {
            setLoading(true);

            const response = await fetch(
                `${API}/found-items/${id}/`,
                {
                    headers: {
                        Authorization: `Bearer ${access}`,
                    },
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.detail ||
                    data.error ||
                    "Failed to load found item."
                );
            }

            setItem(data);
        } catch (error) {
            console.error("ERROR LOADING FOUND ITEM:", error);

            alert(error.message || "Unable to load found item.");

            navigate(companyRoute("/dashboard"));
        } finally {
            setLoading(false);
        }
    }, [id, access, navigate, companyRoute]);

    useEffect(() => {
        fetchItem();
    }, [fetchItem]);

    // IMAGE URL

    const getImageUrl = (imagePath) => {
        if (!imagePath) return "";

        if (
            imagePath.startsWith("http://") ||
            imagePath.startsWith("https://")
        ) {
            return imagePath;
        }

        return `${API_BASE_URL}${
            imagePath.startsWith("/")
                ? imagePath
                : `/${imagePath}`
        }`;
    };

    // VERIFICATION CODE

    const verificationCode = item?.verification_token
        ? String(item.verification_token)
        : "";

    // QR CODE VALUE

    const qrValue = verificationCode
        ? `${API}/staff/verify-found-item/${verificationCode}/`
        : "";

    // COPY VERIFICATION CODE

    const copyVerificationCode = async () => {
        if (!verificationCode) return;

        try {
            await navigator.clipboard.writeText(verificationCode);
            alert("Verification code copied successfully.");
        } catch (error) {
            console.error("COPY ERROR:", error);
            alert("Unable to copy code. Please copy it manually.");
        }
    };

    // LOADING

    if (loading) {
        return (
            <div
                className="min-h-screen flex items-center justify-center"
                style={{
                    ...themeStyle,
                    backgroundColor: "var(--site-background)",
                    color: "var(--site-text)",
                }}
            >
                <div className="text-center">
                    <div
                        className="w-14 h-14 mx-auto rounded-full border-4 animate-spin"
                        style={{
                            borderColor: "var(--site-primary)",
                            borderTopColor: "transparent",
                        }}
                    />

                    <h2 className="text-xl font-bold mt-5">
                        Loading submission...
                    </h2>

                    <p className="mt-2 opacity-70">
                        Please wait while we retrieve your submission.
                    </p>
                </div>
            </div>
        );
    }

    // ITEM NOT FOUND

    if (!item) {
        return (
            <div
                className="min-h-screen flex items-center justify-center px-4"
                style={{
                    ...themeStyle,
                    backgroundColor: "var(--site-background)",
                    color: "var(--site-text)",
                }}
            >
                <div className="text-center">
                    <h2 className="text-xl font-bold">
                        Found item could not be loaded.
                    </h2>

                    <button
                        type="button"
                        onClick={() => navigate(companyRoute("/dashboard"))}
                        className="mt-5 px-6 py-3 font-semibold rounded-lg"
                        style={{
                            backgroundColor: "var(--site-primary)",
                            color: "var(--site-button-text)",
                        }}
                    >
                        Return to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    // PAGE

    return (
        <div
            className="found-success-theme min-h-screen py-10 px-4 sm:px-6"
            style={{
                ...themeStyle,
                backgroundColor: "var(--site-background)",
                color: "var(--site-text)",
                fontFamily: "var(--site-font)",
            }}
        >
            <style>{`
                .found-success-theme {
                    background: var(--site-background);
                    color: var(--site-text);
                    font-family: var(--site-font);
                }

                .found-success-theme .site-card {
                    background: var(--site-card);
                    border-color: var(--site-border-line);
                    border-style: var(--site-border-style);
                    border-width: var(--site-border-width);
                    border-radius: var(--site-radius);
                }

                .found-success-theme .site-heading {
                    color: var(--site-heading);
                }

                .found-success-theme .site-muted {
                    color: var(--site-text);
                    opacity: 0.72;
                }

                .found-success-theme .site-surface {
                    background: var(--site-border-fill);
                    border-color: var(--site-border-line);
                    border-style: var(--site-border-style);
                    border-width: var(--site-border-width);
                    border-radius: var(--site-radius);
                }

                .found-success-theme .site-button {
                    background: var(--site-primary);
                    color: var(--site-button-text);
                    border-radius: var(--site-radius);
                }

                .found-success-theme .site-button:hover {
                    background: var(--site-secondary);
                }
            `}</style>

            <div
                className="mx-auto w-full"
                style={{
                    maxWidth: "var(--site-content-width)",
                }}
            >
                {/* SUBMISSION CONFIRMATION */}

                <div className="site-card shadow-xl overflow-hidden">
                    <div
                        className="p-8"
                        style={{
                            backgroundColor: "var(--site-primary)",
                            color: "var(--site-button-text)",
                        }}
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shrink-0">
                                <CheckCircle
                                    size={44}
                                    style={{
                                        color: "var(--site-primary)",
                                    }}
                                />
                            </div>

                            <div>
                                <h1 className="text-2xl md:text-3xl font-bold">
                                    Found Item Reported Successfully
                                </h1>

                                <p className="mt-2 opacity-90">
                                    Your report has been saved. Your verification
                                    QR code and code are ready.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="grid lg:grid-cols-2 gap-10 p-6 md:p-10">
                        {/* ITEM INFORMATION */}

                        <div>
                            <h2 className="text-2xl font-bold mb-6 site-heading">
                                Item Information
                            </h2>

                            {item.image ? (
                                <img
                                    src={getImageUrl(item.image)}
                                    alt={item.item_name || "Found item"}
                                    className="w-full h-80 object-cover"
                                    style={{
                                        borderRadius: "var(--site-radius)",
                                        border: "var(--site-border-width) var(--site-border-style) var(--site-border-line)",
                                    }}
                                />
                            ) : (
                                <div className="w-full h-80 flex items-center justify-center site-surface site-muted">
                                    No Image Uploaded
                                </div>
                            )}

                            <div className="mt-8 space-y-4">
                                <div className="flex justify-between gap-5">
                                    <span className="font-semibold">Item Name</span>
                                    <span className="text-right">
                                        {item.item_name || "—"}
                                    </span>
                                </div>

                                <div className="flex justify-between gap-5">
                                    <span className="font-semibold">Category</span>
                                    <span className="text-right">
                                        {item.category || "—"}
                                    </span>
                                </div>

                                <div className="flex justify-between gap-5">
                                    <span className="font-semibold">Location Found</span>
                                    <span className="text-right">
                                        {item.location_found || item.location || "—"}
                                    </span>
                                </div>

                                <div className="flex justify-between gap-5">
                                    <span className="font-semibold">Date Found</span>
                                    <span className="text-right">
                                        {item.date_found || "—"}
                                    </span>
                                </div>

                                {item.time_found && (
                                    <div className="flex justify-between gap-5">
                                        <span className="font-semibold">Time Found</span>
                                        <span className="text-right">
                                            {item.time_found}
                                        </span>
                                    </div>
                                )}

                                <div>
                                    <p className="font-semibold mb-2">Description</p>
                                    <p className="site-muted">
                                        {item.description || "No description provided."}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* QR AND VERIFICATION CODE */}

                        <div>
                            <h2 className="text-2xl font-bold mb-2 site-heading">
                                Your Verification QR Code
                            </h2>

                            <p className="site-muted mb-6">
                                Keep this QR code and verification code safe.
                                Staff will use either one to retrieve your report.
                            </p>

                            <div className="site-surface p-8 flex flex-col items-center">
                                {qrValue ? (
                                    <div className="bg-white p-4 rounded-xl">
                                        <QRCode
                                            value={qrValue}
                                            size={240}
                                        />
                                    </div>
                                ) : (
                                    <p className="site-muted">
                                        Verification QR is not available.
                                    </p>
                                )}

                                <div className="flex items-center gap-2 mt-6 font-semibold">
                                    <ScanLine
                                        size={22}
                                        style={{
                                            color: "var(--site-primary)",
                                        }}
                                    />
                                    QR Code Ready
                                </div>

                                <p className="site-muted text-sm text-center mt-2">
                                    Present this QR code to a staff member.
                                </p>
                            </div>

                            {/* MANUAL CODE */}

                            <div className="site-card shadow p-6 mt-6">
                                <div className="flex items-center gap-2 mb-3">
                                    <ShieldCheck
                                        size={22}
                                        style={{
                                            color: "var(--site-primary)",
                                        }}
                                    />

                                    <h3 className="font-bold site-heading">
                                        Manual Verification Code
                                    </h3>
                                </div>

                                <p className="site-muted text-sm mb-4">
                                    If the QR code cannot be scanned, give staff
                                    this code instead.
                                </p>

                                <div
                                    className="p-4 rounded-lg text-center break-all font-mono font-bold text-lg tracking-wide"
                                    style={{
                                        backgroundColor: "var(--site-border-fill)",
                                        border: "1px solid var(--site-border-line)",
                                    }}
                                >
                                    {verificationCode || "Code unavailable"}
                                </div>

                                <button
                                    type="button"
                                    onClick={copyVerificationCode}
                                    disabled={!verificationCode}
                                    className="site-button w-full mt-4 py-3 font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    <Copy size={18} />
                                    Copy Verification Code
                                </button>
                            </div>

                            {/* SUBMISSION RECEIPT */}

                            <div className="site-surface p-6 mt-6">
                                <h3 className="font-bold text-lg mb-4 site-heading">
                                    Submission Receipt
                                </h3>

                                <div className="space-y-3">
                                    <div className="flex justify-between gap-4">
                                        <span>Submission ID</span>
                                        <span className="font-bold">
                                            FD-{String(item.id).padStart(5, "0")}
                                        </span>
                                    </div>

                                    <div className="flex justify-between gap-4">
                                        <span>Status</span>
                                        <span className="font-bold text-right flex items-center gap-2">
                                            <Clock size={16} />
                                            Awaiting Physical Verification
                                        </span>
                                    </div>

                                    {activeCompanySlug && (
                                        <div className="flex justify-between gap-4">
                                            <span>Company</span>
                                            <span className="font-semibold text-right">
                                                {activeCompanySlug}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* NEXT STEPS */}

                            <div className="site-surface p-6 mt-6">
                                <h3 className="font-bold mb-4 site-heading">
                                    What Happens Next?
                                </h3>

                                <ol className="space-y-3 list-decimal list-inside">
                                    <li>
                                        Take the physical found item to the Lost
                                        & Found Office.
                                    </li>
                                    <li>
                                        Show staff your QR code or provide your
                                        manual verification code.
                                    </li>
                                    <li>
                                        Staff retrieves your report and checks
                                        the physical item.
                                    </li>
                                    <li>
                                        Staff confirms the verification after
                                        inspecting the item.
                                    </li>
                                    <li>
                                        The system can then continue its matching
                                        process.
                                    </li>
                                </ol>
                            </div>

                            {/* BUTTONS */}

                            <div className="flex flex-col sm:flex-row gap-4 mt-8">
                                <button
                                    type="button"
                                    onClick={() => window.print()}
                                    className="site-surface flex-1 py-4 font-semibold"
                                >
                                    Print Receipt
                                </button>

                                <button
                                    type="button"
                                    onClick={() => navigate(companyRoute("/dashboard"))}
                                    className="site-button flex-1 py-4 font-semibold"
                                >
                                    Dashboard
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default FoundSuccess;
