import React, {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
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

function StaffFoundItemDetail() {

  const navigate = useNavigate();

  const {
    id,
    companySlug,
  } = useParams();


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
  // TOKEN
  // ==========================================================

  const access =
    localStorage.getItem("access_token") ||
    localStorage.getItem("access");


  // ==========================================================
  // COMPANY ROUTE
  // ==========================================================

  const companyRoute = useCallback(
    (path = "") => {

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

    },
    [activeCompanySlug]
  );


  // ==========================================================
  // STATE
  // ==========================================================

  const [item, setItem] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  // ==========================================================
  // AUTH CHECK
  // ==========================================================

  useEffect(() => {

    if (!access) {

      navigate(
        companyRoute("/login-page"),
        {
          replace: true,
        }
      );

    }

  }, [
    access,
    navigate,
    companyRoute,
  ]);


  // ==========================================================
  // FETCH ITEM
  // ==========================================================

  const fetchItem = useCallback(
    async () => {

      if (!access || !id) {
        return;
      }


      try {

        setLoading(true);

        setError("");


        const response =
          await fetch(
            `${API}/staff/found-item/${id}/`,
            {
              headers: {
                Authorization:
                  `Bearer ${access}`,
              },
            }
          );


        // ====================================================
        // AUTH FAILURE
        // ====================================================

        if (
          response.status === 401 ||
          response.status === 403
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

          localStorage.removeItem(
            "user"
          );


          navigate(
            companyRoute(
              "/login-page"
            ),
            {
              replace: true,
            }
          );

          return;
        }


        const data =
          await response.json();


        console.log(
          "STAFF FOUND ITEM:",
          data
        );


        if (!response.ok) {

          throw new Error(
            data.error ||
            data.detail ||
            data.message ||
            "Unable to load found item."
          );

        }


        setItem(data);


      } catch (error) {

        console.error(
          "STAFF FOUND ITEM ERROR:",
          error
        );


        setError(
          error.message ||
          "Unable to load item."
        );


      } finally {

        setLoading(false);

      }

    },
    [
      access,
      id,
      navigate,
      companyRoute,
    ]
  );


  // ==========================================================
  // INITIAL FETCH
  // ==========================================================

  useEffect(() => {

    fetchItem();

  }, [
    fetchItem,
  ]);


  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {

    return (

      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-slate-950">

        <div className="text-center">

          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />

          <div className="text-2xl font-bold mt-5 text-gray-700 dark:text-gray-300">

            Loading Item...

          </div>

        </div>

      </div>

    );

  }


  // ==========================================================
  // ERROR
  // ==========================================================

  if (error || !item) {

    return (

      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-slate-950 px-4">

        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl p-8 max-w-lg w-full text-center">

          <div className="text-red-600 text-5xl font-black mb-5">
            !
          </div>


          <h1 className="text-2xl font-black text-gray-800 dark:text-white">

            Unable to Load Item

          </h1>


          <p className="text-gray-500 dark:text-gray-400 mt-3">

            {error ||
              "The requested found item could not be found."}

          </p>


          <button
            type="button"
            onClick={() =>
              navigate(
                companyRoute(
                  "/staff/pending-verification"
                )
              )
            }
            className="mt-6 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold"
          >

            Back to Pending Verification

          </button>

        </div>

      </div>

    );

  }


  // ==========================================================
  // STATUS COLORS
  // ==========================================================

  const statusColor = {

    Pending:
      "bg-yellow-100 text-yellow-700",

    Verified:
      "bg-blue-100 text-blue-700",

    Matched:
      "bg-purple-100 text-purple-700",

    Recovered:
      "bg-green-100 text-green-700",

  };


  // ==========================================================
  // IMAGE URL
  // ==========================================================

  const imageUrl =
    item.image
      ? item.image.startsWith("http")
        ? item.image
        : `${API.replace(
            "/api",
            ""
          )}${item.image}`
      : null;


  // ==========================================================
  // PAGE
  // ==========================================================

  return (

    <div className="min-h-screen bg-gray-100 dark:bg-slate-950 py-10 px-6">

      <div className="max-w-6xl mx-auto">


        {/* ==================================================
            BACK BUTTON
        ================================================== */}

        <button
          type="button"
          onClick={() =>
            navigate(
              companyRoute(
                "/staff/pending-verification"
              )
            )
          }
          className="mb-6 text-blue-600 dark:text-blue-400 font-bold hover:underline"
        >

          ← Back to Pending Verification

        </button>


        {/* ==================================================
            HEADER
        ================================================== */}

        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-lg p-8 mb-8">

          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-5">

            <div>

              <h1 className="text-4xl font-black text-gray-800 dark:text-white">

                {item.item_name}

              </h1>


              <p className="text-gray-500 dark:text-gray-400 mt-2">

                Found Item Case File

              </p>

            </div>


            <span
              className={`px-5 py-2 rounded-full font-bold ${
                statusColor[item.status] ||
                "bg-gray-100 text-gray-700"
              }`}
            >

              {item.status}

            </span>

          </div>

        </div>


        {/* ==================================================
            MAIN CONTENT
        ================================================== */}

        <div className="grid lg:grid-cols-2 gap-8">


          {/* ==================================================
              LEFT SIDE
          ================================================== */}

          <div className="space-y-8">


            {/* ==================================================
                IMAGE
            ================================================== */}

            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-lg overflow-hidden">

              {imageUrl ? (

                <img
                  src={imageUrl}
                  alt={item.item_name}
                  className="w-full h-[450px] object-cover"
                />

              ) : (

                <div className="h-[450px] flex items-center justify-center text-gray-400">

                  No Image Available

                </div>

              )}

            </div>


            {/* ==================================================
                DESCRIPTION
            ================================================== */}

            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-lg p-8">

              <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">

                Description

              </h2>


              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">

                {item.description ||
                  "No description provided."}

              </p>

            </div>

          </div>


          {/* ==================================================
              RIGHT SIDE
          ================================================== */}

          <div className="space-y-8">


            {/* ==================================================
                ITEM INFORMATION
            ================================================== */}

            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-lg p-8">

              <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">

                Item Information

              </h2>


              <div className="space-y-4">


                <div className="flex justify-between gap-5">

                  <span className="font-semibold text-gray-700 dark:text-gray-300">

                    Category

                  </span>


                  <span className="text-right text-gray-600 dark:text-gray-400">

                    {item.category ||
                      "N/A"}

                  </span>

                </div>


                <div className="flex justify-between gap-5">

                  <span className="font-semibold text-gray-700 dark:text-gray-300">

                    Location Found

                  </span>


                  <span className="text-right text-gray-600 dark:text-gray-400">

                    {item.location_found ||
                      "N/A"}

                  </span>

                </div>


                <div className="flex justify-between gap-5">

                  <span className="font-semibold text-gray-700 dark:text-gray-300">

                    Date Found

                  </span>


                  <span className="text-right text-gray-600 dark:text-gray-400">

                    {item.date_found ||
                      "N/A"}

                  </span>

                </div>


                <div className="flex justify-between gap-5">

                  <span className="font-semibold text-gray-700 dark:text-gray-300">

                    Time Found

                  </span>


                  <span className="text-right text-gray-600 dark:text-gray-400">

                    {item.time_found ||
                      "N/A"}

                  </span>

                </div>

              </div>

            </div>


            {/* ==================================================
                FINDER
            ================================================== */}

            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-lg p-8">

              <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">

                Finder Information

              </h2>


              <div className="space-y-4">


                <div className="flex justify-between gap-5">

                  <span className="font-semibold text-gray-700 dark:text-gray-300">

                    Name

                  </span>


                  <span className="text-right text-gray-600 dark:text-gray-400">

                    {item.finder_name ||
                      "N/A"}

                  </span>

                </div>


                <div className="flex justify-between gap-5">

                  <span className="font-semibold text-gray-700 dark:text-gray-300">

                    Email

                  </span>


                  <span className="text-right text-gray-600 dark:text-gray-400 break-all">

                    {item.finder_email ||
                      "N/A"}

                  </span>

                </div>


                <div className="flex justify-between gap-5">

                  <span className="font-semibold text-gray-700 dark:text-gray-300">

                    Phone

                  </span>


                  <span className="text-right text-gray-600 dark:text-gray-400">

                    {item.finder_phone ||
                      "N/A"}

                  </span>

                </div>

              </div>

            </div>


            {/* ==================================================
                VERIFICATION
            ================================================== */}

            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-lg p-8">

              <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">

                Staff Verification

              </h2>


              <div className="space-y-4">


                <div className="flex justify-between gap-5">

                  <span className="font-semibold text-gray-700 dark:text-gray-300">

                    Verified By

                  </span>


                  <span className="text-right text-gray-600 dark:text-gray-400">

                    {item.verified_by ||
                      "Not Verified"}

                  </span>

                </div>


                <div className="flex justify-between gap-5">

                  <span className="font-semibold text-gray-700 dark:text-gray-300">

                    Verification Date

                  </span>


                  <span className="text-right text-gray-600 dark:text-gray-400">

                    {item.verified_at ||
                      "N/A"}

                  </span>

                </div>

              </div>

            </div>


            {/* ==================================================
                MATCH INFO
            ================================================== */}

            {item.matched_with && (

              <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-900 rounded-3xl p-8">

                <h2 className="text-2xl font-bold text-yellow-700 dark:text-yellow-400 mb-4">

                  Match Found

                </h2>


                <p className="font-semibold text-gray-700 dark:text-gray-300">

                  Lost Item:

                </p>


                <p className="mt-2 text-gray-700 dark:text-gray-300">

                  {item.matched_with}

                </p>

              </div>

            )}


            {/* ==================================================
                RECOVERY
            ================================================== */}

            {item.recovered_by && (

              <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 rounded-3xl p-8">

                <h2 className="text-2xl font-bold text-green-700 dark:text-green-400 mb-4">

                  Item Recovered

                </h2>


                <p className="text-gray-700 dark:text-gray-300">

                  Recovered By:

                  <span className="font-bold ml-2">

                    {item.recovered_by}

                  </span>

                </p>

              </div>

            )}

          </div>

        </div>

      </div>

    </div>

  );

}


export default StaffFoundItemDetail;
