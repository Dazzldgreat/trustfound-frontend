import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Hash, LockKeyhole, Mail } from "lucide-react";

import { API } from "../../config";
import AuthLayout, {
    AuthAlert,
    AuthField,
    AuthHeading,
    AuthSubmit,
} from "../../component/auth/AuthLayout";

/* ============================================================
   COMPANY ADMIN PASSWORD RESET
   Step 1: POST /company/forgot-password/  { email }
   Step 2: POST /company/reset-password/   { email, code, new_password }
============================================================ */

async function readJson(response) {
    try {
        return await response.json();
    } catch {
        return {};
    }
}

function errorFrom(data, fallback) {
    return data?.error || data?.detail || data?.message || fallback;
}

export default function CompanyForgotPassword() {
    const navigate = useNavigate();

    const [step, setStep] = useState("request");
    const [email, setEmail] = useState("");
    const [code, setCode] = useState("");
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const requestCode = async (event) => {
        event.preventDefault();
        setError("");
        setSuccess("");
        setLoading(true);

        try {
            const response = await fetch(`${API}/company/forgot-password/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: email.trim().toLowerCase() }),
            });

            const data = await readJson(response);

            if (!response.ok) {
                throw new Error(errorFrom(data, "Unable to send a reset code."));
            }

            setSuccess(data.message || "A reset code has been sent to your email.");
            setStep("reset");
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const resetPassword = async (event) => {
        event.preventDefault();
        setError("");
        setSuccess("");

        if (password.length < 8) {
            setError("Password must be at least 8 characters.");
            return;
        }

        if (password !== confirm) {
            setError("Passwords do not match.");
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(`${API}/company/reset-password/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: email.trim().toLowerCase(),
                    code: code.trim(),
                    new_password: password,
                }),
            });

            const data = await readJson(response);

            if (!response.ok) {
                throw new Error(errorFrom(data, "Unable to reset your password."));
            }

            setSuccess(data.message || "Password reset successfully. You can now log in.");
            setTimeout(() => navigate("/company/login", { replace: true }), 1500);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout
            companyName="TrustFound"
            backTo="/company/login"
            backLabel="Back to company login"
            tagline="Reset the password for your company administrator account."
        >
            {step === "request" ? (
                <>
                    <AuthHeading
                        title="Forgot password"
                        subtitle="Enter your company admin email and we'll send you a reset code."
                    />

                    <AuthAlert>{error}</AuthAlert>

                    <form onSubmit={requestCode} className="space-y-4">
                        <AuthField
                            id="email"
                            label="Email"
                            icon={Mail}
                            type="email"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            placeholder="admin@company.com"
                            required
                            disabled={loading}
                            autoComplete="email"
                        />

                        <div className="pt-2">
                            <AuthSubmit loading={loading} loadingText="Sending code...">
                                Send reset code
                                <ArrowRight size={18} />
                            </AuthSubmit>
                        </div>
                    </form>

                    <button
                        type="button"
                        onClick={() => {
                            setError("");
                            setStep("reset");
                        }}
                        className="mt-4 w-full rounded-xl px-4 py-3 text-sm font-semibold text-stone-600 transition hover:bg-stone-50 hover:text-graphite"
                    >
                        I already have a code
                    </button>
                </>
            ) : (
                <>
                    <AuthHeading
                        title="Choose a new password"
                        subtitle="Enter the code from your email and your new password."
                    />

                    <AuthAlert tone="success">{success}</AuthAlert>
                    <AuthAlert>{error}</AuthAlert>

                    <form onSubmit={resetPassword} className="space-y-4">
                        <AuthField
                            id="email"
                            label="Email"
                            icon={Mail}
                            type="email"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            required
                            disabled={loading}
                            autoComplete="email"
                        />

                        <AuthField
                            id="code"
                            label="Reset code"
                            icon={Hash}
                            value={code}
                            onChange={(event) => setCode(event.target.value)}
                            placeholder="123456"
                            inputMode="numeric"
                            maxLength={6}
                            required
                            disabled={loading}
                        />

                        <AuthField
                            id="new_password"
                            label="New password"
                            icon={LockKeyhole}
                            type="password"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            placeholder="At least 8 characters"
                            minLength={8}
                            required
                            disabled={loading}
                            autoComplete="new-password"
                        />

                        <AuthField
                            id="confirm_password"
                            label="Confirm new password"
                            icon={LockKeyhole}
                            type="password"
                            value={confirm}
                            onChange={(event) => setConfirm(event.target.value)}
                            minLength={8}
                            required
                            disabled={loading}
                            autoComplete="new-password"
                        />

                        <div className="pt-2">
                            <AuthSubmit loading={loading} loadingText="Resetting...">
                                Reset password
                            </AuthSubmit>
                        </div>
                    </form>

                    <button
                        type="button"
                        onClick={() => {
                            setError("");
                            setSuccess("");
                            setStep("request");
                        }}
                        className="mt-4 w-full rounded-xl px-4 py-3 text-sm font-semibold text-stone-600 transition hover:bg-stone-50 hover:text-graphite"
                    >
                        Send a new code
                    </button>
                </>
            )}

            <p className="mt-6 text-center text-sm text-stone-600">
                Remembered it?{" "}
                <Link to="/company/login" className="font-bold text-primary hover:underline">
                    Log in
                </Link>
            </p>
        </AuthLayout>
    );
}
