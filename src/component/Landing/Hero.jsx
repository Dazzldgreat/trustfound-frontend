import { Link } from "react-router-dom";

export default function Hero() {
  const floatingCards = [
    {
      title: "AI Match",
      text: "Wallet matched successfully",
      icon: "psychology",
      color: "bg-emerald-500",
      position: "top-8 -left-8",
    },
    {
      title: "Recovery",
      text: "Guest notified",
      icon: "notifications_active",
      color: "bg-blue-500",
      position: "bottom-6 -right-10",
    },
    {
      title: "Security",
      text: "Identity Verified",
      icon: "verified_user",
      color: "bg-purple-500",
      position: "top-40 -right-14",
    },
  ];

  const stats = [
    {
      value: "98%",
      label: "Recovery Rate",
    },
    {
      value: "12K+",
      label: "Recovered Items",
    },
    {
      value: "500+",
      label: "Hotels",
    },
  ];

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-950 to-black">

      {/* Background */}

      <div className="absolute inset-0">

        <div className="absolute w-[700px] h-[700px] bg-primary/20 blur-[140px] rounded-full -top-48 -left-48"/>

        <div className="absolute w-[600px] h-[600px] bg-cyan-500/10 blur-[150px] rounded-full bottom-0 right-0"/>

      </div>

      {/* Grid */}

      <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#ffffff12_1px,transparent_1px),linear-gradient(to_bottom,#ffffff12_1px,transparent_1px)] bg-[size:45px_45px]" />

      <div className="relative max-w-7xl mx-auto px-6 lg:px-20 py-28">

        <div className="grid lg:grid-cols-2 gap-20 items-center">

          {/* LEFT */}

          <div>

            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-xl border border-white/10 rounded-full px-5 py-2 mb-8">

              <span className="material-symbols-outlined text-yellow-400">
                auto_awesome
              </span>

              <span className="text-white text-sm font-semibold">
                AI Powered Lost & Found Platform
              </span>

            </div>

            <h1 className="text-5xl md:text-7xl font-black leading-tight text-white">

              Recover Lost
              <br />

              <span className="bg-gradient-to-r from-primary to-cyan-400 bg-clip-text text-transparent">

                Items Faster

              </span>

            </h1>

            <p className="mt-8 text-lg text-gray-300 leading-8 max-w-xl">

              Built for hotels, airports, universities, restaurants,
              malls and smart organizations.

              Our AI automatically matches lost items with found items,
              verifies ownership and manages secure recovery from one
              beautiful dashboard.

            </p>

            {/* Buttons */}

            <div className="flex flex-wrap gap-5 mt-10">

              <Link
                to="/book-demo"
                className="px-8 py-4 rounded-xl bg-primary text-white font-bold hover:scale-105 transition"
              >
                Book Demo
              </Link>

              <Link
                to="/company/login"
                className="px-8 py-4 rounded-xl bg-white text-slate-900 font-bold hover:scale-105 transition"
              >

                Report Lost Item

              </Link>

              <Link
                to="/demo"
                className="px-8 py-4 rounded-xl border border-white/20 text-white hover:bg-white/10 transition"
              >
                Watch Demo
              </Link>


            </div>

            {/* Stats */}

            <div className="grid grid-cols-3 gap-8 mt-16">

              {stats.map((item) => (

                <div key={item.label}>

                  <h2 className="text-3xl font-black text-white">

                    {item.value}

                  </h2>

                  <p className="text-gray-400 mt-1">

                    {item.label}

                  </p>

                </div>

              ))}

            </div>

          </div>

          {/* RIGHT */}

          <div className="relative flex justify-center">

            {/* Dashboard */}

            <div className="relative w-full max-w-lg">

              <div className="rounded-3xl overflow-hidden border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_0_80px_rgba(0,0,0,.35)]">

                <div className="flex items-center gap-2 px-5 py-4 border-b border-white/10">

                  <div className="w-3 h-3 rounded-full bg-red-500"/>

                  <div className="w-3 h-3 rounded-full bg-yellow-500"/>

                  <div className="w-3 h-3 rounded-full bg-green-500"/>

                </div>

                <div className="p-8">

                  <div className="rounded-2xl bg-slate-900 p-6">

                    <div className="flex justify-between items-center">

                      <div>

                        <h3 className="text-white text-xl font-bold">

                          LostFound AI

                        </h3>

                        <p className="text-gray-400">

                          Live Recovery Dashboard

                        </p>

                      </div>

                      <div className="text-primary font-black text-4xl">

                        98%

                      </div>

                    </div>

                    <div className="mt-8 space-y-5">

                      <div className="flex justify-between">

                        <span className="text-gray-400">

                          Matches Today

                        </span>

                        <span className="text-white">

                          248

                        </span>

                      </div>

                      <div className="w-full bg-slate-700 rounded-full h-3">

                        <div className="bg-primary h-3 rounded-full w-[92%]"/>

                      </div>

                      <div className="flex justify-between">

                        <span className="text-gray-400">

                          Pending Reviews

                        </span>

                        <span className="text-white">

                          14

                        </span>

                      </div>

                      <div className="w-full bg-slate-700 rounded-full h-3">

                        <div className="bg-cyan-400 h-3 rounded-full w-[65%]"/>

                      </div>

                    </div>

                  </div>

                </div>

              </div>

              {/* Floating Cards */}

              {floatingCards.map((card) => (

                <div
                  key={card.title}
                  className={`absolute ${card.position} bg-white rounded-2xl shadow-xl p-4 animate-float`}
                >

                  <div className="flex gap-3 items-center">

                    <div className={`w-12 h-12 rounded-xl ${card.color} flex items-center justify-center`}>

                      <span className="material-symbols-outlined text-white">

                        {card.icon}

                      </span>

                    </div>

                    <div>

                      <p className="text-xs text-gray-500">

                        {card.title}

                      </p>

                      <p className="font-bold">

                        {card.text}

                      </p>

                    </div>

                  </div>

                </div>

              ))}

            </div>

          </div>

        </div>

      </div>

    </section>
  );
}