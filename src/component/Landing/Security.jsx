export default function Security() {
  const items = [
    {
      title: "End-to-End Encryption",
      text: "All lost item reports and user information are securely encrypted.",
      icon: "lock",
    },
    {
      title: "AI Fraud Detection",
      text: "Our intelligent system detects suspicious claims automatically.",
      icon: "shield",
    },
    {
      title: "Secure Cloud Storage",
      text: "Every record is safely backed up and available whenever needed.",
      icon: "cloud_done",
    },
  ];

  return (
    <section className="py-28 bg-white dark:bg-slate-950">
      <div className="max-w-7xl mx-auto px-6">

        <div className="text-center mb-16">
          <span className="uppercase tracking-[0.3em] text-primary text-sm font-bold">
            Security
          </span>

          <h2 className="mt-5 text-5xl font-black text-slate-900 dark:text-white">
            Enterprise Grade Protection
          </h2>

          <p className="mt-6 max-w-3xl mx-auto text-lg text-slate-600 dark:text-slate-400">
            Built with modern security standards to keep every report,
            customer record, and organization protected.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {items.map((item) => (
            <div
              key={item.title}
              className="rounded-3xl bg-slate-50 dark:bg-slate-900 p-8 border border-slate-200 dark:border-slate-800"
            >
              <span className="material-symbols-outlined text-primary text-5xl">
                {item.icon}
              </span>

              <h3 className="mt-6 text-2xl font-bold text-slate-900 dark:text-white">
                {item.title}
              </h3>

              <p className="mt-4 text-slate-600 dark:text-slate-400">
                {item.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}