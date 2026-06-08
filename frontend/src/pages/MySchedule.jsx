import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

export default function MySchedule() {
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [filterBranch, setFilterBranch] = useState("");
  const [branches, setBranches] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
    fetchBranches();
  }, []);

  useEffect(() => {
    fetchMyLessons();
  }, [filterDate, filterBranch]);

  const fetchBranches = async () => {
    try {
      const response = await api.get("api/v1/core/branches/");
      setBranches(response.data.results || response.data);
    } catch (err) {
      console.error("Помилка завантаження філій", err);
    }
  };

  const fetchMyLessons = async () => {
    try {
      setLoading(true);
      setError("");
      
      const params = new URLSearchParams();
      if (filterDate) params.append("date", filterDate);
      if (filterBranch) params.append("branch", filterBranch);

      // Бекенд вже фільтрує уроки за токеном вчителя
      const response = await api.get(`api/v1/schedule/lessons/?${params.toString()}`);
      setLessons(response.data.results || response.data);
    } catch (err) {
      setError("Помилка завантаження розкладу. Перевірте з'єднання.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'SCHEDULED': return <span className="bg-blue-100 text-blue-700 px-2.5 py-1 rounded-lg text-xs font-bold">Заплановано</span>;
      case 'COMPLETED': return <span className="bg-green-100 text-green-700 px-2.5 py-1 rounded-lg text-xs font-bold">Проведено</span>;
      case 'CANCELLED': return <span className="bg-red-100 text-red-700 px-2.5 py-1 rounded-lg text-xs font-bold">Скасовано</span>;
      default: return <span className="bg-gray-100 text-gray-700 px-2.5 py-1 rounded-lg text-xs font-bold">{status}</span>;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Панель фільтрів (БЕЗ кнопки створення) */}
      <div className="bg-white p-6 rounded-[30px] shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center">
        <input 
          type="date" 
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          className="w-full md:w-auto px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-brand-light focus:border-brand-light focus:bg-white outline-none cursor-pointer text-gray-700"
        />
        <select 
          value={filterBranch} 
          onChange={(e) => setFilterBranch(e.target.value)} 
          className="w-full md:w-auto px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-brand-light focus:border-brand-light focus:bg-white outline-none cursor-pointer text-gray-700 min-w-[200px]"
        >
          <option value="">Всі філії</option>
          {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      </div>

      {error && <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm font-medium">{error}</div>}

      {/* Список уроків */}
      <div className="bg-white p-8 rounded-[30px] shadow-sm border border-gray-100">
        <h2 className="text-2xl font-bold text-brand-dark mb-6">Мій розклад на {filterDate || 'всі дати'}</h2>
        
        {loading ? (
          <p className="text-center py-10 text-brand-dark font-bold text-xl">Завантаження розкладу...</p>
        ) : lessons.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 rounded-[20px] border border-dashed border-gray-300">
            <p className="text-gray-500 font-medium text-lg">На цю дату уроків не знайдено.</p>
            <p className="text-gray-400 text-sm mt-2">Ви можете відпочити або обрати іншу дату.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {lessons.map(lesson => {
              
              // Відображення учасників (серіалізатор віддає student_name та group_name)
              const participantDisplay = lesson.student 
                ? `👤 ${lesson.student_name}` 
                : lesson.group 
                  ? `👥 ${lesson.group_name}` 
                  : 'Учасників не призначено';

              return (
                <div key={lesson.id} className="flex flex-col md:flex-row items-center justify-between bg-slate-50 p-5 rounded-2xl border border-gray-100 hover:shadow-md transition-shadow gap-4">
                  
                  {/* Час */}
                  <div className="flex flex-col items-center justify-center bg-white border border-gray-200 rounded-xl px-4 py-2 min-w-[120px]">
                    <span className="text-lg font-black text-brand-dark">{lesson.start_time.substring(0,5)}</span>
                    <span className="text-xs text-gray-400 font-bold">до {lesson.end_time.substring(0,5)}</span>
                  </div>

                  {/* Інфо про урок */}
                  <div className="flex-1 w-full md:w-auto">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-lg font-bold text-gray-800">{lesson.subject_name}</h3>
                      {getStatusBadge(lesson.status)}
                    </div>
                    <p className="text-sm font-bold text-blue-600 mt-2">{participantDisplay}</p>
                  </div>

                  {/* Кнопка відвідуваності */}
                  <div className="w-full md:w-auto">
                    <button 
                      onClick={() => navigate(`/attendance/${lesson.id}`)} 
                      className="w-full cursor-pointer px-6 py-3 text-sm font-bold bg-brand-light/10 text-brand-light hover:bg-brand-light hover:text-white rounded-xl transition-colors"
                    >
                      {lesson.status === 'COMPLETED' ? 'Переглянути відвідуваність' : 'Відмітити присутність'}
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