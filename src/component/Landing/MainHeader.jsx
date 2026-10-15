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

  const [dark, setDark] = useState(
    document.documentElement.classList.contains("dark")
  );

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 40);
    };

    window.addEventListener("scroll", onScroll);

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const toggleDark = () => {
    document.documentElement.classList.toggle("dark");
    setDark(!dark);
  };

  return (
    <header
      className={`fixed top-5 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-7xl transition-all duration-500 ${
        scrolled
          ? "bg-white/90 dark:bg-slate-900/90 shadow-2xl backdrop-blur-xl"
          : "bg-white/70 dark:bg-slate-900/70 backdrop-blur-lg"
      } rounded-2xl border border-white/20`}
    >
      <div className="px-6 lg:px-10 h-20 flex items-center justify-between">

        {/* LOGO */}

        <Link
          to="/"
          className="flex items-center gap-3"
        >
          <motion.div
            whileHover={{ rotate: 360 }}
            transition={{ duration: .8 }}
            className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-blue-500 flex items-center justify-center text-white font-black text-xl"
          >
            LF
          </motion.div>

          <div>

            <h2 className="font-black text-xl text-slate-800 dark:text-white">
              LostFound
            </h2>

            <p className="text-xs text-slate-500">
              AI Recovery Platform
            </p>

          </div>

        </Link>

        {/* DESKTOP NAV */}

        <nav className="hidden lg:flex items-center gap-10">

          {links.map((item) => (

            <a
              key={item.title}
              href={item.href}
              className="relative font-semibold text-slate-700 dark:text-slate-200 hover:text-primary transition"
            >
              {item.title}

              <span className="absolute left-0 -bottom-1 h-[2px] bg-primary w-0 hover:w-full transition-all duration-300"></span>

            </a>

          ))}

        </nav>

        {/* ACTIONS */}

        <div className="hidden lg:flex items-center gap-4">

          <button
            onClick={toggleDark}
            className="w-11 h-11 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center"
          >
            {dark ? (
              <Sun size={18} />
            ) : (
              <Moon size={18} />
            )}
          </button>

          <button className="w-11 h-11 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center">
            <Search size={18}/>
          </button>

          <Link
            to="company/login"
            className="font-semibold text-primary"
          >
            Company Login
          </Link>

          <Link
            to="/company/register"
            className="px-6 py-3 rounded-xl bg-primary text-white font-bold shadow-lg hover:scale-105 transition"
          >
            Get Started
          </Link>

        </div>

        {/* MOBILE */}

        <button
          onClick={() => setOpen(!open)}
          className="lg:hidden"
        >
          {open ? <X/> : <Menu/>}
        </button>

      </div>

      <AnimatePresence>

        {open && (

          <motion.div
            initial={{ height:0, opacity:0 }}
            animate={{ height:"auto", opacity:1 }}
            exit={{ height:0, opacity:0 }}
            className="overflow-hidden lg:hidden"
          >

            <div className="px-8 pb-8 flex flex-col gap-5">

              {links.map((item)=>(
                <a
                  key={item.title}
                  href={item.href}
                  onClick={()=>setOpen(false)}
                  className="font-semibold"
                >
                  {item.title}
                </a>
              ))}

              <Link
                to="/loginpage"
                className="text-primary font-bold"
              >
                Login
              </Link>

              <Link
                to="/register"
                className="bg-primary text-white rounded-xl py-3 text-center font-bold"
              >
                Get Started
              </Link>

            </div>

          </motion.div>

        )}

      </AnimatePresence>

    </header>
  );
}