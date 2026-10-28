import { useLocation, useNavigate } from "react-router-dom";

function StaffVerificationSuccess() {
  const navigate = useNavigate();
  const location = useLocation();

  const data = location.state;

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="bg-white p-10 rounded-3xl shadow-xl text-center">
          <h1 className="text-3xl font-bold text-red-600">
            Verification Data Not Found
          </h1>

          <button
           onClick={() => navigate("/staff-dashboard")}
            className="mt-8 bg-blue-600 text-white px-8 py-4 rounded-xl"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-green-50 flex items-center justify-center px-6">

      <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full p-10">

        <div className="flex justify-center">

          <div className="w-28 h-28 rounded-full bg-green-100 flex items-center justify-center">

            <span className="material-symbols-outlined text-green-600 text-7xl">
              check_circle
            </span>

          </div>

        </div>

        <h1 className="text-4xl font-black text-center mt-8 text-green-700">
          Verification Successful
        </h1>

        <p className="text-center text-gray-500 mt-4">
          The item has now been officially accepted into the Lost & Found system.
        </p>

        <div className="bg-slate-100 rounded-2xl p-6 mt-10 space-y-4">

          <div className="flex justify-between">
            <span className="font-semibold">
              Item
            </span>

            <span>
              {data.item_name}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="font-semibold">
              Status
            </span>

            <span className="text-green-600 font-bold">
              {data.status}
            </span>
          </div>
        <div className="flex justify-between">
          <span className="font-semibold">
            Verified By
          </span>

          <span className="font-bold text-blue-600">
           {data.verified_by}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="font-semibold">
            Item ID
          </span>

          <span>
            #{data.item_id}
          </span>
        </div>
          <div className="flex justify-between">
            <span className="font-semibold">
              Message
            </span>

            <span>
              {data.message}
            </span>
          </div>

        </div>

        <div className="grid grid-cols-2 gap-4 mt-10">

          <button
            onClick={() => navigate("/staff/scan")}
            className="bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold"
          >
            Scan Another
          </button>

          <button
            onClick={() => navigate("/staff-dashboard")}
            className="bg-gray-300 hover:bg-gray-400 py-4 rounded-xl font-bold"
          >
            Dashboard
          </button>

        </div>

      </div>

    </div>
  );
}

export default StaffVerificationSuccess;