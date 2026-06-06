import { useState, useEffect, useRef } from "react";
import api from "../api";

export default function Teachers() {
  const [teachers, setTeachers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [selectedBranches, setSelectedBranches] = useState([]);
  
  const [editingId, setEditingId] = useState(null);
  const formRef = useRef(null);

  useEffect(() => {
    fetchData();
  }, []);

  // Завантажуємо і вчителів, і філії одночасно
  const fetchData = async () => {
    try {
      const [teachersRes, branchesRes] = await Promise.all([
        api.get("api/v1/users/?role=teacher"),
        api.get("api/v1/core/branches/")
      ]);
      
      setTeachers(teachersRes.data.results || teachersRes.data);
      setBranches(branchesRes.data.results || branchesRes.data);
      setLoading(false);
    } catch (err) {
      setError("Помилка при завантаженні даних");
      setLoading(false);
    }
  };

  const handleEditClick = (teacher) => {
    setEditingId(teacher.id);
    setFirstName(teacher.first_name || "");
    setLastName(teacher.last_name || "");
    setPhone(teacher.phone || "");
    setPassword("");
    setSelectedBranches(teacher.branches || []); 
    
    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFirstName("");
    setLastName("");
    setPhone("");
    setPassword("");
    setSelectedBranches([]);
    setError("");
  };

  const handleBranchToggle = (branchId) => {
    if (selectedBranches.includes(branchId)) {
      setSelectedBranches(selectedBranches.filter(id => id !== branchId));
    } else {
      setSelectedBranches([...selectedBranches, branchId]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const payload = {
        first_name: firstName,
        last_name: lastName,
        phone,
        role: "teacher",
        branches: selectedBranches
      };

      if (password) {
        payload.password = password;
      }

      if (editingId) {
        const response = await api.patch(`api/v1/users/${editingId}/`, payload);
        setTeachers(teachers.map(t => t.id === editingId ? response.data : t));
      } else {
        const response = await api.post("api/v1/users/", payload);
        setTeachers([...teachers, response.data]);
      }
      
      handleCancelEdit();
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.phone?.[0] || "Помилка при збереженні. Перевірте дані.");
    }
  };

  return (
    <div className="space-y-6" ref={formRef}>
      {/* Форма Створення / Редагування */}
      <div className="bg-white p-8 rounded-[30px] shadow-sm transition-all duration-300">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">
            {editingId ? (
              <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-[13px] font-bold">Редагування вчителя</span>
            ) : (
              <span className="text-brand-dark">Додати нового вчителя</span>
            )}
          </h2>
        </div>
        
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-2xl mb-6 text-sm font-medium border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <label className="block text-sm font-semibold text-brand-dark mb-2">Ім'я *</label>
            <input
              type="text"
              required
              maxLength={50}
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="base-input"
              placeholder="Нап.: Іван"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-brand-dark mb-2">Прізвище *</label>
            <input
              type="text"
              required
              maxLength={50}
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="base-input"
              placeholder="Нап.: Шевченко"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-brand-dark mb-2">Телефон *</label>
            <input
              type="text"
              required
              maxLength={20}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="base-input"
              placeholder="+380ххххххххх"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-brand-dark mb-2">
              {editingId ? "Новий пароль" : "Пароль *"}
            </label>
            <input
              type="password"
              required={!editingId}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="base-input"
              placeholder={editingId ? "Залиште порожнім" : "xxxxxxx"}
            />
          </div>

          {/* Блок вибору філій */}
          <div className="lg:col-span-4 bg-gray-50 p-5 rounded-2xl border border-gray-200 mt-2">
            <label className="block text-sm font-semibold text-brand-dark mb-3">
              Прив'язати до філій
            </label>
            {branches.filter(branch => branch.status === 'ACTIVE' || selectedBranches.includes(branch.id)).length === 0 ? (
              <p className="text-sm text-gray-500">Спершу створіть філії в розділі "Філії".</p>
            ) : (
              <div className="flex flex-wrap gap-3">
                {branches
                  .filter(branch => branch.status === 'ACTIVE' || selectedBranches.includes(branch.id))
                  
                  .map(branch => (
                  <label key={branch.id} className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-gray-200 cursor-pointer hover:bg-brand-light/5 transition-colors">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 text-brand-light rounded focus:ring-brand-light cursor-pointer"
                      checked={selectedBranches.includes(branch.id)}
                      onChange={() => handleBranchToggle(branch.id)}
                    />
                    <span className="text-sm font-medium text-gray-700">
                      {branch.name} {branch.status !== 'ACTIVE' && <span className="text-xs text-red-500">(Архів)</span>}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>
          
          <div className="lg:col-span-4 flex justify-end gap-3 mt-2">
            {editingId && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="bg-gray-100 text-gray-600 font-bold py-3.5 px-6 rounded-2xl hover:bg-gray-200 transition-colors cursor-pointer"
              >
                Скасувати
              </button>
            )}
            <button
              type="submit"
              className="bg-brand-light text-white font-bold py-3.5 px-8 rounded-2xl hover:bg-brand-dark transition-colors shadow-sm shadow-brand-light/30 cursor-pointer"
            >
              {editingId ? "Зберегти зміни" : "Створити акаунт"}
            </button>
          </div>
        </form>
      </div>

      {/* Список вчителів */}
      <div className="bg-white p-8 rounded-[30px] shadow-sm">
        <h2 className="text-2xl font-bold text-brand-dark mb-6">Список вчителів</h2>
        
        {loading ? (
          <p className="text-gray-500">Завантаження...</p>
        ) : teachers.length === 0 ? (
          <div className="text-center py-10 bg-gray-50 rounded-[20px] border border-dashed border-gray-300">
            <p className="text-gray-500 font-medium">Жодного вчителя ще не додано.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teachers.map((teacher) => (
              <div key={teacher.id} className="bg-slate-50 p-6 rounded-3xl border border-gray-100 hover:shadow-md transition-shadow relative">

                
                <h3 className="text-xl font-bold text-brand-dark mb-1 truncate">
                  {teacher.first_name} {teacher.last_name}
                </h3>
                
                <div className="text-sm text-gray-600 space-y-2 mt-3">
                  <p className="flex items-center gap-2">
                    <span className="font-semibold">Номер:</span> {teacher.phone}
                  </p>
                  <div className="flex items-start gap-2">
                    <span className="font-semibold ">Фалії:</span> 
                      <div className="flex flex-wrap gap-1.5">
                        {teacher.branches?.length > 0 ? (
                          teacher.branches.map(branchId => {
                        
                            const branchObj = branches.find(b => b.id === branchId);
                            return (
                              <span 
                                key={branchId} 
                                className="bg-brand-light/10 text-brand-dark px-2.5 py-0.5 rounded-lg text-xs font-semibold border border-brand-light/20"
                              >
                                {branchObj ? branchObj.name : `Філія #${branchId}`}
                              </span>
                            );
                          })
                        ) : (
                          <span className="g-brand-light/10 text-red-400 px-2.5 py-0.5 rounded-lg text-xs font-semibold border border-red/20">Без філії</span>
                        )}
                      </div>
                  </div>
                </div>
                
                <div className="mt-6 pt-4 border-t border-gray-200 flex justify-end">
                  <button 
                    onClick={() => handleEditClick(teacher)}
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