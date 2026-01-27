import { useState, useEffect } from 'react';
import { useAuth } from "../context/useAuth";
import { getUsers } from '../api/userApi';
import { getUserCards, getCardLoads, getCardLoadCount } from '../api/cardApi';
import { getCardOperations } from '../api/operationApi';
import { 
  CreditCard, 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Activity,
  ArrowUpRight,
  ArrowDownCircle,
  Users,
  Shield,
  AlertCircle,
  X
} from 'lucide-react';
import UsersWithBalance from '../components/UsersWithBalance';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalBalance: 0,
    totalCards: 0,
    totalOperations: 0,
    totalRecharges: 0,
    totalUsers: 0,
    recentOperations: [],
    cards: []
  });
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [activeUserTab, setActiveUserTab] = useState('operations');
  const [loading, setLoading] = useState(true);
  const [loadingUserDetails, setLoadingUserDetails] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user.role === 'admin') {
      loadAdminDashboard();
    } else {
      loadUserDashboard();
    }
  }, [user]);

  // Dashboard pour les utilisateurs normaux
  const loadUserDashboard = async () => {
    setLoading(true);
    setError('');
    try {
      const cardsResponse = await getUserCards(user.id);
      const cardsData = cardsResponse.data || cardsResponse;

      let totalBalance = 0;
      let allOperations = [];
      let totalRecharges = 0;

      for (const card of cardsData) {
        totalBalance += card.balance || 0;

        try {
          const opsResponse = await getCardOperations(card.id);
          const operations = (opsResponse.data || opsResponse || []).map(op => ({
            ...op,
            cardType: card.type,
            cardId: card.id
          }));
          allOperations = [...allOperations, ...operations];
        } catch (err) {
          console.error(`Error loading operations for card ${card.id}:`, err);
        }

        try {
          const loadCountResponse = await getCardLoadCount(card.id);
          const loadCountData = loadCountResponse.data || loadCountResponse;
          const loadCount = typeof loadCountData === 'object' && loadCountData.nbChargements !== undefined
            ? loadCountData.nbChargements
            : typeof loadCountData === 'number'
            ? loadCountData
            : 0;
          totalRecharges += loadCount;
        } catch (err) {
          console.error(`Error loading load count for card ${card.id}:`, err);
        }
      }

      allOperations.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      setStats({
        totalBalance,
        totalCards: cardsData.length,
        totalOperations: allOperations.length,
        totalRecharges,
        totalUsers: 0,
        recentOperations: allOperations.slice(0, 5),
        cards: cardsData
      });
    } catch (error) {
      console.error('Error loading user dashboard:', error);
      setError('Erreur lors du chargement du tableau de bord');
    } finally {
      setLoading(false);
    }
  };

  // Dashboard pour les administrateurs
  const loadAdminDashboard = async () => {
    setLoading(true);
    setError('');
    try {
      const usersResponse = await getUsers();
      const allUsers = usersResponse.data || usersResponse;
      setUsers(allUsers);
      
      let totalBalance = 0;
      let totalCards = 0;
      let allOperations = [];
      let totalRecharges = 0;

      for (const userItem of allUsers) {
        try {
          const cardsResponse = await getUserCards(userItem.id);
          const cardsData = cardsResponse.data || cardsResponse;
          totalCards += cardsData.length;

          for (const card of cardsData) {
            totalBalance += card.balance || 0;

            try {
              const opsResponse = await getCardOperations(card.id);
              const operations = (opsResponse.data || opsResponse || []).map(op => ({
                ...op,
                cardType: card.type,
                cardId: card.id,
                userName: userItem.fullname || userItem.email
              }));
              allOperations = [...allOperations, ...operations];
            } catch (err) {
              console.error(`Error loading operations:`, err);
            }

            try {
              const loadCountResponse = await getCardLoadCount(card.id);
              const loadCountData = loadCountResponse.data || loadCountResponse;
              const loadCount = typeof loadCountData === 'object' && loadCountData.nbChargements !== undefined
                ? loadCountData.nbChargements
                : typeof loadCountData === 'number'
                ? loadCountData
                : 0;
              totalRecharges += loadCount;
            } catch (err) {
              console.error(`Error loading load count:`, err);
            }
          }
        } catch (err) {
          console.error(`Error loading cards for user ${userItem.id}:`, err);
        }
      }

      allOperations.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      setStats({
        totalBalance,
        totalCards,
        totalOperations: allOperations.length,
        totalRecharges,
        totalUsers: allUsers.length,
        recentOperations: allOperations.slice(0, 10),
        cards: []
      });
    } catch (error) {
      console.error('Error loading admin dashboard:', error);
      setError('Erreur lors du chargement du tableau de bord administrateur');
    } finally {
      setLoading(false);
    }
  };

  const loadUserDetails = async (userItem) => {
    setSelectedUser(userItem);
    setLoadingUserDetails(true);
    try {
      const cardsResponse = await getUserCards(userItem.id);
      const cardsData = cardsResponse.data || cardsResponse;

      let totalBalance = 0;
      let allOperations = [];
      let allLoads = [];
      let totalRecharges = 0;
      let totalRechargesAmount = 0;
      let totalOperationsAmount = 0;

      // Enrichir chaque carte avec ses stats
      const enrichedCards = await Promise.all(
        cardsData.map(async (card) => {
          totalBalance += card.balance || 0;

          let cardOperationsAmount = 0;
          let cardRechargesAmount = 0;
          let cardOperations = [];
          let cardLoads = [];

          try {
            const opsResponse = await getCardOperations(card.id);
            const operations = (opsResponse.data || opsResponse || []).map(op => ({
              ...op,
              cardType: card.type,
              cardId: card.id
            }));
            cardOperations = operations;
            allOperations = [...allOperations, ...operations];
            cardOperationsAmount = operations.reduce((sum, op) => sum + (op.debit || 0), 0);
            totalOperationsAmount += cardOperationsAmount;
          } catch (err) {
            console.error(`Error loading operations:`, err);
          }

          try {
            const loadsResponse = await getCardLoads(card.id);
            const loads = (loadsResponse.data || loadsResponse || []).map(load => ({
              ...load,
              cardType: card.type,
              cardId: card.id
            }));
            cardLoads = loads;
            allLoads = [...allLoads, ...loads];
            totalRecharges += loads.length;
            cardRechargesAmount = loads.reduce((sum, load) => sum + (load.amount || 0), 0);
            totalRechargesAmount += cardRechargesAmount;
          } catch (err) {
            console.error(`Error loading loads:`, err);
          }

          return {
            ...card,
            totalSpent: cardOperationsAmount,
            totalRecharged: cardRechargesAmount,
            operationsCount: cardOperations.length,
            rechargesCount: cardLoads.length
          };
        })
      );

      allOperations.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      allLoads.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      setUserDetails({
        totalBalance,
        totalCards: cardsData.length,
        totalOperations: allOperations.length,
        totalRecharges,
        totalRechargesAmount,
        totalOperationsAmount,
        recentOperations: allOperations,
        loads: allLoads,
        cards: enrichedCards
      });
    } catch (error) {
      console.error('Error loading user details:', error);
    } finally {
      setLoadingUserDetails(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-gray-900 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-600 text-sm">Chargement du tableau de bord...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* En-tête */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-light text-gray-900">
              {user.role === 'admin' ? 'Tableau de bord Administrateur' : 'Tableau de bord'}
            </h1>
            {user.role === 'admin' && (
              <span className="px-3 py-1 bg-gray-900 text-white text-xs rounded-full flex items-center gap-1">
                <Shield className="w-3 h-3" />
                Admin
              </span>
            )}
          </div>
          <p className="text-gray-500 text-sm">
            {user.role === 'admin' 
              ? 'Vue d\'ensemble de toutes les activités' 
              : `Bienvenue, ${user.fullname || user.email}`}
          </p>
        </div>

        {/* Message d'erreur */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}
        {/* Statistiques principales */}
        <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 ${
          user.role === 'admin' ? 'lg:grid-cols-5' : 'lg:grid-cols-4'
        }`}>
          {/* Solde total */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <Wallet className="w-6 h-6 text-gray-700" />
              </div>
              <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                {user.role === 'admin' ? 'Global' : 'Total'}
              </span>
            </div>
            <p className="text-gray-500 text-sm mb-1">
              {user.role === 'admin' ? 'Solde global' : 'Solde total'}
            </p>
            <p className="text-2xl font-light text-gray-900">
              {stats.totalBalance.toLocaleString('fr-FR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })} <span className="text-sm text-gray-600">MAD</span>
            </p>
          </div>
          {/* Nombre d'utilisateurs (admin only) */}
          {user.role === 'admin' && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
              </div>
              <p className="text-gray-500 text-sm mb-1">Utilisateurs</p>
              <p className="text-2xl font-light text-gray-900">{stats.totalUsers}</p>
            </div>
          )}

          {/* Nombre de cartes */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <p className="text-gray-500 text-sm mb-1">
              {user.role === 'admin' ? 'Total cartes' : 'Mes cartes'}
            </p>
            <p className="text-2xl font-light text-gray-900">{stats.totalCards}</p>
          </div>

          {/* Opérations */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center">
                <Activity className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <p className="text-gray-500 text-sm mb-1">Opérations</p>
            <p className="text-2xl font-light text-gray-900">{stats.totalOperations}</p>
          </div>

          {/* Recharges */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <p className="text-gray-500 text-sm mb-1">Recharges</p>
            <p className="text-2xl font-light text-gray-900">{stats.totalRecharges}</p>
          </div>
        </div>
        {user.role === "admin" && <UsersWithBalance/>}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Liste des utilisateurs (admin only) */}
          {user.role === 'admin' && (
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-lg font-light text-gray-900 mb-4">Utilisateurs</h2>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {users.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <Users className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">Aucun utilisateur</p>
                    </div>
                  ) : (
                    users.map((userItem) => (
                      <div
                        key={userItem.id}
                        onClick={() => loadUserDetails(userItem)}
                        className={`p-4 border rounded-lg cursor-pointer transition-all ${
                          selectedUser?.id === userItem.id
                            ? 'border-gray-900 bg-gray-50'
                            : 'border-gray-100 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                            <span className="text-purple-600 font-medium text-sm">
                              {(userItem.fullname || userItem.email)?.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {userItem.fullname || 'Sans nom'}
                            </p>
                            <p className="text-xs text-gray-500 truncate">{userItem.email}</p>
                          </div>
                          {selectedUser?.id === userItem.id && (
                            <div className="w-2 h-2 bg-gray-900 rounded-full"></div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Mes cartes (user only) */}
          {user.role === 'user' && (
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-lg font-light text-gray-900 mb-4">Mes cartes</h2>
                <div className="space-y-3">
                  {stats.cards.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <CreditCard className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">Aucune carte</p>
                    </div>
                  ) : (
                    stats.cards.map((card) => (
                      <div
                        key={card.id}
                        className="p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700 uppercase">
                            {card.type}
                          </span>
                          <CreditCard className="w-4 h-4 text-gray-400" />
                        </div>
                        <p className="text-xs text-gray-500 font-mono mb-2">
                          •••• •••• •••• {String(card.id).slice(-4)}
                        </p>
                        <p className="text-lg font-light text-gray-900">
                          {(card.balance || 0).toLocaleString('fr-FR', {
                            minimumFractionDigits: 2,
                          })} <span className="text-xs text-gray-600">MAD</span>
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Activité */}
          <div className="lg:col-span-2">
            {user.role === 'admin' && selectedUser ? (
              // Détails de l'utilisateur sélectionné
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-lg font-light text-gray-900 mb-1">
                      Activité de {selectedUser.fullname || selectedUser.email}
                    </h2>
                    <p className="text-sm text-gray-500">{selectedUser.email}</p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedUser(null);
                      setUserDetails(null);
                    }}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                {loadingUserDetails ? (
                  <div className="text-center py-12">
                    <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                    <p className="text-sm text-gray-500">Chargement...</p>
                  </div>
                ) : userDetails ? (
                  <>
                    {/* Stats de l'utilisateur */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-xs text-gray-500 mb-1">Solde actuel</p>
                        <p className="text-lg font-light text-gray-900">
                          {userDetails.totalBalance} <span className="text-xs">MAD</span>
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-xs text-gray-500 mb-1">Cartes</p>
                        <p className="text-lg font-light text-gray-900">{userDetails.totalCards}</p>
                      </div>
                      <div className="bg-red-50 rounded-lg p-4">
                        <p className="text-xs text-red-600 mb-1">Total dépensé</p>
                        <p className="text-lg font-light text-red-600">
                          -{userDetails.totalOperationsAmount} <span className="text-xs">MAD</span>
                        </p>
                        <p className="text-xs text-gray-500 mt-1">{userDetails.totalOperations} opérations</p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <p className="text-xs text-green-600 mb-1">Total rechargé</p>
                        <p className="text-lg font-light text-green-600">
                          +{userDetails.totalRechargesAmount} <span className="text-xs">MAD</span>
                        </p>
                        <p className="text-xs text-gray-500 mt-1">{userDetails.totalRecharges} recharges</p>
                      </div>
                    </div>

                    {/* Onglets */}
                    <div className="mb-6">
                      <div className="flex gap-2 border-b border-gray-200">
                        <button
                          onClick={() => setActiveUserTab('operations')}
                          className={`px-4 py-2 text-sm font-medium transition-colors ${
                            activeUserTab === 'operations'
                              ? 'text-gray-900 border-b-2 border-gray-900'
                              : 'text-gray-500 hover:text-gray-700'
                          }`}
                        >
                          Opérations ({userDetails.totalOperations})
                        </button>
                        <button
                          onClick={() => setActiveUserTab('recharges')}
                          className={`px-4 py-2 text-sm font-medium transition-colors ${
                            activeUserTab === 'recharges'
                              ? 'text-gray-900 border-b-2 border-gray-900'
                              : 'text-gray-500 hover:text-gray-700'
                          }`}
                        >
                          Recharges ({userDetails.totalRecharges})
                        </button>
                        <button
                          onClick={() => setActiveUserTab('cartes')}
                          className={`px-4 py-2 text-sm font-medium transition-colors ${
                            activeUserTab === 'cartes'
                              ? 'text-gray-900 border-b-2 border-gray-900'
                              : 'text-gray-500 hover:text-gray-700'
                          }`}
                        >
                          Cartes ({userDetails.totalCards})
                        </button>
                      </div>
                    </div>

                    {/* Contenu des onglets */}
                    {activeUserTab === 'cartes' && (
                      <div>
                        <div className="space-y-3">
                          {userDetails.cards.length === 0 ? (
                            <div className="text-center py-8 text-gray-400">
                              <CreditCard className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                              <p className="text-xs">Aucune carte</p>
                            </div>
                          ) : (
                            userDetails.cards.map((card) => (
                              <div
                                key={card.id}
                                className="p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors"
                              >
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center gap-2">
                                    <CreditCard className="w-4 h-4 text-gray-400" />
                                    <span className="text-sm font-medium text-gray-700 uppercase">
                                      {card.type}
                                    </span>
                                  </div>
                                  <p className="text-xs text-gray-500 font-mono">
                                    •••• {String(card.id).slice(-4)}
                                  </p>
                                </div>

                                <div className="grid grid-cols-3 gap-3">
                                  <div className="bg-gray-50 rounded p-2">
                                    <p className="text-xs text-gray-500 mb-1">Solde</p>
                                    <p className="text-sm font-medium text-gray-900">
                                      {(card.balance || 0).toFixed(2)} <span className="text-xs text-gray-600">MAD</span>
                                    </p>
                                  </div>
                                  <div className="bg-red-50 rounded p-2">
                                    <p className="text-xs text-red-600 mb-1">Dépensé</p>
                                    <p className="text-sm font-medium text-red-600">
                                      -{(card.totalSpent || 0).toFixed(2)} <span className="text-xs">MAD</span>
                                    </p>
                                    <p className="text-xs text-gray-500 mt-0.5">{card.operationsCount || 0} op.</p>
                                  </div>
                                  <div className="bg-green-50 rounded p-2">
                                    <p className="text-xs text-green-600 mb-1">Rechargé</p>
                                    <p className="text-sm font-medium text-green-600">
                                      +{(card.totalRecharged || 0).toFixed(2)} <span className="text-xs">MAD</span>
                                    </p>
                                    <p className="text-xs text-gray-500 mt-0.5">{card.rechargesCount || 0} rech.</p>
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}

                    {activeUserTab === 'operations' && (
                      <div className="space-y-2 max-h-80 overflow-y-auto">
                        {userDetails.recentOperations.length === 0 ? (
                          <div className="text-center py-8 text-gray-400">
                            <Activity className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                            <p className="text-xs">Aucune opération</p>
                          </div>
                        ) : (
                          userDetails.recentOperations.map((op, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center">
                                  <ArrowUpRight className="w-4 h-4 text-red-600" />
                                </div>
                                <div>
                                  <p className="text-xs font-medium text-gray-900">
                                    {op.designation || 'Opération'}
                                  </p>
                                  <div className="flex items-center gap-1 mt-0.5">
                                    <span className="text-xs text-gray-500 uppercase">
                                      {op.cardType}
                                    </span>
                                    <span className="text-xs text-gray-400">•</span>
                                    <span className="text-xs text-gray-500">
                                      {new Date(op.createdAt || Date.now()).toLocaleDateString('fr-FR', {
                                        day: '2-digit',
                                        month: 'short',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <p className="text-xs font-medium text-red-600">
                                -{op.debit?.toFixed(2)} MAD
                              </p>
                            </div>
                          ))
                        )}
                      </div>
                    )}

                    {activeUserTab === 'recharges' && (
                      <div className="space-y-2 max-h-80 overflow-y-auto">
                        {userDetails.loads.length === 0 ? (
                          <div className="text-center py-8 text-gray-400">
                            <TrendingUp className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                            <p className="text-xs">Aucune recharge</p>
                          </div>
                        ) : (
                          userDetails.loads.map((load, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
                                  <ArrowDownCircle className="w-4 h-4 text-green-600" />
                                </div>
                                <div>
                                  <p className="text-xs font-medium text-gray-900">Recharge</p>
                                  <div className="flex items-center gap-1 mt-0.5">
                                    <span className="text-xs text-gray-500 uppercase">
                                      {load.cardType}
                                    </span>
                                    <span className="text-xs text-gray-400">•</span>
                                    <span className="text-xs text-gray-500">
                                      {new Date(load.createdAt || Date.now()).toLocaleDateString('fr-FR', {
                                        day: '2-digit',
                                        month: 'short',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <p className="text-xs font-medium text-green-600">
                                +{load.amount?.toFixed(2)} MAD
                              </p>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </>
                ) : null}
              </div>
            ) : (
              // Activité récente globale
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-lg font-light text-gray-900 mb-4">
                  {user.role === 'admin' ? 'Activité récente (toutes les transactions)' : 'Activité récente'}
                </h2>
                <div className="space-y-3">
                  {stats.recentOperations.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <Activity className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">Aucune activité récente</p>
                    </div>
                  ) : (
                    stats.recentOperations.map((op, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                            <ArrowUpRight className="w-5 h-5 text-red-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {op.designation || 'Opération'}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              {user.role === 'admin' && op.userName && (
                                <>
                                  <span className="text-xs text-purple-600 font-medium">
                                    {op.userName}
                                  </span>
                                  <span className="text-xs text-gray-400">•</span>
                                </>
                              )}
                              <span className="text-xs text-gray-500 uppercase">
                                {op.cardType}
                              </span>
                              <span className="text-xs text-gray-400">•</span>
                              <span className="text-xs text-gray-500">
                                {new Date(op.createdAt || Date.now()).toLocaleDateString('fr-FR', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric'
                                })}
                              </span>
                            </div>
                          </div>
                        </div>
                        <p className="text-sm font-medium text-red-600">
                          -{op.debit?.toFixed(2)} MAD
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
