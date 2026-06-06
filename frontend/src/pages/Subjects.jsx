import { useState, useEffect, useRef } from "react";
import api from "../api";

export default function Subjects() {
  const [subjects, setSubjects] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [filterBranch, setFilterBranch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState("");
  const [branchId, setBranchId] = useState("");

  const formRef = useRef(null);

  useEffect(() => {
    fetchBranches();
  }, []);

  useEffect(() => {
    fetchSubjects();
  }, [searchQuery, filterBranch, filterStatus]);

  const fetchBranches = async () => {
    try {
      const response = await api.get("api/v1/core/branches/");
      setBranches(response.data.results || response.data);
    } catch (err) {
      console.error("Помилка завантаження філій");
    }
  };

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchQuery) params.append("search", searchQuery);
      if (filterBranch) params.append("branch", filterBranch);
      if (filterStatus) params.append("status", filterStatus);

      const response = await api.get(`api/v1/core/subjects/?${params.toString()}`);
      setSubjects(response.data.results || response.data);
      setLoading(false);
    } catch (err) {
      setError("Помилка при завантаженні предметів");
      setLoading(false);
    }
  };

  const handleEditClick = (subject) => {
    setEditingId(subject.id);
    setName(subject.name || "");
    setBranchId(subject.branch || "");

    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setName("");
    setBranchId("");
    setError("");
  };

  const handleToggleStatus = async (subject) => {
    try {
      const newStatus = subject.status === 'ACTIVE' ? 'ARCHIVED' : 'ACTIVE';
      await api.patch(`api/v1/core/subjects/${subject.id}/`, { status: newStatus });
      setSubjects(subjects.map(s => 
        s.id === subject.id ? { ...s, status: newStatus } : s
      ));
    } catch (err) {
      setError("Не вдалося змінити статус");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!branchId) {
      setError("Будь ласка, оберіть філію.");
      return;
    }

    try {
      const payload = {
        name,
        branch: branchId
      };

      if (editingId) {
        const response = await api.patch(`api/v1/core/subjects/${editingId}/`, payload);
        setSubjects(subjects.map(s => s.id === editingId ? response.data : s));
      } else {
        payload.status = "ACTIVE";
        const response = await api.post("api/v1/core/subjects/", payload);
        setSubjects([...subjects, response.data]);
      }
      
      handleCancelEdit();
    } catch (err) {
      // unique_together
      const backendError = err.response?.data;
      if (backendError && backendError.non_field_errors) {
        setError(`Предмет з назвою "${name}" вже існує у вибраній філії!`);
      } else {
        setError("Помилка при збереженні. Перевірте правильність даних.");
      }
    }
  };

  return (
    <div className="space-y-6" ref={formRef}>
      
      <div className="bg-white p-8 rounded-[30px] shadow-sm">
        <h2 className="text-2xl text-brand-dark font-bold mb-6">
          {editingId ? <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-[13px]">Редагування предмета</span> : "Створення предмета"}
        </h2>
        
        {error && <div className="bg-red-50 text-red-600 p-4 rounded-2xl mb-6 text-sm font-medium">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm text-brand-dark font-semibold mb-2">Назва предмета *</label>
              <input type="text" required value={name} 
              onChange={e => setName(e.target.value)} 
              className="base-input" 
              placeholder="Нап.: Математика" />
            </div>
            
            <div>
              <label className="block text-sm text-brand-dark font-semibold mb-2">Філія *</label>
              <select required value={branchId} onChange={(e) => setBranchId(e.target.value)} disabled={editingId !== null} className={`base-input ${editingId ? 'bg-gray-100 cursor-not-allowed text-gray-500' : ''}`}>
                <option value="" className="text-gray-500">Оберіть філію</option>
                {branches.map(b => (
                  <option key={b.id} value={b.id} className="text-gray-700 py-1">{b.name}</option>
                ))}
              </select>
              {editingId && <p className="text-xs text-gray-400 mt-1">Філію не можна змінити після створення</p>}
            </div>
          </div>

          <div className="flex justify-end gap-3">
            {editingId && <button type="button" onClick={handleCancelEdit} className="bg-gray-100 text-gray-600 font-bold py-3.5 px-6 rounded-2xl hover:bg-gray-200 cursor-pointer transition-colors">Скасувати</button>}
            <button type="submit" className="bg-brand-light text-white font-bold py-3.5 px-8 rounded-2xl hover:bg-brand-dark transition-colors shadow-sm shadow-brand-light/30 cursor-pointer">
              {editingId ? "Зберегти зміни" : "Створити предмет"}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white p-6 rounded-[30px] shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <input 
          type="text" 
          placeholder="Пошук предметів:" 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 base-input"
        />
        <select value={filterBranch} onChange={(e) => setFilterBranch(e.target.value)} className="px-5 py-3 focus:bg-white bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-brand-light focus:border-brand-light outline-none min-w-[160px] cursor-pointer text-gray-700 transition-all duration-200 hover:border-brand-light/50">
          <option value="" className="text-gray-500">Всі філії</option>
          {branches.map(b => <option key={b.id} value={b.id} className="text-gray-700 py-1">{b.name}</option>)}
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-5 py-3 focus:bg-white bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-brand-light focus:border-brand-light outline-none min-w-[160px] cursor-pointer text-gray-700 transition-all duration-200 hover:border-brand-light/50">
          <option value="" className="text-gray-500">Всі статуси</option>
          <option value="ACTIVE" className="text-gray-700 py-1">Активні</option>
          <option value="ARCHIVED" className="text-gray-700 py-1">Архівований</option>
        </select>
      </div>

      <div className="bg-white p-8 rounded-[30px] shadow-sm">
        <h2 className="text-2xl font-bold text-brand-dark mb-6">Список предметів</h2>
        
        {loading ? (
          <p className="text-gray-500">Завантаження...</p>
        ) : subjects.length === 0 ? (
          <div className="text-center py-10 bg-gray-50 rounded-[20px] border border-dashed border-gray-300">
            <p className="text-gray-500 font-medium">Жодного предмета ще не знайдено.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {subjects.map((subject) => {
              const branchName = branches.find(b => b.id === subject.branch)?.name || `Філія #${subject.branch}`;
              return (
                <div key={subject.id} className="bg-slate-50 p-6 rounded-3xl border border-gray-100 hover:shadow-md transition-shadow duration-300 relative">
                  <button 
                    onClick={() => handleToggleStatus(subject)}
                    type="button"
                    title="Натисніть, щоб змінити статус"
                    className={`absolute top-6 right-6 px-3 py-1 rounded-full text-xs font-bold cursor-pointer transition-colors duration-300 ${
                      subject.status === 'ACTIVE' 
                        ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                        : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                    }`}
                  >
                    {subject.status === 'ACTIVE' ? 'Активний' : 'Архівний'}
                  </button>
                  
                  <h3 className="text-xl font-bold text-brand-dark mb-2 pr-20 truncate">{subject.name}</h3>
                  
                  <div className="space-y-1 text-sm text-gray-600">
                    <p className="truncate"><span className="font-semibold text-gray-800">Філія:</span> {branchName}</p>
                  </div>
                  
                  <div className="mt-6 pt-4 border-t border-gray-200 flex justify-end">
                    <button 
                      onClick={() => handleEditClick(subject)} 
                      className="text-brand-light font-semibold hover:text-brand-dark transition-colors text-sm cursor-pointer"
                    >
                      Редагувати
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}