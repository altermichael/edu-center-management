import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

export default function Schedule() {
  // Розклад
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]); // Сьогодні
  const [filterBranch, setFilterBranch] = useState("");

  const [branches, setBranches] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [groups, setGroups] = useState([]);

  // Модалка створення уроків
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [createError, setCreateError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [lessonType, setLessonType] = useState("INDIVIDUAL");
  const [formBranch, setFormBranch] = useState("");
  const [formTeacher, setFormTeacher] = useState("");
  const [formSubject, setFormSubject] = useState("");
  const [formStudent, setFormStudent] = useState("");
  const [formGroup, setFormGroup] = useState("");
  const [formDate, setFormDate] = useState("");
  const [formStartTime, setFormStartTime] = useState("");
  const [formEndTime, setFormEndTime] = useState("");

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchLessons();
  }, [filterDate, filterBranch]);

  const navigate = useNavigate();

  const fetchInitialData = async () => {
    try {
      const [branchesRes, teachersRes, subjectsRes, studentsRes, groupsRes] = await Promise.all([
        api.get("api/v1/core/branches/"),
        api.get("api/v1/users/?role=teacher"),
        api.get("api/v1/core/subjects/"),
        api.get("api/v1/students/students/"),
        api.get("api/v1/students/groups/")
      ]);

      setBranches(branchesRes.data.results || branchesRes.data);
      setTeachers(teachersRes.data.results || teachersRes.data);
      setSubjects(subjectsRes.data.results || subjectsRes.data);
      setStudents(studentsRes.data.results || studentsRes.data);
      setGroups(groupsRes.data.results || groupsRes.data);
    } catch (err) {
      console.error("Помилка завантаження довідників", err);
      setError("Не вдалося завантажити дані системи. Оновіть сторінку.");
    }
  };

  const fetchLessons = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterDate) params.append("date", filterDate);
      if (filterBranch) params.append("branch", filterBranch);

      const response = await api.get(`api/v1/schedule/lessons/?${params.toString()}`);
      setLessons(response.data.results || response.data);
    } catch (err) {
      setError("Помилка завантаження розкладу");
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setCreateError("");
    setLessonType("INDIVIDUAL");
    setFormBranch("");
    setFormTeacher("");
    setFormSubject("");
    setFormStudent("");
    setFormGroup("");
    setFormDate(filterDate || new Date().toISOString().split('T')[0]);
    setFormStartTime("");
    setFormEndTime("");
    setIsModalOpen(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setCreateError("");
    setIsSubmitting(true);

    try {
      // збираємо payload
      const payload = {
        type: lessonType,
        branch: formBranch,
        teacher: formTeacher,
        subject: formSubject,
        date: formDate,
        start_time: formStartTime,
        end_time: formEndTime,
      };

      if (lessonType === "INDIVIDUAL") {
        payload.student = formStudent;
      } else {
        payload.group = formGroup;
      }

      await api.post("api/v1/schedule/lessons/", payload);
      
      setIsModalOpen(false);
      fetchLessons();
    } catch (err) {
      
      console.error(err);
      const errorMessage = err.response?.data?.detail 
        || err.response?.data?.non_field_errors?.[0] 
        || "Помилка створення уроку. Можливо, є конфлікт у розкладі.";
      setCreateError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelLesson = async (lessonId) => {
    try {
      await api.patch(`api/v1/schedule/lessons/${lessonId}/`, { status: 'CANCELLED' });
      
      setLessons(lessons.map(lesson => 
        lesson.id === lessonId ? { ...lesson, status: 'CANCELLED' } : lesson
      ));
    } catch (err) {
      console.error(err);
      setError("Помилка при скасуванні уроку. Спробуйте ще раз.");
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
    <div className="space-y-6">
      
      {/* Панель керування та фільтри */}
      <div className="bg-white p-6 rounded-[30px] shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
          <input 
            type="date" 
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="base-input cursor-pointer"
          />
          <select value={filterBranch} onChange={(e) => setFilterBranch(e.target.value)} className="base-input cursor-pointer min-w-[200px]">
            <option value="">Всі філії</option>
            {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
        
        <div className="flex gap-3 w-full md:w-auto">
          <button onClick={openCreateModal} className="px-5 py-3 bg-brand-light text-white rounded-2xl font-bold hover:bg-brand-dark shadow-sm shadow-brand-light/30 transition-colors w-full md:w-auto">
            + Створити урок
          </button>
        </div>
      </div>

      {error && <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm font-medium">{error}</div>}

      {/* Розклад */}
      <div className="bg-white p-8 rounded-[30px] shadow-sm border border-gray-100">
        <h2 className="text-2xl font-bold text-brand-dark mb-6">Розклад на {filterDate || 'всі дати'}</h2>
        
        {loading ? (
          <p className="text-gray-500">Завантаження розкладу...</p>
        ) : lessons.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 rounded-[20px] border border-dashed border-gray-300">
            <p className="text-gray-500 font-medium text-lg">На цю дату уроків не знайдено.</p>
            <p className="text-gray-400 text-sm mt-2">Змініть дату або створіть новий урок.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {lessons.map(lesson => {
              const teacherInfo = teachers.find(t => t.id === lesson.teacher);
              const subjectInfo = subjects.find(s => s.id === lesson.subject);
              const teacherName = teacherInfo ? `${teacherInfo.first_name} ${teacherInfo.last_name}` : `Вчитель #${lesson.teacher}`;
              const subjectName = subjectInfo ? subjectInfo.name : `Предмет #${lesson.subject}`;
              
              // відображення учасників
              let participantDisplay = "";
              // перевіряємо, чи є у записі id студента
              if (lesson.student) {
                const studentInfo = students.find(s => String(s.id) === String(lesson.student));
                participantDisplay = studentInfo ? `👤 ${studentInfo.first_name} ${studentInfo.last_name}` : '👤 Студент';
              } 
              // ящо студента немає, перевіряємо, чи є група
              else if (lesson.group) {
                const groupInfo = groups.find(g => String(g.id) === String(lesson.group));
                participantDisplay = groupInfo ? `👥 ${groupInfo.name}` : '👥 Група';
              } 
              // Якщо нічого не вказано
              else {
                participantDisplay = 'Учасників не призначено';
              }

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
                      <h3 className="text-lg font-bold text-gray-800">{subjectName}</h3>
                      {getStatusBadge(lesson.status)}
                    </div>
                    <p className="text-sm text-gray-600 font-medium">Викладач: <span className="text-brand-dark">{teacherName}</span></p>
                    <p className="text-sm font-bold text-blue-600 mt-1">{participantDisplay}</p>
                  </div>

                  <div className="flex gap-2 w-full md:w-auto">
                    {lesson.status === 'SCHEDULED' && (
                      <button onClick={() => handleCancelLesson(lesson.id)}
                        className="cursor-pointer px-4 py-2 text-sm font-bold bg-white border border-gray-200 text-red-500 hover:bg-red-50 hover:border-red-200 rounded-xl transition-colors">
                        Скасувати
                      </button>
                    )}
                    <button onClick={() => navigate(`/attendance/${lesson.id}`)} className="cursor-pointer px-4 py-2 text-sm font-bold bg-brand-light/10 text-brand-light hover:bg-brand-light hover:text-white rounded-xl transition-colors">
                      {lesson.status === 'COMPLETED' ? 'Переглянути відвідуваність' : 'Відмітити присутність'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Модалка крієйту уроку*/}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-8 rounded-[30px] w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-brand-dark">Створення нового уроку</h2>
              <button onClick={() => setIsModalOpen(false)} className="bg-gray-100 text-gray-600 hover:bg-gray-200 w-10 h-10 rounded-full font-bold">✕</button>
            </div>

            {createError && (
              <div className="bg-red-50 text-red-600 p-4 rounded-2xl mb-6 text-sm font-medium border border-red-100">
                🚨 {createError}
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-5">
              
              {/* Перемикач типу уроку */}
              <div className="flex bg-gray-100 p-1 rounded-2xl mb-6">
                <button type="button" onClick={() => setLessonType("INDIVIDUAL")} className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${lessonType === "INDIVIDUAL" ? "bg-white text-brand-dark shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                  👤 Індивідуальний
                </button>
                <button type="button" onClick={() => setLessonType("GROUP")} className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${lessonType === "GROUP" ? "bg-white text-brand-dark shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                  👥 Груповий
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-brand-dark mb-1">Філія *</label>
                  <select required value={formBranch} onChange={e => setFormBranch(e.target.value)} className="base-input">
                    <option value="">Оберіть філію</option>
                    {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-brand-dark mb-1">Предмет *</label>
                  <select required value={formSubject} onChange={e => setFormSubject(e.target.value)} className="base-input">
                    <option value="">Оберіть предмет</option>
                    {subjects.filter(s => (!formBranch || s.branch === parseInt(formBranch)) && s.status === 'ACTIVE').map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-brand-dark mb-1">Викладач *</label>
                  <select required value={formTeacher} onChange={e => setFormTeacher(e.target.value)} className="base-input">
                    <option value="">Оберіть викладача</option>
                    {teachers.map(t => <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>)}
                  </select>
                </div>

                {/* Студент або Група */}
                <div className="md:col-span-2 p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                  {lessonType === "INDIVIDUAL" ? (
                    <>
                      <label className="block text-sm font-bold text-blue-900 mb-1">Студент (для індивідуального уроку) *</label>
                      <select required value={formStudent} onChange={e => setFormStudent(e.target.value)} className="base-input bg-white">
                        <option value="">Оберіть студента</option>
                        {students
                          .filter(s => (!formBranch || s.branch === parseInt(formBranch)) && s.status === 'ACTIVE')
                          .map(s => (
                          <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>
                        ))}
                      </select>
                    </>
                  ) : (
                    <>
                      <label className="block text-sm font-bold text-blue-900 mb-1">Група (для групового уроку) *</label>
                      <select required value={formGroup} onChange={e => setFormGroup(e.target.value)} className="base-input bg-white">
                        <option value="">Оберіть групу</option>
                        {groups
                          .filter(g => (!formBranch || g.branch === parseInt(formBranch)) && g.status === 'ACTIVE')
                          .map(g => (
                          <option key={g.id} value={g.id}>{g.name}</option>
                        ))}
                      </select>
                    </>
                  )}
                </div>

                <div className="md:col-span-2 grid grid-cols-3 gap-4 border-t border-gray-100 pt-5">
                  <div>
                    <label className="block text-sm font-semibold text-brand-dark mb-1">Дата *</label>
                    <input type="date" required value={formDate} onChange={e => setFormDate(e.target.value)} className="base-input" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-brand-dark mb-1">Початок *</label>
                    <input type="time" required value={formStartTime} onChange={e => setFormStartTime(e.target.value)} className="base-input" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-brand-dark mb-1">Кінець *</label>
                    <input type="time" required value={formEndTime} onChange={e => setFormEndTime(e.target.value)} className="base-input" />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3.5 bg-gray-100 text-gray-600 rounded-2xl font-bold hover:bg-gray-200">
                  Скасувати
                </button>
                <button type="submit" disabled={isSubmitting} className={`px-8 py-3.5 text-white rounded-2xl font-bold shadow-sm shadow-brand-light/30 transition-all ${isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-brand-light hover:bg-brand-dark'}`}>
                  {isSubmitting ? 'Перевірка конфліктів...' : 'Створити урок'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}