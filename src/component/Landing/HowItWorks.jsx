const steps = [
  {
    number: "01",
    icon: "edit_square",
    title: "Report Lost Item",
    description:
      "Guests quickly report their missing belongings with photos, location, date and description through our secure portal.",
    color: "from-blue-500 to-cyan-500",
  },
  {
    number: "02",
    icon: "psychology",
    title: "AI Finds the Match",
    description:
      "Our intelligent matching engine compares images, descriptions, categories, colors and locations to identify possible matches instantly.",
    color: "from-violet-500 to-purple-600",
  },
  {
    number: "03",
    icon: "verified_user",
    title: "Staff Verification",
    description:
      "Staff reviews AI suggestions, verifies ownership and approves the best match before notifying the customer.",
    color: "from-orange-500 to-red-500",
  },
  {
    number: "04",
    icon: "redeem",
    title: "Secure Recovery",
    description:
      "Customers verify their identity, receive recovery codes and safely reclaim their belongings.",
    color: "from-green-500 to-emerald-600",
  },
];

export default function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="relative py-28 bg-slate-50 dark:bg-slate-900 overflow-hidden"
    >
      {/* Background Decorations */}

      <div className="absolute w-96 h-96 bg-primary/10 blur-[120px] rounded-full -left-40 top-0" />

      <div className="absolute w-96 h-96 bg-cyan-500/10 blur-[120px] rounded-full right-0 bottom-0" />

      <div className="relative max-w-7xl mx-auto px-6">

        <div className="text-center mb-20">

          <span className="uppercase tracking-[0.35em] text-primary font-bold text-xs">

            How It Works

          </span>

          <h2 className="mt-5 text-4xl md:text-5xl font-black text-slate-900 dark:text-white">

            Lost Today. Found Tomorrow.

          </h2>

          <p className="mt-6 max-w-3xl mx-auto text-lg text-slate-500 dark:text-slate-400">

            Our intelligent recovery workflow combines AI with human
            verification to ensure every lost item reaches its rightful owner
            safely.

          </p>

        </div>

        <div className="relative">

          {/* Center Line */}

          <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-primary via-cyan-400 to-green-500 -translate-x-1/2 rounded-full" />

          <div className="space-y-20">

            {steps.map((step, index) => (

              <div
                key={step.number}
                className={`grid lg:grid-cols-2 gap-12 items-center ${
                  index % 2 === 0 ? "" : "lg:[&>*:first-child]:order-2"
                }`}
              >

                {/* Card */}

                <div>

                  <div className="group bg-white dark:bg-slate-950 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 p-10 hover:shadow-2xl transition duration-500 hover:-translate-y-2">

                    <div
                      className={`inline-flex w-20 h-20 rounded-2xl bg-gradient-to-br ${step.color} items-center justify-center shadow-lg`}
                    >
                      <span className="material-symbols-outlined text-white text-4xl">

                        {step.icon}

                      </span>
                    </div>

                    <div className="mt-8 flex items-center gap-5">

                      <span className="text-5xl font-black text-primary/20">

                        {step.number}

                      </span>

                      <h3 className="text-3xl font-bold text-slate-900 dark:text-white">

                        {step.title}

                      </h3>

                    </div>

                    <p className="mt-6 text-lg leading-8 text-slate-500 dark:text-slate-400">

                      {step.description}

                    </p>

                  </div>

                </div>

                {/* Circle */}

                <div className="hidden lg:flex justify-center">

                  <div
                    className={`w-36 h-36 rounded-full bg-gradient-to-br ${step.color} shadow-2xl flex items-center justify-center border-[12px] border-white dark:border-slate-900`}
                  >
                    <span className="material-symbols-outlined text-white text-5xl">

                      {step.icon}

                    </span>
                  </div>

                </div>

              </div>

            ))}

          </div>

        </div>

      </div>
    </section>
  );
}