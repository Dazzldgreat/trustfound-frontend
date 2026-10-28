import React, { useState } from "react";

const UploadImageSection = ({ onImageSelect }) => {
  const [preview, setPreview] = useState(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    // Send the actual file to the parent component
    onImageSelect(file);

    // Create preview
    setPreview(URL.createObjectURL(file));
  };

  return (
    <section className="bg-white dark:bg-gray-800 rounded-xl custom-shadow border border-gray-50 dark:border-gray-700 overflow-hidden">

      <div className="p-6 border-b border-gray-50 dark:border-gray-700 flex items-center gap-3">
        <span className="material-symbols-outlined text-primary">
          photo_camera
        </span>

        <h3 className="text-xl font-bold">
          1. Upload Item Image
        </h3>
      </div>

      <div className="p-8">

        <label className="flex flex-col items-center gap-6 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/20 px-6 py-12 hover:border-primary/50 transition-colors cursor-pointer">

          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
          />

          <span className="material-symbols-outlined text-primary text-5xl">
            cloud_upload
          </span>

          <div className="text-center">
            <h2 className="font-bold text-lg">
              Click to Upload
            </h2>

            <p className="text-gray-500">
              JPG, PNG (Maximum 5MB)
            </p>
          </div>

        </label>

        {preview && (
          <div className="mt-6">

            <img
              src={preview}
              alt="Preview"
              className="w-64 rounded-xl border mx-auto"
            />

          </div>
        )}

      </div>

    </section>
  );
};

export default UploadImageSection;