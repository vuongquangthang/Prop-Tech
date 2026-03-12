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
import { DebtReportPage } from "./pages/DebtReportPage";
import { UserAccountsPage } from "./pages/UserAccountsPage";
import { MyProfilePage } from "./pages/MyProfilePage";
import { AuditLogsPage } from "./pages/AuditLogsPage";
import { ResidentLayout } from "./components/resident/ResidentLayout";
import { ResidentHome } from "./components/resident/ResidentHome";
import { BillDetail } from "./components/resident/BillDetail";
import { PaymentQR } from "./components/resident/PaymentQR";
import { CreateIncident } from "./components/resident/CreateIncident";
import { IncidentTracking } from "./components/resident/IncidentTracking";
import { IncidentList } from "./components/resident/IncidentList";
import { ChatAI } from "./components/resident/ChatAI";
import { ResidentProfile } from "./components/resident/ResidentProfile";
import { PaymentHistory } from "./components/resident/PaymentHistory";
import { NotificationList } from "./components/resident/NotificationList";
import { ProtectedRoute, PublicRoute, AdminRoute, ResidentRoute, AccountantRoute, StaffRoute } from "./components/ProtectedRoute";
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
      <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF, UserRole.ACCOUNTANT]}>
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: "dashboard",
        element: (
          <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF, UserRole.ACCOUNTANT]}>
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
        path: "debt-report",
        element: <AccountantRoute><DebtReportPage /></AccountantRoute>,
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
  // Resident App Routes - Protected
  {
    path: "/resident",
    element: <ResidentRoute><ResidentLayout /></ResidentRoute>,
    children: [
      {
        index: true,
        Component: ResidentHome,
      },
      {
        path: "bill-detail",
        Component: BillDetail,
      },
      {
        path: "payment-qr",
        Component: PaymentQR,
      },
      {
        path: "payment-history",
        Component: PaymentHistory,
      },
      {
        path: "incidents",
        Component: IncidentList,
      },
      {
        path: "incidents/create",
        Component: CreateIncident,
      },
      {
        path: "incidents/tracking",
        Component: IncidentTracking,
      },
      {
        path: "chat",
        Component: ChatAI,
      },
      {
        path: "profile",
        Component: ResidentProfile,
      },
      {
        path: "notifications",
        Component: NotificationList,
      },
    ],
  },
]);