import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const API = "http://127.0.0.1:8000/api";

function StaffLoginPage() {
  const navigate = useNavigate();
  const params = useParams();

  // Supports either:
  // /company/:companySlug/staff-login
  // OR
  // /company/:slug/staff-login
  const slug = params.companySlug || params.slug;

  console.log("STAFF LOGIN COMPANY SLUG:", slug);

  // ============================================================
  // COMPANY
  // ============================================================

  const [company, setCompany] = useState(null);
  const [companyLoading, setCompanyLoading] = useState(true);
  const [companyError, setCompanyError] = useState("");

  // ============================================================
  // LOGIN
  // ============================================================

  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
  });

  const [loginLoading, setLoginLoading] = useState(false);
  const [loginMessage, setLoginMessage] = useState("");

  // ============================================================
  // FORGOT PASSWORD
  // ============================================================

  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState("");

  // ============================================================
  // RESET PASSWORD
  // ============================================================

  const [resetForm, setResetForm] = useState({
    email: "",
    code: "",
    new_password: "",
    confirm_password: "",
    
  });

  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState("");

  // ============================================================
  // CHANGE PASSWORD
  // ============================================================

  const [changeForm, setChangeForm] = useState({
    old_password: "",
    new_password: "",
    confirm_password: "",
  });

  const [changeLoading, setChangeLoading] = useState(false);
  const [changeMessage, setChangeMessage] = useState("");

  // ============================================================
  // ACTIVE PANEL
  // ============================================================

  const [activePanel, setActivePanel] = useState("login");

  // ============================================================
  // LOAD COMPANY
  // ============================================================

  useEffect(() => {
    const loadCompany = async () => {
      console.log("LOADING COMPANY:", slug);

      if (!slug) {
        setCompanyError(
          "Company platform was not specified."
        );
        setCompanyLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `${API}/company/public/${encodeURIComponent(slug)}/`
        );

        const data = await response.json();

        console.log("PUBLIC COMPANY RESPONSE:", data);

        if (!response.ok) {
          throw new Error(
            data.error ||
              data.detail ||
              "Company platform not found."
          );
        }

        const companyData =
          data.company || data;

        setCompany(companyData);

        localStorage.setItem(
          "company",
          JSON.stringify(companyData)
        );
      } catch (error) {
        console.error(
          "COMPANY LOAD ERROR:",
          error
        );

        setCompanyError(
          error.message ||
            "Unable to load company information."
        );
      } finally {
        setCompanyLoading(false);
      }
    };

    loadCompany();
  }, [slug]);

  // ============================================================
  // FORM CHANGE
  // ============================================================

  const handleLoginChange = (e) => {
    setLoginForm((previous) => ({
      ...previous,
      [e.target.name]: e.target.value,
    }));
  };

  // ============================================================
  // STAFF LOGIN
  // ============================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!slug) {
      setLoginMessage(
        "Company platform was not specified."
      );
      return;
    }

    setLoginLoading(true);
    setLoginMessage("");

    try {
      const response = await fetch(
        `${API}/staff/login/`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            email: loginForm.email
              .trim()
              .toLowerCase(),

            password: loginForm.password,

            company_slug: slug,
          }),
        }
      );

      const data = await response.json();

      console.log(
        "STAFF LOGIN RESPONSE:",
        data
      );

      if (!response.ok) {
        throw new Error(
          data.error ||
            data.detail ||
            "Invalid email or password."
        );
      }

      // ========================================================
      // TOKENS
      // ========================================================

      localStorage.setItem(
        "access",
        data.access
      );

      localStorage.setItem(
        "refresh",
        data.refresh
      );

      localStorage.setItem(
        "access_token",
        data.access
      );

      localStorage.setItem(
        "refresh_token",
        data.refresh
      );

      // ========================================================
      // STAFF
      // ========================================================

      const staffData = {
        id: data.user?.id,
        username: data.user?.username,
        name: data.user?.name,
        email: data.user?.email,
        role: data.user?.role,
      };

      localStorage.setItem(
        "staff",
        JSON.stringify(staffData)
      );

      // ========================================================
      // COMPANY
      // ========================================================

      const companyData = {
        id:
          data.company?.id ||
          company?.id,

        name:
          data.company?.name ||
          company?.name,

        slug:
          data.company?.slug ||
          slug,

        logo:
          data.company?.logo ||
          company?.logo ||
          null,
      };

      localStorage.setItem(
        "company",
        JSON.stringify(companyData)
      );

      // ========================================================
      // GO TO COMPANY STAFF DASHBOARD
      // ========================================================

      navigate(
        `/company/${slug}/staff-dashboard`
      );

    } catch (error) {
      console.error(
        "STAFF LOGIN ERROR:",
        error
      );

      setLoginMessage(
        error.message
      );
    } finally {
      setLoginLoading(false);
    }
  };

  // ============================================================
  // FORGOT PASSWORD
  // ============================================================

  const handleForgotPassword = async (e) => {
    e.preventDefault();

    if (!slug) {
      setForgotMessage(
        "Company platform was not specified."
      );
      return;
    }

    setForgotLoading(true);
    setForgotMessage("");

    try {
      const email =
        forgotEmail
          .trim()
          .toLowerCase();

      const response = await fetch(
        `${API}/staff/forgot-password/`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            email,
            company_slug: slug,
          }),
        }
      );

      const data = await response.json();

      console.log(
        "STAFF FORGOT PASSWORD:",
        data
      );

      if (!response.ok) {
        throw new Error(
          data.error ||
            data.detail ||
            "Unable to send reset code."
        );
      }

      setResetForm({
        email,
        code: "",
        new_password: "",
        confirm_password: "",
      });

      setForgotMessage(
        data.message ||
          "A reset code has been sent to your email."
      );

      setTimeout(() => {
        setForgotMessage("");
        setActivePanel("reset");
      }, 1000);

    } catch (error) {
      console.error(
        "FORGOT PASSWORD ERROR:",
        error
      );

      setForgotMessage(
        error.message
      );
    } finally {
      setForgotLoading(false);
    }
  };

  // ============================================================
  // RESET FORM CHANGE
  // ============================================================

  const handleResetChange = (e) => {
    setResetForm((previous) => ({
      ...previous,
      [e.target.name]: e.target.value,
    }));
  };

  // ============================================================
  // RESET STAFF PASSWORD
  // ============================================================

  const handleResetPassword = async (e) => {
    e.preventDefault();

    setResetLoading(true);
    setResetMessage("");

    if (
      resetForm.new_password !==
      resetForm.confirm_password
    ) {
      setResetMessage(
        "Passwords do not match."
      );

      setResetLoading(false);
      return;
    }

    if (
      resetForm.new_password.length < 8
    ) {
      setResetMessage(
        "Password must contain at least 8 characters."
      );

      setResetLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `${API}/staff/reset-password/`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            email: resetForm.email.trim().toLowerCase(),
            company_slug: slug, 
            code: resetForm.code.trim(),
            new_password: resetForm.new_password,
            confirm_password: resetForm.confirm_password,
          })
        }
      );
      const data = await response.json();

      console.log(
        "STAFF RESET RESPONSE:",
        data
      );

      if (!response.ok) {
        throw new Error(
          data.error ||
            data.detail ||
            "Unable to reset password."
        );
      }

      setResetMessage(
        data.message ||
          "Password reset successfully."
      );

      setTimeout(() => {
        setLoginForm({
          email: resetForm.email,
          password: "",
        });

        setResetForm({
          email: "",
          code: "",
          new_password: "",
          confirm_password: "",
        });

        setResetMessage("");
        setActivePanel("login");
      }, 1500);

    } catch (error) {
      console.error(
        "STAFF RESET ERROR:",
        error
      );

      setResetMessage(
        error.message
      );
    } finally {
      setResetLoading(false);
    }
  };

  // ============================================================
  // CHANGE PASSWORD
  // ============================================================

  const handleChangePasswordChange = (e) => {
    setChangeForm((previous) => ({
      ...previous,
      [e.target.name]: e.target.value,
    }));
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    setChangeLoading(true);
    setChangeMessage("");

    if (
      changeForm.new_password !==
      changeForm.confirm_password
    ) {
      setChangeMessage(
        "New passwords do not match."
      );

      setChangeLoading(false);
      return;
    }

    if (
      changeForm.new_password.length < 8
    ) {
      setChangeMessage(
        "Password must contain at least 8 characters."
      );

      setChangeLoading(false);
      return;
    }

    const token =
      localStorage.getItem(
        "access_token"
      ) ||
      localStorage.getItem("access");

    if (!token) {
      setChangeMessage(
        "Please login first before changing your password."
      );

      setChangeLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `${API}/staff/change-password/`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${token}`,
          },

          body: JSON.stringify({
            old_password:
              changeForm.old_password,

            new_password:
              changeForm.new_password,
          }),
        }
      );

      const data = await response.json();

      console.log(
        "STAFF CHANGE PASSWORD:",
        data
      );

      if (
        response.status === 401
      ) {
        localStorage.removeItem(
          "access"
        );

        localStorage.removeItem(
          "access_token"
        );

        localStorage.removeItem(
          "refresh"
        );

        localStorage.removeItem(
          "refresh_token"
        );

        setChangeMessage(
          "Your session has expired. Please login again."
        );

        setTimeout(() => {
          setActivePanel("login");
        }, 1200);

        return;
      }

      if (!response.ok) {
        throw new Error(
          data.error ||
            data.detail ||
            "Unable to change password."
        );
      }

      setChangeMessage(
        data.message ||
          "Password changed successfully."
      );

      setChangeForm({
        old_password: "",
        new_password: "",
        confirm_password: "",
      });

    } catch (error) {
      console.error(
        "CHANGE PASSWORD ERROR:",
        error
      );

      setChangeMessage(
        error.message
      );
    } finally {
      setChangeLoading(false);
    }
  };

  // ============================================================
  // LOGIN PANEL
  // ============================================================

  const renderLogin = () => (
    <form
      onSubmit={handleSubmit}
      className="space-y-5"
    >

      <div>
        <label className="block font-semibold mb-2">
          Gmail / Email
        </label>

        <input
          type="email"
          name="email"
          value={loginForm.email}
          onChange={handleLoginChange}
          required
          autoComplete="email"
          className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
          placeholder="staff@gmail.com"
        />
      </div>

      <div>
        <label className="block font-semibold mb-2">
          Password
        </label>

        <input
          type="password"
          name="password"
          value={loginForm.password}
          onChange={handleLoginChange}
          required
          autoComplete="current-password"
          className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
          placeholder="••••••••"
        />
      </div>

      {loginMessage && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">
          {loginMessage}
        </div>
      )}

      <button
        type="submit"
        disabled={loginLoading}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white py-4 rounded-xl font-bold transition"
      >
        {loginLoading
          ? "Signing In..."
          : "Sign In"}
      </button>

      <button
        type="button"
        onClick={() => {
          setForgotEmail(
            loginForm.email
          );
          setForgotMessage("");
          setActivePanel("forgot");
        }}
        className="w-full text-blue-600 hover:text-blue-800 font-semibold"
      >
        Forgot Password?
      </button>

      <button
        type="button"
        onClick={() =>
          setActivePanel("change")
        }
        className="w-full border border-gray-200 text-gray-600 hover:bg-gray-50 py-3 rounded-xl font-semibold"
      >
        Change Password
      </button>

    </form>
  );

  // ============================================================
  // FORGOT PASSWORD PANEL
  // ============================================================

  const renderForgot = () => (
    <form
      onSubmit={handleForgotPassword}
      className="space-y-5"
    >

      <div>
        <h2 className="text-2xl font-black text-gray-900">
          Forgot Password
        </h2>

        <p className="text-gray-500 mt-2">
          Enter your staff Gmail or email
          address and we will send you a
          verification code.
        </p>
      </div>

      <div>
        <label className="block font-semibold mb-2">
          Gmail / Email
        </label>

        <input
          type="email"
          value={forgotEmail}
          onChange={(e) =>
            setForgotEmail(
              e.target.value
            )
          }
          required
          autoComplete="email"
          className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
          placeholder="staff@gmail.com"
        />
      </div>

      {forgotMessage && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 rounded-xl p-4 text-sm">
          {forgotMessage}
        </div>
      )}

      <button
        type="submit"
        disabled={forgotLoading}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white py-4 rounded-xl font-bold"
      >
        {forgotLoading
          ? "Sending Code..."
          : "Send Reset Code"}
      </button>

      <button
        type="button"
        onClick={() =>
          setActivePanel("login")
        }
        className="w-full text-gray-500 font-semibold"
      >
        Back to Login
      </button>

    </form>
  );

  // ============================================================
  // RESET PASSWORD PANEL
  // ============================================================

  const renderReset = () => (
    <form
      onSubmit={handleResetPassword}
      className="space-y-5"
    >

      <div>
        <h2 className="text-2xl font-black text-gray-900">
          Reset Staff Password
        </h2>

        <p className="text-gray-500 mt-2">
          Enter the 6-digit verification
          code sent to your email.
        </p>
      </div>

      <div>
        <label className="block font-semibold mb-2">
          Gmail / Email
        </label>

        <input
          type="email"
          name="email"
          value={resetForm.email}
          onChange={handleResetChange}
          required
          className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block font-semibold mb-2">
          Verification Code
        </label>

        <input
          type="text"
          name="code"
          value={resetForm.code}
          onChange={handleResetChange}
          required
          maxLength={6}
          inputMode="numeric"
          className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="123456"
        />
      </div>

      <div>
        <label className="block font-semibold mb-2">
          New Password
        </label>

        <input
          type="password"
          name="new_password"
          value={resetForm.new_password}
          onChange={handleResetChange}
          required
          autoComplete="new-password"
          className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block font-semibold mb-2">
          Confirm New Password
        </label>

        <input
          type="password"
          name="confirm_password"
          value={resetForm.confirm_password}
          onChange={handleResetChange}
          required
          autoComplete="new-password"
          className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {resetMessage && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 rounded-xl p-4 text-sm">
          {resetMessage}
        </div>
      )}

      <button
        type="submit"
        disabled={resetLoading}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white py-4 rounded-xl font-bold"
      >
        {resetLoading
          ? "Resetting..."
          : "Reset Password"}
      </button>

      <button
        type="button"
        onClick={() =>
          setActivePanel("login")
        }
        className="w-full text-gray-500 font-semibold"
      >
        Back to Login
      </button>

    </form>
  );

  // ============================================================
  // CHANGE PASSWORD PANEL
  // ============================================================

  const renderChangePassword = () => (
    <form
      onSubmit={handleChangePassword}
      className="space-y-5"
    >

      <div>
        <h2 className="text-2xl font-black text-gray-900">
          Change Password
        </h2>

        <p className="text-gray-500 mt-2">
          Change your current staff account
          password.
        </p>
      </div>

      <div>
        <label className="block font-semibold mb-2">
          Current Password
        </label>

        <input
          type="password"
          name="old_password"
          value={
            changeForm.old_password
          }
          onChange={
            handleChangePasswordChange
          }
          required
          autoComplete="current-password"
          className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block font-semibold mb-2">
          New Password
        </label>

        <input
          type="password"
          name="new_password"
          value={
            changeForm.new_password
          }
          onChange={
            handleChangePasswordChange
          }
          required
          autoComplete="new-password"
          className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block font-semibold mb-2">
          Confirm New Password
        </label>

        <input
          type="password"
          name="confirm_password"
          value={
            changeForm.confirm_password
          }
          onChange={
            handleChangePasswordChange
          }
          required
          autoComplete="new-password"
          className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {changeMessage && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 rounded-xl p-4 text-sm">
          {changeMessage}
        </div>
      )}

      <button
        type="submit"
        disabled={changeLoading}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white py-4 rounded-xl font-bold"
      >
        {changeLoading
          ? "Changing Password..."
          : "Change Password"}
      </button>

      <button
        type="button"
        onClick={() =>
          setActivePanel("login")
        }
        className="w-full text-gray-500 font-semibold"
      >
        Back to Login
      </button>

    </form>
  );

  // ============================================================
  // LOADING
  // ============================================================

  if (companyLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 flex items-center justify-center p-6">

        <div className="bg-white rounded-3xl shadow-2xl p-10 text-center">

          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />

          <p className="mt-5 font-semibold text-gray-700">
            Loading company portal...
          </p>

        </div>

      </div>
    );
  }

  // ============================================================
  // COMPANY ERROR
  // ============================================================

  if (companyError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 flex items-center justify-center p-6">

        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-10 text-center">

          <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto text-3xl font-black">
            !
          </div>

          <h1 className="text-2xl font-black mt-5">
            Company Not Found
          </h1>

          <p className="text-gray-500 mt-3">
            {companyError}
          </p>

          <p className="text-xs text-gray-400 mt-3 break-all">
            Slug: {slug || "undefined"}
          </p>

          <button
            onClick={() =>
              navigate("/")
            }
            className="mt-6 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold"
          >
            Go Home
          </button>

        </div>

      </div>
    );
  }

  // ============================================================
  // COMPANY DISPLAY
  // ============================================================

  const companyName =
    company?.name ||
    "Company";

  const companyLogo =
    company?.logo ||
    null;

  // ============================================================
  // PAGE
  // ============================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 flex items-center justify-center p-6">

      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">

        {/* COMPANY HEADER */}

        <div className="bg-slate-950 text-white px-8 py-8 text-center">

          {companyLogo ? (
            <img
              src={companyLogo}
              alt={companyName}
              className="w-24 h-24 rounded-2xl object-cover mx-auto mb-5 bg-white p-1"
            />
          ) : (
            <div className="w-24 h-24 rounded-2xl bg-blue-600 flex items-center justify-center mx-auto mb-5 text-4xl font-black">
              {companyName
                .charAt(0)
                .toUpperCase()}
            </div>
          )}

          <h1 className="text-2xl font-black">
            {companyName}
          </h1>

          <p className="text-blue-400 mt-2 text-sm font-semibold">
            Staff Portal
          </p>

          <p className="text-slate-400 text-xs mt-1">
            Lost & Found Management System
          </p>

        </div>

        {/* CONTENT */}

        <div className="p-8">

          {activePanel === "login" &&
            renderLogin()}

          {activePanel === "forgot" &&
            renderForgot()}

          {activePanel === "reset" &&
            renderReset()}

          {activePanel === "change" &&
            renderChangePassword()}

          <div className="mt-8 text-center">

            <p className="text-xs text-gray-400">
              Authorized Personnel Only
            </p>

            <p className="text-xs text-gray-300 mt-1">
              {companyName}
            </p>

          </div>

        </div>

      </div>

    </div>
  );
}

export default StaffLoginPage;