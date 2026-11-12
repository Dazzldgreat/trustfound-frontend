/* ============================================================
   SITE ADDRESS HELPERS

   The app is served from the platform host (e.g.
   delta-trustfound.netlify.app) AND from each company's own domain
   (e.g. www.acmelaf.com). On a company domain the root "/" shows that
   company's website and every login stays on that domain.

   Testing without DNS: open any page with
       ?simulate_domain=acmelaf.com
   and the app behaves as if it were opened on www.acmelaf.com until
   you open ?simulate_domain=off.
============================================================ */

import { API } from "../config";

const SIMULATE_KEY = "laf_simulated_domain";

// Hosts that are the platform itself, never a company domain.
const PLATFORM_HOSTS = (
    import.meta.env.VITE_PLATFORM_HOSTS ||
    "localhost,127.0.0.1,delta-trustfound.netlify.app"
)
    .split(",")
    .map((host) => host.trim().toLowerCase())
    .filter(Boolean);

function stripWww(host) {
    return String(host || "")
        .toLowerCase()
        .replace(/:\d+$/, "")
        .replace(/^www\./, "");
}

export function readSimulatedDomain() {
    try {
        const params = new URLSearchParams(window.location.search);
        const requested = params.get("simulate_domain");

        if (requested !== null) {
            if (!requested || requested === "off") {
                localStorage.removeItem(SIMULATE_KEY);
                return "";
            }
            localStorage.setItem(SIMULATE_KEY, stripWww(requested));
        }

        return localStorage.getItem(SIMULATE_KEY) || "";
    } catch {
        return "";
    }
}

export function isPlatformHost(host = window.location.hostname) {
    const clean = String(host || "").toLowerCase();

    return (
        PLATFORM_HOSTS.includes(clean) ||
        clean.endsWith(".netlify.app") ||
        clean.endsWith(".onrender.com") ||
        /^\d+\.\d+\.\d+\.\d+$/.test(clean)
    );
}

/** The company domain this page is being viewed on, or "". */
export function currentCustomDomain() {
    const simulated = readSimulatedDomain();
    if (simulated) return simulated;

    const host = window.location.hostname;
    return isPlatformHost(host) ? "" : stripWww(host);
}

export async function resolveDomain(domain) {
    const response = await fetch(
        `${API}/domains/resolve/?host=${encodeURIComponent(domain)}`
    );

    if (!response.ok) return null;

    return response.json();
}

/**
 * The address to send people to for a company's website.
 * site = the "site" object the API returns.
 */
export function publicSiteUrl(site, slug) {
    if (site?.uses_custom_domain && site.primary_domain) {
        if (site.domain_is_sandbox) {
            // Simulated domain: open the slug page pretending to be it.
            return `${window.location.origin}/company/${encodeURIComponent(
                site.slug || slug
            )}?simulate_domain=${encodeURIComponent(site.primary_domain)}`;
        }
        return site.domain_url;
    }

    const s = site?.slug || slug;
    return s ? `${window.location.origin}/company/${encodeURIComponent(s)}` : "";
}

export function displaySiteAddress(site, slug) {
    if (site?.uses_custom_domain && site.primary_host) {
        return site.primary_host;
    }
    const s = site?.slug || slug;
    return s ? `${window.location.host}/company/${s}` : "";
}

export function formatMoney(amount, currency = "USD") {
    const value = Number(amount || 0);

    try {
        return new Intl.NumberFormat(undefined, {
            style: "currency",
            currency,
            minimumFractionDigits: value % 1 === 0 ? 0 : 2,
            maximumFractionDigits: 2,
        }).format(value);
    } catch {
        return `${currency} ${value.toFixed(2)}`;
    }
}

export function companyToken() {
    return (
        localStorage.getItem("access_token") ||
        localStorage.getItem("company_access") ||
        localStorage.getItem("access") ||
        ""
    );
}

/** fetch() for company-admin endpoints with JSON in/out. */
export async function companyApi(path, { method = "GET", body } = {}) {
    const token = companyToken();

    const response = await fetch(`${API}${path}`, {
        method,
        headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    const text = await response.text();
    let data = {};

    try {
        data = text ? JSON.parse(text) : {};
    } catch {
        data = { detail: text };
    }

    if (!response.ok) {
        const message =
            data.error ||
            data.detail ||
            (response.status === 401
                ? "Your session has expired. Please log in again."
                : `Request failed (HTTP ${response.status}).`);
        const error = new Error(message);
        error.status = response.status;
        error.data = data;
        throw error;
    }

    return data;
}
