import { useState } from "react";
import { Outlet, useParams } from "react-router-dom";

import StaffSidebar from "./StaffSidebar";
import StaffTopbar from "./StaffTopbar";

function StaffLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const { companySlug } = useParams();

    const storedCompany = JSON.parse(
        localStorage.getItem("company") || "{}"
    );

    const activeCompanySlug =
        companySlug ||
        storedCompany.slug ||
        "";

    return (
        <div className="flex min-h-screen bg-gray-100">

            {/* Sidebar */}
            <StaffSidebar
                sidebarOpen={sidebarOpen}
                closeSidebar={() =>
                    setSidebarOpen(false)
                }
                companySlug={activeCompanySlug}
            />

            {/* Right Side */}
            <div className="flex flex-col flex-1 min-h-screen">

                <StaffTopbar
                    openSidebar={() =>
                        setSidebarOpen(true)
                    }
                    companySlug={activeCompanySlug}
                />

                <main className="flex-1 p-6 overflow-y-auto">
                    <Outlet />
                </main>

            </div>

        </div>
    );
}

export default StaffLayout;