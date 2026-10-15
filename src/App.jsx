import React from "react";
import {
    BrowserRouter,
    Routes,
    Route,
    Navigate,
} from "react-router-dom";

/* ============================================================
   COMPANY PAGES
============================================================ */

import CompanyDashboard from "./pages/company/CompanyDashboard";
import CompanyRegister from "./pages/company/CompanyRegister";
import CompanyLoginPage from "./pages/company/CompanyLoginPage";
import CompanyVerifyCodePage from "./pages/company/CompanyVerifyCodePage";
import CompanySetup from "./pages/company/CompanySetup";
import CompanyPublicPage from "./pages/company/CompanyPublicPage";
import WebsitePreview from "./pages/company/WebsitePreview";
import WebsiteSettings from "./pages/company/WebsiteSettings";
/* ============================================================
   CUSTOMER PAGES
============================================================ */

import LandingPage from "./pages/LandingPage";
import DashboardPage from "./pages/users/dashboardPage";
import MyLostReports from "./pages/users/MyLostReports";
import MyFoundReports from "./pages/users/MyFoundReports";
import LostItem from "./pages/users/LostItem";
import LostItemDetails from "./pages/users/LostItemDetails";
import CustomerMatchDetail from "./pages/users/CustomerMatchDetail";
import FoundItem from "./pages/users/FoundItems";
import FoundItemDetails from "./pages/FoundItemDetails";
import EditLostItem from "./pages/users/EditLostItem";
import EditFoundItem from "./pages/users/EditFoundItem";

import LoginPage from "./pages/users/loginPage";
import SignupPage from "./pages/users/SignUpPage";

import VerifyCodePage from "./pages/VerifyCodePage";
import ForgotPasswordPage from "./pages/users/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";

import FoundSuccess from "./pages/users/FoundSuccess";
import SubmissionPage from "./component/custtomereport/Submision-comfirmed";
import TrackStatusPage from "./component/custtomereport/TrackPage";
import Notifications from "./pages/users/Notifications";
import RecoverItem from "./pages/RecoverItem";

/* ============================================================
   STAFF PAGES
============================================================ */

import StaffLoginPage from "./pages/StaffLoginPage";
import StaffDashboard from "./pages/staffDashboard";
import StaffQRScanner from "./pages/StaffQRScanner";
import StaffVerificationSuccess from "./pages/StaffVerificationSuccess";
import StaffFoundItemDetail from "./pages/StaffFoundItemDetail";
import StaffMatchDetail from "./pages/StaffMatchDetail";
import StaffMatches from "./pages/StaffMatches";
import StaffNotifications from "./pages/StaffNotifications";
import StaffReportFoundItem from "./pages/StaffReportFoundItem";
import FoundByStaff from "./pages/FoundByStaff";
import ApprovedMatchDetail from "./pages/ApprovedMatchDetail";
import StaffReceivedFoundItemDetail from "./pages/StaffReceivedFoundItemDetail";
import FoundByStaffDetail from "./pages/FoundByStaffDetail";
import VerifiedItems from "./pages/VerifiedItems";
import ClaimRequests from "./pages/ClaimRequests";
import ClaimRequestDetail from "./pages/ClaimRequestDetail";
import PendingVerification from "./pages/PendingVerification";

/* ============================================================
   LAYOUTS
============================================================ */

import UserLayout from "./component/layout/UserLayout";
import StaffLayout from "./component/layout/StaffLayout";

/* ============================================================
   PROTECTED ROUTES
============================================================ */

import ProtectedRoute from "./pages/ProtectedRoute";
import ProtectedStaffRoute from "./pages/ProtectedStaffRoute";


function App() {
    return (
        <BrowserRouter>

            <Routes>

                {/* ====================================================
                    PUBLIC LANDING
                ==================================================== */}

                <Route
                    path="/"
                    element={<LandingPage />}
                />


                {/* ====================================================
                    COMPANY PUBLIC PAGE

                    Example:
                    /company/abc-hotel
                ==================================================== */}

                <Route
                    path="/company/:slug"
                    element={<CompanyPublicPage />}
                />


                {/* ====================================================
                    COMPANY AUTH

                    These are global because the user does not
                    necessarily have a company slug yet.
                ==================================================== */}

                <Route
                    path="/company/register"
                    element={<CompanyRegister />}
                />

                <Route
                    path="/company/login"
                    element={<CompanyLoginPage />}
                />

                <Route
                    path="/company/verify-code"
                    element={<CompanyVerifyCodePage />}
                />

                <Route
                    path="/company/setup"
                    element={<CompanySetup />}
                />

                <Route
                    path="/company-dashboard"
                    element={<CompanyDashboard />}
                />

                <Route
                    path="/company/:companySlug/website-settings"
                    element={<WebsiteSettings />}
                />

                <Route
                    path="/company/:companySlug/website-preview"
                    element={<WebsitePreview />}
                />

               
                {/* ====================================================
                    CUSTOMER GLOBAL AUTH

                    Login/signup can happen before company selection.
                ==================================================== */}

                <Route
                    path="/login-page"
                    element={<LoginPage />}
                />

                <Route
                    path="/signup-page"
                    element={<SignupPage />}
                />

                <Route
                    path="/verify-code"
                    element={<VerifyCodePage />}
                />

                <Route
                    path="/forgot-password"
                    element={<ForgotPasswordPage />}
                />

                <Route
                    path="/reset-password"
                    element={<ResetPasswordPage />}
                />


                {/* ====================================================
                    COMPANY-AWARE STAFF LOGIN

                    Example:
                    /company/abc-hotel/staff-login
                ==================================================== */}

                <Route
                    path="/company/:companySlug/staff-login"
                    element={<StaffLoginPage />}
                />


                {/* ====================================================
                    COMPANY-AWARE CUSTOMER AREA

                    Everything inside this route automatically has:

                    /company/:companySlug/...

                    Example:
                    /company/abc-hotel/dashboard
                    /company/abc-hotel/my-lost-reports
                ==================================================== */}

                <Route
                    path="/company/:companySlug"
                    element={
                        <ProtectedRoute>
                            <UserLayout />
                        </ProtectedRoute>
                    }
                >

                    {/* CUSTOMER DASHBOARD */}

                    <Route
                        path="dashboard"
                        element={<DashboardPage />}
                    />

                    {/* LOST REPORTS */}

                    <Route
                        path="my-lost-reports"
                        element={<MyLostReports />}
                    />

                    {/* FOUND REPORTS */}

                    <Route
                        path="my-found-reports"
                        element={<MyFoundReports />}
                    />

                    {/* REPORT LOST ITEM */}

                    <Route
                        path="customer-report"
                        element={<LostItem />}
                    />

                    {/* REPORT FOUND ITEM */}

                    <Route
                        path="found-item"
                        element={<FoundItem />}
                    />

                    {/* LOST ITEM DETAILS */}

                    <Route
                        path="lost-item/:id"
                        element={<LostItemDetails />}
                    />

                    {/* CUSTOMER MATCH */}

                    <Route
                        path="customer-match/:id"
                        element={<CustomerMatchDetail />}
                    />

                    {/* FOUND ITEM DETAILS */}

                    <Route
                        path="found-item/:id"
                        element={<FoundItemDetails />}
                    />

                    {/* EDIT LOST ITEM */}

                    <Route
                        path="edit-lost-item/:id"
                        element={<EditLostItem />}
                    />

                    {/* EDIT FOUND ITEM */}

                    <Route
                        path="edit-found-item/:id"
                        element={<EditFoundItem />}
                    />

                    {/* SUBMISSION */}

                    <Route
                        path="submission-page"
                        element={<SubmissionPage />}
                    />

                    {/* RECOVER ITEM */}

                    <Route
                        path="recover-item/:id"
                        element={<RecoverItem />}
                    />

                    {/* TRACK */}

                    <Route
                        path="track-page"
                        element={<TrackStatusPage />}
                    />

                    {/* FOUND SUCCESS */}

                    <Route
                        path="found-success/:id"
                        element={<FoundSuccess />}
                    />

                    {/* CUSTOMER NOTIFICATIONS */}

                    <Route
                        path="notifications"
                        element={<Notifications />}
                    />

                </Route>


                {/* ====================================================
                    COMPANY-AWARE STAFF AREA

                    Everything inside this route automatically has:

                    /company/:companySlug/...

                    Example:
                    /company/abc-hotel/staff-dashboard
                    /company/abc-hotel/staff/matches
                ==================================================== */}

                <Route
                    path="/company/:companySlug"
                    element={
                        <ProtectedStaffRoute requiredRole="staff">
                            <StaffLayout />
                        </ProtectedStaffRoute>
                    }
                >

                    {/* STAFF DASHBOARD */}

                    <Route
                        path="staff-dashboard"
                        element={<StaffDashboard />}
                    />


                    {/* REPORT FOUND ITEM */}

                    <Route
                        path="staff/report-found-item"
                        element={<StaffReportFoundItem />}
                    />

                    <Route
                        path="staff/report-found-item/:id"
                        element={
                            <StaffReceivedFoundItemDetail />
                        }
                    />


                    {/* FOUND BY STAFF */}

                    <Route
                        path="staff/found-by-staff"
                        element={<FoundByStaff />}
                    />

                    <Route
                        path="staff/found-items"
                        element={<FoundByStaff />}
                    />

                    <Route
                        path="staff/found-by-staff/:id"
                        element={<FoundByStaffDetail />}
                    />


                    {/* FOUND ITEM */}

                    <Route
                        path="staff/found-item/:id"
                        element={<StaffFoundItemDetail />}
                    />


                    {/* VERIFIED */}

                    <Route
                        path="staff/verified-items"
                        element={<VerifiedItems />}
                    />

                    <Route
                        path="staff/verification-success"
                        element={
                            <StaffVerificationSuccess />
                        }
                    />


                    {/* PENDING */}

                    <Route
                        path="staff/pending"
                        element={<PendingVerification />}
                    />


                    {/* AI MATCHES */}

                    <Route
                        path="staff/matches"
                        element={<StaffMatches />}
                    />

                    <Route
                        path="staff/matches/:id"
                        element={<StaffMatchDetail />}
                    />


                    {/* APPROVED */}

                    <Route
                        path="staff/approved/:id"
                        element={<ApprovedMatchDetail />}
                    />


                    {/* CLAIM REQUESTS */}

                    <Route
                        path="staff/claim-requests"
                        element={<ClaimRequests />}
                    />

                    <Route
                        path="staff/claim-requests/:id"
                        element={<ClaimRequestDetail />}
                    />


                    {/* QR SCANNER */}

                    <Route
                        path="staff/scan"
                        element={<StaffQRScanner />}
                    />


                    {/* STAFF NOTIFICATIONS */}

                    <Route
                        path="staff-notifications"
                        element={<StaffNotifications />}
                    />

                </Route>


                {/* ====================================================
                    FALLBACK
                ==================================================== */}

                <Route
                    path="*"
                    element={
                        <Navigate
                            to="/"
                            replace
                        />
                    }
                />

            </Routes>

        </BrowserRouter>
    );
}

export default App;