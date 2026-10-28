export default function DashboardPreview() {
  const activities = [
    {
      title: "Wallet Matched",
      subtitle: "98% confidence",
      color: "bg-green-500",
      icon: "wallet",
    },
    {
      title: "Laptop Approved",
      subtitle: "Staff verified",
      color: "bg-blue-500",
      icon: "laptop_mac",
    },
    {
      title: "Recovery Scheduled",
      subtitle: "Tomorrow 10:00 AM",
      color: "bg-orange-500",
      icon: "event_available",
    },
    {
      title: "Phone Returned",
      subtitle: "Recovery Complete",
      color: "bg-purple-500",
      icon: "smartphone",
    },
  ];

  return (
    <section className="py-28 bg-slate-50 dark:bg-slate-900 overflow-hidden">

      <div className="max-w-7xl mx-auto px-6">

        <div className="grid lg:grid-cols-2 gap-20 items-center">

          {/* LEFT */}

          <div>

            <span className="uppercase tracking-[0.35em] text-primary text-xs font-bold">
              Powerful Dashboard
            </span>

            <h2 className="mt-5 text-4xl md:text-5xl font-black text-slate-900 dark:text-white leading-tight">

              Manage Every Lost Item From One Dashboard

            </h2>

            <p className="mt-6 text-lg text-slate-500 dark:text-slate-400 leading-8">

              LostFound AI gives administrators complete visibility over
              reported items, AI matches, staff reviews, recovery requests,
              analytics and customer notifications.

            </p>

            <div className="mt-10 space-y-6">

              {[
                "AI Powered Matching",
                "Real-time Notifications",
                "Recovery Tracking",
                "Role Based Access",
                "Advanced Analytics",
              ].map((feature) => (

                <div
                  key={feature}
                  className="flex items-center gap-4"
                >

                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">

                    <span className="material-symbols-outlined text-white">

                      check

                    </span>

                  </div>

                  <span className="text-lg font-semibold text-slate-800 dark:text-white">

                    {feature}

                  </span>

                </div>

              ))}

            </div>

          </div>

          {/* RIGHT */}

          <div className="relative">

            <div className="rounded-3xl bg-white dark:bg-slate-950 shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">

              {/* Header */}

              <div className="flex items-center justify-between px-8 py-5 border-b border-slate-200 dark:border-slate-800">

                <div>

                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white">

                    LostFound Dashboard

                  </h3>

                  <p className="text-slate-500">

                    Live Activity

                  </p>

                </div>

                <div className="w-4 h-4 rounded-full bg-green-500 animate-pulse"/>

              </div>

              {/* Cards */}

              <div className="p-8 space-y-5">

                {activities.map((activity) => (

                  <div
                    key={activity.title}
                    className="flex items-center justify-between rounded-2xl bg-slate-100 dark:bg-slate-900 p-5 hover:scale-[1.02] transition"
                  >

                    <div className="flex items-center gap-4">

                      <div className={`w-14 h-14 rounded-2xl ${activity.color} flex items-center justify-center`}>

                        <span className="material-symbols-outlined text-white">

                          {activity.icon}

                        </span>

                      </div>

                      <div>

                        <h4 className="font-bold text-slate-900 dark:text-white">

                          {activity.title}

                        </h4>

                        <p className="text-slate-500 text-sm">

                          {activity.subtitle}

                        </p>

                      </div>

                    </div>

                    <button className="px-5 py-2 rounded-xl bg-primary text-white font-semibold">

                      View

                    </button>

                  </div>

                ))}

              </div>

            </div>

            {/* Floating Card */}

            <div className="absolute -top-8 -right-8 bg-primary rounded-3xl text-white p-6 shadow-2xl">

              <h2 className="text-4xl font-black">

                98%

              </h2>

              <p className="mt-2">

                AI Match Accuracy

              </p>

            </div>

          </div>

        </div>

      </div>

    </section>
  );
}