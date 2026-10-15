import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Bell,
  CheckCircle,
  Clock,
  ArrowLeft,
  Loader2,
  AlertTriangle,
} from "lucide-react";

const API = "http://127.0.0.1:8000";

function StaffNotifications() {
  const navigate = useNavigate();
  const { companySlug } = useParams();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ============================================================
  // GET STORED COMPANY
  // ============================================================

  const getStoredCompany = () => {
    try {
      const stored = localStorage.getItem("company");

      if (!stored) {
        return {};
      }

      return JSON.parse(stored);
    } catch (err) {
      console.error("Invalid company data:", err);
      return {};
    }
  };

  const storedCompany = getStoredCompany();

  // ============================================================
  // GET STORED USER
  // ============================================================

  const getStoredUser = () => {
    try {
      const stored = localStorage.getItem("user");

      if (!stored) {
        return {};
      }

      return JSON.parse(stored);
    } catch (err) {
      console.error("Invalid user data:", err);
      return {};
    }
  };

  const storedUser = getStoredUser();

  // ============================================================
  // ACTIVE COMPANY
  // ============================================================

  const activeCompanySlug =
    companySlug ||
    localStorage.getItem("companySlug") ||
    localStorage.getItem("company_slug") ||
    storedCompany?.slug ||
    storedCompany?.company_slug ||
    storedUser?.company_slug ||
    storedUser?.companySlug ||
    "";

  // ============================================================
  // COMPANY ROUTE
  // ============================================================

  const companyRoute = useCallback(
    (path = "") => {
      const cleanPath = path.startsWith("/")
        ? path
        : `/${path}`;

      if (!activeCompanySlug) {
        return cleanPath;
      }

      return `/company/${encodeURIComponent(
        activeCompanySlug
      )}${cleanPath}`;
    },
    [activeCompanySlug]
  );

  // ============================================================
  // ACCESS TOKEN
  // ============================================================

  const getAccessToken = () =>
    localStorage.getItem("access") ||
    localStorage.getItem("access_token");

  // ============================================================
  // UNAUTHORIZED
  // ============================================================

  const handleUnauthorized = useCallback(() => {
    localStorage.removeItem("access");
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");

    navigate(companyRoute("/staff-login"), {
      replace: true,
    });
  }, [navigate, companyRoute]);

  // ============================================================
  // LOAD NOTIFICATIONS
  // ============================================================

  const loadNotifications = useCallback(async () => {
    const access = getAccessToken();

    if (!access) {
      handleUnauthorized();
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API}/api/staff/notifications/`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${access}`,
            "Content-Type": "application/json",
          },
        }
      );

      const contentType =
        response.headers.get("content-type") || "";

      if (
        response.status === 401 ||
        response.status === 403
      ) {
        handleUnauthorized();
        return;
      }

      if (!contentType.includes("application/json")) {
        throw new Error(
          "Server returned an unexpected response."
        );
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            data?.detail ||
            "Unable to load notifications."
        );
      }

      // Support:
      // []
      // { results: [] }
      // { notifications: [] }

      if (Array.isArray(data)) {
        setNotifications(data);
      } else if (Array.isArray(data?.results)) {
        setNotifications(data.results);
      } else if (Array.isArray(data?.notifications)) {
        setNotifications(data.notifications);
      } else {
        setNotifications([]);
      }
    } catch (err) {
      console.error(
        "LOAD NOTIFICATIONS ERROR:",
        err
      );

      setError(
        err.message ||
          "Unable to load notifications."
      );

      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [handleUnauthorized]);

  // ============================================================
  // INITIAL LOAD
  // ============================================================

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // ============================================================
  // MARK ONE AS READ
  // ============================================================

  const markAsRead = async (id) => {
    const access = getAccessToken();

    if (!access) {
      handleUnauthorized();
      return;
    }

    try {
      const response = await fetch(
        `${API}/api/staff/notifications/${id}/read/`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${access}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (
        response.status === 401 ||
        response.status === 403
      ) {
        handleUnauthorized();
        return;
      }

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));

        throw new Error(
          data?.error ||
            data?.detail ||
            "Unable to mark notification as read."
        );
      }

      // Update immediately instead of waiting for another request.
      setNotifications((previous) =>
        previous.map((notification) =>
          notification.id === id
            ? {
                ...notification,
                is_read: true,
              }
            : notification
        )
      );
    } catch (err) {
      console.error(
        "MARK NOTIFICATION READ ERROR:",
        err
      );

      setError(
        err.message ||
          "Unable to mark notification as read."
      );
    }
  };

  // ============================================================
  // MARK ALL AS READ
  // ============================================================

  const markAllAsRead = async () => {
    const access = getAccessToken();

    if (!access) {
      handleUnauthorized();
      return;
    }

    try {
      setError("");

      const response = await fetch(
        `${API}/api/staff/notifications/read-all/`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${access}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (
        response.status === 401 ||
        response.status === 403
      ) {
        handleUnauthorized();
        return;
      }

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));

        throw new Error(
          data?.error ||
            data?.detail ||
            "Unable to mark notifications as read."
        );
      }

      setNotifications((previous) =>
        previous.map((notification) => ({
          ...notification,
          is_read: true,
        }))
      );
    } catch (err) {
      console.error(
        "MARK ALL READ ERROR:",
        err
      );

      setError(
        err.message ||
          "Unable to mark all notifications as read."
      );
    }
  };

  // ============================================================
  // DATE FORMAT
  // ============================================================

  const formatDate = (date) => {
    if (!date) {
      return "Not available";
    }

    try {
      return new Date(date).toLocaleString();
    } catch {
      return date;
    }
  };

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
        <div className="text-center">
          <Loader2
            size={45}
            className="mx-auto text-blue-600 animate-spin"
          />

          <h2 className="text-xl font-bold text-gray-800 mt-4">
            Loading Notifications...
          </h2>

          <p className="text-gray-500 mt-2">
            Please wait.
          </p>
        </div>
      </div>
    );
  }

  // ============================================================
  // PAGE
  // ============================================================

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">

      <div className="max-w-6xl mx-auto">

        {/* ====================================================
            HEADER
        ==================================================== */}

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5 mb-8">

          <div>

            <button
              type="button"
              onClick={() =>
                navigate(
                  companyRoute("/staff-dashboard")
                )
              }
              className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-semibold mb-5"
            >
              <ArrowLeft size={19} />
              Back to Dashboard
            </button>

            <div className="flex items-center gap-3">

              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <Bell
                  size={27}
                  className="text-blue-600"
                />
              </div>

              <div>
                <h1 className="text-3xl md:text-4xl font-black text-gray-800">
                  Staff Notifications
                </h1>

                <p className="text-gray-500 mt-1">
                  Review system events requiring your
                  attention.
                </p>
              </div>

            </div>

            {activeCompanySlug && (
              <p className="text-sm text-blue-600 font-medium mt-3">
                Company: {activeCompanySlug}
              </p>
            )}

          </div>

          <button
            type="button"
            onClick={markAllAsRead}
            disabled={
              notifications.length === 0 ||
              notifications.every(
                (notification) =>
                  notification.is_read
              )
            }
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-5 py-3 rounded-xl font-bold transition"
          >
            Mark All as Read
          </button>

        </div>

        {/* ====================================================
            COMPANY WARNING
        ==================================================== */}

        {!activeCompanySlug && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-xl p-5 flex gap-3">

            <AlertTriangle
              className="shrink-0"
              size={22}
            />

            <div>
              <h2 className="font-bold">
                Company could not be determined
              </h2>

              <p className="text-sm mt-1">
                Your notifications are being loaded using
                your staff account. Check that your company
                information is saved in localStorage.
              </p>
            </div>

          </div>
        )}

        {/* ====================================================
            ERROR
        ==================================================== */}

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-xl p-5">

            <div className="flex gap-3">

              <AlertTriangle
                size={22}
                className="shrink-0"
              />

              <div>
                <h2 className="font-bold">
                  Unable to complete request
                </h2>

                <p className="mt-1">
                  {error}
                </p>
              </div>

            </div>

            <button
              type="button"
              onClick={loadNotifications}
              className="mt-4 bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-lg font-semibold"
            >
              Try Again
            </button>

          </div>
        )}

        {/* ====================================================
            NOTIFICATIONS
        ==================================================== */}

        {notifications.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">

            <Bell
              size={65}
              className="mx-auto text-gray-300 mb-5"
            />

            <h2 className="text-2xl font-bold text-gray-800">
              No Notifications
            </h2>

            <p className="text-gray-500 mt-2">
              Staff notifications will appear here.
            </p>

          </div>
        ) : (
          <div className="space-y-4">

            {notifications.map(
              (notification) => (
                <div
                  key={notification.id}
                  onClick={() => {
                    if (!notification.is_read) {
                      markAsRead(
                        notification.id
                      );
                    }
                  }}
                  className={`bg-white rounded-2xl shadow-sm border p-5 md:p-6 cursor-pointer transition hover:shadow-lg ${
                    notification.is_read
                      ? "border-gray-200"
                      : "border-blue-500 bg-blue-50"
                  }`}
                >

                  <div className="flex justify-between gap-5">

                    <div className="flex gap-4 min-w-0">

                      <div className="shrink-0">

                        {notification.is_read ? (
                          <CheckCircle
                            className="text-green-500"
                            size={25}
                          />
                        ) : (
                          <Bell
                            className="text-blue-600"
                            size={25}
                          />
                        )}

                      </div>

                      <div className="min-w-0">

                        <h2 className="font-bold text-lg text-gray-800">
                          {notification.title ||
                            "Notification"}
                        </h2>

                        <p className="text-gray-600 mt-2">
                          {notification.message ||
                            "No message available."}
                        </p>

                        {notification.notification_type && (
                          <span className="inline-block mt-3 bg-blue-100 text-blue-700 text-xs px-3 py-1 rounded-full font-semibold">
                            {
                              notification.notification_type
                            }
                          </span>
                        )}

                      </div>

                    </div>

                    {!notification.is_read && (
                      <span className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold h-fit shrink-0 animate-pulse">
                        New
                      </span>
                    )}

                  </div>

                  <div className="flex items-center gap-2 mt-5 pt-4 border-t text-sm text-gray-500">

                    <Clock size={16} />

                    <span>
                      {formatDate(
                        notification.created_at
                      )}
                    </span>

                  </div>

                </div>
              )
            )}

          </div>
        )}

      </div>
    </div>
  );
}

export default StaffNotifications;
