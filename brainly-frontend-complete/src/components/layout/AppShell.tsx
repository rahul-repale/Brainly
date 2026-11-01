import { Outlet } from "react-router";
import { Sidebar } from "./Sidebar";

export function AppShell() {
  return (
    <div className="flex min-h-screen bg-paper">
      <Sidebar />
      <Outlet />
    </div>
  );
}
