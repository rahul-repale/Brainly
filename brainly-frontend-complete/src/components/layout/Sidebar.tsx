import { NavLink, useNavigate } from "react-router";
import { LayoutDashboard, Layers, Tag as TagIcon, Share2, LogOut, Settings } from "lucide-react";
import { BrainMark } from "@/components/ui";
import { useAuthStore } from "@/stores/useAuthStore";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/cards", label: "All Cards", icon: Layers },
  { to: "/tags", label: "Tags", icon: TagIcon },
  { to: "/links", label: "Shared Links", icon: Share2 },
];

export function Sidebar() {
  const navigate = useNavigate();
  const username = useAuthStore((s) => s.username) || "Explorer";
  const signOut = useAuthStore((s) => s.signOut);

  const initials = username.slice(0, 2).toUpperCase();

  function handleSignOut() {
    signOut();
    navigate("/");
  }

  return (
    <aside className="flex h-full w-[240px] shrink-0 flex-col justify-between border-r border-line bg-white px-4 py-6">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2.5 px-2 pb-6">
          <BrainMark />
          <span className="font-display text-lg font-bold text-ink">Brainly</span>
        </div>

        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }: { isActive: boolean }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive ? "bg-brand-tint text-brand" : "text-slate hover:bg-paper"
                }`
              }
            >
              <Icon size={17} strokeWidth={2} />
              {item.label}
            </NavLink>
          );
        })}

        <button
          disabled
          className="flex cursor-default items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-light"
        >
          <Settings size={17} />
          Settings
        </button>
      </div>

      <div className="flex flex-col gap-1">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate hover:bg-paper"
        >
          <LogOut size={17} />
          Sign out
        </button>
        <div className="mt-1 flex items-center gap-2.5 rounded-lg bg-paper px-3 py-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-semibold text-white">
            {initials}
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold text-ink">{username}</div>
            <div className="text-xs text-slate-light">Free plan</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
