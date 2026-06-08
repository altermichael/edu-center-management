import { useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import { Link } from "react-router-dom";
import api from "../api";

export default function Dashboard() {
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(false);

  const [adminStats, setAdminStats] = useState(null);
  const [todayTotalLessons, setTodayTotalLessons] = useState(0);

  const [todayTeacherLessons, setTodayTeacherLessons] = useState([]);

  const todayDateStr = new Date().toLocaleDateString('uk-UA', { 
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
  });

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        const userRole = decoded.role?.toUpperCase();
        setRole(userRole);
        fetchDashboardData(userRole);
      } catch (e) {
        console.error("Помилка розшифровки токена");
      }
    }
  }, []);

  const fetchDashboardData = async (currentRole) => {
    setLoading(true);
    const todayISO = new Date().toISOString().split('T')[0];

    try {
      if (currentRole === "ADMIN") {
        const [statsRes, lessonsRes] = await Promise.all([
          api.get("api/v1/schedule/reports/basic-stats/"),
          api.get(`api/v1/schedule/lessons/?date=${todayISO}`)
        ]);
        setAdminStats(statsRes.data);
        const lessonsArray = lessonsRes.data.results || lessonsRes.data;
        setTodayTotalLessons(lessonsArray.length);
        
      } else if (currentRole === "TEACHER") {
        const lessonsRes = await api.get(`api/v1/schedule/lessons/?date=${todayISO}`);
        setTodayTeacherLessons(lessonsRes.data.results || lessonsRes.data || []);
      }
    } catch (error) {
      console.error("Помилка завантаження даних дашборду", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-[30px] shadow-sm min-h-[500px]">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold text-brand-dark">Головна панель</h1>
        <div className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl font-medium text-sm capitalize">
          {todayDateStr}
        </div>
      </div>
      
      {loading ? (
        <div className="text-gray-500 font-medium animate-pulse">Оновлення даних...</div>
      ) : (
        <div className="space-y-6">
          
          {/* Дашборд адміна */}
          {role === "ADMIN" && (
            <div className="space-y-6">
              <div className="bg-blue-50 p-8 rounded-3xl border border-blue-100">
                <h2 className="text-2xl font-bold text-blue-900 mb-2">👋 Вітаємо, Адміністраторе!</h2>
                <p className="text-blue-700">Коротке зведення активності вашої філії на сьогодні.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-6 bg-white border border-gray-100 rounded-2xl shadow-sm">
                  <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Уроків сьогодні</p>
                  <p className="text-3xl font-black text-brand-dark">{todayTotalLessons}</p>
                </div>
                {adminStats && (
                  <>
                    <div className="p-6 bg-white border border-gray-100 rounded-2xl shadow-sm">
                      <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Всього учнів</p>
                      <p className="text-3xl font-black text-brand-dark">{adminStats.active_students}</p>
                    </div>
                    <div className="p-6 bg-white border border-gray-100 rounded-2xl shadow-sm">
                      <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Відвідуваність</p>
                      <p className="text-3xl font-black text-brand-dark">{adminStats.attendance_percent}%</p>
                    </div>
                  </>
                )}
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-4 mt-8">Швидкі дії</h3>
                <div className="flex flex-wrap gap-3">
                  <Link to="/schedule" className="px-5 py-3 bg-brand-light hover:bg-brand-dark text-white rounded-xl font-bold transition-colors">
                    📅 Перевірити розклад
                  </Link>
                  <Link to="/students" className="px-5 py-3 bg-gray-100 hover:bg-gray-200 text-brand-dark rounded-xl font-bold transition-colors">
                    + Зареєструвати студента
                  </Link>
                  <Link to="/reports" className="px-5 py-3 bg-gray-100 hover:bg-gray-200 text-brand-dark rounded-xl font-bold transition-colors">
                    📊 Детальні звіти
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Дашборд вчителя */}
          {role === "TEACHER" && (
            <div className="space-y-6">
              <div className="bg-emerald-50 p-8 rounded-3xl border border-emerald-100">
                <h2 className="text-2xl font-bold text-emerald-900 mb-2">👋 Вітаємо, Вчителю!</h2>
                <p className="text-emerald-700">Ось ваші заплановані завдання на сьогодні.</p>
              </div>

              <div>
                <h3 className="text-xl font-bold text-brand-dark mb-4 mt-6">
                  Мої уроки на сьогодні ({todayTeacherLessons.length})
                </h3>
                
                {todayTeacherLessons.length === 0 ? (
                  <div className="text-center py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-200 text-gray-500 font-medium">
                    На сьогодні у вас немає запланованих уроків. Гарного відпочинку!
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {todayTeacherLessons.map(lesson => (
                      <div key={lesson.id} className="p-5 bg-white border border-gray-100 rounded-2xl shadow-sm flex flex-col gap-3">
                        <div className="flex justify-between items-start">
                          <span className="text-lg font-bold text-gray-800">{lesson.subject_name}</span>
                          <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-lg text-xs font-bold">
                            {lesson.start_time.substring(0,5)} - {lesson.end_time.substring(0,5)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 font-medium">
                          {lesson.student ? `👤 ${lesson.student_name}` : `👥 ${lesson.group_name}`}
                        </p>
                        <Link 
                          to={`/attendance/${lesson.id}`} 
                          className="mt-2 text-center w-full px-4 py-2 bg-brand-light/10 text-brand-light hover:bg-brand-light hover:text-white rounded-xl text-sm font-bold transition-colors"
                        >
                          {lesson.status === 'COMPLETED' ? 'Переглянути відвідуваність' : 'Відмітити присутність'}
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}