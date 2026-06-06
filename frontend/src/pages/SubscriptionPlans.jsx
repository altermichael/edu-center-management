import { useState, useEffect, useRef } from "react";
import api from "../api";

export default function SubscriptionPlans() {
  const [plans, setPlans] = useState([]);
  const [branches, setBranches] = useState([]);
  const [allSubjects, setAllSubjects] = useState([]); // Усі предмети для перекладу ID -> Назва
  const [branchSubjects, setBranchSubjects] = useState([]); // Предмети тільки обраної філії (для форми)
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [filterBranch, setFilterBranch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState("");
  const [branchId, setBranchId] = useState("");
  const [type, setType] = useState("INDIVIDUAL");
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  
  // динамічна сітка цін
  const [pricingGrid, setPricingGrid] = useState([
    { lessons_per_month: 1, price_per_lesson: "" }
  ]);

  const formRef = useRef(null);

  useEffect(() => {
    fetchBranches();
    fetchAllSubjects(); // Завантажуємо всі предмети одразу
  }, []);

  useEffect(() => {
    fetchPlans();
  }, [filterBranch, filterStatus]);

  useEffect(() => {
    if (branchId) {
      // Фільтруємо предмети локально, якщо вони вже завантажені
      const filtered = allSubjects.filter(sub => sub.branch === parseInt(branchId) && sub.status === 'ACTIVE');
      setBranchSubjects(filtered);
      
      // Якщо це не редагування (тобто ми просто змінили філію), очищаємо вибрані предмети
      if (!editingId) {
         setSelectedSubjects([]);
      }
    } else {
      setBranchSubjects([]);
      setSelectedSubjects([]);
    }
  }, [branchId, allSubjects, editingId]);

  const fetchBranches = async () => {
    try {
      const response = await api.get("api/v1/core/branches/");
      setBranches(response.data.results || response.data);
    } catch (err) {
      console.error("Помилка завантаження філій");
    }
  };

  const fetchAllSubjects = async () => {
    try {
      // Завантажуємо без фільтрів (або можна додати пагінацію, якщо їх дуже багато)
      const response = await api.get("api/v1/core/subjects/");
      setAllSubjects(response.data.results || response.data);
    } catch (err) {
      console.error("Помилка завантаження всіх предметів");
    }
  };

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterBranch) params.append("branch", filterBranch);
      if (filterStatus) params.append("status", filterStatus);

      const response = await api.get(`api/v1/subscriptions/plans/?${params.toString()}`);
      setPlans(response.data.results || response.data);
      setLoading(false);
    } catch (err) {
      setError("Помилка при завантаженні цінових планів");
      setLoading(false);
    }
  };

  const handleEditClick = (plan) => {
    setEditingId(plan.id);
    setName(plan.name || "");
    setBranchId(plan.branch || "");
    setType(plan.type || "INDIVIDUAL");
    setSelectedSubjects(plan.subjects || []);
    
    // це завантажує існуючу сітку цін або створює пусту
    if (plan.pricing_grid && plan.pricing_grid.length > 0) {
      setPricingGrid(plan.pricing_grid);
    } else {
      setPricingGrid([{ lessons_per_month: 1, price_per_lesson: "" }]);
    }

    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setName("");
    setBranchId("");
    setType("INDIVIDUAL");
    setSelectedSubjects([]);
    setPricingGrid([{ lessons_per_month: 1, price_per_lesson: "" }]);
    setError("");
  };

  const handleToggleStatus = async (plan) => {
    try {
      const newStatus = plan.status === 'ACTIVE' ? 'ARCHIVED' : 'ACTIVE';
      await api.patch(`api/v1/subscriptions/plans/${plan.id}/`, { status: newStatus });
      setPlans(plans.map(p => p.id === plan.id ? { ...p, status: newStatus } : p));
    } catch (err) {
      setError("Не вдалося змінити статус");
    }
  };

  const handleSubjectToggle = (subjectId) => {
    if (selectedSubjects.includes(subjectId)) {
      setSelectedSubjects(selectedSubjects.filter(id => id !== subjectId));
    } else {
      setSelectedSubjects([...selectedSubjects, subjectId]);
    }
  };

  // динамічна сітка (ворк з нею)
  const handleAddPricingRow = () => {
    setPricingGrid([...pricingGrid, { lessons_per_month: 1, price_per_lesson: "" }]);
  };

  const handleRemovePricingRow = (indexToRemove) => {
    setPricingGrid(pricingGrid.filter((_, index) => index !== indexToRemove));
  };

  const handlePricingChange = (index, field, value) => {
    const updatedGrid = [...pricingGrid];
    updatedGrid[index][field] = value;
    setPricingGrid(updatedGrid);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!branchId) {
      setError("Будь ласка, оберіть філію.");
      return;
    }
    if (selectedSubjects.length === 0) {
      setError("Оберіть хоча б один предмет.");
      return;
    }
    if (pricingGrid.length === 0 || pricingGrid.some(row => !row.price_per_lesson)) {
      setError("Заповніть ціни для всіх рядків сітки.");
      return;
    }

    try {
      const payload = {
        name,
        branch: branchId,
        type,
        subjects: selectedSubjects,
        pricing_grid: pricingGrid
      };

      if (editingId) {
        const response = await api.put(`api/v1/subscriptions/plans/${editingId}/`, payload);
        setPlans(plans.map(p => p.id === editingId ? response.data : p));
      } else {
        payload.status = "ACTIVE";
        const response = await api.post("api/v1/subscriptions/plans/", payload);
        setPlans([...plans, response.data]);
      }
      
      handleCancelEdit();
    } catch (err) {
      console.error(err.response?.data);
      setError("Помилка при збереженні. Перевірте правильність даних.");
    }
  };

  return (
    <div className="space-y-6" ref={formRef}>
      
      <div className="bg-white p-8 rounded-[30px] shadow-sm border border-gray-100">
        <h2 className="text-2xl text-brand-dark font-bold mb-6">
          {editingId ? <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-[13px]">Редагування плану</span> : "Створення цінового плану"}
        </h2>
        
        {error && <div className="bg-red-50 text-red-600 p-4 rounded-2xl mb-6 text-sm font-medium">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm text-brand-dark font-semibold mb-2">Назва плану *</label>
              <input type="text" required value={name} onChange={e => setName(e.target.value)} 
              className="base-input" 
              placeholder="Нап.: Базовий ІТ" />
            </div>
            
            <div>
              <label className="block text-sm text-brand-dark font-semibold mb-2">Філія *</label>
              <select required value={branchId} onChange={(e) => setBranchId(e.target.value)} disabled={editingId !== null} 
                className="base-input cursor-pointer">
                <option value="" className="text-gray-500">Оберіть філію</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm text-brand-dark font-semibold mb-2">Тип заняття *</label>
              <select required value={type} onChange={(e) => setType(e.target.value)} 
                className="base-input cursor-pointer">
                <option value="INDIVIDUAL">Індивідуальне</option>
                <option value="GROUP">Групове</option>
              </select>
            </div>
          </div>

          <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200">
            <h3 className="text-sm font-semibold text-brand-dark mb-3">Предмети, на які діє план *</h3>
            {!branchId ? (
              <p className="text-sm text-gray-500">Спершу оберіть філію.</p>
            ) : branchSubjects.length === 0 ? (
              <p className="text-sm text-gray-500">У цій філії немає активних предметів.</p>
            ) : (
              <div className="flex flex-wrap gap-3">
                {branchSubjects.map(subject => (
                  <label key={subject.id} className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-gray-200 cursor-pointer hover:bg-brand-light/5">
                    <input type="checkbox" className="w-4 h-4 text-brand-light rounded focus:ring-brand-light cursor-pointer"
                      checked={selectedSubjects.includes(subject.id)}
                      onChange={() => handleSubjectToggle(subject.id)} />
                    <span className="text-sm font-medium text-gray-700">{subject.name}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* СІТКА ЦІН */}
          <div className="bg-white border border-gray-200 p-6 rounded-2xl">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-sm font-semibold text-brand-dark">Сітка цін *</h3>
                <p className="text-xs text-gray-500 mt-1">Чим більше занять, тим нижча ціна за один урок.</p>
              </div>
              <button type="button" onClick={handleAddPricingRow} className="text-sm cursor-pointer bg-brand-light/10 text-brand-light font-bold px-4 py-2 rounded-xl hover:bg-brand-light/20 transition-colors">
                + Додати ціну
              </button>
            </div>
            
            <div className="space-y-3">
              {pricingGrid.map((row, index) => (
                <div key={index} className="flex items-center gap-4 bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <div className="flex-1 flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-600">Занять на місяць:</span>
                    <input type="number" min="1" required value={row.lessons_per_month} 
                      onChange={(e) => handlePricingChange(index, 'lessons_per_month', e.target.value)}
                      className="w-20 px-3 py-2 bg-white border border-gray-200 rounded-lg outline-none text-center focus:ring-2 focus:ring-brand-light focus:border-brand-light" />
                  </div>
                  <div className="flex-1 flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-600">Ціна за 1 урок (грн):</span>
                    <input type="number" step="0.01" min="0" required value={row.price_per_lesson} 
                      onChange={(e) => handlePricingChange(index, 'price_per_lesson', e.target.value)}
                      className="w-28 px-3 py-2 bg-white border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-brand-light focus:border-brand-light" placeholder="хх.хх" />
                  </div>
                  <div className="w-32 text-right">
                    <span className="text-xs text-gray-400 block">Загальна вартість:</span>
                    <span className="font-bold text-brand-dark">
                      {(row.lessons_per_month * (row.price_per_lesson || 0)).toFixed(2)} грн
                    </span>
                  </div>
                  {pricingGrid.length > 1 && (
                    <button type="button" onClick={() => handleRemovePricingRow(index)} className="text-red-400 cursor-pointer hover:text-red-600 p-2" title="Видалити рядок">
                      ❌
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            {editingId && <button type="button" onClick={handleCancelEdit} className="bg-gray-100 text-gray-600 font-bold py-3.5 px-6 rounded-2xl hover:bg-gray-200 cursor-pointer">Скасувати</button>}
            <button type="submit" className="bg-brand-light text-white font-bold py-3.5 px-8 rounded-2xl hover:bg-brand-dark shadow-brand-light/30 shadow-sm cursor-pointer">
              {editingId ? "Зберегти зміни" : "Створити план"}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white p-6 rounded-[30px] shadow-sm border border-gray-100 flex gap-4 items-center">
        <select value={filterBranch} onChange={(e) => setFilterBranch(e.target.value)} className="base-input cursor-pointer min-w-[200px]">
          <option value="">Всі філії</option>
          {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="base-input cursor-pointer min-w-[160px]">
          <option value="">Всі статуси</option>
          <option value="ACTIVE">Активні</option>
          <option value="ARCHIVED">Архівні</option>
        </select>
      </div>

      <div className="bg-white p-8 rounded-[30px] shadow-sm border border-gray-100">
        <h2 className="text-2xl font-bold text-brand-dark mb-6">Список цінових планів</h2>
        
        {loading ? (
          <p className="text-gray-500">Завантаження...</p>
        ) : plans.length === 0 ? (
          <div className="text-center py-10 bg-gray-50 rounded-[20px] border border-dashed border-gray-300">
            <p className="text-gray-500 font-medium">Жодного плану ще не створено.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {plans.map((plan) => {
              const branchName = branches.find(b => b.id === plan.branch)?.name || `Філія #${plan.branch}`;
              return (
                <div key={plan.id} className="bg-slate-50 p-6 rounded-3xl border border-gray-100 relative hover:shadow-md transition-shadow">
                  <button onClick={() => handleToggleStatus(plan)} type="button" className={`absolute top-6 right-6 px-3 py-1 rounded-full text-xs font-bold cursor-pointer ${plan.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                    {plan.status === 'ACTIVE' ? 'Активний' : 'Архівований'}
                  </button>
                  
                  <h3 className="text-xl font-bold text-brand-dark mb-1 pr-20 truncate">{plan.name}</h3>
                  <p className="text-sm text-gray-500 mb-4">{branchName} - {plan.type === 'INDIVIDUAL' ? 'Індивідуальний' : 'Груповий'}</p>
                  
                  <div className="mb-5 flex items-start gap-2">
                    <span className="font-semibold text-sm text-brand-dark">Предмети:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {plan.subjects?.length > 0 ? (
                        plan.subjects.map(subId => {
                          const subjectName = allSubjects.find(s => s.id === subId)?.name || `Предмет #${subId}`;
                          return (
                            <span 
                              key={subId} 
                              className="bg-brand-light/10 text-brand-dark px-2.5 py-0.5 rounded-lg text-xs font-semibold border border-brand-light/20"
                            >
                              {subjectName}
                            </span>
                          );
                        })
                      ) : (
                        <span className="bg-red-50 text-red-500 px-2.5 py-0.5 rounded-lg text-xs font-semibold border border-red-200">
                          Без предметів
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-gray-50 text-gray-500">
                        <tr>
                          <th className="px-3 py-2 font-medium">Уроків</th>
                          <th className="px-3 py-2 font-medium text-right">Ціна</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {plan.pricing_grid?.map(row => (
                          <tr key={row.id}>
                            <td className="px-3 py-2 font-semibold text-gray-700">{row.lessons_per_month}</td>
                            <td className="px-3 py-2 text-right font-semibold text-brand-dark">{row.price_per_lesson}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  <div className="mt-5 pt-4 border-t border-gray-200 flex justify-end">
                    <button onClick={() => handleEditClick(plan)} className="text-brand-light font-semibold hover:text-brand-dark text-sm cursor-pointer">Редагувати</button>
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