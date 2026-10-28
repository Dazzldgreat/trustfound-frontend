import { useNavigate } from "react-router-dom";

const FormActions = ({ onSaveDraft }) => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">

      {/* Save Draft */}
      <button
        type="button"
        onClick={onSaveDraft}
        className="w-full sm:w-auto px-8 py-4 text-gray-500 hover:text-gray-700 font-bold transition-colors"
      >
        Save as Draft
      </button>

      {/* Right Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">

        <button
          type="button"
          onClick={() => navigate("/dashboard")}
          className="w-full sm:w-auto px-4 h-12 text-gray-500 font-bold hover:text-red-500"
        >
          Cancel
        </button>

        <button
          type="submit"
          className="px-12 py-4 bg-primary text-white font-bold rounded-xl hover:brightness-110 shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2"
        >
          Next Step
          <span className="material-symbols-outlined">
            arrow_forward
          </span>
        </button>

      </div>
    </div>
  );
};

export default FormActions;