import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
    ArrowLeft,
    Loader2,
    AlertCircle,
    Package,
    Search,
    Globe,
} from "lucide-react";

import { API } from "../../config";
const DEFAULT_SETTINGS = {
    hero_title: "Lost Something? Find It Here.",
    hero_subtitle:
        "Report lost belongings and help reunite people with their possessions.",
    about_title: "About Our Platform",
    about_text:
        "We help people reconnect with lost belongings.",
    template: "modern",
    primary_color: "#EA580C",
    secondary_color: "#292524",
    show_about: true,
    show_featured_items: true,
    show_contact: true,
    footer_text: "Helping people reconnect with their belongings.",
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

function WebsitePreview() {
    const navigate = useNavigate();
    const { companySlug } = useParams();

    const storedCompany = getStoredObject("company");
    const storedUser = getStoredObject("user");

    const activeCompanySlug =
        companySlug ||
        localStorage.getItem("companySlug") ||
        localStorage.getItem("company_slug") ||
        storedCompany?.slug ||
        storedUser?.company_slug ||
        storedUser?.companySlug ||
        "";

    const companyRoute = (path = "") => {
        const cleanPath = path.startsWith("/") ? path : `/${path}`;

        return activeCompanySlug
            ? `/company/${encodeURIComponent(activeCompanySlug)}${cleanPath}`
            : cleanPath;
    };

    const access =
        localStorage.getItem("access_token") ||
        localStorage.getItem("access");

    const [settings, setSettings] = useState(DEFAULT_SETTINGS);
    const [company, setCompany] = useState(storedCompany || {});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;

        async function loadPreview() {
            if (!access) {
                navigate(companyRoute("/login-page"), {
                    replace: true,
                });
                return;
            }

            try {
                const response = await fetch(
                    `${API}/company/website-settings/`,
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
                            "Unable to load the website preview."
                    );
                }

                if (cancelled) return;

                setSettings({
                    ...DEFAULT_SETTINGS,
                    ...(data.settings ||
                        data.website_settings ||
                        data),
                });

                if (data.company) {
                    setCompany(data.company);
                }
            } catch (err) {
                if (!cancelled) {
                    setError(err.message);
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        loadPreview();

        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeCompanySlug, access, navigate]);

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <Loader2
                    size={36}
                    className="animate-spin text-indigo-600"
                />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
                <div className="max-w-md rounded-2xl bg-white p-8 text-center shadow-sm">
                    <AlertCircle
                        size={36}
                        className="mx-auto mb-4 text-red-500"
                    />

                    <p className="font-semibold">{error}</p>

                    <button
                        type="button"
                        onClick={() =>
                            navigate(companyRoute("/website-settings"))
                        }
                        className="mt-5 rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white"
                    >
                        Return to Settings
                    </button>
                </div>
            </div>
        );
    }

    const companyName = company.name || "TrustFound";

    return (
        <div
            className={`min-h-screen ${
                settings.template === "minimal"
                    ? "bg-white"
                    : "bg-slate-50"
            }`}
        >
            <div className="border-b border-slate-200 bg-amber-50 px-4 py-3 text-center text-sm font-medium text-amber-800">
                Preview mode — this is how your homepage may appear.
            </div>

            <nav className="bg-white">
                <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-5">
                    <div className="flex items-center gap-3">
                        <div
                            className="rounded-xl p-2 text-white"
                            style={{
                                backgroundColor: settings.primary_color,
                            }}
                        >
                            <Package size={23} />
                        </div>

                        <span className="text-xl font-bold">
                            {companyName}
                        </span>
                    </div>

                    <button
                        type="button"
                        onClick={() =>
                            navigate(companyRoute("/website-settings"))
                        }
                        className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold hover:bg-slate-50"
                    >
                        <ArrowLeft size={17} />
                        Back to Settings
                    </button>
                </div>
            </nav>

            <section
                className={`px-6 py-20 text-white ${
                    settings.template === "professional"
                        ? "text-center"
                        : ""
                }`}
                style={{
                    backgroundColor: settings.primary_color,
                }}
            >
                <div className="mx-auto max-w-4xl">
                    <p className="mb-4 text-sm font-semibold uppercase tracking-widest opacity-80">
                        {companyName}
                    </p>

                    <h1 className="text-4xl font-extrabold leading-tight sm:text-6xl">
                        {settings.hero_title}
                    </h1>

                    <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 opacity-90">
                        {settings.hero_subtitle}
                    </p>

                    <div className="mt-8 flex flex-wrap justify-center gap-4">
                        <button
                            type="button"
                            className="flex items-center gap-2 rounded-xl bg-white px-6 py-3 font-bold"
                            style={{
                                color: settings.primary_color,
                            }}
                        >
                            <Search size={19} />
                            Explore Items
                        </button>

                        <button
                            type="button"
                            className="rounded-xl border border-white/50 px-6 py-3 font-bold text-white"
                        >
                            Report an Item
                        </button>
                    </div>
                </div>
            </section>

            {settings.show_about && (
                <section className="px-6 py-16">
                    <div className="mx-auto max-w-4xl text-center">
                        <h2
                            className="text-3xl font-bold"
                            style={{
                                color: settings.secondary_color,
                            }}
                        >
                            {settings.about_title}
                        </h2>

                        <p className="mt-5 whitespace-pre-wrap text-lg leading-8 text-slate-600">
                            {settings.about_text}
                        </p>
                    </div>
                </section>
            )}

            {settings.show_featured_items && (
                <section className="bg-slate-100 px-6 py-16">
                    <div className="mx-auto max-w-6xl">
                        <div className="mb-8 text-center">
                            <h2
                                className="text-3xl font-bold"
                                style={{
                                    color: settings.secondary_color,
                                }}
                            >
                                Lost and Found Items
                            </h2>

                            <p className="mt-3 text-slate-600">
                                Items reported by our community will appear
                                here.
                            </p>
                        </div>

                        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
                            <Package
                                size={42}
                                className="mx-auto text-slate-400"
                            />

                            <p className="mt-4 font-semibold text-slate-700">
                                Item listings are not connected yet.
                            </p>

                            <p className="mt-2 text-sm text-slate-500">
                                Connect your public lost and found API to
                                display real items here.
                            </p>
                        </div>
                    </div>
                </section>
            )}

            {settings.show_contact && (
                <section className="px-6 py-16">
                    <div className="mx-auto max-w-3xl rounded-2xl bg-white p-8 text-center shadow-sm">
                        <Globe
                            size={35}
                            className="mx-auto"
                            style={{
                                color: settings.primary_color,
                            }}
                        />

                        <h2 className="mt-4 text-2xl font-bold">
                            Contact Us
                        </h2>

                        <p className="mt-3 text-slate-600">
                            {company.description ||
                                "Get in touch with our team for assistance."}
                        </p>

                        {company.email && (
                            <p className="mt-3">
                                Email: {company.email}
                            </p>
                        )}

                        {company.phone && (
                            <p className="mt-2">
                                Phone: {company.phone}
                            </p>
                        )}

                        {company.location && (
                            <p className="mt-2">
                                Location: {company.location}
                            </p>
                        )}
                    </div>
                </section>
            )}

            <footer
                className="px-6 py-8 text-center text-white"
                style={{
                    backgroundColor: settings.secondary_color,
                }}
            >
                <p>{settings.footer_text}</p>

                <p className="mt-2 text-sm opacity-70">
                    © {new Date().getFullYear()} {companyName}
                </p>
            </footer>
        </div>
    );
}

export default WebsitePreview;