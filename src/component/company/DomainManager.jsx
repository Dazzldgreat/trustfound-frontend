import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    AlertCircle,
    CheckCircle2,
    ExternalLink,
    FlaskConical,
    Globe,
    Link2,
    Loader2,
    RefreshCw,
    Search,
    Server,
    ShieldCheck,
    Star,
    XCircle,
} from "lucide-react";

import {
    companyApi,
    displaySiteAddress,
    formatMoney,
    publicSiteUrl,
} from "../../utils/site";

/* ============================================================
   DOMAIN & HOSTING

   * Free address:   <platform>/company/<slug>   ("Use slug")
   * Custom domain:  www.<name>laf.<tld>        (search + buy here,
                                                 never leaving the site)

   mode="setup"  - shown after company setup, with a Skip option
   mode="manage" - dashboard / website settings
============================================================ */

export default function DomainManager({ mode = "manage", returnTo, onDone }) {
    const navigate = useNavigate();

    const [overview, setOverview] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");

    const load = useCallback(async () => {
        setError("");
        try {
            const data = await companyApi("/billing/overview/");
            setOverview(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    if (loading) {
        return (
            <div className="flex justify-center rounded-3xl bg-white p-10 ring-1 ring-stone-200">
                <Loader2 className="animate-spin text-primary" />
            </div>
        );
    }

    if (!overview) {
        return (
            <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-red-700">
                {error || "Domain settings could not be loaded."}
            </div>
        );
    }

    const { site, domains, config, company } = overview;
    const back = returnTo || "/company-dashboard?tab=domain";

    const buy = (domain) => {
        const query = new URLSearchParams({
            purpose: "domain",
            domain,
            years: "1",
            return: back,
        });
        navigate(`/company/checkout?${query.toString()}`);
    };

    return (
        <div className="space-y-6">
            {error && (
                <div role="alert" className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
                    <AlertCircle size={20} className="mt-0.5 shrink-0" /> <p>{error}</p>
                </div>
            )}
            {notice && (
                <div className="flex items-start gap-3 rounded-2xl border border-green-200 bg-green-50 p-4 text-green-800">
                    <CheckCircle2 size={20} className="mt-0.5 shrink-0" /> <p className="font-semibold">{notice}</p>
                </div>
            )}

            {(config.domains_sandbox || config.payments_sandbox) && (
                <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                    <FlaskConical size={18} className="mt-0.5 shrink-0" />
                    <p>
                        <b>Test mode.</b>{" "}
                        {config.domains_sandbox
                            ? "Domains are simulated (any name containing “taken” shows as unavailable). "
                            : `Domains are bought from GoDaddy (${config.godaddy_env === "production" ? "live" : "test environment"}). `}
                        {config.payments_sandbox && "Payments use a test button instead of a real card."}
                    </p>
                </div>
            )}

            <CurrentAddress site={site} slug={company.slug} />

            {mode === "setup" && (
                <p className="text-center text-sm text-stone-500">
                    Pick one below. You can change it any time in <b>Website Settings → Domain &amp; Hosting</b>.
                </p>
            )}

            <div className="grid gap-6 xl:grid-cols-2">
                <SlugCard
                    setupMode={mode === "setup"}
                    company={company}
                    site={site}
                    onSaved={(data, message) => {
                        setOverview((o) => ({ ...o, site: data.site, company: data.company }));
                        persistSlug(data.company.slug);
                        setNotice(message);
                        if (mode === "setup" && onDone) onDone();
                    }}
                    onError={setError}
                />

                <DomainSearch config={config} onBuy={buy} />
            </div>

            {domains.length > 0 && (
                <OwnedDomains
                    domains={domains}
                    onChanged={(message) => {
                        setNotice(message);
                        load();
                    }}
                    onError={setError}
                />
            )}

            <HostingInfo config={config} />

            {mode === "setup" && (
                <div className="text-center">
                    <button
                        type="button"
                        onClick={onDone}
                        className="text-sm font-bold text-stone-500 underline hover:text-primary"
                    >
                        Skip for now - I&apos;ll choose later in Website Settings
                    </button>
                </div>
            )}
        </div>
    );
}

function persistSlug(slug) {
    try {
        localStorage.setItem("companySlug", slug);
        localStorage.setItem("company_slug", slug);
        const company = JSON.parse(localStorage.getItem("company") || "{}");
        localStorage.setItem("company", JSON.stringify({ ...company, slug }));
    } catch {
        /* storage unavailable */
    }
}

// ------------------------------------------------------------

function CurrentAddress({ site, slug }) {
    const url = publicSiteUrl(site, slug);

    return (
        <div className="flex flex-col gap-4 rounded-3xl bg-graphite p-6 text-white sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-wider text-white/60">Your website address</p>
                <p className="mt-1 truncate text-xl font-black sm:text-2xl">{displaySiteAddress(site, slug)}</p>
                <p className="mt-1 text-sm text-white/60">
                    {site.uses_custom_domain
                        ? site.domain_is_sandbox
                            ? "Custom domain (simulated in test mode)"
                            : "Custom domain - customers and staff log in here"
                        : "Free address using your slug"}
                </p>
            </div>
            {url && (
                <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 font-bold hover:bg-primary-dark"
                >
                    Open website <ExternalLink size={16} />
                </a>
            )}
        </div>
    );
}

// ------------------------------------------------------------

function SlugCard({ setupMode, company, site, onSaved, onError }) {
    const [slug, setSlug] = useState(company.slug);
    const [check, setCheck] = useState(null);
    const [checking, setChecking] = useState(false);
    const [saving, setSaving] = useState(false);
    const timer = useRef(null);

    useEffect(() => {
        setSlug(company.slug);
    }, [company.slug]);

    const changed = slug.trim() && slug.trim() !== company.slug;

    useEffect(() => {
        clearTimeout(timer.current);
        if (!changed) {
            setCheck(null);
            return undefined;
        }

        setChecking(true);
        timer.current = setTimeout(async () => {
            try {
                setCheck(await companyApi(`/domains/check-slug/?slug=${encodeURIComponent(slug)}`));
            } catch (err) {
                setCheck({ available: false, reason: err.message });
            } finally {
                setChecking(false);
            }
        }, 400);

        return () => clearTimeout(timer.current);
    }, [slug, changed]);

    const save = async () => {
        setSaving(true);
        onError("");
        try {
            const data = await companyApi("/domains/use-slug/", {
                method: "POST",
                body: changed ? { slug: check?.slug || slug } : {},
            });
            onSaved(
                data,
                `Your website now uses ${window.location.host}/company/${data.company.slug}`
            );
        } catch (err) {
            onError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const active = !site.uses_custom_domain;
    const blocked = changed && (checking || !check?.available);

    return (
        <section className={`rounded-3xl bg-white p-6 ring-1 ${active ? "ring-2 ring-primary" : "ring-stone-200"}`}>
            <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-stone-100 text-graphite">
                    <Link2 size={20} />
                </div>
                <div>
                    <h3 className="font-black text-graphite">Free address (slug)</h3>
                    <p className="text-sm text-stone-500">Included with every plan.</p>
                </div>
                {active && (
                    <span className="ml-auto rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-primary">In use</span>
                )}
            </div>

            <label className="mt-5 block text-sm font-bold text-graphite" htmlFor="slug-input">Slug</label>
            <div className="mt-2 flex overflow-hidden rounded-xl border border-stone-200 focus-within:ring-2 focus-within:ring-primary">
                <span className="hidden items-center bg-stone-50 px-3 text-sm text-stone-500 sm:flex">
                    {window.location.host}/company/
                </span>
                <input
                    id="slug-input"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
                    className="min-w-0 flex-1 px-3 py-3 font-semibold outline-none"
                />
            </div>

            <p className="mt-2 min-h-[1.25rem] text-sm">
                {changed && checking && <span className="text-stone-500">Checking…</span>}
                {changed && !checking && check && (
                    check.available
                        ? <span className="font-semibold text-green-700">Available: /company/{check.slug}</span>
                        : <span className="font-semibold text-red-600">{check.reason || "Not available"}</span>
                )}
            </p>

            {changed && (
                <p className="text-xs text-amber-700">
                    Changing your slug changes your free address. Old links using the previous slug stop working.
                </p>
            )}

            <button
                type="button"
                onClick={save}
                disabled={saving || blocked || (!setupMode && active && !changed)}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-graphite px-5 py-3 font-bold text-white disabled:opacity-50"
            >
                {saving && <Loader2 size={16} className="animate-spin" />}
                {setupMode
                    ? "Use slug address & continue"
                    : active && !changed
                      ? "Using slug address"
                      : "Use slug address"}
            </button>
        </section>
    );
}

// ------------------------------------------------------------

function DomainSearch({ config, onBuy }) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState(null);
    const [searching, setSearching] = useState(false);
    const [error, setError] = useState("");

    const suffix = config.domain_suffix || "laf";
    const cleanName = query
        .toLowerCase()
        .replace(/^https?:\/\//, "")
        .replace(/^www\./, "")
        .split(".")[0]
        .replace(/[^a-z0-9-]/g, "");
    const preview = cleanName
        ? `www.${cleanName.endsWith(suffix) ? cleanName : cleanName + suffix}.${config.domain_tlds?.[0] || "com"}`
        : `www.yourname${suffix}.com`;

    const search = async (event) => {
        event.preventDefault();
        if (!cleanName) return;

        setSearching(true);
        setError("");
        setResults(null);

        try {
            setResults(await companyApi(`/domains/search/?q=${encodeURIComponent(query)}`));
        } catch (err) {
            setError(err.message);
        } finally {
            setSearching(false);
        }
    };

    return (
        <section className="rounded-3xl bg-white p-6 ring-1 ring-stone-200">
            <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-100 text-primary">
                    <Globe size={20} />
                </div>
                <div>
                    <h3 className="font-black text-graphite">Your own domain</h3>
                    <p className="text-sm text-stone-500">
                        Every domain ends in <b>{suffix}</b>, e.g. {preview}
                    </p>
                </div>
            </div>

            <form onSubmit={search} className="mt-5">
                <label className="block text-sm font-bold text-graphite" htmlFor="domain-input">
                    Company name or the name you want
                </label>
                <div className="mt-2 flex gap-2">
                    <div className="flex min-w-0 flex-1 overflow-hidden rounded-xl border border-stone-200 focus-within:ring-2 focus-within:ring-primary">
                        <span className="flex items-center bg-stone-50 px-3 text-sm text-stone-500">www.</span>
                        <input
                            id="domain-input"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="acmehotel"
                            autoComplete="off"
                            className="min-w-0 flex-1 px-2 py-3 font-semibold outline-none"
                        />
                        <span className="flex items-center bg-orange-50 px-3 text-sm font-bold text-primary">{suffix}</span>
                    </div>
                    <button
                        type="submit"
                        disabled={!cleanName || searching}
                        className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-3 font-bold text-white disabled:opacity-50"
                    >
                        {searching ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
                        <span className="hidden sm:inline">Search</span>
                    </button>
                </div>
            </form>

            {error && <p className="mt-3 text-sm font-semibold text-red-600">{error}</p>}

            {results && (
                <ul className="mt-5 divide-y divide-stone-100 rounded-2xl ring-1 ring-stone-200">
                    {results.results.map((row) => (
                        <li key={row.domain} className="flex items-center gap-3 px-4 py-3">
                            {row.available ? (
                                <CheckCircle2 size={18} className="shrink-0 text-green-600" />
                            ) : (
                                <XCircle size={18} className="shrink-0 text-stone-300" />
                            )}
                            <div className="min-w-0 flex-1">
                                <p className={`truncate font-bold ${row.available ? "text-graphite" : "text-stone-400 line-through"}`}>
                                    {row.host}
                                </p>
                                <p className="text-xs text-stone-500">
                                    {row.available && row.price
                                        ? `${formatMoney(row.price, row.currency)} / year`
                                        : "Not available"}
                                </p>
                            </div>
                            {row.available && (
                                <button
                                    type="button"
                                    onClick={() => onBuy(row.domain)}
                                    className="rounded-lg bg-graphite px-4 py-2 text-sm font-bold text-white hover:bg-black"
                                >
                                    Buy
                                </button>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}

// ------------------------------------------------------------

const DOMAIN_STATUS = {
    active: "bg-green-100 text-green-800",
    registering: "bg-amber-100 text-amber-800",
    failed: "bg-red-100 text-red-700",
    expired: "bg-stone-200 text-stone-600",
};

function OwnedDomains({ domains, onChanged, onError }) {
    const [busy, setBusy] = useState(null);

    const act = async (domain, action) => {
        setBusy(`${domain.id}-${action}`);
        onError("");
        try {
            if (action === "primary") {
                await companyApi(`/domains/${domain.id}/primary/`, { method: "POST" });
                onChanged(`www.${domain.domain} is now your main website address.`);
            } else {
                const data = await companyApi(`/domains/${domain.id}/retry/`, { method: "POST" });
                if (data.domain.status === "active") {
                    onChanged(`www.${domain.domain} is connected.`);
                } else {
                    onError(data.domain.last_error || "Setup still failing. Our team has been notified.");
                    onChanged("");
                }
            }
        } catch (err) {
            onError(err.message);
        } finally {
            setBusy(null);
        }
    };

    return (
        <section className="rounded-3xl bg-white p-6 ring-1 ring-stone-200">
            <h3 className="font-black text-graphite">Your domains</h3>
            <ul className="mt-4 space-y-3">
                {domains.map((domain) => (
                    <li key={domain.id} className="flex flex-col gap-3 rounded-2xl bg-stone-50 p-4 sm:flex-row sm:items-center">
                        <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                                <p className="truncate font-bold text-graphite">{domain.host}</p>
                                <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${DOMAIN_STATUS[domain.status] || ""}`}>
                                    {domain.status_label}
                                </span>
                                {domain.is_primary && (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-bold text-primary">
                                        <Star size={12} /> Main address
                                    </span>
                                )}
                                {domain.provider === "sandbox" && (
                                    <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800">Simulated</span>
                                )}
                            </div>
                            <p className="mt-1 text-xs text-stone-500">
                                DNS {domain.dns_configured ? "✓" : "pending"} · Hosting {domain.hosting_connected ? "✓" : "pending"}
                                {domain.expires_at && ` · Renews ${new Date(domain.expires_at).toLocaleDateString()}`}
                            </p>
                            {domain.last_error && <p className="mt-1 text-xs text-red-600">{domain.last_error}</p>}
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {domain.status === "active" && !domain.is_primary && (
                                <button
                                    type="button"
                                    onClick={() => act(domain, "primary")}
                                    disabled={Boolean(busy)}
                                    className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm font-bold hover:bg-stone-100 disabled:opacity-50"
                                >
                                    Make main address
                                </button>
                            )}
                            {domain.status === "failed" && (
                                <button
                                    type="button"
                                    onClick={() => act(domain, "retry")}
                                    disabled={Boolean(busy)}
                                    className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-sm font-bold text-white disabled:opacity-50"
                                >
                                    {busy === `${domain.id}-retry` ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                                    Retry setup
                                </button>
                            )}
                        </div>
                    </li>
                ))}
            </ul>
        </section>
    );
}

function HostingInfo({ config }) {
    return (
        <section className="grid gap-4 rounded-3xl bg-white p-6 ring-1 ring-stone-200 sm:grid-cols-3">
            <div className="flex gap-3">
                <Server size={20} className="shrink-0 text-primary" />
                <div>
                    <p className="font-bold text-graphite">Hosting included</p>
                    <p className="text-sm text-stone-500">Your website runs on our servers. Nothing to install.</p>
                </div>
            </div>
            <div className="flex gap-3">
                <ShieldCheck size={20} className="shrink-0 text-primary" />
                <div>
                    <p className="font-bold text-graphite">Free HTTPS</p>
                    <p className="text-sm text-stone-500">Security certificate set up automatically for your domain.</p>
                </div>
            </div>
            <div className="flex gap-3">
                <Globe size={20} className="shrink-0 text-primary" />
                <div>
                    <p className="font-bold text-graphite">DNS handled</p>
                    <p className="text-sm text-stone-500">
                        Registered with GoDaddy{config.godaddy_env !== "production" && config.domains_sandbox ? " (simulated)" : ""} and pointed at your site for you.
                    </p>
                </div>
            </div>
        </section>
    );
}
