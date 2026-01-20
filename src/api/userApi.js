import api from "./axios"

export const getUsers = () => api.get("/users")
export const getUser = (id) => api.get(`/users/${id}`)
export const createUser = (data) => api.post("/auth/register", data)
export const updateUser = (id, data) => api.put(`/users/${id}`, data)
export const deleteUser = (id) => api.delete(`/users/${id}`)
