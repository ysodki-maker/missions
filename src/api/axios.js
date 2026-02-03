import axios from "axios"

const api = axios.create({
  baseURL: "https://cardscore.cosinus.ma/api", // adapte si ton backend est ailleurs
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token")
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default api




