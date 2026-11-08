import { createElement, useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { API } from "../../config";
import { PLACEHOLDER_IMAGE, resolveMediaUrl } from "../../theme";
import PasswordInput from "../../component/PasswordInput";

import {
  Activity,
  AlertCircle,
  ArrowDownRight,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Bell,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Eye,
  FileText,
  Globe,
  Image as ImageIcon,
  LayoutDashboard,
  Loader2,
  LogOut,
  Mail,
  MapPin,
  Menu,
  Monitor,
  Pencil,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  Trash2,
  Upload,
  Users,
  UserPlus,
  X,
} from "lucide-react";

async function readResponse(response) {
  const text = await response.text();

  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch {
    return { detail: text };
  }
}

function getStoredObject(key) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : {};
  } catch {
    return {};
  }
}

export default function CompanyDashboard() {
  const navigate = useNavigate();
  const { companySlug } = useParams();

  const storedCompany = getStoredObject("company");
  const storedUser =
    getStoredObject("company_user").id
      ? getStoredObject("company_user")
      : getStoredObject("user");

  const activeCompanySlug =
    companySlug ||
    localStorage.getItem("companySlug") ||
    localStorage.getItem("company_slug") ||
    storedCompany.slug ||
    storedUser.company_slug ||
    storedUser.companySlug ||
    storedUser.organization_slug ||
    storedUser.organizationSlug ||
    "";

  const companyRoute = useCallback(
    (path = "") => {
      const cleanPath = path.startsWith("/") ? path : `/${path}`;

      if (!activeCompanySlug) {
        return cleanPath;
      }

      return `/company/${encodeURIComponent(activeCompanySlug)}${cleanPath}`;
    },
    [activeCompanySlug]
  );

  const [activeTab, setActiveTab] = useState("overview");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [userFilter, setUserFilter] = useState("all");

  const [selectedStaff, setSelectedStaff] = useState(null);
  const [creatingStaff, setCreatingStaff] = useState(false);
  const [deletingStaffId, setDeletingStaffId] = useState(null);
  const [showStaffForm, setShowStaffForm] = useState(false);
  const [staffForm, setStaffForm] = useState({
    username: "",
    email: "",
    first_name: "",
    last_name: "",
    password: "",
    confirm_password: "",
  });

  const [companyForm, setCompanyForm] = useState({
    name: "",
    description: "",
    email: "",
    phone: "",
    location: "",
    website: "",
  });

  const [savingCompany, setSavingCompany] = useState(false);

  // Reports browser: every stat card and report row is clickable.
  const [selectedReport, setSelectedReport] = useState(null);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [reportFilter, setReportFilter] = useState("all");
  const [reportSearch, setReportSearch] = useState("");

  const openReports = (filter = "all") => {
    setReportFilter(filter);
    setReportSearch("");
    setActiveTab("reports");
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openUsers = (filter = "all") => {
    setUserFilter(filter);
    setActiveTab("users");
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ------------------------------------------------------------
  // AUTHENTICATION
  // ------------------------------------------------------------

  const getAccessToken = useCallback(
    () =>
      localStorage.getItem("access_token") ||
      localStorage.getItem("access"),
    []
  );

  const getRefreshToken = useCallback(
    () =>
      localStorage.getItem("refresh_token") ||
      localStorage.getItem("refresh"),
    []
  );

  const clearAuth = useCallback(() => {
    [
      "access",
      "access_token",
      "refresh",
      "refresh_token",
      "company_user",
      "company",
      "user",
    ].forEach((key) => localStorage.removeItem(key));
  }, []);

  const refreshAccessToken = useCallback(async () => {
    const refresh = getRefreshToken();

    if (!refresh) return null;

    try {
      const response = await fetch(`${API}/token/refresh/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refresh }),
      });

      if (!response.ok) return null;

      const result = await readResponse(response);

      if (!result.access) return null;

      localStorage.setItem("access_token", result.access);
      localStorage.setItem("access", result.access);

      if (result.refresh) {
        localStorage.setItem("refresh_token", result.refresh);
        localStorage.setItem("refresh", result.refresh);
      }

      return result.access;
    } catch (err) {
      console.error("TOKEN REFRESH ERROR:", err);
      return null;
    }
  }, [getRefreshToken]);

  const authenticatedFetch = useCallback(
    async (url, options = {}, retry = true) => {
      let token = getAccessToken();

      if (!token) {
        throw new Error("NO_TOKEN");
      }

      const makeRequest = (accessToken) =>
        fetch(url, {
          ...options,
          headers: {
            ...(options.headers || {}),
            Authorization: `Bearer ${accessToken}`,
          },
        });

      let response = await makeRequest(token);

      if (response.status === 401 && retry) {
        const newToken = await refreshAccessToken();

        if (!newToken) {
          throw new Error("AUTH_EXPIRED");
        }

        response = await makeRequest(newToken);
      }

      return response;
    },
    [getAccessToken, refreshAccessToken]
  );

  const redirectToLogin = useCallback(() => {
    clearAuth();
    navigate("/company/login", { replace: true });
  }, [clearAuth, navigate]);

  // ------------------------------------------------------------
  // LOAD DASHBOARD
  // ------------------------------------------------------------

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await authenticatedFetch(
        `${API}/company/dashboard/`
      );

      const result = await readResponse(response);

      if (response.status === 401) {
        redirectToLogin();
        return;
      }

      if (!response.ok) {
        throw new Error(
          result.detail ||
            result.error ||
            "Unable to load the company dashboard."
        );
      }

      setData(result);

      const company = result.company || {};

      setCompanyForm({
        name: company.name || "",
        description: company.description || "",
        email: company.email || "",
        phone: company.phone || "",
        location: company.location || "",
        website: company.website || "",
      });

      // Support several possible response structures.
      // The backend determines which records are returned.
      const returnedUsers =
        result.users ||
        result.company_users ||
        result.customers ||
        result.staff_members ||
        [];

      setUsers(Array.isArray(returnedUsers) ? returnedUsers : []);

      if (result.company) {
        localStorage.setItem(
          "company",
          JSON.stringify(result.company)
        );

        if (result.company.slug) {
          localStorage.setItem(
            "companySlug",
            result.company.slug
          );

          localStorage.setItem(
            "company_slug",
            result.company.slug
          );
        }
      }
    } catch (err) {
      console.error("DASHBOARD ERROR:", err);

      if (
        err.message === "NO_TOKEN" ||
        err.message === "AUTH_EXPIRED"
      ) {
        redirectToLogin();
        return;
      }

      setError(
        err.message ||
          "Unable to connect to the server. Check that Django is running."
      );
    } finally {
      setLoading(false);
    }
  }, [authenticatedFetch, redirectToLogin]);

  // ------------------------------------------------------------
  // LOAD COMPANY USERS
  // ------------------------------------------------------------

  const loadUsers = useCallback(async () => {
    setUsersLoading(true);

    try {
      /*
       * This optional endpoint should return the users belonging
       * to the logged-in company:
       *
       * GET /api/company/users/
       *
       * If your backend has not implemented it yet, the dashboard
       * will continue using users returned by the dashboard API.
       */
      const response = await authenticatedFetch(
        `${API}/company/users/`
      );

      const result = await readResponse(response);

      if (response.status === 401) {
        redirectToLogin();
        return;
      }

      if (!response.ok) {
        console.warn(
          "Company users endpoint is not available:",
          result
        );
        return;
      }

      const returnedUsers = Array.isArray(result)
        ? result
        : result.users ||
          result.company_users ||
          result.results ||
          [];

      if (Array.isArray(returnedUsers)) {
        setUsers(returnedUsers);
      }
    } catch (err) {
      // This is optional until the endpoint is implemented.
      console.warn("COMPANY USERS ERROR:", err);
    } finally {
      setUsersLoading(false);
    }
  }, [authenticatedFetch, redirectToLogin]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  // ------------------------------------------------------------
  // STAFF MANAGEMENT
  // ------------------------------------------------------------

  const handleStaffChange = (event) => {
    const { name, value } = event.target;

    setStaffForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const createStaff = async (event) => {
    event.preventDefault();

    setError("");
    setMessage("");

    if (
      !staffForm.username.trim() ||
      !staffForm.email.trim() ||
      !staffForm.password
    ) {
      setError("Username, email and password are required.");
      return;
    }

    if (staffForm.password !== staffForm.confirm_password) {
      setError("Passwords do not match.");
      return;
    }

    if (staffForm.password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    setCreatingStaff(true);

    try {
      const response = await authenticatedFetch(
        `${API}/company/staff/create/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: staffForm.username.trim(),
            email: staffForm.email.trim(),
            first_name: staffForm.first_name.trim(),
            last_name: staffForm.last_name.trim(),
            password: staffForm.password,
          }),
        }
      );

      const result = await readResponse(response);

      if (response.status === 401) {
        redirectToLogin();
        return;
      }

      if (!response.ok) {
        const validationErrors = Object.entries(result)
          .map(([field, errors]) => {
            const value = Array.isArray(errors)
              ? errors.join(", ")
              : String(errors);

            return `${field}: ${value}`;
          })
          .join("\n");

        throw new Error(
          result.detail ||
            result.error ||
            validationErrors ||
            "Unable to create staff account."
        );
      }

      setMessage(
        result.message ||
          "Staff account created. A verification email has been sent. The staff member must verify their email before logging in."
      );

      setStaffForm({
        username: "",
        email: "",
        first_name: "",
        last_name: "",
        password: "",
        confirm_password: "",
      });

      setShowStaffForm(false);

      await loadDashboard();
    } catch (err) {
      setError(err.message || "Unable to create staff account.");
    } finally {
      setCreatingStaff(false);
    }
  };

  const deleteStaff = async (staffId) => {
    const confirmed = window.confirm(
      "Are you sure you want to remove this staff account?"
    );

    if (!confirmed) return;

    setError("");
    setMessage("");
    setDeletingStaffId(staffId);

    try {
      const response = await authenticatedFetch(
        `${API}/company/staff/${staffId}/`,
        { method: "DELETE" }
      );

      const result = await readResponse(response);

      if (response.status === 401) {
        redirectToLogin();
        return;
      }

      if (!response.ok) {
        const detail = result.detail || result.error;
        if (response.status === 404) {
          throw new Error(
            "The staff-delete API route was not found (404). Add a DELETE handler for /api/company/staff/<id>/ in the Django backend, then redeploy the backend."
          );
        }
        throw new Error(detail || "Unable to remove staff account.");
      }

      setMessage(
        result.message || "Staff account removed successfully."
      );

      setSelectedStaff(null);

      await loadDashboard();
    } catch (err) {
      setError(err.message || "Unable to remove staff account.");
    } finally {
      setDeletingStaffId(null);
    }
  };

  // ------------------------------------------------------------
  // SAVE COMPANY INFORMATION
  // ------------------------------------------------------------

  const handleCompanyChange = (event) => {
    const { name, value } = event.target;

    setCompanyForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const saveCompanyInformation = async (event) => {
    event.preventDefault();

    setError("");
    setMessage("");
    setSavingCompany(true);

    try {
      /*
       * This endpoint must exist in the backend:
       * PATCH /api/company/profile/
       *
       * It should update only the logged-in company's details.
       */
      const response = await authenticatedFetch(
        `${API}/company/profile/`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(companyForm),
        }
      );

      const result = await readResponse(response);

      if (response.status === 401) {
        redirectToLogin();
        return;
      }

      if (!response.ok) {
        throw new Error(
          result.detail ||
            result.error ||
            "Unable to save company information."
        );
      }

      setMessage(
        result.message || "Company information saved successfully."
      );

      await loadDashboard();
    } catch (err) {
      setError(
        err.message ||
          "Unable to save company information."
      );
    } finally {
      setSavingCompany(false);
    }
  };

  // ------------------------------------------------------------
  // NAVIGATION
  // ------------------------------------------------------------

  const openWebsitePreview = () => {
    if (!activeCompanySlug) {
      setError(
        "Your company slug is missing. Reload your company dashboard."
      );
      return;
    }

    navigate(companyRoute("/website-preview"));
  };

  const openPublicWebsite = () => {
    if (!activeCompanySlug) {
      setError("Your company slug is missing.");
      return;
    }

    // Use your existing public company page.
    navigate(`/company/${encodeURIComponent(activeCompanySlug)}`);
  };

  const logout = () => {
    clearAuth();
    navigate("/company/login", { replace: true });
  };

  // ------------------------------------------------------------
  // DERIVED DATA
  // ------------------------------------------------------------

  const company = data?.company || {};
  const stats = data?.stats || {};
  const user = data?.user || storedUser || {};

  const staffMembers = Array.isArray(data?.staff_members)
    ? data.staff_members
    : users.filter((member) =>
        ["staff"].includes(
          String(member.role || "").toLowerCase()
        )
      );

  const reports = Array.isArray(data?.reports)
    ? data.reports
    : Array.isArray(data?.recent_reports)
      ? data.recent_reports
      : [];

  const matches = Array.isArray(data?.matches) ? data.matches : [];

  const filteredReports = reports.filter((report) => {
    const status = String(report.status || "").toLowerCase();
    const type = String(report.type || "").toLowerCase();

    const matchesFilter =
      reportFilter === "all" ||
      (reportFilter === "lost" && type === "lost") ||
      (reportFilter === "found" && type === "found") ||
      (reportFilter === "pending" && status === "pending") ||
      (reportFilter === "recovered" && status === "recovered");

    const search = reportSearch.trim().toLowerCase();

    const matchesSearch =
      !search ||
      [
        report.item_name,
        report.category,
        report.description,
        report.location,
        report.status,
        report.reporter?.full_name,
        report.reporter?.email,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(search));

    return matchesFilter && matchesSearch;
  });

  const filteredMatches = matches.filter((match) => {
    const search = reportSearch.trim().toLowerCase();

    return (
      !search ||
      [
        match.lost_item?.item_name,
        match.found_item?.item_name,
        match.status,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(search))
    );
  });

  const findReport = (type, id) =>
    reports.find(
      (report) =>
        String(report.id) === String(id) &&
        String(report.type || "").toLowerCase() === type
    );

  const filteredUsers = useMemo(() => {
    return users.filter((member) => {
      const search = userSearch.toLowerCase();

      const matchesSearch = [
        member.username,
        member.first_name,
        member.last_name,
        member.email,
        member.role,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value).toLowerCase().includes(search)
        );

      const role = String(member.role || "").toLowerCase();

      const matchesFilter =
        userFilter === "all" ||
        (userFilter === "staff" && role === "staff") ||
        (userFilter === "customers" &&
          ["user", "customer"].includes(role)) ||
        (userFilter === "admins" &&
          ["admin", "owner"].includes(role));

      return matchesSearch && matchesFilter;
    });
  }, [users, userSearch, userFilter]);

  const companyName = company.name || "Your Company";
  const companyInitial = companyName.charAt(0).toUpperCase();

  // ------------------------------------------------------------
  // LOADING SCREEN
  // ------------------------------------------------------------

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 px-6">
        <div className="rounded-3xl bg-white p-10 text-center shadow-xl">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-blue-600" />
          <p className="mt-4 font-bold text-slate-800">
            Loading your company dashboard...
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Preparing your management workspace.
          </p>
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------
  // ERROR SCREEN
  // ------------------------------------------------------------

  if (error && !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 px-6">
        <div className="w-full max-w-lg rounded-3xl bg-white p-8 text-center shadow-xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 text-red-600">
            <AlertCircle size={30} />
          </div>

          <h2 className="mt-5 text-2xl font-black text-slate-900">
            Dashboard unavailable
          </h2>

          <p className="mt-3 whitespace-pre-line text-slate-600">
            {error}
          </p>

          <button
            onClick={() => navigate("/company/login")}
            className="mt-6 w-full rounded-xl bg-blue-600 px-5 py-3 font-bold text-white hover:bg-blue-700"
          >
            Return to Company Login
          </button>
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------
  // DASHBOARD
  // ------------------------------------------------------------

  const navItems = [
    {
      id: "overview",
      label: "Overview",
      icon: LayoutDashboard,
    },
    {
      id: "users",
      label: "Users & Staff",
      icon: Users,
    },
    {
      id: "company",
      label: "Company Profile",
      icon: Settings,
    },
    {
      id: "reports",
      label: "Recent Reports",
      icon: FileText,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      {/* TOP BAR */}

      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            {company.logo || company.logo_url ? (
              <img
                src={company.logo_url || company.logo}
                alt={companyName}
                className="h-12 w-12 rounded-2xl border border-slate-200 object-contain bg-white p-0.5"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-xl font-black text-white">
                {companyInitial}
              </div>
            )}

            <div className="min-w-0">
              <h1 className="truncate text-lg font-black sm:text-xl">
                {companyName}
              </h1>
              <p className="text-xs text-slate-500 sm:text-sm">
                TrustFound Company Workspace
              </p>
            </div>
          </div>

          <div className="hidden items-center gap-4 sm:flex">
            <div className="text-right">
              <p className="font-bold">
                {user.username || user.email || "Company Admin"}
              </p>
              <p className="text-xs capitalize text-slate-500">
                {user.role || "Company administrator"}
              </p>
            </div>

            <button
              onClick={openWebsitePreview}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 font-bold hover:bg-slate-50"
            >
              <Eye size={17} />
              Preview
            </button>

            <button
              onClick={logout}
              className="inline-flex items-center gap-2 rounded-xl bg-red-50 px-4 py-2.5 font-bold text-red-600 hover:bg-red-100"
            >
              <LogOut size={17} />
              Logout
            </button>
          </div>

          <button
            onClick={() => setMobileMenuOpen((value) => !value)}
            className="rounded-xl border border-slate-200 p-2 sm:hidden"
            aria-label="Toggle navigation"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="border-t border-slate-200 bg-white p-4 sm:hidden">
            <div className="mb-4">
              <p className="font-bold">
                {user.username || user.email || "Company Admin"}
              </p>
              <p className="text-sm capitalize text-slate-500">
                {user.role || "Company administrator"}
              </p>
            </div>

            <button
              onClick={openWebsitePreview}
              className="mb-2 w-full rounded-xl border border-slate-200 p-3 text-left font-bold"
            >
              Preview Website
            </button>

            <button
              onClick={logout}
              className="w-full rounded-xl bg-red-50 p-3 text-left font-bold text-red-600"
            >
              Logout
            </button>
          </div>
        )}
      </header>

      <div className="mx-auto grid max-w-[1600px] grid-cols-1 lg:grid-cols-[250px_minmax(0,1fr)]">
        {/* SIDEBAR */}

        <aside className="sticky top-[81px] hidden h-[calc(100vh-81px)] overflow-y-auto bg-graphite p-5 text-white lg:block">
          <div className="mb-5 rounded-2xl bg-white/[0.07] p-4">
            <div className="flex items-center gap-2 text-sm font-bold text-orange-300">
              <ShieldCheck size={18} />
              Company Workspace
            </div>
            <p className="mt-2 break-all text-xs text-white/60">
              {activeCompanySlug || "Company slug not available"}
            </p>
          </div>

          <p className="mb-3 px-3 text-xs font-black uppercase tracking-wider text-white/50">
            Management
          </p>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left font-semibold transition ${
                    active
                      ? "bg-orange-600 text-white shadow-lg shadow-black/20"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Icon size={19} />
                  <span>{item.label}</span>
                  {active && (
                    <ChevronRight className="ml-auto" size={17} />
                  )}
                </button>
              );
            })}
          </nav>

          <div className="mt-8 border-t border-white/10 pt-5">
            <p className="mb-3 px-3 text-xs font-black uppercase tracking-wider text-white/50">
              Website
            </p>

            <button
              onClick={() => navigate(companyRoute("/website-settings"))}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left font-semibold text-white/80 hover:bg-white/10 hover:text-white"
            >
              <Monitor size={19} />
              Website Settings
              <ArrowRight className="ml-auto" size={16} />
            </button>

            <button
              onClick={openPublicWebsite}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left font-semibold text-white/80 hover:bg-white/10 hover:text-white"
            >
              <Globe size={19} />
              Public Website
              <ArrowRight className="ml-auto" size={16} />
            </button>
          </div>
        </aside>

        {/* MAIN CONTENT */}

        <main className="min-w-0 p-4 sm:p-6 lg:p-8">
          {/* MOBILE NAVIGATION */}

          
{/* MOBILE NAVIGATION */}

<div className="mb-6 flex gap-2 overflow-x-auto pb-2 lg:hidden">
  {navItems.map((item) => {
    const Icon = item.icon;

    return (
      <button
        key={item.id}
        onClick={() => setActiveTab(item.id)}
        className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold ${
          activeTab === item.id
            ? "bg-blue-600 text-white"
            : "border border-slate-200 bg-white text-slate-600"
        }`}
      >
        <Icon size={16} />
        {item.label}
      </button>
    );
  })}

  {/* PUBLIC WEBSITE BUTTON */}
  <button
    type="button"
    onClick={openPublicWebsite}
    className="flex shrink-0 items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-bold text-blue-700 hover:bg-blue-100"
  >
    <Globe size={16} />
    Public Website
    <ArrowRight size={15} />
  </button>
</div>


          {/* ALERTS */}

          {message && (
            <div className="mb-6 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
              <CheckCircle2 className="mt-0.5 shrink-0" size={20} />
              <p className="whitespace-pre-line font-semibold">
                {message}
              </p>
              <button
                onClick={() => setMessage("")}
                className="ml-auto"
                aria-label="Dismiss message"
              >
                <X size={18} />
              </button>
            </div>
          )}

          {error && data && (
            <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
              <AlertCircle className="mt-0.5 shrink-0" size={20} />
              <p className="whitespace-pre-line">{error}</p>
              <button
                onClick={() => setError("")}
                className="ml-auto"
                aria-label="Dismiss error"
              >
                <X size={18} />
              </button>
            </div>
          )}

          {/* ====================================================
              OVERVIEW
          ==================================================== */}

          {activeTab === "overview" && (
            <>
              <div className="mb-8 flex flex-col justify-between gap-5 xl:flex-row xl:items-center">
                <div>
                  <p className="mb-2 text-sm font-bold text-blue-600">
                    COMPANY OVERVIEW
                  </p>

                  <h2 className="text-3xl font-black tracking-tight sm:text-4xl">
                    Welcome back, {user.first_name || user.username || "Admin"}
                  </h2>

                  <p className="mt-3 max-w-2xl text-slate-500">
                    Manage your Lost & Found operations, users, staff,
                    and the public website for {companyName}.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => navigate(companyRoute("/website-settings"))}
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-bold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700"
                  >
                    <Monitor size={18} />
                    Design Website
                  </button>

                  <button
                    onClick={loadDashboard}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 font-bold hover:bg-slate-50"
                  >
                    <RefreshCw size={17} />
                    Refresh
                  </button>
                </div>
              </div>

              {/* WEBSITE STATUS */}

              <section className="mb-8 overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 p-6 text-white shadow-xl sm:p-8">
                <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
                  <div className="max-w-2xl">
                    <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-sm font-semibold">
                      <Globe size={16} />
                      Your company website
                    </div>

                    <h3 className="text-2xl font-black sm:text-3xl">
                      Build your own Lost & Found website
                    </h3>

                    <p className="mt-3 text-sm leading-6 text-slate-300 sm:text-base">
                      Choose a template, customize the content and colours,
                      control your homepage sections, and preview the
                      design before making it public.
                    </p>

                    <p className="mt-5 text-sm text-slate-300">
                      Website design and publishing are managed on the standalone Website Settings page.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={openWebsitePreview}
                      className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 font-bold text-slate-900 hover:bg-slate-100"
                    >
                      <Eye size={18} />
                      Preview
                    </button>

                    <button
                      onClick={() => navigate(companyRoute("/website-settings"))}
                      className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-5 py-3 font-bold hover:bg-white/10"
                    >
                      <Pencil size={17} />
                      Customize
                    </button>
                  </div>
                </div>
              </section>

              {/* STATISTICS */}

              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-xl font-black">Operations at a glance</h3>
                <span className="text-sm text-slate-500">
                  Latest dashboard data
                </span>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                  title="Lost Items"
                  value={stats.lost ?? 0}
                  description="View lost reports"
                  icon={Search}
                  color="blue"
                  onClick={() => openReports("lost")}
                />

                <StatCard
                  title="Found Items"
                  value={stats.found ?? 0}
                  description="View found reports"
                  icon={ShieldCheck}
                  color="graphite"
                  onClick={() => openReports("found")}
                />

                <StatCard
                  title="Potential Matches"
                  value={stats.matched ?? 0}
                  description="View AI matches"
                  icon={Activity}
                  color="amber"
                  onClick={() => openReports("matches")}
                />

                <StatCard
                  title="Recovered"
                  value={stats.recovered ?? 0}
                  description="View returned items"
                  icon={CheckCircle2}
                  color="emerald"
                  onClick={() => openReports("recovered")}
                />
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <StatCard
                  title="Pending"
                  value={stats.pending ?? 0}
                  description="View items awaiting review"
                  icon={Clock}
                  color="amber"
                  onClick={() => openReports("pending")}
                />

                <StatCard
                  title="Staff Members"
                  value={stats.staff ?? staffMembers.length}
                  description="View staff accounts"
                  icon={Users}
                  color="blue"
                  onClick={() => openUsers("staff")}
                />

                <StatCard
                  title="Company Users"
                  value={stats.total_users ?? users.length}
                  description="View all user accounts"
                  icon={UserPlus}
                  color="graphite"
                  onClick={() => openUsers("all")}
                />
              </div>

              {/* QUICK ACTIONS */}

              <section className="mt-8">
                <h3 className="mb-4 text-xl font-black">Quick actions</h3>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  <QuickAction
                    icon={Monitor}
                    title="Design your website"
                    description="Edit the homepage, colours, sections and template."
                    onClick={() => navigate(companyRoute("/website-settings"))}
                  />

                  <QuickAction
                    icon={Users}
                    title="Manage users"
                    description="View available user records and staff accounts."
                    onClick={() => {
                      setActiveTab("users");
                      loadUsers();
                    }}
                  />

                  <QuickAction
                    icon={UserPlus}
                    title="Create staff account"
                    description="Add a team member to your company."
                    onClick={() => {
                      setActiveTab("users");
                      setShowStaffForm(true);
                    }}
                  />

                  <QuickAction
                    icon={Settings}
                    title="Company information"
                    description="Update your company contact information."
                    onClick={() => setActiveTab("company")}
                  />

                  <QuickAction
                    icon={FileText}
                    title="Recent reports"
                    description="Review the latest reports returned by your API."
                    onClick={() => openReports("all")}
                  />

                  <QuickAction
                    icon={Eye}
                    title="Preview public website"
                    description="Check how your company website looks."
                    onClick={openWebsitePreview}
                  />
                </div>
              </section>

              {/* RECENT REPORTS */}

              <ReportsSection
                title="Recent reports"
                description="Click any report to see its photo and full details."
                reports={reports.slice(0, 6)}
                onSelect={setSelectedReport}
                onViewAll={
                  reports.length > 6 ? () => openReports("all") : undefined
                }
                totalCount={reports.length}
              />
            </>
          )}

          {/* ====================================================
              WEBSITE DESIGNER
          ==================================================== */}

          {/* ====================================================
              USERS AND STAFF
          ==================================================== */}

          {activeTab === "users" && (
            <section>
              <PageHeading
                eyebrow="ACCESS MANAGEMENT"
                title="Users & Staff"
                description="Review the user records your company API returns and manage staff accounts."
                action={
                  <button
                    onClick={() => {
                      setShowStaffForm((value) => !value);
                      setError("");
                    }}
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 font-bold text-white hover:bg-blue-700"
                  >
                    {showStaffForm ? <X size={18} /> : <Plus size={18} />}
                    {showStaffForm ? "Cancel" : "Create Staff"}
                  </button>
                }
              />

              {showStaffForm && (
                <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
                  <SectionHeading
                    icon={UserPlus}
                    title="Create a staff account"
                    description="The staff member will be created through your company staff endpoint."
                  />

                  <form onSubmit={createStaff} className="space-y-5">
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                      <Field
                        label="Username"
                        name="username"
                        value={staffForm.username}
                        onChange={handleStaffChange}
                        placeholder="staff_username"
                        required
                      />

                      <Field
                        label="Email"
                        name="email"
                        type="email"
                        value={staffForm.email}
                        onChange={handleStaffChange}
                        placeholder="staff@company.com"
                        required
                      />

                      <Field
                        label="First name"
                        name="first_name"
                        value={staffForm.first_name}
                        onChange={handleStaffChange}
                      />

                      <Field
                        label="Last name"
                        name="last_name"
                        value={staffForm.last_name}
                        onChange={handleStaffChange}
                      />

                      <Field
                        label="Password"
                        name="password"
                        type="password"
                        value={staffForm.password}
                        onChange={handleStaffChange}
                        required
                      />

                      <Field
                        label="Confirm password"
                        name="confirm_password"
                        type="password"
                        value={staffForm.confirm_password}
                        onChange={handleStaffChange}
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={creatingStaff}
                      className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-bold text-white hover:bg-blue-700 disabled:opacity-60"
                    >
                      {creatingStaff && (
                        <Loader2 className="animate-spin" size={18} />
                      )}

                      {creatingStaff ? "Creating..." : "Create Staff Account"}
                    </button>
                  </form>
                </div>
              )}

              {/* USER SEARCH */}

              <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex flex-col gap-3 md:flex-row">
                  <div className="relative flex-1">
                    <Search
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                      size={18}
                    />

                    <input
                      value={userSearch}
                      onChange={(event) =>
                        setUserSearch(event.target.value)
                      }
                      placeholder="Search username, name, email or role..."
                      className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 outline-none focus:border-blue-500"
                    />
                  </div>

                  <select
                    value={userFilter}
                    onChange={(event) =>
                      setUserFilter(event.target.value)
                    }
                    className="rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-blue-500"
                  >
                    <option value="all">All available users</option>
                    <option value="staff">Staff</option>
                    <option value="customers">Customers</option>
                    <option value="admins">Admins & owners</option>
                  </select>

                  <button
                    onClick={() => {
                      loadDashboard();
                      loadUsers();
                    }}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 font-bold hover:bg-slate-50"
                  >
                    <RefreshCw size={17} />
                    Refresh
                  </button>
                </div>
              </div>

              {/* USER RECORDS */}

              <div className="mb-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-col justify-between gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center">
                  <div>
                    <h3 className="text-xl font-black">Company users</h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {filteredUsers.length} user record(s) displayed.
                    </p>
                  </div>

                  {usersLoading && (
                    <span className="inline-flex items-center gap-2 text-sm text-slate-500">
                      <Loader2 className="animate-spin" size={16} />
                      Loading users
                    </span>
                  )}
                </div>

                {filteredUsers.length === 0 ? (
                  <EmptyState
                    icon={Users}
                    title="No user records available"
                    description="The dashboard can display users returned by the company dashboard API or GET /api/company/users/. If this list is empty, check that your backend returns the company users."
                  />
                ) : (
                  <div className="divide-y divide-slate-100">
                    {filteredUsers.map((member) => (
                      <UserRow
                        key={member.id}
                        member={member}
                        onSelect={() => setSelectedStaff(member)}
                        onRemove={
                          String(member.role || "").toLowerCase() === "staff"
                            ? () => deleteStaff(member.id)
                            : null
                        }
                        removing={String(deletingStaffId) === String(member.id)}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* STAFF RECORDS */}

              <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 p-5">
                  <div>
                    <h3 className="text-xl font-black">Staff members</h3>
                    <p className="mt-1 text-sm text-slate-500">
                      Staff accounts returned by the dashboard API.
                    </p>
                  </div>

                  <span className="rounded-full bg-blue-50 px-3 py-1.5 text-sm font-black text-blue-700">
                    {staffMembers.length}
                  </span>
                </div>

                {staffMembers.length === 0 ? (
                  <EmptyState
                    icon={UserPlus}
                    title="No staff members yet"
                    description="Create a staff account to give a team member access to your company's Lost & Found operations."
                    action={
                      <button
                        onClick={() => setShowStaffForm(true)}
                        className="rounded-xl bg-blue-600 px-4 py-2.5 font-bold text-white hover:bg-blue-700"
                      >
                        Create Staff
                      </button>
                    }
                  />
                ) : (
                  <div className="divide-y divide-slate-100">
                    {staffMembers.map((member) => (
                      <UserRow
                        key={member.id}
                        member={member}
                        onSelect={() => setSelectedStaff(member)}
                        onRemove={() => deleteStaff(member.id)}
                        removing={String(deletingStaffId) === String(member.id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </section>
          )}

          {/* ====================================================
              COMPANY PROFILE
          ==================================================== */}

          {activeTab === "company" && (
            <section>
              <PageHeading
                eyebrow="BUSINESS SETTINGS"
                title="Company Profile"
                description="Manage the company information used across your Lost & Found platform."
              />

              <form
                onSubmit={saveCompanyInformation}
                className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"
              >
                <SectionHeading
                  icon={Settings}
                  title="Company information"
                  description="Your changes must be saved to the company profile endpoint."
                />

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <Field
                    label="Company name"
                    name="name"
                    value={companyForm.name}
                    onChange={handleCompanyChange}
                    required
                  />

                  <Field
                    label="Company email"
                    name="email"
                    type="email"
                    value={companyForm.email}
                    onChange={handleCompanyChange}
                  />

                  <Field
                    label="Phone number"
                    name="phone"
                    value={companyForm.phone}
                    onChange={handleCompanyChange}
                  />

                  <Field
                    label="Location"
                    name="location"
                    value={companyForm.location}
                    onChange={handleCompanyChange}
                  />

                  <Field
                    label="Website address"
                    name="website"
                    value={companyForm.website}
                    onChange={handleCompanyChange}
                    placeholder="https://example.com"
                  />

                  <div className="md:col-span-2">
                    <TextArea
                      label="Company description"
                      name="description"
                      value={companyForm.description}
                      onChange={handleCompanyChange}
                      rows={5}
                    />
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    type="submit"
                    disabled={savingCompany}
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-bold text-white hover:bg-blue-700 disabled:opacity-60"
                  >
                    {savingCompany ? (
                      <Loader2 className="animate-spin" size={18} />
                    ) : (
                      <Save size={18} />
                    )}

                    {savingCompany ? "Saving..." : "Save Company Profile"}
                  </button>

                  <button
                    type="button"
                    onClick={() => setCompanyForm({
                      name: company.name || "",
                      description: company.description || "",
                      email: company.email || "",
                      phone: company.phone || "",
                      location: company.location || "",
                      website: company.website || "",
                    })}
                    className="rounded-xl border border-slate-200 px-5 py-3 font-bold hover:bg-slate-50"
                  >
                    Reset Changes
                  </button>
                </div>
              </form>
            </section>
          )}

          {/* ====================================================
              REPORTS
          ==================================================== */}

          {activeTab === "reports" && (
            <section>
              <PageHeading
                eyebrow="LOST & FOUND OPERATIONS"
                title="Reports"
                description="Every lost and found item in your company. Click an item to see its photo and full details."
                action={
                  <button
                    onClick={loadDashboard}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 font-bold hover:bg-slate-50"
                  >
                    <RefreshCw size={17} />
                    Refresh
                  </button>
                }
              />

              {/* FILTERS */}

              <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4">
                <div className="relative">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    size={18}
                  />
                  <input
                    value={reportSearch}
                    onChange={(event) => setReportSearch(event.target.value)}
                    placeholder="Search item, category, location, status or reporter..."
                    className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                  />
                </div>

                <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                  {[
                    { id: "all", label: "All reports", count: reports.length },
                    { id: "lost", label: "Lost", count: stats.lost },
                    { id: "found", label: "Found", count: stats.found },
                    { id: "pending", label: "Pending", count: stats.pending_reports },
                    { id: "recovered", label: "Recovered", count: stats.resolved_reports },
                    { id: "matches", label: "AI matches", count: matches.length },
                  ].map((filter) => (
                    <button
                      key={filter.id}
                      type="button"
                      onClick={() => setReportFilter(filter.id)}
                      className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-bold transition ${
                        reportFilter === filter.id
                          ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                          : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {filter.label}
                      {filter.count !== undefined && (
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs ${
                            reportFilter === filter.id
                              ? "bg-white/20"
                              : "bg-slate-100"
                          }`}
                        >
                          {filter.count ?? 0}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {reportFilter === "matches" ? (
                <MatchesSection
                  matches={filteredMatches}
                  onSelect={setSelectedMatch}
                />
              ) : (
                <ReportsSection
                  title={
                    reportFilter === "all"
                      ? "All reports"
                      : `${reportFilter.charAt(0).toUpperCase()}${reportFilter.slice(1)} reports`
                  }
                  description={`${filteredReports.length} item(s) shown.`}
                  reports={filteredReports}
                  onSelect={setSelectedReport}
                  grid
                />
              )}
            </section>
          )}

          {/* FOOTER */}

          <footer className="mt-10 flex flex-col justify-between gap-3 border-t border-slate-200 py-6 text-sm text-slate-500 sm:flex-row sm:items-center">
            <p>
              © {new Date().getFullYear()} {companyName}. Powered by TrustFound.
            </p>

            <button
              onClick={() => navigate(companyRoute("/website-settings"))}
              className="inline-flex items-center gap-2 font-bold text-blue-600 hover:text-blue-700"
            >
              <Monitor size={16} />
              Open Website Settings
              <ArrowRight size={16} />
            </button>
          </footer>
        </main>
      </div>

      {/* USER DETAILS MODAL */}

      {selectedStaff && (
        <UserDetailsModal
          member={selectedStaff}
          onClose={() => setSelectedStaff(null)}
          onSelectItem={(item) => {
            setSelectedStaff(null);
            setSelectedReport(item);
          }}
          onRemove={
            String(selectedStaff.role || "").toLowerCase() === "staff"
              ? () => deleteStaff(selectedStaff.id)
              : null
          }
        />
      )}

      {/* REPORT DETAILS MODAL */}

      {selectedReport && (
        <ReportDetailsModal
          report={selectedReport}
          onClose={() => setSelectedReport(null)}
        />
      )}

      {/* MATCH DETAILS MODAL */}

      {selectedMatch && (
        <MatchDetailsModal
          match={selectedMatch}
          onClose={() => setSelectedMatch(null)}
          onOpenItem={(type, id) => {
            const item = findReport(type, id);
            if (item) {
              setSelectedMatch(null);
              setSelectedReport(item);
            }
          }}
        />
      )}
    </div>
  );
}

// ============================================================
// STATISTICS CARD
// ============================================================

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  color = "blue",
  onClick,
}) {
  const colors = {
    blue: "bg-orange-50 text-orange-600",
    graphite: "bg-stone-100 text-stone-800",
    amber: "bg-amber-50 text-amber-600",
    emerald: "bg-emerald-50 text-emerald-600",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-orange-300 hover:shadow-md sm:p-6"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-500">{title}</p>
          <p className="mt-3 text-3xl font-black tracking-tight text-slate-900">
            {value}
          </p>
        </div>

        <div className={`rounded-2xl p-3 ${colors[color] || colors.blue}`}>
          {Icon && <Icon size={23} />}
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-slate-500 transition group-hover:text-orange-600">
        {description}
        <ArrowRight
          size={15}
          className="transition group-hover:translate-x-1"
        />
      </div>
    </button>
  );
}

// ============================================================
// STATUS BADGE
// ============================================================

function StatusBadge({ status }) {
  const value = String(status || "Pending");
  const key = value.toLowerCase();

  const styles =
    key === "recovered" || key === "verified" || key === "approved"
      ? "bg-emerald-50 text-emerald-700"
      : key === "matched" || key.includes("recovery")
        ? "bg-orange-100 text-orange-700"
        : key === "rejected"
          ? "bg-red-50 text-red-600"
          : key === "pending"
            ? "bg-amber-50 text-amber-700"
            : "bg-slate-100 text-slate-700";

  return (
    <span
      className={`inline-flex w-fit shrink-0 rounded-full px-3 py-1 text-xs font-bold capitalize ${styles}`}
    >
      {value}
    </span>
  );
}

function formatDate(value) {
  if (!value) return "";

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? String(value)
    : date.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
}

function ItemThumb({ report, className = "h-16 w-16" }) {
  const src = resolveMediaUrl(report.image);

  return src ? (
    <img
      src={src}
      alt={report.item_name || "Item"}
      className={`${className} item-image shrink-0 rounded-xl border border-slate-200`}
      onError={(event) => {
        event.currentTarget.src = PLACEHOLDER_IMAGE;
      }}
    />
  ) : (
    <div
      className={`${className} flex shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-400`}
    >
      <ImageIcon size={22} />
    </div>
  );
}

// ============================================================
// QUICK ACTION
// ============================================================

function QuickAction({ icon, title, description, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md"
    >
      <div className="rounded-xl bg-blue-50 p-3 text-blue-600 transition group-hover:bg-blue-600 group-hover:text-white">
        {createElement(icon, { size: 22 })}
      </div>

      <div className="min-w-0 flex-1">
        <h4 className="font-black text-slate-900">{title}</h4>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          {description}
        </p>
      </div>

      <ChevronRight
        size={18}
        className="mt-1 shrink-0 text-slate-400 transition group-hover:translate-x-1 group-hover:text-blue-600"
      />
    </button>
  );
}

// ============================================================
// PAGE HEADING
// ============================================================

function PageHeading({ eyebrow, title, description, action }) {
  return (
    <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <p className="mb-2 text-sm font-bold uppercase tracking-wider text-blue-600">
          {eyebrow}
        </p>

        <h2 className="text-3xl font-black tracking-tight sm:text-4xl">
          {title}
        </h2>

        <p className="mt-3 max-w-3xl leading-6 text-slate-500">
          {description}
        </p>
      </div>

      {action}
    </div>
  );
}

// ============================================================
// SECTION HEADING
// ============================================================

function SectionHeading({ icon, title, description }) {
  return (
    <div className="mb-6 flex items-start gap-3">
      <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
        {createElement(icon, { size: 21 })}
      </div>

      <div>
        <h3 className="text-xl font-black text-slate-900">{title}</h3>
        {description && (
          <p className="mt-1 text-sm leading-6 text-slate-500">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

// ============================================================
// FORM FIELD
// ============================================================

function Field({
  label,
  name,
  type = "text",
  value,
  onChange,
  placeholder,
  required = false,
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="mb-2 block text-sm font-bold text-slate-700"
      >
        {label}
      </label>

      {type === "password" ? (
        <PasswordInput
          id={name}
          name={name}
          value={value ?? ""}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          autoComplete="new-password"
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
        />
      ) : (
        <input
          id={name}
          name={name}
          type={type}
          value={value ?? ""}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
        />
      )}
    </div>
  );
}

// ============================================================
// TEXT AREA
// ============================================================

function TextArea({
  label,
  name,
  value,
  onChange,
  placeholder,
  rows = 4,
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="mb-2 block text-sm font-bold text-slate-700"
      >
        {label}
      </label>

      <textarea
        id={name}
        name={name}
        value={value ?? ""}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        className="w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
      />
    </div>
  );
}

// ============================================================
// COLOUR FIELD
// ============================================================

function ColourField({ label, name, value, onChange }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-slate-700">
        {label}
      </label>

      <div className="flex items-center gap-3 rounded-xl border border-slate-200 p-3">
        <input
          type="color"
          name={name}
          value={isValidColour(value) ? value : "#EA580C"}
          onChange={onChange}
          className="h-12 w-14 cursor-pointer rounded-lg border-0 bg-transparent"
        />

        <input
          type="text"
          name={name}
          value={value ?? ""}
          onChange={onChange}
          placeholder="#EA580C"
          className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 font-mono outline-none focus:border-blue-500"
        />
      </div>
    </div>
  );
}

function isValidColour(value) {
  return /^#[0-9A-Fa-f]{6}$/.test(value || "");
}

// ============================================================
// TOGGLE
// ============================================================

function Toggle({
  label,
  description,
  name,
  checked,
  onChange,
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-5 rounded-2xl border border-slate-200 p-4 transition hover:border-blue-200 hover:bg-slate-50">
      <div>
        <span className="block font-bold text-slate-900">{label}</span>

        {description && (
          <span className="mt-1 block text-sm leading-6 text-slate-500">
            {description}
          </span>
        )}
      </div>

      <input
        type="checkbox"
        name={name}
        checked={Boolean(checked)}
        onChange={onChange}
        className="mt-1 h-5 w-5 shrink-0 cursor-pointer accent-blue-600"
      />
    </label>
  );
}

// ============================================================
// USER ROW
// ============================================================

function UserRow({ member, onSelect, onRemove, removing = false }) {
  const fullName =
    `${member.first_name || ""} ${member.last_name || ""}`.trim();

  const role = member.role || "user";

  return (
    <div className="flex flex-col justify-between gap-4 p-5 transition hover:bg-slate-50 sm:flex-row sm:items-center">
      <button
        type="button"
        onClick={onSelect}
        className="flex min-w-0 items-center gap-3 text-left"
      >
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 font-black text-blue-700">
          {(fullName || member.username || member.email || "U")
            .charAt(0)
            .toUpperCase()}
        </div>

        <div className="min-w-0">
          <h4 className="truncate font-black text-slate-900">
            {fullName || member.username || "Unnamed user"}
          </h4>

          <p className="mt-1 truncate text-sm text-slate-500">
            {member.email || "No email provided"}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            @{member.username || "unknown"}
          </p>
        </div>
      </button>

      <div className="flex flex-wrap items-center gap-3">
        <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold capitalize text-slate-700">
          {role}
        </span>

        <span
          className={`rounded-full px-3 py-1.5 text-xs font-bold ${
            member.is_active === false
              ? "bg-red-50 text-red-600"
              : "bg-emerald-50 text-emerald-700"
          }`}
        >
          {member.is_active === false ? "Inactive" : "Active"}
        </span>

        <button
          type="button"
          onClick={onSelect}
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold hover:bg-white"
        >
          View
        </button>

        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            disabled={removing}
            className="inline-flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-sm font-bold text-red-600 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {removing ? <Loader2 className="animate-spin" size={15} /> : <Trash2 size={15} />}
            {removing ? "Removing..." : "Remove"}
          </button>
        )}
      </div>
    </div>
  );
}

// ============================================================
// USER DETAILS MODAL
// ============================================================

function UserDetailsModal({ member, onClose, onRemove, onSelectItem }) {
  const fullName =
    `${member.first_name || ""} ${member.last_name || ""}`.trim();

  const items = Array.isArray(member.items) ? member.items : [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 py-6 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-8"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-2xl font-black text-blue-700">
              {(fullName || member.username || "U")
                .charAt(0)
                .toUpperCase()}
            </div>

            <h3 className="mt-4 text-2xl font-black">
              {fullName || member.username || "User details"}
            </h3>

            <p className="mt-1 capitalize text-slate-500">
              {member.role || "User account"}
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl bg-slate-100 p-2 hover:bg-slate-200"
            aria-label="Close user details"
          >
            <X size={20} />
          </button>
        </div>

        <div className="mt-7 space-y-3">
          <Info
            label="Username"
            value={member.username ? `@${member.username}` : "Not provided"}
          />

          <Info
            label="Email"
            value={member.email || "Not provided"}
          />

          <Info
            label="First name"
            value={member.first_name || "Not provided"}
          />

          <Info
            label="Last name"
            value={member.last_name || "Not provided"}
          />

          <Info
            label="Role"
            value={member.role || "User"}
          />

          <Info
            label="Account status"
            value={member.is_active === false ? "Inactive" : "Active"}
          />

          {member.date_joined && (
            <Info label="Joined" value={formatDate(member.date_joined)} />
          )}
        </div>

        {/* THIS USER'S ITEMS */}

        {items.length > 0 && (
          <div className="mt-7">
            <h4 className="mb-3 font-black text-slate-900">
              Reported items ({items.length})
            </h4>

            <div className="space-y-2">
              {items.map((item) => (
                <button
                  key={`${item.type}-${item.id}`}
                  type="button"
                  onClick={() => onSelectItem?.(item)}
                  className="flex w-full items-center gap-3 rounded-xl border border-slate-200 p-3 text-left transition hover:border-orange-300 hover:bg-orange-50/40"
                >
                  <ItemThumb report={item} className="h-12 w-12" />

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold text-slate-900">
                      {item.item_name || "Unnamed item"}
                    </p>
                    <p className="text-xs text-slate-500">
                      {item.type} · {formatDate(item.created_at)}
                    </p>
                  </div>

                  <StatusBadge status={item.status} />
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-7 flex flex-wrap gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl bg-slate-100 px-4 py-3 font-bold text-slate-700 hover:bg-slate-200"
          >
            Close
          </button>

          {onRemove && (
            <button
              onClick={onRemove}
              className="flex-1 rounded-xl bg-red-600 px-4 py-3 font-bold text-white hover:bg-red-700"
            >
              Remove Staff
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// INFORMATION CARD
// ============================================================

function Info({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
        {label}
      </p>

      <p className="mt-1 break-words font-semibold text-slate-800">
        {value}
      </p>
    </div>
  );
}

// ============================================================
// RECENT REPORTS
// ============================================================

function ReportsSection({
  title = "Recent reports",
  description,
  reports = [],
  onSelect,
  onViewAll,
  totalCount,
  grid = false,
}) {
  return (
    <section className="mt-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 p-5 sm:p-6">
        <div>
          <h3 className="text-xl font-black">{title}</h3>
          {description && (
            <p className="mt-1 text-sm text-slate-500">{description}</p>
          )}
        </div>

        {onViewAll ? (
          <button
            type="button"
            onClick={onViewAll}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 px-3.5 py-2 text-sm font-bold text-slate-700 transition hover:border-orange-300 hover:text-orange-600"
          >
            View all {totalCount ? `(${totalCount})` : ""}
            <ArrowRight size={15} />
          </button>
        ) : (
          <div className="rounded-xl bg-orange-50 p-3 text-orange-600">
            <FileText size={21} />
          </div>
        )}
      </div>

      {reports.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No reports found"
          description="Lost and found items reported in your company will appear here."
        />
      ) : grid ? (
        <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 xl:grid-cols-3">
          {reports.map((report) => (
            <button
              key={`${report.type}-${report.id}`}
              type="button"
              onClick={() => onSelect?.(report)}
              className="group overflow-hidden rounded-2xl border border-slate-200 bg-white text-left transition hover:-translate-y-0.5 hover:border-orange-300 hover:shadow-lg"
            >
              <ItemThumb
                report={report}
                className="h-44 w-full rounded-none border-0 border-b"
              />

              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <h4 className="min-w-0 break-words font-black text-slate-900 group-hover:text-orange-600">
                    {report.item_name || "Unnamed item"}
                  </h4>
                  <StatusBadge status={report.status} />
                </div>

                <p className="mt-1 text-xs font-bold uppercase tracking-wide text-slate-400">
                  {report.type} · {report.category || "No category"}
                </p>

                <p className="mt-3 flex items-center gap-1.5 text-sm text-slate-500">
                  <MapPin size={14} className="shrink-0" />
                  <span className="truncate">
                    {report.location || "Location not provided"}
                  </span>
                </p>

                <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
                  <Clock size={14} className="shrink-0" />
                  {formatDate(report.date_lost || report.date_found || report.created_at)}
                </p>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {reports.map((report) => (
            <button
              key={`${report.type}-${report.id}`}
              type="button"
              onClick={() => onSelect?.(report)}
              className="group flex w-full flex-col justify-between gap-3 p-5 text-left transition hover:bg-orange-50/40 sm:flex-row sm:items-center"
            >
              <div className="flex min-w-0 items-center gap-4">
                <ItemThumb report={report} />

                <div className="min-w-0">
                  <h4 className="break-words font-bold text-slate-900 group-hover:text-orange-600">
                    {report.item_name || report.title || "Unnamed item"}
                  </h4>

                  <p className="mt-0.5 text-xs font-bold uppercase tracking-wide text-slate-400">
                    {report.type} · {report.category || "No category"}
                  </p>

                  <p className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                    <MapPin size={14} />
                    {report.location ||
                      report.location_found ||
                      "Location not provided"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <StatusBadge status={report.status} />
                <ChevronRight
                  size={18}
                  className="hidden text-slate-300 transition group-hover:translate-x-1 group-hover:text-orange-600 sm:block"
                />
              </div>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

// ============================================================
// AI MATCHES
// ============================================================

function MatchesSection({ matches = [], onSelect }) {
  return (
    <section className="mt-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 p-5 sm:p-6">
        <h3 className="text-xl font-black">AI matches</h3>
        <p className="mt-1 text-sm text-slate-500">
          {matches.length} match(es). Click one to see the scores and both items.
        </p>
      </div>

      {matches.length === 0 ? (
        <EmptyState
          icon={Activity}
          title="No matches yet"
          description="When a lost item and a found item look alike, the match appears here."
        />
      ) : (
        <div className="divide-y divide-slate-100">
          {matches.map((match) => (
            <button
              key={match.id}
              type="button"
              onClick={() => onSelect?.(match)}
              className="group flex w-full flex-col justify-between gap-3 p-5 text-left transition hover:bg-orange-50/40 sm:flex-row sm:items-center"
            >
              <div className="min-w-0">
                <h4 className="break-words font-bold text-slate-900 group-hover:text-orange-600">
                  {match.lost_item?.item_name || "Lost item"}
                  <span className="mx-2 text-slate-300">↔</span>
                  {match.found_item?.item_name || "Found item"}
                </h4>
                <p className="mt-1 text-sm text-slate-500">
                  Updated {formatDate(match.updated_at || match.created_at)}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="rounded-full bg-graphite px-3 py-1 text-xs font-bold text-white">
                  {Math.round(Number(match.confidence_score) || 0)}%
                </span>
                <StatusBadge status={match.status} />
                <ChevronRight
                  size={18}
                  className="hidden text-slate-300 transition group-hover:translate-x-1 group-hover:text-orange-600 sm:block"
                />
              </div>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

// ============================================================
// MODAL SHELL
// ============================================================

function Modal({ title, subtitle, onClose, children, wide = false }) {
  useEffect(() => {
    const onKey = (event) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 backdrop-blur-sm sm:items-center sm:px-4 sm:py-6"
      onClick={onClose}
    >
      <div
        className={`max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl ${
          wide ? "sm:max-w-3xl" : "sm:max-w-lg"
        }`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-100 bg-white/95 p-5 backdrop-blur sm:p-6">
          <div className="min-w-0">
            <h3 className="break-words text-xl font-black text-slate-900 sm:text-2xl">
              {title}
            </h3>
            {subtitle && <div className="mt-1.5">{subtitle}</div>}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-xl bg-slate-100 p-2 hover:bg-slate-200"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-5 sm:p-6">{children}</div>
      </div>
    </div>
  );
}

// ============================================================
// REPORT DETAILS
// ============================================================

function ReportDetailsModal({ report, onClose }) {
  const isLost = String(report.type).toLowerCase() === "lost";
  const image = resolveMediaUrl(report.image);
  const person =
    report.reporter?.full_name || report.reporter?.username || null;

  const contact = isLost
    ? {
        name: report.contact_name,
        phone: report.contact_phone,
        email: report.contact_email,
      }
    : {
        name: report.finder_name,
        phone: report.finder_phone,
        email: report.finder_email,
      };

  const tags = Array.isArray(report.tags) ? report.tags : [];

  const staffInfo = !isLost
    ? [
        ["Verified by", report.verified_by?.full_name || report.verified_by?.username],
        ["Verified on", formatDate(report.verified_at)],
        ["Found by staff", report.found_by_staff_user?.full_name || report.found_by_staff_user?.username],
        ["Received by", report.staff_receiver?.full_name || report.staff_receiver?.username],
        ["Received from", report.received_from],
        ["Recovered by", report.recovered_by?.full_name || report.recovered_by?.username],
        ["Recovered on", formatDate(report.recovered_at)],
      ].filter(([, value]) => value)
    : [];

  return (
    <Modal
      wide
      title={report.item_name || "Item details"}
      subtitle={
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full px-3 py-1 text-xs font-bold ${
              isLost ? "bg-orange-600 text-white" : "bg-graphite text-white"
            }`}
          >
            {isLost ? "Lost item" : "Found item"}
          </span>
          <StatusBadge status={report.status} />
        </div>
      }
      onClose={onClose}
    >
      {/* PHOTO */}
      {image ? (
        <div className="mb-6 overflow-hidden rounded-2xl border border-slate-200">
          <img
            src={image}
            alt={report.item_name || "Item photo"}
            className="item-image zoomable max-h-[420px] w-full"
            onError={(event) => {
              event.currentTarget.src = PLACEHOLDER_IMAGE;
            }}
          />
          <p className="bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-500">
            Click the photo to view it full size.
          </p>
        </div>
      ) : (
        <div className="mb-6 flex h-40 flex-col items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
          <ImageIcon size={30} />
          <p className="mt-2 text-sm font-semibold">No photo provided</p>
        </div>
      )}

      {/* DESCRIPTION */}
      {report.description && (
        <div className="mb-6">
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
            Description
          </p>
          <p className="whitespace-pre-line leading-7 text-slate-700">
            {report.description}
          </p>
        </div>
      )}

      {/* KEY FACTS */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Info label="Category" value={report.category || "Not provided"} />
        <Info
          label={isLost ? "Where it was lost" : "Where it was found"}
          value={report.location || "Not provided"}
        />
        <Info
          label={isLost ? "Date lost" : "Date found"}
          value={
            [
              formatDate(isLost ? report.date_lost : report.date_found),
              isLost ? report.time_lost : report.time_found,
            ]
              .filter(Boolean)
              .join(" · ") || "Not provided"
          }
        />
        <Info label="Reported on" value={formatDate(report.created_at) || "—"} />
        {isLost && report.reward_offered ? (
          <Info label="Reward offered" value={String(report.reward_offered)} />
        ) : null}
        {person && (
          <Info
            label="Reported by"
            value={`${person}${report.reporter?.email ? ` (${report.reporter.email})` : ""}`}
          />
        )}
      </div>

      {/* CONTACT */}
      {(contact.name || contact.phone || contact.email) && (
        <div className="mt-6 rounded-2xl border border-orange-200 bg-orange-50/50 p-4">
          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-orange-700">
            {isLost ? "Owner contact" : "Finder contact"}
          </p>
          <div className="space-y-2 text-sm text-slate-700">
            {contact.name && (
              <p className="flex items-center gap-2 font-semibold">
                <Users size={15} className="text-orange-600" />
                {contact.name}
              </p>
            )}
            {contact.phone && (
              <a
                href={`tel:${contact.phone}`}
                className="flex items-center gap-2 hover:text-orange-600"
              >
                <Phone size={15} className="text-orange-600" />
                {contact.phone}
              </a>
            )}
            {contact.email && (
              <a
                href={`mailto:${contact.email}`}
                className="flex items-center gap-2 break-all hover:text-orange-600"
              >
                <Mail size={15} className="text-orange-600" />
                {contact.email}
              </a>
            )}
          </div>
        </div>
      )}

      {/* STAFF HANDLING */}
      {staffInfo.length > 0 && (
        <div className="mt-6">
          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
            Staff handling
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {staffInfo.map(([label, value]) => (
              <Info key={label} label={label} value={value} />
            ))}
          </div>
        </div>
      )}

      {/* TAGS */}
      {tags.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={String(tag)}
              className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600"
            >
              #{String(tag)}
            </span>
          ))}
        </div>
      )}
    </Modal>
  );
}

// ============================================================
// MATCH DETAILS
// ============================================================

function MatchDetailsModal({ match, onClose, onOpenItem }) {
  const scores = [
    ["Overall confidence", match.confidence_score],
    ["Name", match.name_score],
    ["Description", match.description_score],
    ["Image", match.image_score],
    ["Location", match.location_score],
    ["Category", match.category_score],
    ["Date", match.date_score],
    ["Tags", match.tag_score],
  ].filter(([, value]) => value !== null && value !== undefined);

  const timeline = Array.isArray(match.timeline) ? match.timeline : [];

  return (
    <Modal
      wide
      title="AI match"
      subtitle={<StatusBadge status={match.status} />}
      onClose={onClose}
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {[
          ["lost", "Lost item", match.lost_item],
          ["found", "Found item", match.found_item],
        ].map(([type, label, item]) => (
          <button
            key={type}
            type="button"
            onClick={() => onOpenItem(type, item?.id)}
            className="group rounded-2xl border border-slate-200 p-4 text-left transition hover:border-orange-300 hover:bg-orange-50/40"
          >
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {label}
            </p>
            <p className="mt-1 font-black text-slate-900 group-hover:text-orange-600">
              {item?.item_name || "Unknown"}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {item?.category || "No category"} · {item?.status || "—"}
            </p>
            <p className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-orange-600">
              View item <ArrowRight size={14} />
            </p>
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-3">
        {scores.map(([label, value]) => {
          const percent = Math.max(0, Math.min(100, Math.round(Number(value) || 0)));

          return (
            <div key={label}>
              <div className="mb-1 flex justify-between text-sm">
                <span className="font-semibold text-slate-700">{label}</span>
                <span className="font-bold text-slate-900">{percent}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-orange-600"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {timeline.length > 0 && (
        <div className="mt-6">
          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
            Timeline
          </p>
          <ol className="space-y-3 border-l-2 border-orange-200 pl-4">
            {timeline.map((entry) => (
              <li key={entry.id}>
                <p className="font-semibold text-slate-800">
                  {entry.description || entry.action}
                </p>
                <p className="text-xs text-slate-500">
                  {formatDate(entry.created_at)}
                  {entry.performed_by?.full_name
                    ? ` · ${entry.performed_by.full_name}`
                    : ""}
                </p>
              </li>
            ))}
          </ol>
        </div>
      )}
    </Modal>
  );
}

// ============================================================
// EMPTY STATE
// ============================================================

function EmptyState({
  icon,
  title,
  description,
  action,
}) {
  return (
    <div className="px-6 py-12 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
        {createElement(icon, { size: 25 })}
      </div>

      <h4 className="mt-4 font-black text-slate-900">{title}</h4>

      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
        {description}
      </p>

      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}