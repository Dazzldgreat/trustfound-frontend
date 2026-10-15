import React, {
    useCallback,
    useEffect,
    useState,
} from "react";

import {
    useNavigate,
    useParams,
} from "react-router-dom";

import {
    ArrowLeft,
    Building2,
    CalendarDays,
    Camera,
    CheckCircle2,
    Clock3,
    FilePlus2,
    ImagePlus,
    Mail,
    MapPin,
    Phone,
    RefreshCw,
    ShieldCheck,
    UserRound,
    X,
} from "lucide-react";


// =============================================================
// API
// =============================================================

const API = "http://127.0.0.1:8000/api";


// =============================================================
// CATEGORIES
// =============================================================

const categories = [
    "Electronics",
    "Documents",
    "Clothing",
    "Bags",
    "Jewelry",
    "Keys",
    "Money",
    "Pets",
    "Others",
];


// =============================================================
// COMPONENT
// =============================================================

function StaffReportFoundItem() {

    const navigate = useNavigate();

    const { companySlug } = useParams();


    // =========================================================
    // STORED DATA
    // =========================================================

    const getStoredObject = useCallback((key) => {

        try {

            return JSON.parse(
                localStorage.getItem(key) || "{}"
            );

        } catch {

            return {};
        }

    }, []);


    const storedStaff =
        getStoredObject("staff");

    const storedCompany =
        getStoredObject("company");


    // =========================================================
    // STORED COMPANY VALUES
    // =========================================================

    const storedCompanyId =
        storedCompany.id ?? null;

    const storedCompanyName =
        storedCompany.name ||
        "Javic High school";

    const storedCompanyLogo =
        storedCompany.logo ||
        "http://127.0.0.1:8000/media/companies/logos/javic.png";


    // =========================================================
    // COMPANY SLUG
    // =========================================================

    const storedSlug =
        localStorage.getItem("companySlug") ||
        localStorage.getItem("company_slug") ||
        storedCompany.slug ||
        storedStaff.company_slug ||
        storedStaff.companySlug ||
        "";

    const activeCompanySlug =
        companySlug ||
        storedSlug ||
        "javic-high-school";


    // =========================================================
    // STATE
    // =========================================================

    const [loading, setLoading] =
        useState(false);

    const [pageLoading, setPageLoading] =
        useState(true);


    const [company, setCompany] =
        useState({
            id: storedCompanyId,
            name: storedCompanyName,
            slug: activeCompanySlug,
            logo: storedCompanyLogo,
        });


    const [formData, setFormData] =
        useState({
            item_name: "",
            category: "",
            description: "",
            location_found: "",
            date_found: "",
            time_found: "",
            finder_name: "",
            finder_phone: "",
            finder_email: "",
            received_from: "",
            image: null,
        });


    const [imagePreview, setImagePreview] =
        useState("");


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
    // LOAD COMPANY
    // =========================================================

    const loadCompany = useCallback(
        async () => {

            try {

                const response =
                    await fetch(
                        `${API}/company/public/${encodeURIComponent(
                            activeCompanySlug
                        )}/`
                    );


                const contentType =
                    response.headers.get(
                        "content-type"
                    ) || "";


                if (
                    !contentType.includes(
                        "application/json"
                    )
                ) {

                    throw new Error(
                        `Unable to load company. Server returned HTTP ${response.status}.`
                    );
                }


                const data =
                    await response.json();


                if (!response.ok) {

                    throw new Error(
                        data?.error ||
                        data?.detail ||
                        "Unable to load company."
                    );
                }


                const companyData =
                    data.company ||
                    data;


                const updatedCompany = {

                    id:
                        companyData.id ??
                        storedCompanyId ??
                        null,

                    name:
                        companyData.name ||
                        storedCompanyName ||
                        "Javic High school",

                    slug:
                        companyData.slug ||
                        activeCompanySlug,

                    logo:
                        companyData.logo ||
                        storedCompanyLogo,
                };


                setCompany(
                    updatedCompany
                );


                localStorage.setItem(
                    "company",
                    JSON.stringify(
                        updatedCompany
                    )
                );

            } catch (error) {

                console.error(
                    "Company load error:",
                    error
                );

            } finally {

                setPageLoading(false);
            }

        },
        [
            activeCompanySlug,
            storedCompanyId,
            storedCompanyName,
            storedCompanyLogo,
        ]
    );


    // =========================================================
    // COMPANY EFFECT
    // =========================================================

    useEffect(() => {

        loadCompany();

    }, [
        loadCompany,
    ]);


    // =========================================================
    // AUTH CHECK
    // =========================================================

    useEffect(() => {

        const access =
            localStorage.getItem("access_token") ||
            localStorage.getItem("access");


        if (
            !access ||
            !storedStaff.username
        ) {

            navigate(
                companyRoute("/staff-login"),
                {
                    replace: true,
                }
            );

            return;
        }


        if (!activeCompanySlug) {

            navigate(
                "/",
                {
                    replace: true,
                }
            );
        }

    }, [
        activeCompanySlug,
        navigate,
        companyRoute,
        storedStaff.username,
    ]);


    // =========================================================
    // HANDLE INPUT
    // =========================================================

    const handleChange = (event) => {

        const {
            name,
            value,
            files,
        } = event.target;


        if (files) {

            const file =
                files[0] || null;


            setFormData(
                (previous) => ({
                    ...previous,
                    [name]: file,
                })
            );


            if (file) {

                setImagePreview(
                    URL.createObjectURL(file)
                );

            } else {

                setImagePreview("");
            }


            return;
        }


        setFormData(
            (previous) => ({
                ...previous,
                [name]: value,
            })
        );
    };


    // =========================================================
    // REMOVE IMAGE
    // =========================================================

    const removeImage = () => {

        setFormData(
            (previous) => ({
                ...previous,
                image: null,
            })
        );


        setImagePreview("");


        const input =
            document.getElementById(
                "item-image"
            );


        if (input) {
            input.value = "";
        }
    };


    // =========================================================
    // SUBMIT
    // =========================================================

    const handleSubmit = async (event) => {

        event.preventDefault();


        const access =
            localStorage.getItem("access_token") ||
            localStorage.getItem("access");


        if (!access) {

            navigate(
                companyRoute("/staff-login"),
                {
                    replace: true,
                }
            );

            return;
        }


        setLoading(true);


        const body =
            new FormData();


        Object.entries(
            formData
        ).forEach(
            ([key, value]) => {

                if (
                    value !== null &&
                    value !== undefined &&
                    value !== ""
                ) {

                    body.append(
                        key,
                        value
                    );
                }
            }
        );


        try {

            const response =
                await fetch(
                    `${API}/staff/report-found-item/`,
                    {
                        method: "POST",

                        headers: {
                            Authorization:
                                `Bearer ${access}`,
                        },

                        body,
                    }
                );


            const contentType =
                response.headers.get(
                    "content-type"
                ) || "";


            let data = null;


            if (
                contentType.includes(
                    "application/json"
                )
            ) {

                data =
                    await response.json();

            } else {

                const text =
                    await response.text();


                throw new Error(
                    text ||
                    `Server returned HTTP ${response.status}.`
                );
            }


            // -------------------------------------------------
            // AUTH FAILURE
            // -------------------------------------------------

            if (
                response.status === 401 ||
                response.status === 403
            ) {

                localStorage.removeItem(
                    "access"
                );

                localStorage.removeItem(
                    "access_token"
                );


                navigate(
                    companyRoute("/staff-login"),
                    {
                        replace: true,
                    }
                );

                return;
            }


            // -------------------------------------------------
            // SERVER ERROR
            // -------------------------------------------------

            if (!response.ok) {

                throw new Error(
                    data?.error ||
                    data?.detail ||
                    data?.message ||
                    "Unable to record found item."
                );
            }


            // -------------------------------------------------
            // SUCCESS
            // -------------------------------------------------

            alert(
                "Found item recorded successfully."
            );


            navigate(
                companyRoute(
                    "/staff-dashboard"
                )
            );

        } catch (error) {

            console.error(
                "Submit found item error:",
                error
            );


            alert(
                error?.message ||
                "Server error. Please try again."
            );

        } finally {

            setLoading(false);
        }
    };


    // =========================================================
    // LOADING
    // =========================================================

    if (pageLoading) {

        return (

            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">

                <RefreshCw
                    size={28}
                    className="text-green-600 animate-spin"
                />

            </div>
        );
    }


    // =========================================================
    // CLASSES
    // =========================================================

    const inputClass = `
        w-full
        h-11
        px-3.5
        rounded-xl
        border
        border-slate-200
        dark:border-slate-700
        bg-white
        dark:bg-slate-800
        text-sm
        text-slate-900
        dark:text-white
        placeholder:text-slate-400
        outline-none
        focus:border-green-500
        focus:ring-4
        focus:ring-green-500/10
        transition
    `;


    const iconInputClass = `
        w-full
        h-11
        pl-10
        pr-3.5
        rounded-xl
        border
        border-slate-200
        dark:border-slate-700
        bg-white
        dark:bg-slate-800
        text-sm
        text-slate-900
        dark:text-white
        placeholder:text-slate-400
        outline-none
        focus:border-green-500
        focus:ring-4
        focus:ring-green-500/10
        transition
    `;


    const labelClass =
        "block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5";


    // =========================================================
    // PAGE
    // =========================================================

    return (

        <div className="min-h-screen bg-slate-50 dark:bg-slate-950">

            {/* =================================================
                ORGANIZATION BAR
            ================================================= */}

            <div className="bg-slate-900">

                <div className="max-w-6xl mx-auto px-4 sm:px-6">

                    <div className="h-14 flex items-center justify-between">

                        <div className="flex items-center gap-3">

                            <div className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center">

                                <Building2
                                    size={18}
                                    className="text-green-500"
                                />

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


            {/* =================================================
                MAIN
            ================================================= */}

            <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

                {/* TITLE */}

                <section className="mb-6">

                    <p className="text-[11px] font-black uppercase tracking-widest text-green-600">

                        Found by staff

                    </p>


                    <h2 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 dark:text-white mt-1">

                        Record found item

                    </h2>


                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">

                        Record an item found by a staff member.

                    </p>

                </section>


                <form
                    onSubmit={handleSubmit}
                    className="space-y-4"
                >

                    {/* =================================================
                        ITEM INFORMATION
                    ================================================= */}

                    <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">

                        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800">

                            <div className="flex items-center gap-3">

                                <div className="w-9 h-9 rounded-lg bg-green-100 dark:bg-green-950/40 flex items-center justify-center">

                                    <FilePlus2
                                        size={18}
                                        className="text-green-600"
                                    />

                                </div>


                                <div>

                                    <h3 className="font-black text-base text-slate-900 dark:text-white">

                                        Item information

                                    </h3>


                                    <p className="text-xs text-slate-400">

                                        Basic details about the item.

                                    </p>

                                </div>

                            </div>

                        </div>


                        <div className="p-5 grid md:grid-cols-2 gap-4">

                            <div>

                                <label className={labelClass}>
                                    Item name *
                                </label>


                                <input
                                    type="text"
                                    name="item_name"
                                    value={formData.item_name}
                                    onChange={handleChange}
                                    required
                                    placeholder="e.g. Black iPhone 15"
                                    className={inputClass}
                                />

                            </div>


                            <div>

                                <label className={labelClass}>
                                    Category *
                                </label>


                                <select
                                    name="category"
                                    value={formData.category}
                                    onChange={handleChange}
                                    required
                                    className={inputClass}
                                >

                                    <option value="">
                                        Select category
                                    </option>


                                    {categories.map(
                                        (category) => (

                                            <option
                                                key={category}
                                                value={category}
                                            >
                                                {category}
                                            </option>

                                        )
                                    )}

                                </select>

                            </div>


                            <div className="md:col-span-2">

                                <label className={labelClass}>
                                    Description *
                                </label>


                                <textarea
                                    rows={3}
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    required
                                    placeholder="Color, brand, markings, condition or other identifying details."
                                    className="
                                        w-full
                                        px-3.5
                                        py-3
                                        rounded-xl
                                        border
                                        border-slate-200
                                        dark:border-slate-700
                                        bg-white
                                        dark:bg-slate-800
                                        text-sm
                                        text-slate-900
                                        dark:text-white
                                        placeholder:text-slate-400
                                        outline-none
                                        resize-none
                                        focus:border-green-500
                                        focus:ring-4
                                        focus:ring-green-500/10
                                    "
                                />

                            </div>

                        </div>

                    </section>


                    {/* =================================================
                        FOUND DETAILS
                    ================================================= */}

                    <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">

                        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800">

                            <div className="flex items-center gap-3">

                                <div className="w-9 h-9 rounded-lg bg-green-100 dark:bg-green-950/40 flex items-center justify-center">

                                    <MapPin
                                        size={18}
                                        className="text-green-600"
                                    />

                                </div>


                                <div>

                                    <h3 className="font-black text-base text-slate-900 dark:text-white">

                                        Found details

                                    </h3>


                                    <p className="text-xs text-slate-400">

                                        Where, when and from whom it was received.

                                    </p>

                                </div>

                            </div>

                        </div>


                        <div className="p-5 grid md:grid-cols-3 gap-4">

                            <div className="md:col-span-3">

                                <label className={labelClass}>
                                    Location found *
                                </label>


                                <div className="relative">

                                    <MapPin
                                        size={16}
                                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                                    />


                                    <input
                                        type="text"
                                        name="location_found"
                                        value={formData.location_found}
                                        onChange={handleChange}
                                        required
                                        placeholder="e.g. Main reception, Block A"
                                        className={iconInputClass}
                                    />

                                </div>

                            </div>


                            <div>

                                <label className={labelClass}>
                                    Date found *
                                </label>


                                <div className="relative">

                                    <CalendarDays
                                        size={16}
                                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                                    />


                                    <input
                                        type="date"
                                        name="date_found"
                                        value={formData.date_found}
                                        onChange={handleChange}
                                        required
                                        className={iconInputClass}
                                    />

                                </div>

                            </div>


                            <div>

                                <label className={labelClass}>
                                    Time found *
                                </label>


                                <div className="relative">

                                    <Clock3
                                        size={16}
                                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                                    />


                                    <input
                                        type="time"
                                        name="time_found"
                                        value={formData.time_found}
                                        onChange={handleChange}
                                        required
                                        className={iconInputClass}
                                    />

                                </div>

                            </div>


                            <div>

                                <label className={labelClass}>
                                    Received from *
                                </label>


                                <div className="relative">

                                    <UserRound
                                        size={16}
                                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                                    />


                                    <input
                                        type="text"
                                        name="received_from"
                                        value={formData.received_from}
                                        onChange={handleChange}
                                        required
                                        placeholder="Name"
                                        className={iconInputClass}
                                    />

                                </div>

                            </div>

                        </div>

                    </section>


                    {/* =================================================
                        FINDER
                    ================================================= */}

                    <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">

                        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800">

                            <div className="flex items-center gap-3">

                                <div className="w-9 h-9 rounded-lg bg-green-100 dark:bg-green-950/40 flex items-center justify-center">

                                    <UserRound
                                        size={18}
                                        className="text-green-600"
                                    />

                                </div>


                                <div>

                                    <h3 className="font-black text-base text-slate-900 dark:text-white">

                                        Finder information

                                    </h3>


                                    <p className="text-xs text-slate-400">

                                        Contact details of the person who found it.

                                    </p>

                                </div>

                            </div>

                        </div>


                        <div className="p-5 grid md:grid-cols-3 gap-4">

                            <div>

                                <label className={labelClass}>
                                    Finder name
                                </label>


                                <div className="relative">

                                    <UserRound
                                        size={16}
                                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                                    />


                                    <input
                                        type="text"
                                        name="finder_name"
                                        value={formData.finder_name}
                                        onChange={handleChange}
                                        placeholder="Full name"
                                        className={iconInputClass}
                                    />

                                </div>

                            </div>


                            <div>

                                <label className={labelClass}>
                                    Phone number
                                </label>


                                <div className="relative">

                                    <Phone
                                        size={16}
                                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                                    />


                                    <input
                                        type="tel"
                                        name="finder_phone"
                                        value={formData.finder_phone}
                                        onChange={handleChange}
                                        placeholder="Phone number"
                                        className={iconInputClass}
                                    />

                                </div>

                            </div>


                            <div>

                                <label className={labelClass}>
                                    Email
                                </label>


                                <div className="relative">

                                    <Mail
                                        size={16}
                                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                                    />


                                    <input
                                        type="email"
                                        name="finder_email"
                                        value={formData.finder_email}
                                        onChange={handleChange}
                                        placeholder="Email address"
                                        className={iconInputClass}
                                    />

                                </div>

                            </div>

                        </div>

                    </section>


                    {/* =================================================
                        IMAGE
                    ================================================= */}

                    <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">

                        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800">

                            <div className="flex items-center gap-3">

                                <div className="w-9 h-9 rounded-lg bg-green-100 dark:bg-green-950/40 flex items-center justify-center">

                                    <Camera
                                        size={18}
                                        className="text-green-600"
                                    />

                                </div>


                                <div>

                                    <h3 className="font-black text-base text-slate-900 dark:text-white">

                                        Item image

                                    </h3>


                                    <p className="text-xs text-slate-400">

                                        Add a photo if available.

                                    </p>

                                </div>

                            </div>

                        </div>


                        <div className="p-5">

                            {!imagePreview ? (

                                <label
                                    htmlFor="item-image"
                                    className="
                                        flex
                                        items-center
                                        gap-4
                                        p-5
                                        rounded-xl
                                        border-2
                                        border-dashed
                                        border-slate-200
                                        dark:border-slate-700
                                        bg-slate-50
                                        dark:bg-slate-950/40
                                        hover:border-green-500
                                        hover:bg-green-50/30
                                        cursor-pointer
                                        transition
                                    "
                                >

                                    <div className="w-11 h-11 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center">

                                        <ImagePlus
                                            size={21}
                                            className="text-slate-400"
                                        />

                                    </div>


                                    <div>

                                        <p className="text-sm font-black text-slate-700 dark:text-slate-300">

                                            Add item photo

                                        </p>


                                        <p className="text-xs text-slate-400 mt-0.5">

                                            PNG, JPG or JPEG

                                        </p>

                                    </div>


                                    <input
                                        id="item-image"
                                        type="file"
                                        name="image"
                                        accept="image/*"
                                        onChange={handleChange}
                                        className="hidden"
                                    />

                                </label>

                            ) : (

                                <div className="relative max-w-md">

                                    <img
                                        src={imagePreview}
                                        alt="Item preview"
                                        className="w-full max-h-72 object-cover rounded-xl border border-slate-200 dark:border-slate-700"
                                    />


                                    <button
                                        type="button"
                                        onClick={removeImage}
                                        className="
                                            absolute
                                            top-2
                                            right-2
                                            w-9
                                            h-9
                                            rounded-lg
                                            bg-white
                                            dark:bg-slate-900
                                            shadow-md
                                            flex
                                            items-center
                                            justify-center
                                            text-slate-600
                                            hover:text-red-600
                                        "
                                    >

                                        <X size={17} />

                                    </button>


                                    <div className="flex items-center gap-2 mt-2 text-xs font-bold text-green-600">

                                        <CheckCircle2
                                            size={15}
                                        />

                                        Image ready

                                    </div>

                                </div>

                            )}

                        </div>

                    </section>


                    {/* =================================================
                        ACTIONS
                    ================================================= */}

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-2">

                        <div className="flex items-center gap-2 text-xs font-bold text-slate-400">

                            <ShieldCheck
                                size={16}
                                className="text-green-600"
                            />

                            Staff-only operation

                        </div>


                        <div className="flex gap-3">

                            <button
                                type="button"
                                disabled={loading}
                                onClick={() =>
                                    navigate(
                                        companyRoute(
                                            "/staff-dashboard"
                                        )
                                    )
                                }
                                className="
                                    inline-flex
                                    items-center
                                    gap-2
                                    px-5
                                    py-2.5
                                    rounded-xl
                                    border
                                    border-slate-200
                                    dark:border-slate-700
                                    bg-white
                                    dark:bg-slate-900
                                    text-sm
                                    font-black
                                    text-slate-600
                                    dark:text-slate-300
                                    hover:bg-slate-50
                                    dark:hover:bg-slate-800
                                    transition
                                "
                            >

                                <ArrowLeft
                                    size={15}
                                />

                                Cancel

                            </button>


                            <button
                                type="submit"
                                disabled={loading}
                                className="
                                    inline-flex
                                    items-center
                                    justify-center
                                    gap-2
                                    px-6
                                    py-2.5
                                    rounded-xl
                                    bg-green-600
                                    text-white
                                    text-sm
                                    font-black
                                    hover:bg-green-700
                                    disabled:opacity-60
                                    transition
                                "
                            >

                                {loading ? (

                                    <>

                                        <RefreshCw
                                            size={16}
                                            className="animate-spin"
                                        />

                                        Saving...

                                    </>

                                ) : (

                                    <>

                                        <FilePlus2
                                            size={16}
                                        />

                                        Record found item

                                    </>

                                )}

                            </button>

                        </div>

                    </div>

                </form>


                {/* =================================================
                    FOOTER
                ================================================= */}

                <footer className="mt-8 pt-5 border-t border-slate-200 dark:border-slate-800 text-center">

                    <p className="text-xs font-bold text-slate-400">

                        {company.name} · Staff Portal

                    </p>

                </footer>

            </main>

        </div>
    );
}


export default StaffReportFoundItem;