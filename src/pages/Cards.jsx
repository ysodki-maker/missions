/* eslint-disable react-hooks/purity */
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/useAuth";
import { getUserCards, rechargeCard, getCardLoads, getCardLoadCount, updateCardLoad, deleteCardLoad } from "../api/cardApi";
import { getCardOperations, addOperation, updateOperation, deleteOperation } from "../api/operationApi";
import { CreditCard, Plus, Wallet, Edit2, Trash2, X } from "lucide-react";
import { useLocation } from "react-router-dom";
import CustomBankCards from "../components/CustomBankCards";

// ============ HOOKS PERSONNALISÉS ============

// Hook pour gérer les cartes
function useCards(userID) {
  const [cards, setCards] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUserCards = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getUserCards(userID);
      setCards(response.data);
      if (response.data.length > 0 && !selectedCard) {
        setSelectedCard(response.data[0]);
      }
    } catch (error) {
      console.error("Error loading cards:", error);
    } finally {
      setLoading(false);
    }
  }, [userID]);

  const updateCardBalance = useCallback((cardId, amount, isRecharge = false) => {
    setCards((prevCards) =>
      prevCards.map((card) =>
        card.id === cardId
          ? {
              ...card,
              balance: isRecharge ? card.balance + amount : card.balance - amount,
            }
          : card
      )
    );
    setSelectedCard((prev) =>
      prev?.id === cardId
        ? { ...prev, balance: isRecharge ? prev.balance + amount : prev.balance - amount }
        : prev
    );
  }, []);

  return { cards, selectedCard, setSelectedCard, loading, loadUserCards, updateCardBalance };
}

// Hook pour gérer les données d'une carte
function useCardData(selectedCard) {
  const [operations, setOperations] = useState([]);
  const [loads, setLoads] = useState([]);
  const [loadCount, setLoadCount] = useState(0);

  const loadCardData = useCallback(async (cardId) => {
    if (!cardId) return;
    
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
  }, []);

  useEffect(() => {
    if (selectedCard?.id) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadCardData(selectedCard.id);
    }
  }, [selectedCard?.id, loadCardData]);

  return { operations, loads, loadCount, loadCardData };
}

// Hook pour gérer les modals
function useModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState(null);

  const open = useCallback((initialData = null) => {
    setData(initialData);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setData(null);
  }, []);

  return { isOpen, data, open, close };
}

// ============ COMPOSANTS ============

// Composant Modal réutilisable
function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-sm w-full border border-gray-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-light text-gray-900">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// Composant pour les items de transaction
function TransactionItem({ item, type, onEdit, onDelete, showActions }) {
  const isRecharge = type === "recharge";
  
  return (
    <div className="p-4 border border-gray-100 rounded hover:bg-gray-50 transition-colors flex justify-between items-center group">
      <div className="flex-1">
        <p className="text-gray-900 text-sm mb-1">
          {isRecharge ? "Recharge" : (item.designation || "Opération")}
        </p>
        <p className="text-gray-400 text-xs">
          {new Date(item.createdAt || Date.now()).toLocaleDateString("fr-FR")}
        </p>
      </div>

      <div className="flex items-center gap-3">
        <p className="text-gray-900 font-light">
          {isRecharge ? "+" : "-"}{item.amount?.toFixed(2) || item.debit?.toFixed(2)} DH
        </p>
        
        {showActions && (
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onEdit(item)}
              className="p-1.5 hover:bg-gray-100 rounded transition-colors"
            >
              <Edit2 className="w-4 h-4 text-gray-400" />
            </button>
            <button
              onClick={() => onDelete(item.id)}
              className="p-1.5 hover:bg-gray-100 rounded transition-colors"
            >
              <Trash2 className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ============ COMPOSANT PRINCIPAL ============

export default function Cards() {
  const { user } = useAuth();
  const location = useLocation();
  const userID = location.state?.userID || user.id;
  const userName = location.state?.fullname || user.fullname;

  const [activeTab, setActiveTab] = useState("operations");

  // Hooks personnalisés
  const { cards, selectedCard, setSelectedCard, loading, loadUserCards, updateCardBalance } = useCards(userID);
  const { operations, loads, loadCount, loadCardData } = useCardData(selectedCard);
  
  // Modals
  const rechargeModal = useModal();
  const operationModal = useModal();
  const editRechargeModal = useModal();

  // Formulaires
  const [rechargeAmount, setRechargeAmount] = useState("");
  const [operationForm, setOperationForm] = useState({ designation: "", debit: "" });

  // Chargement initial
  useEffect(() => {
    loadUserCards();
  }, [loadUserCards]);

  // ========== HANDLERS RECHARGE ==========

  const handleRecharge = useCallback(async () => {
    if (!rechargeAmount || !selectedCard) return;
    
    const amount = parseFloat(rechargeAmount);
    if (isNaN(amount) || amount <= 0) return;

    try {
      updateCardBalance(selectedCard.id, amount, true);
      await rechargeCard(selectedCard.id, { amount });
      rechargeModal.close();
      setRechargeAmount("");
      loadCardData(selectedCard.id);
    } catch (error) {
      console.error("Error recharging card:", error);
      updateCardBalance(selectedCard.id, amount, false);
    }
  }, [rechargeAmount, selectedCard, updateCardBalance, rechargeModal, loadCardData]);

  const handleUpdateRecharge = useCallback(async () => {
    const load = editRechargeModal.data;
    if (!load || !rechargeAmount) return;

    const oldAmount = load.amount;
    const newAmount = parseFloat(rechargeAmount);
    if (isNaN(newAmount) || newAmount <= 0) return;

    try {
      updateCardBalance(selectedCard.id, newAmount - oldAmount, true);
      await updateCardLoad(load.id, { amount: newAmount });
      editRechargeModal.close();
      setRechargeAmount("");
      loadCardData(selectedCard.id);
    } catch (error) {
      console.error("Error updating recharge:", error);
      updateCardBalance(selectedCard.id, newAmount - oldAmount, false);
    }
  }, [editRechargeModal.data, rechargeAmount, selectedCard, updateCardBalance, editRechargeModal, loadCardData]);

  const handleDeleteRecharge = useCallback(async (loadId) => {
    if (!confirm("Annuler cette recharge ?")) return;

    const load = loads.find((l) => l.id === loadId);
    if (!load || !selectedCard) return;

    try {
      updateCardBalance(selectedCard.id, load.amount, false);
      await deleteCardLoad(loadId);
      loadCardData(selectedCard.id);
    } catch (error) {
      console.error("Error deleting recharge:", error);
      updateCardBalance(selectedCard.id, load.amount, true);
    }
  }, [loads, selectedCard, updateCardBalance, loadCardData]);

  // ========== HANDLERS OPÉRATION ==========

  const handleAddOperation = useCallback(async () => {
    if (!operationForm.debit || !selectedCard) return;
    
    const debitAmount = parseFloat(operationForm.debit);
    if (isNaN(debitAmount) || debitAmount <= 0) return;

    try {
      updateCardBalance(selectedCard.id, debitAmount, false);
      await addOperation(selectedCard.id, {
        designation: operationForm.designation,
        debit: debitAmount,
      });
      operationModal.close();
      setOperationForm({ designation: "", debit: "" });
      loadCardData(selectedCard.id);
    } catch (error) {
      console.error("Error adding operation:", error);
      updateCardBalance(selectedCard.id, debitAmount, true);
    }
  }, [operationForm, selectedCard, updateCardBalance, operationModal, loadCardData]);

  const handleUpdateOperation = useCallback(async () => {
    const operation = operationModal.data;
    if (!operationForm.debit || !operation) return;

    const oldDebit = operation.debit;
    const newDebit = parseFloat(operationForm.debit);
    const difference = newDebit - oldDebit;

    try {
      await updateOperation(operation.id, {
        designation: operationForm.designation,
        debit: newDebit,
      });

      if (difference !== 0) {
        updateCardBalance(selectedCard.id, Math.abs(difference), difference < 0);
      }

      operationModal.close();
      setOperationForm({ designation: "", debit: "" });
      loadCardData(selectedCard.id);
    } catch (error) {
      console.error("Error updating operation:", error);
    }
  }, [operationModal.data, operationForm, selectedCard, updateCardBalance, operationModal, loadCardData]);

  const handleDeleteOperation = useCallback(async (operationId) => {
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
  }, [operations, selectedCard, updateCardBalance, loadCardData]);

  // ========== HANDLERS UI ==========

  const openRechargeModal = useCallback((load = null) => {
    if (load) {
      setRechargeAmount(load.amount.toString());
      editRechargeModal.open(load);
    } else {
      setRechargeAmount("");
      rechargeModal.open();
    }
  }, [rechargeModal, editRechargeModal]);

  const openOperationModal = useCallback((operation = null) => {
    if (operation) {
      setOperationForm({
        designation: operation.designation || "",
        debit: operation.debit.toString(),
      });
      operationModal.open(operation);
    } else {
      setOperationForm({ designation: "", debit: "" });
      operationModal.open();
    }
  }, [operationModal]);

  // ========== RENDER ==========

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Chargement...</div>
      </div>
    );
  }

  const isAdmin = user.role === "admin";

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-light text-gray-900 mb-1">Cartes de {userName}</h1>
          <p className="text-gray-500 text-sm">Gérez vos cartes et transactions</p>
        </div>

        <CustomBankCards
          cards={cards}
          selectedCard={selectedCard}
          setSelectedCard={setSelectedCard}
        />

        {selectedCard && (
          <div className="bg-white rounded-lg border border-gray-200">
            {/* Tabs */}
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
                  {isAdmin && (
                    <button
                      onClick={() => openRechargeModal()}
                      className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white text-sm rounded transition-colors flex items-center gap-2"
                    >
                      <Wallet className="w-4 h-4" />
                      Recharger
                    </button>
                  )}
                  <button
                    onClick={() => openOperationModal()}
                    className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white text-sm rounded transition-colors flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Opération
                  </button>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-4">
              {activeTab === "operations" ? (
                <div className="space-y-2">
                  {operations.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                      <p className="text-sm">Aucune opération</p>
                    </div>
                  ) : (
                    operations.map((op) => (
                      <TransactionItem
                        key={op.id}
                        item={op}
                        type="operation"
                        onEdit={openOperationModal}
                        onDelete={handleDeleteOperation}
                        showActions={true}
                      />
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
                      <TransactionItem
                        key={load.id}
                        item={load}
                        type="recharge"
                        onEdit={openRechargeModal}
                        onDelete={handleDeleteRecharge}
                        showActions={isAdmin}
                      />
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <Modal
        isOpen={rechargeModal.isOpen}
        onClose={rechargeModal.close}
        title="Recharger"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-gray-600 text-sm mb-2">Montant (DH)</label>
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
      </Modal>

      <Modal
        isOpen={editRechargeModal.isOpen}
        onClose={editRechargeModal.close}
        title="Modifier Recharge"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-gray-600 text-sm mb-2">Montant (DH)</label>
            <input
              type="number"
              value={rechargeAmount}
              onChange={(e) => setRechargeAmount(e.target.value)}
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
      </Modal>

      <Modal
        isOpen={operationModal.isOpen}
        onClose={operationModal.close}
        title={operationModal.data ? "Modifier" : "Nouvelle opération"}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-gray-600 text-sm mb-2">Désignation</label>
            <input
              type="text"
              value={operationForm.designation}
              onChange={(e) =>
                setOperationForm({ ...operationForm, designation: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-200 rounded focus:outline-none focus:border-gray-900 transition-colors"
              placeholder="Paiement MARJANE MARKET"
            />
          </div>
          <div>
            <label className="block text-gray-600 text-sm mb-2">Débit (DH)</label>
            <input
              type="number"
              value={operationForm.debit}
              onChange={(e) =>
                setOperationForm({ ...operationForm, debit: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-200 rounded focus:outline-none focus:border-gray-900 transition-colors"
              placeholder="0.00"
            />
          </div>
          <button
            onClick={operationModal.data ? handleUpdateOperation : handleAddOperation}
            className="w-full px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white text-sm rounded transition-colors"
          >
            {operationModal.data ? "Modifier" : "Ajouter"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
