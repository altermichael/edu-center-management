import { useState, useEffect, useRef } from "react";
import api from "../api";

export default function Branches() {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  
  const [editingId, setEditingId] = useState(null);

  // Реф для форми
  const formRef = useRef(null);

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    try {
      const response = await api.get("api/v1/core/branches/");
      setBranches(response.data.results || response.data);
      setLoading(false);
    } catch (err) {
      setError("Помилка при завантаженні філій");
      setLoading(false);
    }
  };

  // Коли натискаємо Редагувати
  const handleEditClick = (branch) => {
    setEditingId(branch.id);
    setName(branch.name);
    setCity(branch.city || "");
    setAddress(branch.address || "");
    
    // Скролимо до форми
    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Скасування редагування
  const handleCancelEdit = () => {
    setEditingId(null);
    setName("");
    setCity("");
    setAddress("");
    setError("");
  };

  // Активна/Архівна
  const handleToggleStatus = async (branch) => {
    try {
      const newStatus = branch.status === 'ACTIVE' ? 'ARCHIVED' : 'ACTIVE'; 
      
      await api.patch(`api/v1/core/branches/${branch.id}/`, {
        status: newStatus
      });
      
      setBranches(branches.map(b => 
        b.id === branch.id ? { ...b, status: newStatus } : b
      ));
    } catch (err) {
      setError("Не вдалося змінити статус філії. Спробуйте ще раз.");
    }
  };

  // Створення та Оновлення
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      if (editingId) {
        // РЕДАГУВАННЯ
        const response = await api.patch(`api/v1/core/branches/${editingId}/`, {
          name,
          city,
          address,
        });
        
        // Оновлюємо філію
        setBranches(branches.map(b => b.id === editingId ? response.data : b));
      } else {
        // СТВОРЕННЯ
        const response = await api.post("api/v1/core/branches/", {
          name,
          city,
          address,
          status: 'ACTIVE',
        });
        
        // Додаємо нову філію
        setBranches([...branches, response.data]);
      }
      
      handleCancelEdit();
    } catch (err) {
      setError(err.response?.data?.detail || "Помилка при збереженні. Перевірте дані.");
    }
  };

  return (
    <div className="space-y-6" ref={formRef}>
      {/* Створення / Редагування */}
      <div className="bg-white p-8 rounded-[30px] shadow-sm transition-all duration-300">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">
            {editingId ? (
              <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-[13px] font-bold">Редагування філії</span>
            ) : (
              <span className="text-brand-dark">Додати нову філію</span>
            )}
          </h2>
        </div>
        
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-2xl mb-6 text-sm font-medium border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-semibold text-brand-dark mb-2">Назва філії *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-brand-light focus:border-brand-light focus:bg-white outline-none transition-all duration-200 text-gray-700"
              placeholder="Нап.: Центральна"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-brand-dark mb-2">Місто</label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-brand-light focus:border-brand-light focus:bg-white outline-none transition-all duration-200 text-gray-700"
              placeholder="Нап.: Одеса"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-brand-dark mb-2">Адреса</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-brand-light focus:border-brand-light focus:bg-white outline-none transition-all duration-200 text-gray-700"
              placeholder="Нап.: вул. Преображенська, 3"
            />
          </div>
          <div className="md:col-span-3 flex justify-end gap-3">
            {editingId && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="bg-gray-100 text-gray-600 font-bold py-3.5 px-6 rounded-2xl hover:bg-gray-200 transition-colors duration-300 cursor-pointer"
              >
                Скасувати
              </button>
            )}
            <button
              type="submit"
              className="bg-brand-light text-white font-bold py-3.5 px-8 rounded-2xl hover:bg-brand-dark transition-colors duration-300 shadow-sm shadow-brand-light/30 cursor-pointer"
            >
              {editingId ? "Зберегти зміни" : "Створити філію"}
            </button>
          </div>
        </form>
      </div>

      {/* Список філій */}
      <div className="bg-white p-8 rounded-[30px] shadow-sm">
        <h2 className="text-2xl font-bold text-brand-dark mb-6">Список філій</h2>
        
        {loading ? (
          <p className="text-gray-500">Завантаження...</p>
        ) : branches.length === 0 ? (
          <div className="text-center py-10 bg-gray-50 rounded-[20px] border border-dashed border-gray-300">
            <p className="text-gray-500 font-medium">Жодної філії ще не створено.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {branches.map((branch) => (
              <div key={branch.id} className="bg-slate-50 p-6 rounded-3xl border border-gray-100 hover:shadow-md transition-shadow duration-300 relative">
              <button 
                onClick={() => handleToggleStatus(branch)}
                type="button"
                title="Натисніть, щоб змінити статус"
                className={`absolute top-6 right-6 px-3 py-1 rounded-full text-xs font-bold cursor-pointer transition-colors duration-300 ${
                  branch.status === 'ACTIVE'
                    ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                  }`}
                  >
                {branch.status === 'ACTIVE' ? 'Активна' : 'Архівована'}
              </button>
                
                <h3 className="text-xl font-bold text-brand-dark mb-2 pr-20 truncate">{branch.name}</h3>
                
                <div className="space-y-1 text-sm text-gray-600">
                  <p className="truncate"><span className="font-semibold">Місто:</span> {branch.city || '—'}</p>
                  <p className="truncate"><span className="font-semibold">Адреса:</span> {branch.address || '—'}</p>
                </div>
                
                <div className="mt-6 pt-4 border-t border-gray-200 flex justify-end">
                  <button 
                    onClick={() => handleEditClick(branch)}
                    className="text-brand-light font-semibold hover:text-brand-dark transition-colors text-sm cursor-pointer"
                  >
                    Редагувати
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}