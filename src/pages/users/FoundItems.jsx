
import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import QRCode from "react-qr-code";

import { API } from "../../config";
import { upgradeLegacyColor } from "../../theme";

const DEFAULT_WEBSITE_SETTINGS = {
  primary_color: "#EA580C",
  secondary_color: "#C2410C",
  background_color: "#F6EFE7",
  text_color: "#44403C",
  heading_color: "#292524",
  card_color: "#ffffff",
  button_text_color: "#ffffff",
  border_color: "#ffffff",
  border_line_color: "#E9E1D8",
  border_style: "solid",
  border_width: 1,
  border_radius: 16,
  content_width: 1024,
  font_family: "Inter",
};

const ALLOWED_BORDER_STYLES = [
  "solid",
  "dashed",
  "dotted",
  "double",
  "none",
];

const ALLOWED_FONTS = [
  "Inter",
  "Arial",
  "Roboto",
  "Poppins",
  "Montserrat",
  "Open Sans",
  "Lato",
  "system-ui",
  "Georgia",
  "Verdana",
];

function getStoredObject(key) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

function isValidColor(value) {
  if (typeof value !== "string") return false;

  return (
    /^#[0-9a-fA-F]{3,8}$/.test(value) ||
    /^rgba?\(\s*[\d.%\s,]+\)$/.test(value) ||
    /^hsla?\(\s*[\d.%\s,deg]+\)$/.test(value)
  );
}

function getValidColor(value, fallback) {
  value = upgradeLegacyColor(value);
  return isValidColor(value) ? value : fallback;
}

function getValidNumber(value, fallback, min, max) {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  const number = Number(value);

  if (!Number.isFinite(number)) return fallback;

  return Math.min(max, Math.max(min, number));
}

function getValidBorderStyle(value, fallback) {
  return ALLOWED_BORDER_STYLES.includes(value)
    ? value
    : fallback;
}

function getValidFont(value, fallback) {
  return ALLOWED_FONTS.includes(value) ? value : fallback;
}

function applyWebsiteTheme(settings = {}) {
  const source =
    settings?.settings ||
    settings?.website_settings ||
    settings?.websiteSettings ||
    settings;

  return {
    primary_color: getValidColor(
      source.primary_color,
      DEFAULT_WEBSITE_SETTINGS.primary_color
    ),
    secondary_color: getValidColor(
      source.secondary_color,
      DEFAULT_WEBSITE_SETTINGS.secondary_color
    ),
    background_color: getValidColor(
      source.background_color,
      DEFAULT_WEBSITE_SETTINGS.background_color
    ),
    text_color: getValidColor(
      source.text_color,
      DEFAULT_WEBSITE_SETTINGS.text_color
    ),
    heading_color: getValidColor(
      source.heading_color,
      DEFAULT_WEBSITE_SETTINGS.heading_color
    ),
    card_color: getValidColor(
      source.card_color,
      DEFAULT_WEBSITE_SETTINGS.card_color
    ),
    button_text_color: getValidColor(
      source.button_text_color,
      DEFAULT_WEBSITE_SETTINGS.button_text_color
    ),
    border_color: getValidColor(
      source.border_color,
      DEFAULT_WEBSITE_SETTINGS.border_color
    ),
    border_line_color: getValidColor(
      source.border_line_color,
      DEFAULT_WEBSITE_SETTINGS.border_line_color
    ),
    border_style: getValidBorderStyle(
      source.border_style,
      DEFAULT_WEBSITE_SETTINGS.border_style
    ),
    border_width: getValidNumber(
      source.border_width,
      DEFAULT_WEBSITE_SETTINGS.border_width,
      0,
      10
    ),
    border_radius: getValidNumber(
      source.border_radius,
      DEFAULT_WEBSITE_SETTINGS.border_radius,
      0,
      100
    ),
    content_width: getValidNumber(
      source.content_width,
      DEFAULT_WEBSITE_SETTINGS.content_width,
      320,
      2000
    ),
    font_family: getValidFont(
      source.font_family,
      DEFAULT_WEBSITE_SETTINGS.font_family
    ),
  };
}

function FoundItem() {
  const navigate = useNavigate();
  const { companySlug } = useParams();

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

  // WEBSITE SETTINGS

  const [websiteSettings, setWebsiteSettings] = useState(
    DEFAULT_WEBSITE_SETTINGS
  );

  useEffect(() => {
    let cancelled = false;

    const fetchWebsiteSettings = async () => {
      if (!activeCompanySlug) return;

      try {
        const response = await fetch(
          `${API}/company/public/${encodeURIComponent(
            activeCompanySlug
          )}/website/`
        );

        if (!response.ok) return;

        const result = await response.json();

        if (!cancelled) {
          setWebsiteSettings(applyWebsiteTheme(result));
        }
      } catch (error) {
        console.error("WEBSITE SETTINGS ERROR:", error);
      }
    };

    fetchWebsiteSettings();

    return () => {
      cancelled = true;
    };
  }, [activeCompanySlug]);

  const themeStyle = {
    "--site-primary": websiteSettings.primary_color,
    "--site-secondary": websiteSettings.secondary_color,
    "--site-background": websiteSettings.background_color,
    "--site-text": websiteSettings.text_color,
    "--site-heading": websiteSettings.heading_color,
    "--site-card": websiteSettings.card_color,
    "--site-button-text": websiteSettings.button_text_color,
    "--site-border-fill": websiteSettings.border_color,
    "--site-border-line": websiteSettings.border_line_color,
    "--site-border-style": websiteSettings.border_style,
    "--site-border-width": `${websiteSettings.border_width}px`,
    "--site-radius": `${websiteSettings.border_radius}px`,
    "--site-content-width": `${websiteSettings.content_width}px`,
    "--site-font": `"${websiteSettings.font_family}", sans-serif`,
    backgroundColor: "var(--site-background)",
    color: "var(--site-text)",
    fontFamily: "var(--site-font)",
  };

  // FORM STATE

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
  const [imagePreview, setImagePreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // STORED SUBMITTED ITEM

  const [submittedItem, setSubmittedItem] = useState(null);

  // IMAGE PREVIEW CLEANUP

  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  // HANDLE INPUT

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // HANDLE IMAGE UPLOAD

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }

    setImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  // COPY VERIFICATION CODE

  const handleCopyCode = async () => {
    const token = submittedItem?.verification_token;

    if (!token) return;

    try {
      await navigator.clipboard.writeText(token);
      alert("Verification code copied successfully.");
    } catch {
      alert("Unable to copy. Please copy the code manually.");
    }
  };

  // PRINT QR CODE

  const handlePrint = () => {
    window.print();
  };

  // SUBMIT FOUND ITEM

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!access) {
      alert("Your session has expired. Please login again.");
      navigate(companyRoute("/login-page"));
      return;
    }

    setSubmitting(true);

    const data = new FormData();

    data.append("item_name", formData.item_name || "");
    data.append("category", formData.category || "");
    data.append("description", formData.description || "");
    data.append("location_found", formData.location_found || "");
    data.append("date_found", formData.date_found || "");
    data.append("time_found", formData.time_found || "");
    data.append("finder_name", formData.finder_name || "");
    data.append("finder_phone", formData.finder_phone || "");
    data.append("finder_email", formData.finder_email || "");

    if (image instanceof File) {
      data.append("image", image);
    }

    try {
      const response = await fetch(`${API}/found-items/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${access}`,
        },
        body: data,
      });

      const result = await response.json();

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem("access");
        localStorage.removeItem("access_token");

        alert("Your session has expired. Please login again.");

        navigate(companyRoute("/login-page"), {
          replace: true,
        });

        return;
      }

      if (!response.ok) {
        let errorMessage = "Unable to submit found item.";

        if (typeof result === "object" && result !== null) {
          errorMessage = Object.entries(result)
            .map(([field, errors]) => {
              const message = Array.isArray(errors)
                ? errors.join(", ")
                : String(errors);

              return `${field}: ${message}`;
            })
            .join("\n");
        } else if (result?.error) {
          errorMessage = result.error;
        } else if (result?.detail) {
          errorMessage = result.detail;
        }

        alert(errorMessage);
        return;
      }

      // BACKEND RETURNS THE CREATED ITEM UNDER result.item

      const createdItem = result?.item;

      if (!createdItem?.verification_token) {
        alert(
          "Your item was submitted, but the verification code was not returned. Please contact support."
        );
        return;
      }

      // SHOW QR CODE AND MANUAL CODE IMMEDIATELY

      setSubmittedItem(createdItem);

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (error) {
      console.error("FOUND ITEM SUBMISSION ERROR:", error);

      alert(
        "Unable to connect to the server. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // BACK

  const handleBack = () => {
    navigate(companyRoute("/dashboard"));
  };

  // PAGE

  return (
    <main
      className="found-item-theme min-h-screen px-6 py-12"
      style={themeStyle}
    >
      <style>{`
        .found-item-theme {
          background-color: var(--site-background);
          color: var(--site-text);
          font-family: var(--site-font);
        }

        .found-item-theme .site-heading {
          color: var(--site-heading);
        }

        .found-item-theme .site-text {
          color: var(--site-text);
        }

        .found-item-theme .site-muted {
          color: var(--site-text);
          opacity: 0.72;
        }

        .found-item-theme .site-card {
          background-color: var(--site-card);
          border-color: var(--site-border-line);
          border-style: var(--site-border-style);
          border-width: var(--site-border-width);
          border-radius: var(--site-radius);
        }

        .found-item-theme .site-field {
          background-color: var(--site-border-fill);
          color: var(--site-text);
          border-color: var(--site-border-line);
          border-style: var(--site-border-style);
          border-width: var(--site-border-width);
          border-radius: var(--site-radius);
        }

        .found-item-theme .site-field::placeholder {
          color: var(--site-text);
          opacity: 0.6;
        }

        .found-item-theme .site-button {
          background-color: var(--site-primary);
          color: var(--site-button-text);
          border-radius: var(--site-radius);
        }

        .found-item-theme .site-button:hover {
          background-color: var(--site-secondary);
        }

        .found-item-theme .site-primary-text {
          color: var(--site-primary);
        }

        .found-item-theme .site-upload {
          border-color: var(--site-border-line);
          border-style: dashed;
          border-width: max(2px, var(--site-border-width));
          border-radius: var(--site-radius);
          background-color: var(--site-border-fill);
        }

        .found-item-theme .site-upload:hover {
          border-color: var(--site-primary);
        }

        .found-item-theme .site-focus:focus {
          outline: none;
          border-color: var(--site-primary);
          box-shadow: 0 0 0 2px var(--site-primary);
        }

        @media print {
          body * {
            visibility: hidden;
          }

          #found-item-qr,
          #found-item-qr * {
            visibility: visible;
          }

          #found-item-qr {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white !important;
            color: black !important;
            box-shadow: none !important;
          }

          #found-item-qr button {
            display: none !important;
          }
        }
      `}</style>

      <div
        className="mx-auto"
        style={{
          maxWidth: "var(--site-content-width)",
        }}
      >
        {/* SUCCESS AND QR CODE DISPLAY */}

        {submittedItem ? (
          <div className="space-y-8">
            <section className="site-card shadow p-8 text-center">
              <div className="w-20 h-20 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto mb-5 text-4xl font-bold">
                ✓
              </div>

              <h1 className="text-3xl font-black mb-3 site-heading">
                Found Item Reported Successfully!
              </h1>

              <p className="site-muted">
                Your report has been saved. Your unique QR
                code and manual verification code have been
                generated.
              </p>

              <div className="inline-block mt-5 px-5 py-2 rounded-full bg-amber-100 text-amber-800 font-bold text-sm">
                Awaiting Physical Verification
              </div>
            </section>

            <section className="site-card shadow p-8">
              <h2 className="text-2xl font-bold mb-6 site-heading">
                Report Details
              </h2>

              {submittedItem.image && (
                <img
                  src={submittedItem.image}
                  alt={submittedItem.item_name}
                  className="w-full max-h-72 object-contain rounded-xl mb-6"
                />
              )}

              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <p className="text-sm site-muted">Item Name</p>
                  <p className="font-bold site-heading">
                    {submittedItem.item_name}
                  </p>
                </div>

                <div>
                  <p className="text-sm site-muted">Category</p>
                  <p className="font-bold site-heading">
                    {submittedItem.category}
                  </p>
                </div>

                <div>
                  <p className="text-sm site-muted">Location Found</p>
                  <p className="font-bold site-heading">
                    {submittedItem.location_found}
                  </p>
                </div>

                <div>
                  <p className="text-sm site-muted">Date Found</p>
                  <p className="font-bold site-heading">
                    {submittedItem.date_found}
                  </p>
                </div>

                <div>
                  <p className="text-sm site-muted">Report ID</p>
                  <p className="font-bold site-heading">
                    #{submittedItem.id}
                  </p>
                </div>

                <div>
                  <p className="text-sm site-muted">Status</p>
                  <p className="font-bold text-amber-700">
                    Pending Verification
                  </p>
                </div>
              </div>
            </section>

            <section
              id="found-item-qr"
              className="site-card shadow p-8 text-center"
            >
              <h2 className="text-2xl font-black mb-3 site-heading">
                Your Verification QR Code
              </h2>

              <p className="site-muted mb-7">
                Keep this QR code safe. Present it to an
                authorized staff member when bringing the
                physical item for inspection.
              </p>

              <div className="inline-block bg-white p-5 rounded-2xl border border-stone-200">
                <QRCode
                  value={submittedItem.verification_token}
                  size={240}
                  level="H"
                  title="Found Item Verification QR Code"
                />
              </div>

              <p className="text-sm site-muted mt-5">
                Staff can scan this code to retrieve your report.
              </p>

              <div className="mt-8 text-left">
                <label className="block font-bold mb-2 site-heading">
                  Manual Verification Code
                </label>

                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    readOnly
                    value={submittedItem.verification_token}
                    className="site-field w-full min-w-0 p-3 font-mono text-sm"
                  />

                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="site-button px-6 py-3 font-semibold"
                  >
                    Copy Code
                  </button>
                </div>

                <p className="text-xs site-muted mt-2">
                  If the QR code cannot be scanned, give this
                  code to staff instead.
                </p>
              </div>

              <button
                type="button"
                onClick={handlePrint}
                className="site-button w-full mt-7 py-3 font-bold"
              >
                Print QR Code
              </button>
            </section>

            <section className="rounded-2xl p-6 bg-orange-50 border border-orange-100">
              <h2 className="font-bold text-orange-900 mb-3">
                What happens next?
              </h2>

              <ol className="list-decimal pl-5 space-y-2 text-sm text-orange-900">
                <li>Keep your QR code and manual verification code.</li>
                <li>Take the physical found item to an authorized staff member.</li>
                <li>Staff will scan your QR code or enter your manual code.</li>
                <li>Staff will inspect the physical item against your report.</li>
                <li>After inspection, staff can confirm the item as verified.</li>
              </ol>
            </section>

            <div className="flex justify-center print:hidden">
              <button
                type="button"
                onClick={handleBack}
                className="site-button px-8 py-4 font-bold"
              >
                Return to Dashboard
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* BACK BUTTON */}

            <button
              type="button"
              onClick={handleBack}
              disabled={submitting}
              className="flex items-center gap-2 site-muted hover:site-primary-text mb-8 transition disabled:opacity-50"
            >
              <span className="material-symbols-outlined">
                arrow_back
              </span>

              <span className="font-semibold">Back</span>
            </button>

            {/* PAGE TITLE */}

            <div className="mb-10">
              <h1 className="text-4xl font-black mb-3 site-heading">
                Report a Found Item
              </h1>

              <p className="site-muted">
                Thank you for helping someone recover their
                belongings. Provide as much information as
                possible so the item can be matched with its
                owner.
              </p>

              {activeCompanySlug && (
                <p className="text-sm site-muted mt-3">
                  Company: {activeCompanySlug}
                </p>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* IMAGE */}

              <section className="site-card shadow p-8">
                <h2 className="text-2xl font-bold mb-6 site-heading">
                  Upload Item Image
                </h2>

                <div className="flex flex-col items-center">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Found item preview"
                      className="w-56 h-56 rounded-xl item-image zoomable border mb-5"
                      style={{
                        borderColor: "var(--site-border-line)",
                        borderWidth: "var(--site-border-width)",
                        borderStyle: "var(--site-border-style)",
                        borderRadius: "var(--site-radius)",
                      }}
                    />
                  ) : (
                    <div className="w-56 h-56 site-upload flex flex-col justify-center items-center mb-5">
                      <span
                        className="material-symbols-outlined text-6xl"
                        style={{
                          color: "var(--site-primary)",
                        }}
                      >
                        image
                      </span>

                      <p className="site-muted mt-2">
                        No Image Selected
                      </p>
                    </div>
                  )}

                  <input
                    id="image"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />

                  <label
                    htmlFor="image"
                    className="site-button px-6 py-3 cursor-pointer transition"
                  >
                    Upload Image
                  </label>

                  {image && (
                    <p className="text-sm site-muted mt-3">
                      Selected: {image.name}
                    </p>
                  )}
                </div>
              </section>

              {/* ITEM INFORMATION */}

              <section className="site-card shadow p-8">
                <h2 className="text-2xl font-bold mb-6 site-heading">
                  Item Information
                </h2>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block mb-2 font-semibold site-text">
                      Item Name
                    </label>

                    <input
                      required
                      name="item_name"
                      value={formData.item_name}
                      onChange={handleChange}
                      placeholder="e.g. Black iPhone 13"
                      className="site-field site-focus w-full p-3"
                    />
                  </div>

                  <div>
                    <label className="block mb-2 font-semibold site-text">
                      Category
                    </label>

                    <select
                      required
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      className="site-field site-focus w-full p-3"
                    >
                      <option value="">Select Category</option>
                      <option value="Electronics">Electronics</option>
                      <option value="Documents">Documents</option>
                      <option value="Clothing">Clothing</option>
                      <option value="Bags">Bags</option>
                      <option value="Jewelry">Jewelry</option>
                      <option value="Keys">Keys</option>
                      <option value="Money">Money</option>
                      <option value="Pets">Pets</option>
                      <option value="Others">Others</option>
                    </select>
                  </div>
                </div>

                <div className="mt-6">
                  <label className="block mb-2 font-semibold site-text">
                    Description
                  </label>

                  <textarea
                    required
                    rows={5}
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Describe the item in detail..."
                    className="site-field site-focus w-full p-3"
                  />
                </div>
              </section>

              {/* FOUND DETAILS */}

              <section className="site-card shadow p-8">
                <h2 className="text-2xl font-bold mb-6 site-heading">
                  Found Details
                </h2>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block mb-2 font-semibold site-text">
                      Location Found
                    </label>

                    <input
                      required
                      name="location_found"
                      value={formData.location_found}
                      onChange={handleChange}
                      placeholder="e.g. Hotel lobby"
                      className="site-field site-focus w-full p-3"
                    />
                  </div>

                  <div>
                    <label className="block mb-2 font-semibold site-text">
                      Date Found
                    </label>

                    <input
                      required
                      type="date"
                      name="date_found"
                      value={formData.date_found}
                      onChange={handleChange}
                      className="site-field site-focus w-full p-3"
                    />
                  </div>

                  <div>
                    <label className="block mb-2 font-semibold site-text">
                      Time Found
                    </label>

                    <input
                      required
                      type="time"
                      name="time_found"
                      value={formData.time_found}
                      onChange={handleChange}
                      className="site-field site-focus w-full p-3"
                    />
                  </div>
                </div>
              </section>

              {/* FINDER INFORMATION */}

              <section className="site-card shadow p-8">
                <h2 className="text-2xl font-bold mb-6 site-heading">
                  Finder Information
                </h2>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block mb-2 font-semibold site-text">
                      Your Name
                    </label>

                    <input
                      required
                      name="finder_name"
                      value={formData.finder_name}
                      onChange={handleChange}
                      placeholder="Your Name"
                      className="site-field site-focus w-full p-3"
                    />
                  </div>

                  <div>
                    <label className="block mb-2 font-semibold site-text">
                      Phone Number
                    </label>

                    <input
                      required
                      type="tel"
                      name="finder_phone"
                      value={formData.finder_phone}
                      onChange={handleChange}
                      placeholder="Phone Number"
                      className="site-field site-focus w-full p-3"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block mb-2 font-semibold site-text">
                      Email Address
                    </label>

                    <input
                      required
                      type="email"
                      name="finder_email"
                      value={formData.finder_email}
                      onChange={handleChange}
                      placeholder="Email Address"
                      className="site-field site-focus w-full p-3"
                    />
                  </div>
                </div>
              </section>

              {/* ACTION BUTTONS */}

              <div className="flex flex-col sm:flex-row justify-end gap-4">
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={submitting}
                  className="site-field px-6 py-3 font-semibold transition disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="site-button px-8 py-3 font-semibold transition disabled:opacity-50"
                >
                  {submitting
                    ? "Submitting..."
                    : "Report Found Item"}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </main>
  );
}

export default FoundItem;
