
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API } from "../../config";
import DomainManager from "../../component/company/DomainManager";
import { resolveMediaUrl } from "../../theme";

const API_URL = API;

function currentToken() {
  return (
    localStorage.getItem("access_token") ||
    localStorage.getItem("company_access") ||
    localStorage.getItem("access") ||
    ""
  );
}

// True when a saved login looks usable (present and not expired).
function isUsableToken(token) {
  try {
    const part = token.split(".")[1];
    if (!part) return false;
    const base64 = part.replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(
      atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "="))
    );
    if (payload.token_type && payload.token_type !== "access") return false;
    return !payload.exp || Date.now() < payload.exp * 1000;
  } catch {
    return false;
  }
}

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

  // Step 1: organization details. Step 2: website address.
  const [step, setStep] = useState("details");
  const [sessionExpired, setSessionExpired] = useState(false);

  // Prefill with what is already saved (name from registration, or a
  // previous setup), so returning to this page never wipes details.
  useEffect(() => {
    const token = currentToken();

    if (!isUsableToken(token)) {
      setSessionExpired(true);
      return undefined;
    }

    let cancelled = false;

    fetch(`${API_URL}/company/profile/setup/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((response) => {
        if (response.status === 401 && !cancelled) setSessionExpired(true);
        return response.ok ? response.json() : null;
      })
      .then((data) => {
        if (cancelled || !data?.company) return;

        const saved = data.company;

        setForm((previous) => ({
          name: previous.name || saved.name || "",
          location: previous.location || saved.location || "",
          phone: previous.phone || saved.phone || "",
          email: previous.email || saved.email || "",
          website: previous.website || saved.website || "",
          description: previous.description || saved.description || "",
        }));

        if (saved.logo) {
          setPreview((previous) => previous || resolveMediaUrl(saved.logo));
        }
      })
      .catch(() => {
        /* the form still works empty */
      });

    return () => {
      cancelled = true;
    };
  }, []);

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

    const token = currentToken();

    if (!isUsableToken(token)) {
      setSessionExpired(true);
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
        setSessionExpired(true);
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

      setStep("address");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      console.error("Company setup request failed:", err);

      setError(
        "We couldn't reach the server. Check your internet connection and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  if (sessionExpired) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream px-6 py-12">
        <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-2xl">
          <h2 className="text-2xl font-black text-graphite">
            Please log in to continue
          </h2>
          <p className="mt-3 text-stone-500">
            For your security we need you to sign in again before
            finishing your organization setup.
          </p>
          <button
            type="button"
            onClick={() => navigate("/company/login", { replace: true })}
            className="mt-6 w-full rounded-xl bg-primary py-3.5 font-bold text-white hover:bg-primary-dark"
          >
            Log in
          </button>
        </div>
      </div>
    );
  }

  if (step === "address") {
    return (
      <div className="min-h-screen bg-cream px-4 py-12 sm:px-6">
        <div className="mx-auto w-full max-w-5xl">
          <div className="mb-10 text-center">
            <p className="text-sm font-bold uppercase tracking-wider text-primary">
              Step 2 of 2
            </p>
            <h2 className="mt-2 text-3xl font-black text-graphite md:text-4xl">
              Choose Your Website Address
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-stone-500">
              Start free with your slug address, or get your own
              www.…laf domain now. You can skip this and buy a domain
              later in Website Settings.
            </p>
          </div>

          <DomainManager
            mode="setup"
            returnTo="/company-dashboard?tab=domain"
            onDone={() => navigate("/company-dashboard", { replace: true })}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-3xl">
        {/* HEADER */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center text-white font-black text-xl">
              LF
            </div>

            <div className="text-left">
              <h1 className="text-xl font-black text-graphite">
                LostFound
              </h1>
              <p className="text-xs text-stone-500">
                AI Recovery Platform
              </p>
            </div>
          </div>

          <p className="mt-8 text-sm font-bold uppercase tracking-wider text-primary">
            Step 1 of 2
          </p>

          <h2 className="text-3xl md:text-4xl font-black text-graphite mt-2">
            Set Up Your Organization
          </h2>

          <p className="text-stone-500 mt-3 max-w-xl mx-auto">
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
                      className="w-full h-full object-contain"
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

                  <p className="text-xs text-stone-500 mt-2">
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
                : "Save & Continue"}
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
