import { useEffect, useState } from "react";
import { Users as UsersIcon, RefreshCw } from "lucide-react";
import api from "../api/axios";

export default function UsersWithBalance() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUsersWithBalance = async () => {
    try {
      setLoading(true);
      const response = await api.get("/users/with-balance");
      setUsers(response.data);
      console.log(response);
    } catch (error) {
      console.error("Erreur lors du chargement des utilisateurs :", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsersWithBalance();
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("fr-MA", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">
            Chargement des utilisateurs...
          </p>
        </div>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="p-4 lg:p-6 max-w-7xl mx-auto">
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-sm">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <UsersIcon className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            Aucun utilisateur trouvé
          </h3>
          <p className="text-gray-500">
            Il n'y a aucun utilisateur avec un solde pour le moment
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-4 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <UsersIcon className="w-6 h-6 text-white" />
            </div>
            Utilisateurs & Soldes
          </h2>
          <p className="text-gray-500 mt-1">
            Liste complète des utilisateurs avec leur solde par banque
          </p>
        </div>

        <button
          onClick={fetchUsersWithBalance}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
        >
          <RefreshCw className="w-4 h-4" />
          <span className="font-medium">Actualiser</span>
        </button>
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Utilisateur
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Solde Afriquia
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Solde Attijari
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-gray-900">
                      #{user.id}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold shadow-md flex-shrink-0">
                        {user.fullname?.charAt(0).toUpperCase() || "U"}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {user.fullname}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <span className="text-lg font-bold text-gray-900">
                      {formatCurrency(
                        user.Cards.filter(
                          (card) => card.type.toLowerCase() === "afriquia",
                        ).reduce((sum, card) => sum + card.balance, 0),
                      )}
                    </span>
                    <span className="text-sm text-gray-500 ml-1">DH</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <span className="text-lg font-bold text-gray-900">
                      {formatCurrency(
                        user.Cards.filter(
                          (card) => card.type.toLowerCase() === "attijari",
                        ).reduce((sum, card) => sum + card.balance, 0),
                      )}
                    </span>
                    <span className="text-sm text-gray-500 ml-1">DH</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
