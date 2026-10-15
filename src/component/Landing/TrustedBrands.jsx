export default function TrustedBrands() {
  const brands = [
    "Hilton",
    "Marriott",
    "Sheraton",
    "Radisson",
    "Holiday Inn",
    "Transcorp",
    "Air Peace",
    "Federal Airports",
    "Eko Hotels",
    "Four Points",
    "University of Lagos",
    "Lagos State",
  ];

  return (
    <section className="py-20 bg-white dark:bg-slate-950 border-y border-slate-200 dark:border-slate-800 overflow-hidden">

      <div className="max-w-7xl mx-auto px-6">

        <div className="text-center mb-12">

          <p className="uppercase tracking-[0.4em] text-xs font-bold text-gray-400">

            Trusted by Organizations Worldwide

          </p>

        </div>

      </div>

      <div className="relative">

        {/* Left Fade */}

        <div className="absolute left-0 top-0 w-32 h-full bg-gradient-to-r from-white dark:from-slate-950 to-transparent z-10" />

        {/* Right Fade */}

        <div className="absolute right-0 top-0 w-32 h-full bg-gradient-to-l from-white dark:from-slate-950 to-transparent z-10" />

        <div className="flex whitespace-nowrap animate-marquee gap-12">

          {[...brands, ...brands].map((brand, index) => (

            <div
              key={index}
              className="flex items-center gap-4 text-slate-400 hover:text-primary transition-all duration-300 text-2xl font-black"
            >

              <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">

                <span className="material-symbols-outlined">

                  apartment

                </span>

              </div>

              {brand}

            </div>

          ))}

        </div>

      </div>

    </section>
  );
}