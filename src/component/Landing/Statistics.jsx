export default function Statistics() {
  const stats = [
    {
      icon: "inventory_2",
      value: "12,548+",
      title: "Recovered Items",
      description: "Successfully returned to owners.",
      color: "from-blue-500 to-cyan-500",
    },
    {
      icon: "psychology",
      value: "98.4%",
      title: "AI Accuracy",
      description: "Smart matching confidence.",
      color: "from-violet-500 to-purple-600",
    },
    {
      icon: "apartment",
      value: "560+",
      title: "Organizations",
      description: "Hotels, airports & campuses.",
      color: "from-emerald-500 to-green-500",
    },
    {
      icon: "schedule",
      value: "< 3 mins",
      title: "Average Match Time",
      description: "Instant AI processing.",
      color: "from-orange-500 to-red-500",
    },
  ];

  return (
    <section className="relative py-24 bg-slate-50 dark:bg-slate-900">

      <div className="max-w-7xl mx-auto px-6">

        <div className="text-center mb-16">

          <span className="text-primary font-bold uppercase tracking-[0.3em] text-xs">

            Platform Performance

          </span>

          <h2 className="mt-4 text-4xl md:text-5xl font-black text-slate-900 dark:text-white">

            Trusted by Thousands

          </h2>

          <p className="mt-6 max-w-3xl mx-auto text-lg text-slate-500 dark:text-slate-400">

            Every day LostFound AI helps organizations recover valuable
            belongings quickly, securely and intelligently.

          </p>

        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">

          {stats.map((stat) => (

            <div
              key={stat.title}
              className="group bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-lg hover:shadow-2xl transition duration-500 hover:-translate-y-3 border border-slate-100 dark:border-slate-700"
            >

              <div
                className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${stat.color} flex items-center justify-center shadow-lg`}
              >

                <span className="material-symbols-outlined text-white text-3xl">

                  {stat.icon}

                </span>

              </div>

              <h3 className="mt-8 text-4xl font-black text-slate-900 dark:text-white">

                {stat.value}

              </h3>

              <h4 className="mt-3 text-xl font-bold text-slate-800 dark:text-white">

                {stat.title}

              </h4>

              <p className="mt-3 text-slate-500 dark:text-slate-400 leading-7">

                {stat.description}

              </p>

            </div>

          ))}

        </div>

      </div>

    </section>
  );
}