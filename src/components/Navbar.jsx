import { useAuth } from "../context/useAuth";
import { LogOut, User } from "lucide-react";

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
      <h1 className="text-2xl font-semibold text-gray-900">
        Tableau de bord
      </h1>

      <div className="flex items-center gap-3">
        {/* User Info */}
        <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-gray-600" />
          </div>
          <span className="text-sm font-medium text-gray-700">
            {user?.email}
          </span>
        </div>

        {/* Logout Button */}
        <button
          onClick={logout}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors duration-200 font-medium"
        >
          <LogOut className="w-4 h-4" />
          <span>Déconnexion</span>
        </button>
      </div>
    </header>
  );
}