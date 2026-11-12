import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
    AlertCircle,
    ArrowLeft,
    BadgePercent,
    CheckCircle2,
    CreditCard,
    FlaskConical,
    Gift,
    Globe,
    Loader2,
    Lock,
    ShieldCheck,
    Tag,
    X,
} from "lucide-react";

import { companyApi, formatMoney } from "../../utils/site";

/* ============================================================
   CHECKOUT

   One payment page for subscriptions and domains.

   /company/checkout?purpose=subscription&plan=starter&periods=1
   /company/checkout?purpose=domain&domain=acmelaf.com&years=1
   optional: &return=/company-dashboard?tab=domain

   Payment providers:
   * paystack - Paystack popup, the company never leaves the site
   * sandbox  - test mode (no Paystack keys): simulated card form
   * free     - a 100% promo code: nothing to pay
============================================================ */

const PAYSTACK_SCRIPT = "https://js.paystack.co/v2/inline.js";

function loadPaystack() {
    if (window.PaystackPop) return Promise.resolve(window.PaystackPop);

    return new Promise((resolve, reject) => {
        const existing = document.querySelector(`script[src="${PAYSTACK_SCRIPT}"]`);
        const script = existing || document.createElement("script");

        script.addEventListener("load", () => resolve(window.PaystackPop));
        script.addEventListener("error", () => reject(new Error("Could not load Paystack.")));

        if (!existing) {
            script.src = PAYSTACK_SCRIPT;
            script.async = true;
            document.body.appendChild(script);
        }
    });
}

function safeReturnPath(value) {
    // Only same-site relative paths, never another website.
    if (value && value.startsWith("/") && !value.startsWith("//")) return value;
    return "/company-dashboard?tab=billing";
}

export default function Checkout() {
    const navigate = useNavigate();
    const location = useLocation();
    const params = useMemo(() => new URLSearchParams(location.search), [location.search]);

    const purpose = params.get("purpose") || "subscription";
    const returnTo = safeReturnPath(params.get("return"));

    const [order, setOrder] = useState({
        purpose,
        plan_code: params.get("plan") || "",
        periods: Number(params.get("periods") || 1),
        domain: params.get("domain") || "",
        years: Number(params.get("years") || 1),
    });

    const [codeInput, setCodeInput] = useState(params.get("code") || "");
    const [appliedCode, setAppliedCode] = useState("");
    const [codeError, setCodeError] = useState("");

    const [quote, setQuote] = useState(null);
    const [loadingQuote, setLoadingQuote] = useState(true);
    const [error, setError] = useState("");

    const [paying, setPaying] = useState(false);
    const [sandboxPayment, setSandboxPayment] = useState(null);
    const [result, setResult] = useState(null);
    const verifyingRef = useRef(false);

    // ----------------------------------------------------------
    // Quote
    // ----------------------------------------------------------

    const fetchQuote = useCallback(
        async (code) => {
            const data = await companyApi("/billing/quote/", {
                method: "POST",
                body: { ...order, promo_code: code || "" },
            });
            return data.quote;
        },
        [order]
    );

    useEffect(() => {
        let cancelled = false;
        setLoadingQuote(true);
        setError("");

        fetchQuote(appliedCode)
            .then((q) => !cancelled && setQuote(q))
            .catch((err) => {
                if (cancelled) return;
                if (appliedCode) {
                    // The code stopped being valid (e.g. order changed).
                    setAppliedCode("");
                    setCodeError(err.message);
                } else {
                    setError(err.message);
                }
            })
            .finally(() => !cancelled && setLoadingQuote(false));

        return () => {
            cancelled = true;
        };
    }, [fetchQuote, appliedCode]);

    const applyCode = async (event) => {
        event.preventDefault();
        const code = codeInput.trim();
        if (!code) return;

        setCodeError("");
        setLoadingQuote(true);

        try {
            const q = await fetchQuote(code);
            setQuote(q);
            setAppliedCode(code);
        } catch (err) {
            setCodeError(err.message);
        } finally {
            setLoadingQuote(false);
        }
    };

    const removeCode = () => {
        setAppliedCode("");
        setCodeInput("");
        setCodeError("");
    };

    // ----------------------------------------------------------
    // Verify (Paystack callback / popup success)
    // ----------------------------------------------------------

    const verify = useCallback(async (reference) => {
        if (verifyingRef.current) return;
        verifyingRef.current = true;
        setPaying(true);
        setError("");

        try {
            // Paystack may need a moment to settle: retry briefly.
            let data = null;
            for (let attempt = 0; attempt < 4; attempt += 1) {
                data = await companyApi("/billing/verify/", {
                    method: "POST",
                    body: { reference },
                });
                if (data.payment.status !== "pending") break;
                await new Promise((r) => setTimeout(r, 2000));
            }

            if (data.payment.status === "success") {
                setResult(data);
            } else if (data.payment.status === "pending") {
                setError("We have not received confirmation from Paystack yet. Refresh this page in a minute.");
            } else {
                setError(data.payment.failure_reason || "The payment was not completed.");
            }
        } catch (err) {
            setError(err.message);
        } finally {
            verifyingRef.current = false;
            setPaying(false);
        }
    }, []);

    // Redirect fallback: /company/checkout/callback?reference=...
    useEffect(() => {
        const reference = params.get("reference") || params.get("trxref");
        if (reference) verify(reference);
    }, [params, verify]);

    // ----------------------------------------------------------
    // Pay
    // ----------------------------------------------------------

    const pay = async () => {
        setPaying(true);
        setError("");

        try {
            const data = await companyApi("/billing/checkout/", {
                method: "POST",
                body: { ...order, promo_code: appliedCode },
            });

            if (data.provider === "free" || data.payment.status === "success") {
                setResult(data);
                setPaying(false);
                return;
            }

            if (data.provider === "sandbox") {
                setSandboxPayment(data.payment);
                setPaying(false);
                return;
            }

            // Paystack popup keeps the company on our website.
            const { access_code: accessCode, authorization_url: authUrl } = data.provider_data;
            const reference = data.payment.reference;

            try {
                const PaystackPop = await loadPaystack();
                const popup = new PaystackPop();

                popup.resumeTransaction(accessCode, {
                    onSuccess: () => verify(reference),
                    onCancel: () => {
                        setPaying(false);
                        setError("Payment window closed. You have not been charged.");
                    },
                    onError: (err) => {
                        setPaying(false);
                        setError(err?.message || "Paystack reported an error.");
                    },
                });
            } catch {
                // Popup blocked or script failed: use Paystack's page.
                window.location.assign(authUrl);
            }
        } catch (err) {
            setError(err.message);
            setPaying(false);
        }
    };

    const completeSandbox = async (outcome) => {
        setPaying(true);
        setError("");

        try {
            const data = await companyApi("/billing/sandbox/complete/", {
                method: "POST",
                body: { reference: sandboxPayment.reference, outcome },
            });

            if (data.payment.status === "success") {
                setSandboxPayment(null);
                setResult(data);
            } else {
                setSandboxPayment(null);
                setError("Test payment declined. Nothing was charged.");
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setPaying(false);
        }
    };

    // ----------------------------------------------------------
    // Render
    // ----------------------------------------------------------

    if (result) {
        return <Success result={result} returnTo={returnTo} navigate={navigate} />;
    }

    const isDomain = order.purpose === "domain";
    const unitLabel = isDomain
        ? "Years"
        : quote?.plan?.interval === "year"
          ? "Years"
          : "Months";

    return (
        <div className="min-h-screen bg-cream px-4 py-8 sm:py-12">
            <div className="mx-auto max-w-5xl">
                <button
                    type="button"
                    onClick={() => (window.history.length > 1 ? navigate(-1) : navigate(returnTo))}
                    className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-stone-600 hover:text-primary"
                >
                    <ArrowLeft size={16} /> Back
                </button>

                <h1 className="text-3xl font-black text-graphite sm:text-4xl">
                    {isDomain ? "Buy your domain" : "Choose your subscription"}
                </h1>
                <p className="mt-2 text-stone-500">
                    Secure checkout. Have a code? Enter it to get a discount or a free subscription.
                </p>

                {error && (
                    <div role="alert" className="mt-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
                        <AlertCircle size={20} className="mt-0.5 shrink-0" />
                        <p>{error}</p>
                    </div>
                )}

                <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
                    {/* ORDER */}
                    <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-stone-200 sm:p-8">
                        <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 text-primary">
                                {isDomain ? <Globe size={22} /> : <CreditCard size={22} />}
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs font-bold uppercase tracking-wider text-stone-500">
                                    {isDomain ? "Domain" : "Plan"}
                                </p>
                                <p className="truncate text-xl font-black text-graphite">
                                    {isDomain ? `www.${order.domain}` : quote?.plan?.name || "…"}
                                </p>
                            </div>
                        </div>

                        {!isDomain && quote?.plan?.features?.length > 0 && (
                            <ul className="mt-6 grid gap-2 text-sm text-stone-600 sm:grid-cols-2">
                                {quote.plan.features.map((feature) => (
                                    <li key={feature} className="flex items-center gap-2">
                                        <CheckCircle2 size={16} className="shrink-0 text-green-600" />
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                        )}

                        {isDomain && (
                            <p className="mt-6 rounded-2xl bg-orange-50 p-4 text-sm text-stone-700">
                                We register the domain, point it at your website and switch on HTTPS
                                for you. Customers will open <b>www.{order.domain}</b> to report
                                and recover items.
                            </p>
                        )}

                        <label className="mt-6 block text-sm font-bold text-graphite" htmlFor="periods">
                            {unitLabel}
                        </label>
                        <select
                            id="periods"
                            value={isDomain ? order.years : order.periods}
                            onChange={(e) => {
                                const value = Number(e.target.value);
                                setOrder((o) => (isDomain ? { ...o, years: value } : { ...o, periods: value }));
                            }}
                            className="mt-2 w-full rounded-xl border border-stone-200 bg-white px-4 py-3 font-semibold outline-none focus:ring-2 focus:ring-primary sm:w-48"
                        >
                            {(isDomain ? [1, 2, 3, 5] : [1, 3, 6, 12]).map((n) => (
                                <option key={n} value={n}>
                                    {n} {unitLabel.toLowerCase().replace(/s$/, "")}
                                    {n > 1 ? "s" : ""}
                                </option>
                            ))}
                        </select>

                        {/* PROMO CODE */}
                        <div className="mt-8 border-t border-stone-100 pt-6">
                            <p className="flex items-center gap-2 text-sm font-bold text-graphite">
                                <Tag size={16} /> Promo or free-subscription code
                            </p>

                            {appliedCode ? (
                                <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3">
                                    <div className="flex items-center gap-2 text-green-800">
                                        {quote?.promo?.kind === "free" ? <Gift size={18} /> : <BadgePercent size={18} />}
                                        <span className="font-mono font-bold">{quote?.promo?.code || appliedCode.toUpperCase()}</span>
                                        <span className="text-sm">{quote?.promo?.label}</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={removeCode}
                                        className="rounded-lg p-1 text-green-800 hover:bg-green-100"
                                        aria-label="Remove code"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={applyCode} className="mt-3 flex gap-2">
                                    <input
                                        value={codeInput}
                                        onChange={(e) => {
                                            setCodeInput(e.target.value);
                                            setCodeError("");
                                        }}
                                        placeholder="e.g. LAF-AB12-CD34"
                                        autoComplete="off"
                                        className="min-w-0 flex-1 rounded-xl border border-stone-200 px-4 py-3 font-mono uppercase outline-none focus:ring-2 focus:ring-primary"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!codeInput.trim() || loadingQuote}
                                        className="rounded-xl bg-graphite px-5 py-3 font-bold text-white disabled:opacity-50"
                                    >
                                        Apply
                                    </button>
                                </form>
                            )}
                            {codeError && <p className="mt-2 text-sm font-semibold text-red-600">{codeError}</p>}
                        </div>
                    </section>

                    {/* SUMMARY */}
                    <aside className="h-fit rounded-3xl bg-graphite p-6 text-white shadow-xl sm:p-8 lg:sticky lg:top-6">
                        <p className="text-sm font-bold uppercase tracking-wider text-white/60">Order summary</p>

                        {loadingQuote && !quote ? (
                            <div className="flex justify-center py-10">
                                <Loader2 className="animate-spin" />
                            </div>
                        ) : quote ? (
                            <>
                                <p className="mt-3 text-sm text-white/80">{quote.description}</p>

                                <dl className="mt-6 space-y-3 text-sm">
                                    <div className="flex justify-between">
                                        <dt className="text-white/70">Price</dt>
                                        <dd className="font-semibold">{formatMoney(quote.amount_original, quote.currency)}</dd>
                                    </div>
                                    {Number(quote.discount_amount) > 0 && (
                                        <div className="flex justify-between text-green-300">
                                            <dt>Discount ({quote.promo?.label})</dt>
                                            <dd className="font-semibold">− {formatMoney(quote.discount_amount, quote.currency)}</dd>
                                        </div>
                                    )}
                                </dl>

                                <div className="mt-6 flex items-end justify-between border-t border-white/10 pt-6">
                                    <span className="font-bold">Total</span>
                                    <span className="text-3xl font-black">
                                        {quote.is_free ? "Free" : formatMoney(quote.amount, quote.currency)}
                                    </span>
                                </div>

                                <button
                                    type="button"
                                    onClick={pay}
                                    disabled={paying || loadingQuote}
                                    className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-4 font-bold text-white shadow-lg transition hover:bg-primary-dark disabled:opacity-60"
                                >
                                    {paying ? <Loader2 size={18} className="animate-spin" /> : <Lock size={18} />}
                                    {quote.is_free ? "Activate for free" : `Pay ${formatMoney(quote.amount, quote.currency)}`}
                                </button>

                                <p className="mt-4 flex items-center justify-center gap-2 text-xs text-white/60">
                                    <ShieldCheck size={14} /> Payments processed securely by Paystack
                                </p>
                            </>
                        ) : (
                            <p className="mt-6 text-sm text-white/70">This order could not be priced.</p>
                        )}
                    </aside>
                </div>
            </div>

            {sandboxPayment && (
                <SandboxPayModal
                    payment={sandboxPayment}
                    busy={paying}
                    onPay={() => completeSandbox("success")}
                    onDecline={() => completeSandbox("fail")}
                    onClose={() => setSandboxPayment(null)}
                />
            )}
        </div>
    );
}

function SandboxPayModal({ payment, busy, onPay, onDecline, onClose }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" role="dialog" aria-modal="true">
            <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                            <FlaskConical size={20} />
                        </div>
                        <div>
                            <p className="font-black text-graphite">Test payment</p>
                            <p className="text-xs text-stone-500">Sandbox mode - no real money moves</p>
                        </div>
                    </div>
                    <button type="button" onClick={onClose} className="rounded-lg p-1 hover:bg-stone-100" aria-label="Close">
                        <X size={20} />
                    </button>
                </div>

                <div className="mt-6 rounded-2xl bg-stone-50 p-4 text-sm">
                    <p className="text-stone-500">{payment.description}</p>
                    <p className="mt-1 text-2xl font-black text-graphite">{formatMoney(payment.amount, payment.currency)}</p>
                    <p className="mt-2 font-mono text-xs text-stone-400">{payment.reference}</p>
                </div>

                <p className="mt-4 text-xs text-stone-500">
                    Add <code>PAYSTACK_SECRET_KEY</code> and <code>PAYSTACK_PUBLIC_KEY</code> on the server to take real payments.
                </p>

                <div className="mt-6 grid grid-cols-2 gap-3">
                    <button
                        type="button"
                        onClick={onDecline}
                        disabled={busy}
                        className="rounded-xl border border-stone-200 py-3 font-bold text-stone-700 hover:bg-stone-50 disabled:opacity-50"
                    >
                        Decline
                    </button>
                    <button
                        type="button"
                        onClick={onPay}
                        disabled={busy}
                        className="flex items-center justify-center gap-2 rounded-xl bg-green-600 py-3 font-bold text-white hover:bg-green-700 disabled:opacity-50"
                    >
                        {busy && <Loader2 size={16} className="animate-spin" />} Pay (test)
                    </button>
                </div>
            </div>
        </div>
    );
}

function Success({ result, returnTo, navigate }) {
    const { payment, subscription, domain, site } = result;
    const isDomain = payment.purpose === "domain";
    const domainFailed = isDomain && domain && domain.status !== "active";

    return (
        <div className="flex min-h-screen items-center justify-center bg-cream px-4 py-12">
            <div className="w-full max-w-lg rounded-3xl bg-white p-8 text-center shadow-xl">
                <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${domainFailed ? "bg-amber-100 text-amber-600" : "bg-green-100 text-green-600"}`}>
                    {domainFailed ? <AlertCircle size={32} /> : <CheckCircle2 size={32} />}
                </div>

                <h1 className="mt-5 text-2xl font-black text-graphite">
                    {payment.provider === "free" ? "Code applied" : "Payment successful"}
                </h1>

                {isDomain ? (
                    domainFailed ? (
                        <p className="mt-3 text-stone-600">
                            Your payment was received, but setting up <b>www.{payment.domain}</b> needs another try:
                            <br />
                            <span className="text-sm text-red-600">{domain.last_error}</span>
                            <br />
                            Use <b>Retry setup</b> in Domain &amp; Hosting, or contact support.
                        </p>
                    ) : (
                        <p className="mt-3 text-stone-600">
                            <b>www.{payment.domain}</b> is yours and connected to your website.
                            {site?.domain_is_sandbox && " (Simulated in test mode.)"}
                            {!site?.domain_is_sandbox && " New domains can take up to an hour to work everywhere."}
                        </p>
                    )
                ) : (
                    <p className="mt-3 text-stone-600">
                        Your <b>{subscription?.plan?.name}</b> plan is active
                        {subscription?.current_period_end &&
                            ` until ${new Date(subscription.current_period_end).toLocaleDateString()}`}
                        .
                    </p>
                )}

                <p className="mt-4 font-mono text-xs text-stone-400">{payment.reference}</p>

                <button
                    type="button"
                    onClick={() => navigate(returnTo, { replace: true })}
                    className="mt-8 w-full rounded-xl bg-primary py-4 font-bold text-white hover:bg-primary-dark"
                >
                    Continue
                </button>
            </div>
        </div>
    );
}
