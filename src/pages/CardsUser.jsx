import { useEffect, useState, useCallback, useMemo } from "react";
import {
  CreditCard,
  History,
  RefreshCcw,
  X,
  ArrowUpCircle,
  AlertCircle,
} from "lucide-react";
import {
  getUserCards,
  getCardLoads,
  rechargeCard,
  getCardLoadCount,
} from "../api/cardApi";
import { useLocation, useParams } from "react-router-dom";

// ============ UTILITAIRES ============

const getCardColor = (type) => {
  const colors = {
    visa: "bg-blue-500",
    mastercard: "bg-orange-500",
    amex: "bg-teal-500",
    default: "bg-gray-700",
  };
  return colors[type?.toLowerCase()] || colors.default;
};

const formatCurrency = (amount) => {
  return amount.toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const formatDate = (date) => {
  return new Date(date).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// ============ HOOKS PERSONNALISÉS ============

function useCards(userId) {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadCards = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await getUserCards(userId);
      const cardsData = response.data || response;

      const cardsWithLoadCount = await Promise.all(
        cardsData.map(async (card) => {
          try {
            const loadCountResponse = await getCardLoadCount(card.id);
            const loadCountData = loadCountResponse.data || loadCountResponse;
            const loadCount =
              typeof loadCountData === "object" &&
              loadCountData.nbChargements !== undefined
                ? loadCountData.nbChargements
                : typeof loadCountData === "number"
                ? loadCountData
                : 0;
            return { ...card, loadCount };
          } catch (err) {
            console.error(
              `Erreur lors du chargement du count pour ${card.id}:`,
              err
            );
            return { ...card, loadCount: 0 };
          }
        })
      );

      setCards(cardsWithLoadCount);
    } catch (err) {
      console.error("Erreur lors du chargement des cartes:", err);
      setError("Impossible de charger les cartes. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadCards();
  }, [loadCards]);

  return { cards, loading, error, reloadCards: loadCards };
}

function useCardDetails(selectedCard, userId) {
  const [loads, setLoads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [rechargeAmount, setRechargeAmount] = useState("");

  const loadHistory = useCallback(async (card) => {
    if (!card) return;

    setError("");
    setLoading(true);

    try {
      const response = await getCardLoads(card.id);
      const loadsData = response.data || response || [];
      setLoads(loadsData);
    } catch (err) {
      console.error("Erreur lors du chargement de l'historique:", err);
      setError("Impossible de charger l'historique des recharges.");
      setLoads([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRecharge = useCallback(
    async (onSuccess) => {
      if (!rechargeAmount || parseFloat(rechargeAmount) <= 0) {
        setError("Veuillez entrer un montant valide");
        return;
      }

      if (!selectedCard) return;

      setLoading(true);
      setError("");

      try {
        await rechargeCard(selectedCard.id, {
          amount: parseFloat(rechargeAmount),
        });
        setRechargeAmount("");
        
        // Recharger l'historique et les cartes
        await loadHistory(selectedCard);
        if (onSuccess) await onSuccess();

        // Mettre à jour la carte sélectionnée avec les nouvelles données
        const updatedResponse = await getUserCards(userId);
        const updatedCardsData = updatedResponse.data || updatedResponse;
        const updatedCard = updatedCardsData.find(
          (c) => c.id === selectedCard.id
        );
        
        if (updatedCard) {
          const loadCountResponse = await getCardLoadCount(updatedCard.id);
          const loadCountData = loadCountResponse.data || loadCountResponse;
          const loadCount =
            typeof loadCountData === "object" &&
            loadCountData.nbChargements !== undefined
              ? loadCountData.nbChargements
              : typeof loadCountData === "number"
              ? loadCountData
              : 0;
          
          // Retourner la carte mise à jour pour mettre à jour le state parent
          return { ...updatedCard, loadCount };
        }
      } catch (err) {
        console.error("Erreur lors de la recharge:", err);
        setError(
          err.response?.data?.message ||
            "Erreur lors de la recharge. Veuillez réessayer."
        );
      } finally {
        setLoading(false);
      }
    },
    [rechargeAmount, selectedCard, userId, loadHistory]
  );

  const resetState = useCallback(() => {
    setLoads([]);
    setError("");
    setRechargeAmount("");
    setLoading(false);
  }, []);

  return {
    loads,
    loading,
    error,
    rechargeAmount,
    setRechargeAmount,
    loadHistory,
    handleRecharge,
    resetState,
  };
}

// ============ COMPOSANTS ============

// Composant ErrorAlert
function ErrorAlert({ message }) {
  if (!message) return null;

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
      <p className="text-sm text-red-700">{message}</p>
    </div>
  );
}

// Composant LoadingSpinner
function LoadingSpinner({ message = "Chargement..." }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-gray-600 text-sm">{message}</p>
      </div>
    </div>
  );
}

// Composant CardItem
function CardItem({ card, onClick }) {
  const cardColor = useMemo(() => getCardColor(card.type), [card.type]);
  const formattedBalance = useMemo(
    () => formatCurrency(card.balance || 0),
    [card.balance]
  );

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg border border-gray-200 p-5 hover:border-gray-300 hover:shadow-sm transition-all cursor-pointer"
    >
      {/* Type et badge */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${cardColor}`}></div>
          <span className="text-sm font-medium text-gray-700 uppercase">
            {card.type}
          </span>
        </div>
        <span className="text-xs text-gray-500">
          {card.loadCount || 0} recharge{(card.loadCount || 0) > 1 ? "s" : ""}
        </span>
      </div>

      {/* Numéro de carte */}
      <div className="mb-4">
        <p className="text-xs text-gray-500 mb-1">Numéro</p>
        <p className="text-sm font-mono text-gray-700">
          •••• •••• •••• {card.id}
        </p>
      </div>

      {/* Solde */}
      <div className="pt-4 border-t border-gray-100">
        <p className="text-xs text-gray-500 mb-1">Solde disponible</p>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-gray-900">
            {formattedBalance}
          </span>
          <span className="text-sm text-gray-600 font-medium">MAD</span>
        </div>
      </div>
    </div>
  );
}

// Composant EmptyState
function EmptyState({title, description }) {
  return (
    <div className="col-span-full bg-white rounded-lg border border-gray-200 p-12 text-center">
      <Icon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
      <p className="text-gray-600 font-medium mb-1">{title}</p>
      <p className="text-sm text-gray-500">{description}</p>
    </div>
  );
}

// Composant LoadHistoryItem
function LoadHistoryItem({ load }) {
  const formattedAmount = useMemo(
    () => formatCurrency(load.amount || 0),
    [load.amount]
  );
  const formattedDate = useMemo(
    () => formatDate(load.createdAt),
    [load.createdAt]
  );

  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-green-100 rounded-lg flex items-center justify-center">
          <ArrowUpCircle className="w-5 h-5 text-green-600" />
        </div>
        <div>
          <p className="font-semibold text-gray-900 text-sm">
            +{formattedAmount} MAD
          </p>
          <p className="text-xs text-gray-500">{formattedDate}</p>
        </div>
      </div>
      <span className="text-xs font-medium text-green-700 bg-green-50 px-2.5 py-1 rounded">
        Recharge
      </span>
    </div>
  );
}

// Composant CardModal
function CardModal({
  card,
  loads,
  amount,
  setAmount,
  loading,
  error,
  onClose,
  onRecharge,
}) {
  const cardColor = useMemo(() => getCardColor(card.type), [card.type]);
  const formattedBalance = useMemo(
    () => formatCurrency(card.balance || 0),
    [card.balance]
  );

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
      <div
        className="absolute inset-0 bg-black/20"
        onClick={onClose}
      ></div>
      
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col relative z-10">
        {/* En-tête du modal */}
        <div className="bg-gray-50 border-b border-gray-200 p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-2 h-2 rounded-full ${cardColor}`}></div>
                <h2 className="text-xl font-bold text-gray-900">
                  {card.type}
                </h2>
              </div>
              <p className="text-sm text-gray-500 font-mono">
                •••• •••• •••• {card.id}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Statistiques */}
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <p className="text-xs text-gray-500 mb-1">Solde actuel</p>
              <p className="text-xl font-bold text-gray-900">
                {formattedBalance}{" "}
                <span className="text-sm font-medium text-gray-600">MAD</span>
              </p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <p className="text-xs text-gray-500 mb-1">Total recharges</p>
              <p className="text-xl font-bold text-gray-900">
                {card.loadCount || 0}
              </p>
            </div>
          </div>
        </div>

        {/* Message d'erreur dans le modal */}
        {error && (
          <div className="mx-6 mt-6">
            <ErrorAlert message={error} />
          </div>
        )}

        {/* Section Recharge */}
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-base font-semibold text-gray-900 mb-4">
            Recharger la carte
          </h3>
          <div className="flex gap-3">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Montant en MAD"
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
              min="0"
              step="0.01"
            />
            <button
              onClick={onRecharge}
              disabled={loading || !amount}
              className="px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Chargement...</span>
                </>
              ) : (
                <>
                  <RefreshCcw className="w-4 h-4" />
                  <span>Recharger</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Historique des recharges */}
        <div className="flex-1 overflow-y-auto p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">
            Historique des recharges
          </h3>

          {loads.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <History className="w-10 h-10 mx-auto mb-2 text-gray-300" />
              <p className="text-sm font-medium">Aucune recharge</p>
              <p className="text-xs mt-1 text-gray-400">
                L'historique apparaîtra ici
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {loads.map((load, index) => (
                <LoadHistoryItem key={index} load={load} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============ COMPOSANT PRINCIPAL ============

export default function Cards() {
  const { id: userId } = useParams();
  const location = useLocation();
  const userName = location.state?.fullname;

  const [selectedCard, setSelectedCard] = useState(null);

  // Hooks personnalisés
  const { cards, loading, error, reloadCards } = useCards(userId);
  const cardDetails = useCardDetails(selectedCard, userId);

  // Ouvrir l'historique d'une carte
  const handleOpenHistory = useCallback(
    async (card) => {
      setSelectedCard(card);
      await cardDetails.loadHistory(card);
    },
    [cardDetails]
  );

  // Fermer le modal
  const handleCloseModal = useCallback(() => {
    setSelectedCard(null);
    cardDetails.resetState();
  }, [cardDetails]);

  // Gérer la recharge
  const handleRecharge = useCallback(async () => {
    const updatedCard = await cardDetails.handleRecharge(reloadCards);
    if (updatedCard) {
      setSelectedCard(updatedCard);
    }
  }, [cardDetails, reloadCards]);

  if (loading) {
    return <LoadingSpinner message="Chargement des cartes..." />;
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* En-tête */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            Cartes de {userName}
          </h1>
          <p className="text-sm text-gray-500">
            Gérez et rechargez vos cartes bancaires
          </p>
        </div>

        {/* Message d'erreur global */}
        {error && !selectedCard && (
          <div className="mb-6">
            <ErrorAlert message={error} />
          </div>
        )}

        {/* Grille de cartes */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {cards.length === 0 ? (
            <EmptyState
              icon={CreditCard}
              title="Aucune carte trouvée"
              description="Cet utilisateur n'a pas encore de carte enregistrée"
            />
          ) : (
            cards.map((card) => (
              <CardItem
                key={card.id}
                card={card}
                onClick={() => handleOpenHistory(card)}
              />
            ))
          )}
        </div>

        {/* Modal Historique & Recharge */}
        {selectedCard && (
          <CardModal
            card={selectedCard}
            loads={cardDetails.loads}
            amount={cardDetails.rechargeAmount}
            setAmount={cardDetails.setRechargeAmount}
            loading={cardDetails.loading}
            error={cardDetails.error}
            onClose={handleCloseModal}
            onRecharge={handleRecharge}
          />
        )}
      </div>
    </div>
  );
}
