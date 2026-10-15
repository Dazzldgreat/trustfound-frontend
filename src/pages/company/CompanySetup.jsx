
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = "http://127.0.0.1:8000/api";

export default function CompanySetup() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    location: "",
    phone: "",
    email: "",
    website: "",
    description: "",
  });

  const [logo, setLogo] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    return () => {
      if (preview?.startsWith("blob:")) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    const allowedTypes = [
      "image/png",
      "image/jpeg",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      setError("Please select a PNG, JPG, or WebP image.");
      e.target.value = "";
      return;
    }

    // Release the previous preview URL when replacing the logo.
    setPreview((previous) => {
      if (previous?.startsWith("blob:")) {
        URL.revokeObjectURL(previous);
      }

      return URL.createObjectURL(file);
    });

    setLogo(file);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;

    setError("");

    if (!form.name.trim()) {
      setError("Organization name is required.");
      return;
    }

    if (!form.location.trim()) {
      setError("Organization location is required.");
      return;
    }

    if (!form.phone.trim()) {
      setError("Organization phone number is required.");
      return;
    }

    // Prefer the standard access token key used by company login.
    const token =
      localStorage.getItem("access_token") ||
      localStorage.getItem("company_access") ||
      localStorage.getItem("access");

    if (!token) {
      setError("Your session was not found. Please log in again.");
      return;
    }

    // Detect an obviously wrong token type before sending the request.
    // This does not verify the token signature.
    try {
      const parts = token.split(".");

      if (parts.length !== 3) {
        setError("Your saved access token is invalid. Please log in again.");
        return;
      }

      const base64 = parts[1]
        .replace(/-/g, "+")
        .replace(/_/g, "/");

      const payload = JSON.parse(
        atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "="))
      );

      if (payload.token_type && payload.token_type !== "access") {
        setError(
          "The saved token is not an access token. Please log in again."
        );
        return;
      }

      if (payload.exp && Date.now() >= payload.exp * 1000) {
        setError("Your access token has expired. Please log in again.");
        return;
      }
    } catch {
      setError("Your saved token cannot be read. Please log in again.");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();

      Object.entries(form).forEach(([key, value]) => {
        formData.append(key, value.trim());
      });

      if (logo) {
        formData.append("logo", logo);
      }

      const response = await fetch(
        `${API_URL}/company/profile/setup/`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            // Do not set Content-Type manually for FormData.
            // The browser must add the multipart boundary.
          },
          body: formData,
        }
      );

      const data = await response.json().catch(() => ({}));

      if (response.status === 401) {
        console.error("Company setup authentication rejected:", {
          status: response.status,
          code: data.code,
          detail: data.detail,
        });

        setError(
          data.code === "token_not_valid"
            ? "Django rejected your access token. Please log in again. If the error continues, check your Django JWT settings."
            : "Your session is not authorized. Please log in again."
        );

        return;
      }

      if (response.status === 403) {
        setError(
          data.detail ||
            "You do not have permission to update this organization."
        );
        return;
      }

      if (!response.ok) {
        const messages = Object.entries(data)
          .map(([field, value]) => {
            const message = Array.isArray(value)
              ? value.join(", ")
              : typeof value === "string"
                ? value
                : JSON.stringify(value);

            return `${field}: ${message}`;
          })
          .join(" ");

        setError(messages || `Unable to save organization (HTTP ${response.status}).`);
        return;
      }

      if (data.company) {
        localStorage.setItem(
          "company",
          JSON.stringify(data.company)
        );

        if (data.company.slug) {
          localStorage.setItem("companySlug", data.company.slug);
          localStorage.setItem("company_slug", data.company.slug);
        }
      }

      navigate("/company-dashboard", { replace: true });
    } catch (err) {
      console.error("Company setup request failed:", err);

      setError(
        "Unable to connect to Django. Check that your backend is running."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-3xl">
        {/* HEADER */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-blue-500 flex items-center justify-center text-white font-black text-xl">
              LF
            </div>

            <div className="text-left">
              <h1 className="text-xl font-black text-white">
                LostFound
              </h1>
              <p className="text-xs text-slate-400">
                AI Recovery Platform
              </p>
            </div>
          </div>

          <h2 className="text-3xl md:text-4xl font-black text-white mt-8">
            Set Up Your Organization
          </h2>

          <p className="text-slate-400 mt-3 max-w-xl mx-auto">
            Add your organization&apos;s information so it can
            appear throughout the LostFound platform.
          </p>
        </div>

        {/* CARD */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-8">
          {error && (
            <div
              role="alert"
              className="mb-6 rounded-xl bg-red-50 border border-red-200 text-red-700 px-4 py-3"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* LOGO */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">
                Organization Logo
              </label>

              <div className="flex items-center gap-5">
                <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center overflow-hidden bg-slate-50 dark:bg-slate-800">
                  {preview ? (
                    <img
                      src={preview}
                      alt="Organization logo preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-slate-400 text-xs text-center px-2">
                      Logo Preview
                    </span>
                  )}
                </div>

                <div>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleLogoChange}
                    className="block w-full text-sm text-slate-500"
                  />

                  <p className="text-xs text-slate-400 mt-2">
                    PNG, JPG or WebP recommended.
                  </p>
                </div>
              </div>
            </div>

            {/* ORGANIZATION NAME */}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2"
              >
                Organization Name *
              </label>

              <input
                id="name"
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="e.g. APM Terminals"
                required
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-4 py-3 outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* LOCATION */}
            <div>
              <label
                htmlFor="location"
                className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2"
              >
                Location / Address *
              </label>

              <input
                id="location"
                type="text"
                name="location"
                value={form.location}
                onChange={handleChange}
                placeholder="e.g. Lagos, Nigeria"
                required
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-4 py-3 outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* PHONE AND EMAIL */}
            <div className="grid md:grid-cols-2 gap-5">
              <div>
                <label
                  htmlFor="phone"
                  className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2"
                >
                  Phone Number *
                </label>

                <input
                  id="phone"
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="+234..."
                  required
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-4 py-3 outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2"
                >
                  Organization Email
                </label>

                <input
                  id="email"
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="contact@company.com"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-4 py-3 outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            {/* WEBSITE */}
            <div>
              <label
                htmlFor="website"
                className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2"
              >
                Website
              </label>

              <input
                id="website"
                type="url"
                name="website"
                value={form.website}
                onChange={handleChange}
                placeholder="https://yourcompany.com"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-4 py-3 outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* DESCRIPTION */}
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2"
              >
                Organization Description
              </label>

              <textarea
                id="description"
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={4}
                placeholder="Tell customers about your organization..."
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-4 py-3 outline-none focus:ring-2 focus:ring-primary resize-none"
              />
            </div>

            {/* SUBMIT */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-xl bg-primary text-white font-bold shadow-lg hover:scale-[1.01] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? "Saving Organization..."
                : "Complete Organization Setup"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-500 mt-6">
          You can update these details later from your company settings.
        </p>
      </div>
    </div>
  );
}
