const faqs = [
  {
    q: "How does AI identify matching items?",
    a: "Our AI compares descriptions, colors, images, dates, and locations to recommend the most accurate matches.",
  },
  {
    q: "Can multiple organizations use LostFound?",
    a: "Yes. Hotels, airports, schools, restaurants, hospitals, and transport companies can all use the platform.",
  },
  {
    q: "Is customer data secure?",
    a: "Absolutely. Every report is encrypted and securely stored.",
  },
  {
    q: "Does LostFound support QR codes?",
    a: "Yes. Every recovered item can generate a QR code for faster tracking.",
  },
];

export default function FAQ() {
  return (
    <section id="faq" className="py-28 bg-slate-50 dark:bg-slate-900">
      <div className="max-w-5xl mx-auto px-6">

        <div className="text-center mb-16">
          <h2 className="text-5xl font-black text-slate-900 dark:text-white">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-6">
          {faqs.map((item) => (
            <div
              key={item.q}
              className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700"
            >
              <h3 className="font-bold text-xl text-slate-900 dark:text-white">
                {item.q}
              </h3>

              <p className="mt-3 text-slate-600 dark:text-slate-400">
                {item.a}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}