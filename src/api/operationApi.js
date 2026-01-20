import api from "./axios";

// 🔹 Récupérer les opérations d'une carte
export const getCardOperations = (cardId) =>
  api.get(`/operations/${cardId}`);

// 🔹 Ajouter une opération
export const addOperation = (cardId, data) =>
  api.post(`/operations/${cardId}`, data);

// 🔹 Modifier une opération
export const updateOperation = (operationId, data) =>
  api.put(`/operations/${operationId}`, data);

// 🔹 Supprimer une opération
export const deleteOperation = (operationId) =>
  api.delete(`/operations/${operationId}`);

/* 
  Type de la data envoyer 
  {
    "designation" : "Paiment MARJANE MARKET BEAUS upd", 
    "debit" : "277"
  }
*/