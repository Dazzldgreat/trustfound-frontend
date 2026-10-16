
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu,
  X,
  Moon,
  Sun,
  Search,
} from "lucide-react";

const links = [
  { title: "Features", href: "#features" },
  { title: "Dashboard", href: "#dashboard" },
  { title: "How It Works", href: "#how-it-works" },
  { title: "Pricing", href: "#pricing" },
  { title: "FAQ", href: "#faq" },
];

export default function MainHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [dark, setDark] = useState(() =>
    document.documentElement.classList.contains("dark")
  );

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  // Close the mobile menu when the viewport becomes desktop-sized.
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 1024) setOpen(false);
    };

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const closeMenu = () => setOpen(false);

  const headerLinkClass =
    "font-semibold text-slate-700 dark:text-slate-200 hover:text-primary transition";

  return (
    <header
      className={`fixed top-3 sm:top-5 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-7xl rounded-2xl border border-white/20 transition-all duration-300 ${
        scrolled
          ? "bg-white/95 dark:bg-slate-900/95 shadow-2xl backdrop-blur-xl"
          : "bg-white/85 dark:bg-slate-900/85 backdrop-blur-lg"
      }`}
    >
      <div className="px-3 sm:px-6 lg:px-8 h-[72px] sm:h-20 flex items-center justify-between gap-3">
        {/* LOGO */}
        <Link
          to="/"
          onClick={closeMenu}
          className="flex items-center gap-2 sm:gap-3 min-w-0 shrink"
        >
          <motion.div
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.8 }}
            className="w-10 h-10 sm:w-12 sm:h-12 shrink-0 rounded-xl bg-gradient-to-br from-primary to-blue-500 flex items-center justify-center text-white font-black text-lg sm:text-xl"
          >
            LF
          </motion.div>

          <div className="min-w-0">
            <h2 className="font-black text-base sm:text-xl text-slate-800 dark:text-white">
              LostFound
            </h2>
            <p className="hidden sm:block text-xs text-slate-500 dark:text-slate-400">
              AI Recovery Platform
            </p>
          </div>
        </Link>

        {/* DESKTOP NAVIGATION */}
        <nav className="hidden lg:flex items-center gap-5 xl:gap-8">
          {links.map((item) => (
            <a
              key={item.title}
              href={item.href}
              className={`${headerLinkClass} relative`}
            >
              {item.title}
            </a>
          ))}
        </nav>

        {/* DESKTOP ACTIONS */}
        <div className="hidden lg:flex items-center gap-3 xl:gap-4">
          <button
            type="button"
            onClick={() => setDark((previous) => !previous)}
            aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
            className="w-10 h-10 rounded-full border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <button
            type="button"
            aria-label="Search"
            onClick={() => {
              document.getElementById("features")?.scrollIntoView({
                behavior: "smooth",
              });
            }}
            className="w-10 h-10 rounded-full border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <Search size={18} />
          </button>

          <Link
            to="/company/login"
            className="font-semibold text-primary hover:opacity-75 whitespace-nowrap"
          >
            Company Login
          </Link>

          <Link
            to="/company/register"
            className="px-4 xl:px-5 py-3 rounded-xl bg-primary text-white font-bold shadow-lg hover:scale-105 transition whitespace-nowrap"
          >
            Get Started
          </Link>
        </div>

        {/* MOBILE MENU BUTTON */}
        <button
          type="button"
          onClick={() => setOpen((previous) => !previous)}
          aria-label={open ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={open}
          className="lg:hidden shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-slate-800 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* MOBILE NAVIGATION */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="mobile-menu"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden overflow-hidden border-t border-slate-200 dark:border-slate-700"
          >
            <nav className="max-h-[75vh] overflow-y-auto px-5 sm:px-8 py-5 flex flex-col gap-4 bg-white dark:bg-slate-900 rounded-b-2xl">
              {links.map((item) => (
                <a
                  key={item.title}
                  href={item.href}
                  onClick={closeMenu}
                  className={headerLinkClass}
                >
                  {item.title}
                </a>
              ))}

              <div className="border-t border-slate-200 dark:border-slate-700 pt-4 flex flex-col gap-4">
                <button
                  type="button"
                  onClick={() => setDark((previous) => !previous)}
                  className="flex items-center gap-3 text-left text-slate-700 dark:text-slate-200 font-semibold"
                >
                  {dark ? <Sun size={19} /> : <Moon size={19} />}
                  {dark ? "Light Mode" : "Dark Mode"}
                </button>

                {/* Company login is now available on mobile */}
                <Link
                  to="/company/login"
                  onClick={closeMenu}
                  className="text-primary font-bold"
                >
                  Company Login
                </Link>

                <Link
                  to="/company/register"
                  onClick={closeMenu}
                  className="bg-primary text-white rounded-xl py-3 text-center font-bold"
                >
                  Get Started
                </Link>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
