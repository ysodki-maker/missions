import { Navigate, Outlet } from "react-router-dom"
import { useAuth } from "../context/useAuth"

export default function ProtectedRoute() {
  const { user, loading } = useAuth()

  if (loading) return <div className="p-10">Loading...</div>

  return user ? <Outlet /> : <Navigate to="/login" />
}
