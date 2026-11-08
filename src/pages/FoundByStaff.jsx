import React, {
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";

import {
    useNavigate,
    useParams,
} from "react-router-dom";

import {
    PackageCheck,
    MapPin,
    Calendar,
    Clock,
    Upload,
    Loader2,
    AlertCircle,
    CheckCircle,
    FileImage,
    ShieldCheck,
    Info,
    X,
    Building2,
} from "lucide-react";

import { API, API_BASE_URL } from "../config";
const COMPANY_LOGO =
    `${API_BASE_URL}/media/companies/logos/javic.png`;

const DEFAULT_COMPANY_NAME = "Javic High school";
const DEFAULT_COMPANY_ID = "javic-high-school";

// =========================================================
// GET STORED OBJECT
// =========================================================

function getStoredObject(key) {
    try {
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) : null;
    } catch {
        return null;
    }
}

// =========================================================
// GET FIRST VALID VALUE
// =========================================================

function firstValidValue(...values) {
    for (const value of values) {
        if (
            value !== null &&
            value !== undefined &&
            String(value).trim() !== ""
        ) {
            return value;
        }
    }

    return "";
}

// =========================================================
// IMAGE URL
// =========================================================

function getImageUrl(image) {
    if (!image) {
        return "";
    }

    const value = String(image).trim();

    if (
        value.startsWith("http://") ||
        value.startsWith("https://") ||
        value.startsWith("data:") ||
        value.startsWith("blob:")
    ) {
        return value;
    }

    const backendBase = API.replace(/\/api\/?$/, "");

    return `${backendBase}${value.startsWith("/") ? value : `/${value}`}`;
}

// =========================================================
// COMPONENT
// =========================================================

function StaffFoundItem() {
    const { companySlug } = useParams();
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    // =========================================================
    // STORED COMPANY / USER
    // =========================================================

    const storedCompany = getStoredObject("company");
    const storedUser = getStoredObject("user");

    // =========================================================
    // COMPANY SLUG
    // =========================================================

    const activeCompanySlug = firstValidValue(
        companySlug,
        localStorage.getItem("companySlug"),
        localStorage.getItem("company_slug"),
        storedCompany?.slug,
        storedCompany?.company_slug,
        storedUser?.company_slug,
        storedUser?.companySlug,
        storedUser?.organization_slug,
        storedUser?.organizationSlug,
        DEFAULT_COMPANY_ID
    );

    // =========================================================
    // COMPANY NAME
    // =========================================================

    const companyName = firstValidValue(
        storedCompany?.name,
        storedCompany?.company_name,
        storedCompany?.school_name,
        storedCompany?.organization_name,
        storedUser?.company_name,
        storedUser?.companyName,
        storedUser?.school_name,
        storedUser?.schoolName,
        storedUser?.organization_name,
        storedUser?.organizationName,
        localStorage.getItem("companyName"),
        localStorage.getItem("company_name"),
        localStorage.getItem("school_name"),
        localStorage.getItem("organization_name"),
        DEFAULT_COMPANY_NAME
    );

    // =========================================================
    // ORGANIZATION ID
    // =========================================================

    const organizationId = firstValidValue(
        storedCompany?.slug,
        storedCompany?.company_slug,
        storedUser?.company_slug,
        storedUser?.companySlug,
        storedUser?.organization_slug,
        storedUser?.organizationSlug,
        activeCompanySlug,
        DEFAULT_COMPANY_ID
    );

    // =========================================================
    // COMPANY LOGO
    // =========================================================

    const companyLogo = firstValidValue(
        storedCompany?.logo,
        storedCompany?.logo_url,
        storedCompany?.logoUrl,
        storedCompany?.company_logo,
        storedCompany?.company_logo_url,
        storedCompany?.companyLogo,
        storedCompany?.image,
        storedCompany?.image_url,
        storedCompany?.imageUrl,
        storedCompany?.school_logo,
        storedCompany?.school_logo_url,
        storedCompany?.schoolLogo,
        storedCompany?.organization_logo,
        storedCompany?.organization_logo_url,
        storedCompany?.organizationLogo,

        storedUser?.company_logo,
        storedUser?.company_logo_url,
        storedUser?.companyLogo,
        storedUser?.organization_logo,
        storedUser?.organization_logo_url,
        storedUser?.organizationLogo,

        localStorage.getItem("companyLogo"),
        localStorage.getItem("company_logo"),
        localStorage.getItem("company_logo_url"),
        COMPANY_LOGO
    );

    const companyLogoUrl = getImageUrl(companyLogo);

    // =========================================================
    // TOKEN
    // =========================================================

    const getToken = () =>
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
    // FORM STATE
    // =========================================================

    const [form, setForm] = useState({
        item_name: "",
        category: "",
        description: "",
        location_found: "",
        date_found: "",
        time_found: "",
        image: null,
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // =========================================================
    // CATEGORIES
    // =========================================================

    const categories = [
        "Electronics",
        "Phones",
        "Bags",
        "Documents",
        "Clothing",
        "Keys",
        "Pets",
        "Jewelry",
        "Others",
    ];

    // =========================================================
    // AUTH CHECK
    // =========================================================

    useEffect(() => {
        if (!getToken()) {
            navigate(companyRoute("/login-page"), {
                replace: true,
            });
        }
    }, [navigate, companyRoute]);

    // =========================================================
    // HANDLE INPUT
    // =========================================================

    const handleChange = (e) => {
        const { name, value, files } = e.target;

        if (files && files[0]) {
            const file = files[0];

            if (!file.type.startsWith("image/")) {
                setError("Please select a valid image file.");
                e.target.value = "";
                return;
            }

            setForm((previous) => ({
                ...previous,
                [name]: file,
            }));
        } else {
            setForm((previous) => ({
                ...previous,
                [name]: value,
            }));
        }

        setError("");
        setSuccess("");
    };

    // =========================================================
    // REMOVE IMAGE
    // =========================================================

    const removeImage = () => {
        setForm((previous) => ({
            ...previous,
            image: null,
        }));

        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }

        setError("");
        setSuccess("");
    };

    // =========================================================
    // SUBMIT
    // =========================================================

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");
        setSuccess("");

        const access =
            localStorage.getItem("access_token") ||
            localStorage.getItem("access");

        if (!access) {
            navigate(companyRoute("/login-page"), {
                replace: true,
            });
            return;
        }

        // =====================================================
        // VALIDATION
        // =====================================================

        if (!form.item_name.trim()) {
            setError("Please enter the item name.");
            return;
        }

        if (!form.category.trim()) {
            setError("Please select a category.");
            return;
        }

        if (!form.description.trim()) {
            setError("Please provide a description.");
            return;
        }

        if (!form.location_found.trim()) {
            setError("Please enter where the item was found.");
            return;
        }

        if (!form.date_found) {
            setError("Please select the date the item was found.");
            return;
        }

        if (!form.time_found) {
            setError("Please select the time the item was found.");
            return;
        }

        try {
            setLoading(true);

            const formData = new FormData();

            Object.entries(form).forEach(([key, value]) => {
                if (value !== null && value !== undefined && value !== "") {
                    formData.append(key, value);
                }
            });

            const response = await fetch(
                `${API}/staff/found-by-staff/`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${access}`,
                    },
                    body: formData,
                }
            );

            // =================================================
            // AUTH ERROR
            // =================================================

            if (
                response.status === 401 ||
                response.status === 403
            ) {
                [
                    "access",
                    "access_token",
                    "refresh",
                    "refresh_token",
                ].forEach((key) => {
                    localStorage.removeItem(key);
                });

                navigate(companyRoute("/login-page"), {
                    replace: true,
                });

                return;
            }

            // =================================================
            // READ RESPONSE SAFELY
            // =================================================

            const contentType =
                response.headers.get("content-type") || "";

            let data = {};

            if (contentType.includes("application/json")) {
                data = await response.json();
            } else {
                const responseText = await response.text();

                if (!response.ok) {
                    throw new Error(
                        responseText ||
                        `Server returned status ${response.status}.`
                    );
                }
            }

            console.log(
                "STAFF FOUND ITEM STATUS:",
                response.status
            );

            console.log(
                "STAFF FOUND ITEM RESPONSE:",
                data
            );

            // =================================================
            // DJANGO ERRORS
            // =================================================

            if (!response.ok) {
                const djangoErrors = Object.entries(data)
                    .map(([field, errors]) => {
                        const messages = Array.isArray(errors)
                            ? errors.join(", ")
                            : typeof errors === "object" &&
                              errors !== null
                                ? JSON.stringify(errors)
                                : String(errors);

                        return `${field}: ${messages}`;
                    })
                    .join("\n");

                throw new Error(
                    djangoErrors ||
                    data.error ||
                    data.detail ||
                    data.message ||
                    "Unable to record found item."
                );
            }

            // =================================================
            // SUCCESS
            // =================================================

            setSuccess(
                "The found item has been successfully recorded and added to the staff records."
            );

            // =================================================
            // RESET
            // =================================================

            setForm({
                item_name: "",
                category: "",
                description: "",
                location_found: "",
                date_found: "",
                time_found: "",
                image: null,
            });

            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        } catch (err) {
            console.error("STAFF FOUND ITEM ERROR:", err);

            setError(
                err.message ||
                "Unable to record found item."
            );
        } finally {
            setLoading(false);
        }
    };

    // =========================================================
    // BACK
    // =========================================================

    const handleBack = () => {
        navigate(companyRoute("/staff-dashboard"));
    };

    // =========================================================
    // PAGE
    // =========================================================

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
            {/* ORGANIZATION BAR */}

            <div className="bg-slate-900">
                <div className="max-w-6xl mx-auto px-4 sm:px-6">
                    <div className="h-14 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center overflow-hidden">
                                {companyLogoUrl ? (
                                    <img
                                        src={companyLogoUrl}
                                        alt={`${companyName} logo`}
                                        className="w-full h-full item-image"
                                        onError={(event) => {
                                            event.currentTarget.style.display =
                                                "none";
                                        }}
                                    />
                                ) : (
                                    <Building2
                                        size={18}
                                        className="text-green-500"
                                    />
                                )}
                            </div>

                            <span className="text-sm font-bold text-slate-300">
                                Staff operations and lost & found management
                            </span>
                        </div>

                        <div className="hidden sm:flex items-center gap-3">
                            <span className="text-[10px] uppercase tracking-widest font-bold text-slate-500">
                                Organization ID
                            </span>

                            <span className="px-3 py-1.5 rounded-lg bg-slate-800 text-green-400 font-mono text-xs font-bold">
                                {activeCompanySlug}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* MAIN */}

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
                {/* PAGE HEADER */}

                <div className="mb-8">
                    <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400 text-xs font-black uppercase tracking-wider mb-4">
                                <PackageCheck size={15} />
                                Staff Found Item
                            </div>

                            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
                                Record a Found Item
                            </h1>

                            <p className="mt-2 max-w-2xl text-slate-500 dark:text-slate-400 leading-6">
                                Record an item that you personally found.
                                Provide accurate information so it can be
                                properly tracked and returned to its owner.
                            </p>
                        </div>

                        <div className="hidden lg:flex items-center gap-3">
                            <div className="w-14 h-14 rounded-2xl bg-green-100 dark:bg-green-950/40 border border-green-200 dark:border-green-900 flex items-center justify-center">
                                <PackageCheck
                                    size={27}
                                    className="text-green-600 dark:text-green-400"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* ALERTS */}

                {success && (
                    <div
                        role="status"
                        className="mb-6 rounded-2xl border border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950/30 p-5"
                    >
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/50 flex items-center justify-center shrink-0">
                                <CheckCircle
                                    size={21}
                                    className="text-green-600 dark:text-green-400"
                                />
                            </div>

                            <div className="flex-1">
                                <p className="font-black text-green-800 dark:text-green-300">
                                    Item recorded successfully
                                </p>

                                <p className="mt-1 text-sm text-green-700 dark:text-green-400">
                                    {success}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {error && (
                    <div
                        role="alert"
                        className="mb-6 rounded-2xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 p-5"
                    >
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/50 flex items-center justify-center shrink-0">
                                <AlertCircle
                                    size={21}
                                    className="text-red-600 dark:text-red-400"
                                />
                            </div>

                            <div className="flex-1">
                                <p className="font-black text-red-800 dark:text-red-300">
                                    Unable to record item
                                </p>

                                <p className="mt-1 text-sm text-red-700 dark:text-red-400 whitespace-pre-line">
                                    {error}
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => setError("")}
                                aria-label="Dismiss error"
                                className="text-red-400 hover:text-red-600 transition"
                            >
                                <X size={18} />
                            </button>
                        </div>
                    </div>
                )}

                {/* CONTENT */}

                <div className="grid lg:grid-cols-[minmax(0,1fr)_320px] gap-6 items-start">
                    {/* FORM CARD */}

                    <form
                        onSubmit={handleSubmit}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden"
                    >
                        {/* FORM HEADER */}

                        <div className="px-6 md:px-8 py-6 border-b border-slate-200 dark:border-slate-800">
                            <div className="flex items-center gap-4">
                                <div className="w-11 h-11 rounded-xl bg-green-50 dark:bg-green-950/40 border border-green-100 dark:border-green-900 flex items-center justify-center">
                                    <Info
                                        size={21}
                                        className="text-green-600 dark:text-green-400"
                                    />
                                </div>

                                <div>
                                    <h2 className="font-black text-xl text-slate-900 dark:text-white">
                                        Item Information
                                    </h2>

                                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                                        Enter the details of the item you found.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* FORM BODY */}

                        <div className="p-6 md:p-8">
                            <div className="grid md:grid-cols-2 gap-6">
                                {/* ITEM NAME */}

                                <div className="md:col-span-2">
                                    <label
                                        htmlFor="item_name"
                                        className="block text-sm font-black text-slate-700 dark:text-slate-300 mb-2"
                                    >
                                        Item Name
                                        <span className="text-red-500 ml-1">
                                            *
                                        </span>
                                    </label>

                                    <input
                                        id="item_name"
                                        type="text"
                                        name="item_name"
                                        value={form.item_name}
                                        onChange={handleChange}
                                        placeholder="e.g. Black Samsung phone"
                                        required
                                        className="w-full h-12 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl px-4 outline-none transition focus:ring-2 focus:ring-green-500/20 focus:border-green-500 placeholder:text-slate-400"
                                    />
                                </div>

                                {/* CATEGORY */}

                                <div>
                                    <label
                                        htmlFor="category"
                                        className="block text-sm font-black text-slate-700 dark:text-slate-300 mb-2"
                                    >
                                        Category
                                        <span className="text-red-500 ml-1">
                                            *
                                        </span>
                                    </label>

                                    <select
                                        id="category"
                                        name="category"
                                        value={form.category}
                                        onChange={handleChange}
                                        required
                                        className="w-full h-12 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl px-4 outline-none transition focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                                    >
                                        <option value="">
                                            Select category
                                        </option>

                                        {categories.map((category) => (
                                            <option
                                                key={category}
                                                value={category}
                                            >
                                                {category}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* LOCATION */}

                                <div>
                                    <label
                                        htmlFor="location_found"
                                        className="block text-sm font-black text-slate-700 dark:text-slate-300 mb-2"
                                    >
                                        Where Was It Found?
                                        <span className="text-red-500 ml-1">
                                            *
                                        </span>
                                    </label>

                                    <div className="relative">
                                        <MapPin
                                            size={18}
                                            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                                        />

                                        <input
                                            id="location_found"
                                            type="text"
                                            name="location_found"
                                            value={form.location_found}
                                            onChange={handleChange}
                                            placeholder="e.g. Main gate"
                                            required
                                            className="w-full h-12 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl pl-11 pr-4 outline-none transition focus:ring-2 focus:ring-green-500/20 focus:border-green-500 placeholder:text-slate-400"
                                        />
                                    </div>
                                </div>

                                {/* DATE */}

                                <div>
                                    <label
                                        htmlFor="date_found"
                                        className="block text-sm font-black text-slate-700 dark:text-slate-300 mb-2"
                                    >
                                        Date Found
                                        <span className="text-red-500 ml-1">
                                            *
                                        </span>
                                    </label>

                                    <div className="relative">
                                        <Calendar
                                            size={18}
                                            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                                        />

                                        <input
                                            id="date_found"
                                            type="date"
                                            name="date_found"
                                            value={form.date_found}
                                            onChange={handleChange}
                                            required
                                            className="w-full h-12 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl pl-11 pr-4 outline-none transition focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                                        />
                                    </div>
                                </div>

                                {/* TIME */}

                                <div>
                                    <label
                                        htmlFor="time_found"
                                        className="block text-sm font-black text-slate-700 dark:text-slate-300 mb-2"
                                    >
                                        Time Found
                                        <span className="text-red-500 ml-1">
                                            *
                                        </span>
                                    </label>

                                    <div className="relative">
                                        <Clock
                                            size={18}
                                            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                                        />

                                        <input
                                            id="time_found"
                                            type="time"
                                            name="time_found"
                                            value={form.time_found}
                                            onChange={handleChange}
                                            required
                                            className="w-full h-12 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl pl-11 pr-4 outline-none transition focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                                        />
                                    </div>
                                </div>

                                {/* DESCRIPTION */}

                                <div className="md:col-span-2">
                                    <label
                                        htmlFor="description"
                                        className="block text-sm font-black text-slate-700 dark:text-slate-300 mb-2"
                                    >
                                        Description
                                        <span className="text-red-500 ml-1">
                                            *
                                        </span>
                                    </label>

                                    <textarea
                                        id="description"
                                        name="description"
                                        value={form.description}
                                        onChange={handleChange}
                                        rows={6}
                                        placeholder="Describe the item, including color, brand, serial number, markings, condition, or other identifying features..."
                                        required
                                        className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl px-4 py-3 outline-none transition focus:ring-2 focus:ring-green-500/20 focus:border-green-500 placeholder:text-slate-400 resize-none"
                                    />

                                    <p className="mt-2 text-xs text-slate-400">
                                        Include enough information to help identify the item later.
                                    </p>
                                </div>

                                {/* IMAGE */}

                                <div className="md:col-span-2">
                                    <label
                                        htmlFor="staff-found-item-image"
                                        className="block text-sm font-black text-slate-700 dark:text-slate-300 mb-2"
                                    >
                                        Item Image
                                    </label>

                                    {!form.image ? (
                                        <label
                                            htmlFor="staff-found-item-image"
                                            className="group border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-green-500 hover:bg-green-50/50 dark:hover:bg-green-950/10 transition"
                                        >
                                            <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 group-hover:bg-green-100 dark:group-hover:bg-green-950/40 flex items-center justify-center mb-4 transition">
                                                <Upload
                                                    size={26}
                                                    className="text-slate-500 dark:text-slate-400 group-hover:text-green-600 transition"
                                                />
                                            </div>

                                            <p className="font-black text-slate-700 dark:text-slate-300">
                                                Upload item image
                                            </p>

                                            <p className="text-sm text-slate-400 mt-1 text-center">
                                                PNG, JPG or JPEG
                                            </p>

                                            <span className="mt-4 px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 group-hover:bg-green-100 group-hover:text-green-700 transition">
                                                Choose File
                                            </span>
                                        </label>
                                    ) : (
                                        <div className="border border-green-200 dark:border-green-900 bg-green-50/50 dark:bg-green-950/20 rounded-2xl p-5">
                                            <div className="flex items-center justify-between gap-4">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className="w-11 h-11 rounded-xl bg-green-100 dark:bg-green-950/50 flex items-center justify-center shrink-0">
                                                        <FileImage
                                                            size={21}
                                                            className="text-green-600 dark:text-green-400"
                                                        />
                                                    </div>

                                                    <div className="min-w-0">
                                                        <p className="font-bold text-slate-800 dark:text-slate-200 truncate">
                                                            {form.image.name}
                                                        </p>

                                                        <p className="text-xs text-slate-400 mt-0.5">
                                                            Image selected
                                                        </p>
                                                    </div>
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={removeImage}
                                                    aria-label="Remove selected image"
                                                    className="w-9 h-9 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 hover:text-red-500 hover:border-red-200 transition shrink-0"
                                                >
                                                    <X size={17} />
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    <input
                                        ref={fileInputRef}
                                        id="staff-found-item-image"
                                        type="file"
                                        name="image"
                                        accept="image/png,image/jpeg,image/jpg"
                                        onChange={handleChange}
                                        className="hidden"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* FORM FOOTER */}

                        <div className="px-6 md:px-8 py-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex items-start gap-2 text-xs text-slate-500 dark:text-slate-400">
                                    <ShieldCheck
                                        size={17}
                                        className="text-green-600 shrink-0 mt-0.5"
                                    />

                                    <span>
                                        Please make sure all information is accurate before submitting.
                                    </span>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={handleBack}
                                        disabled={loading}
                                        className="px-5 py-3 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold hover:bg-white dark:hover:bg-slate-800 transition disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="px-6 py-3 rounded-xl bg-green-600 hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-black flex items-center justify-center gap-2 transition shadow-sm shadow-green-600/20"
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2
                                                    size={19}
                                                    className="animate-spin"
                                                />
                                                Recording...
                                            </>
                                        ) : (
                                            <>
                                                <PackageCheck size={19} />
                                                Record Item
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </form>

                    {/* SIDE PANEL */}

                    <aside className="space-y-5">
                        {/* ORGANIZATION CARD */}

                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
                            <div className="p-5 border-b border-slate-200 dark:border-slate-800">
                                <div className="flex items-center gap-3">
                                    <div className="w-11 h-11 rounded-xl bg-green-50 dark:bg-green-950/40 border border-green-100 dark:border-green-900 flex items-center justify-center overflow-hidden">
                                        {companyLogoUrl ? (
                                            <img
                                                src={companyLogoUrl}
                                                alt={`${companyName} logo`}
                                                className="w-full h-full item-image"
                                                onError={(event) => {
                                                    event.currentTarget.style.display =
                                                        "none";
                                                }}
                                            />
                                        ) : (
                                            <Building2
                                                size={20}
                                                className="text-green-600 dark:text-green-400"
                                            />
                                        )}
                                    </div>

                                    <div className="min-w-0">
                                        <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                                            Active organization
                                        </p>

                                        <h3 className="font-black text-slate-900 dark:text-white truncate">
                                            {companyName}
                                        </h3>
                                    </div>
                                </div>
                            </div>

                            <div className="p-5">
                                <div className="mb-4">
                                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                                        Organization ID
                                    </p>

                                    <p className="mt-1 text-sm font-bold text-slate-700 dark:text-slate-300 break-all">
                                        {organizationId}
                                    </p>
                                </div>

                                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                                    <p className="text-sm font-bold text-slate-600 dark:text-slate-400">
                                        Staff operations and lost & found management
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* QUICK INFO */}

                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
                            <div className="p-5 border-b border-slate-200 dark:border-slate-800">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-950/40 flex items-center justify-center">
                                        <PackageCheck
                                            size={20}
                                            className="text-green-600 dark:text-green-400"
                                        />
                                    </div>

                                    <div>
                                        <h3 className="font-black text-slate-900 dark:text-white">
                                            Recording Item
                                        </h3>

                                        <p className="text-xs text-slate-400 mt-0.5">
                                            Staff workflow
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-5 space-y-5">
                                <div className="flex gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                                        <MapPin
                                            size={16}
                                            className="text-slate-500"
                                        />
                                    </div>

                                    <div>
                                        <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                                            Location
                                        </p>

                                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mt-1">
                                            Record where the item was found
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                                        <Calendar
                                            size={16}
                                            className="text-slate-500"
                                        />
                                    </div>

                                    <div>
                                        <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                                            Date &amp; Time
                                        </p>

                                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mt-1">
                                            Provide when the item was found
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                                        <FileImage
                                            size={16}
                                            className="text-slate-500"
                                        />
                                    </div>

                                    <div>
                                        <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                                            Image
                                        </p>

                                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mt-1">
                                            Add a clear image when available
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* RECORDING TIPS */}

                        <div className="bg-slate-900 dark:bg-slate-800 rounded-3xl p-6 text-white border border-slate-800">
                            <div className="flex items-center gap-3 mb-5">
                                <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                                    <Info
                                        size={19}
                                        className="text-green-400"
                                    />
                                </div>

                                <div>
                                    <h3 className="font-black">
                                        Recording Tips
                                    </h3>

                                    <p className="text-xs text-slate-400 mt-0.5">
                                        Help identify the owner
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex gap-3">
                                    <span className="w-5 h-5 rounded-full bg-green-500/10 text-green-400 flex items-center justify-center text-[10px] font-black shrink-0">
                                        1
                                    </span>

                                    <p className="text-sm text-slate-300 leading-5">
                                        Use a clear and specific item name.
                                    </p>
                                </div>

                                <div className="flex gap-3">
                                    <span className="w-5 h-5 rounded-full bg-green-500/10 text-green-400 flex items-center justify-center text-[10px] font-black shrink-0">
                                        2
                                    </span>

                                    <p className="text-sm text-slate-300 leading-5">
                                        Include distinctive features in the description.
                                    </p>
                                </div>

                                <div className="flex gap-3">
                                    <span className="w-5 h-5 rounded-full bg-green-500/10 text-green-400 flex items-center justify-center text-[10px] font-black shrink-0">
                                        3
                                    </span>

                                    <p className="text-sm text-slate-300 leading-5">
                                        Enter the exact location where possible.
                                    </p>
                                </div>

                                <div className="flex gap-3">
                                    <span className="w-5 h-5 rounded-full bg-green-500/10 text-green-400 flex items-center justify-center text-[10px] font-black shrink-0">
                                        4
                                    </span>

                                    <p className="text-sm text-slate-300 leading-5">
                                        Upload an image if one is available.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </aside>
                </div>
            </main>
        </div>
    );
}

export default StaffFoundItem;