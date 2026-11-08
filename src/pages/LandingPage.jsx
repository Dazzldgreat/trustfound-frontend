import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Building2,
  Camera,
  CheckCircle2,
  Menu,
  QrCode,
  Search,
  Sparkles,
  X,
} from "lucide-react";

/* ============================================================
   TRUSTFOUND LANDING PAGE
   Short, simple, mobile-friendly. Every button goes to a real
   route: company register, company login, or a company portal.
============================================================ */

const NAV_LINKS = [
  { label: "How it works", href: "#how-it-works" },
  { label: "For organisations", href: "#organisations" },
];

const STEPS = [
  {
    icon: Camera,
    title: "Report",
    text: "Describe the item and add a photo. It takes about a minute.",
  },
  {
    icon: Sparkles,
    title: "Match",
    text: "We compare photos, descriptions and locations to find likely matches.",
  },
  {
    icon: QrCode,
    title: "Recover",
    text: "Staff verify the owner, then hand the item back with a secure QR code.",
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0 },
};

function Logo({ onClick }) {
  return (
    <Link to="/" onClick={onClick} className="flex items-center gap-2.5">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-sm font-extrabold text-white shadow-md shadow-orange-600/25">
        TF
      </span>
      <span className="text-lg font-extrabold tracking-tight text-graphite">
        TrustFound
      </span>
    </Link>
  );
}

function OrganisationFinder() {
  const navigate = useNavigate();
  const [value, setValue] = useState("");
  const [error, setError] = useState("");

  const submit = (event) => {
    event.preventDefault();

    // Accept a full link (…/company/abc-hotel) or just the name.
    const raw = value.trim();
    const fromLink = raw.match(/company\/([^/?#\s]+)/i)?.[1];
    const slug = (fromLink || raw)
      .toLowerCase()
      .replace(/[^a-z0-9\s_-]/g, "")
      .trim()
      .replace(/\s+/g, "-");

    if (!slug) {
      setError("Enter your organisation's name or link.");
      return;
    }

    navigate(`/company/${encodeURIComponent(slug)}`);
  };

  return (
    <form onSubmit={submit} className="mt-8 max-w-md">
      <label
        htmlFor="org"
        className="mb-2 block text-sm font-semibold text-ink"
      >
        Lost something? Open your organisation's page
      </label>

      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search
            size={18}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400"
          />
          <input
            id="org"
            value={value}
            onChange={(event) => {
              setValue(event.target.value);
              setError("");
            }}
            placeholder="e.g. abc-hotel"
            className="w-full rounded-xl border border-stone-200 bg-white py-3 pl-10 pr-3 text-graphite outline-none transition placeholder:text-stone-400 focus:border-primary focus:ring-4 focus:ring-orange-100"
          />
        </div>

        <button
          type="submit"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-graphite px-5 py-3 font-semibold text-white transition hover:bg-stone-900"
        >
          Go
          <ArrowRight size={17} />
        </button>
      </div>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </form>
  );
}

function HeroVisual() {
  return (
    <div className="relative mx-auto w-full max-w-sm">
      {/* soft background shapes */}
      <div className="absolute -right-6 -top-6 h-40 w-40 rounded-full bg-orange-200/60 blur-2xl" />
      <div className="absolute -bottom-8 -left-6 h-44 w-44 rounded-full bg-orange-100 blur-2xl" />

      <motion.div
        initial={{ opacity: 0, y: 20, rotate: -2 }}
        animate={{ opacity: 1, y: 0, rotate: -2 }}
        transition={{ duration: 0.6 }}
        className="relative rounded-3xl border border-stone-200 bg-white p-5 shadow-xl shadow-stone-900/5"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-primary">
            <Camera size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
              Lost report
            </p>
            <p className="font-bold text-graphite">Black leather wallet</p>
          </div>
        </div>
        <p className="mt-3 text-sm text-stone-500">
          Lobby · Yesterday, 6:40 pm
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20, rotate: 2 }}
        animate={{ opacity: 1, y: 0, rotate: 2 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="relative -mt-3 ml-8 rounded-3xl bg-graphite p-5 text-white shadow-xl"
      >
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-orange-300">
            Match found
          </p>
          <span className="rounded-full bg-primary px-2.5 py-1 text-xs font-bold">
            94%
          </span>
        </div>
        <p className="mt-2 font-bold">Wallet handed in at reception</p>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/15">
          <div className="h-full w-[94%] rounded-full bg-primary" />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.45 }}
        className="relative -mt-4 ml-auto mr-2 flex w-fit items-center gap-2 rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-graphite shadow-lg"
      >
        <CheckCircle2 size={18} className="text-green-600" />
        Returned to owner
      </motion.div>
    </div>
  );
}

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    // The landing page is always shown in the light brand theme.
    document.documentElement.classList.remove("dark");

    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="min-h-screen bg-cream text-ink">
      {/* ====================== HEADER ====================== */}
      <header
        className={`sticky top-0 z-50 transition ${
          scrolled
            ? "border-b border-stone-200 bg-cream/90 backdrop-blur-md"
            : "bg-transparent"
        }`}
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:h-20 sm:px-6">
          <Logo onClick={closeMenu} />

          <nav className="hidden items-center gap-8 md:flex">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-semibold text-ink transition hover:text-primary"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <Link
              to="/company/login"
              className="rounded-xl px-4 py-2.5 text-sm font-semibold text-graphite transition hover:bg-white"
            >
              Company login
            </Link>
            <Link
              to="/company/register"
              className="rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-orange-600/20 transition hover:bg-primary-dark"
            >
              Get started
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-graphite transition hover:bg-white md:hidden"
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {menuOpen && (
          <div className="border-t border-stone-200 bg-cream px-4 pb-5 pt-3 md:hidden">
            <nav className="flex flex-col">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={closeMenu}
                  className="rounded-lg px-2 py-3 font-semibold text-ink hover:bg-white"
                >
                  {link.label}
                </a>
              ))}
            </nav>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Link
                to="/company/login"
                onClick={closeMenu}
                className="rounded-xl border border-stone-200 bg-white py-3 text-center font-semibold text-graphite"
              >
                Company login
              </Link>
              <Link
                to="/company/register"
                onClick={closeMenu}
                className="rounded-xl bg-primary py-3 text-center font-bold text-white"
              >
                Get started
              </Link>
            </div>
          </div>
        )}
      </header>

      <main>
        {/* ======================= HERO ======================= */}
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-16 pt-8 sm:px-6 md:grid-cols-2 md:pb-24 md:pt-14">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-2 rounded-full bg-orange-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-orange-800">
              <Sparkles size={14} />
              Lost &amp; found, made simple
            </span>

            <h1 className="mt-5 text-4xl font-extrabold leading-[1.1] tracking-tight text-graphite sm:text-5xl">
              Lost it? We&apos;ll help you{" "}
              <span className="text-primary">get it back.</span>
            </h1>

            <p className="mt-5 max-w-lg text-lg leading-relaxed text-stone-600">
              TrustFound gives hotels, schools, venues and offices one place
              to log lost and found items, match them automatically and
              return them safely.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/company/register"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3.5 font-bold text-white shadow-lg shadow-orange-600/25 transition hover:-translate-y-0.5 hover:bg-primary-dark"
              >
                Get started free
                <ArrowRight size={18} />
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-6 py-3.5 font-semibold text-graphite transition hover:border-stone-300"
              >
                See how it works
              </a>
            </div>

            <OrganisationFinder />
          </motion.div>

          <HeroVisual />
        </section>

        {/* =================== HOW IT WORKS =================== */}
        <section id="how-it-works" className="scroll-mt-24 bg-white py-16 md:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="max-w-xl">
              <p className="text-sm font-bold uppercase tracking-wide text-primary">
                How it works
              </p>
              <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-graphite">
                Three steps from lost to returned
              </h2>
            </div>

            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {STEPS.map((step, index) => (
                <motion.div
                  key={step.title}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true, amount: 0.4 }}
                  transition={{ duration: 0.45, delay: index * 0.1 }}
                  className="rounded-3xl border border-stone-200 bg-cream p-6 transition hover:-translate-y-1 hover:shadow-lg hover:shadow-stone-900/5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white">
                      <step.icon size={22} />
                    </div>
                    <span className="text-4xl font-extrabold text-orange-200">
                      0{index + 1}
                    </span>
                  </div>
                  <h3 className="mt-5 text-xl font-bold text-graphite">
                    {step.title}
                  </h3>
                  <p className="mt-2 leading-relaxed text-stone-600">
                    {step.text}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ===================== CTA BAND ===================== */}
        <section id="organisations" className="scroll-mt-24 px-4 py-16 sm:px-6 md:py-20">
          <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-8 rounded-[2rem] bg-graphite p-8 text-white sm:p-12 md:flex-row md:items-center">
            <div className="max-w-xl">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-orange-300">
                <Building2 size={22} />
              </div>
              <h2 className="mt-5 text-3xl font-extrabold tracking-tight">
                Run lost &amp; found for your organisation
              </h2>
              <p className="mt-3 text-stone-300">
                Get your own branded page, staff dashboard and AI matching
                in minutes. Your customers sign up on your page.
              </p>
            </div>

            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row md:flex-col lg:flex-row">
              <Link
                to="/company/register"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 font-bold text-white transition hover:bg-primary-dark"
              >
                Create your organisation
                <ArrowRight size={18} />
              </Link>
              <Link
                to="/company/login"
                className="inline-flex items-center justify-center rounded-xl border border-white/20 px-6 py-3.5 font-semibold text-white transition hover:bg-white/10"
              >
                Company login
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ====================== FOOTER ====================== */}
      <footer className="border-t border-stone-200">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 text-sm text-stone-500 sm:flex-row sm:px-6">
          <p>© {new Date().getFullYear()} TrustFound. Helping people find what matters.</p>
          <div className="flex gap-5">
            <a href="#how-it-works" className="hover:text-primary">
              How it works
            </a>
            <Link to="/company/login" className="hover:text-primary">
              Company login
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
