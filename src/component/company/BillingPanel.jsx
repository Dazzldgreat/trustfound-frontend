import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    AlertCircle,
    CalendarClock,
    CheckCircle2,
    CreditCard,
    FlaskConical,
    Loader2,
    Receipt,
    Sparkles,
} from "lucide-react";

import { companyApi, formatMoney } from "../../utils/site";

/* ============================================================
   BILLING & SUBSCRIPTION (company dashboard tab)
============================================================ */

const STATUS_STYLE = {
    active: "bg-green-100 text-green-800",
    trialing: "bg-blue-100 text-blue-800",
    expired: "bg-red-100 text-red-700",
    cancelled: "bg-stone-200 text-stone-700",
};

const PAYMENT_STYLE = {
    success: "text-green-700",
    pending: "text-amber-700",
    failed: "text-red-600",
    cancelled: "text-stone-500",
};

export default function BillingPanel() {
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [error, setError] = useState("");

    useEffect(() => {
        companyApi("/billing/overview/")
            .then(setData)
            .catch((err) => setError(err.message));
    }, []);

    if (error) {
        return (
            <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
                <AlertCircle size={20} className="mt-0.5 shrink-0" /> {error}
            </div>
        );
    }

    if (!data) {
        return (
            <div className="flex justify-center p-12">
                <Loader2 className="animate-spin text-primary" />
            </div>
        );
    }

    const { subscription: sub, plans, payments, config } = data;

    const choose = (plan) => {
        const query = new URLSearchParams({
            purpose: "subscription",
            plan: plan.code,
            periods: "1",
            return: "/company-dashboard?tab=billing",
        });
        navigate(`/company/checkout?${query.toString()}`);
    };

    return (
        <div className="space-y-8">
            {config.payments_sandbox && (
                <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                    <FlaskConical size={18} className="mt-0.5 shrink-0" />
                    <p><b>Test mode.</b> Checkout uses a test payment button until Paystack keys are added on the server.</p>
                </div>
            )}

            {/* CURRENT */}
            <section className="flex flex-col gap-5 rounded-3xl bg-white p-6 ring-1 ring-stone-200 sm:flex-row sm:items-center sm:justify-between sm:p-8">
                <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-100 text-primary">
                        <CreditCard size={26} />
                    </div>
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-stone-500">Current plan</p>
                        <p className="text-2xl font-black text-graphite">
                            {sub.plan ? sub.plan.name : "Free trial"}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
                            <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${STATUS_STYLE[sub.status] || ""}`}>
                                {sub.is_active ? sub.status_label : "Expired"}
                            </span>
                            {sub.current_period_end && (
                                <span className="inline-flex items-center gap-1 text-stone-500">
                                    <CalendarClock size={14} />
                                    {sub.is_active
                                        ? `${sub.days_left} day${sub.days_left === 1 ? "" : "s"} left · ${sub.status === "trialing" ? "trial ends" : "renews"} ${new Date(sub.current_period_end).toLocaleDateString()}`
                                        : `ended ${new Date(sub.current_period_end).toLocaleDateString()}`}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
                {!sub.is_active && (
                    <p className="max-w-xs text-sm font-semibold text-red-600">
                        Your subscription has ended. Choose a plan below to keep your workspace running.
                    </p>
                )}
            </section>

            {/* PLANS */}
            <section>
                <h3 className="mb-4 text-xl font-black text-graphite">Plans</h3>
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                    {plans.map((plan) => {
                        const current = sub.plan?.code === plan.code && sub.status === "active";
                        return (
                            <div
                                key={plan.code}
                                className={`flex flex-col rounded-3xl bg-white p-6 ring-1 ${plan.is_popular ? "ring-2 ring-primary" : "ring-stone-200"}`}
                            >
                                <div className="flex items-center justify-between">
                                    <h4 className="text-lg font-black text-graphite">{plan.name}</h4>
                                    {plan.is_popular && (
                                        <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-bold text-primary">
                                            <Sparkles size={12} /> Popular
                                        </span>
                                    )}
                                </div>
                                {plan.description && <p className="mt-1 text-sm text-stone-500">{plan.description}</p>}
                                <p className="mt-4">
                                    <span className="text-4xl font-black text-graphite">{formatMoney(plan.price, plan.currency)}</span>
                                    <span className="text-stone-500"> / {plan.interval}</span>
                                </p>
                                <ul className="mt-5 flex-1 space-y-2 text-sm text-stone-600">
                                    {plan.features.map((feature) => (
                                        <li key={feature} className="flex items-center gap-2">
                                            <CheckCircle2 size={16} className="shrink-0 text-green-600" /> {feature}
                                        </li>
                                    ))}
                                </ul>
                                <button
                                    type="button"
                                    onClick={() => choose(plan)}
                                    className={`mt-6 w-full rounded-xl py-3 font-bold ${plan.is_popular ? "bg-primary text-white hover:bg-primary-dark" : "bg-graphite text-white hover:bg-black"}`}
                                >
                                    {current ? "Renew / extend" : sub.plan ? "Switch to this plan" : "Choose plan"}
                                </button>
                            </div>
                        );
                    })}
                </div>
                <p className="mt-3 text-sm text-stone-500">
                    Have a free-subscription or discount code? Enter it on the payment page.
                </p>
            </section>

            {/* HISTORY */}
            <section className="rounded-3xl bg-white p-6 ring-1 ring-stone-200">
                <h3 className="flex items-center gap-2 font-black text-graphite">
                    <Receipt size={18} /> Payment history
                </h3>
                {payments.length === 0 ? (
                    <p className="mt-4 text-sm text-stone-500">No payments yet.</p>
                ) : (
                    <div className="mt-4 overflow-x-auto">
                        <table className="w-full min-w-[560px] text-left text-sm">
                            <thead className="text-xs uppercase tracking-wider text-stone-500">
                                <tr>
                                    <th className="py-2 pr-4">Date</th>
                                    <th className="py-2 pr-4">Item</th>
                                    <th className="py-2 pr-4">Code</th>
                                    <th className="py-2 pr-4 text-right">Amount</th>
                                    <th className="py-2">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-100">
                                {payments.map((p) => (
                                    <tr key={p.reference}>
                                        <td className="py-3 pr-4 text-stone-500">{new Date(p.created_at).toLocaleDateString()}</td>
                                        <td className="py-3 pr-4 font-semibold text-graphite">{p.description}</td>
                                        <td className="py-3 pr-4 font-mono text-xs">{p.promo_code || "-"}</td>
                                        <td className="py-3 pr-4 text-right font-semibold">{formatMoney(p.amount, p.currency)}</td>
                                        <td className={`py-3 font-bold ${PAYMENT_STYLE[p.status] || ""}`}>{p.status_label}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </div>
    );
}
