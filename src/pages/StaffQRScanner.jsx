
import {
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";

import { Html5Qrcode } from "html5-qrcode";

import {
    useLocation,
    useNavigate,
    useParams,
} from "react-router-dom";

import { API } from "../config";

function StaffQRScanner() {
    const navigate = useNavigate();
    const location = useLocation();
    const { companySlug } = useParams();

    // =========================================================
    // STORED DATA
    // =========================================================

    const getStoredObject = (key) => {
        try {
            return JSON.parse(
                localStorage.getItem(key) || "{}"
            );
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
    // SELECTED ITEM
    // =========================================================

    const expectedToken =
        location.state?.verificationToken || "";

    const passedItemId =
        location.state?.itemId || null;

    const passedItemName =
        location.state?.itemName || "";

    // =========================================================
    // COMPANY ROUTES
    // =========================================================

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

    // =========================================================
    // AUTHENTICATION
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
            companyRoute("/staff-login"),
            { replace: true }
        );
    }, [navigate, companyRoute]);

    // =========================================================
    // REFS
    // =========================================================

    const scannerRef = useRef(null);
    const isStartingRef = useRef(false);
    const hasScannedRef = useRef(false);
    const mountedRef = useRef(true);

    // =========================================================
    // STATE
    // =========================================================

    const [message, setMessage] = useState("");

    const [status, setStatus] = useState(
        "Preparing camera..."
    );

    const [verifying, setVerifying] = useState(false);

    const [manualCode, setManualCode] = useState("");

    const [scannerVersion, setScannerVersion] = useState(0);

    // =========================================================
    // EXTRACT TOKEN FROM QR CODE OR MANUAL INPUT
    // =========================================================

    const extractToken = (decodedText) => {
        let token = String(decodedText || "").trim();

        if (!token) {
            return "";
        }

        if (
            token.startsWith("http://") ||
            token.startsWith("https://")
        ) {
            try {
                const url = new URL(token);

                const queryToken =
                    url.searchParams.get("token") ||
                    url.searchParams.get(
                        "verification_token"
                    );

                if (queryToken) {
                    return queryToken.trim();
                }

                const parts = url.pathname
                    .split("/")
                    .filter(Boolean);

                return parts.length
                    ? parts[parts.length - 1].trim()
                    : "";

            } catch {
                return "";
            }
        }

        return token;
    };

    // =========================================================
    // STOP CAMERA
    // =========================================================

    const stopScanner = async () => {
        const scanner = scannerRef.current;

        if (!scanner) {
            return;
        }

        try {
            if (scanner.isScanning) {
                await scanner.stop();
            }
        } catch (error) {
            console.log("Scanner stop:", error);
        }
    };

    // =========================================================
    // VERIFY TOKEN
    // =========================================================

    const verifyQRCode = useCallback(
        async (submittedToken) => {
            const cleanToken = String(
                submittedToken || ""
            ).trim();

            if (!cleanToken) {
                setMessage("Invalid verification code.");
                setStatus("Invalid verification code");
                hasScannedRef.current = false;
                return;
            }

            // Ensure the submitted token belongs to the selected item.

            if (
                expectedToken &&
                cleanToken !== expectedToken.trim()
            ) {
                setMessage(
                    "This code does not belong to the selected found item."
                );

                setStatus("Incorrect verification code");

                hasScannedRef.current = false;

                return;
            }

            try {
                setVerifying(true);
                setStatus("Verifying submitted code...");
                setMessage("");

                const access = getAccessToken();

                if (!access) {
                    setMessage(
                        "Your session has expired. Please log in again."
                    );

                    setStatus("Authentication required");

                    handleUnauthorized();

                    return;
                }

                const response = await fetch(
                    `${API}/staff/verify-found-item/${encodeURIComponent(
                        cleanToken
                    )}/`,
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

                const contentType =
                    response.headers.get("content-type") || "";

                let data = {};

                if (contentType.includes("application/json")) {
                    data = await response.json();
                }

                if (!response.ok) {
                    setMessage(
                        data.error ||
                        data.detail ||
                        data.message ||
                        "Verification failed. Please try again."
                    );

                    setStatus("Verification failed");

                    hasScannedRef.current = false;

                    return;
                }

                setMessage(
                    data.message ||
                    "Item verified successfully."
                );

                setStatus("Verification successful");

                navigate(
                    companyRoute(
                        "/staff/verification-success"
                    ),
                    {
                        replace: true,
                        state: {
                            ...data,
                            itemId:
                                data.itemId || passedItemId,
                            itemName:
                                data.itemName || passedItemName,
                        },
                    }
                );

            } catch (error) {
                console.error(
                    "Verification error:",
                    error
                );

                setMessage(
                    "Unable to connect to the server. Please try again."
                );

                setStatus("Verification failed");

                hasScannedRef.current = false;

            } finally {
                setVerifying(false);
            }
        },
        [
            expectedToken,
            getAccessToken,
            handleUnauthorized,
            navigate,
            companyRoute,
            passedItemId,
            passedItemName,
        ]
    );

    // =========================================================
    // START QR SCANNER
    // =========================================================

    useEffect(() => {
        let mounted = true;
        let scanner = null;

        mountedRef.current = true;

        const startScanner = async () => {
            const reader = document.getElementById("reader");

            if (
                !reader ||
                scannerRef.current ||
                isStartingRef.current
            ) {
                return;
            }

            try {
                isStartingRef.current = true;

                setStatus("Starting camera...");
                setMessage("");

                scanner = new Html5Qrcode("reader");

                scannerRef.current = scanner;

                await scanner.start(
                    { facingMode: "environment" },
                    {
                        fps: 10,
                        qrbox: {
                            width: 250,
                            height: 250,
                        },
                        aspectRatio: 1.0,
                    },

                    async (decodedText) => {
                        if (
                            !mounted ||
                            hasScannedRef.current ||
                            !mountedRef.current
                        ) {
                            return;
                        }

                        const scannedToken =
                            extractToken(decodedText);

                        if (!scannedToken) {
                            setMessage(
                                "The scanned QR code does not contain a valid verification token."
                            );

                            setStatus("Invalid QR code");

                            return;
                        }

                        // Reject a QR code belonging to another item.

                        if (
                            expectedToken &&
                            scannedToken !== expectedToken.trim()
                        ) {
                            setMessage(
                                "Wrong QR code. Please scan the QR code belonging to the selected item."
                            );

                            setStatus("Incorrect QR code");

                            return;
                        }

                        // A real QR scan has now occurred.

                        hasScannedRef.current = true;

                        setMessage("");
                        setStatus("QR code scanned successfully");

                        try {
                            if (
                                scannerRef.current?.isScanning
                            ) {
                                await scannerRef.current.stop();
                            }
                        } catch (error) {
                            console.log(
                                "Scanner stop:",
                                error
                            );
                        }

                        if (!mountedRef.current) {
                            return;
                        }

                        await verifyQRCode(scannedToken);
                    },

                    () => {
                        // Waiting for a QR code.
                    }
                );

                isStartingRef.current = false;

                if (mounted && mountedRef.current) {
                    setStatus(
                        "Camera ready - scan the item's QR code"
                    );
                }

            } catch (error) {
                isStartingRef.current = false;

                console.error(
                    "QR scanner start error:",
                    error
                );

                if (!mounted) {
                    return;
                }

                setStatus("Unable to access camera");

                setMessage(
                    "Could not start the camera. Please allow camera permission and try again."
                );

                scannerRef.current = null;
            }
        };

        startScanner();

        return () => {
            mounted = false;
            mountedRef.current = false;

            const currentScanner = scannerRef.current;

            scannerRef.current = null;

            if (!currentScanner) {
                return;
            }

            const cleanup = async () => {
                try {
                    if (currentScanner.isScanning) {
                        await currentScanner.stop();
                    }

                    currentScanner.clear();

                } catch (error) {
                    console.log(
                        "Scanner cleanup:",
                        error
                    );
                }
            };

            cleanup();
        };

    }, [
        scannerVersion,
        expectedToken,
        verifyQRCode,
    ]);

    // =========================================================
    // MANUAL CODE VERIFICATION
    // =========================================================

    const handleManualVerification = async () => {
        if (verifying || hasScannedRef.current) {
            return;
        }

        const enteredToken = extractToken(manualCode);

        if (!enteredToken) {
            setMessage(
                "Please enter a valid verification code."
            );

            setStatus("Invalid verification code");

            return;
        }

        if (
            expectedToken &&
            enteredToken !== expectedToken.trim()
        ) {
            setMessage(
                "This code does not belong to the selected found item."
            );

            setStatus("Incorrect verification code");

            return;
        }

        hasScannedRef.current = true;

        setMessage("");
        setStatus("Submitting manual verification code...");

        await stopScanner();

        await verifyQRCode(enteredToken);
    };

    // =========================================================
    // RESTART CAMERA
    // =========================================================

    const restartScanner = async () => {
        if (verifying) {
            return;
        }

        hasScannedRef.current = false;

        await stopScanner();

        scannerRef.current = null;

        setMessage("");
        setStatus("Restarting camera...");

        setScannerVersion((previous) => previous + 1);
    };

    // =========================================================
    // BACK TO PENDING VERIFICATION
    // =========================================================

    const goBack = async () => {
        await stopScanner();

        navigate(
            companyRoute("/staff/pending"),
            { replace: true }
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

                {/* HEADING */}

                <h1 className="text-3xl font-black text-center mb-3">
                    Staff Item Verification
                </h1>

                <p className="text-center text-gray-500 mb-8">
                    Scan the actual QR code attached to the found item,
                    or enter its verification code manually.
                </p>

                {/* SELECTED ITEM */}

                {expectedToken && (
                    <div className="mb-6 rounded-xl bg-blue-50 border border-blue-200 p-4">

                        <p className="text-sm text-blue-600 font-bold">
                            Selected Found Item
                        </p>

                        <p className="text-lg text-blue-900 font-black mt-1">
                            {passedItemName || "Found Item"}
                        </p>

                        {passedItemId && (
                            <p className="text-xs text-blue-700 mt-1">
                                Item ID: {passedItemId}
                            </p>
                        )}

                        <p className="text-xs text-blue-700 mt-2">
                            The submitted code must match this item.
                        </p>

                    </div>
                )}

                {/* CAMERA SCANNER */}

                <div
                    id="reader"
                    className="w-full max-w-md mx-auto rounded-2xl overflow-hidden bg-black min-h-[280px]"
                />

                {/* CAMERA INSTRUCTIONS */}

                <div className="mt-5 rounded-xl bg-gray-50 border border-gray-200 p-4">

                    <p className="font-bold text-gray-800">
                        Scan QR Code
                    </p>

                    <p className="text-sm text-gray-600 mt-2">
                        Position the item's QR code inside the camera
                        scanning area. Verification starts only after
                        the correct QR code is detected.
                    </p>

                </div>

                {/* DIVIDER */}

                <div className="flex items-center gap-4 my-7">

                    <div className="flex-1 h-px bg-gray-200" />

                    <span className="text-xs font-bold text-gray-400">
                        OR ENTER CODE MANUALLY
                    </span>

                    <div className="flex-1 h-px bg-gray-200" />

                </div>

                {/* MANUAL VERIFICATION CODE */}

                <div className="border border-gray-200 rounded-2xl p-5">

                    <h2 className="text-lg font-black text-gray-900">
                        Enter Verification Code
                    </h2>

                    <p className="text-sm text-gray-500 mt-2">
                        If you cannot scan the QR code, enter the
                        verification token associated with the item.
                    </p>

                    <input
                        type="text"
                        value={manualCode}
                        onChange={(e) => {
                            setManualCode(e.target.value);
                            setMessage("");
                        }}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                handleManualVerification();
                            }
                        }}
                        placeholder="Enter verification code"
                        disabled={verifying}
                        className="w-full mt-4 px-4 py-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    />

                    <button
                        type="button"
                        onClick={handleManualVerification}
                        disabled={
                            !manualCode.trim() ||
                            verifying ||
                            hasScannedRef.current
                        }
                        className="w-full mt-3 py-4 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {verifying
                            ? "Verifying..."
                            : "Verify Code"}
                    </button>

                </div>

                {/* STATUS */}

                <div className="mt-6 text-center">

                    <p
                        className={`font-semibold ${
                            status === "Verification successful"
                                ? "text-green-700"
                                : status.includes("failed") ||
                                  status.includes("Unable") ||
                                  status.includes("Incorrect") ||
                                  status.includes("Invalid")
                                ? "text-red-700"
                                : "text-blue-700"
                        }`}
                    >
                        {verifying
                            ? "Verifying submitted code..."
                            : status}
                    </p>

                    {message && (
                        <div
                            className={`mt-4 rounded-xl p-4 font-semibold ${
                                status === "Verification successful"
                                    ? "bg-green-100 border border-green-300 text-green-700"
                                    : "bg-yellow-100 border border-yellow-300 text-yellow-800"
                            }`}
                        >
                            {message}
                        </div>
                    )}

                </div>

                {/* RESTART CAMERA */}

                {!verifying && (
                    <button
                        type="button"
                        onClick={restartScanner}
                        className="w-full mt-6 py-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition"
                    >
                        Restart Camera
                    </button>
                )}

                {/* BACK BUTTON */}

                <button
                    type="button"
                    onClick={goBack}
                    disabled={verifying}
                    className="w-full mt-4 py-4 rounded-xl bg-gray-200 hover:bg-gray-300 transition font-bold disabled:opacity-50"
                >
                    ← Back to Pending Verification
                </button>

            </div>
        </div>
    );
}

export default StaffQRScanner;
