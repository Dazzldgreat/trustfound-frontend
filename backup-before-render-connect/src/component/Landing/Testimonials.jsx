import { motion } from "framer-motion";

const testimonials = [
  {
    name: "Sarah Johnson",
    role: "Operations Manager",
    company: "Grand Plaza Hotel",
    image:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300",
    review:
      "LostFound transformed the way we manage guest belongings. Our recovery rate increased by over 80%, and guests consistently praise the professionalism of our service.",
  },
  {
    name: "Michael Chen",
    role: "Airport Supervisor",
    company: "Skyline International",
    image:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300",
    review:
      "The AI matching is incredibly accurate. What used to take hours now takes minutes. Our staff efficiency has improved dramatically.",
  },
  {
    name: "Amanda Roberts",
    role: "General Manager",
    company: "Elite Resort",
    image:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300",
    review:
      "Guests love receiving instant notifications when their belongings are found. LostFound has become an important part of our customer experience.",
  },
];

export default function Testimonials() {
  return (
    <section className="py-28 bg-slate-50 dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-6">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center mb-20"
        >
          <span className="uppercase tracking-[0.3em] text-primary text-sm font-bold">
            Testimonials
          </span>

          <h2 className="mt-5 text-5xl font-black text-slate-900 dark:text-white">
            Trusted by Industry Leaders
          </h2>

          <p className="mt-6 max-w-2xl mx-auto text-lg text-slate-600 dark:text-slate-400">
            Organizations around the world rely on LostFound to recover
            thousands of lost valuables every year.
          </p>
        </motion.div>

        {/* Cards */}
        <div className="grid lg:grid-cols-3 gap-8">
          {testimonials.map((item, index) => (
            <motion.div
              key={index}
              initial={{
                opacity: 0,
                y: 60,
              }}
              whileInView={{
                opacity: 1,
                y: 0,
              }}
              viewport={{
                once: true,
                amount: 0.3,
              }}
              transition={{
                duration: 0.6,
                delay: index * 0.15,
                ease: "easeOut",
              }}
              whileHover={{
                y: -12,
                scale: 1.03,
                boxShadow: "0 25px 50px rgba(0,0,0,.18)",
              }}
              className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-lg border border-slate-200 dark:border-slate-700 transition-colors"
            >
              {/* Stars */}
              <div className="flex gap-1 mb-6">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    className="material-symbols-outlined text-yellow-400"
                  >
                    star
                  </span>
                ))}
              </div>

              {/* Review */}
              <p className="text-slate-600 dark:text-slate-300 leading-8 mb-8">
                "{item.review}"
              </p>

              {/* User */}
              <div className="flex items-center gap-4">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-16 h-16 rounded-full object-cover border-2 border-primary"
                />

                <div>
                  <h4 className="font-bold text-lg text-slate-900 dark:text-white">
                    {item.name}
                  </h4>

                  <p className="text-primary font-semibold">{item.role}</p>

                  <p className="text-sm text-slate-500">{item.company}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mt-24 grid md:grid-cols-4 gap-8 text-center"
        >
          <div>
            <h3 className="text-5xl font-black text-primary">500+</h3>
            <p className="mt-3 text-slate-600 dark:text-slate-400">
              Organizations
            </p>
          </div>

          <div>
            <h3 className="text-5xl font-black text-primary">50K+</h3>
            <p className="mt-3 text-slate-600 dark:text-slate-400">
              Items Recovered
            </p>
          </div>

          <div>
            <h3 className="text-5xl font-black text-primary">98%</h3>
            <p className="mt-3 text-slate-600 dark:text-slate-400">
              Satisfaction
            </p>
          </div>

          <div>
            <h3 className="text-5xl font-black text-primary">24/7</h3>
            <p className="mt-3 text-slate-600 dark:text-slate-400">
              Availability
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}