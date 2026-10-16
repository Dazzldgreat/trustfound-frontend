import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  Clock,
  FileText,
  Globe,
  LayoutDashboard,
  Loader2,
  LogOut,
  Mail,
  MapPin,
  Menu,
  Pencil,
  Phone,
  Plus,
  RefreshCw,
  Save,
  Search,
  Settings,
  ShieldCheck,
  Trash2,
  User,
  UserPlus,
  Users,
  X,
  Package,
  Calendar,
  Eye,
  Check,
  XCircle,
  MessageSquare,
  History,
  ChevronRight,
} from "lucide-react";

import { API } from "../../config";
const DEFAULT_SETTINGS = {
  primary_color: "#2563eb",
  secondary_color: "#0f172a",
  background_color: "#f8fafc",
  border_color: "#e2e8f0",
  border_line_color: "#cbd5e1",
  border_style: "solid",
  border_width: 1,
  show_about: true,
  show_featured_items: true,
  show_contact: true,
  is_published: false,
};

const EMPTY_DASHBOARD = {
  company: {},
  user: {},
  stats: {},
  recent_reports: [],
  reports: [],
  staff_members: [],
  users: [],
  customers: [],
  matches: [],
  activity: [],
  notifications: [],
};

const STATUS_COLORS = {
  pending: "bg-amber-100 text-amber-800",
  matched: "bg-blue-100 text-blue-800",
  approved: "bg-indigo-100 text-indigo-800",
  verified: "bg-emerald-100 text-emerald-800",
  recovered: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-800",
  "recovery requested": "bg-purple-100 text-purple-800",
  accepted: "bg-emerald-100 text-emerald-800",
  active: "bg-emerald-100 text-emerald-800",
  inactive: "bg-slate-100 text-slate-700",
};

const getToken = () =>
  localStorage.getItem("access_token") ||
  localStorage.getItem("access") ||
  localStorage.getItem("company_access") ||
  "";

const getRefreshToken = () =>
  localStorage.getItem("refresh_token") ||
  localStorage.getItem("refresh") ||
  "";

const safeArray = (value) => (Array.isArray(value) ? value : []);

const firstValue = (...values) =>
  values.find(
    (value) =>
      value !== undefined &&
      value !== null &&
      value !== ""
  );

const normalizeStatus = (value) =>
  String(value || "Pending")
    .replace(/_/g, " ")
    .replace(/-/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const statusClass = (status) => {
  const key = normalizeStatus(status).toLowerCase();
  return (
    STATUS_COLORS[key] ||
    "bg-slate-100 text-slate-700"
  );
};

const getPersonName = (person) => {
  if (!person) return "Unknown user";

  if (typeof person === "string") return person;

  return (
    person.full_name ||
    person.name ||
    person.username ||
    person.email ||
    person.user?.full_name ||
    person.user?.username ||
    person.reporter?.full_name ||
    person.reporter?.username ||
    "Unnamed user"
  );
};

const getPersonEmail = (person) =>
  firstValue(
    person?.email,
    person?.user?.email,
    person?.reporter?.email,
    person?.staff?.email
  ) || "";

const getPersonId = (person) =>
  firstValue(
    person?.id,
    person?.user_id,
    person?.user?.id,
    person?.customer_id
  );

const getReportType = (report) => {
  const explicitType = String(
    firstValue(
      report?.report_type,
      report?.item_type,
      report?.type,
      report?.kind,
      ""
    )
  ).toLowerCase();

  if (
    explicitType.includes("found") ||
    report?.location_found ||
    report?.date_found
  ) {
    return "Found";
  }

  if (
    explicitType.includes("lost") ||
    report?.date_lost
  ) {
    return "Lost";
  }

  return "Report";
};

const getReportTitle = (report) =>
  firstValue(
    report?.item_name,
    report?.name,
    report?.title,
    report?.item?.item_name,
    report?.lost_item?.item_name,
    report?.found_item?.item_name
  ) || "Untitled item";

const getReportStatus = (report) =>
  normalizeStatus(
    firstValue(
      report?.status,
      report?.item_status,
      report?.match_status,
      "Pending"
    )
  );

const getReportDate = (report) =>
  firstValue(
    report?.created_at,
    report?.updated_at,
    report?.date_lost,
    report?.date_found,
    report?.date,
    report?.timestamp
  );

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const formatDateTime = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString();
};

const toNumber = (...values) => {
  const value = values.find(
    (entry) =>
      entry !== undefined &&
      entry !== null &&
      entry !== "" &&
      Number.isFinite(Number(entry))
  );

  return value === undefined ? null : Number(value);
};

const isRecovered = (value) =>
  normalizeStatus(value).toLowerCase() === "recovered";

const isPending = (value) =>
  normalizeStatus(value).toLowerCase() === "pending";

const isTerminalMatch = (match) => {
  const status = normalizeStatus(match?.status).toLowerCase();

  return [
    "recovered",
    "rejected",
    "cancelled",
    "canceled",
  ].includes(status);
};

const getCustomerAccounts = (result) => {
  const candidates = Array.isArray(result)
    ? result
    : firstValue(
        result?.customers,
        result?.company_users,
        result?.users,
        result?.results,
        []
      );

  return safeArray(candidates)
    .filter(Boolean)
    .filter((person) => {
      const role = String(
        person?.role ||
          person?.user?.role ||
          person?.account_type ||
          ""
      ).toLowerCase();

      return (
        role === "user" ||
        role === "customer" ||
        role === "client"
      );
    })
    .filter((person) => {
      const id = getPersonId(person);
      const name = getPersonName(person);
      const email = getPersonEmail(person);

      return (
        id !== undefined ||
        email ||
        name !== "Unnamed user"
      );
    });
};

const getStaffAccounts = (result) => {
  const candidates = Array.isArray(result)
    ? result
    : safeArray(result?.staff_members);

  return safeArray(candidates)
    .filter(Boolean)
    .filter((person) => {
      const role = String(person?.role || "").toLowerCase();

      return (
        role === "staff" ||
        role === "manager" ||
        role === "employee"
      );
    });
};

const getReportsFromDashboard = (result) => {
  const existing = firstValue(
    result?.recent_reports,
    result?.reports
  );

  if (Array.isArray(existing)) {
    return existing.filter(Boolean);
  }

  const combined = [
    ...safeArray(result?.lost_items).map((item) => ({
      ...item,
      report_type: "Lost",
    })),
    ...safeArray(result?.found_items).map((item) => ({
      ...item,
      report_type: "Found",
    })),
  ];

  return combined;
};

const getCustomerItems = (person) => {
  const directItems = safeArray(person?.items);

  const lostItems = safeArray(person?.lost_items).map((item) => ({
    ...item,
    report_type: "Lost",
  }));

  const foundItems = safeArray(person?.found_items).map((item) => ({
    ...item,
    report_type: "Found",
  }));

  if (directItems.length) {
    const existingKeys = new Set(
      directItems.map(
        (item) =>
          `${getReportType(item)}-${item.id ?? getReportTitle(item)}`
      )
    );

    return [
      ...directItems,
      ...lostItems.filter(
        (item) =>
          !existingKeys.has(
            `${getReportType(item)}-${item.id ?? getReportTitle(item)}`
          )
      ),
      ...foundItems.filter(
        (item) =>
          !existingKeys.has(
            `${getReportType(item)}-${item.id ?? getReportTitle(item)}`
          )
      ),
    ];
  }

  return [...lostItems, ...foundItems];
};

const getCustomerActivity = (person) =>
  safeArray(
    firstValue(
      person?.activity,
      person?.activities,
      person?.activity_log,
      person?.recent_activity,
      person?.recent_activities,
      []
    )
  );

const getCustomerMatches = (person) =>
  safeArray(
    firstValue(
      person?.matches,
      person?.item_matches,
      person?.potential_matches,
      []
    )
  );

function StatCard({
  title,
  value,
  icon: Icon,
  description,
  onClick,
  color = "blue",
}) {
  const colors = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    purple: "bg-purple-50 text-purple-600",
    red: "bg-red-50 text-red-600",
    slate: "bg-slate-100 text-slate-700",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      title={`View ${title.toLowerCase()}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>

          <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
            {value}
          </p>

          <p className="mt-2 text-xs text-slate-500">
            {description || "Click to view details"}
          </p>
        </div>

        <div
          className={`rounded-xl p-3 ${
            colors[color] || colors.blue
          }`}
        >
          <Icon size={21} />
        </div>
      </div>
    </button>
  );
}

function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(
        status
      )}`}
    >
      {normalizeStatus(status)}
    </span>
  );
}

function EmptyState({ title, description }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
      <Package className="mx-auto mb-3 text-slate-400" size={34} />

      <h3 className="font-semibold text-slate-800">{title}</h3>

      <p className="mt-1 text-sm text-slate-500">
        {description}
      </p>
    </div>
  );
}

export default function CompanyDashboard() {
  const navigate = useNavigate();
  const params = useParams();

  const activeCompanySlug =
    params.companySlug ||
    params.slug ||
    localStorage.getItem("companySlug") ||
    localStorage.getItem("company_slug") ||
    JSON.parse(localStorage.getItem("company") || "{}")?.slug ||
    "";

  const [dashboard, setDashboard] = useState(EMPTY_DASHBOARD);
  const [users, setUsers] = useState([]);
  const [staffMembers, setStaffMembers] = useState([]);
  const [reports, setReports] = useState([]);
  const [matches, setMatches] = useState([]);
  const [activity, setActivity] = useState([]);

  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [reportFilter, setReportFilter] = useState("all");
  const [userFilter, setUserFilter] = useState("all");

  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [selectedStaff, setSelectedStaff] = useState(null);

  const [showCreateStaff, setShowCreateStaff] = useState(false);
  const [staffForm, setStaffForm] = useState({
    full_name: "",
    username: "",
    email: "",
    phone: "",
    password: "",
  });

  const [creatingStaff, setCreatingStaff] = useState(false);
  const [deletingStaffId, setDeletingStaffId] = useState(null);

  const [websiteSettings, setWebsiteSettings] =
    useState(DEFAULT_SETTINGS);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState("");

  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
    phone: "",
    location: "",
    website: "",
    description: "",
  });

  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");

  const companyRoute = useCallback(
    (path) => {
      const cleanPath = path.startsWith("/") ? path : `/${path}`;

      if (!activeCompanySlug) return cleanPath;

      return `/company/${encodeURIComponent(
        activeCompanySlug
      )}${cleanPath}`;
    },
    [activeCompanySlug]
  );

  const logout = useCallback(() => {
    [
      "access_token",
      "access",
      "company_access",
      "refresh_token",
      "refresh",
      "user",
      "company_user",
    ].forEach((key) => localStorage.removeItem(key));

    navigate(companyRoute("/login"), { replace: true });
  }, [navigate, companyRoute]);

  const authenticatedFetch = useCallback(
    async (url, options = {}) => {
      const token = getToken();

      const headers = {
        ...(options.body instanceof FormData
          ? {}
          : { "Content-Type": "application/json" }),
        ...(options.headers || {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      let response = await fetch(url, {
        ...options,
        headers,
      });

      if (response.status === 401) {
        const refresh = getRefreshToken();

        if (!refresh) {
          logout();
          throw new Error("Your session has expired. Please sign in again.");
        }

        const refreshResponse = await fetch(
          `${API}/token/refresh/`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refresh }),
          }
        );

        if (!refreshResponse.ok) {
          logout();
          throw new Error("Your session has expired. Please sign in again.");
        }

        const refreshData = await refreshResponse.json();

        const newAccess = refreshData.access;

        if (!newAccess) {
          logout();
          throw new Error("Unable to refresh your session.");
        }

        localStorage.setItem("access_token", newAccess);
        localStorage.setItem("access", newAccess);

        response = await fetch(url, {
          ...options,
          headers: {
            ...headers,
            Authorization: `Bearer ${newAccess}`,
          },
        });
      }

      if (!response.ok) {
        let message = `Request failed (${response.status}).`;

        try {
          const data = await response.json();

          message =
            data.detail ||
            data.message ||
            data.error ||
            Object.values(data)
              .flat()
              .filter(Boolean)
              .join(" ") ||
            message;
        } catch {
          // Keep the default response error.
        }

        throw new Error(message);
      }

      if (response.status === 204) return {};

      const contentType = response.headers.get("content-type") || "";

      if (contentType.includes("application/json")) {
        return response.json();
      }

      return {};
    },
    [logout]
  );

  const applyTheme = useCallback((settings) => {
    const root = document.documentElement;

    root.style.setProperty(
      "--company-primary",
      settings.primary_color || DEFAULT_SETTINGS.primary_color
    );

    root.style.setProperty(
      "--company-secondary",
      settings.secondary_color || DEFAULT_SETTINGS.secondary_color
    );

    root.style.setProperty(
      "--company-background",
      settings.background_color || DEFAULT_SETTINGS.background_color
    );

    // Fill/interior color for components that use this variable.
    root.style.setProperty(
      "--company-border-color",
      settings.border_color || DEFAULT_SETTINGS.border_color
    );

    // Actual CSS border-line color is intentionally separate.
    root.style.setProperty(
      "--company-border-line-color",
      settings.border_line_color ||
        DEFAULT_SETTINGS.border_line_color
    );

    root.style.setProperty(
      "--company-border-style",
      settings.border_style || DEFAULT_SETTINGS.border_style
    );

    root.style.setProperty(
      "--company-border-width",
      `${Number(settings.border_width ?? 1)}px`
    );
  }, []);

  const loadDashboard = useCallback(
    async (showRefresh = false) => {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      try {
        const result = await authenticatedFetch(
          `${API}/company/dashboard/`
        );

        const normalizedReports = getReportsFromDashboard(result);
        const normalizedUsers = getCustomerAccounts(result);
        const normalizedStaff = getStaffAccounts(result);

        const normalizedMatches = safeArray(result?.matches);
        const normalizedActivity = safeArray(
          firstValue(
            result?.recent_activity,
            result?.activity,
            []
          )
        );

        setDashboard({
          ...EMPTY_DASHBOARD,
          ...result,
          company: result?.company || {},
          user: result?.user || {},
          stats: result?.stats || result?.statistics || {},
          recent_reports: normalizedReports,
          reports: normalizedReports,
          users: normalizedUsers,
          staff_members: normalizedStaff,
          matches: normalizedMatches,
          activity: normalizedActivity,
        });

        setReports(normalizedReports);
        setUsers(normalizedUsers);
        setStaffMembers(normalizedStaff);
        setMatches(normalizedMatches);
        setActivity(normalizedActivity);

        const company = result?.company || {};

        setProfileForm({
          name: company.name || company.company_name || "",
          email: company.email || "",
          phone: company.phone || company.phone_number || "",
          location: company.location || company.address || "",
          website: company.website || "",
          description: company.description || "",
        });

        const slug =
          company.slug ||
          activeCompanySlug;

        if (slug) {
          localStorage.setItem("companySlug", slug);
          localStorage.setItem("company_slug", slug);
        }
      } catch (requestError) {
        setError(
          requestError.message ||
            "Unable to load the company dashboard."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [authenticatedFetch, activeCompanySlug]
  );

  const loadWebsiteSettings = useCallback(async () => {
    try {
      const result = await authenticatedFetch(
        `${API}/company/website-settings/`
      );

      const settings =
        result?.settings ||
        result?.website_settings ||
        result ||
        {};

      const merged = {
        ...DEFAULT_SETTINGS,
        ...settings,
      };

      setWebsiteSettings(merged);
      applyTheme(merged);

      if (activeCompanySlug) {
        localStorage.setItem(
          `company_website_settings_${activeCompanySlug}`,
          JSON.stringify(merged)
        );
      }
    } catch {
      // If the API is unavailable, use saved settings as a fallback.
      try {
        const cached = activeCompanySlug
          ? localStorage.getItem(
              `company_website_settings_${activeCompanySlug}`
            )
          : null;

        if (cached) {
          const merged = {
            ...DEFAULT_SETTINGS,
            ...JSON.parse(cached),
          };

          setWebsiteSettings(merged);
          applyTheme(merged);
        }
      } catch {
        setWebsiteSettings(DEFAULT_SETTINGS);
        applyTheme(DEFAULT_SETTINGS);
      }
    }
  }, [authenticatedFetch, activeCompanySlug, applyTheme]);

  useEffect(() => {
    loadDashboard();
    loadWebsiteSettings();
  }, [loadDashboard, loadWebsiteSettings]);

  useEffect(() => {
    const handleSettingsUpdate = (event) => {
      const updated = {
        ...DEFAULT_SETTINGS,
        ...(event?.detail || {}),
      };

      setWebsiteSettings(updated);
      applyTheme(updated);
    };

    window.addEventListener(
      "companyWebsiteSettingsUpdated",
      handleSettingsUpdate
    );

    return () => {
      window.removeEventListener(
        "companyWebsiteSettingsUpdated",
        handleSettingsUpdate
      );
    };
  }, [applyTheme]);

  /*
   * Stats are normalized to support both the original backend names
   * (lost, found, matched, pending, recovered, staff, customers)
   * and the names previously expected by the frontend.
   */
  const stats = useMemo(() => {
    const backend = dashboard.stats || {};

    const lostReports = reports.filter(
      (report) => getReportType(report) === "Lost"
    );

    const foundReports = reports.filter(
      (report) => getReportType(report) === "Found"
    );

    const recoveredReports = reports.filter((report) =>
      isRecovered(report.status)
    );

    const pendingReports = reports.filter((report) =>
      isPending(report.status)
    );

    const pendingMatches = matches.filter(
      (match) =>
        !isTerminalMatch(match) &&
        normalizeStatus(match.status).toLowerCase() === "pending"
    );

    const activeMatches = matches.filter(
      (match) => !isTerminalMatch(match)
    );

    const backendLost = toNumber(
      backend.lost_items,
      backend.total_lost_items,
      backend.lost_count,
      backend.lost
    );

    const backendFound = toNumber(
      backend.found_items,
      backend.total_found_items,
      backend.found_count,
      backend.found
    );

    const backendMatches = toNumber(
      backend.potential_matches,
      backend.total_matches,
      backend.matches,
      backend.matched
    );

    const backendRecovered = toNumber(
      backend.recovered_items,
      backend.recovered,
      backend.resolved_items
    );

    const backendPending = toNumber(
      backend.pending_items,
      backend.pending
    );

    const backendStaff = toNumber(
      backend.staff_members,
      backend.total_staff,
      backend.staff
    );

    const backendCustomers = toNumber(
      backend.company_users,
      backend.customers,
      backend.total_customers
    );

    return {
      lost:
        backendLost !== null
          ? backendLost
          : lostReports.length,

      found:
        backendFound !== null
          ? backendFound
          : foundReports.length,

      matches:
        backendMatches !== null
          ? backendMatches
          : activeMatches.length,

      recovered:
        backendRecovered !== null
          ? backendRecovered
          : recoveredReports.length,

      pending:
        backendPending !== null
          ? backendPending
          : pendingReports.length + pendingMatches.length,

      staff:
        backendStaff !== null
          ? backendStaff
          : staffMembers.length,

      customers:
        backendCustomers !== null
          ? backendCustomers
          : users.length,

      totalReports:
        toNumber(backend.total_reports) ??
        reports.length,
    };
  }, [dashboard.stats, reports, matches, staffMembers.length, users.length]);

  const filteredReports = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return reports.filter((report) => {
      const type = getReportType(report);
      const status = getReportStatus(report).toLowerCase();

      const matchesType =
        reportFilter === "all" ||
        type.toLowerCase() === reportFilter.toLowerCase();

      const matchesSearch =
        !query ||
        [
          getReportTitle(report),
          report.category,
          report.location,
          report.location_found,
          report.description,
          getPersonName(report.reporter),
          getPersonName(report.user),
          report.status,
        ]
          .filter(Boolean)
          .some((value) =>
            String(value).toLowerCase().includes(query)
          );

      return matchesType && matchesSearch && Boolean(status);
    });
  }, [reports, reportFilter, searchTerm]);

  const filteredUsers = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return users.filter((person) => {
      const role = String(person?.role || "user").toLowerCase();

      const matchesRole =
        userFilter === "all" ||
        role === userFilter.toLowerCase();

      const matchesSearch =
        !query ||
        [
          getPersonName(person),
          getPersonEmail(person),
          person?.username,
          person?.phone,
        ]
          .filter(Boolean)
          .some((value) =>
            String(value).toLowerCase().includes(query)
          );

      return matchesRole && matchesSearch;
    });
  }, [users, searchTerm, userFilter]);

  const openReports = (filter = "all") => {
    setReportFilter(filter);
    setSearchTerm("");
    setActiveTab("reports");
  };

  const openUsers = () => {
    setSearchTerm("");
    setActiveTab("users");
  };

  const openStaff = () => {
    setSearchTerm("");
    setActiveTab("staff");
  };

  const openMatches = () => {
    setSearchTerm("");
    setActiveTab("matches");
  };

  const saveWebsiteSettings = async (event) => {
    event.preventDefault();
    setSavingSettings(true);
    setSettingsMessage("");

    try {
      const result = await authenticatedFetch(
        `${API}/company/website-settings/`,
        {
          method: "PUT",
          body: JSON.stringify(websiteSettings),
        }
      );

      const savedSettings = {
        ...DEFAULT_SETTINGS,
        ...websiteSettings,
        ...(result?.settings || result?.website_settings || {}),
      };

      setWebsiteSettings(savedSettings);
      applyTheme(savedSettings);

      if (activeCompanySlug) {
        localStorage.setItem(
          `company_website_settings_${activeCompanySlug}`,
          JSON.stringify(savedSettings)
        );
      }

      window.dispatchEvent(
        new CustomEvent("companyWebsiteSettingsUpdated", {
          detail: savedSettings,
        })
      );

      setSettingsMessage("Website settings saved successfully.");
    } catch (requestError) {
      setSettingsMessage(
        requestError.message || "Could not save website settings."
      );
    } finally {
      setSavingSettings(false);
    }
  };

  const createStaff = async (event) => {
    event.preventDefault();
    setCreatingStaff(true);
    setError("");

    try {
      await authenticatedFetch(`${API}/company/staff/create/`, {
        method: "POST",
        body: JSON.stringify(staffForm),
      });

      setStaffForm({
        full_name: "",
        username: "",
        email: "",
        phone: "",
        password: "",
      });

      setShowCreateStaff(false);
      await loadDashboard(true);
    } catch (requestError) {
      setError(
        requestError.message || "Unable to create staff account."
      );
    } finally {
      setCreatingStaff(false);
    }
  };

  const deleteStaff = async (staffId) => {
    if (!staffId) {
      setError("This staff account does not have a valid ID.");
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to remove this staff member?"
    );

    if (!confirmed) return;

    setDeletingStaffId(staffId);
    setError("");

    try {
      await authenticatedFetch(
        `${API}/company/staff/${staffId}/`,
        { method: "DELETE" }
      );

      setSelectedStaff(null);
      await loadDashboard(true);
    } catch (requestError) {
      setError(
        requestError.message || "Unable to remove staff member."
      );
    } finally {
      setDeletingStaffId(null);
    }
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    setSavingProfile(true);
    setProfileMessage("");

    try {
      /*
       * This uses the existing company profile endpoint.
       * If your URL configuration uses a different profile URL,
       * change only the URL below to your current endpoint.
       */
      const result = await authenticatedFetch(
        `${API}/company/profile/`,
        {
          method: "PUT",
          body: JSON.stringify(profileForm),
        }
      );

      const company =
        result?.company ||
        result?.profile ||
        result ||
        profileForm;

      setDashboard((previous) => ({
        ...previous,
        company: {
          ...previous.company,
          ...company,
        },
      }));

      setProfileMessage("Company profile updated.");
      await loadDashboard(true);
    } catch (requestError) {
      setProfileMessage(
        requestError.message ||
          "Could not update the company profile."
      );
    } finally {
      setSavingProfile(false);
    }
  };

  const openPublicWebsite = () => {
    if (!activeCompanySlug) {
      setError("Your company slug is not available.");
      return;
    }

    navigate(`/company/${encodeURIComponent(activeCompanySlug)}`);
  };

  const openWebsitePreview = () => {
    if (!activeCompanySlug) {
      setError("Your company slug is not available.");
      return;
    }

    navigate(
      `/company/${encodeURIComponent(
        activeCompanySlug
      )}/website-preview`
    );
  };

  const navigationItems = [
    {
      id: "overview",
      label: "Overview",
      icon: LayoutDashboard,
    },
    {
      id: "reports",
      label: "Item reports",
      icon: Package,
    },
    {
      id: "matches",
      label: "Potential matches",
      icon: CheckCircle2,
    },
    {
      id: "users",
      label: "Company users",
      icon: Users,
    },
    {
      id: "staff",
      label: "Staff members",
      icon: ShieldCheck,
    },
    {
      id: "website",
      label: "Website settings",
      icon: Globe,
    },
    {
      id: "profile",
      label: "Company profile",
      icon: Settings,
    },
  ];

  const companyName =
    dashboard.company?.name ||
    dashboard.company?.company_name ||
    "Company Dashboard";

  const renderReportTable = (rows) => (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[700px] text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-5 py-3 font-semibold">Item</th>
            <th className="px-5 py-3 font-semibold">Type</th>
            <th className="px-5 py-3 font-semibold">Status</th>
            <th className="px-5 py-3 font-semibold">Location</th>
            <th className="px-5 py-3 font-semibold">Date</th>
            <th className="px-5 py-3 font-semibold">Details</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100">
          {rows.map((report, index) => (
            <tr
              key={`${getReportType(report)}-${report.id ?? index}`}
              onClick={() => setSelectedReport(report)}
              className="cursor-pointer transition hover:bg-blue-50/70"
              title="Click to inspect this item report"
            >
              <td className="px-5 py-4">
                <div className="font-semibold text-slate-900">
                  {getReportTitle(report)}
                </div>
                <div className="mt-1 max-w-xs truncate text-xs text-slate-500">
                  {report.category || "Uncategorized"}
                </div>
              </td>

              <td className="px-5 py-4">
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                    getReportType(report) === "Lost"
                      ? "bg-orange-100 text-orange-800"
                      : getReportType(report) === "Found"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {getReportType(report)}
                </span>
              </td>

              <td className="px-5 py-4">
                <StatusBadge status={getReportStatus(report)} />
              </td>

              <td className="px-5 py-4 text-slate-600">
                {report.location ||
                  report.location_found ||
                  "—"}
              </td>

              <td className="px-5 py-4 text-slate-600">
                {formatDate(getReportDate(report))}
              </td>

              <td className="px-5 py-4">
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    setSelectedReport(report);
                  }}
                  className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-800"
                >
                  <Eye size={15} />
                  View
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {rows.length === 0 && (
        <div className="p-5">
          <EmptyState
            title="No reports found"
            description="There are no item reports matching this view."
          />
        </div>
      )}
    </div>
  );

  const renderUsersTable = () => (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[700px] text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-5 py-3 font-semibold">Customer</th>
            <th className="px-5 py-3 font-semibold">Email</th>
            <th className="px-5 py-3 font-semibold">Role</th>
            <th className="px-5 py-3 font-semibold">Items</th>
            <th className="px-5 py-3 font-semibold">Joined</th>
            <th className="px-5 py-3 font-semibold">Action</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100">
          {filteredUsers.map((person, index) => {
            const personItems = getCustomerItems(person);
            const lostCount = personItems.filter(
              (item) => getReportType(item) === "Lost"
            ).length;
            const foundCount = personItems.filter(
              (item) => getReportType(item) === "Found"
            ).length;

            return (
              <tr
                key={getPersonId(person) ?? `${getPersonEmail(person)}-${index}`}
                onClick={() => setSelectedUser(person)}
                className="cursor-pointer transition hover:bg-blue-50/70"
                title="Click to inspect this customer"
              >
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">
                      {getPersonName(person).charAt(0).toUpperCase()}
                    </div>

                    <div>
                      <div className="font-semibold text-slate-900">
                        {getPersonName(person)}
                      </div>

                      <div className="text-xs text-slate-500">
                        @{person.username || "no-username"}
                      </div>
                    </div>
                  </div>
                </td>

                <td className="px-5 py-4 text-slate-600">
                  {getPersonEmail(person) || "—"}
                </td>

                <td className="px-5 py-4">
                  <StatusBadge status={person.role || "user"} />
                </td>

                <td className="px-5 py-4">
                  <div className="font-medium text-slate-800">
                    {personItems.length}
                  </div>
                  <div className="text-xs text-slate-500">
                    {lostCount} lost · {foundCount} found
                  </div>
                </td>

                <td className="px-5 py-4 text-slate-600">
                  {formatDate(
                    firstValue(
                      person.date_joined,
                      person.created_at,
                      person.joined_at
                    )
                  )}
                </td>

                <td className="px-5 py-4">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      setSelectedUser(person);
                    }}
                    className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-800"
                  >
                    <Eye size={15} />
                    Inspect
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {filteredUsers.length === 0 && (
        <div className="p-5">
          <EmptyState
            title="No customers found"
            description="No customer accounts match your search."
          />
        </div>
      )}
    </div>
  );

  const renderMatchesTable = () => (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[700px] text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-5 py-3 font-semibold">Lost item</th>
            <th className="px-5 py-3 font-semibold">Found item</th>
            <th className="px-5 py-3 font-semibold">Status</th>
            <th className="px-5 py-3 font-semibold">Match score</th>
            <th className="px-5 py-3 font-semibold">Updated</th>
            <th className="px-5 py-3 font-semibold">Action</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100">
          {matches.map((match, index) => (
            <tr
              key={match.id ?? index}
              onClick={() => setSelectedMatch(match)}
              className="cursor-pointer transition hover:bg-blue-50/70"
            >
              <td className="px-5 py-4 font-medium text-slate-900">
                {getReportTitle(match.lost_item || {})}
              </td>

              <td className="px-5 py-4 font-medium text-slate-900">
                {getReportTitle(match.found_item || {})}
              </td>

              <td className="px-5 py-4">
                <StatusBadge status={match.status || "Pending"} />
              </td>

              <td className="px-5 py-4 text-slate-600">
                {firstValue(
                  match.confidence_score,
                  match.match_score,
                  match.score
                ) !== undefined
                  ? `${Math.round(
                      Number(
                        firstValue(
                          match.confidence_score,
                          match.match_score,
                          match.score
                        )
                      )
                    )}%`
                  : "—"}
              </td>

              <td className="px-5 py-4 text-slate-600">
                {formatDate(
                  firstValue(
                    match.updated_at,
                    match.created_at
                  )
                )}
              </td>

              <td className="px-5 py-4">
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    setSelectedMatch(match);
                  }}
                  className="font-semibold text-blue-600 hover:text-blue-800"
                >
                  View details
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {matches.length === 0 && (
        <div className="p-5">
          <EmptyState
            title="No potential matches"
            description="Potential item matches will appear here when available."
          />
        </div>
      )}
    </div>
  );

  const renderOverview = () => (
    <div className="space-y-7">
      <div>
        <h2 className="text-xl font-bold text-slate-900">
          Dashboard overview
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Monitor reports, customers, matches, and recovery activity.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Lost items"
          value={stats.lost}
          icon={Package}
          color="amber"
          description="View lost item reports"
          onClick={() => openReports("lost")}
        />

        <StatCard
          title="Found items"
          value={stats.found}
          icon={CheckCircle2}
          color="green"
          description="View found item reports"
          onClick={() => openReports("found")}
        />

        <StatCard
          title="Potential matches"
          value={stats.matches}
          icon={Activity}
          color="purple"
          description="Inspect item matches"
          onClick={openMatches}
        />

        <StatCard
          title="Recovered items"
          value={stats.recovered}
          icon={ShieldCheck}
          color="green"
          description="View recovered reports"
          onClick={() => {
            setReportFilter("all");
            setSearchTerm("");
            setActiveTab("reports");
          }}
        />

        <StatCard
          title="Pending"
          value={stats.pending}
          icon={Clock}
          color="amber"
          description="Inspect pending reports"
          onClick={() => {
            setReportFilter("all");
            setSearchTerm("pending");
            setActiveTab("reports");
          }}
        />

        <StatCard
          title="Staff members"
          value={stats.staff}
          icon={ShieldCheck}
          color="blue"
          description="Manage company staff"
          onClick={openStaff}
        />

        <StatCard
          title="Company users"
          value={stats.customers}
          icon={Users}
          color="purple"
          description="Inspect customer accounts"
          onClick={openUsers}
        />

        <StatCard
          title="Total reports"
          value={stats.totalReports}
          icon={FileText}
          color="slate"
          description="View all item reports"
          onClick={() => openReports("all")}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white xl:col-span-2">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
            <div>
              <h3 className="font-bold text-slate-900">
                Recent item reports
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Select any row to see full details.
              </p>
            </div>

            <button
              type="button"
              onClick={() => openReports("all")}
              className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-800"
            >
              View all <ChevronRight size={16} />
            </button>
          </div>

          {renderReportTable(reports.slice(0, 5))}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white">
          <div className="border-b border-slate-100 px-5 py-4">
            <h3 className="font-bold text-slate-900">
              Quick actions
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Open important parts of your dashboard.
            </p>
          </div>

          <div className="space-y-2 p-4">
            <button
              type="button"
              onClick={() => openReports("all")}
              className="flex w-full items-center gap-3 rounded-xl p-3 text-left transition hover:bg-slate-50"
            >
              <span className="rounded-lg bg-blue-50 p-2 text-blue-600">
                <FileText size={19} />
              </span>
              <span className="flex-1">
                <span className="block text-sm font-semibold text-slate-800">
                  Manage reports
                </span>
                <span className="text-xs text-slate-500">
                  Inspect lost and found items
                </span>
              </span>
              <ChevronRight size={17} className="text-slate-400" />
            </button>

            <button
              type="button"
              onClick={openMatches}
              className="flex w-full items-center gap-3 rounded-xl p-3 text-left transition hover:bg-slate-50"
            >
              <span className="rounded-lg bg-purple-50 p-2 text-purple-600">
                <Activity size={19} />
              </span>
              <span className="flex-1">
                <span className="block text-sm font-semibold text-slate-800">
                  Inspect matches
                </span>
                <span className="text-xs text-slate-500">
                  Review potential item matches
                </span>
              </span>
              <ChevronRight size={17} className="text-slate-400" />
            </button>

            <button
              type="button"
              onClick={openUsers}
              className="flex w-full items-center gap-3 rounded-xl p-3 text-left transition hover:bg-slate-50"
            >
              <span className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
                <Users size={19} />
              </span>
              <span className="flex-1">
                <span className="block text-sm font-semibold text-slate-800">
                  Inspect customers
                </span>
                <span className="text-xs text-slate-500">
                  See customer reports and activity
                </span>
              </span>
              <ChevronRight size={17} className="text-slate-400" />
            </button>

            <button
              type="button"
              onClick={() => setShowCreateStaff(true)}
              className="flex w-full items-center gap-3 rounded-xl p-3 text-left transition hover:bg-slate-50"
            >
              <span className="rounded-lg bg-amber-50 p-2 text-amber-600">
                <UserPlus size={19} />
              </span>
              <span className="flex-1">
                <span className="block text-sm font-semibold text-slate-800">
                  Add staff member
                </span>
                <span className="text-xs text-slate-500">
                  Create a company staff account
                </span>
              </span>
              <ChevronRight size={17} className="text-slate-400" />
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("website")}
              className="flex w-full items-center gap-3 rounded-xl p-3 text-left transition hover:bg-slate-50"
            >
              <span className="rounded-lg bg-slate-100 p-2 text-slate-700">
                <Globe size={19} />
              </span>
              <span className="flex-1">
                <span className="block text-sm font-semibold text-slate-800">
                  Website settings
                </span>
                <span className="text-xs text-slate-500">
                  Customize your public company page
                </span>
              </span>
              <ChevronRight size={17} className="text-slate-400" />
            </button>
          </div>
        </section>
      </div>
    </div>
  );

  const renderReports = () => (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="flex flex-col gap-4 border-b border-slate-100 p-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Item reports
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Click a report to inspect the item, reporter, and recovery status.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search reports..."
              className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-blue-500 sm:w-56"
            />
          </div>

          <select
            value={reportFilter}
            onChange={(event) => setReportFilter(event.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
          >
            <option value="all">All reports</option>
            <option value="lost">Lost items</option>
            <option value="found">Found items</option>
          </select>
        </div>
      </div>

      {renderReportTable(filteredReports)}
    </section>
  );

  const renderUsers = () => (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Company users
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Click a customer to inspect their reports, matches, and activity.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search customers..."
              className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-blue-500 sm:w-56"
            />
          </div>

          <select
            value={userFilter}
            onChange={(event) => setUserFilter(event.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
          >
            <option value="all">All customers</option>
            <option value="user">Users</option>
            <option value="customer">Customers</option>
          </select>
        </div>
      </div>

      {renderUsersTable()}
    </section>
  );

  const renderStaff = () => (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Staff members
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Inspect staff accounts or remove a staff member.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowCreateStaff(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          <Plus size={17} />
          Add staff
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[650px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-5 py-3 font-semibold">Staff member</th>
              <th className="px-5 py-3 font-semibold">Email</th>
              <th className="px-5 py-3 font-semibold">Role</th>
              <th className="px-5 py-3 font-semibold">Status</th>
              <th className="px-5 py-3 font-semibold">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {staffMembers.map((staff, index) => (
              <tr
                key={getPersonId(staff) ?? index}
                onClick={() => setSelectedStaff(staff)}
                className="cursor-pointer transition hover:bg-blue-50/70"
              >
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">
                      {getPersonName(staff).charAt(0).toUpperCase()}
                    </div>

                    <div>
                      <div className="font-semibold text-slate-900">
                        {getPersonName(staff)}
                      </div>
                      <div className="text-xs text-slate-500">
                        @{staff.username || "no-username"}
                      </div>
                    </div>
                  </div>
                </td>

                <td className="px-5 py-4 text-slate-600">
                  {getPersonEmail(staff) || "—"}
                </td>

                <td className="px-5 py-4">
                  <StatusBadge status={staff.role || "staff"} />
                </td>

                <td className="px-5 py-4">
                  <StatusBadge
                    status={staff.is_active === false ? "Inactive" : "Active"}
                  />
                </td>

                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        setSelectedStaff(staff);
                      }}
                      className="font-semibold text-blue-600 hover:text-blue-800"
                    >
                      Inspect
                    </button>

                    <button
                      type="button"
                      disabled={
                        deletingStaffId === getPersonId(staff)
                      }
                      onClick={(event) => {
                        event.stopPropagation();
                        deleteStaff(getPersonId(staff));
                      }}
                      className="inline-flex items-center gap-1 font-semibold text-red-600 hover:text-red-800 disabled:opacity-50"
                    >
                      {deletingStaffId === getPersonId(staff) ? (
                        <Loader2 size={15} className="animate-spin" />
                      ) : (
                        <Trash2 size={15} />
                      )}
                      Remove
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {staffMembers.length === 0 && (
        <div className="p-5">
          <EmptyState
            title="No staff members found"
            description="Add staff members to help manage company reports."
          />
        </div>
      )}
    </section>
  );

  const renderWebsiteSettings = () => (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Website settings
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Customize the appearance and sections of your TrustFound company page.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={openWebsitePreview}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Eye size={16} />
            Preview
          </button>

          <button
            type="button"
            onClick={openPublicWebsite}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Globe size={16} />
            Open website
          </button>
        </div>
      </div>

      <form onSubmit={saveWebsiteSettings} className="space-y-7">
        <div>
          <h3 className="mb-4 font-bold text-slate-800">
            Website colors
          </h3>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              ["primary_color", "Primary color"],
              ["secondary_color", "Secondary color"],
              ["background_color", "Background color"],
              ["border_color", "Border fill / interior color"],
              ["border_line_color", "Border line color"],
            ].map(([key, label]) => (
              <label key={key} className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">
                  {label}
                </span>

                <div className="flex items-center gap-3 rounded-xl border border-slate-200 p-3">
                  <input
                    type="color"
                    value={websiteSettings[key] || "#ffffff"}
                    onChange={(event) =>
                      setWebsiteSettings((previous) => {
                        const updated = {
                          ...previous,
                          [key]: event.target.value,
                        };

                        applyTheme(updated);
                        return updated;
                      })
                    }
                    className="h-10 w-12 cursor-pointer rounded border-0 bg-transparent p-0"
                  />

                  <input
                    value={websiteSettings[key] || ""}
                    onChange={(event) =>
                      setWebsiteSettings((previous) => {
                        const updated = {
                          ...previous,
                          [key]: event.target.value,
                        };

                        applyTheme(updated);
                        return updated;
                      })
                    }
                    className="min-w-0 flex-1 text-sm outline-none"
                    placeholder="#2563eb"
                  />
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">
              Border style
            </span>

            <select
              value={websiteSettings.border_style || "solid"}
              onChange={(event) =>
                setWebsiteSettings((previous) => ({
                  ...previous,
                  border_style: event.target.value,
                }))
              }
              className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-blue-500"
            >
              <option value="solid">Solid</option>
              <option value="dashed">Dashed</option>
              <option value="dotted">Dotted</option>
              <option value="double">Double</option>
              <option value="none">None</option>
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">
              Border width (px)
            </span>

            <input
              type="number"
              min="0"
              max="12"
              value={websiteSettings.border_width ?? 1}
              onChange={(event) =>
                setWebsiteSettings((previous) => ({
                  ...previous,
                  border_width: Number(event.target.value),
                }))
              }
              className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-blue-500"
            />
          </label>
        </div>

        <div>
          <h3 className="mb-4 font-bold text-slate-800">
            Website sections
          </h3>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[
              ["show_about", "Show About section"],
              ["show_featured_items", "Show featured items"],
              ["show_contact", "Show contact information"],
              ["is_published", "Publish company website"],
            ].map(([key, label]) => (
              <label
                key={key}
                className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 p-4 transition hover:bg-slate-50"
              >
                <input
                  type="checkbox"
                  checked={Boolean(websiteSettings[key])}
                  onChange={(event) =>
                    setWebsiteSettings((previous) => ({
                      ...previous,
                      [key]: event.target.checked,
                    }))
                  }
                  className="h-4 w-4 rounded border-slate-300 text-blue-600"
                />

                <span className="text-sm font-medium text-slate-700">
                  {label}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div
          className="rounded-2xl p-5"
          style={{
            background: websiteSettings.background_color,
            borderColor: websiteSettings.border_line_color,
            borderStyle: websiteSettings.border_style,
            borderWidth: `${Number(
              websiteSettings.border_width ?? 1
            )}px`,
          }}
        >
          <p
            className="text-sm font-semibold"
            style={{ color: websiteSettings.secondary_color }}
          >
            Website preview
          </p>

          <h3
            className="mt-2 text-xl font-bold"
            style={{ color: websiteSettings.primary_color }}
          >
            {companyName}
          </h3>

          <p
            className="mt-2 text-sm"
            style={{ color: websiteSettings.secondary_color }}
          >
            {dashboard.company?.description ||
              "Your company website preview will appear here."}
          </p>

          <button
            type="button"
            className="mt-4 rounded-lg px-4 py-2 text-sm font-semibold text-white"
            style={{
              background: websiteSettings.primary_color,
            }}
          >
            Example button
          </button>
        </div>

        {settingsMessage && (
          <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
            {settingsMessage}
          </p>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={savingSettings}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
          >
            {savingSettings ? (
              <Loader2 size={17} className="animate-spin" />
            ) : (
              <Save size={17} />
            )}
            Save website settings
          </button>
        </div>
      </form>
    </section>
  );

  const renderProfile = () => (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
      <h2 className="text-xl font-bold text-slate-900">
        Company profile
      </h2>

      <p className="mt-1 text-sm text-slate-500">
        Review and update your company information.
      </p>

      <form
        onSubmit={saveProfile}
        className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2"
      >
        {[
          ["name", "Company name", "text"],
          ["email", "Company email", "email"],
          ["phone", "Phone number", "tel"],
          ["location", "Location", "text"],
          ["website", "Website URL", "url"],
        ].map(([key, label, type]) => (
          <label key={key} className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">
              {label}
            </span>

            <input
              type={type}
              value={profileForm[key] || ""}
              onChange={(event) =>
                setProfileForm((previous) => ({
                  ...previous,
                  [key]: event.target.value,
                }))
              }
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
            />
          </label>
        ))}

        <label className="block sm:col-span-2">
          <span className="mb-2 block text-sm font-medium text-slate-700">
            Company description
          </span>

          <textarea
            rows={4}
            value={profileForm.description || ""}
            onChange={(event) =>
              setProfileForm((previous) => ({
                ...previous,
                description: event.target.value,
              }))
            }
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
          />
        </label>

        {profileMessage && (
          <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-700 sm:col-span-2">
            {profileMessage}
          </p>
        )}

        <div className="flex justify-end sm:col-span-2">
          <button
            type="submit"
            disabled={savingProfile}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {savingProfile ? (
              <Loader2 size={17} className="animate-spin" />
            ) : (
              <Save size={17} />
            )}
            Save profile
          </button>
        </div>
      </form>
    </section>
  );

  const renderActivity = (entries) => {
    if (!entries.length) {
      return (
        <EmptyState
          title="No activity available"
          description="Activity will appear here when this account has report or recovery history."
        />
      );
    }

    return (
      <div className="space-y-3">
        {entries.map((entry, index) => (
          <div
            key={entry.id ?? index}
            className="flex gap-3 rounded-xl border border-slate-100 p-3"
          >
            <div className="mt-0.5 rounded-lg bg-blue-50 p-2 text-blue-600">
              <Activity size={17} />
            </div>

            <div className="min-w-0 flex-1">
              <p className="font-medium text-slate-800">
                {firstValue(
                  entry.title,
                  entry.description,
                  entry.message,
                  entry.action,
                  entry.notification_type,
                  "Account activity"
                )}
              </p>

              {entry.message &&
                entry.title &&
                entry.message !== entry.title && (
                  <p className="mt-1 text-sm text-slate-500">
                    {entry.message}
                  </p>
                )}

              <p className="mt-1 text-xs text-slate-400">
                {formatDateTime(
                  firstValue(
                    entry.created_at,
                    entry.timestamp,
                    entry.date
                  )
                )}
              </p>
            </div>

            {entry.status && (
              <StatusBadge status={entry.status} />
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderUserModal = () => {
    if (!selectedUser) return null;

    const personItems = getCustomerItems(selectedUser);
    const personMatches = getCustomerMatches(selectedUser);
    const personActivity = getCustomerActivity(selectedUser);

    const lostItems = personItems.filter(
      (item) => getReportType(item) === "Lost"
    );

    const foundItems = personItems.filter(
      (item) => getReportType(item) === "Found"
    );

    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-3 sm:p-6"
        onClick={() => setSelectedUser(null)}
      >
        <div
          className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-200 bg-white p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-lg font-bold text-blue-700">
                {getPersonName(selectedUser).charAt(0).toUpperCase()}
              </div>

              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {getPersonName(selectedUser)}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {getPersonEmail(selectedUser) || "No email available"}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedUser(null)}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              aria-label="Close customer details"
            >
              <X size={21} />
            </button>
          </div>

          <div className="space-y-6 p-5">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {[
                ["Lost reports", lostItems.length],
                ["Found reports", foundItems.length],
                ["Potential matches", personMatches.length],
                ["Activity records", personActivity.length],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-xl border border-slate-200 p-4"
                >
                  <p className="text-sm text-slate-500">{label}</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">
                    {value}
                  </p>
                </div>
              ))}
            </div>

            <section>
              <h3 className="mb-3 flex items-center gap-2 font-bold text-slate-900">
                <User size={18} />
                Account information
              </h3>

              <div className="grid grid-cols-1 gap-3 rounded-xl bg-slate-50 p-4 sm:grid-cols-2">
                <p className="text-sm text-slate-600">
                  <strong className="text-slate-800">Username:</strong>{" "}
                  {selectedUser.username || "—"}
                </p>

                <p className="text-sm text-slate-600">
                  <strong className="text-slate-800">Email:</strong>{" "}
                  {getPersonEmail(selectedUser) || "—"}
                </p>

                <p className="text-sm text-slate-600">
                  <strong className="text-slate-800">Phone:</strong>{" "}
                  {selectedUser.phone ||
                    selectedUser.phone_number ||
                    "—"}
                </p>

                <p className="text-sm text-slate-600">
                  <strong className="text-slate-800">Role:</strong>{" "}
                  {selectedUser.role || "user"}
                </p>

                <p className="text-sm text-slate-600">
                  <strong className="text-slate-800">Joined:</strong>{" "}
                  {formatDate(
                    firstValue(
                      selectedUser.date_joined,
                      selectedUser.created_at
                    )
                  )}
                </p>

                <p className="text-sm text-slate-600">
                  <strong className="text-slate-800">Account status:</strong>{" "}
                  {selectedUser.is_active === false
                    ? "Inactive"
                    : "Active"}
                </p>
              </div>
            </section>

            <section>
              <h3 className="mb-3 flex items-center gap-2 font-bold text-slate-900">
                <Package size={18} />
                Lost and found items
              </h3>

              {personItems.length ? (
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full min-w-[650px] text-left text-sm">
                    <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                      <tr>
                        <th className="px-4 py-3">Item</th>
                        <th className="px-4 py-3">Type</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">Action</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      {personItems.map((item, index) => (
                        <tr key={item.id ?? index}>
                          <td className="px-4 py-3">
                            <p className="font-semibold text-slate-800">
                              {getReportTitle(item)}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              {item.category || "Uncategorized"}
                            </p>
                          </td>

                          <td className="px-4 py-3">
                            {getReportType(item)}
                          </td>

                          <td className="px-4 py-3">
                            <StatusBadge status={getReportStatus(item)} />
                          </td>

                          <td className="px-4 py-3 text-slate-600">
                            {formatDate(getReportDate(item))}
                          </td>

                          <td className="px-4 py-3">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedUser(null);
                                setSelectedReport(item);
                              }}
                              className="font-semibold text-blue-600 hover:text-blue-800"
                            >
                              Inspect
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState
                  title="No item reports"
                  description="No lost or found items are attached to this customer record."
                />
              )}
            </section>

            <section>
              <h3 className="mb-3 flex items-center gap-2 font-bold text-slate-900">
                <CheckCircle2 size={18} />
                Potential matches
              </h3>

              {personMatches.length ? (
                <div className="space-y-3">
                  {personMatches.map((match, index) => (
                    <button
                      type="button"
                      key={match.id ?? index}
                      onClick={() => {
                        setSelectedUser(null);
                        setSelectedMatch(match);
                      }}
                      className="flex w-full items-center justify-between gap-4 rounded-xl border border-slate-200 p-4 text-left transition hover:border-blue-300 hover:bg-blue-50/50"
                    >
                      <div>
                        <p className="font-semibold text-slate-800">
                          {getReportTitle(match.lost_item || {})}
                          {" ↔ "}
                          {getReportTitle(match.found_item || {})}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          Updated {formatDate(match.updated_at || match.created_at)}
                        </p>
                      </div>

                      <StatusBadge status={match.status || "Pending"} />
                    </button>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No matches attached"
                  description="No potential matches are available in this customer's record."
                />
              )}
            </section>

            <section>
              <h3 className="mb-3 flex items-center gap-2 font-bold text-slate-900">
                <History size={18} />
                Account activity
              </h3>

              {renderActivity(personActivity)}
            </section>
          </div>
        </div>
      </div>
    );
  };

  const renderReportModal = () => {
    if (!selectedReport) return null;

    const report = selectedReport;

    const details = [
      ["Report type", getReportType(report)],
      ["Status", getReportStatus(report)],
      ["Category", report.category],
      ["Location", report.location || report.location_found],
      ["Date reported", formatDateTime(getReportDate(report))],
      ["Date lost", formatDateTime(report.date_lost)],
      ["Date found", formatDateTime(report.date_found)],
      ["Time lost", report.time_lost],
      ["Time found", report.time_found],
      ["Reporter", getPersonName(report.reporter || report.user)],
      ["Reporter email", getPersonEmail(report.reporter || report.user)],
      ["Contact name", report.contact_name || report.finder_name],
      ["Contact phone", report.contact_phone || report.finder_phone],
      ["Contact email", report.contact_email || report.finder_email],
      ["Reward offered", report.reward_offered],
      ["Verified at", formatDateTime(report.verified_at)],
      ["Recovered at", formatDateTime(report.recovered_at)],
      ["Created at", formatDateTime(report.created_at)],
      ["Last updated", formatDateTime(report.updated_at)],
    ];

    const imageUrl =
      report.image_url ||
      report.image ||
      report.photo_url;

    return (
      <div
        className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-3 sm:p-6"
        onClick={() => setSelectedReport(null)}
      >
        <div
          className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {getReportType(report)} item report
              </p>

              <h2 className="mt-1 text-xl font-bold text-slate-900">
                {getReportTitle(report)}
              </h2>

              <div className="mt-3">
                <StatusBadge status={getReportStatus(report)} />
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedReport(null)}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              aria-label="Close item details"
            >
              <X size={21} />
            </button>
          </div>

          <div className="space-y-5 p-5">
            {imageUrl && (
              <div className="overflow-hidden rounded-xl bg-slate-100">
                <img
                  src={imageUrl}
                  alt={getReportTitle(report)}
                  className="max-h-80 w-full object-contain"
                />
              </div>
            )}

            <section>
              <h3 className="mb-3 font-bold text-slate-900">
                Item information
              </h3>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {details
                  .filter(
                    ([, value]) =>
                      value !== undefined &&
                      value !== null &&
                      value !== ""
                  )
                  .map(([label, value]) => (
                    <div
                      key={label}
                      className="rounded-xl bg-slate-50 p-3"
                    >
                      <p className="text-xs font-medium text-slate-500">
                        {label}
                      </p>
                      <p className="mt-1 break-words text-sm font-medium text-slate-800">
                        {String(value)}
                      </p>
                    </div>
                  ))}
              </div>
            </section>

            {report.description && (
              <section>
                <h3 className="mb-2 font-bold text-slate-900">
                  Description
                </h3>
                <p className="whitespace-pre-wrap rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                  {report.description}
                </p>
              </section>
            )}

            {report.tags && (
              <section>
                <h3 className="mb-2 font-bold text-slate-900">
                  Tags
                </h3>

                <div className="flex flex-wrap gap-2">
                  {(Array.isArray(report.tags)
                    ? report.tags
                    : [report.tags]
                  ).map((tag, index) => (
                    <span
                      key={index}
                      className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700"
                    >
                      {String(tag)}
                    </span>
                  ))}
                </div>
              </section>
            )}

            <p className="text-xs text-slate-400">
              Item ID: {report.id ?? "Not provided by the API"}
            </p>
          </div>
        </div>
      </div>
    );
  };

  const renderMatchModal = () => {
    if (!selectedMatch) return null;

    const match = selectedMatch;

    const matchDetails = [
      ["Match ID", match.id],
      ["Status", match.status],
      ["Customer response", match.customer_response],
      ["Confidence score", match.confidence_score],
      ["Approved at", formatDateTime(match.approved_at)],
      ["Approved by", getPersonName(match.approved_by)],
      ["Rejected at", formatDateTime(match.rejected_at)],
      ["Rejected by", getPersonName(match.rejected_by)],
      ["Recovery requested", formatDateTime(match.recovery_requested_at)],
      ["Recovered at", formatDateTime(match.recovered_at)],
      ["Identity verified", match.identity_verified ? "Yes" : "No"],
      ["Recovery verified", match.recovery_verified ? "Yes" : "No"],
      ["Created at", formatDateTime(match.created_at)],
      ["Last updated", formatDateTime(match.updated_at)],
    ];

    const timeline = safeArray(match.timeline);

    return (
      <div
        className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-3 sm:p-6"
        onClick={() => setSelectedMatch(null)}
      >
        <div
          className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-5">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Potential match details
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Inspect both items and the match recovery history.
              </p>
              <div className="mt-3">
                <StatusBadge status={match.status || "Pending"} />
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedMatch(null)}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              aria-label="Close match details"
            >
              <X size={21} />
            </button>
          </div>

          <div className="space-y-5 p-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {[
                ["Lost item", match.lost_item],
                ["Found item", match.found_item],
              ].map(([label, item]) => (
                <div
                  key={label}
                  className="rounded-xl border border-slate-200 p-4"
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {label}
                  </p>

                  <h3 className="mt-2 font-bold text-slate-900">
                    {getReportTitle(item || {})}
                  </h3>

                  <p className="mt-1 text-sm text-slate-600">
                    {item?.description || "No description provided."}
                  </p>

                  <p className="mt-2 text-xs text-slate-500">
                    {item?.location ||
                      item?.location_found ||
                      "Location not provided"}
                  </p>

                  {item && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedMatch(null);
                        setSelectedReport(item);
                      }}
                      className="mt-3 font-semibold text-blue-600 hover:text-blue-800"
                    >
                      Inspect item
                    </button>
                  )}
                </div>
              ))}
            </div>

            <section>
              <h3 className="mb-3 font-bold text-slate-900">
                Match and recovery information
              </h3>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {matchDetails
                  .filter(
                    ([label, value]) =>
                      value !== undefined &&
                      value !== null &&
                      value !== "" &&
                      !(
                        label === "Approved by" &&
                        value === "Unknown user"
                      ) &&
                      !(
                        label === "Rejected by" &&
                        value === "Unknown user"
                      )
                  )
                  .map(([label, value]) => (
                    <div
                      key={label}
                      className="rounded-xl bg-slate-50 p-3"
                    >
                      <p className="text-xs font-medium text-slate-500">
                        {label}
                      </p>

                      <p className="mt-1 break-words text-sm font-medium text-slate-800">
                        {typeof value === "boolean"
                          ? value
                            ? "Yes"
                            : "No"
                          : String(value)}
                      </p>
                    </div>
                  ))}
              </div>
            </section>

            {match.identity_proof_notes && (
              <section>
                <h3 className="mb-2 font-bold text-slate-900">
                  Identity verification notes
                </h3>
                <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
                  {match.identity_proof_notes}
                </p>
              </section>
            )}

            <section>
              <h3 className="mb-3 flex items-center gap-2 font-bold text-slate-900">
                <History size={18} />
                Match timeline
              </h3>

              {renderActivity(timeline)}
            </section>
          </div>
        </div>
      </div>
    );
  };

  const renderStaffModal = () => {
    if (!selectedStaff) return null;

    return (
      <div
        className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-3 sm:p-6"
        onClick={() => setSelectedStaff(null)}
      >
        <div
          className="w-full max-w-xl rounded-2xl bg-white shadow-2xl"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-start justify-between border-b border-slate-200 p-5">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Staff details
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Inspect this company staff account.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setSelectedStaff(null)}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              aria-label="Close staff details"
            >
              <X size={21} />
            </button>
          </div>

          <div className="space-y-4 p-5">
            {[
              ["Name", getPersonName(selectedStaff)],
              ["Username", selectedStaff.username],
              ["Email", getPersonEmail(selectedStaff)],
              ["Phone", selectedStaff.phone || selectedStaff.phone_number],
              ["Role", selectedStaff.role],
              [
                "Account status",
                selectedStaff.is_active === false ? "Inactive" : "Active",
              ],
              [
                "Joined",
                formatDate(
                  selectedStaff.date_joined ||
                    selectedStaff.created_at
                ),
              ],
            ]
              .filter(([, value]) => value !== undefined && value !== "")
              .map(([label, value]) => (
                <div
                  key={label}
                  className="flex flex-col gap-1 border-b border-slate-100 pb-3 sm:flex-row sm:justify-between"
                >
                  <span className="text-sm text-slate-500">{label}</span>
                  <span className="break-words text-sm font-semibold text-slate-800">
                    {String(value)}
                  </span>
                </div>
              ))}

            <button
              type="button"
              disabled={!getPersonId(selectedStaff)}
              onClick={() => deleteStaff(getPersonId(selectedStaff))}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
            >
              <Trash2 size={17} />
              Remove staff member
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderCreateStaffModal = () => {
    if (!showCreateStaff) return null;

    return (
      <div
        className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/60 p-3 sm:p-6"
        onClick={() => setShowCreateStaff(false)}
      >
        <div
          className="w-full max-w-xl rounded-2xl bg-white shadow-2xl"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-start justify-between border-b border-slate-200 p-5">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Add staff member
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Create a staff account for your company.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowCreateStaff(false)}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              aria-label="Close create staff form"
            >
              <X size={21} />
            </button>
          </div>

          <form onSubmit={createStaff} className="space-y-4 p-5">
            {[
              ["full_name", "Full name", "text", true],
              ["username", "Username", "text", true],
              ["email", "Email address", "email", true],
              ["phone", "Phone number", "tel", false],
              ["password", "Temporary password", "password", true],
            ].map(([key, label, type, required]) => (
              <label key={key} className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">
                  {label}
                </span>

                <input
                  type={type}
                  required={required}
                  autoComplete={
                    key === "password" ? "new-password" : "off"
                  }
                  value={staffForm[key]}
                  onChange={(event) =>
                    setStaffForm((previous) => ({
                      ...previous,
                      [key]: event.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                />
              </label>
            ))}

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowCreateStaff(false)}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={creatingStaff}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {creatingStaff ? (
                  <Loader2 size={17} className="animate-spin" />
                ) : (
                  <UserPlus size={17} />
                )}
                Create staff
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="text-center">
          <Loader2
            size={40}
            className="mx-auto animate-spin text-blue-600"
          />
          <p className="mt-4 font-medium text-slate-700">
            Loading company dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-slate-50"
      style={{
        backgroundColor:
          websiteSettings.background_color || "#f8fafc",
      }}
    >
      <div className="flex min-h-screen">
        <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white lg:flex lg:flex-col">
          <div className="border-b border-slate-100 px-5 py-6">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-blue-600 p-2 text-white">
                <ShieldCheck size={22} />
              </div>

              <div>
                <h1 className="font-bold text-slate-900">
                  TrustFound
                </h1>
                <p className="text-xs text-slate-500">
                  Company management
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-xl bg-slate-50 p-3">
              <p className="truncate text-sm font-semibold text-slate-800">
                {companyName}
              </p>
              <p className="mt-1 truncate text-xs text-slate-500">
                {dashboard.company?.email || "Company account"}
              </p>
            </div>
          </div>

          <nav className="flex-1 space-y-1 p-3">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;

              return (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setSearchTerm("");
                  }}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition ${
                    active
                      ? "bg-blue-50 text-blue-700"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <Icon size={19} />
                  <span className="flex-1">{item.label}</span>
                  {active && (
                    <span className="h-2 w-2 rounded-full bg-blue-600" />
                  )}
                </button>
              );
            })}
          </nav>

          <div className="border-t border-slate-100 p-3">
            <button
              type="button"
              onClick={() => loadDashboard(true)}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              <RefreshCw
                size={18}
                className={refreshing ? "animate-spin" : ""}
              />
              Refresh dashboard
            </button>

            <button
              type="button"
              onClick={logout}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-red-600 hover:bg-red-50"
            >
              <LogOut size={18} />
              Sign out
            </button>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
            <div className="flex flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-blue-50 p-2 text-blue-600 lg:hidden">
                  <ShieldCheck size={22} />
                </div>

                <div>
                  <h1 className="text-xl font-bold text-slate-900">
                    {navigationItems.find(
                      (item) => item.id === activeTab
                    )?.label || "Dashboard"}
                  </h1>

                  <p className="mt-1 text-xs text-slate-500">
                    {companyName}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => loadDashboard(true)}
                  disabled={refreshing}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  <RefreshCw
                    size={16}
                    className={refreshing ? "animate-spin" : ""}
                  />
                  Refresh
                </button>

                <button
                  type="button"
                  onClick={() => setShowCreateStaff(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  <Plus size={16} />
                  Add staff
                </button>

                <button
                  type="button"
                  onClick={logout}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 lg:hidden"
                >
                  <LogOut size={16} />
                  Sign out
                </button>
              </div>
            </div>

            <div className="flex gap-2 overflow-x-auto px-4 pb-3 lg:hidden">
              {navigationItems.map((item) => {
                const Icon = item.icon;

                return (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setSearchTerm("");
                    }}
                    className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold ${
                      activeTab === item.id
                        ? "bg-blue-600 text-white"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    <Icon size={15} />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </header>

          <div className="mx-auto max-w-[1600px] space-y-6 p-4 sm:p-6 lg:p-8">
            {error && (
              <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                <AlertCircle
                  size={19}
                  className="mt-0.5 shrink-0"
                />

                <div className="flex-1">{error}</div>

                <button
                  type="button"
                  onClick={() => setError("")}
                  className="rounded p-1 hover:bg-red-100"
                  aria-label="Dismiss error"
                >
                  <X size={16} />
                </button>
              </div>
            )}

            {activeTab === "overview" && renderOverview()}
            {activeTab === "reports" && renderReports()}
            {activeTab === "matches" && (
              <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <div className="border-b border-slate-100 p-5">
                  <h2 className="text-xl font-bold text-slate-900">
                    Potential matches
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Click a match to inspect its lost item, found item, status, and timeline.
                  </p>
                </div>

                {renderMatchesTable()}
              </section>
            )}
            {activeTab === "users" && renderUsers()}
            {activeTab === "staff" && renderStaff()}
            {activeTab === "website" && renderWebsiteSettings()}
            {activeTab === "profile" && renderProfile()}

            <footer className="flex flex-col gap-2 border-t border-slate-200 py-5 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
              <p>TrustFound Notifications &amp; Company Management</p>
              <p>
                {companyName}
                {dashboard.company?.slug
                  ? ` · ${dashboard.company.slug}`
                  : ""}
              </p>
            </footer>
          </div>
        </main>
      </div>

      {renderUserModal()}
      {renderReportModal()}
      {renderMatchModal()}
      {renderStaffModal()}
      {renderCreateStaffModal()}
    </div>
  );
}