import { useState } from "react";
import { Outlet, useLocation, useParams } from "react-router-dom";

import UserSidebar from "./UserSidebar";
import UserTopbar from "./UserTopbar";

function getStoredObject(key) {
    try {
        return JSON.parse(localStorage.getItem(key) || "{}");
    } catch {
        return {};
    }
}

function UserLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const { companySlug: routeCompanySlug } = useParams();
    const location = useLocation();

    // ============================================================
    // STORED COMPANY AND USER
    // ============================================================

    const storedCompany = getStoredObject("company");
    const storedUser = getStoredObject("user");

    // ============================================================
    // ACTIVE COMPANY
    // ============================================================

    const searchParams = new URLSearchParams(location.search);

    const activeCompanySlug =
        routeCompanySlug ||
        searchParams.get("company") ||
        localStorage.getItem("companySlug") ||
        localStorage.getItem("company_slug") ||
        storedCompany.slug ||
        storedUser.company_slug ||
        storedUser.companySlug ||
        storedUser.organization_slug ||
        storedUser.organizationSlug ||
        "";

    // ============================================================
    // PAGE
    // ============================================================

    return (
        <div className="flex min-h-screen bg-cream">

            {/* SIDEBAR */}

            <UserSidebar
                sidebarOpen={sidebarOpen}
                closeSidebar={() => setSidebarOpen(false)}
                companySlug={activeCompanySlug}
                company={storedCompany}
            />

            {/* RIGHT SIDE */}

            <div className="flex min-h-screen flex-1 flex-col">

                {/* TOPBAR */}

                <UserTopbar
                    openSidebar={() => setSidebarOpen(true)}
                    companySlug={activeCompanySlug}
                    company={storedCompany}
                />

                {/* CONTENT */}

                <main className="flex-1 overflow-y-auto p-6">
                    <Outlet />
                </main>

            </div>
        </div>
    );
}

export default UserLayout;