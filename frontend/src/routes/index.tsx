import { lazy } from "react";
import { Navigate, type RouteObject } from "react-router-dom";
import { AppLayout } from "@/layouts/AppLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Dashboard } from "@/pages/Dashboard";
import { Login } from "@/pages/Login";
import { Register } from "@/pages/Register";

const Categories = lazy(() => import("@/pages/Categories").then((m) => ({ default: m.Categories })));
const Investments = lazy(() => import("@/pages/Investments").then((m) => ({ default: m.Investments })));
const Plannings = lazy(() => import("@/pages/Plannings").then((m) => ({ default: m.Plannings })));
const Profile = lazy(() => import("@/pages/Profile").then((m) => ({ default: m.Profile })));
const Settings = lazy(() => import("@/pages/Settings").then((m) => ({ default: m.Settings })));
const Transactions = lazy(() => import("@/pages/Transactions").then((m) => ({ default: m.Transactions })));
const Modules = lazy(() => import("@/pages/Modules").then((m) => ({ default: m.Modules })));
const GoalsSimulator = lazy(() => import("@/pages/GoalsSimulator").then((m) => ({ default: m.GoalsSimulator })));
const GoalSimulatorHome = lazy(() => import("@/pages/simulador/GoalSimulatorHome").then((m) => ({ default: m.GoalSimulatorHome })));
const JurosCompostos = lazy(() => import("@/pages/simulador/JurosCompostos").then((m) => ({ default: m.JurosCompostos })));
const AcumularPatrimonio = lazy(() => import("@/pages/simulador/AcumularPatrimonio").then((m) => ({ default: m.AcumularPatrimonio })));
const RendaPassiva = lazy(() => import("@/pages/simulador/RendaPassiva").then((m) => ({ default: m.RendaPassiva })));
const Leisure = lazy(() => import("@/pages/Leisure").then((m) => ({ default: m.Leisure })));
const LeisureDetail = lazy(() => import("@/pages/LeisureDetail").then((m) => ({ default: m.LeisureDetail })));
const Chat = lazy(() => import("@/pages/Chat").then((m) => ({ default: m.Chat })));
const ChatDetail = lazy(() => import("@/pages/ChatDetail").then((m) => ({ default: m.ChatDetail })));
const ShoppingLists = lazy(() => import("@/pages/ShoppingLists").then((m) => ({ default: m.ShoppingLists })));
const ShoppingListDetail = lazy(() => import("@/pages/ShoppingListDetail").then((m) => ({ default: m.ShoppingListDetail })));

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
      { path: "profile", element: <Profile /> },
      { path: "settings", element: <Settings /> },
      { path: "modules", element: <Modules /> },
      {
        path: "simulador-metas",
        element: <GoalsSimulator />,
        children: [
          { index: true, element: <GoalSimulatorHome /> },
          { path: "juros-compostos", element: <JurosCompostos /> },
          { path: "acumular-patrimonio", element: <AcumularPatrimonio /> },
          { path: "renda-passiva", element: <RendaPassiva /> },
        ],
      },
      { path: "leisure", element: <Leisure /> },
      { path: "leisure/:id", element: <LeisureDetail /> },
      { path: "chat", element: <Chat /> },
      { path: "chat/:id", element: <ChatDetail /> },
      { path: "checklist", element: <ShoppingLists /> },
      { path: "checklist/:id", element: <ShoppingListDetail /> },
    ],
  },
  { path: "login", element: <Login /> },
  { path: "register", element: <Register /> },
  { path: "*", element: <Navigate to="/" replace /> },
];
