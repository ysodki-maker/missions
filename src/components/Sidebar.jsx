import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, CreditCard, Users, Menu, X } from "lucide-react";
import { useAuth } from "../context/useAuth";
import { useState } from "react";

export default function Sidebar() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <>
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-base shadow-sm">
              <img src="./logo_n.jpeg"/>
            </div>
            <h1 className="text-lg font-bold text-gray-900">BankAdmin</h1>
          </div>
          
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6 text-gray-600" />
            ) : (
              <Menu className="w-6 h-6 text-gray-600" />
            )}
          </button>
        </div>
      </header>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          onClick={closeMobileMenu}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static top-0 left-0 bottom-0 z-50
          w-72 sm:w-80 lg:w-64
          bg-white flex flex-col border-r border-gray-200 shadow-lg lg:shadow-sm
          transition-transform duration-300 ease-in-out
          ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* Header - Desktop only */}
        <div className="hidden lg:block p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-15 h-15 bg-blue-500 rounded-xl flex items-center justify-center text-xl shadow-sm">
              <img src="./logo_n.jpeg"/>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                BankAdmin
              </h1>
              <p className="text-xs text-gray-500">Gestion bancaire</p>
            </div>
          </div>
        </div>

        {/* Mobile Header inside Sidebar */}
        <div className="lg:hidden p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center text-xl shadow-sm">
                <img src="./logo_n.jpeg"/>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  BankAdmin
                </h1>
                <p className="text-xs text-gray-500">Gestion bancaire</p>
              </div>
            </div>
            <button
              onClick={closeMobileMenu}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Fermer le menu"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={closeMobileMenu}
                className={`
                  group flex items-center gap-3 px-4 py-3 rounded-lg
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
                <span className="font-medium text-base">{item.label}</span>
                {active && (
                  <div className="ml-auto w-1.5 h-1.5 bg-blue-600 rounded-full" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Info */}
        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 px-3 py-3 rounded-lg bg-gray-50">
            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-sm font-semibold text-gray-700 flex-shrink-0">
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

      {/* Bottom Navigation - Mobile only */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200 shadow-lg safe-area-pb">
        <div className="flex items-center justify-around px-2 py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  flex flex-col items-center gap-1 px-3 py-2 rounded-lg
                  transition-all duration-200 flex-1 max-w-[120px]
                  ${active 
                    ? "text-blue-600" 
                    : "text-gray-600 hover:text-gray-900"
                  }
                `}
              >
                <Icon 
                  className={`w-6 h-6 transition-transform duration-200 ${
                    active ? "scale-110" : ""
                  }`} 
                />
                <span className="text-xs font-medium truncate w-full text-center">
                  {item.label}
                </span>
                {active && (
                  <div className="w-1 h-1 bg-blue-600 rounded-full" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );

}
