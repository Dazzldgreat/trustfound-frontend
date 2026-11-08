import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    ArrowLeft,
    Calendar,
    MapPin,
    User,
    Phone,
    Mail,
    Package,
    ImageIcon,
    CheckCircle,
    ClipboardCheck,
} from "lucide-react";
import { API } from "../config";

function StaffReceivedFoundItemDetail() {

    const { id } = useParams();
    const navigate = useNavigate();

    const [item, setItem] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {

        const loadItem = async () => {

            try {

                const access = localStorage.getItem("access");

                const response = await fetch(
                    `${API}/staff/report-found-item/${id}/`,
                    {
                        headers: {
                            Authorization: `Bearer ${access}`,
                        },
                    }
                );

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error);
                }

                setItem(data);

            } catch (err) {

                console.error(err);

            } finally {

                setLoading(false);

            }

        };

        loadItem();

    }, [id]);

    if (loading) {

        return (

            <div className="flex justify-center items-center h-screen">

                <h2 className="text-2xl font-bold">
                    Loading...
                </h2>

            </div>

        );

    }

    if (!item) {

        return (

            <div className="flex justify-center items-center h-screen">

                <h2 className="text-red-600 text-2xl font-bold">

                    Item Not Found

                </h2>

            </div>

        );

    }

    return (

        <div className="max-w-7xl mx-auto p-8">

            <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 bg-gray-700 hover:bg-gray-800 text-white px-5 py-2 rounded-lg mb-8"
            >
                <ArrowLeft size={18} />
                Back
            </button>

            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">

                <div className="bg-blue-600 text-white p-8">

                    <div className="flex justify-between items-center">

                        <div>

                            <h1 className="text-4xl font-bold">

                                Reported Found Item

                            </h1>

                            <p className="opacity-90 mt-2">

                                Record #{item.id}

                            </p>

                        </div>

                        <span className="bg-white text-blue-700 px-5 py-2 rounded-full font-bold">

                            {item.status}

                        </span>

                    </div>

                </div>

                <div className="grid lg:grid-cols-2 gap-8 p-8">

                    {/* IMAGE */}

                    <div>

                        {item.image ? (

                            <img
                                src={item.image}
                                alt={item.item_name}
                                className="w-full h-[420px] item-image zoomable rounded-xl shadow"
                            />

                        ) : (

                            <div className="h-[420px] rounded-xl bg-gray-200 flex items-center justify-center">

                                <ImageIcon size={70} />

                            </div>

                        )}

                    </div>

                    {/* DETAILS */}

                    <div className="space-y-4">

                        <div className="flex items-center gap-3">

                            <Package className="text-blue-600" />

                            <span>

                                <strong>Item:</strong> {item.item_name}

                            </span>

                        </div>

                        <div>

                            <strong>Category:</strong> {item.category}

                        </div>

                        <div>

                            <strong>Description:</strong>

                            <p className="mt-1 text-gray-600">

                                {item.description}

                            </p>

                        </div>

                        <div className="flex items-center gap-3">

                            <User className="text-green-600" />

                            <span>

                                <strong>Finder:</strong> {item.finder_name}

                            </span>

                        </div>

                        <div className="flex items-center gap-3">

                            <Mail className="text-red-500" />

                            <span>

                                <strong>Email:</strong> {item.finder_email}

                            </span>

                        </div>

                        <div className="flex items-center gap-3">

                            <Phone className="text-purple-600" />

                            <span>

                                <strong>Phone:</strong> {item.finder_phone}

                            </span>

                        </div>

                        <div className="flex items-center gap-3">

                            <MapPin className="text-orange-500" />

                            <span>

                                <strong>Location:</strong> {item.location_found}

                            </span>

                        </div>

                        <div className="flex items-center gap-3">

                            <Calendar className="text-blue-500" />

                            <span>

                                <strong>Date Found:</strong> {item.date_found}

                            </span>

                        </div>

                    </div>

                </div>

                {/* EXTRA INFORMATION */}

                <div className="p-8 pt-0">

                    <div className="bg-gray-50 rounded-2xl shadow-sm p-8">

                        <h2 className="text-2xl font-bold mb-6">

                            Verification Information

                        </h2>

                        <div className="grid md:grid-cols-3 gap-6">

                            <div className="bg-white rounded-xl shadow p-6">

                                <ClipboardCheck
                                    size={32}
                                    className="text-blue-600 mb-4"
                                />

                                <h3 className="font-semibold text-gray-500">

                                    Status

                                </h3>

                                <p className="text-xl font-bold mt-2 text-blue-600">

                                    {item.status}

                                </p>

                            </div>

                            <div className="bg-white rounded-xl shadow p-6">

                                <CheckCircle
                                    size={32}
                                    className="text-green-600 mb-4"
                                />

                                <h3 className="font-semibold text-gray-500">

                                    Verified By

                                </h3>

                                <p className="text-lg font-bold mt-2">

                                    {item.verified_by || "Not Yet Verified"}

                                </p>

                            </div>

                            <div className="bg-white rounded-xl shadow p-6">

                                <User
                                    size={32}
                                    className="text-purple-600 mb-4"
                                />

                                <h3 className="font-semibold text-gray-500">

                                    Received From

                                </h3>

                                <p className="text-lg font-bold mt-2">

                                    {item.received_from || "N/A"}

                                </p>

                            </div>

                        </div>

                    </div>

                </div>

            </div>

        </div>

    );

}

export default StaffReceivedFoundItemDetail;