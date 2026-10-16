import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

export default function CompanyVerifyCodePage() {
  const navigate = useNavigate();
  const location = useLocation();

  const email = location.state?.email || "";

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!email) {
      setError(
        "Registration email was not found. Please register again."
      );
      return;
    }

    if (!code || code.length !== 6) {
      setError("Please enter the 6-digit verification code.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "https://trustfound-backend.onrender.com/api/company/verify-registration/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            code,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            data.detail ||
            "Verification failed."
        );
      }

      setSuccess(
        "Company registration verified successfully."
      );

      setTimeout(() => {
          navigate("/company/setup");
      }, 1200);
    } catch (err) {
      setError(
        err.message ||
          "Unable to verify your registration."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    setSuccess("");

    if (!email) {
      setError(
        "Registration email was not found."
      );
      return;
    }

    try {
      const response = await fetch(
        "https://trustfound-backend.onrender.com/api/company/resend-registration-code/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            data.detail ||
            "Unable to resend code."
        );
      }

      setSuccess(
        "A new verification code has been sent."
      );
    } catch (err) {
      setError(
        err.message ||
          "Unable to resend verification code."
      );
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-6 py-12">

      <div className="w-full max-w-md">

        {/* BRAND */}
        <div className="text-center mb-8">

          <Link
            to="/"
            className="inline-flex items-center gap-3"
          >
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-blue-500 flex items-center justify-center text-white font-black text-xl">
              LF
            </div>

            <div className="text-left">
              <h1 className="text-xl font-black text-white">
                LostFound
              </h1>

              <p className="text-xs text-slate-400">
                AI Recovery Platform
              </p>
            </div>
          </Link>

        </div>

        {/* CARD */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-8">

          <div className="text-center">

            <div className="text-5xl mb-5">
              🔐
            </div>

            <h2 className="text-3xl font-black text-slate-900 dark:text-white">
              Verify Company
            </h2>

            <p className="text-slate-500 mt-3 leading-6">
              Enter the 6-digit verification code
              sent to:
            </p>

            <p className="font-bold text-primary mt-2 break-all">
              {email || "your email"}
            </p>

          </div>

          {/* ERROR */}
          {error && (
            <div className="mt-6 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* SUCCESS */}
          {success && (
            <div className="mt-6 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-600">
              {success}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="mt-8 space-y-5"
          >

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Verification Code
              </label>

              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) =>
                  setCode(
                    e.target.value
                      .replace(/\D/g, "")
                  )
                }
                placeholder="000000"
                className="w-full text-center tracking-[0.5em] text-2xl font-black py-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-xl bg-primary text-white font-bold shadow-lg hover:scale-[1.02] transition disabled:opacity-60"
            >
              {loading
                ? "Verifying..."
                : "Verify Company"}
            </button>

          </form>

          {/* RESEND */}
          <div className="text-center mt-6">

            <p className="text-sm text-slate-500">
              Didn't receive the code?
            </p>

            <button
              type="button"
              onClick={handleResend}
              className="mt-2 text-primary font-bold hover:underline"
            >
              Resend verification code
            </button>

          </div>

          {/* LOGIN */}
          <div className="text-center mt-6">

            <Link
              to="/company/login"
              className="text-sm text-slate-400 hover:text-primary"
            >
              ← Back to Company Login
            </Link>

          </div>

        </div>

      </div>

    </div>
  );
}