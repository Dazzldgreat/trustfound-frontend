import React, { useState } from "react";

const categories = [
  { name: "Electronics", icon: "smartphone" },
  { name: "Wallet/Bag", icon: "account_balance_wallet" },
  { name: "Keys", icon: "key" },
  { name: "Clothing", icon: "apparel" },
];

const ItemDescriptionSection = () => {
  const [selectedCategory, setSelectedCategory] = useState("Electronics");

  return (
    <section className="bg-white dark:bg-gray-800 rounded-xl custom-shadow border border-gray-50 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-50 dark:border-gray-700 flex items-center gap-3">
        <span className="material-symbols-outlined text-primary">
          description
        </span>
        <h3 className="text-xl font-bold">2. Item Description</h3>
      </div>

      {/* Body */}
      <div className="p-8 space-y-6">
        {/* Item Name */}
        <div>
          <label className="block text-sm font-bold mb-2">Item Name</label>
          <input
            className="w-full rounded-lg border-gray-200 dark:border-gray-700 dark:bg-gray-900 focus:ring-primary focus:border-primary transition-all"
            placeholder="e.g. Silver iPhone 13 Pro, Leather Wallet"
            type="text"
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-bold mb-4">
            Select Category
          </label>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.map((cat) => (
              <div
                key={cat.name}
                onClick={() => setSelectedCategory(cat.name)}
                className={`
                  border-2 p-4 rounded-xl flex flex-col items-center gap-2
                  cursor-pointer transition-all text-center
                  ${
                    selectedCategory === cat.name
                      ? "border-primary bg-primary/5"
                      : "border-gray-100 dark:border-gray-700"
                  }
                `}
              >
                <span
                  className={`material-symbols-outlined text-2xl ${
                    selectedCategory === cat.name
                      ? "text-primary"
                      : "text-gray-400"
                  }`}
                >
                  {cat.icon}
                </span>
                <span className="text-sm font-semibold">{cat.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-bold mb-2">
            Detailed Description
          </label>
          <textarea
            className="w-full rounded-lg border-gray-200 dark:border-gray-700 dark:bg-gray-900 focus:ring-primary focus:border-primary transition-all"
            placeholder="Mention any unique identifiers like scratches, stickers, case color, or contents inside..."
            rows={4}
          />
        </div>
      </div>
    </section>
  );
};

export default ItemDescriptionSection;
