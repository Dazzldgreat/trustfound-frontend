import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    ArrowLeft,
    Package,
    MapPin,
    Calendar,
    Clock,
    Upload,
    Loader2,
    AlertCircle,
    CheckCircle,
} from "lucide-react";

const API = "http://127.0.0.1:8000/api";

const DEFAULT_WEBSITE_SETTINGS = {
    primary_color: "#2563eb",
    secondary_color: "#1d4ed8",
    background_color: "#f3f4f6",
    text_color: "#374151",
    heading_color: "#111827",
    card_color: "#ffffff",
    button_text_color: "#ffffff",
    border_color: "#ffffff",
    border_line_color: "#e5e7eb",
    border_style: "solid",
    border_width: 1,
    border_radius: 16,
    content_width: 896,
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
    return isValidColor(value) ? value : fallback;
}

function getValidNumber(value, fallback, min, max) {
    const number = Number(value);

    if (!Number.isFinite(number)) return fallback;

    return Math.min(max, Math.max(min, number));
}

function getValidBorderStyle(value, fallback) {
    return ALLOWED_BORDER_STYLES.includes(value)
        ? value
        : fallback;
}

function getValidFont(value, fallback) {
    return ALLOWED_FONTS.includes(value) ? value : fallback;
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
        border_style: getValidBorderStyle(
            source.border_style,
            DEFAULT_WEBSITE_SETTINGS.border_style
        ),
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
        font_family: getValidFont(
            source.font_family,
            DEFAULT_WEBSITE_SETTINGS.font_family
        ),
    };
}

function LostItem() {
    const { companySlug } = useParams();
    const navigate = useNavigate();

    // =========================================================
    // COMPANY
    // =========================================================

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

    // =========================================================
    // TOKEN
    // =========================================================

    const access =
        localStorage.getItem("access_token") ||
        localStorage.getItem("access");

    // =========================================================
    // COMPANY ROUTE
    // =========================================================

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

                const data = await response.json();

                if (!cancelled) {
                    setWebsiteSettings(applyWebsiteTheme(data));
                }
            } catch (err) {
                console.error(
                    "WEBSITE SETTINGS ERROR:",
                    err
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
    // STATE
    // =========================================================

    const [formData, setFormData] = useState({
        item_name: "",
        category: "",
        description: "",
        location: "",
        date_lost: "",
        time_lost: "",
        contact_name: "",
        contact_phone: "",
        contact_email: "",
    });

    const [image, setImage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // =========================================================
    // AUTH CHECK
    // =========================================================

    useEffect(() => {
        if (!access) {
            navigate(companyRoute("/login-page"), {
                replace: true,
            });
        }
    }, [access, navigate, companyRoute]);

    // =========================================================
    // HANDLE INPUT
    // =========================================================

    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value,
        }));
    };

    // =========================================================
    // HANDLE IMAGE
    // =========================================================

    const handleImageChange = (e) => {
        const file = e.target.files?.[0];

        if (file) {
            setImage(file);
        }
    };

    // =========================================================
    // SUBMIT
    // =========================================================

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");
        setSuccess("");

        if (!access) {
            navigate(companyRoute("/login-page"), {
                replace: true,
            });
            return;
        }

        if (!formData.item_name.trim()) {
            setError("Please enter the item name.");
            return;
        }

        if (!formData.category.trim()) {
            setError("Please select or enter a category.");
            return;
        }

        if (!formData.description.trim()) {
            setError("Please provide a description.");
            return;
        }

        if (!formData.location.trim()) {
            setError("Please enter where the item was lost.");
            return;
        }

        if (!formData.date_lost) {
            setError("Please select the date the item was lost.");
            return;
        }

        try {
            setLoading(true);

            const body = new FormData();

            Object.entries(formData).forEach(([key, value]) => {
                body.append(key, value);
            });

            if (image) {
                body.append("image", image);
            }

            const response = await fetch(`${API}/lost-items/`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${access}`,
                },
                body,
            });

            if (
                response.status === 401 ||
                response.status === 403
            ) {
                localStorage.removeItem("access");
                localStorage.removeItem("access_token");

                navigate(companyRoute("/login-page"), {
                    replace: true,
                });

                return;
            }

            const data = await response.json();

            console.log("LOST ITEM RESPONSE:", data);

            if (!response.ok) {
                throw new Error(
                    data.error ||
                    data.detail ||
                    data.message ||
                    "Unable to submit lost item report."
                );
            }

            setSuccess(
                "Lost item report submitted successfully."
            );

            setFormData({
                item_name: "",
                category: "",
                description: "",
                location: "",
                date_lost: "",
                time_lost: "",
                contact_name: "",
                contact_phone: "",
                contact_email: "",
            });

            setImage(null);

            const fileInput =
                document.getElementById("lost-item-image");

            if (fileInput) {
                fileInput.value = "";
            }
        } catch (err) {
            console.error("LOST ITEM SUBMIT ERROR:", err);

            setError(
                err.message ||
                "Unable to submit lost item report."
            );
        } finally {
            setLoading(false);
        }
    };

    // =========================================================
    // BACK
    // =========================================================

    const handleBack = () => {
        navigate(companyRoute("/dashboard"));
    };

    // =========================================================
    // PAGE
    // =========================================================

    return (
        <div
            className="lost-item-theme min-h-screen py-8 px-4 md:px-6"
            style={themeStyle}
        >
            <style>{`
                .lost-item-theme {
                    background-color: var(--site-background);
                    color: var(--site-text);
                    font-family: var(--site-font);
                }

                .lost-item-theme .site-heading {
                    color: var(--site-heading);
                }

                .lost-item-theme .site-text {
                    color: var(--site-text);
                }

                .lost-item-theme .site-muted {
                    color: var(--site-text);
                    opacity: 0.72;
                }

                .lost-item-theme .site-card {
                    background-color: var(--site-card);
                    border-color: var(--site-border-line);
                    border-style: var(--site-border-style);
                    border-width: var(--site-border-width);
                    border-radius: var(--site-radius);
                }

                .lost-item-theme .site-field {
                    background-color: var(--site-border-fill);
                    color: var(--site-text);
                    border-color: var(--site-border-line);
                    border-style: var(--site-border-style);
                    border-width: var(--site-border-width);
                    border-radius: var(--site-radius);
                }

                .lost-item-theme .site-field::placeholder {
                    color: var(--site-text);
                    opacity: 0.6;
                }

                .lost-item-theme .site-button {
                    background-color: var(--site-primary);
                    color: var(--site-button-text);
                    border-radius: var(--site-radius);
                }

                .lost-item-theme .site-button:hover {
                    background-color: var(--site-secondary);
                }

                .lost-item-theme .site-primary-text {
                    color: var(--site-primary);
                }

                .lost-item-theme .site-primary-soft {
                    color: var(--site-primary);
                    background-color: var(--site-primary);
                    background-color: color-mix(
                        in srgb,
                        var(--site-primary) 12%,
                        var(--site-card)
                    );
                    border-color: var(--site-border-line);
                }

                .lost-item-theme .site-divider {
                    border-color: var(--site-border-line);
                    border-style: var(--site-border-style);
                    border-width: var(--site-border-width);
                }

                .lost-item-theme .site-upload {
                    border-color: var(--site-border-line);
                    border-style: dashed;
                    border-width: max(2px, var(--site-border-width));
                    border-radius: var(--site-radius);
                    background-color: var(--site-border-fill);
                }

                .lost-item-theme .site-upload:hover {
                    border-color: var(--site-primary);
                }

                .lost-item-theme .site-focus:focus {
                    outline: none;
                    border-color: var(--site-primary);
                    box-shadow: 0 0 0 2px var(--site-primary);
                }
            `}</style>

            <div
                className="mx-auto"
                style={{
                    maxWidth: "var(--site-content-width)",
                }}
            >
                {/* BACK */}
                <button
                    type="button"
                    onClick={handleBack}
                    className="flex items-center gap-2 site-primary-text font-bold mb-7 hover:underline"
                >
                    <ArrowLeft size={20} />
                    Back to Dashboard
                </button>

                {/* HEADER */}
                <div className="mb-8">
                    <div className="flex items-center gap-4">
                        <div
                            className="w-14 h-14 rounded-2xl flex items-center justify-center site-primary-soft"
                            style={{
                                borderRadius: "var(--site-radius)",
                            }}
                        >
                            <Package
                                size={30}
                                style={{
                                    color: "var(--site-primary)",
                                }}
                            />
                        </div>

                        <div>
                            <h1 className="text-3xl md:text-4xl font-black site-heading">
                                Report Lost Item
                            </h1>

                            <p className="site-muted mt-1">
                                Provide the details below so we can help you find your item.
                            </p>
                        </div>
                    </div>
                </div>

                {/* SUCCESS */}
                {success && (
                    <div className="mb-6 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 text-green-700 dark:text-green-300 rounded-2xl p-5 flex items-start gap-3">
                        <CheckCircle
                            size={23}
                            className="shrink-0 mt-0.5"
                        />

                        <div>
                            <p className="font-bold">Success</p>
                            <p className="mt-1">{success}</p>
                        </div>
                    </div>
                )}

                {/* ERROR */}
                {error && (
                    <div className="mb-6 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 rounded-2xl p-5 flex items-start gap-3">
                        <AlertCircle
                            size={23}
                            className="shrink-0 mt-0.5"
                        />

                        <div>
                            <p className="font-bold">
                                Unable to submit
                            </p>

                            <p className="mt-1">{error}</p>
                        </div>
                    </div>
                )}

                {/* FORM */}
                <form
                    onSubmit={handleSubmit}
                    className="site-card shadow-xl overflow-hidden"
                >
                    {/* ITEM INFORMATION */}
                    <div className="p-6 md:p-8">
                        <h2 className="text-2xl font-black site-heading">
                            Item Information
                        </h2>

                        <p className="site-muted mt-1 mb-6">
                            Tell us about the item you lost.
                        </p>

                        <div className="grid md:grid-cols-2 gap-5">
                            {/* ITEM NAME */}
                            <div className="md:col-span-2">
                                <label className="block text-sm font-bold site-text mb-2">
                                    Item Name *
                                </label>

                                <input
                                    type="text"
                                    name="item_name"
                                    value={formData.item_name}
                                    onChange={handleChange}
                                    placeholder="e.g. Black Samsung phone"
                                    className="site-field site-focus w-full px-4 py-3 outline-none"
                                    required
                                />
                            </div>

                            {/* CATEGORY */}
                            <div>
                                <label className="block text-sm font-bold site-text mb-2">
                                    Category *
                                </label>

                                <select
                                    name="category"
                                    value={formData.category}
                                    onChange={handleChange}
                                    className="site-field site-focus w-full px-4 py-3 outline-none"
                                    required
                                >
                                    <option value="">
                                        Select category
                                    </option>
                                    <option value="Electronics">
                                        Electronics
                                    </option>
                                    <option value="Phone">Phone</option>
                                    <option value="Laptop">Laptop</option>
                                    <option value="Wallet">Wallet</option>
                                    <option value="Bag">Bag</option>
                                    <option value="Keys">Keys</option>
                                    <option value="Documents">
                                        Documents
                                    </option>
                                    <option value="Clothing">
                                        Clothing
                                    </option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>

                            {/* LOCATION */}
                            <div>
                                <label className="block text-sm font-bold site-text mb-2">
                                    Where Was It Lost? *
                                </label>

                                <div className="relative">
                                    <MapPin
                                        size={18}
                                        className="absolute left-4 top-1/2 -translate-y-1/2"
                                        style={{
                                            color: "var(--site-text)",
                                            opacity: 0.65,
                                        }}
                                    />

                                    <input
                                        type="text"
                                        name="location"
                                        value={formData.location}
                                        onChange={handleChange}
                                        placeholder="e.g. Main gate"
                                        className="site-field site-focus w-full pl-11 pr-4 py-3 outline-none"
                                        required
                                    />
                                </div>
                            </div>

                            {/* DATE */}
                            <div>
                                <label className="block text-sm font-bold site-text mb-2">
                                    Date Lost *
                                </label>

                                <div className="relative">
                                    <Calendar
                                        size={18}
                                        className="absolute left-4 top-1/2 -translate-y-1/2"
                                        style={{
                                            color: "var(--site-text)",
                                            opacity: 0.65,
                                        }}
                                    />

                                    <input
                                        type="date"
                                        name="date_lost"
                                        value={formData.date_lost}
                                        onChange={handleChange}
                                        className="site-field site-focus w-full pl-11 pr-4 py-3 outline-none"
                                        required
                                    />
                                </div>
                            </div>

                            {/* TIME */}
                            <div>
                                <label className="block text-sm font-bold site-text mb-2">
                                    Time Lost
                                </label>

                                <div className="relative">
                                    <Clock
                                        size={18}
                                        className="absolute left-4 top-1/2 -translate-y-1/2"
                                        style={{
                                            color: "var(--site-text)",
                                            opacity: 0.65,
                                        }}
                                    />

                                    <input
                                        type="time"
                                        name="time_lost"
                                        value={formData.time_lost}
                                        onChange={handleChange}
                                        className="site-field site-focus w-full pl-11 pr-4 py-3 outline-none"
                                    />
                                </div>
                            </div>

                            {/* DESCRIPTION */}
                            <div className="md:col-span-2">
                                <label className="block text-sm font-bold site-text mb-2">
                                    Description *
                                </label>

                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    rows={5}
                                    placeholder="Describe the item, including identifying features..."
                                    className="site-field site-focus w-full px-4 py-3 outline-none resize-none"
                                    required
                                />
                            </div>

                            {/* IMAGE */}
                            <div className="md:col-span-2">
                                <label className="block text-sm font-bold site-text mb-2">
                                    Item Image
                                </label>

                                <label
                                    htmlFor="lost-item-image"
                                    className="site-upload p-8 flex flex-col items-center justify-center cursor-pointer transition"
                                >
                                    <Upload
                                        size={35}
                                        className="mb-3"
                                        style={{
                                            color: "var(--site-primary)",
                                        }}
                                    />

                                    <p className="font-bold site-text">
                                        {image
                                            ? image.name
                                            : "Upload an image"}
                                    </p>

                                    <p className="text-sm site-muted mt-1">
                                        PNG, JPG or JPEG
                                    </p>
                                </label>

                                <input
                                    id="lost-item-image"
                                    type="file"
                                    accept="image/png,image/jpeg,image/jpg"
                                    onChange={handleImageChange}
                                    className="hidden"
                                />
                            </div>
                        </div>
                    </div>

                    {/* CONTACT */}
                    <div className="site-divider p-6 md:p-8">
                        <h2 className="text-2xl font-black site-heading">
                            Contact Information
                        </h2>

                        <p className="site-muted mt-1 mb-6">
                            Provide contact details so you can be reached if your item is found.
                        </p>

                        <div className="grid md:grid-cols-2 gap-5">
                            {/* NAME */}
                            <div>
                                <label className="block text-sm font-bold site-text mb-2">
                                    Contact Name
                                </label>

                                <input
                                    type="text"
                                    name="contact_name"
                                    value={formData.contact_name}
                                    onChange={handleChange}
                                    placeholder="Your name"
                                    className="site-field site-focus w-full px-4 py-3 outline-none"
                                />
                            </div>

                            {/* PHONE */}
                            <div>
                                <label className="block text-sm font-bold site-text mb-2">
                                    Phone Number
                                </label>

                                <input
                                    type="tel"
                                    name="contact_phone"
                                    value={formData.contact_phone}
                                    onChange={handleChange}
                                    placeholder="Your phone number"
                                    className="site-field site-focus w-full px-4 py-3 outline-none"
                                />
                            </div>

                            {/* EMAIL */}
                            <div className="md:col-span-2">
                                <label className="block text-sm font-bold site-text mb-2">
                                    Email Address
                                </label>

                                <input
                                    type="email"
                                    name="contact_email"
                                    value={formData.contact_email}
                                    onChange={handleChange}
                                    placeholder="Your email address"
                                    className="site-field site-focus w-full px-4 py-3 outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* SUBMIT */}
                    <div
                        className="site-divider p-6 md:p-8"
                        style={{
                            backgroundColor: "var(--site-border-fill)",
                        }}
                    >
                        <button
                            type="submit"
                            disabled={loading}
                            className="site-button w-full disabled:opacity-60 disabled:cursor-not-allowed py-4 font-black text-lg flex items-center justify-center gap-3 transition"
                        >
                            {loading ? (
                                <>
                                    <Loader2
                                        size={22}
                                        className="animate-spin"
                                    />
                                    Submitting Report...
                                </>
                            ) : (
                                <>
                                    <Package size={22} />
                                    Submit Lost Item Report
                                </>
                            )}
                        </button>

                        <p className="text-center text-sm site-muted mt-4">
                            Make sure the information provided is accurate before submitting.
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default LostItem;
