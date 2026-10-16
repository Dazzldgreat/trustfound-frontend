import React, { useState } from "react";
import {
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";


// ============================================================
// API
// ============================================================

import { API } from "../config";
// ============================================================
// GET STORED OBJECT
// ============================================================

function getStoredObject(key) {
  try {
    const value = localStorage.getItem(key);

    return value
      ? JSON.parse(value)
      : null;

  } catch {
    return null;
  }
}


// ============================================================
// COMPONENT
// ============================================================

function ResetPasswordPage() {

  const navigate = useNavigate();
  const location = useLocation();

  const { companySlug } = useParams();


  // ==========================================================
  // COMPANY
  // ==========================================================

  const storedCompany =
    getStoredObject("company");

  const storedUser =
    getStoredObject("user");


  const activeCompanySlug =
    companySlug ||
    localStorage.getItem("companySlug") ||
    localStorage.getItem("company_slug") ||
    storedCompany?.slug ||
    storedUser?.company_slug ||
    storedUser?.companySlug ||
    storedUser?.organization_slug ||
    storedUser?.organizationSlug ||
    "";


  // ==========================================================
  // COMPANY ROUTE
  // ==========================================================

  const companyRoute = (path = "") => {

    const cleanPath = path
      ? path.startsWith("/")
        ? path
        : `/${path}`
      : "";


    if (!activeCompanySlug) {
      return cleanPath || "/";
    }


    return `/company/${encodeURIComponent(
      activeCompanySlug
    )}${cleanPath}`;

  };


  // ==========================================================
  // EMAIL
  // ==========================================================

  const email =
    location.state?.email || "";


  // ==========================================================
  // STATE
  // ==========================================================

  const [newPassword, setNewPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);


  // ==========================================================
  // RESET PASSWORD
  // ==========================================================

  const handleReset = async (e) => {

    e.preventDefault();


    // ========================================================
    // PASSWORD CHECK
    // ========================================================

    if (
      newPassword !== confirmPassword
    ) {

      alert(
        "Passwords do not match."
      );

      return;

    }


    setLoading(true);


    try {

      // ======================================================
      // API REQUEST
      // ======================================================

      const response =
        await fetch(
          `${API}/reset-password/`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              email,
              password: newPassword,
            }),

          }
        );


      // ======================================================
      // RESPONSE
      // ======================================================

      const data =
        await response.json();


      if (!response.ok) {

        throw new Error(
          data.error ||
          data.detail ||
          data.message ||
          "Unable to reset password"
        );

      }


      // ======================================================
      // SUCCESS
      // ======================================================

      alert(
        "Password changed successfully!"
      );


      // ======================================================
      // COMPANY LOGIN
      // ======================================================

      navigate(
        companyRoute("/login-page")
      );


    } catch (error) {

      alert(
        error.message
      );


    } finally {

      setLoading(false);

    }

  };


  // ==========================================================
  // PAGE
  // ==========================================================

  return (

    <div className="min-h-screen bg-[#f8fbfb] flex items-center justify-center px-4">

      <form
        onSubmit={handleReset}
        className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md"
      >

        {/* ====================================================
            TITLE
        ==================================================== */}

        <h1 className="text-3xl font-bold mb-2">

          Reset Password

        </h1>


        <p className="text-gray-500 mb-6">

          Create a new password

        </p>


        {/* ====================================================
            NEW PASSWORD
        ==================================================== */}

        <input
          type="password"
          placeholder="New Password"
          className="w-full border p-4 rounded-xl mb-4"
          value={newPassword}
          onChange={(e) =>
            setNewPassword(
              e.target.value
            )
          }
          required
        />


        {/* ====================================================
            CONFIRM PASSWORD
        ==================================================== */}

        <input
          type="password"
          placeholder="Confirm Password"
          className="w-full border p-4 rounded-xl"
          value={confirmPassword}
          onChange={(e) =>
            setConfirmPassword(
              e.target.value
            )
          }
          required
        />


        {/* ====================================================
            RESET BUTTON
        ==================================================== */}

        <button
          type="submit"
          className="w-full mt-5 bg-primary text-white py-4 rounded-xl font-bold disabled:opacity-60"
          disabled={loading}
        >

          {loading
            ? "Updating..."
            : "Reset Password"}

        </button>

      </form>

    </div>

  );

}


export default ResetPasswordPage;
