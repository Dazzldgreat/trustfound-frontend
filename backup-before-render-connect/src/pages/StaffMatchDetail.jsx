
import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

const API = "http://127.0.0.1:8000";

function StaffMatchDetail() {
  const { id, companySlug } = useParams();
  const navigate = useNavigate();

  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // ============================================================
  // GET STORED COMPANY
  // ============================================================

  const getStoredCompany = () => {
    try {
      const stored = localStorage.getItem("company");

      if (!stored) {
        return null;
      }

      return JSON.parse(stored);
    } catch (error) {
      console.error(
        "Invalid company data in localStorage:",
        error
      );

      return null;
    }
  };

  const storedCompany = getStoredCompany();

  const activeCompanySlug =
    companySlug ||
    storedCompany?.slug ||
    storedCompany?.company_slug ||
    "";

  // ============================================================
  // COMPANY ROUTE
  // ============================================================

  const companyRoute = (path = "") => {
    if (!activeCompanySlug) {
      return "/staff-login";
    }

    const cleanPath = path.startsWith("/")
      ? path
      : `/${path}`;

    return `/company/${encodeURIComponent(
      activeCompanySlug
    )}${cleanPath}`;
  };

  // ============================================================
  // IMAGE URL
  // ============================================================

  const getImageUrl = (image) => {
    if (!image) {
      return null;
    }

    if (image.startsWith("http://") || image.startsWith("https://")) {
      return image;
    }

    return `${API}${image.startsWith("/") ? image : `/${image}`}`;
  };

  // ============================================================
  // FETCH MATCH
  // ============================================================

  const fetchMatch = async () => {
    try {
      setLoading(true);
      setError("");

      const access = localStorage.getItem("access");

      if (!access) {
        navigate("/staff-login");
        return;
      }

      const response = await fetch(
        `${API}/api/staff/matches/${id}/`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${access}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      // Authentication expired
      if (response.status === 401) {
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");

        navigate("/staff-login");
        return;
      }

      if (!response.ok) {
        throw new Error(
          data?.error ||
            data?.detail ||
            "Failed to load match."
        );
      }

      setMatch(data);
    } catch (error) {
      console.error("Failed to fetch match:", error);

      setError(
        error.message ||
          "Something went wrong while loading this match."
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // LOAD MATCH
  // ============================================================

  useEffect(() => {
    if (!id) {
      setError("Match ID is missing.");
      setLoading(false);
      return;
    }

    fetchMatch();
  }, [id]);

  // ============================================================
  // APPROVE MATCH
  // ============================================================

  const approveMatch = async () => {
    if (actionLoading) {
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to approve this match?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setActionLoading(true);
      setError("");

      const access = localStorage.getItem("access");

      if (!access) {
        navigate("/staff-login");
        return;
      }

      const response = await fetch(
        `${API}/api/staff/matches/${id}/approve/`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${access}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (response.status === 401) {
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");

        navigate("/staff-login");
        return;
      }

      if (!response.ok) {
        throw new Error(
          data?.error ||
            data?.detail ||
            "Failed to approve match."
        );
      }

      alert(
        data?.message ||
          "Match approved successfully."
      );

      await fetchMatch();
    } catch (error) {
      console.error("Approve error:", error);

      setError(
        error.message ||
          "Failed to approve match."
      );
    } finally {
      setActionLoading(false);
    }
  };

  // ============================================================
  // REJECT MATCH
  // ============================================================

  const rejectMatch = async () => {
    if (actionLoading) {
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to reject this match?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setActionLoading(true);
      setError("");

      const access = localStorage.getItem("access");

      if (!access) {
        navigate("/staff-login");
        return;
      }

      const response = await fetch(
        `${API}/api/staff/matches/${id}/reject/`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${access}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (response.status === 401) {
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");

        navigate("/staff-login");
        return;
      }

      if (!response.ok) {
        throw new Error(
          data?.error ||
            data?.detail ||
            "Failed to reject match."
        );
      }

      alert(
        data?.message ||
          "Match rejected successfully."
      );

      await fetchMatch();
    } catch (error) {
      console.error("Reject error:", error);

      setError(
        error.message ||
          "Failed to reject match."
      );
    } finally {
      setActionLoading(false);
    }
  };

  // ============================================================
  // SCORE HELPER
  // ============================================================

  const getScore = (score) => {
    const value = Number(score);

    if (Number.isNaN(value)) {
      return 0;
    }

    return Math.round(value);
  };

  // ============================================================
  // STATUS STYLE
  // ============================================================

  const getStatusClass = (status) => {
    switch (status) {
      case "Approved":
        return "bg-green-600 text-white";

      case "Rejected":
        return "bg-red-600 text-white";

      default:
        return "bg-yellow-500 text-white";
    }
  };

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">

        <div className="bg-white rounded-xl shadow p-10 text-center">

          <div className="animate-spin h-10 w-10 border-4 border-blue-200 border-t-blue-600 rounded-full mx-auto mb-5" />

          <p className="text-xl font-semibold text-gray-700">
            Loading Match...
          </p>

        </div>

      </div>
    );
  }

  // ============================================================
  // ERROR / MATCH NOT FOUND
  // ============================================================

  if (error && !match) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">

        <div className="bg-white rounded-xl shadow p-8 max-w-lg w-full text-center">

          <h1 className="text-2xl font-bold text-red-600">
            Match Not Found
          </h1>

          <p className="text-gray-600 mt-3">
            {error}
          </p>

          <div className="flex justify-center gap-3 mt-6">

            <button
              type="button"
              onClick={fetchMatch}
              className="bg-blue-600 text-white px-5 py-3 rounded-lg hover:bg-blue-700"
            >
              Try Again
            </button>

            <button
              type="button"
              onClick={() =>
                navigate(
                  companyRoute("/staff/matches")
                )
              }
              className="bg-gray-700 text-white px-5 py-3 rounded-lg hover:bg-gray-800"
            >
              Back to Matches
            </button>

          </div>

        </div>

      </div>
    );
  }

  if (!match) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">

        <div className="bg-white rounded-xl shadow p-8 text-center">

          <h1 className="text-2xl font-bold text-red-600">
            Match not found
          </h1>

          <button
            type="button"
            onClick={() =>
              navigate(
                companyRoute("/staff/matches")
              )
            }
            className="mt-5 bg-blue-600 text-white px-5 py-3 rounded-lg hover:bg-blue-700"
          >
            Back to Matches
          </button>

        </div>

      </div>
    );
  }

  // ============================================================
  // MATCH DATA
  // ============================================================

  const lostItem = match.lost_item || {};
  const foundItem = match.found_item || {};

  const lostImage = getImageUrl(
    lostItem.image
  );

  const foundImage = getImageUrl(
    foundItem.image
  );

  // ============================================================
  // PAGE
  // ============================================================

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">

      <div className="max-w-7xl mx-auto">

        {/* ======================================================
            HEADER
        ====================================================== */}

        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-5 mb-8">

          <div>

            <h1 className="text-3xl md:text-4xl font-black text-gray-900">
              Match Review
            </h1>

            <p className="text-gray-500 mt-2">
              Review the AI-generated match between the
              lost and found items.
            </p>

            {activeCompanySlug && (
              <p className="text-sm text-blue-600 mt-2 font-medium">
                Company: {activeCompanySlug}
              </p>
            )}

          </div>

          <button
            type="button"
            onClick={() =>
              navigate(
                companyRoute("/staff/matches")
              )
            }
            className="bg-gray-700 text-white px-5 py-3 rounded-lg hover:bg-gray-800 transition"
          >
            ← Back to Matches
          </button>

        </div>

        {/* ======================================================
            ERROR MESSAGE
        ====================================================== */}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-5 rounded-xl mb-6">

            <p className="font-semibold">
              {error}
            </p>

          </div>
        )}

        {/* ======================================================
            CONFIDENCE
        ====================================================== */}

        <div className="bg-white rounded-xl shadow p-6 mb-8">

          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-6">

            <div>

              <h2 className="text-2xl font-bold text-gray-900">
                Match Confidence
              </h2>

              <p className="text-gray-500 mt-1">
                AI Generated Match
              </p>

              <p className="text-sm text-gray-400 mt-2">
                Match #{match.id}
              </p>

            </div>

            <div className="text-left md:text-right">

              <div className="text-5xl font-black text-blue-700">
                {getScore(match.confidence_score)}%
              </div>

              <div className="mt-3">

                <span
                  className={`inline-block px-4 py-2 rounded-full text-sm font-bold ${getStatusClass(
                    match.status
                  )}`}
                >
                  {match.status || "Pending"}
                </span>

              </div>

            </div>

          </div>

        </div>

        {/* ======================================================
            LOST / FOUND ITEMS
        ====================================================== */}

        <div className="grid md:grid-cols-2 gap-8">

          {/* ====================================================
              LOST ITEM
          ==================================================== */}

          <div className="bg-white rounded-xl shadow p-6">

            <h2 className="text-2xl font-bold text-red-600 mb-5">
              Lost Item
            </h2>

            {lostImage ? (
              <img
                src={lostImage}
                alt={
                  lostItem.item_name ||
                  "Lost item"
                }
                className="w-full h-72 object-cover rounded-lg mb-5"
                onError={(event) => {
                  event.currentTarget.style.display =
                    "none";
                }}
              />
            ) : (
              <div className="w-full h-72 bg-gray-100 rounded-lg mb-5 flex items-center justify-center text-gray-400">
                No image available
              </div>
            )}

            <div className="space-y-3 text-gray-700">

              <p>
                <strong>Name:</strong>{" "}
                {lostItem.item_name || "N/A"}
              </p>

              <p>
                <strong>Category:</strong>{" "}
                {lostItem.category || "N/A"}
              </p>

              <p>
                <strong>Location:</strong>{" "}
                {lostItem.location || "N/A"}
              </p>

              <div>

                <p className="font-bold mb-2">
                  Description:
                </p>

                <div className="bg-gray-100 p-4 rounded-lg min-h-[80px]">
                  {lostItem.description ||
                    "No description provided."}
                </div>

              </div>

            </div>

          </div>

          {/* ====================================================
              FOUND ITEM
          ==================================================== */}

          <div className="bg-white rounded-xl shadow p-6">

            <h2 className="text-2xl font-bold text-green-600 mb-5">
              Found Item
            </h2>

            {foundImage ? (
              <img
                src={foundImage}
                alt={
                  foundItem.item_name ||
                  "Found item"
                }
                className="w-full h-72 object-cover rounded-lg mb-5"
                onError={(event) => {
                  event.currentTarget.style.display =
                    "none";
                }}
              />
            ) : (
              <div className="w-full h-72 bg-gray-100 rounded-lg mb-5 flex items-center justify-center text-gray-400">
                No image available
              </div>
            )}

            <div className="space-y-3 text-gray-700">

              <p>
                <strong>Name:</strong>{" "}
                {foundItem.item_name || "N/A"}
              </p>

              <p>
                <strong>Category:</strong>{" "}
                {foundItem.category || "N/A"}
              </p>

              <p>
                <strong>Location:</strong>{" "}
                {foundItem.location_found || "N/A"}
              </p>

              <div>

                <p className="font-bold mb-2">
                  Description:
                </p>

                <div className="bg-gray-100 p-4 rounded-lg min-h-[80px]">
                  {foundItem.description ||
                    "No description provided."}
                </div>

              </div>

            </div>

          </div>

        </div>

        {/* ======================================================
            AI ANALYSIS
        ====================================================== */}

        <div className="bg-white rounded-xl shadow p-6 mt-8">

          <h2 className="text-2xl font-bold mb-5">
            AI Analysis
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">

            {/* NAME */}

            <div className="bg-blue-50 p-5 rounded-lg">

              <h3 className="font-bold text-gray-800">
                Name Score
              </h3>

              <p className="text-3xl font-black text-blue-700 mt-2">
                {getScore(match.name_score)}%
              </p>

            </div>

            {/* DESCRIPTION */}

            <div className="bg-green-50 p-5 rounded-lg">

              <h3 className="font-bold text-gray-800">
                Description Score
              </h3>

              <p className="text-3xl font-black text-green-700 mt-2">
                {getScore(
                  match.description_score
                )}
                %
              </p>

            </div>

            {/* LOCATION */}

            <div className="bg-yellow-50 p-5 rounded-lg">

              <h3 className="font-bold text-gray-800">
                Location Score
              </h3>

              <p className="text-3xl font-black text-yellow-700 mt-2">
                {getScore(
                  match.location_score
                )}
                %
              </p>

            </div>

            {/* IMAGE */}

            <div className="bg-purple-50 p-5 rounded-lg">

              <h3 className="font-bold text-gray-800">
                Image Score
              </h3>

              <p className="text-3xl font-black text-purple-700 mt-2">
                {getScore(match.image_score)}%
              </p>

            </div>

          </div>

        </div>

        {/* ======================================================
            APPROVAL INFORMATION
        ====================================================== */}

        <div className="bg-white rounded-xl shadow p-6 mt-8">

          <h2 className="text-2xl font-bold mb-5">
            Match Information
          </h2>

          <div className="grid md:grid-cols-2 gap-4">

            <div className="bg-gray-50 p-4 rounded-lg">

              <p className="text-sm text-gray-500">
                Approved By
              </p>

              <p className="font-semibold text-gray-800 mt-1">
                {match.approved_by ||
                  "Not approved"}
              </p>

            </div>

            <div className="bg-gray-50 p-4 rounded-lg">

              <p className="text-sm text-gray-500">
                Approved On
              </p>

              <p className="font-semibold text-gray-800 mt-1">
                {match.approved_at
                  ? new Date(
                      match.approved_at
                    ).toLocaleString()
                  : "Not approved"}
              </p>

            </div>

          </div>

        </div>

        {/* ======================================================
            ACTION BUTTONS
        ====================================================== */}

        {match.status === "Pending" && (
          <div className="flex flex-col sm:flex-row gap-4 mt-8">

            <button
              type="button"
              onClick={approveMatch}
              disabled={actionLoading}
              className="bg-green-600 text-white px-8 py-4 rounded-lg font-bold hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {actionLoading
                ? "Processing..."
                : "✓ Approve Match"}
            </button>

            <button
              type="button"
              onClick={rejectMatch}
              disabled={actionLoading}
              className="bg-red-600 text-white px-8 py-4 rounded-lg font-bold hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {actionLoading
                ? "Processing..."
                : "✕ Reject Match"}
            </button>

          </div>
        )}

        {/* ======================================================
            ALREADY PROCESSED
        ====================================================== */}

        {match.status === "Approved" && (
          <div className="mt-8 bg-green-50 border border-green-200 text-green-700 p-5 rounded-xl">

            <p className="font-bold">
              ✓ This match has been approved.
            </p>

            <p className="text-sm mt-1">
              No further action is required.
            </p>

          </div>
        )}

        {match.status === "Rejected" && (
          <div className="mt-8 bg-red-50 border border-red-200 text-red-700 p-5 rounded-xl">

            <p className="font-bold">
              ✕ This match has been rejected.
            </p>

            <p className="text-sm mt-1">
              No further action is required.
            </p>

          </div>
        )}

      </div>

    </div>
  );
}

export default StaffMatchDetail;

