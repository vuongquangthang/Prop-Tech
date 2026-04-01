import { createBrowserRouter } from "react-router";
import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage";
import { UnauthorizedPage } from "./pages/UnauthorizedPage";
import { PlatformSelector } from "./components/PlatformSelector";
import { AppSelector } from "./components/AppSelector";
import { AdminLayout } from "./components/AdminLayout";
import { WireframeOverviewPage } from "./pages/WireframeOverviewPage";
import { DashboardPage } from "./pages/DashboardPage";
import { BuildingManagementPage } from "./pages/BuildingManagementPage";
import { ServicePricingPage } from "./pages/ServicePricingPage";
import { AssetInventoryPage } from "./pages/AssetInventoryPage";
import { ResidentManagementPage } from "./pages/ResidentManagementPage";
import { ContractManagementPage } from "./pages/ContractManagementPage";
import { SettlementPage } from "./pages/SettlementPage";
import { UtilityReadingPage } from "./pages/UtilityReadingPage";
import { InvoiceManagementPage } from "./pages/InvoiceManagementPage";
import { TransactionHistoryPage } from "./pages/TransactionHistoryPage";
import { DebtManagementPage } from "./pages/DebtManagementPage";
import { MaintenanceRequestPage } from "./pages/MaintenanceRequestPage";
import { KnowledgeBasePage } from "./pages/KnowledgeBasePage";
import { ChatHistoryPage } from "./pages/ChatHistoryPage";
import { RevenueReportPage } from "./pages/RevenueReportPage";
import { OccupancyReportPage } from "./pages/OccupancyReportPage";
import { UserAccountsPage } from "./pages/UserAccountsPage";
import { MyProfilePage } from "./pages/MyProfilePage";
import { AuditLogsPage } from "./pages/AuditLogsPage";
import { ProtectedRoute, PublicRoute, AdminRoute, AccountantRoute, StaffRoute } from "./components/ProtectedRoute";
import { UserRole } from "./lib/roles";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <PublicRoute><LandingPage /></PublicRoute>,
  },
  {
    path: "/login",
    element: <PublicRoute><LoginPage /></PublicRoute>,
  },
  {
    path: "/forgot-password",
    element: <PublicRoute><ForgotPasswordPage /></PublicRoute>,
  },
  {
    path: "/unauthorized",
    element: <UnauthorizedPage />,
  },
  {
    path: "/select-platform",
    Component: PlatformSelector,
  },
  {
    path: "/select-app",
    Component: AppSelector,
  },
  // Admin Routes with Layout - Protected
  {
    path: "/",
    element: (
      <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: "dashboard",
        element: (
          <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
            <DashboardPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "wireframe-overview",
        Component: WireframeOverviewPage,
      },
      {
        path: "building-management",
        element: <AdminRoute><BuildingManagementPage /></AdminRoute>,
      },
      {
        path: "service-pricing",
        element: <AdminRoute><ServicePricingPage /></AdminRoute>,
      },
      {
        path: "asset-inventory",
        element: <StaffRoute><AssetInventoryPage /></StaffRoute>,
      },
      {
        path: "resident-management",
        element: <AdminRoute><ResidentManagementPage /></AdminRoute>,
      },
      {
        path: "contract-management",
        element: <AdminRoute><ContractManagementPage /></AdminRoute>,
      },
      {
        path: "settlement",
        element: <AccountantRoute><SettlementPage /></AccountantRoute>,
      },
      {
        path: "utility-reading",
        element: <StaffRoute><UtilityReadingPage /></StaffRoute>,
      },
      {
        path: "invoice-management",
        element: <AccountantRoute><InvoiceManagementPage /></AccountantRoute>,
      },
      {
        path: "transaction-history",
        element: <AccountantRoute><TransactionHistoryPage /></AccountantRoute>,
      },
      {
        path: "debt-management",
        element: <AccountantRoute><DebtManagementPage /></AccountantRoute>,
      },
      {
        path: "maintenance-request",
        element: <StaffRoute><MaintenanceRequestPage /></StaffRoute>,
      },
      {
        path: "knowledge-base",
        element: <StaffRoute><KnowledgeBasePage /></StaffRoute>,
      },
      {
        path: "chat-history",
        element: <AdminRoute><ChatHistoryPage /></AdminRoute>,
      },
      {
        path: "revenue-report",
        element: <AccountantRoute><RevenueReportPage /></AccountantRoute>,
      },
      {
        path: "occupancy-report",
        element: <AdminRoute><OccupancyReportPage /></AdminRoute>,
      },
      {
        path: "user-accounts",
        element: (
          <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
            <UserAccountsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "my-profile",
        element: (
          <ProtectedRoute>
            <MyProfilePage />
          </ProtectedRoute>
        ),
      },
      {
        path: "audit-logs",
        element: (
          <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
            <AuditLogsPage />
          </ProtectedRoute>
        ),
      },
    ],
  },
]);