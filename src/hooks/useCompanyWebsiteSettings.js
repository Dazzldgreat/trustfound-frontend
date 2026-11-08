import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { API } from "../config";
const DEFAULT_SETTINGS = {
    hero_title: "Lost Something? Find It Here.",
    hero_subtitle:
        "Report lost items, discover found belongings, and reconnect people with what matters.",
    about_title: "About Our Platform",
    about_text: "",
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

export default function useCompanyWebsiteSettings() {
    const { companySlug } = useParams();

    const storedCompany = getStoredObject("company");
    const storedUser = getStoredObject("user");

    const slug =
        companySlug ||
        localStorage.getItem("companySlug") ||
        localStorage.getItem("company_slug") ||
        storedCompany?.slug ||
        storedUser?.company_slug ||
        storedUser?.companySlug ||
        storedUser?.company?.slug ||
        "";

    const [settings, setSettings] = useState(DEFAULT_SETTINGS);
    const [company, setCompany] = useState(storedCompany || {});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;

        async function loadSettings() {
            setLoading(true);
            setError("");

            try {
                if (!slug) {
                    throw new Error("The company could not be identified.");
                }

                const access =
                    localStorage.getItem("access_token") ||
                    localStorage.getItem("access");

                const response = await fetch(
                    `${API}/company/public/${encodeURIComponent(slug)}/website/`,
                    {
                        headers: access
                            ? {
                                  Authorization: `Bearer ${access}`,
                              }
                            : {},
                    }
                );

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(
                        data.detail ||
                            data.error ||
                            "Unable to load company website settings."
                    );
                }

                if (cancelled) return;

                setCompany(data.company || {});
                setSettings({
                    ...DEFAULT_SETTINGS,
                    ...(data.settings || data.website_settings || {}),
                });
            } catch (err) {
                if (!cancelled) {
                    setError(err.message || "Unable to load settings.");
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        loadSettings();

        return () => {
            cancelled = true;
        };
    }, [slug]);

    return {
        company,
        settings,
        loading,
        error,
        companySlug: slug,
    };
}