import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { API } from "../../config";
import { formatMoney } from "../../utils/site";

// Shown until (or if) the live plans cannot be loaded.
const FALLBACK_PLANS = [
  {
    code: "starter",
    name: "Starter",
    price: "19",
    currency: "USD",
    interval: "month",
    features: ["100 Reports", "AI Matching", "Email Support"],
  },
  {
    code: "professional",
    name: "Professional",
    price: "59",
    currency: "USD",
    interval: "month",
    is_popular: true,
    features: ["Unlimited Reports", "AI Matching", "Analytics", "Priority Support"],
  },
  {
    code: "enterprise",
    name: "Enterprise",
    price: null,
    features: ["Unlimited Everything", "Dedicated Manager", "Custom Integrations"],
  },
];

export default function Pricing() {
  const [plans, setPlans] = useState(FALLBACK_PLANS);
  const [trialDays, setTrialDays] = useState(14);

  useEffect(() => {
    let cancelled = false;

    fetch(`${API}/billing/plans/`)
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (cancelled || !data?.plans?.length) return;
        setPlans(data.plans);
        if (data.trial_days) setTrialDays(data.trial_days);
      })
      .catch(() => {
        /* keep fallback plans */
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section
      id="pricing"
      className="py-28 bg-slate-50 dark:bg-slate-900"
    >
      <div className="max-w-7xl mx-auto px-6">

        <div className="text-center mb-20">

          <h2 className="text-5xl font-black">
            Pricing
          </h2>

          <p className="mt-5 text-slate-500">
            Flexible plans for every organization. Every plan starts
            with a {trialDays}-day free trial and includes hosting and
            a free website address.
          </p>

        </div>

        <div className="grid lg:grid-cols-3 gap-8">

          {plans.map((plan) => (

            <div
              key={plan.code || plan.name}
              className={`flex flex-col rounded-3xl p-8 border shadow-lg ${
                plan.is_popular
                  ? "border-primary"
                  : "border-slate-200"
              }`}
            >

              {plan.is_popular && (
                <div className="mb-5 text-primary font-bold">
                  Most Popular
                </div>
              )}

              <h3 className="text-3xl font-bold">
                {plan.name}
              </h3>

              {plan.description && (
                <p className="mt-2 text-slate-500">{plan.description}</p>
              )}

              <div className="mt-6 text-5xl font-black text-primary">
                {plan.price === null || plan.price === undefined
                  ? "Custom"
                  : formatMoney(plan.price, plan.currency)}
                {plan.price !== null && plan.price !== undefined && (
                  <span className="text-base font-semibold text-slate-500">
                    {" "}/ {plan.interval || "month"}
                  </span>
                )}
              </div>

              <ul className="mt-8 flex-1 space-y-4">

                {(plan.features || []).map((feature) => (
                  <li key={feature}>
                    ✓ {feature}
                  </li>
                ))}

              </ul>

              <Link
                to="/company/register"
                className="mt-10 block w-full py-3 rounded-xl bg-primary text-center font-semibold text-white"
              >
                Start free trial
              </Link>

            </div>

          ))}

        </div>

      </div>
    </section>
  );
}
