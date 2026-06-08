import { useState, useEffect } from "react";
import api from "../api";

const DAYS_OF_WEEK = [
  { value: "0", label: "Пн" },
  { value: "1", label: "Вт" },
  { value: "2", label: "Ср" },
  { value: "3", label: "Чт" },
  { value: "4", label: "Пт" },
  { value: "5", label: "Сб" },
  { value: "6", label: "Нд" },
];

export default function Templates() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [branches, setBranches] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [groups, setGroups] = useState([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [createError, setCreateError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [lessonType, setLessonType] = useState("INDIVIDUAL");
  const [formBranch, setFormBranch] = useState("");
  const [formTeacher, setFormTeacher] = useState("");
  const [formSubject, setFormSubject] = useState("");
  const [formStudent, setFormStudent] = useState("");
  const [formGroup, setFormGroup] = useState("");
  const [formStartDate, setFormStartDate] = useState("");
  const [formEndDate, setFormEndDate] = useState("");
  const [formStartTime, setFormStartTime] = useState("");
  const [formEndTime, setFormEndTime] = useState("");
  const [selectedDays, setSelectedDays] = useState([]);
  const [formIsActive, setFormIsActive] = useState(true);

  useEffect(() => {
    fetchInitialData();
    fetchTemplates();
  }, []);

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
      setError("Не вдалося завантажити довідники.");
    }
  };

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await api.get("api/v1/schedule/templates/");
      setTemplates(response.data.results || response.data);
    } catch (err) {
      setError("Помилка завантаження шаблонів");
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingId(null);
    setCreateError("");
    setLessonType("INDIVIDUAL");
    setFormBranch("");
    setFormTeacher("");
    setFormSubject("");
    setFormStudent("");
    setFormGroup("");
    setFormStartDate("");
    setFormEndDate("");
    setFormStartTime("");
    setFormEndTime("");
    setSelectedDays([]);
    setFormIsActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (template) => {
    setEditingId(template.id);
    setCreateError("");
    
    setLessonType(template.student ? "INDIVIDUAL" : "GROUP");
    
    let templateBranch = "";
    if (template.subject) {
        const subj = subjects.find(s => s.id === template.subject);
        if (subj) templateBranch = subj.branch.toString();
    }
    setFormBranch(templateBranch);
    
    setFormTeacher(template.teacher ? template.teacher.toString() : "");
    setFormSubject(template.subject ? template.subject.toString() : "");
    setFormStudent(template.student ? template.student.toString() : "");
    setFormGroup(template.group ? template.group.toString() : "");
    setFormStartDate(template.start_date || "");
    setFormEndDate(template.end_date || "");
    setFormStartTime(template.start_time ? template.start_time.substring(0, 5) : "");
    setFormEndTime(template.end_time ? template.end_time.substring(0, 5) : "");
    setSelectedDays(template.days_of_week ? template.days_of_week.split(",") : []);
    setFormIsActive(template.is_active !== false);

    setIsModalOpen(true);
  };

  const toggleDay = (dayValue) => {
    if (selectedDays.includes(dayValue)) {
      setSelectedDays(selectedDays.filter(d => d !== dayValue));
    } else {
      setSelectedDays([...selectedDays, dayValue]);
    }
  };

  const handleToggleActive = async (template) => {
    try {
      const newStatus = !template.is_active;
      await api.patch(`api/v1/schedule/templates/${template.id}/`, { is_active: newStatus });
      setTemplates(templates.map(t => 
        t.id === template.id ? { ...t, is_active: newStatus } : t
      ));
    } catch (err) {
      setError("Не вдалося змінити статус шаблону");
    }
  };

  const submitData = async (ignoreConflicts = false) => {
    setCreateError("");

    if (selectedDays.length === 0) {
      setCreateError("Оберіть хоча б один день тижня.");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        teacher: formTeacher,
        subject: formSubject,
        start_date: formStartDate,
        end_date: formEndDate,
        start_time: formStartTime,
        end_time: formEndTime,
        days_of_week: selectedDays.join(","),
        is_active: formIsActive,
        ignore_conflicts: ignoreConflicts
      };

      if (lessonType === "INDIVIDUAL") {
        payload.student = formStudent;
        payload.group = null; 
      } else {
        payload.group = formGroup;
        payload.student = null; 
      }

      if (editingId) {
        await api.put(`api/v1/schedule/templates/${editingId}/`, payload);
      } else {
        await api.post("api/v1/schedule/templates/", payload);
      }
      
      setIsModalOpen(false);
      fetchTemplates();
    } catch (err) {
      console.error(err);
      
      // Ловимо нашу специфічну помилку з бекенду
      if (err.response?.data?.conflicts_detected) {
        const proceed = window.confirm(
          "Ваш шаблон містить конфлікти з іншими уроками.\nСтворити шаблон тільки з неконфліктними уроками?"
        );
        
        if (proceed) {
          // Якщо адміністратор згоден, викликаємо функцію повторно з дозволом
          submitData(true);
          return;
        } else {
          setCreateError("Створення шаблону скасовано. Будь ласка, змініть час або дату.");
          setIsSubmitting(false);
          return;
        }
      }

      // Обробка помилок валідації
      const errorMessage = err.response?.data?.detail 
        || err.response?.data?.non_field_errors?.[0] 
        || err.response?.data?.end_time?.[0]
        || "Помилка збереження шаблону. Перевірте введені дані.";
      setCreateError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    submitData(false);
  };

  const formatDays = (daysString) => {
    if (!daysString) return "";
    const daysArr = daysString.split(",");
    return daysArr.map(d => DAYS_OF_WEEK.find(day => day.value === d)?.label).join(", ");
  };

  return (
    <div className="space-y-6">
      
      <div className="bg-white p-6 rounded-[30px] shadow-sm border border-gray-100 flex justify-between items-center">
        <h2 className="text-2xl font-bold text-brand-dark">Шаблони регулярних занять</h2>
        <button onClick={openCreateModal} className="px-5 py-3 cursor-pointer bg-brand-light text-white rounded-2xl font-bold hover:bg-brand-dark shadow-sm transition-colors">
          + Створити шаблон
        </button>
      </div>

      {error && <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm font-medium">{error}</div>}

      <div className="bg-white p-8 rounded-[30px] shadow-sm border border-gray-100">
        {loading ? (
          <p className="text-gray-500">Завантаження...</p>
        ) : templates.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 rounded-[20px] border border-dashed border-gray-300">
            <p className="text-gray-500 font-medium">Жодного шаблону не знайдено.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {templates.map(template => {
              const teacherInfo = teachers.find(t => t.id === template.teacher);
              const subjectInfo = subjects.find(s => s.id === template.subject);
              const teacherName = teacherInfo ? `${teacherInfo.first_name} ${teacherInfo.last_name}` : `Вчитель #${template.teacher}`;
              
              let participantDisplay = "";
              if (template.student) {
                const studentInfo = students.find(s => s.id === template.student);
                participantDisplay = studentInfo ? `👤 Студент: ${studentInfo.first_name} ${studentInfo.last_name}` : '👤 Індивідуально';
              } else if (template.group) {
                const groupInfo = groups.find(g => g.id === template.group);
                participantDisplay = groupInfo ? `👥 Група: ${groupInfo.name}` : '👥 Групове';
              }

              const isActive = template.is_active !== false; 

              return (
                <div key={template.id} className="bg-slate-50 p-6 rounded-3xl border border-gray-100 hover:shadow-md transition-shadow relative">
                  
                  <button 
                    onClick={() => handleToggleActive(template)}
                    type="button"
                    title="Натисніть, щоб змінити статус генерації"
                    className={`absolute top-6 right-6 px-3 py-1 rounded-full text-xs font-bold cursor-pointer transition-colors duration-300 ${
                      isActive 
                        ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                        : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                    }`}
                  >
                    {isActive ? 'Активний' : 'Деактивований'}
                  </button>

                  <div className="flex justify-between items-start mb-4 pr-24">
                    <div>
                      <h3 className={`text-xl font-bold ${isActive ? 'text-gray-800' : 'text-gray-500'}`}>{subjectInfo?.name || `Предмет #${template.subject}`}</h3>
                      <p className={`text-sm font-bold mt-1 ${isActive ? 'text-blue-600' : 'text-gray-400'}`}>{participantDisplay}</p>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                     <span className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${isActive ? 'bg-blue-100 text-brand-light' : 'bg-gray-100 text-gray-500'}`}>
                      {formatDays(template.days_of_week)}
                    </span>
                  </div>
                  
                  <div className={`grid grid-cols-2 gap-4 text-sm mb-4 p-4 rounded-xl border ${isActive ? 'bg-white border-gray-100 text-gray-600' : 'bg-gray-50 border-gray-200 text-gray-400'}`}>
                    <div>
                      <span className="block text-xs text-gray-400 mb-1">Викладач</span>
                      <span className={`font-semibold ${isActive ? 'text-gray-800' : 'text-gray-500'}`}>{teacherName}</span>
                    </div>
                    <div>
                      <span className="block text-xs text-gray-400 mb-1">Час проведення</span>
                      <span className={`font-semibold ${isActive ? 'text-gray-800' : 'text-gray-500'}`}>{template.start_time.substring(0,5)} - {template.end_time.substring(0,5)}</span>
                    </div>
                    <div className="col-span-2 pt-2 border-t border-gray-50">
                      <span className="block text-xs text-gray-400 mb-1">Період дії шаблону</span>
                      <span className={`font-semibold ${isActive ? 'text-gray-800' : 'text-gray-500'}`}>{template.start_date} ... {template.end_date}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200 flex justify-end">
                    <button 
                      onClick={() => openEditModal(template)} 
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

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-8 rounded-[30px] w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-brand-dark">
                {editingId ? "Редагування шаблону" : "Генератор розкладу (Шаблон)"}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="bg-gray-100 text-gray-600 hover:bg-gray-200 w-10 h-10 rounded-full font-bold">✕</button>
            </div>

            {createError && (
              <div className="bg-red-50 text-red-600 p-4 rounded-2xl mb-6 text-sm font-medium border border-red-100">
                🚨 {createError}
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-5">
              
              <div className="flex bg-gray-100 p-1 rounded-2xl mb-4">
                <button type="button" onClick={() => setLessonType("INDIVIDUAL")} className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${lessonType === "INDIVIDUAL" ? "bg-white text-brand-dark shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                  👤 Індивідуальні уроки
                </button>
                <button type="button" onClick={() => setLessonType("GROUP")} className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${lessonType === "GROUP" ? "bg-white text-brand-dark shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                  👥 Групові уроки
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-brand-dark mb-1">Філія (для фільтру) *</label>
                  <select required value={formBranch} onChange={e => setFormBranch(e.target.value)} className="base-input">
                    <option value="">Оберіть філію</option>
                    {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-brand-dark mb-1">Предмет *</label>
                  <select required value={formSubject} onChange={e => setFormSubject(e.target.value)} className="base-input">
                    <option value="">Оберіть предмет</option>
                    {subjects
                      .filter(s => (!formBranch || s.branch === parseInt(formBranch)) && s.status === 'ACTIVE')
                      .map(s => (
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

                <div className="md:col-span-2 p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                  {lessonType === "INDIVIDUAL" ? (
                    <>
                      <label className="block text-sm font-bold text-blue-900 mb-1">Студент *</label>
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
                      <label className="block text-sm font-bold text-blue-900 mb-1">Група *</label>
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

                <div className="md:col-span-2 bg-blue-50/50 p-4 rounded-2xl border border-purple-100">
                  <label className="block text-sm font-bold text-blue-900 mb-3">Дні тижня *</label>
                  <div className="flex flex-wrap gap-2">
                    {DAYS_OF_WEEK.map(day => (
                      <button
                        key={day.value}
                        type="button"
                        onClick={() => toggleDay(day.value)}
                        className={`w-10 h-10 rounded-full font-bold text-sm transition-all ${selectedDays.includes(day.value) ? 'bg-brand-dark text-white shadow-md' : 'bg-white text-gray-500 hover:bg-purple-100'}`}
                      >
                        {day.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="md:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4 border-t border-gray-100 pt-5">
                  <div className="col-span-2 md:col-span-1">
                    <label className="block text-sm font-semibold text-brand-dark mb-1">Дата початку *</label>
                    <input type="date" required value={formStartDate} onChange={e => setFormStartDate(e.target.value)} className="base-input px-2" />
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <label className="block text-sm font-semibold text-brand-dark mb-1">Дата кінця *</label>
                    <input type="date" required value={formEndDate} onChange={e => setFormEndDate(e.target.value)} className="base-input px-2" />
                  </div>
                  <div className="col-span-1">
                    <label className="block text-sm font-semibold text-brand-dark mb-1">Час з *</label>
                    <input type="time" required value={formStartTime} onChange={e => setFormStartTime(e.target.value)} className="base-input px-2" />
                  </div>
                  <div className="col-span-1">
                    <label className="block text-sm font-semibold text-brand-dark mb-1">Час до *</label>
                    <input type="time" required value={formEndTime} onChange={e => setFormEndTime(e.target.value)} className="base-input px-2" />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3.5 bg-gray-100 text-gray-600 rounded-2xl font-bold hover:bg-gray-200">
                  Скасувати
                </button>
                <button type="submit" disabled={isSubmitting} className={`px-8 py-3.5 text-white rounded-2xl font-bold shadow-sm transition-all ${isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-brand-light hover:bg-brand-dark'}`}>
                  {isSubmitting ? 'Збереження...' : (editingId ? 'Зберегти зміни' : 'Згенерувати розклад')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}