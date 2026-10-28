export default function Pricing() {
  const plans = [
    {
      name: "Starter",
      price: "$19",
      features: [
        "100 Reports",
        "AI Matching",
        "Email Support",
      ],
    },
    {
      name: "Professional",
      price: "$59",
      popular: true,
      features: [
        "Unlimited Reports",
        "AI Matching",
        "Analytics",
        "Priority Support",
      ],
    },
    {
      name: "Enterprise",
      price: "Custom",
      features: [
        "Unlimited Everything",
        "Dedicated Manager",
        "Custom Integrations",
      ],
    },
  ];

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
            Flexible plans for every organization.
          </p>

        </div>

        <div className="grid lg:grid-cols-3 gap-8">

          {plans.map((plan, index) => (

            <div
              key={index}
              className={`rounded-3xl p-8 border shadow-lg ${
                plan.popular
                  ? "border-primary"
                  : "border-slate-200"
              }`}
            >

              {plan.popular && (
                <div className="mb-5 text-primary font-bold">
                  Most Popular
                </div>
              )}

              <h3 className="text-3xl font-bold">
                {plan.name}
              </h3>

              <div className="mt-6 text-5xl font-black text-primary">
                {plan.price}
              </div>

              <ul className="mt-8 space-y-4">

                {plan.features.map((feature, i) => (
                  <li key={i}>
                    ✓ {feature}
                  </li>
                ))}

              </ul>

              <button className="mt-10 w-full py-3 rounded-xl bg-primary text-white">
                Get Started
              </button>

            </div>

          ))}

        </div>

      </div>
    </section>
  );
}