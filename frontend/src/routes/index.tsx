import { Navigate, type RouteObject } from "react-router-dom";
import { AppLayout } from "@/layouts/AppLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Categories } from "@/pages/Categories";
import { Dashboard } from "@/pages/Dashboard";
import { Investments } from "@/pages/Investments";
import { Login } from "@/pages/Login";
import { Plannings } from "@/pages/Plannings";
import { Register } from "@/pages/Register";
import { Settings } from "@/pages/Settings";
import { Transactions } from "@/pages/Transactions";

export const routes: RouteObject[] = [
  {
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Dashboard /> },
      { path: "plannings", element: <Plannings /> },
      { path: "investments", element: <Investments /> },
      { path: "transactions", element: <Transactions /> },
      { path: "categories", element: <Categories /> },
      { path: "settings", element: <Settings /> },
    ],
  },
  { path: "login", element: <Login /> },
  { path: "register", element: <Register /> },
  { path: "*", element: <Navigate to="/" replace /> },
];
