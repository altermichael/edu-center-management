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

  // Стан форми студента
  const [editingId, setEditingId] = useState(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [branchId, setBranchId] = useState("");
  
  // Стан форми батьків
  const [parentId, setParentId] = useState(null);
  const [parentName, setParentName] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [parentRelationship, setParentRelationship] = useState("");

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
      
      {/* ФОРМА */}
      <div className="bg-white p-8 rounded-[30px] shadow-sm">
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
              <select required value={branchId} onChange={e => setBranchId(e.target.value)} className="base-input">
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
            {editingId && <button type="button" onClick={handleCancelEdit} className="bg-gray-100 text-gray-600 font-bold py-3.5 px-6 rounded-2xl hover:bg-gray-200">Скасувати</button>}
            <button type="submit" className="bg-brand-light text-white font-bold py-3.5 px-8 rounded-2xl hover:bg-brand-dark transition-colors shadow-sm shadow-brand-light/30 cursor-pointer">
              {editingId ? "Зберегти зміни" : "Зареєструвати"}
            </button>
          </div>
        </form>
      </div>

      {/* ПАНЕЛЬ ПОШУКУ ТА ФІЛЬТРІВ */}
      <div className="bg-white p-6 rounded-[30px] shadow-sm flex flex-col md:flex-row gap-4 items-center">
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

      {/* СПИСОК СТУДЕНТІВ */}
      <div className="bg-white p-8 rounded-[30px] shadow-sm">
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
                <div key={student.id} className="bg-slate-50 p-6 rounded-3xl border border-gray-100 hover:shadow-md transition-shadow duration-300 relative">
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
                  
                  <div className="space-y-1.5 text-sm text-gray-600">
                    <p className="truncate"><span className="font-semibold text-gray-800">Філія:</span> {branchName}</p>
                    {student.phone && <p className="truncate"><span className="font-semibold text-gray-800">Телефон:</span> {student.phone}</p>}
                    {student.date_of_birth && <p className="truncate"><span className="font-semibold text-gray-800">Дата народження:</span> {student.date_of_birth}</p>}
                  </div>
                  
                  <div className="mt-6 pt-4 border-t border-gray-200 flex justify-end">
                    <button 
                      onClick={() => handleEditClick(student)} 
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