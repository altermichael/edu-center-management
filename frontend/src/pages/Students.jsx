import { useState, useEffect, useRef } from "react";
import api from "../api";

export default function Students() {
  const [students, setStudents] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Фільтри та пошук
  const [searchQuery, setSearchQuery] = useState("");
  const [filterBranch, setFilterBranch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  // Стани форми студента
  const [editingId, setEditingId] = useState(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [branchId, setBranchId] = useState("");
  
  // Стани форми батьків
  const [parentId, setParentId] = useState(null);
  const [parentName, setParentName] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [parentRelationship, setParentRelationship] = useState("");

  // Стани для модалки детальніше
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedStudentDetail, setSelectedStudentDetail] = useState(null);
  const [detailParent, setDetailParent] = useState(null);
  const [detailSubscriptions, setDetailSubscriptions] = useState([]);
  const [detailAttendance, setDetailAttendance] = useState([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const formRef = useRef(null);

  useEffect(() => {
    fetchBranches();
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [searchQuery, filterBranch, filterStatus]);

  const fetchBranches = async () => {
    try {
      const response = await api.get("api/v1/core/branches/");
      setBranches(response.data.results || response.data);
    } catch (err) {
      console.error("Помилка завантаження філій");
    }
  };

  const fetchStudents = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams();
      if (searchQuery) params.append("search", searchQuery);
      if (filterBranch) params.append("branch", filterBranch);
      if (filterStatus) params.append("status", filterStatus);

      const response = await api.get(`api/v1/students/students/?${params.toString()}`);
      setStudents(response.data.results || response.data);
      setLoading(false);
    } catch (err) {
      setError("Помилка при завантаженні студентів");
      setLoading(false);
    }
  };

  // Деталі
  const handleOpenDetails = async (student) => {
    setSelectedStudentDetail(student);
    setDetailModalOpen(true);
    setLoadingDetails(true);

    try {
      // Завантажуємо батьків (якщо є)
      if (student.parent) {
        const parentRes = await api.get(`api/v1/students/parents/${student.parent}/`);
        setDetailParent(parentRes.data);
      } else {
        setDetailParent(null);
      }

      // Завантажуємо підписки студента
      const subsRes = await api.get(`api/v1/subscriptions/student-subscriptions/?student=${student.id}`);
      setDetailSubscriptions(subsRes.data.results || subsRes.data);

      // Завантажуємо історію відвідуваності
      const attRes = await api.get(`api/v1/schedule/attendances/?student=${student.id}`);
      setDetailAttendance(attRes.data.results || attRes.data);

    } catch (err) {
      console.error("Помилка завантаження деталей студента", err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleEditClick = async (student) => {
    setEditingId(student.id);
    setFirstName(student.first_name || "");
    setLastName(student.last_name || "");
    setDateOfBirth(student.date_of_birth || "");
    setPhone(student.phone || "");
    setEmail(student.email || "");
    setAddress(student.address || "");
    setBranchId(student.branch || "");

    if (student.parent) {
      try {
        const parentRes = await api.get(`api/v1/students/parents/${student.parent}/`);
        const parent = parentRes.data;
        setParentId(parent.id);
        setParentName(parent.name || "");
        setParentPhone(parent.phone || "");
        setParentEmail(parent.email || "");
        setParentRelationship(parent.relationship || "");
      } catch (err) {
        console.error("Не вдалося завантажити дані батьків");
      }
    } else {
      resetParentForm();
    }
    
    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const resetParentForm = () => {
    setParentId(null);
    setParentName("");
    setParentPhone("");
    setParentEmail("");
    setParentRelationship("");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFirstName("");
    setLastName("");
    setDateOfBirth("");
    setPhone("");
    setEmail("");
    setAddress("");
    setBranchId("");
    resetParentForm();
    setError("");
  };

  const handleToggleStatus = async (student) => {
    try {
      const newStatus = student.status === 'ACTIVE' ? 'ARCHIVED' : 'ACTIVE';
      await api.patch(`api/v1/students/students/${student.id}/`, { status: newStatus });
      setStudents(students.map(s => 
        s.id === student.id ? { ...s, status: newStatus } : s
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
      let finalParentId = parentId;

      if (parentName && parentPhone) {
        const parentPayload = {
          name: parentName,
          phone: parentPhone,
          email: parentEmail,
          relationship: parentRelationship
        };

        if (parentId) {
          await api.patch(`api/v1/students/parents/${parentId}/`, parentPayload);
        } else {
          const parentRes = await api.post("api/v1/students/parents/", parentPayload);
          finalParentId = parentRes.data.id;
        }
      }

      const studentPayload = {
        first_name: firstName,
        last_name: lastName,
        date_of_birth: dateOfBirth || null,
        phone,
        email,
        address,
        branch: branchId,
        parent: finalParentId
      };

      if (editingId) {
        await api.patch(`api/v1/students/students/${editingId}/`, studentPayload);
      } else {
        studentPayload.status = "ACTIVE";
        await api.post("api/v1/students/students/", studentPayload);
      }
      
      handleCancelEdit();
      fetchStudents();
    } catch (err) {
      setError("Помилка при збереженні. Перевірте правильність даних.");
    }
  };

  return (
    <div className="space-y-6" ref={formRef}>
      
      {/* Форма */}
      <div className="bg-white p-8 rounded-[30px] shadow-sm border border-gray-100">
        <h2 className="text-2xl text-brand-dark font-bold mb-6">
          {editingId ? <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-[13px]">Редагування студента</span> : "Реєстрація студента"}
        </h2>
        
        {error && <div className="bg-red-50 text-red-600 p-4 rounded-2xl mb-6 text-sm font-medium">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Блок студента */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm text-brand-dark font-semibold mb-2">Ім'я *</label>
              <input type="text" required value={firstName} 
              onChange={e => setFirstName(e.target.value)} 
              className="base-input" 
              placeholder="Нап.: Іван" />
            </div>
            <div>
              <label className="block text-sm text-brand-dark font-semibold mb-2">Прізвище *</label>
              <input type="text" required value={lastName} 
              onChange={e => setLastName(e.target.value)} 
              className="base-input" 
              placeholder="Нап.: Шевченко" />
            </div>
            <div>
              <label className="block text-sm text-brand-dark font-semibold mb-2">Філія *</label>
              <select required value={branchId} onChange={e => setBranchId(e.target.value)} className="base-input cursor-pointer">
                <option value="">Оберіть філію</option>
                {branches.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-brand-dark font-semibold mb-2">Дата народження</label>
              <input type="date" value={dateOfBirth} onChange={e => setDateOfBirth(e.target.value)} className="base-input" />
            </div>
            <div>
              <label className="block text-sm text-brand-dark font-semibold mb-2">Телефон</label>
              <input type="text" 
                value={phone} 
                onChange={e => setPhone(e.target.value)} 
                className="base-input" 
                placeholder="+380ххххххххх" />
            </div>
            <div>
              <label className="block text-sm text-brand-dark font-semibold mb-2">Адреса</label>
              <input type="text" 
              value={address} 
              onChange={e => setAddress(e.target.value)} 
              className="base-input" 
              placeholder="Нап.: вул. Хрещатик, буд. 1, кв. 15, м. Київ"/>
            </div>
          </div>

          {/* Блок батьків */}
          <div className="p-6 bg-blue-50/50 rounded-2xl border border-blue-100">
            <h3 className="text-lg font-bold text-blue-900 mb-4">Контакти батьків / опікунів</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-semibold text-blue-800 mb-2">Ім'я (ПІБ)</label>
                <input type="text" value={parentName} onChange={e => setParentName(e.target.value)} className="w-full px-4 py-2 bg-white border border-blue-200 rounded-xl focus:ring-2 focus:ring-brand-light outline-none" placeholder="Нап.: Марія" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-blue-800 mb-2">Телефон</label>
                <input type="text" value={parentPhone} onChange={e => setParentPhone(e.target.value)} className="w-full px-4 py-2 bg-white border border-blue-200 rounded-xl focus:ring-2 focus:ring-brand-light outline-none" placeholder="+380ххххххххх" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-blue-800 mb-2">Відношення до дитини</label>
                <input type="text" value={parentRelationship} onChange={e => setParentRelationship(e.target.value)} className="w-full px-4 py-2 bg-white border border-blue-200 rounded-xl focus:ring-2 focus:ring-brand-light outline-none" placeholder="Нап.: Мати, Батько..." />
              </div>
              <div>
                <label className="block text-sm font-semibold text-blue-800 mb-2">Email</label>
                <input type="email" value={parentEmail} onChange={e => setParentEmail(e.target.value)} className="w-full px-4 py-2 bg-white border border-blue-200 rounded-xl focus:ring-2 focus:ring-brand-light outline-none" placeholder="email@example.com" />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            {editingId && <button type="button" onClick={handleCancelEdit} className="bg-gray-100 text-gray-600 font-bold py-3.5 px-6 rounded-2xl hover:bg-gray-200 cursor-pointer">Скасувати</button>}
            <button type="submit" className="bg-brand-light text-white font-bold py-3.5 px-8 rounded-2xl hover:bg-brand-dark transition-colors shadow-sm shadow-brand-light/30 cursor-pointer">
              {editingId ? "Зберегти зміни" : "Зареєструвати"}
            </button>
          </div>
        </form>
      </div>

      {/* Панель пошуку та фільтрів */}
      <div className="bg-white p-6 rounded-[30px] shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center">
        <input 
          type="text" 
          placeholder="Пошук за ім'ям або прізвищем:" 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 base-input"
        />
        <select value={filterBranch} onChange={(e) => setFilterBranch(e.target.value)} className="px-5 py-3 focus:bg-white bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-brand-light focus:border-brand-light outline-none min-w-[160px] cursor-pointer text-gray-700 transition-all duration-200 hover:border-brand-light/50">
          <option value="">Всі філії</option>
          {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-5 py-3 focus:bg-white bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-brand-light focus:border-brand-light outline-none min-w-[160px] cursor-pointer text-gray-700 transition-all duration-200 hover:border-brand-light/50">
          <option value="">Всі статуси</option>
          <option value="ACTIVE">Активні</option>
          <option value="ARCHIVED">Архівні</option>
        </select>
      </div>

      {/* Список студентів */}
      <div className="bg-white p-8 rounded-[30px] shadow-sm border border-gray-100">
        <h2 className="text-2xl font-bold text-brand-dark mb-6">Список студентів</h2>
        
        {loading ? (
          <p className="text-gray-500">Завантаження...</p>
        ) : students.length === 0 ? (
          <div className="text-center py-10 bg-gray-50 rounded-[20px] border border-dashed border-gray-300">
            <p className="text-gray-500 font-medium">Жодного студента ще не знайдено.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {students.map((student) => {
              const branchName = branches.find(b => b.id === student.branch)?.name || `Філія #${student.branch}`;
              return (
                <div key={student.id} className="bg-slate-50 p-6 rounded-3xl border border-gray-100 hover:shadow-md transition-shadow duration-300 relative flex flex-col">
                  <button 
                    onClick={() => handleToggleStatus(student)}
                    type="button"
                    title="Натисніть, щоб змінити статус"
                    className={`absolute top-6 right-6 px-3 py-1 rounded-full text-xs font-bold cursor-pointer transition-colors duration-300 ${
                      student.status === 'ACTIVE' 
                        ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                        : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                    }`}
                  >
                    {student.status === 'ACTIVE' ? 'Активний' : 'Архівований'}
                  </button>
                  
                  <h3 className="text-xl font-bold text-brand-dark mb-3 pr-20 truncate">{student.first_name} {student.last_name}</h3>
                  
                  <div className="space-y-1.5 text-sm text-gray-600 flex-1">
                    <p className="truncate"><span className="font-semibold text-gray-800">Філія:</span> {branchName}</p>
                    {student.phone && <p className="truncate"><span className="font-semibold text-gray-800">Телефон:</span> {student.phone}</p>}
                    {student.date_of_birth && <p className="truncate"><span className="font-semibold text-gray-800">Дата народження:</span> {student.date_of_birth}</p>}
                  </div>
                  
                  {/* Кнопки у картках */}
                  <div className="mt-6 pt-4 border-t border-gray-200 flex justify-between items-center">
                    <button 
                      onClick={() => handleOpenDetails(student)} 
                      className="text-brand-light bg-brand-light/10 px-4 py-2 rounded-xl font-semibold hover:bg-brand-light hover:text-white transition-colors text-sm cursor-pointer"
                    >
                      Детальніше
                    </button>
                    <button 
                      onClick={() => handleEditClick(student)} 
                      className="text-gray-400 hover:text-brand-dark font-semibold transition-colors text-sm cursor-pointer"
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

      {/* Модалка детальніше */}
      {detailModalOpen && selectedStudentDetail && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 md:p-8 rounded-[30px] w-full max-w-3xl shadow-xl max-h-[90vh] overflow-y-auto">
            
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-brand-dark">
                  {selectedStudentDetail.first_name} {selectedStudentDetail.last_name}
                </h2>
                <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-bold ${selectedStudentDetail.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                  {selectedStudentDetail.status === 'ACTIVE' ? 'Активний' : 'Архівований'}
                </span>
              </div>
              <button onClick={() => setDetailModalOpen(false)} className="bg-gray-100 text-gray-600 hover:bg-gray-200 w-10 h-10 rounded-full font-bold cursor-pointer flex items-center justify-center">
                ✕
              </button>
            </div>

            {loadingDetails ? (
              <div className="py-10 text-center text-gray-500 font-medium">Завантаження інформації...</div>
            ) : (
              <div className="space-y-8">
                
                {/* Особиста інформація */}
                <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100">
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Контактна інформація</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
                    <p><span className="font-semibold text-gray-900">Телефон:</span> {selectedStudentDetail.phone || '—'}</p>
                    <p><span className="font-semibold text-gray-900">Email:</span> {selectedStudentDetail.email || '—'}</p>
                    <p><span className="font-semibold text-gray-900">Дата народження:</span> {selectedStudentDetail.date_of_birth || '—'}</p>
                    <p><span className="font-semibold text-gray-900">Адреса:</span> {selectedStudentDetail.address || '—'}</p>
                  </div>
                </div>

                {/* Інформація про батьків */}
                {detailParent && (
                  <div className="bg-blue-50/50 p-5 rounded-2xl border border-blue-100">
                    <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wider mb-4">Батьки / Опікуни</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
                      <p><span className="font-semibold text-gray-900">ПІБ:</span> {detailParent.name}</p>
                      <p><span className="font-semibold text-gray-900">Ким доводиться:</span> {detailParent.relationship || '—'}</p>
                      <p><span className="font-semibold text-gray-900">Телефон:</span> {detailParent.phone}</p>
                      <p><span className="font-semibold text-gray-900">Email:</span> {detailParent.email || '—'}</p>
                    </div>
                  </div>
                )}

                {/* Підписки */}
                <div>
                  <h3 className="text-lg font-bold text-brand-dark mb-4">Активні підписки</h3>
                  {detailSubscriptions.length === 0 ? (
                    <p className="text-sm text-gray-500 italic">Немає призначених планів.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {detailSubscriptions.map(sub => (
                        <div key={sub.id} className="bg-white border border-gray-200 p-4 rounded-xl flex flex-col gap-1">
                          <span className="font-bold text-brand-dark">{sub.plan_name}</span>
                          <span className="text-sm text-gray-500">Предмет: <span className="font-semibold text-gray-700">{sub.subject_name}</span></span>
                          <span className="text-xs text-gray-400">Початок: {sub.start_date}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Історія відвідуваності */}
                <div>
                  <div className="flex justify-between items-end mb-4">
                    <h3 className="text-lg font-bold text-brand-dark">Історія відвідуваності</h3>
                    
                    {/* Блок статистики */}
                    {detailAttendance.length > 0 && (
                      <div className="flex gap-3 text-sm">
                        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-lg font-bold shadow-sm">
                          Відвідав: {detailAttendance.filter(r => r.status === 'PRESENT').length}
                        </span>
                        <span className="bg-red-100 text-red-700 px-3 py-1 rounded-lg font-bold shadow-sm">
                          Пропустив: {detailAttendance.filter(r => r.status === 'ABSENT').length}
                        </span>
                      </div>
                    )}
                  </div>

                  {detailAttendance.length === 0 ? (
                    <p className="text-sm text-gray-500 italic bg-gray-50 p-4 rounded-xl border border-gray-100">
                      Історія відсутня. Студент ще не був відмічений на жодному уроці.
                    </p>
                  ) : (
                    <div className="overflow-x-auto bg-white border border-gray-200 rounded-xl custom-scroll">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-600">
                          <tr>
                            <th className="px-4 py-3 font-semibold border-b border-gray-200">Дата</th>
                            <th className="px-4 py-3 font-semibold border-b border-gray-200">Предмет</th>
                            <th className="px-4 py-3 font-semibold border-b border-gray-200">Статус</th>
                            <th className="px-4 py-3 font-semibold border-b border-gray-200">Нотатки вчителя</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {detailAttendance.map(record => (
                            <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-4 py-3 text-gray-800 font-medium whitespace-nowrap">
                                {record.lesson_date || '—'}
                              </td>
                              <td className="px-4 py-3 text-brand-dark font-semibold">
                                {record.subject_name || `Урок #${record.lesson}`}
                              </td>
                              <td className="px-4 py-3">
                                <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${record.status === 'PRESENT' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                  {record.status === 'PRESENT' ? 'Присутній' : 'Відсутній'}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-gray-500 italic max-w-[200px] truncate" title={record.note}>
                                {record.note || '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}