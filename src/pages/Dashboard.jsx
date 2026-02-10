import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "../context/useAuth";
import { getUsers } from "../api/userApi";
import { getUserCards, getCardLoads, getCardLoadCount } from "../api/cardApi";
import { getCardOperations } from "../api/operationApi";
import {
  CreditCard,
  TrendingUp,
  Wallet,
  Activity,
  ArrowUpRight,
  ArrowDownCircle,
  Users,
  Shield,
  AlertCircle,
  X,
} from "lucide-react";
import UsersWithBalance from "../components/UsersWithBalance";

// ============ UTILITAIRES ============

const enrichCardWithOperations = async (card, includeUserName = false) => {
  const [opsRes, loadCountRes] = await Promise.all([
    getCardOperations(card.id),
    getCardLoadCount(card.id),
  ]);

  const operations = (opsRes.data || opsRes || []).map((op) => ({
    ...op,
    cardType: card.type,
    cardId: card.id,
    ...(includeUserName && card.user && {
      userName: card.user.fullname || card.user.email,
    }),
  }));

  const loadCountData = loadCountRes.data || loadCountRes;
  const loadCount =
    loadCountData?.nbChargements ??
    (typeof loadCountData === "number" ? loadCountData : 0);

  return {
    ...card,
    operations,
    loadCount,
  };
};

const enrichCardWithDetails = async (card) => {
  const [opsRes, loadsRes] = await Promise.all([
    getCardOperations(card.id),
    getCardLoads(card.id),
  ]);

  const operations = (opsRes.data || opsRes || []).map((op) => ({
    ...op,
    cardType: card.type,
    cardId: card.id,
  }));

  const loads = (loadsRes.data || loadsRes || []).map((load) => ({
    ...load,
    cardType: card.type,
    cardId: card.id,
  }));

  return {
    ...card,
    operations,
    loads,
    totalSpent: operations.reduce((s, o) => s + (o.debit || 0), 0),
    totalRecharged: loads.reduce((s, l) => s + (l.amount || 0), 0),
    operationsCount: operations.length,
    rechargesCount: loads.length,
  };
};

const calculateStats = (enrichedCards, allUsers = []) => {
  const totalBalance = enrichedCards.reduce((s, c) => s + (c.balance || 0), 0);
  const totalRecharges = enrichedCards.reduce((s, c) => s + c.loadCount, 0);
  const allOperations = enrichedCards
    .flatMap((c) => c.operations)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return {
    totalBalance,
    totalCards: enrichedCards.length,
    totalOperations: allOperations.length,
    totalRecharges,
    totalUsers: allUsers.length,
    recentOperations: allOperations.slice(0, 10),
  };
};

// ============ HOOKS PERSONNALISÉS ============

function useUserDashboard(userId) {
  const [stats, setStats] = useState({
    totalBalance: 0,
    totalCards: 0,
    totalOperations: 0,
    totalRecharges: 0,
    totalUsers: 0,
    recentOperations: [],
    cards: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async () => {
    if (!userId) return;
    
    setLoading(true);
    setError("");

    try {
      const cardsRes = await getUserCards(userId);
      const cards = cardsRes.data || cardsRes;

      const enriched = await Promise.all(
        cards.map((card) => enrichCardWithOperations(card))
      );

      const calculatedStats = calculateStats(enriched);

      setStats({
        ...calculatedStats,
        cards,
      });
    } catch (err) {
      console.error(err);
      setError("Erreur lors du chargement du tableau de bord");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  return { stats, loading, error };
}

function useAdminDashboard() {
  const [stats, setStats] = useState({
    totalBalance: 0,
    totalCards: 0,
    totalOperations: 0,
    totalRecharges: 0,
    totalUsers: 0,
    recentOperations: [],
    cards: [],
  });
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const usersRes = await getUsers();
      const allUsers = usersRes.data || usersRes;
      setUsers(allUsers);

      // Charger toutes les cartes de tous les users en parallèle
      const usersWithCards = await Promise.all(
        allUsers.map(async (u) => {
          const cardsRes = await getUserCards(u.id);
          return {
            user: u,
            cards: cardsRes.data || cardsRes,
          };
        })
      );

      const allCards = usersWithCards.flatMap((uc) =>
        uc.cards.map((card) => ({ ...card, user: uc.user }))
      );

      // Charger les ops & loads de toutes les cartes en parallèle
      const enrichedCards = await Promise.all(
        allCards.map((card) => enrichCardWithOperations(card, true))
      );

      const calculatedStats = calculateStats(enrichedCards, allUsers);
      setStats(calculatedStats);
    } catch (err) {
      console.error(err);
      setError("Erreur lors du chargement du tableau de bord administrateur");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  return { stats, users, loading, error };
}

function useUserDetails() {
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadUserDetails = useCallback(async (userItem) => {
    setSelectedUser(userItem);
    setLoading(true);

    try {
      const cardsRes = await getUserCards(userItem.id);
      const cards = cardsRes.data || cardsRes;

      const enrichedCards = await Promise.all(
        cards.map((card) => enrichCardWithDetails(card))
      );

      const allOperations = enrichedCards
        .flatMap((c) => c.operations)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      const allLoads = enrichedCards
        .flatMap((c) => c.loads)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      setUserDetails({
        totalBalance: enrichedCards.reduce((s, c) => s + (c.balance || 0), 0),
        totalCards: enrichedCards.length,
        totalOperations: allOperations.length,
        totalRecharges: allLoads.length,
        totalRechargesAmount: allLoads.reduce((s, l) => s + (l.amount || 0), 0),
        totalOperationsAmount: allOperations.reduce(
          (s, o) => s + (o.debit || 0),
          0
        ),
        recentOperations: allOperations,
        loads: allLoads,
        cards: enrichedCards,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearUserDetails = useCallback(() => {
    setSelectedUser(null);
    setUserDetails(null);
  }, []);

  return {
    selectedUser,
    userDetails,
    loading,
    loadUserDetails,
    clearUserDetails,
  };
}

// ============ COMPOSANTS ============

// Composant StatCard - FIX: Renommer icon en IconComponent
function StatCard({ 
  // eslint-disable-next-line no-unused-vars
  icon: IconComponent, 
  label, 
  value, 
  badge, 
  iconBgColor = "bg-gray-100", 
  iconColor = "text-gray-700" 
}) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 ${iconBgColor} rounded-lg flex items-center justify-center`}>
          <IconComponent className={`w-6 h-6 ${iconColor}`} />
        </div>
        {badge && (
          <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
            {badge}
          </span>
        )}
      </div>
      <p className="text-gray-500 text-sm mb-1">{label}</p>
      <p className="text-2xl font-light text-gray-900">{value}</p>
    </div>
  );
}

// Composant UserCard (pour la liste des utilisateurs)
function UserCard({ user, isSelected, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`p-4 border rounded-lg cursor-pointer transition-all ${
        isSelected
          ? "border-gray-900 bg-gray-50"
          : "border-gray-100 hover:border-gray-300 hover:bg-gray-50"
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
          <span className="text-purple-600 font-medium text-sm">
            {(user.fullname || user.email)?.charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {user.fullname || "Sans nom"}
          </p>
          <p className="text-xs text-gray-500 truncate">{user.email}</p>
        </div>
        {isSelected && <div className="w-2 h-2 bg-gray-900 rounded-full"></div>}
      </div>
    </div>
  );
}

// Composant MyCardItem (pour les cartes de l'utilisateur)
function MyCardItem({ card }) {
  return (
    <div className="p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
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
        {(card.balance || 0).toLocaleString("fr-FR", {
          minimumFractionDigits: 2,
        })}{" "}
        <span className="text-xs text-gray-600">MAD</span>
      </p>
    </div>
  );
}

// Composant TransactionItem
function TransactionItem({ operation, showUserName = false }) {
  return (
    <div className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
          <ArrowUpRight className="w-5 h-5 text-red-600" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900">
            {operation.designation || "Opération"}
          </p>
          <div className="flex items-center gap-2 mt-1">
            {showUserName && operation.userName && (
              <>
                <span className="text-xs text-purple-600 font-medium">
                  {operation.userName}
                </span>
                <span className="text-xs text-gray-400">•</span>
              </>
            )}
            <span className="text-xs text-gray-500 uppercase">
              {operation.cardType}
            </span>
            <span className="text-xs text-gray-400">•</span>
            <span className="text-xs text-gray-500">
{              // eslint-disable-next-line react-hooks/purity
}              {new Date(operation.createdAt || Date.now()).toLocaleDateString(
                "fr-FR",
                {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                }
              )}
            </span>
          </div>
        </div>
      </div>
      <p className="text-sm font-medium text-red-600">
        -{operation.debit?.toFixed(2)} MAD
      </p>
    </div>
  );
}

// Composant UserDetailsPanel
function UserDetailsPanel({ selectedUser, userDetails, loading, onClose }) {
  const [activeTab, setActiveTab] = useState("operations");

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="text-center py-12">
          <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-gray-500">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!userDetails) return null;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-light text-gray-900 mb-1">
            Activité de {selectedUser.fullname || selectedUser.email}
          </h2>
          <p className="text-sm text-gray-500">{selectedUser.email}</p>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-xs text-gray-500 mb-1">Solde actuel</p>
          <p className="text-lg font-light text-gray-900">
            {userDetails.totalBalance} <span className="text-xs">MAD</span>
          </p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-xs text-gray-500 mb-1">Cartes</p>
          <p className="text-lg font-light text-gray-900">
            {userDetails.totalCards}
          </p>
        </div>
        <div className="bg-red-50 rounded-lg p-4">
          <p className="text-xs text-red-600 mb-1">Total dépensé</p>
          <p className="text-lg font-light text-red-600">
            -{userDetails.totalOperationsAmount} <span className="text-xs">MAD</span>
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {userDetails.totalOperations} opérations
          </p>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <p className="text-xs text-green-600 mb-1">Total rechargé</p>
          <p className="text-lg font-light text-green-600">
            +{userDetails.totalRechargesAmount} <span className="text-xs">MAD</span>
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {userDetails.totalRecharges} recharges
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="flex gap-2 border-b border-gray-200">
          <button
            onClick={() => setActiveTab("operations")}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "operations"
                ? "text-gray-900 border-b-2 border-gray-900"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Opérations ({userDetails.totalOperations})
          </button>
          <button
            onClick={() => setActiveTab("recharges")}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "recharges"
                ? "text-gray-900 border-b-2 border-gray-900"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Recharges ({userDetails.totalRecharges})
          </button>
          <button
            onClick={() => setActiveTab("cartes")}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "cartes"
                ? "text-gray-900 border-b-2 border-gray-900"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Cartes ({userDetails.totalCards})
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <TabContent activeTab={activeTab} userDetails={userDetails} />
    </div>
  );
}

// Composant TabContent
function TabContent({ activeTab, userDetails }) {
  if (activeTab === "cartes") {
    return (
      <div className="space-y-3">
        {userDetails.cards.length === 0 ? (
          <EmptyState icon={CreditCard} message="Aucune carte" />
        ) : (
          userDetails.cards.map((card) => (
            <CardDetailItem key={card.id} card={card} />
          ))
        )}
      </div>
    );
  }

  if (activeTab === "operations") {
    return (
      <div className="space-y-2 max-h-80 overflow-y-auto">
        {userDetails.recentOperations.length === 0 ? (
          <EmptyState icon={Activity} message="Aucune opération" />
        ) : (
          userDetails.recentOperations.map((op, index) => (
            <OperationDetailItem key={index} operation={op} />
          ))
        )}
      </div>
    );
  }

  if (activeTab === "recharges") {
    return (
      <div className="space-y-2 max-h-80 overflow-y-auto">
        {userDetails.loads.length === 0 ? (
          <EmptyState icon={TrendingUp} message="Aucune recharge" />
        ) : (
          userDetails.loads.map((load, index) => (
            <RechargeDetailItem key={index} load={load} />
          ))
        )}
      </div>
    );
  }

  return null;
}

// Composants de détail
function CardDetailItem({ card }) {
  return (
    <div className="p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
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
            {(card.balance || 0).toFixed(2)}{" "}
            <span className="text-xs text-gray-600">MAD</span>
          </p>
        </div>
        <div className="bg-red-50 rounded p-2">
          <p className="text-xs text-red-600 mb-1">Dépensé</p>
          <p className="text-sm font-medium text-red-600">
            -{(card.totalSpent || 0).toFixed(2)} <span className="text-xs">MAD</span>
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            {card.operationsCount || 0} op.
          </p>
        </div>
        <div className="bg-green-50 rounded p-2">
          <p className="text-xs text-green-600 mb-1">Rechargé</p>
          <p className="text-sm font-medium text-green-600">
            +{(card.totalRecharged || 0).toFixed(2)} <span className="text-xs">MAD</span>
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            {card.rechargesCount || 0} rech.
          </p>
        </div>
      </div>
    </div>
  );
}

function OperationDetailItem({ operation }) {
  return (
    <div className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center">
          <ArrowUpRight className="w-4 h-4 text-red-600" />
        </div>
        <div>
          <p className="text-xs font-medium text-gray-900">
            {operation.designation || "Opération"}
          </p>
          <div className="flex items-center gap-1 mt-0.5">
            <span className="text-xs text-gray-500 uppercase">
              {operation.cardType}
            </span>
            <span className="text-xs text-gray-400">•</span>
            <span className="text-xs text-gray-500">
{              // eslint-disable-next-line react-hooks/purity
}              {new Date(operation.createdAt || Date.now()).toLocaleDateString(
                "fr-FR",
                {
                  day: "2-digit",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                }
              )}
            </span>
          </div>
        </div>
      </div>
      <p className="text-xs font-medium text-red-600">
        -{operation.debit?.toFixed(2)} MAD
      </p>
    </div>
  );
}

function RechargeDetailItem({ load }) {
  return (
    <div className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
          <ArrowDownCircle className="w-4 h-4 text-green-600" />
        </div>
        <div>
          <p className="text-xs font-medium text-gray-900">Recharge</p>
          <div className="flex items-center gap-1 mt-0.5">
            <span className="text-xs text-gray-500 uppercase">{load.cardType}</span>
            <span className="text-xs text-gray-400">•</span>
            <span className="text-xs text-gray-500">
{              // eslint-disable-next-line react-hooks/purity
}              {new Date(load.createdAt || Date.now()).toLocaleDateString("fr-FR", {
                day: "2-digit",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        </div>
      </div>
      <p className="text-xs font-medium text-green-600">
        +{load.amount?.toFixed(2)} MAD
      </p>
    </div>
  );
}

// Composant EmptyState - FIX: Renommer icon en IconComponent
// Composant EmptyState
// eslint-disable-next-line no-unused-vars
function EmptyState({ icon: Icon, message }) {
  return (
    <div className="text-center py-8 text-gray-400">
      <Icon className="w-8 h-8 mx-auto mb-2 text-gray-300" />
      <p className="text-xs">{message}</p>
    </div>
  );
}

// ============ COMPOSANT PRINCIPAL ============

export default function Dashboard() {
  const { user } = useAuth();
  const isAdmin = user.role === "admin";

  // Hooks conditionnels basés sur le rôle
  const userDashboard = useUserDashboard(!isAdmin ? user.id : null);
  const adminDashboard = useAdminDashboard();
  const userDetailsHook = useUserDetails();

  // Sélectionner les bonnes données selon le rôle
  const { stats, loading, error } = isAdmin ? adminDashboard : userDashboard;
  const users = isAdmin ? adminDashboard.users : [];

  // Mémoïser les valeurs formatées
  const formattedBalance = useMemo(() => {
    return stats.totalBalance.toLocaleString("fr-FR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }, [stats.totalBalance]);

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
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-light text-gray-900">
              {isAdmin ? "Tableau de bord Administrateur" : "Tableau de bord"}
            </h1>
            {isAdmin && (
              <span className="px-3 py-1 bg-gray-900 text-white text-xs rounded-full flex items-center gap-1">
                <Shield className="w-3 h-3" />
                Admin
              </span>
            )}
          </div>
          <p className="text-gray-500 text-sm">
            {isAdmin
              ? "Vue d'ensemble de toutes les activités"
              : `Bienvenue, ${user.fullname || user.email}`}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Stats Grid */}
        <div
          className={`grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 ${
            isAdmin ? "lg:grid-cols-5" : "lg:grid-cols-4"
          }`}
        >
          <StatCard
            icon={Wallet}
            label={isAdmin ? "Solde global" : "Solde total"}
            value={`${formattedBalance} MAD`}
            badge={isAdmin ? "Global" : "Total"}
          />

          {isAdmin && (
            <StatCard
              icon={Users}
              label="Utilisateurs"
              value={stats.totalUsers}
              iconBgColor="bg-purple-50"
              iconColor="text-purple-600"
            />
          )}

          <StatCard
            icon={CreditCard}
            label={isAdmin ? "Total cartes" : "Mes cartes"}
            value={stats.totalCards}
            iconBgColor="bg-blue-50"
            iconColor="text-blue-600"
          />

          <StatCard
            icon={Activity}
            label="Opérations"
            value={stats.totalOperations}
            iconBgColor="bg-orange-50"
            iconColor="text-orange-600"
          />

          <StatCard
            icon={TrendingUp}
            label="Recharges"
            value={stats.totalRecharges}
            iconBgColor="bg-green-50"
            iconColor="text-green-600"
          />
        </div>

        {/* Users with Balance (Admin only) */}
        {isAdmin && <UsersWithBalance />}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Users List (Admin) or My Cards (User) */}
          {isAdmin ? (
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-lg font-light text-gray-900 mb-4">
                  Utilisateurs
                </h2>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {users.length === 0 ? (
                    <EmptyState icon={Users} message="Aucun utilisateur" />
                  ) : (
                    users.map((userItem) => (
                      <UserCard
                        key={userItem.id}
                        user={userItem}
                        isSelected={userDetailsHook.selectedUser?.id === userItem.id}
                        onClick={() => userDetailsHook.loadUserDetails(userItem)}
                      />
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-lg font-light text-gray-900 mb-4">Mes cartes</h2>
                <div className="space-y-3">
                  {stats.cards.length === 0 ? (
                    <EmptyState icon={CreditCard} message="Aucune carte" />
                  ) : (
                    stats.cards.map((card) => <MyCardItem key={card.id} card={card} />)
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Activity Section */}
          <div className="lg:col-span-2">
            {isAdmin && userDetailsHook.selectedUser ? (
              <UserDetailsPanel
                selectedUser={userDetailsHook.selectedUser}
                userDetails={userDetailsHook.userDetails}
                loading={userDetailsHook.loading}
                onClose={userDetailsHook.clearUserDetails}
              />
            ) : (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-lg font-light text-gray-900 mb-4">
                  {isAdmin
                    ? "Activité récente (toutes les transactions)"
                    : "Activité récente"}
                </h2>
                <div className="space-y-3">
                  {stats.recentOperations.length === 0 ? (
                    <EmptyState icon={Activity} message="Aucune activité récente" />
                  ) : (
                    stats.recentOperations.map((op, index) => (
                      <TransactionItem
                        key={index}
                        operation={op}
                        showUserName={isAdmin}
                      />
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
