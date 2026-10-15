export default function CTA() {
  return (
    <section className="py-28 bg-primary">
      <div className="max-w-5xl mx-auto px-6 text-center">

        <h2 className="text-5xl font-black text-white">
          Ready to Transform Your Lost & Found Process?
        </h2>

        <p className="mt-6 text-xl text-white/90">
          Join hundreds of organizations already recovering thousands of
          valuable items every month.
        </p>

        <div className="mt-10 flex justify-center gap-5 flex-wrap">

          <button className="px-8 py-4 rounded-full bg-white text-primary font-bold hover:scale-105 transition">
            Get Started
          </button>

          <button className="px-8 py-4 rounded-full border-2 border-white text-white font-bold hover:bg-white hover:text-primary transition">
            Book Demo
          </button>

        </div>

      </div>
    </section>
  );
}