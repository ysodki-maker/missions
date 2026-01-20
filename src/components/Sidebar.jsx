import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, CreditCard, Users } from "lucide-react";
import { useAuth } from "../context/useAuth"

export default function Sidebar() {
  const { user } = useAuth();
  const { pathname } = useLocation();

  const isActive = (path) => {
    if (path === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(path);
  };

  const navItems = [
    { path: "/", icon: LayoutDashboard, label: "Dashboard" },
    { path: "/cards", icon: CreditCard, label: "Cartes" },
    ...(user?.role === "admin" 
      ? [{ path: "/users", icon: Users, label: "Utilisateurs" }] 
      : [])
  ];

  return (
    <aside className="w-64 bg-white flex flex-col border-r border-gray-200 shadow-sm">
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center text-xl shadow-sm">
            💳
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              BankAdmin
            </h1>
            <p className="text-xs text-gray-500">Gestion bancaire</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`
                group flex items-center gap-3 px-3 py-2.5 rounded-lg
                transition-all duration-200
                ${active 
                  ? "bg-blue-50 text-blue-600 shadow-sm" 
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }
              `}
            >
              <Icon 
                className={`w-5 h-5 transition-transform duration-200 ${
                  active ? "scale-110" : "group-hover:scale-105"
                }`} 
              />
              <span className="font-medium">{item.label}</span>
              {active && (
                <div className="ml-auto w-1.5 h-1.5 bg-blue-600 rounded-full" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Info */}
      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-gray-50">
          <div className="w-9 h-9 bg-gray-200 rounded-full flex items-center justify-center text-sm font-semibold text-gray-700">
            {user?.name?.charAt(0) || "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user?.fullname || "Utilisateur"}
            </p>
            <p className="text-xs text-gray-500 capitalize">
              {user?.role || "membre"}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}