import { useState, useEffect } from "react";
import api from "../api";

export default function Reports() {
  const [activeTab, setActiveTab] = useState("stats");
  
  const [branches, setBranches] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]); 
  
  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [selectedStudent, setSelectedStudent] = useState("");
  
  // Фільтри періоду для Статистики
  const [statsDateFrom, setStatsDateFrom] = useState("");
  const [statsDateTo, setStatsDateTo] = useState("");
  
  // Фільтри періоду для Вчителя
  const [teacherDateFrom, setTeacherDateFrom] = useState("");
  const [teacherDateTo, setTeacherDateTo] = useState("");
  
  // Фільтри для Історії студента
  const [historyDateFrom, setHistoryDateFrom] = useState("");
  const [historyDateTo, setHistoryDateTo] = useState("");
  const [historySubject, setHistorySubject] = useState("");
  
  const [statsData, setStatsData] = useState(null);
  const [teacherSchedule, setTeacherSchedule] = useState([]);
  const [studentHistory, setStudentHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (activeTab === "stats") fetchStats();
    if (activeTab === "schedule" && selectedTeacher) fetchTeacherSchedule();
    if (activeTab === "history" && selectedStudent) fetchStudentHistory();
  }, [activeTab, selectedBranch, selectedTeacher, selectedStudent, statsDateFrom, statsDateTo]);

  const fetchInitialData = async () => {
    try {
      const [branchesRes, teachersRes, studentsRes, subjectsRes] = await Promise.all([
        api.get("api/v1/core/branches/"),
        api.get("api/v1/users/?role=teacher"),
        api.get("api/v1/students/students/"),
        api.get("api/v1/core/subjects/") 
      ]);
      setBranches(branchesRes.data.results || branchesRes.data);
      setTeachers(teachersRes.data.results || teachersRes.data);
      setStudents(studentsRes.data.results || studentsRes.data);
      setSubjects(subjectsRes.data.results || subjectsRes.data);
    } catch (err) {
      console.error("Помилка завантаження довідників", err);
    }
  };

  const fetchStats = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedBranch) params.append("branch", selectedBranch);
      if (statsDateFrom) params.append("start_date", statsDateFrom);
      if (statsDateTo) params.append("end_date", statsDateTo);
      
      const res = await api.get(`api/v1/schedule/reports/basic-stats/?${params.toString()}`);
      setStatsData(res.data);
    } catch (err) {
      console.error("Помилка статистики", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeacherSchedule = async () => {
    setLoading(true);
    try {
      const res = await api.get(`api/v1/schedule/lessons/?teacher=${selectedTeacher}`);
      setTeacherSchedule(res.data.results || res.data);
    } catch (err) {
      console.error("Помилка розкладу вчителя", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentHistory = async () => {
    setLoading(true);
    try {
      const res = await api.get(`api/v1/schedule/attendances/?student=${selectedStudent}`);
      setStudentHistory(res.data.results || res.data);
    } catch (err) {
      console.error("Помилка історії студента", err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'SCHEDULED': return <span className="bg-blue-100 text-blue-700 px-2.5 py-1 rounded-lg text-base font-bold">Заплановано</span>;
      case 'COMPLETED': return <span className="bg-green-100 text-green-700 px-2.5 py-1 rounded-lg text-base font-bold">Проведено</span>;
      case 'CANCELLED': return <span className="bg-red-100 text-red-700 px-2.5 py-1 rounded-lg text-base font-bold">Скасовано</span>;
      default: return <span className="bg-gray-100 text-gray-700 px-2.5 py-1 rounded-lg text-base font-bold">{status}</span>;
    }
  };

  const filteredTeacherSchedule = teacherSchedule.filter(lesson => {
    if (teacherDateFrom && lesson.date < teacherDateFrom) return false;
    if (teacherDateTo && lesson.date > teacherDateTo) return false;
    return true;
  });

  const filteredStudentHistory = studentHistory.filter(record => {
    if (historyDateFrom && record.lesson_date < historyDateFrom) return false;
    if (historyDateTo && record.lesson_date > historyDateTo) return false;
    if (historySubject && record.subject_name !== historySubject) return false;
    return true;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      
      <div className="bg-white p-6 rounded-[30px] shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex gap-2 bg-gray-100 p-1 rounded-2xl w-full md:w-auto">
          <button 
            onClick={() => setActiveTab("stats")} 
            className={`flex-1 md:w-40 py-3 text-center text-sm font-bold rounded-xl transition-all cursor-pointer ${activeTab === "stats" ? "bg-white text-brand-dark shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
          >
            📊 Статистика
          </button>
          <button 
            onClick={() => setActiveTab("schedule")} 
            className={`flex-1 md:w-40 py-3 text-center text-sm font-bold rounded-xl transition-all cursor-pointer ${activeTab === "schedule" ? "bg-white text-brand-dark shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
          >
            👨‍🏫 Розклад
          </button>
          <button 
            onClick={() => setActiveTab("history")} 
            className={`flex-1 md:w-40 py-3 text-center text-sm font-bold rounded-xl transition-all cursor-pointer ${activeTab === "history" ? "bg-white text-brand-dark shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
          >
            🎓 Історія
          </button>
        </div>

        {/* Панель фільтрів загальної статистики */}
        {activeTab === "stats" && (
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto flex-wrap">
            <select value={selectedBranch} onChange={(e) => setSelectedBranch(e.target.value)} className="base-input min-w-[200px] !py-2.5">
              <option value="">Всі філії</option>
              {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            
            <div className="flex items-center gap-2 bg-gray-50 px-4 rounded-2xl border border-gray-200 focus-within:ring-2 focus-within:ring-brand-light">
              <span className="text-sm font-semibold text-gray-500">З:</span>
              <input type="date" value={statsDateFrom} onChange={(e) => setStatsDateFrom(e.target.value)} className="bg-transparent py-2.5 outline-none text-sm cursor-pointer text-gray-700" />
            </div>
            
            <div className="flex items-center gap-2 bg-gray-50 px-4 rounded-2xl border border-gray-200 focus-within:ring-2 focus-within:ring-brand-light">
              <span className="text-sm font-semibold text-gray-500">По:</span>
              <input type="date" value={statsDateTo} onChange={(e) => setStatsDateTo(e.target.value)} className="bg-transparent py-2.5 outline-none text-sm cursor-pointer text-gray-700" />
            </div>
          </div>
        )}
      </div>

      <div className="bg-white p-8 rounded-[30px] shadow-sm border border-gray-100 min-h-[400px]">
        
        {/* Базова статистика */}
        {activeTab === "stats" && (
          <div className="flex flex-col gap-6">
            <div className="text-2xl font-bold text-brand-dark mb-4">Загальна статистика філії</div>
            
            {loading ? (
              <div className="text-gray-500 font-medium animate-pulse">Підрахунок даних...</div>
            ) : statsData ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
                  <div className="text-sm font-bold text-blue-400 uppercase tracking-wider mb-2">Активні студенти</div>
                  <div className="text-4xl font-black text-blue-900">{statsData.active_students}</div>
                </div>
                <div className="bg-green-50 p-6 rounded-2xl border border-green-100">
                  <div className="text-sm font-bold text-green-500 uppercase tracking-wider mb-2">Проведені уроки</div>
                  <div className="text-4xl font-black text-green-700">{statsData.completed_lessons}</div>
                </div>
                <div className="bg-red-50 p-6 rounded-2xl border border-red-100">
                  <div className="text-sm font-bold text-red-400 uppercase tracking-wider mb-2">Скасовані уроки</div>
                  <div className="text-4xl font-black text-red-700">{statsData.cancelled_lessons}</div>
                </div>
                <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100">
                  <div className="text-sm font-bold text-amber-500 uppercase tracking-wider mb-2">Відвідуваність</div>
                  <div className="text-4xl font-black text-amber-700">{statsData.attendance_percent}%</div>
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* Розклад викладача */}
        {activeTab === "schedule" && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-4">
              <div className="text-2xl font-bold text-brand-dark">Розклад викладача</div>
              
              <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                <select value={selectedTeacher} onChange={(e) => setSelectedTeacher(e.target.value)} className="base-input min-w-[200px] !py-2.5">
                  <option value="">Оберіть викладача</option>
                  {teachers.map(t => <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>)}
                </select>
                
                {selectedTeacher && (
                  <>
                    <div className="flex items-center gap-2 bg-gray-50 px-4 rounded-2xl border border-gray-200">
                      <span className="text-sm font-semibold text-gray-500">З:</span>
                      <input type="date" value={teacherDateFrom} onChange={(e) => setTeacherDateFrom(e.target.value)} className="bg-transparent py-2.5 outline-none text-sm cursor-pointer text-gray-700" />
                    </div>
                    <div className="flex items-center gap-2 bg-gray-50 px-4 rounded-2xl border border-gray-200">
                      <span className="text-sm font-semibold text-gray-500">По:</span>
                      <input type="date" value={teacherDateTo} onChange={(e) => setTeacherDateTo(e.target.value)} className="bg-transparent py-2.5 outline-none text-sm cursor-pointer text-gray-700" />
                    </div>
                  </>
                )}
              </div>
            </div>

            {!selectedTeacher ? (
              <div className="text-center py-12 text-gray-400 italic">Будь ласка, оберіть викладача для перегляду розкладу.</div>
            ) : loading ? (
              <div className="text-gray-500 font-medium animate-pulse">Завантаження...</div>
            ) : filteredTeacherSchedule.length === 0 ? (
              <div className="text-center py-12 text-gray-400">За обраний період уроків не знайдено.</div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {filteredTeacherSchedule.map(lesson => (
                  <div key={lesson.id} className="flex justify-between items-center bg-slate-50 p-5 rounded-2xl border border-gray-100 hover:shadow-md transition-shadow">
                    <div className="flex flex-col">
                      <span className="text-lg font-bold text-gray-800">{lesson.subject_name}</span>
                      <span className="text-sm text-gray-500">{lesson.date} • {lesson.start_time.substring(0,5)} - {lesson.end_time.substring(0,5)}</span>
                    </div>
                    <span>{getStatusBadge(lesson.status)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Історія студента */}
        {activeTab === "history" && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-4">
              <div className="text-2xl font-bold text-brand-dark">Історія відвідуваності</div>
              
              <div className="flex flex-col sm:flex-row flex-wrap gap-3 w-full lg:w-auto">
                <select value={selectedStudent} onChange={(e) => setSelectedStudent(e.target.value)} className="base-input min-w-[200px] !py-2.5">
                  <option value="">Оберіть студента</option>
                  {students.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}
                </select>

                {selectedStudent && (
                  <>
                    <select value={historySubject} onChange={(e) => setHistorySubject(e.target.value)} className="base-input min-w-[150px] !py-2.5">
                      <option value="">Всі предмети</option>
                      {subjects.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                    </select>
                    
                    <div className="flex items-center gap-2 bg-gray-50 px-4 rounded-2xl border border-gray-200">
                      <span className="text-sm font-semibold text-gray-500">З:</span>
                      <input type="date" value={historyDateFrom} onChange={(e) => setHistoryDateFrom(e.target.value)} className="bg-transparent py-2.5 outline-none text-sm cursor-pointer text-gray-700" />
                    </div>
                    <div className="flex items-center gap-2 bg-gray-50 px-4 rounded-2xl border border-gray-200">
                      <span className="text-sm font-semibold text-gray-500">По:</span>
                      <input type="date" value={historyDateTo} onChange={(e) => setHistoryDateTo(e.target.value)} className="bg-transparent py-2.5 outline-none text-sm cursor-pointer text-gray-700" />
                    </div>
                  </>
                )}
              </div>
            </div>

            {!selectedStudent ? (
              <div className="text-center py-12 text-gray-400 italic">Будь ласка, оберіть студента для перегляду історії.</div>
            ) : loading ? (
              <div className="text-gray-500 font-medium animate-pulse">Завантаження...</div>
            ) : filteredStudentHistory.length === 0 ? (
              <div className="text-center py-12 text-gray-400">За вказаними фільтрами історія відвідуваності відсутня.</div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="flex gap-3 text-sm mb-2">
                  <span className="bg-green-100 text-green-700 px-3 py-1 rounded-lg font-bold shadow-sm">
                    Відвідав: {filteredStudentHistory.filter(r => r.status === 'PRESENT').length}
                  </span>
                  <span className="bg-red-100 text-red-700 px-3 py-1 rounded-lg font-bold shadow-sm">
                    Пропустив: {filteredStudentHistory.filter(r => r.status === 'ABSENT').length}
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {filteredStudentHistory.map(record => (
                    <div key={record.id} className="flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-50 p-4 rounded-xl border border-gray-100 gap-3 hover:shadow-sm transition-shadow">
                      <div className="flex flex-col">
                        <span className="font-bold text-brand-dark">{record.subject_name || `Урок #${record.lesson}`}</span>
                        <span className="text-sm text-gray-500">{record.lesson_date || '—'}</span>
                      </div>
                      <div className="flex items-center gap-4 w-full md:w-auto justify-between">
                        <span className="text-sm text-gray-500 italic max-w-[200px] truncate" title={record.note}>{record.note || 'Без нотаток'}</span>
                        <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${record.status === 'PRESENT' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {record.status === 'PRESENT' ? 'Присутній' : 'Відсутній'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}