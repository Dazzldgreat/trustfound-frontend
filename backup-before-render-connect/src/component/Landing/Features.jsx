export default function Features() {
  const features = [
    {
      icon: "psychology",
      title: "AI Item Matching",
      description:
        "Advanced AI compares names, descriptions, categories, images and locations to find the most accurate match.",
    },
    {
      icon: "image_search",
      title: "Image Recognition",
      description:
        "Our vision model compares uploaded photos and identifies visual similarities automatically.",
    },
    {
      icon: "notifications_active",
      title: "Instant Notifications",
      description:
        "Users receive email and in-app alerts the moment a possible match is discovered.",
    },
    {
      icon: "shield_lock",
      title: "Secure Recovery",
      description:
        "Every recovery goes through verification codes, identity confirmation and staff approval.",
    },
    {
      icon: "history",
      title: "Complete Audit Trail",
      description:
        "Every action is recorded with timestamps so administrators always know who did what.",
    },
    {
      icon: "analytics",
      title: "Powerful Analytics",
      description:
        "View recovery rates, response times, AI accuracy and operational performance in real time.",
    },
    {
      icon: "groups",
      title: "Role Based Access",
      description:
        "Separate dashboards for customers, staff and administrators with secure permissions.",
    },
    {
      icon: "cloud_done",
      title: "Cloud Based",
      description:
        "Access your lost and found database anywhere with automatic synchronization and backups.",
    },
  ];

  return (
    <section
      id="features"
      className="py-28 bg-white dark:bg-slate-950"
    >
      <div className="max-w-7xl mx-auto px-6">

        <div className="text-center mb-20">

          <span className="uppercase tracking-[0.35em] text-primary font-bold text-xs">

            Platform Features

          </span>

          <h2 className="mt-5 text-4xl md:text-5xl font-black text-slate-900 dark:text-white">

            Everything Needed To Recover Lost Items

          </h2>

          <p className="mt-6 max-w-3xl mx-auto text-lg text-slate-500 dark:text-slate-400">

            Designed specifically for hotels, airports, universities,
            transport companies and organizations that handle thousands of
            visitors daily.

          </p>

        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">

          {features.map((feature) => (

            <div
              key={feature.title}
              className="group bg-slate-50 dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 hover:border-primary hover:shadow-2xl transition duration-500 hover:-translate-y-2"
            >

              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary transition">

                <span className="material-symbols-outlined text-primary group-hover:text-white text-3xl">

                  {feature.icon}

                </span>

              </div>

              <h3 className="mt-8 text-2xl font-bold text-slate-900 dark:text-white">

                {feature.title}

              </h3>

              <p className="mt-4 leading-7 text-slate-500 dark:text-slate-400">

                {feature.description}

              </p>

            </div>

          ))}

        </div>

      </div>
    </section>
  );
}