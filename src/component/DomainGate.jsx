import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import { DomainContext } from "../contexts/DomainContext";
import { currentCustomDomain, resolveDomain } from "../utils/site";

/* ============================================================
   DOMAIN GATE

   Before routing, work out whether the app is open on a company's
   own domain (www.acmelaf.com). If so, remember that company so the
   home page, login and signup all belong to it, and the visitor never
   lands on the platform's marketing page.
============================================================ */

export default function DomainGate({ children }) {
    const [state, setState] = useState(() => {
        const domain = currentCustomDomain();
        return {
            loading: Boolean(domain),
            domain,
            slug: "",
            name: "",
            error: "",
        };
    });

    useEffect(() => {
        if (!state.domain) return undefined;

        let cancelled = false;

        resolveDomain(state.domain)
            .then((data) => {
                if (cancelled) return;

                if (!data?.slug) {
                    setState((s) => ({
                        ...s,
                        loading: false,
                        error: `No organization is connected to ${state.domain} yet.`,
                    }));
                    return;
                }

                // Logins and sign-ups on this domain belong to this company.
                try {
                    localStorage.setItem("companySlug", data.slug);
                    localStorage.setItem("company_slug", data.slug);
                } catch {
                    /* storage unavailable */
                }

                setState((s) => ({
                    ...s,
                    loading: false,
                    slug: data.slug,
                    name: data.name,
                }));
            })
            .catch(() => {
                if (!cancelled) {
                    setState((s) => ({
                        ...s,
                        loading: false,
                        error: "We could not reach the server. Please try again.",
                    }));
                }
            });

        return () => {
            cancelled = true;
        };
    }, [state.domain]);

    if (state.loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-cream">
                <Loader2 className="animate-spin text-primary" size={32} />
            </div>
        );
    }

    if (state.domain && state.error) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-cream px-6">
                <div className="max-w-md rounded-3xl bg-white p-8 text-center shadow-xl">
                    <h1 className="text-2xl font-black text-graphite">
                        www.{state.domain}
                    </h1>
                    <p className="mt-3 text-stone-600">{state.error}</p>
                </div>
            </div>
        );
    }

    const simulated = Boolean(
        state.domain &&
            window.location.hostname.replace(/^www\./, "") !== state.domain
    );

    return (
        <DomainContext.Provider
            value={{
                domain: state.domain,
                slug: state.slug,
                name: state.name,
                simulated,
            }}
        >
            {simulated && (
                <div className="sticky top-0 z-[60] flex flex-wrap items-center justify-center gap-x-3 gap-y-1 bg-graphite px-4 py-2 text-center text-xs font-semibold text-white">
                    <span>
                        Test mode: viewing as <b>www.{state.domain}</b>
                    </span>
                    <a
                        href={`${window.location.pathname}?simulate_domain=off`}
                        className="underline text-orange-300"
                    >
                        Stop simulating
                    </a>
                </div>
            )}
            {children}
        </DomainContext.Provider>
    );
}
