export default function WhyChooseUs() {
  const reasons = [
    {
      title: "AI Powered Matching",
      description:
        "Automatically matches lost and found items using smart image and text recognition.",
      icon: "psychology",
    },
    {
      title: "Fast Recovery",
      description:
        "Recover belongings in minutes instead of days with automated notifications.",
      icon: "bolt",
    },
    {
      title: "Secure Platform",
      description:
        "Enterprise-grade encryption protects every report and customer record.",
      icon: "shield_lock",
    },
    {
      title: "Real-time Tracking",
      description:
        "Track every claim from submission to successful recovery.",
      icon: "track_changes",
    },
  ];

  return (
    <section
      id="why"
      className="py-28 bg-white dark:bg-slate-950"
    >
      <div className="max-w-7xl mx-auto px-6">

        <div className="text-center mb-20">

          <span className="uppercase tracking-[0.3em] text-primary text-sm font-bold">
            Why Choose Us
          </span>

          <h2 className="mt-4 text-5xl font-black text-slate-900 dark:text-white">
            Built For Modern Organizations
          </h2>

        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">

          {reasons.map((item, index) => (
            <div
              key={index}
              className="bg-slate-50 dark:bg-slate-900 rounded-3xl p-8 border"
            >
              <span className="material-symbols-outlined text-5xl text-primary">
                {item.icon}
              </span>

              <h3 className="mt-6 text-xl font-bold">
                {item.title}
              </h3>

              <p className="mt-4 text-slate-600 dark:text-slate-400">
                {item.description}
              </p>
            </div>
          ))}

        </div>

      </div>
    </section>
  );
}