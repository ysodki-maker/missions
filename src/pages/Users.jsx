import { useEffect, useState } from "react";
import { getUsers, createUser, updateUser, deleteUser } from "../api/userApi";
import {
  Users as UsersIcon,
  UserPlus,
  Search,
  Edit2,
  Trash2,
  X,
  Mail,
  User,
  Lock,
  Shield,
  AlertCircle,
  CreditCard,
  Eye,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Users() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [openModal, setOpenModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [form, setForm] = useState({
    email: "",
    fullname: "",
    password: "",
    role: "user",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const navigate = useNavigate();
  // Charger la liste des utilisateurs
  const loadUsers = async () => {
    try {
      const res = await getUsers();
      setUsers(res.data);
      setFilteredUsers(res.data);
    } catch (err) {
      console.error(err);
      setError("Erreur lors du chargement des utilisateurs");
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // Filtrer les utilisateurs par recherche
  useEffect(() => {
    const filtered = users.filter(
      (user) =>
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.fullname.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUsers(filtered);
  }, [searchTerm, users]);

  // Handle changement des inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Ouvrir le modal pour créer
  const openCreateModal = () => {
    setEditMode(false);
    setCurrentUserId(null);
    setForm({ email: "", fullname: "", password: "", role: "user" });
    setError("");
    setOpenModal(true);
  };

  // Ouvrir le modal pour éditer
  const openEditModal = (user) => {
    setEditMode(true);
    setCurrentUserId(user.id);
    setForm({
      email: user.email,
      fullname: user.fullname,
      password: "",
      role: user.role,
    });
    setError("");
    setOpenModal(true);
  };

  // Soumettre le formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (editMode) {
        // Mise à jour
        const updateData = { ...form };
        if (!updateData.password) delete updateData.password;
        await updateUser(currentUserId, updateData);
      } else {
        // Création
        await createUser(form);
      }

      setOpenModal(false);
      setForm({ email: "", fullname: "", password: "", role: "user" });
      loadUsers();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Erreur lors de l'opération");
    } finally {
      setLoading(false);
    }
  };

  // Supprimer un utilisateur
  const handleDelete = async (id) => {
    try {
      await deleteUser(id);
      loadUsers();
      setDeleteConfirm(null);
    } catch (err) {
      console.error(err);
      setError("Erreur lors de la suppression");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* En-tête */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-gray-900 rounded-lg">
              <UsersIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-800">
                Gestion des Utilisateurs
              </h1>
              <p className="text-slate-600">
                {users.length} utilisateur{users.length > 1 ? "s" : ""} au total
              </p>
            </div>
          </div>
        </div>

        {/* Barre d'actions */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            {/* Barre de recherche */}
            <div className="relative flex-1 w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Rechercher par nom ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              />
            </div>

            {/* Bouton créer */}
            <button
              onClick={openCreateModal}
              className="w-full sm:w-auto bg-gray-900 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-all shadow-sm hover:shadow-md"
            >
              <UserPlus className="w-5 h-5" />
              Nouvel utilisateur
            </button>
          </div>
        </div>

        {/* Message d'erreur global */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Table des utilisateurs */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left p-4 text-sm font-semibold text-slate-700">
                    Utilisateur
                  </th>
                  <th className="text-left p-4 text-sm font-semibold text-slate-700">
                    Email
                  </th>
                  <th className="text-left p-4 text-sm font-semibold text-slate-700">
                    Rôle
                  </th>
                  <th className="text-left p-4 text-sm font-semibold text-slate-700">
                    Cartes
                  </th>
                  <th className="text-right p-4 text-sm font-semibold text-slate-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="p-12 text-center text-slate-500">
                      <UsersIcon className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                      <p className="font-medium">Aucun utilisateur trouvé</p>
                      <p className="text-sm mt-1">
                        {searchTerm
                          ? "Essayez une autre recherche"
                          : "Commencez par créer un utilisateur"}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr
                      key={user.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-gray-900 to-gray-500 rounded-full flex items-center justify-center text-white font-semibold">
                            {user.fullname.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-slate-800">
                              {user.fullname}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-slate-600">{user.email}</td>
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                            user.role === "admin"
                              ? "bg-purple-100 text-purple-700"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          <Shield className="w-3 h-3" />
                          {user.role === "admin"
                            ? "Administrateur"
                            : "Utilisateur"}
                        </span>
                      </td>
                      <td>
                        <button
                          className="
      flex items-center gap-2 px-3 py-1.5
      text-indigo-600 border border-indigo-600
      rounded-md font-medium
      transition-colors duration-200
      hover:bg-indigo-50 hover:text-indigo-700
    "
                          title="Voir les deux cartes"
                          onClick={()=>navigate(`/cards`,{state:{userID:user.id,fullname:user.fullname}})}
                        >
                          <CreditCard className="w-4 h-4" />
                          Voir les cartes
                        </button>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(user)}
                            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Modifier"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(user.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Créer/Éditer utilisateur */}
        {openModal && (
          <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
              {/* En-tête du modal */}
              <div className="flex items-center justify-between p-6 border-b border-slate-200">
                <h3 className="text-xl font-bold text-slate-800">
                  {editMode ? "Modifier l'utilisateur" : "Nouvel utilisateur"}
                </h3>
                <button
                  onClick={() => setOpenModal(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              {/* Corps du modal */}
              <div className="p-6">
                <div className="space-y-5">
                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                      <input
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        required
                        className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                        placeholder="utilisateur@exemple.com"
                      />
                    </div>
                  </div>

                  {/* Nom complet */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Nom complet
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                      <input
                        type="text"
                        name="fullname"
                        value={form.fullname}
                        onChange={handleChange}
                        required
                        className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                        placeholder="Jean Dupont"
                      />
                    </div>
                  </div>

                  {/* Mot de passe */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Mot de passe{" "}
                      {editMode && (
                        <span className="text-slate-500 text-xs">
                          (laisser vide pour ne pas changer)
                        </span>
                      )}
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                      <input
                        type="password"
                        name="password"
                        value={form.password}
                        onChange={handleChange}
                        required={!editMode}
                        className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>

                  {/* Rôle */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Rôle
                    </label>
                    <div className="relative">
                      <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                      <select
                        name="role"
                        value={form.role}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all appearance-none bg-white cursor-pointer"
                      >
                        <option value="user">Utilisateur</option>
                        <option value="admin">Administrateur</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Boutons d'action */}
                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setOpenModal(false)}
                    className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "En cours..." : editMode ? "Modifier" : "Créer"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de confirmation de suppression */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-red-100 rounded-full">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-800">
                  Confirmer la suppression
                </h3>
              </div>
              <p className="text-slate-600 mb-6">
                Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette
                action est irréversible.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
                >
                  Annuler
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirm)}
                  className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
