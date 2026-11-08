import { PLACEHOLDER_IMAGE, resolveMediaUrl } from "../../theme";

function ReportCard({
    report,
    onView,
    onEdit,
    onDelete,
}) {

    // ============================================================
    // IMAGE URL
    // ============================================================

    const getImageUrl = (image) =>
        resolveMediaUrl(image) || PLACEHOLDER_IMAGE;

    const image = getImageUrl(
        report.image ||
        report.image_url ||
        report.photo ||
        report.photo_url
    );

    // ============================================================
    // STATUS COLOR
    // ============================================================

    const statusColor = () => {

        const status =
            String(report.status || "")
                .trim()
                .toLowerCase();

        switch (status) {

            case "pending":
                return "bg-yellow-100 text-yellow-700";

            case "matched":
                return "bg-blue-100 text-blue-700";

            case "approved":
                return "bg-stone-800 text-white";

            case "recovered":
                return "bg-green-100 text-green-700";

            case "verified":
                return "bg-green-100 text-green-700";

            default:
                return "bg-gray-100 text-gray-700";
        }
    };

    // ============================================================
    // IMAGE ERROR
    // ============================================================

    const handleImageError = (event) => {

        if (
            event.currentTarget.src.endsWith(
                PLACEHOLDER_IMAGE
            )
        ) {
            return;
        }

        event.currentTarget.src =
            PLACEHOLDER_IMAGE;
    };

    // ============================================================
    // PAGE
    // ============================================================

    return (

        <div className="bg-white rounded-3xl shadow hover:shadow-xl transition overflow-hidden">

            {/* IMAGE */}

            <button
                type="button"
                onClick={() => onView(report)}
                className="block w-full h-56 bg-gray-100 overflow-hidden"
                aria-label={`View ${report.item_name || "report"}`}
            >

                <img
                    src={image}
                    alt={
                        report.item_name ||
                        "Reported item"
                    }
                    onError={handleImageError}
                    className="w-full h-full item-image transition duration-300 hover:scale-[1.03]"
                />

            </button>

            {/* CONTENT */}

            <div className="p-6">

                {/* TITLE + STATUS */}

                <div className="flex justify-between items-start gap-4">

                    <h2
                        className="text-2xl font-bold text-gray-900 break-words cursor-pointer hover:text-primary transition"
                        onClick={() => onView(report)}
                    >

                        {report.item_name || "Unnamed Item"}

                    </h2>

                    <span
                        className={`shrink-0 px-3 py-1 rounded-full text-sm font-bold ${statusColor()}`}
                    >
                        {report.status || "Unknown"}
                    </span>

                </div>

                {/* CATEGORY */}

                <p className="text-gray-500 mt-2">

                    {report.category || "No category"}

                </p>

                {/* DETAILS */}

                <div className="mt-4 space-y-2 text-gray-700">

                    <p>

                        <strong>Type:</strong>{" "}

                        {report.type || "Unknown"}

                    </p>

                    <p>

                        <strong>Location:</strong>{" "}

                        {report.location ||
                            report.location_found ||
                            "Not provided"}

                    </p>

                    <p>

                        <strong>Date:</strong>{" "}

                        {report.date_lost ||
                            report.date_found ||
                            report.created_at ||
                            "Not provided"}

                    </p>

                </div>

                {/* ACTIONS */}

                <div className="flex flex-wrap gap-3 mt-6">

                    <button
                        type="button"
                        onClick={() =>
                            onView(report)
                        }
                        className="flex-1 min-w-[90px] bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-semibold transition"
                    >
                        View
                    </button>

                    {![
                        "Matched",
                        "Approved",
                        "Recovered",
                    ].includes(
                        String(
                            report.status || ""
                        ).trim()
                    ) && (

                        <>

                            <button
                                type="button"
                                onClick={() =>
                                    onEdit(report)
                                }
                                className="flex-1 min-w-[90px] bg-yellow-500 hover:bg-yellow-600 text-white py-2.5 rounded-xl font-semibold transition"
                            >
                                Edit
                            </button>

                            <button
                                type="button"
                                onClick={() =>
                                    onDelete(report)
                                }
                                className="flex-1 min-w-[90px] bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-xl font-semibold transition"
                            >
                                Delete
                            </button>

                        </>

                    )}

                </div>

            </div>

        </div>

    );
}

export default ReportCard;

