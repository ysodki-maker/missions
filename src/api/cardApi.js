import api from "./axios";

// Récupérer toutes les cartes d'un utilisateur
export const getUserCards = (userId) => api.get(`/cards/user/${userId}`);

// Recharger une carte (admin) → data doit contenir { amount }
export const rechargeCard = (cardId, data) =>
  api.post(`/cards/load/${cardId}`, data);

// Récupérer l'historique des recharges d'une carte
export const getCardLoads = (cardId) =>
  api.get(`/cards/loads/${cardId}`);

// Récupérer le nombre total de recharges d'une carte
export const getCardLoadCount = (cardId) =>
  api.get(`/cards/loads/count/${cardId}`);

// Modifier une recharge
export const updateCardLoad = (loadId, data) =>
  api.put(`/cards/load/${loadId}`, data);

