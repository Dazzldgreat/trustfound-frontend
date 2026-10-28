import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-300 py-16">

      <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-4 gap-10">

        <div>
          <h2 className="text-3xl font-black text-white">
            LostFound
          </h2>

          <p className="mt-5 text-slate-400">
            AI-powered Lost & Found platform helping organizations reconnect
            people with their belongings.
          </p>
        </div>

        <div>
          <h3 className="font-bold text-white mb-5">
            Product
          </h3>

          <div className="space-y-3">
            <Link to="/">Features</Link><br />
            <Link to="/">Pricing</Link><br />
            <Link to="/">Security</Link><br />
            <Link to="/">FAQ</Link>
          </div>
        </div>

        <div>
          <h3 className="font-bold text-white mb-5">
            Company
          </h3>

          <div className="space-y-3">
            <Link to="/">About</Link><br />
            <Link to="/">Contact</Link><br />
            <Link to="/">Privacy</Link><br />
            <Link to="/">Terms</Link>
          </div>
        </div>

        <div>
          <h3 className="font-bold text-white mb-5">
            Contact
          </h3>

          <p>support@lostfound.ai</p>
          <p className="mt-2">+234 xxx xxx xxxx</p>
        </div>

      </div>

      <div className="border-t border-slate-800 mt-14 pt-8 text-center text-slate-500">
        © {new Date().getFullYear()} LostFound. All Rights Reserved.
      </div>

    </footer>
  );
}