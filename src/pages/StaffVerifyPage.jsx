import { useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { API } from "../config";

export default function StaffVerifyPage() {
    const { companySlug } = useParams();
    const [searchParams] = useSearchParams();
    const email = searchParams.get("email") || "";

    const [code, setCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [verified, setVerified] = useState(false);

    const staffLoginUrl = `/company/${companySlug}/staff-login`;

    const verifyStaff = async (event) => {
        event.preventDefault();
        setError("");
        setMessage("");

        if (!email) {
            setError("The verification link is missing the staff email address.");
            return;
        }

        if (!/^\d{6}$/.test(code)) {
            setError("Enter the six-digit verification code.");
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(`${API}/verify-code/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email,
                    code,
                    purpose: "staff_invitation",
                    company_slug: companySlug,
                }),
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(
                    data.error || data.detail || data.message ||
                    "Verification failed. Check the code and try again."
                );
            }

            setVerified(true);
            setMessage(data.message || "Your staff account has been verified.");
        } catch (err) {
            setError(err.message || "Unable to verify your account.");
        } finally {
            setLoading(false);
        }
    };

    const resendCode = async () => {
        setError("");
        setMessage("");

        if (!email) {
            setError("The verification link is missing the staff email address.");
            return;
        }

        setResending(true);

        try {
            const response = await fetch(`${API}/resend-code/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email,
                    purpose: "staff_invitation",
                    company_slug: companySlug,
                }),
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(
                    data.error || data.detail || data.message ||
                    "Unable to resend the verification code."
                );
            }

            setMessage(data.message || "A new verification code has been sent.");
        } catch (err) {
            setError(err.message || "Unable to resend the code.");
        } finally {
            setResending(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 py-10">
            <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-8 shadow-xl">
                <div className="mb-7 text-center">
                    <h1 className="text-2xl font-bold text-white">
                        Verify Staff Account
                    </h1>
                    <p className="mt-3 text-sm text-slate-400">
                        Enter the six-digit verification code sent to:
                    </p>
                    <p className="mt-1 break-all font-medium text-blue-400">
                        {email || "Email address unavailable"}
                    </p>
                </div>

                {verified ? (
                    <div className="space-y-5 text-center">
                        <p className="text-green-400">{message}</p>
                        <Link
                            to={staffLoginUrl}
                            className="block w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700"
                        >
                            Continue to Staff Login
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={verifyStaff} className="space-y-5">
                        <div>
                            <label
                                htmlFor="staff-verification-code"
                                className="mb-2 block text-sm font-medium text-slate-300"
                            >
                                Verification code
                            </label>
                            <input
                                id="staff-verification-code"
                                type="text"
                                inputMode="numeric"
                                autoComplete="one-time-code"
                                maxLength={6}
                                value={code}
                                onChange={(event) =>
                                    setCode(event.target.value.replace(/\D/g, "").slice(0, 6))
                                }
                                placeholder="Enter 6-digit code"
                                className="w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-3 text-center text-xl tracking-[0.4em] text-white outline-none focus:border-blue-500"
                                required
                            />
                        </div>

                        {error && (
                            <p role="alert" className="text-sm text-red-400">
                                {error}
                            </p>
                        )}

                        {message && (
                            <p role="status" className="text-sm text-green-400">
                                {message}
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={loading || !email}
                            className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {loading ? "Verifying..." : "Verify Account"}
                        </button>

                        <button
                            type="button"
                            onClick={resendCode}
                            disabled={resending || !email}
                            className="w-full rounded-lg border border-slate-600 px-4 py-3 font-medium text-slate-300 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {resending ? "Sending..." : "Resend verification code"}
                        </button>
                    </form>
                )}

                <div className="mt-6 text-center">
                    <Link
                        to={staffLoginUrl}
                        className="text-sm text-blue-400 hover:text-blue-300"
                    >
                        Back to Staff Login
                    </Link>
                </div>
            </div>
        </div>
    );
}
