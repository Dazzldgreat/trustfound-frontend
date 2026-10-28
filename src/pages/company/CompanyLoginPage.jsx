
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Building2,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { API } from "../../config";

export default function CompanyLoginPage() {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    username: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (loading) return;

    setLoading(true);

    try {
      const response = await fetch(`${API}/company/login/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          username: form.username.trim(),
          password: form.password,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const detail =
          data.detail ||
          data.message ||
          data.error ||
          data.non_field_errors?.[0] ||
          data.username?.[0] ||
          data.password?.[0];

        throw new Error(
          detail || `Login failed (HTTP ${response.status}).`
        );
      }

      const accessToken = data.tokens?.access;
      const refreshToken = data.tokens?.refresh;

      if (!accessToken || !refreshToken) {
        throw new Error(
          "The server response is missing the access or refresh token. Check your Django login response."
        );
      }

      let payload;

      try {
        const tokenParts = accessToken.split(".");

        if (tokenParts.length !== 3) {
          throw new Error("Invalid JWT format.");
        }

        const base64 = tokenParts[1]
          .replace(/-/g, "+")
          .replace(/_/g, "/");

        payload = JSON.parse(
          atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "="))
        );
      } catch {
        throw new Error(
          "The server returned an invalid access token. Check your Django JWT configuration."
        );
      }

      if (payload.token_type !== "access") {
        throw new Error(
          "The server did not return an access token."
        );
      }

      if (payload.exp && Date.now() >= payload.exp * 1000) {
        throw new Error(
          "The server returned an expired access token."
        );
      }

      const company = data.company;
      const user = data.user;

      if (!company?.slug) {
        throw new Error(
          "Login response is missing the company slug."
        );
      }

      // Clear previous company authentication values.
      const oldKeys = [
        "access_token",
        "access",
        "company_access",
        "refresh_token",
        "refresh",
        "company_refresh",
        "user",
        "company_user",
        "company",
        "companySlug",
        "company_slug",
      ];

      oldKeys.forEach((key) => localStorage.removeItem(key));

      // Preserve token aliases used by existing TrustFound pages.
      localStorage.setItem("access_token", accessToken);
      localStorage.setItem("access", accessToken);
      localStorage.setItem("company_access", accessToken);

      localStorage.setItem("refresh_token", refreshToken);
      localStorage.setItem("refresh", refreshToken);
      localStorage.setItem("company_refresh", refreshToken);

      localStorage.setItem("user", JSON.stringify(user || {}));
      localStorage.setItem("company_user", JSON.stringify(user || {}));
      localStorage.setItem("company", JSON.stringify(company));
      localStorage.setItem("companySlug", company.slug);
      localStorage.setItem("company_slug", company.slug);

      navigate("/company-dashboard", { replace: true });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to log in. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-6 py-12">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-primary/20 blur-[140px]" />
        <div className="absolute bottom-0 right-0 h-[500px] w-[500px] rounded-full bg-cyan-500/10 blur-[140px]" />
      </div>

      <div className="relative grid w-full max-w-6xl items-center gap-12 lg:grid-cols-2">
        {/* Left side */}
        <div className="hidden lg:block">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2">
            <ShieldCheck size={18} className="text-emerald-400" />
            <span className="text-sm font-semibold text-white">
              Secure Company Portal
            </span>
          </div>

          <h1 className="text-5xl font-black leading-tight text-white xl:text-6xl">
            Manage your
            <span className="block bg-gradient-to-r from-primary to-cyan-400 bg-clip-text text-transparent">
              Lost &amp; Found
            </span>
            system.
          </h1>

          <p className="mt-6 max-w-lg text-lg leading-8 text-slate-400">
            Sign in to your company&apos;s TrustFound workspace to
            manage staff, lost items, found items, matches and
            recoveries.
          </p>

          <div className="mt-10 grid grid-cols-3 gap-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-2xl font-black text-white">AI</p>
              <p className="mt-1 text-sm text-slate-400">Matching</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-2xl font-black text-white">24/7</p>
              <p className="mt-1 text-sm text-slate-400">Tracking</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-2xl font-black text-white">🔐</p>
              <p className="mt-1 text-sm text-slate-400">Secure</p>
            </div>
          </div>
        </div>

        {/* Login card */}
        <div className="mx-auto w-full max-w-md">
          <div className="rounded-3xl bg-white p-8 shadow-2xl dark:bg-slate-900 md:p-10">
            <div className="mb-6 flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-blue-500 shadow-lg">
                <Building2 size={30} className="text-white" />
              </div>
            </div>

            <div className="text-center">
              <h2 className="text-3xl font-black text-slate-900 dark:text-white">
                Company Login
              </h2>
              <p className="mt-2 text-slate-500">
                Sign in to your company account
              </p>
            </div>

            {error && (
              <div
                role="alert"
                className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              {/* Username */}
              <div>
                <label
                  htmlFor="username"
                  className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300"
                >
                  Username
                </label>

                <div className="relative">
                  <Building2
                    size={19}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    id="username"
                    type="text"
                    name="username"
                    autoComplete="username"
                    value={form.username}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    placeholder="Company administrator username"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-4 pl-12 pr-4 text-slate-900 outline-none focus:ring-2 focus:ring-primary disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="text-sm font-semibold text-slate-700 dark:text-slate-300"
                  >
                    Password
                  </label>

                  <Link
                    to="/company-forgot-password"
                    className="text-sm font-semibold text-primary hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>

                <div className="relative">
                  <Lock
                    size={19}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    autoComplete="current-password"
                    value={form.password}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    placeholder="Enter your password"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-4 pl-12 pr-12 text-slate-900 outline-none focus:ring-2 focus:ring-primary disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    aria-pressed={showPassword}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                  >
                    {showPassword ? (
                      <EyeOff size={19} />
                    ) : (
                      <Eye size={19} />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-4 font-bold text-white shadow-lg transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
              >
                {loading ? "Signing in..." : "Sign In"}
                {!loading && <ArrowRight size={19} />}
              </button>
            </form>

            {/* Register */}
            <div className="mt-8 text-center">
              <p className="text-sm text-slate-500">
                Don&apos;t have a company account?{" "}
                <Link
                  to="/company/register"
                  className="font-bold text-primary hover:underline"
                >
                  Register your company
                </Link>
              </p>
            </div>

            {/* Back */}
            <div className="mt-5 text-center">
              <Link
                to="/"
                className="text-sm text-slate-400 hover:text-primary"
              >
                ← Back to TrustFound
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
