import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Building2,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
} from "lucide-react";
import { API } from "../../config";

export default function CompanyRegister() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    company_name: "",
    username: "",
    email: "",
    password: "",
    confirm_password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    // ==============================
    // BASIC VALIDATION
    // ==============================

    if (
      !form.company_name.trim() ||
      !form.username.trim() ||
      !form.email.trim() ||
      !form.password ||
      !form.confirm_password
    ) {
      setError("Please fill in all fields.");
      return;
    }

    if (form.password !== form.confirm_password) {
      setError("Passwords do not match.");
      return;
    }

    if (form.password.length < 8) {
      setError(
        "Password must contain at least 8 characters."
      );
      return;
    }

    setLoading(true);

    try {
      // ==============================
      // COMPANY REGISTRATION
      // ==============================

      const response = await fetch(
        `${API}/company/register/`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            company_name: form.company_name.trim(),
            username: form.username.trim(),
            email: form.email.trim().toLowerCase(),
            password: form.password,
          }),
        }
      );

      const data = await response.json();

      // ==============================
      // BACKEND ERROR
      // ==============================

      if (!response.ok) {
  console.log("REGISTER ERROR:", data);

  setError(
    data.error ||
      data.detail ||
      JSON.stringify(data) ||
      "Company registration failed."
  );

  return;
}

      // ==============================
      // GO TO VERIFICATION
      // ==============================

      navigate("/company/verify-code", {
        state: {
          email: form.email.trim().toLowerCase(),
          company_name: form.company_name.trim(),
        },
      });
    } catch (err) {
      console.error(err);

      setError(
        "Unable to connect to the server. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-6 py-12">

      {/* BACKGROUND */}

      <div className="fixed inset-0 overflow-hidden pointer-events-none">

        <div className="absolute w-[600px] h-[600px] bg-primary/20 blur-[150px] rounded-full -top-48 -left-48" />

        <div className="absolute w-[500px] h-[500px] bg-cyan-500/10 blur-[150px] rounded-full bottom-0 right-0" />

      </div>

      <div className="relative w-full max-w-6xl">

        {/* ==============================
            BRAND
        ============================== */}

        <div className="text-center mb-8">

          <Link
            to="/"
            className="inline-flex items-center gap-3"
          >

            <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center text-white font-black text-xl shadow-lg">
              LF
            </div>

            <div className="text-left">

              <h1 className="text-xl font-black text-graphite">
                LostFound
              </h1>

              <p className="text-xs text-stone-500">
                AI Recovery Platform
              </p>

            </div>

          </Link>

        </div>

        {/* ==============================
            MAIN CARD
        ============================== */}

        <div className="grid lg:grid-cols-2 gap-10 items-center">

          {/* ==============================
              LEFT INFORMATION
          ============================== */}

          <div className="hidden lg:block">

            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-100 border border-orange-200 mb-8">

              <Building2
                size={18}
                className="text-primary"
              />

              <span className="text-graphite text-sm font-semibold">
                Organization Registration
              </span>

            </div>

            <h2 className="text-5xl xl:text-6xl font-black text-graphite leading-tight">

              Bring your

              <span className="block text-primary">
                Lost & Found
              </span>

              online.

            </h2>

            <p className="mt-6 text-lg text-stone-500 leading-8 max-w-lg">

              Create your organization's LostFound
              workspace and give your staff one secure
              place to manage lost items, found items,
              AI matches and recoveries.

            </p>

            <div className="mt-10 grid grid-cols-3 gap-4">

              <div className="bg-white border border-stone-200 shadow-sm rounded-2xl p-5">

                <p className="text-2xl font-black text-graphite">
                  AI
                </p>

                <p className="text-sm text-stone-500 mt-1">
                  Matching
                </p>

              </div>

              <div className="bg-white border border-stone-200 shadow-sm rounded-2xl p-5">

                <p className="text-2xl font-black text-graphite">
                  🔐
                </p>

                <p className="text-sm text-stone-500 mt-1">
                  Secure
                </p>

              </div>

              <div className="bg-white border border-stone-200 shadow-sm rounded-2xl p-5">

                <p className="text-2xl font-black text-graphite">
                  24/7
                </p>

                <p className="text-sm text-stone-500 mt-1">
                  Tracking
                </p>

              </div>

            </div>

          </div>

          {/* ==============================
              REGISTER CARD
          ============================== */}

          <div className="w-full max-w-xl mx-auto">

            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-8 md:p-10">

              {/* HEADER */}

              <div className="text-center mb-8">

                <div className="flex justify-center mb-5">

                  <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-lg">

                    <Building2
                      size={30}
                      className="text-white"
                    />

                  </div>

                </div>

                <h2 className="text-3xl font-black text-slate-900 dark:text-white">
                  Register Your Organization
                </h2>

                <p className="text-slate-500 mt-2">
                  Create your company LostFound account
                </p>

              </div>

              {/* ERROR */}

              {error && (
                <div className="mb-6 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              {/* FORM */}

              <form
                onSubmit={handleSubmit}
                className="space-y-5"
              >

                {/* COMPANY NAME */}

                <div>

                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Company / Organization Name
                  </label>

                  <div className="relative">

                    <Building2
                      size={19}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      type="text"
                      name="company_name"
                      value={form.company_name}
                      onChange={handleChange}
                      required
                      placeholder="e.g. APM Terminals"
                      className="w-full pl-12 pr-4 py-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary"
                    />

                  </div>

                </div>

                {/* ADMIN USERNAME */}

                <div>

                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Administrator Username
                  </label>

                  <div className="relative">

                    <User
                      size={19}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      type="text"
                      name="username"
                      value={form.username}
                      onChange={handleChange}
                      required
                      placeholder="Choose administrator username"
                      className="w-full pl-12 pr-4 py-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary"
                    />

                  </div>

                </div>

                {/* EMAIL */}

                <div>

                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Administrator Email
                  </label>

                  <div className="relative">

                    <Mail
                      size={19}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      required
                      placeholder="admin@company.com"
                      className="w-full pl-12 pr-4 py-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary"
                    />

                  </div>

                </div>

                {/* PASSWORD */}

                <div>

                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Password
                  </label>

                  <div className="relative">

                    <Lock
                      size={19}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      type={
                        showPassword
                          ? "text"
                          : "password"
                      }
                      name="password"
                      value={form.password}
                      onChange={handleChange}
                      required
                      placeholder="Create a password"
                      className="w-full pl-12 pr-12 py-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword(
                          !showPassword
                        )
                      }
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                    >
                      {showPassword ? (
                        <EyeOff size={19} />
                      ) : (
                        <Eye size={19} />
                      )}
                    </button>

                  </div>

                </div>

                {/* CONFIRM PASSWORD */}

                <div>

                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Confirm Password
                  </label>

                  <div className="relative">

                    <Lock
                      size={19}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      type={
                        showConfirmPassword
                          ? "text"
                          : "password"
                      }
                      name="confirm_password"
                      value={
                        form.confirm_password
                      }
                      onChange={handleChange}
                      required
                      placeholder="Confirm your password"
                      className="w-full pl-12 pr-12 py-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(
                          !showConfirmPassword
                        )
                      }
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={19} />
                      ) : (
                        <Eye size={19} />
                      )}
                    </button>

                  </div>

                </div>

                {/* SUBMIT */}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 rounded-xl bg-primary text-white font-bold flex items-center justify-center gap-2 shadow-lg hover:scale-[1.02] transition disabled:opacity-60 disabled:hover:scale-100"
                >

                  {loading
                    ? "Creating Company..."
                    : "Create Company Account"}

                  {!loading && (
                    <ArrowRight size={19} />
                  )}

                </button>

              </form>

              {/* LOGIN */}

              <div className="text-center mt-7">

                <p className="text-sm text-slate-500">
                  Already have a company account?
                </p>

                <Link
                  to="/company/login"
                  className="font-bold text-primary hover:underline"
                >
                  Company Login
                </Link>

              </div>

            </div>

            {/* BACK */}

            <div className="text-center mt-6">

              <Link
                to="/"
                className="text-sm text-slate-400 hover:text-primary"
              >
                ← Back to LostFound
              </Link>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}