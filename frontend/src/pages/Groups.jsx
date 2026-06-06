import { useState, useEffect, useRef } from "react";
import api from "../api";

export default function Groups() {
  const [groups, setGroups] = useState([]);
  const [branches, setBranches] = useState([]);
  const [branchStudents, setBranchStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [filterBranch, setFilterBranch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState("");
  const [branchId, setBranchId] = useState("");
  const [selectedStudents, setSelectedStudents] = useState([]);

  const formRef = useRef(null);

  useEffect(() => {
    fetchBranches();
  }, []);

  useEffect(() => {
    fetchGroups();
  }, [searchQuery, filterBranch, filterStatus]);

  useEffect(() => {
    if (branchId) {
      fetchStudentsForBranch(branchId);
    } else {
      setBranchStudents([]);
    }
  }, [branchId]);

  const fetchBranches = async () => {
    try {
      const response = await api.get("api/v1/core/branches/");
      setBranches(response.data.results || response.data);
    } catch (err) {
      setError("Помилка завантаження філій");
    }
  };

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchQuery) params.append("search", searchQuery);
      if (filterBranch) params.append("branch", filterBranch);
      if (filterStatus) params.append("status", filterStatus);

      const response = await api.get(`api/v1/students/groups/?${params.toString()}`);
      setGroups(response.data.results || response.data);
      setLoading(false);
    } catch (err) {
      setError("Помилка при завантаженні груп");
      setLoading(false);
    }
  };

  const fetchStudentsForBranch = async (id) => {
    try {
      const response = await api.get(`api/v1/students/students/?branch=${id}`);
      setBranchStudents(response.data.results || response.data);
    } catch (err) {
      setError("Помилка завантаження студентів");
    }
  };

  const handleEditClick = (group) => {
    setEditingId(group.id);
    setName(group.name || "");
    setBranchId(group.branch || "");
    setSelectedStudents(group.students || []);

    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setName("");
    setBranchId("");
    setSelectedStudents([]);
    setError("");
  };

  const handleToggleStatus = async (group) => {
    try {
      const newStatus = group.status === 'ACTIVE' ? 'ARCHIVED' : 'ACTIVE';
      await api.patch(`api/v1/students/groups/${group.id}/`, { status: newStatus });
      setGroups(groups.map(g => 
        g.id === group.id ? { ...g, status: newStatus } : g
      ));
    } catch (err) {
      setError("Не вдалося змінити статус");
    }
  };

  const handleStudentToggle = (studentId) => {
    if (selectedStudents.includes(studentId)) {
      setSelectedStudents(selectedStudents.filter(id => id !== studentId));
    } else {
      setSelectedStudents([...selectedStudents, studentId]);
    }
  };

  const handleBranchChange = (e) => {
    const newBranchId = e.target.value;
    setBranchId(newBranchId);
    setSelectedStudents([]);
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
        branch: branchId,
        students: selectedStudents
      };

      if (editingId) {
        const response = await api.patch(`api/v1/students/groups/${editingId}/`, payload);
        setGroups(groups.map(g => g.id === editingId ? response.data : g));
      } else {
        payload.status = "ACTIVE";
        const response = await api.post("api/v1/students/groups/", payload);
        setGroups([...groups, response.data]);
      }
      
      handleCancelEdit();
    } catch (err) {
      setError("Помилка при збереженні. Перевірте правильність даних.");
    }
  };

  return (
    <div className="space-y-6" ref={formRef}>
      
      <div className="bg-white p-8 rounded-[30px] shadow-sm">
        <h2 className="text-2xl text-brand-dark font-bold mb-6">
          {editingId ? <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-[13px]">Редагування групи</span> : "Створення нової групи"}
        </h2>
        
        {error && <div className="bg-red-50 text-red-600 p-4 rounded-2xl mb-6 text-sm font-medium">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm text-brand-dark font-semibold mb-2">Назва групи *</label>
              <input type="text" required value={name} 
              onChange={e => setName(e.target.value)} 
              className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-brand-light focus:border-brand-light focus:bg-white outline-none transition-all duration-200 text-gray-700" 
              placeholder="Нап.: QA 22" />
            </div>
            
            <div>
              <label className="block text-sm text-brand-dark font-semibold mb-2">Філія *</label>
              <select required value={branchId} onChange={handleBranchChange} disabled={editingId !== null} className={`w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-brand-light focus:border-brand-light focus:bg-white outline-none transition-all duration-200 text-gray-700 cursor-pointer ${editingId ? 'bg-gray-100 cursor-not-allowed text-gray-500' : ''}`}>
                <option value="" className="text-gray-500">Оберіть філію</option>
                {branches.map(b => (
                  <option key={b.id} value={b.id} className="text-gray-700 py-1">{b.name}</option>
                ))}
              </select>
              {editingId && <p className="text-xs text-gray-400 mt-1">Філію не можна змінити після створення</p>}
            </div>
          </div>

          <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Студенти у групі</h3>
            {!branchId ? (
              <p className="text-sm text-gray-500">Спершу оберіть філію, щоб побачити доступних студентів.</p>
            ) : branchStudents.length === 0 ? (
              <p className="text-sm text-gray-500">У цій філії ще немає зареєстрованих студентів.</p>
            ) : (
              <div className="flex flex-wrap gap-3">
                {branchStudents
                  .filter(student => student.status === 'ACTIVE' || selectedStudents.includes(student.id))
                  .map(student => (
                  <label key={student.id} className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-gray-200 cursor-pointer hover:bg-brand-light/5 transition-colors">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 text-brand-light rounded focus:ring-brand-light cursor-pointer"
                      checked={selectedStudents.includes(student.id)}
                      onChange={() => handleStudentToggle(student.id)}
                    />
                    <span className="text-sm font-medium text-gray-700">
                      {student.first_name} {student.last_name}
                      {student.status !== 'ACTIVE' && <span className="text-xs text-red-500 ml-1">(Архів)</span>}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3">
            {editingId && <button type="button" onClick={handleCancelEdit} className="bg-gray-100 text-gray-600 font-bold py-3.5 px-6 rounded-2xl hover:bg-gray-200 cursor-pointer transition-colors">Скасувати</button>}
            <button type="submit" className="bg-brand-light text-white font-bold py-3.5 px-8 rounded-2xl hover:bg-brand-dark transition-colors shadow-sm shadow-brand-light/30 cursor-pointer">
              {editingId ? "Зберегти зміни" : "Створити групу"}
            </button>
          </div>
        </form>
      </div>

    {/* Пошук */}
      <div className="bg-white p-6 rounded-[30px] shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <input 
          type="text" 
          placeholder="Пошук груп:" 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="base-input"
        />
        <select value={filterBranch} onChange={(e) => setFilterBranch(e.target.value)} className="px-5 py-3 focus:bg-white bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-brand-light focus:border-brand-light outline-none min-w-[200px] cursor-pointer text-gray-700 transition-all duration-200 hover:border-brand-light/50">
          <option value="" className="text-gray-500">Всі філії</option>
          {branches.map(b => <option key={b.id} value={b.id} className="text-gray-700 py-1">{b.name}</option>)}
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-5 py-3 focus:bg-white bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-brand-light focus:border-brand-light outline-none min-w-[160px] cursor-pointer text-gray-700 transition-all duration-200 hover:border-brand-light/50">
          <option value="" className="text-gray-500">Всі статуси</option>
          <option value="ACTIVE" className="text-gray-700 py-1">Активні</option>
          <option value="ARCHIVED" className="text-gray-700 py-1">Архівні</option>
        </select>
      </div>

      <div className="bg-white p-8 rounded-[30px] shadow-sm">
        <h2 className="text-2xl font-bold text-brand-dark mb-6">Список груп</h2>
        
        {loading ? (
          <p className="text-gray-500">Завантаження...</p>
        ) : groups.length === 0 ? (
          <div className="text-center py-10 bg-gray-50 rounded-[20px] border border-dashed border-gray-300">
            <p className="text-gray-500 font-medium">Жодної групи ще не знайдено.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups.map((group) => {
              const branchName = branches.find(b => b.id === group.branch)?.name || `Філія #${group.branch}`;
              return (
                <div key={group.id} className="bg-slate-50 p-6 rounded-3xl border border-gray-100 hover:shadow-md transition-shadow duration-300 relative">
                  <button 
                    onClick={() => handleToggleStatus(group)}
                    type="button"
                    title="Натисніть, щоб змінити статус"
                    className={`absolute top-6 right-6 px-3 py-1 rounded-full text-xs font-bold cursor-pointer transition-colors duration-300 ${
                      group.status === 'ACTIVE' 
                        ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                        : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                    }`}
                  >
                    {group.status === 'ACTIVE' ? 'Активна' : 'Архівована'}
                  </button>
                  
                  <h3 className="text-xl font-bold text-brand-dark mb-3 pr-20 truncate">{group.name}</h3>
                  
                  <div className="space-y-1.5 text-sm text-gray-600">
                    <p className="truncate"><span className="font-semibold text-gray-800">Філія:</span> {branchName}</p>
                    <p className="truncate"><span className="font-semibold text-gray-800">Студентів у групі:</span> {group.students?.length || 0}</p>
                  </div>
                  
                  <div className="mt-6 pt-4 border-t border-gray-200 flex justify-end">
                    <button 
                      onClick={() => handleEditClick(group)} 
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