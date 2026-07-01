import { Navigate, type RouteObject } from "react-router-dom";
import { AppLayout } from "@/layouts/AppLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Categories } from "@/pages/Categories";
import { Dashboard } from "@/pages/Dashboard";
import { Investments } from "@/pages/Investments";
import { Login } from "@/pages/Login";
import { Plannings } from "@/pages/Plannings";
import { Profile } from "@/pages/Profile";
import { Register } from "@/pages/Register";
import { Settings } from "@/pages/Settings";
import { Transactions } from "@/pages/Transactions";
import { Modules } from "@/pages/Modules";
import { GoalsSimulator } from "@/pages/GoalsSimulator";
import { GoalSimulatorHome } from "@/pages/simulador/GoalSimulatorHome";
import { JurosCompostos } from "@/pages/simulador/JurosCompostos";
import { AcumularPatrimonio } from "@/pages/simulador/AcumularPatrimonio";
import { RendaPassiva } from "@/pages/simulador/RendaPassiva";
import { Leisure } from "@/pages/Leisure";
import { LeisureDetail } from "@/pages/LeisureDetail";
import { Chat } from "@/pages/Chat";
import { ChatDetail } from "@/pages/ChatDetail";
import { ShoppingLists } from "@/pages/ShoppingLists";
import { ShoppingListDetail } from "@/pages/ShoppingListDetail";

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
