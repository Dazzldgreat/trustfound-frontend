
import React, { useState } from "react";
import {
  useNavigate,
  useLocation,
} from "react-router-dom";
import { API } from "../config";

function VerifyCodePage() {
  const navigate = useNavigate();
  const location = useLocation();

  const email = location.state?.email || "";
  const purpose = location.state?.purpose || "signup";

  const company =
    location.state?.companySlug ||
    new URLSearchParams(location.search).get("company") ||
    "";

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  // VERIFY CODE
  const handleVerify = async (e) => {
    e.preventDefault();

    if (!email || !company) {
      alert(
        "Email or company information is missing. Please return to your company's signup page."
      );
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API}/verify-code/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            code: code.trim(),
            purpose,
            company,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
          data.message ||
          "Verification failed."
        );
      }

      // SIGNUP FLOW
      if (purpose === "signup") {
        if (!data.access || !data.refresh) {
          throw new Error(
            "Verification succeeded, but login tokens were not returned."
          );
        }

        localStorage.setItem("access", data.access);
        localStorage.setItem("refresh", data.refresh);

        localStorage.setItem(
          "user",
          JSON.stringify({
            username: data.username,
            name: data.name || "",
            email: data.email,
            role: data.role,
          })
        );

        alert("Account verified successfully!");

        navigate("/dashboard", { replace: true });
      }

      // FORGOT PASSWORD FLOW
      else if (purpose === "forgot-password") {
        alert("Code verified successfully.");

        navigate("/reset-password", {
          state: {
            email,
            code: code.trim(),
            companySlug: company,
          },
        });
      }
    } catch (error) {
      alert(error.message || "Verification failed.");
    } finally {
      setLoading(false);
    }
  };

  // RESEND CODE
  const handleResendCode = async () => {
    if (!email || !company) {
      alert(
        "Email or company information is missing. Please return to your company's signup page."
      );
      return;
    }

    setResending(true);

    try {
      const response = await fetch(
        `${API}/resend-code/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            purpose,
            company,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
          data.message ||
          "Failed to resend verification code."
        );
      }

      alert("Verification code sent again.");
    } catch (error) {
      alert(error.message || "Failed to resend code.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fbfb] flex items-center justify-center px-4">
      <form
        onSubmit={handleVerify}
        className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md"
      >
        <h1 className="text-3xl font-bold mb-2">
          Verify Code
        </h1>

        <p className="text-gray-500 mb-6">
          Enter the verification code sent to
          <span className="font-semibold">
            {" "}
            {email}
          </span>
        </p>

        <input
          type="text"
          placeholder="Enter verification code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="w-full border p-4 rounded-xl"
          required
        />

        <button
          type="submit"
          disabled={loading || resending}
          className="w-full mt-4 bg-primary text-white py-4 rounded-xl font-bold disabled:opacity-50"
        >
          {loading ? "Verifying..." : "Verify Code"}
        </button>

        <button
          type="button"
          onClick={handleResendCode}
          disabled={resending || loading}
          className="w-full mt-3 border border-primary text-primary py-4 rounded-xl font-bold disabled:opacity-50"
        >
          {resending ? "Sending..." : "Resend Code"}
        </button>
      </form>
    </div>
  );
}

export default VerifyCodePage;
