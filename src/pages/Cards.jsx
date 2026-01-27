import { useState, useEffect } from "react";
import { useAuth } from "../context/useAuth";
import {
  getUserCards,
  rechargeCard,
  getCardLoads,
  getCardLoadCount,
  updateCardLoad,
} from "../api/cardApi";
import {
  getCardOperations,
  addOperation,
  updateOperation,
  deleteOperation,
} from "../api/operationApi";
import { CreditCard, Plus, Wallet, Edit2, Trash2, X } from "lucide-react";
import { useLocation } from "react-router-dom";
import CustomBankCards from "../components/CustomBankCards";

export default function Cards() {
  const { user } = useAuth();
  const location = useLocation();
  const userID = location.state?.userID || user.id;
  const userName = location.state?.fullname || user.fullname;

  const [cards, setCards] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null);
  const [operations, setOperations] = useState([]);
  const [loads, setLoads] = useState([]);
  const [loadCount, setLoadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("operations");

  const [showRechargeModal, setShowRechargeModal] = useState(false);
  const [showOperationModal, setShowOperationModal] = useState(false);
  const [editingOperation, setEditingOperation] = useState(null);
  const [rechargeAmount, setRechargeAmount] = useState("");
  const [operationForm, setOperationForm] = useState({
    designation: "",
    debit: "",
  });

  // ---------- Ajout modification recharge ----------
  const [editingRecharge, setEditingRecharge] = useState(null);
  const [rechargeFormAmount, setRechargeFormAmount] = useState("");
  const [showEditRechargeModal, setShowEditRechargeModal] = useState(false);

  const openEditRechargeModal = (load) => {
    setEditingRecharge(load);
    setRechargeFormAmount(load.amount.toString());
    setShowEditRechargeModal(true);
  };

  const handleUpdateRecharge = async () => {
    if (!editingRecharge) return;

    try {
      const oldAmount = editingRecharge.amount;
      const newAmount = parseFloat(rechargeFormAmount);
      if (isNaN(newAmount) || newAmount <= 0) return;

      await updateCardLoad(editingRecharge.id, { amount: newAmount });

      // --- Mettre à jour le solde immédiatement ---
      updateCardBalance(selectedCard.id, newAmount - oldAmount, true);

      setShowEditRechargeModal(false);
      setEditingRecharge(null);
      setRechargeFormAmount("");

      loadCardData(selectedCard.id);
    } catch (error) {
      console.error("Erreur mise à jour recharge:", error);
    }
  };

  // const handleDeleteRecharge = async (loadId) => {
  //   if (!confirm("Supprimer cette recharge ?")) return;

  //   try {
  //     await deleteCardLoad(loadId);
  //     loadCardData(selectedCard.id);
  //   } catch (error) {
  //     console.error("Erreur suppression recharge:", error);
  //   }
  // };

  // ----------------------------------------------

  useEffect(() => {
    loadUserCards();
  }, [userID]);

  useEffect(() => {
    if (selectedCard) {
      loadCardData(selectedCard.id);
    }
  }, [selectedCard]);

  const loadUserCards = async () => {
    try {
      setLoading(true);
      const response = await getUserCards(userID);
      setCards(response.data);
      if (response.data.length > 0) {
        setSelectedCard(response.data[0]);
      }
    } catch (error) {
      console.error("Error loading cards:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadCardData = async (cardId) => {
    try {
      const [opsRes, loadsRes, countRes] = await Promise.all([
        getCardOperations(cardId),
        getCardLoads(cardId),
        getCardLoadCount(cardId),
      ]);
      setOperations(opsRes.data);
      setLoads(loadsRes.data);
      setLoadCount(countRes.data.nbChargements || 0);
    } catch (error) {
      console.error("Error loading card data:", error);
    }
  };

  const updateCardBalance = (cardId, amount, isRecharge = false) => {
    setCards((prevCards) =>
      prevCards.map((card) =>
        card.id === cardId
          ? {
              ...card,
              balance: isRecharge
                ? card.balance + amount
                : card.balance - amount,
            }
          : card,
      ),
    );
    if (selectedCard?.id === cardId) {
      setSelectedCard((prev) => ({
        ...prev,
        balance: isRecharge ? prev.balance + amount : prev.balance - amount,
      }));
    }
  };

  const handleRecharge = async () => {
    if (!rechargeAmount || !selectedCard) return;
    const amount = parseFloat(rechargeAmount);
    try {
      updateCardBalance(selectedCard.id, amount, true);
      await rechargeCard(selectedCard.id, { amount });

      setShowRechargeModal(false);
      setRechargeAmount("");
      loadCardData(selectedCard.id);
    } catch (error) {
      console.error("Error recharging card:", error);
      updateCardBalance(selectedCard.id, amount, false);
    }
  };

  const handleAddOperation = async () => {
    if (!operationForm.debit || !selectedCard) return;
    const debitAmount = parseFloat(operationForm.debit);
    try {
      updateCardBalance(selectedCard.id, debitAmount, false);
      await addOperation(selectedCard.id, {
        designation: operationForm.designation,
        debit: debitAmount,
      });
      setShowOperationModal(false);
      setOperationForm({ designation: "", debit: "" });
      loadCardData(selectedCard.id);
    } catch (error) {
      console.error("Error adding operation:", error);
      updateCardBalance(selectedCard.id, debitAmount, true);
    }
  };

  const handleUpdateOperation = async () => {
    if (!operationForm.debit || !editingOperation) return;
    try {
      const oldDebit = editingOperation.debit;
      const newDebit = parseFloat(operationForm.debit);
      const difference = newDebit - oldDebit;

      await updateOperation(editingOperation.id, {
        designation: operationForm.designation,
        debit: newDebit,
      });

      if (difference !== 0) {
        updateCardBalance(
          selectedCard.id,
          Math.abs(difference),
          difference < 0,
        );
      }

      setShowOperationModal(false);
      setEditingOperation(null);
      setOperationForm({ designation: "", debit: "" });
      loadCardData(selectedCard.id);
    } catch (error) {
      console.error("Error updating operation:", error);
    }
  };

  const handleDeleteOperation = async (operationId) => {
    if (!confirm("Supprimer cette opération ?")) return;
    const operation = operations.find((op) => op.id === operationId);
    if (!operation) return;

    try {
      updateCardBalance(selectedCard.id, operation.debit, true);
      await deleteOperation(operationId);
      loadCardData(selectedCard.id);
    } catch (error) {
      console.error("Error deleting operation:", error);
      updateCardBalance(selectedCard.id, operation.debit, false);
    }
  };

  const openEditModal = (operation) => {
    setEditingOperation(operation);
    setOperationForm({
      designation: operation.designation || "",
      debit: operation.debit.toString(),
    });
    setShowOperationModal(true);
  };

  const closeOperationModal = () => {
    setShowOperationModal(false);
    setEditingOperation(null);
    setOperationForm({ designation: "", debit: "" });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-light text-gray-900 mb-1">
            Cartes de {userName}
          </h1>
          <p className="text-gray-500 text-sm">
            Gérez vos cartes et transactions
          </p>
        </div>

        <CustomBankCards
          cards={cards}
          selectedCard={selectedCard}
          setSelectedCard={setSelectedCard}
        />

        {selectedCard && (
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="border-b border-gray-200 p-4">
              <div className="flex flex-wrap gap-4 justify-between items-center">
                <div className="flex gap-2">
                  <button
                    onClick={() => setActiveTab("operations")}
                    className={`px-4 py-2 text-sm rounded transition-colors ${
                      activeTab === "operations"
                        ? "bg-gray-900 text-white"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Opérations
                  </button>
                  <button
                    onClick={() => setActiveTab("loads")}
                    className={`px-4 py-2 text-sm rounded transition-colors ${
                      activeTab === "loads"
                        ? "bg-gray-900 text-white"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Recharges ({loadCount})
                  </button>
                </div>

                <div className="flex gap-2">
                  {user.role === "admin" && (
                    <button
                      onClick={() => setShowRechargeModal(true)}
                      className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white text-sm rounded transition-colors flex items-center gap-2"
                    >
                      <Wallet className="w-4 h-4" />
                      Recharger
                    </button>
                  )}
                  <button
                    onClick={() => setShowOperationModal(true)}
                    className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white text-sm rounded transition-colors flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Opération
                  </button>
                </div>
              </div>
            </div>

            <div className="p-4">
              {activeTab === "operations" ? (
                <div className="space-y-2">
                  {operations.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                      <p className="text-sm">Aucune opération</p>
                    </div>
                  ) : (
                    operations.map((op) => (
                      <div
                        key={op.id}
                        className="p-4 border border-gray-100 rounded hover:bg-gray-50 transition-colors flex justify-between items-center group"
                      >
                        <div className="flex-1">
                          <p className="text-gray-900 text-sm mb-1">
                            {op.designation || "Opération"}
                          </p>
                          <p className="text-gray-400 text-xs">
                            {new Date(
                              op.createdAt || Date.now(),
                            ).toLocaleDateString("fr-FR")}
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          <p className="text-gray-900 font-light">
                            -{op.debit?.toFixed(2)} DH
                          </p>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => openEditModal(op)}
                              className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                            >
                              <Edit2 className="w-4 h-4 text-gray-400" />
                            </button>
                            <button
                              onClick={() => handleDeleteOperation(op.id)}
                              className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                            >
                              <Trash2 className="w-4 h-4 text-gray-400" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {loads.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                      <p className="text-sm">Aucune recharge</p>
                    </div>
                  ) : (
                    loads.map((load) => (
                      <div
                        key={load.id}
                        className="p-4 border border-gray-100 rounded hover:bg-gray-50 transition-colors flex justify-between items-center group"
                      >
                        <div>
                          <p className="text-gray-900 text-sm mb-1">Recharge</p>
                          <p className="text-gray-400 text-xs">
                            {new Date(
                              load.createdAt || Date.now(),
                            ).toLocaleDateString("fr-FR")}
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          <p className="text-gray-900 font-light">
                            +{load.amount?.toFixed(2)} DH
                          </p>

                          {/* ICONES EDIT / DELETE */}
                          {user.role === "admin" && (
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => openEditRechargeModal(load)}
                                className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                              >
                                <Edit2 className="w-4 h-4 text-gray-400" />
                              </button>
                              {/* <button
                              onClick={() => handleDeleteRecharge(load.id)}
                              className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                            >
                              <Trash2 className="w-4 h-4 text-gray-400" />
                            </button> */}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ---------- Modals existants ---------- */}

      {showRechargeModal && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full border border-gray-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-light text-gray-900">Recharger</h2>
              <button
                onClick={() => setShowRechargeModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-600 text-sm mb-2">
                  Montant (DH)
                </label>
                <input
                  type="number"
                  value={rechargeAmount}
                  onChange={(e) => setRechargeAmount(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded focus:outline-none focus:border-gray-900 transition-colors"
                  placeholder="0.00"
                />
              </div>
              <button
                onClick={handleRecharge}
                className="w-full px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white text-sm rounded transition-colors"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}

      {showOperationModal && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full border border-gray-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-light text-gray-900">
                {editingOperation ? "Modifier" : "Nouvelle opération"}
              </h2>
              <button
                onClick={closeOperationModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-600 text-sm mb-2">
                  Désignation
                </label>
                <input
                  type="text"
                  value={operationForm.designation}
                  onChange={(e) =>
                    setOperationForm({
                      ...operationForm,
                      designation: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded focus:outline-none focus:border-gray-900 transition-colors"
                  placeholder="Paiement MARJANE MARKET"
                />
              </div>
              <div>
                <label className="block text-gray-600 text-sm mb-2">
                  Débit (DH)
                </label>
                <input
                  type="number"
                  value={operationForm.debit}
                  onChange={(e) =>
                    setOperationForm({
                      ...operationForm,
                      debit: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded focus:outline-none focus:border-gray-900 transition-colors"
                  placeholder="0.00"
                />
              </div>
              <button
                onClick={
                  editingOperation ? handleUpdateOperation : handleAddOperation
                }
                className="w-full px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white text-sm rounded transition-colors"
              >
                {editingOperation ? "Modifier" : "Ajouter"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------- Modal modification recharge ---------- */}
      {showEditRechargeModal && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full border border-gray-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-light text-gray-900">
                Modifier Recharge
              </h2>
              <button
                onClick={() => setShowEditRechargeModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-600 text-sm mb-2">
                  Montant (DH)
                </label>
                <input
                  type="number"
                  value={rechargeFormAmount}
                  onChange={(e) => setRechargeFormAmount(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded focus:outline-none focus:border-gray-900 transition-colors"
                  placeholder="0.00"
                />
              </div>
              <button
                onClick={handleUpdateRecharge}
                className="w-full px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white text-sm rounded transition-colors"
              >
                Modifier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
