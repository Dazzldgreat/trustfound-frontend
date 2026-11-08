
import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { API } from "../../config";
const API_ORIGIN = API.replace("/api", "");

const DEFAULT_WEBSITE_SETTINGS = {
  primary_color: "#EA580C",
  secondary_color: "#292524",
  background_color: "#F6EFE7",
  text_color: "#57534E",
  heading_color: "#292524",
  card_color: "#ffffff",
  button_text_color: "#ffffff",

  // Border Color = inside/fill.
  border_color: "#ffffff",

  // Border Line Color = actual border stroke.
  border_line_color: "#E9E1D8",

  border_style: "solid",
  border_width: 1,
  border_radius: 16,
  content_width: 1280,
  font_family: "system-ui, sans-serif",
};

function getStoredObject(key) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

const isValidColor = (value) =>
  typeof value === "string" &&
  /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(
    value.trim()
  );

const safeColor = (value, fallback) =>
  isValidColor(value) ? value.trim() : fallback;

const safeNumber = (value, fallback, min, max) => {
  const number = Number(value);

  return Number.isFinite(number)
    ? Math.min(max, Math.max(min, number))
    : fallback;
};

const safeBorderStyle = (value) =>
  ["solid", "dashed", "dotted", "double", "none"].includes(
    value
  )
    ? value
    : "solid";

const safeFontFamily = (value) => {
  if (typeof value !== "string" || !value.trim()) {
    return DEFAULT_WEBSITE_SETTINGS.font_family;
  }

  if (/[;{}<>]/.test(value)) {
    return DEFAULT_WEBSITE_SETTINGS.font_family;
  }

  return value.trim();
};

function EditFoundItem() {
  const { id, companySlug } = useParams();
  const navigate = useNavigate();

  const storedCompany = getStoredObject("company");
  const storedUser = getStoredObject("user");

  const access =
    localStorage.getItem("access_token") ||
    localStorage.getItem("access");

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

  const companyRoute = useCallback(
    (path = "") => {
      if (!activeCompanySlug) {
        return path || "/";
      }

      const cleanPath = path.startsWith("/") ? path : `/${path}`;

      return `/company/${encodeURIComponent(
        activeCompanySlug
      )}${cleanPath}`;
    },
    [activeCompanySlug]
  );

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    item_name: "",
    category: "",
    description: "",
    location_found: "",
    date_found: "",
    time_found: "",
    finder_name: "",
    finder_phone: "",
    finder_email: "",
  });

  const [image, setImage] = useState(null);
  const [currentImage, setCurrentImage] = useState("");

  // =========================================================
  // WEBSITE SETTINGS
  // =========================================================

  const [websiteSettings, setWebsiteSettings] = useState(
    DEFAULT_WEBSITE_SETTINGS
  );

  const applyWebsiteTheme = useCallback((rawSettings = {}) => {
    const settings = {
      ...DEFAULT_WEBSITE_SETTINGS,
      ...(rawSettings || {}),
    };

    setWebsiteSettings({
      primary_color: safeColor(
        settings.primary_color,
        DEFAULT_WEBSITE_SETTINGS.primary_color
      ),
      secondary_color: safeColor(
        settings.secondary_color,
        DEFAULT_WEBSITE_SETTINGS.secondary_color
      ),
      background_color: safeColor(
        settings.background_color,
        DEFAULT_WEBSITE_SETTINGS.background_color
      ),
      text_color: safeColor(
        settings.text_color,
        DEFAULT_WEBSITE_SETTINGS.text_color
      ),
      heading_color: safeColor(
        settings.heading_color,
        DEFAULT_WEBSITE_SETTINGS.heading_color
      ),
      card_color: safeColor(
        settings.card_color,
        DEFAULT_WEBSITE_SETTINGS.card_color
      ),
      button_text_color: safeColor(
        settings.button_text_color,
        DEFAULT_WEBSITE_SETTINGS.button_text_color
      ),
      border_color: safeColor(
        settings.border_color,
        DEFAULT_WEBSITE_SETTINGS.border_color
      ),
      border_line_color: safeColor(
        settings.border_line_color,
        DEFAULT_WEBSITE_SETTINGS.border_line_color
      ),
      border_style: safeBorderStyle(settings.border_style),
      border_width: safeNumber(
        settings.border_width,
        DEFAULT_WEBSITE_SETTINGS.border_width,
        0,
        10
      ),
      border_radius: safeNumber(
        settings.border_radius,
        DEFAULT_WEBSITE_SETTINGS.border_radius,
        0,
        60
      ),
      content_width: safeNumber(
        settings.content_width,
        DEFAULT_WEBSITE_SETTINGS.content_width,
        320,
        2400
      ),
      font_family: safeFontFamily(settings.font_family),
    });
  }, []);

  const fetchWebsiteSettings = useCallback(async () => {
    if (!activeCompanySlug) {
      applyWebsiteTheme(DEFAULT_WEBSITE_SETTINGS);
      return;
    }

    try {
      const response = await fetch(
        `${API}/company/public/${encodeURIComponent(
          activeCompanySlug
        )}/website/`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        console.warn(
          "Unable to load company website settings."
        );
        return;
      }

      const result = await response.json();

      const settings =
        result.settings ||
        result.website_settings ||
        result.websiteSettings ||
        result;

      applyWebsiteTheme(settings);
    } catch (error) {
      console.error(
        "Error loading website settings:",
        error
      );
    }
  }, [activeCompanySlug, applyWebsiteTheme]);

  useEffect(() => {
    fetchWebsiteSettings();
  }, [fetchWebsiteSettings]);

  const themeStyle = {
    "--company-primary": websiteSettings.primary_color,
    "--company-secondary": websiteSettings.secondary_color,
    "--company-background": websiteSettings.background_color,
    "--company-text": websiteSettings.text_color,
    "--company-heading": websiteSettings.heading_color,
    "--company-card": websiteSettings.card_color,
    "--company-button-text": websiteSettings.button_text_color,

    // Separate settings for fill and border stroke.
    "--company-border-color": websiteSettings.border_color,
    "--company-border-line-color":
      websiteSettings.border_line_color,

    "--company-border-style": websiteSettings.border_style,
    "--company-border-width": `${websiteSettings.border_width}px`,
    "--company-border-radius": `${websiteSettings.border_radius}px`,
    "--company-content-width": `${websiteSettings.content_width}px`,
    "--company-font-family": websiteSettings.font_family,
  };

  // =========================================================
  // IMAGE URL
  // =========================================================

  const getImageUrl = (imagePath) => {
    if (!imagePath) {
      return "";
    }

    const value = String(imagePath).trim();

    if (
      value.startsWith("http://") ||
      value.startsWith("https://")
    ) {
      return value;
    }

    return `${API_ORIGIN}${
      value.startsWith("/") ? value : `/${value}`
    }`;
  };

  // =========================================================
  // FETCH FOUND ITEM
  // =========================================================

  const fetchItem = useCallback(async () => {
    if (!id) {
      alert("Found item ID is missing.");
      navigate(companyRoute("/my-found-reports"));
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${API}/found-items/${id}/`,
        {
          headers: {
            Authorization: `Bearer ${access}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
            data.error ||
            "Failed to load found item"
        );
      }

      setFormData({
        item_name: data.item_name || "",
        category: data.category || "",
        description: data.description || "",
        location_found: data.location_found || "",
        date_found: data.date_found || "",
        time_found: data.time_found || "",
        finder_name: data.finder_name || "",
        finder_phone: data.finder_phone || "",
        finder_email: data.finder_email || "",
      });

      setCurrentImage(data.image || "");
    } catch (error) {
      console.error("Error loading found item:", error);

      alert(error.message || "Failed to load found item");

      navigate(companyRoute("/my-found-reports"));
    } finally {
      setLoading(false);
    }
  }, [id, access, navigate, companyRoute]);

  useEffect(() => {
    fetchItem();
  }, [fetchItem]);

  // =========================================================
  // FORM HANDLERS
  // =========================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleImageChange = (e) => {
    const selectedFile = e.target.files?.[0] || null;
    setImage(selectedFile);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!id) {
      alert("Found item ID is missing.");
      return;
    }

    try {
      setSaving(true);

      const data = new FormData();

      Object.entries(formData).forEach(([key, value]) => {
        data.append(key, value ?? "");
      });

      if (image) {
        data.append("image", image);
      }

      const response = await fetch(
        `${API}/found-items/${id}/update/`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${access}`,
          },
          body: data,
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.detail ||
            result.error ||
            "Failed to update found item"
        );
      }

      alert("Found Item Updated Successfully");

      navigate(companyRoute("/my-found-reports"));
    } catch (error) {
      console.error("Error updating found item:", error);
      alert(error.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    navigate(companyRoute("/my-found-reports"));
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <>
        <style>{`
          .edit-found-theme {
            background: var(--company-background) !important;
            color: var(--company-text);
            font-family: var(--company-font-family);
          }

          .edit-found-theme .settings-surface {
            background: var(--company-border-color) !important;
            border-color: var(--company-border-line-color) !important;
            border-style: var(--company-border-style) !important;
            border-width: var(--company-border-width) !important;
            border-radius: var(--company-border-radius) !important;
          }
        `}</style>

        <div
          style={themeStyle}
          className="edit-found-theme min-h-screen flex justify-center items-center px-4"
        >
          <div className="settings-surface px-8 py-6 shadow-lg border">
            <p className="font-medium">
              Loading found item...
            </p>
          </div>
        </div>
      </>
    );
  }

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <>
      <style>{`
        .edit-found-theme {
          background-color: var(--company-background) !important;
          color: var(--company-text);
          font-family: var(--company-font-family);
        }

        .edit-found-theme .settings-surface {
          background-color: var(--company-border-color) !important;
          border-color: var(--company-border-line-color) !important;
          border-style: var(--company-border-style) !important;
          border-width: var(--company-border-width) !important;
          border-radius: var(--company-border-radius) !important;
        }

        .edit-found-theme .settings-card {
          background-color: var(--company-card) !important;
          border-color: var(--company-border-line-color) !important;
          border-style: var(--company-border-style) !important;
          border-width: var(--company-border-width) !important;
          border-radius: var(--company-border-radius) !important;
        }

        .edit-found-theme .settings-heading {
          color: var(--company-heading) !important;
        }

        .edit-found-theme .settings-text {
          color: var(--company-text) !important;
        }

        .edit-found-theme .settings-input {
          background-color: var(--company-card) !important;
          color: var(--company-text) !important;
          border-color: var(--company-border-line-color) !important;
          border-style: var(--company-border-style) !important;
          border-width: var(--company-border-width) !important;
          border-radius: var(--company-border-radius) !important;
        }

        .edit-found-theme .settings-input:focus {
          outline: 2px solid var(--company-primary);
          outline-offset: 1px;
          --tw-ring-color: var(--company-primary);
        }

        .edit-found-theme .settings-button {
          border-radius: var(--company-border-radius) !important;
        }

        .edit-found-theme .settings-primary-button {
          background-color: var(--company-primary) !important;
          color: var(--company-button-text) !important;
          border-color: var(--company-primary) !important;
        }

        .edit-found-theme .settings-primary-button:hover {
          filter: brightness(0.94);
        }

        .edit-found-theme .settings-content {
          width: 100%;
          max-width: var(--company-content-width);
          margin-left: auto;
          margin-right: auto;
        }
      `}</style>

      <div
        style={themeStyle}
        className="edit-found-theme min-h-screen py-10 px-4"
      >
        <div className="settings-content">

          {/* Header */}

          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm settings-text mb-1">
                Found Reports
              </p>

              <h1 className="text-3xl font-bold settings-heading">
                Edit Found Item
              </h1>

              {activeCompanySlug && (
                <p className="text-sm settings-text mt-1">
                  Company: {activeCompanySlug}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={handleBack}
              className="settings-card settings-button px-5 py-3 border text-slate-700 font-semibold hover:opacity-80 transition"
            >
              Back
            </button>
          </div>

          {/* Form Card */}

          <div className="settings-card border shadow-xl p-8">
            <form
              onSubmit={handleSubmit}
              className="space-y-5"
            >
              {/* Item Name */}

              <div>
                <label className="block text-sm font-semibold settings-heading mb-2">
                  Item Name
                </label>

                <input
                  type="text"
                  name="item_name"
                  value={formData.item_name}
                  onChange={handleChange}
                  placeholder="Item Name"
                  className="settings-input w-full border p-4 outline-none focus:ring-2"
                  required
                />
              </div>

              {/* Category */}

              <div>
                <label className="block text-sm font-semibold settings-heading mb-2">
                  Category
                </label>

                <input
                  type="text"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  placeholder="Category"
                  className="settings-input w-full border p-4 outline-none focus:ring-2"
                  required
                />
              </div>

              {/* Description */}

              <div>
                <label className="block text-sm font-semibold settings-heading mb-2">
                  Description
                </label>

                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Description"
                  rows={5}
                  className="settings-input w-full border p-4 outline-none focus:ring-2 resize-none"
                  required
                />
              </div>

              {/* Location */}

              <div>
                <label className="block text-sm font-semibold settings-heading mb-2">
                  Location Found
                </label>

                <input
                  type="text"
                  name="location_found"
                  value={formData.location_found}
                  onChange={handleChange}
                  placeholder="Location Found"
                  className="settings-input w-full border p-4 outline-none focus:ring-2"
                  required
                />
              </div>

              {/* Date */}

              <div>
                <label className="block text-sm font-semibold settings-heading mb-2">
                  Date Found
                </label>

                <input
                  type="date"
                  name="date_found"
                  value={formData.date_found}
                  onChange={handleChange}
                  className="settings-input w-full border p-4 outline-none focus:ring-2"
                  required
                />
              </div>

              {/* Time */}

              <div>
                <label className="block text-sm font-semibold settings-heading mb-2">
                  Time Found
                </label>

                <input
                  type="time"
                  name="time_found"
                  value={formData.time_found}
                  onChange={handleChange}
                  className="settings-input w-full border p-4 outline-none focus:ring-2"
                />
              </div>

              {/* Finder Name */}

              <div>
                <label className="block text-sm font-semibold settings-heading mb-2">
                  Finder Name
                </label>

                <input
                  type="text"
                  name="finder_name"
                  value={formData.finder_name}
                  onChange={handleChange}
                  placeholder="Finder Name"
                  className="settings-input w-full border p-4 outline-none focus:ring-2"
                  required
                />
              </div>

              {/* Finder Phone */}

              <div>
                <label className="block text-sm font-semibold settings-heading mb-2">
                  Finder Phone
                </label>

                <input
                  type="text"
                  name="finder_phone"
                  value={formData.finder_phone}
                  onChange={handleChange}
                  placeholder="Finder Phone"
                  className="settings-input w-full border p-4 outline-none focus:ring-2"
                />
              </div>

              {/* Finder Email */}

              <div>
                <label className="block text-sm font-semibold settings-heading mb-2">
                  Finder Email
                </label>

                <input
                  type="email"
                  name="finder_email"
                  value={formData.finder_email}
                  onChange={handleChange}
                  placeholder="Finder Email"
                  className="settings-input w-full border p-4 outline-none focus:ring-2"
                />
              </div>

              {/* Current Image */}

              {currentImage && (
                <div className="settings-surface border p-5">
                  <p className="text-sm font-semibold settings-heading mb-3">
                    Current Image
                  </p>

                  <img
                    src={getImageUrl(currentImage)}
                    alt="Current found item"
                    className="w-48 h-48 item-image zoomable rounded-xl border"
                    style={{
                      borderColor:
                        "var(--company-border-line-color)",
                      borderStyle:
                        "var(--company-border-style)",
                      borderWidth:
                        "var(--company-border-width)",
                      borderRadius:
                        "var(--company-border-radius)",
                    }}
                  />
                </div>
              )}

              {/* New Image */}

              <div>
                <label className="block text-sm font-semibold settings-heading mb-2">
                  Replace Image
                </label>

                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="settings-input w-full border p-4"
                />

                {image && (
                  <p className="text-sm settings-text mt-2">
                    Selected: {image.name}
                  </p>
                )}
              </div>

              {/* Buttons */}

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={saving}
                  className="settings-card settings-button w-full sm:w-1/2 border text-slate-700 py-4 font-bold hover:opacity-80 transition disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="settings-primary-button settings-button w-full sm:w-1/2 py-4 font-bold transition disabled:opacity-50"
                >
                  {saving
                    ? "Updating..."
                    : "Update Found Item"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

export default EditFoundItem;
