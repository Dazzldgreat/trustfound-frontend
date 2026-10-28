export default function AISection() {
  const scores = [
    {
      label: "Image Similarity",
      value: "96%",
      width: "96%",
      color: "bg-green-500",
    },
    {
      label: "Description Match",
      value: "92%",
      width: "92%",
      color: "bg-blue-500",
    },
    {
      label: "Location Match",
      value: "88%",
      width: "88%",
      color: "bg-orange-500",
    },
    {
      label: "Date Match",
      value: "95%",
      width: "95%",
      color: "bg-purple-500",
    },
  ];

  return (
    <section className="relative py-28 overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.15),transparent_35%)]" />

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.15),transparent_35%)]" />

      <div className="relative max-w-7xl mx-auto px-6">

        <div className="grid lg:grid-cols-2 gap-20 items-center">

          {/* LEFT */}

          <div>

            <span className="uppercase tracking-[0.35em] text-cyan-400 text-xs font-bold">

              Artificial Intelligence

            </span>

            <h2 className="mt-6 text-5xl font-black text-white leading-tight">

              Smarter Matching

              <br />

              Better Recovery

            </h2>

            <p className="mt-8 text-lg leading-8 text-slate-300">

              LostFound AI doesn't simply compare names.

              It intelligently understands descriptions,
              images, dates, locations, colors,
              categories and confidence scores to recommend
              the most accurate recovery candidate.

            </p>

            <div className="mt-10 grid gap-6">

              {[
                "Computer Vision",
                "Natural Language Processing",
                "Confidence Scoring",
                "Duplicate Detection",
                "Smart Notifications",
              ].map((item) => (

                <div
                  key={item}
                  className="flex items-center gap-4"
                >

                  <div className="w-12 h-12 rounded-xl bg-cyan-500 flex items-center justify-center">

                    <span className="material-symbols-outlined text-white">

                      auto_awesome

                    </span>

                  </div>

                  <span className="text-white text-lg font-semibold">

                    {item}

                  </span>

                </div>

              ))}

            </div>

          </div>

          {/* RIGHT */}

          <div>

            <div className="rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl p-10">

              <div className="flex items-center justify-between mb-10">

                <h3 className="text-2xl font-bold text-white">

                  Match Confidence

                </h3>

                <span className="px-4 py-2 rounded-full bg-green-500 text-white text-sm font-bold">

                  HIGH

                </span>

              </div>

              {scores.map((score) => (

                <div
                  key={score.label}
                  className="mb-8"
                >

                  <div className="flex justify-between mb-2">

                    <span className="text-white font-semibold">

                      {score.label}

                    </span>

                    <span className="text-cyan-400 font-bold">

                      {score.value}

                    </span>

                  </div>

                  <div className="w-full h-4 rounded-full bg-slate-700 overflow-hidden">

                    <div
                      className={`${score.color} h-full rounded-full transition-all duration-1000`}
                      style={{
                        width: score.width,
                      }}
                    />

                  </div>

                </div>

              ))}

              <div className="mt-12 rounded-2xl bg-slate-800 p-6">

                <p className="text-slate-400 text-sm uppercase tracking-widest">

                  Final AI Confidence

                </p>

                <h1 className="mt-3 text-6xl font-black text-cyan-400">

                  94%

                </h1>

                <p className="mt-3 text-slate-300">

                  Recommended for Staff Approval

                </p>

              </div>

            </div>

          </div>

        </div>

      </div>

    </section>
  );
}