import { useCallback, useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { useNavigate, useParams } from "react-router-dom";
import { API } from "../config";

function StaffQRScanner() {
    const navigate = useNavigate();
    const { companySlug } = useParams();

    // =========================================================
    // COMPANY
    // =========================================================

    const getStoredObject = (key) => {
        try {
            return JSON.parse(localStorage.getItem(key) || "{}");
        } catch {
            return {};
        }
    };

    const storedCompany = getStoredObject("company");
    const storedUser = getStoredObject("user");

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

    // =========================================================
    // COMPANY ROUTE
    // =========================================================

    const companyRoute = useCallback(
        (path = "") => {
            if (!activeCompanySlug) {
                return path || "/";
            }

            return `/company/${encodeURIComponent(
                activeCompanySlug
            )}${path}`;
        },
        [activeCompanySlug]
    );

    // =========================================================
    // AUTH
    // =========================================================

    const getAccessToken = useCallback(() => {
        return (
            localStorage.getItem("access_token") ||
            localStorage.getItem("access")
        );
    }, []);

    const handleUnauthorized = useCallback(() => {
        localStorage.removeItem("access");
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("user");

        navigate(
            companyRoute("/login-page"),
            { replace: true }
        );
    }, [navigate, companyRoute]);

    // =========================================================
    // SCANNER REFS
    // =========================================================

    const scannerRef = useRef(null);
    const isStartingRef = useRef(false);
    const hasScanned = useRef(false);

    // =========================================================
    // STATE
    // =========================================================

    const [message, setMessage] = useState("");
    const [status, setStatus] = useState("Starting camera...");

    // =========================================================
    // VERIFY QR CODE
    // =========================================================

    const verifyQRCode = useCallback(
        async (token) => {
            console.log("TOKEN RECEIVED:", token);

            try {
                setStatus("Verifying item...");
                setMessage("");

                const access = getAccessToken();

                if (!access) {
                    setMessage("Your session has expired. Please log in again.");
                    setStatus("Authentication required");

                    hasScanned.current = false;

                    handleUnauthorized();

                    return;
                }

                const response = await fetch(
                    `${API}/staff/verify-found-item/${encodeURIComponent(
                        token
                    )}/`,
                    {
                        method: "POST",

                        headers: {
                            Authorization: `Bearer ${access}`,
                            "Content-Type": "application/json",
                        },
                    }
                );

                console.log("STATUS:", response.status);

                // =====================================================
                // AUTH ERROR
                // =====================================================

                if (
                    response.status === 401 ||
                    response.status === 403
                ) {
                    handleUnauthorized();
                    return;
                }

                // =====================================================
                // RESPONSE TYPE
                // =====================================================

                const contentType =
                    response.headers.get("content-type");

                if (
                    !contentType ||
                    !contentType.includes("application/json")
                ) {
                    const html = await response.text();

                    console.error(
                        "SERVER RESPONSE:",
                        html
                    );

                    setMessage(
                        "Server returned an unexpected response."
                    );

                    setStatus("Ready to scan again");

                    hasScanned.current = false;

                    return;
                }

                const data = await response.json();

                console.log(
                    "SERVER RESPONSE:",
                    data
                );

                // =====================================================
                // VERIFICATION ERROR
                // =====================================================

                if (!response.ok) {
                    setMessage(
                        data.error ||
                            data.detail ||
                            "Verification failed."
                    );

                    setStatus(
                        "Ready to scan again"
                    );

                    hasScanned.current = false;

                    return;
                }

                // =====================================================
                // SUCCESS
                // =====================================================

                setMessage(
                    data.message ||
                        "Item verified successfully."
                );

                setStatus(
                    "Verification successful"
                );

                setTimeout(() => {
                    navigate(
                        companyRoute(
                            "/staff/verification-success"
                        ),
                        {
                            state: data,
                        }
                    );
                }, 1000);
            } catch (error) {
                console.error(
                    "Verification error:",
                    error
                );

                setMessage(
                    "Unable to connect to the server."
                );

                setStatus(
                    "Ready to scan again"
                );

                hasScanned.current = false;
            }
        },
        [
            getAccessToken,
            handleUnauthorized,
            navigate,
            companyRoute,
        ]
    );

    // =========================================================
    // START QR SCANNER
    // =========================================================

    useEffect(() => {
        let scanner = null;
        let mounted = true;

        const startScanner = async () => {
            const reader =
                document.getElementById("reader");

            if (!reader) {
                console.error(
                    "QR reader element not found."
                );

                return;
            }

            if (
                scannerRef.current ||
                isStartingRef.current
            ) {
                console.log(
                    "QR scanner already exists or is starting."
                );

                return;
            }

            try {
                isStartingRef.current = true;

                scanner = new Html5Qrcode(
                    "reader"
                );

                scannerRef.current = scanner;

                console.log(
                    "Starting QR scanner..."
                );

                await scanner.start(
                    {
                        facingMode: "environment",
                    },
                    {
                        fps: 10,

                        qrbox: {
                            width: 250,
                            height: 250,
                        },

                        aspectRatio: 1.0,
                    },

                    async (decodedText) => {
                        if (!mounted) {
                            return;
                        }

                        console.log(
                            "QR VALUE:",
                            decodedText
                        );

                        if (
                            hasScanned.current
                        ) {
                            return;
                        }

                        hasScanned.current = true;

                        let token =
                            decodedText.trim();

                        // =================================================
                        // EXTRACT TOKEN FROM URL
                        // =================================================

                        if (token.includes("/")) {
                            const parts =
                                token
                                    .split("/")
                                    .filter(Boolean);

                            token =
                                parts[
                                    parts.length - 1
                                ];
                        }

                        console.log(
                            "EXTRACTED TOKEN:",
                            token
                        );

                        if (!token) {
                            setMessage(
                                "Invalid QR Code."
                            );

                            setStatus(
                                "Ready to scan again"
                            );

                            hasScanned.current = false;

                            return;
                        }

                        // Stop camera before verification.
                        try {
                            if (
                                scannerRef.current
                            ) {
                                await scannerRef.current.stop();
                            }
                        } catch (error) {
                            console.log(
                                "Scanner stop:",
                                error
                            );
                        }

                        await verifyQRCode(
                            token
                        );
                    },

                    () => {
                        // Normal QR scanning failures are ignored.
                    }
                );

                isStartingRef.current = false;

                if (mounted) {
                    setStatus(
                        "Camera ready"
                    );
                }

                console.log(
                    "QR scanner started successfully."
                );
            } catch (error) {
                isStartingRef.current = false;

                console.error(
                    "QR scanner start error:",
                    error
                );

                if (!mounted) {
                    return;
                }

                setStatus(
                    "Unable to access camera."
                );

                setMessage(
                    "Could not start the camera. Please allow camera permission and try again."
                );

                scannerRef.current = null;
            }
        };

        startScanner();

        // =========================================================
        // CLEANUP
        // =========================================================

        return () => {
            mounted = false;

            const currentScanner =
                scannerRef.current;

            scannerRef.current = null;

            if (!currentScanner) {
                return;
            }

            console.log(
                "Cleaning up QR scanner..."
            );

            if (isStartingRef.current) {
                console.log(
                    "Scanner is still starting. Skipping stop."
                );

                return;
            }

            try {
                currentScanner
                    .stop()
                    .then(() => {
                        console.log(
                            "QR scanner stopped."
                        );

                        try {
                            currentScanner.clear();
                        } catch {
                            // Already cleared.
                        }
                    })
                    .catch((error) => {
                        console.log(
                            "Scanner stop skipped:",
                            error
                        );

                        try {
                            currentScanner.clear();
                        } catch {
                            // Already cleared.
                        }
                    });
            } catch (error) {
                console.log(
                    "Scanner cleanup error:",
                    error
                );
            }
        };
    }, [verifyQRCode]);

    // =========================================================
    // BACK TO DASHBOARD
    // =========================================================

    const goToDashboard = () => {
        navigate(
            companyRoute("/staff-dashboard")
        );
    };

    // =========================================================
    // PAGE
    // =========================================================

    return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center px-6 py-10">

            <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full p-8">

                {/* COMPANY */}

                {activeCompanySlug && (
                    <div className="text-center mb-4">

                        <span className="inline-flex items-center px-4 py-2 rounded-full bg-blue-50 text-blue-700 text-sm font-bold">

                            {storedCompany.name ||
                                activeCompanySlug}

                        </span>

                    </div>
                )}

                {/* TITLE */}

                <h1 className="text-3xl font-black text-center mb-3">

                    Staff QR Scanner

                </h1>

                <p className="text-center text-gray-500 mb-8">

                    Scan the QR code provided when
                    the item was submitted.

                </p>

                {/* QR READER */}

                <div
                    id="reader"
                    className="w-full max-w-md mx-auto rounded-2xl overflow-hidden bg-black"
                />

                {/* STATUS */}

                <div className="mt-6 text-center">

                    <p
                        className={`font-semibold ${
                            status ===
                            "Verification successful"
                                ? "text-green-700"
                                : status.includes(
                                      "Unable"
                                  ) ||
                                  status.includes(
                                      "Authentication"
                                  )
                                ? "text-red-700"
                                : "text-blue-700"
                        }`}
                    >
                        {status}
                    </p>

                    {/* MESSAGE */}

                    {message && (
                        <div
                            className={`mt-4 rounded-xl p-4 font-semibold ${
                                status ===
                                "Verification successful"
                                    ? "bg-green-100 border border-green-300 text-green-700"
                                    : "bg-yellow-100 border border-yellow-300 text-yellow-800"
                            }`}
                        >
                            {message}
                        </div>
                    )}

                </div>

                {/* BACK BUTTON */}

                <button
                    type="button"
                    onClick={goToDashboard}
                    className="w-full mt-8 py-4 rounded-xl bg-gray-200 hover:bg-gray-300 transition font-bold"
                >
                    Back to Staff Dashboard
                </button>

            </div>

        </div>
    );
}

export default StaffQRScanner;
