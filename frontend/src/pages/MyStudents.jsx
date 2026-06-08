import { useState, useEffect } from "react";
import api from "../api";

export default function MyStudents() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Стан для модалки деталей студента
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [parentData, setParentData] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, [searchQuery]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError("");
      
      const params = new URLSearchParams();
      if (searchQuery) params.append("search", searchQuery);
      // Отримуємо тільки активних студентів
      params.append("status", "ACTIVE"); 

      const response = await api.get(`api/v1/students/students/?${params.toString()}`);
      setStudents(response.data.results || response.data);
    } catch (err) {
      console.error("Помилка при завантаженні студентів", err);
      setError("Не вдалося завантажити список студентів. Перевірте з'єднання.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDetails = async (student) => {
    setSelectedStudent(student);
    setLoadingDetails(true);
    setParentData(null);

    try {
      // Якщо у студента є батьки, завантажуємо їхні контакти
      if (student.parent) {
        const parentRes = await api.get(`api/v1/students/parents/${student.parent}/`);
        setParentData(parentRes.data);
      }
    } catch (err) {
      console.error("Помилка завантаження даних батьків", err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const closeModal = () => {
    setSelectedStudent(null);
    setParentData(null);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Панель пошуку */}
      <div className="bg-white p-6 rounded-[30px] shadow-sm border border-gray-100 flex items-center">
        <input 
          type="text" 
          placeholder="Пошук за ім'ям або прізвищем учня..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-brand-light focus:border-brand-light focus:bg-white outline-none transition-all duration-200 text-gray-700"
        />
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm font-medium border border-red-100">
          🚨 {error}
        </div>
      )}

      {/* Список студентів */}
      <div className="bg-white p-8 rounded-[30px] shadow-sm border border-gray-100 min-h-[400px]">
        <h2 className="text-2xl font-bold text-brand-dark mb-6">Мої студенти</h2>
        
        {loading ? (
          <div className="text-center py-10 text-brand-dark font-bold text-xl">Завантаження учнів...</div>
        ) : students.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 rounded-[20px] border border-dashed border-gray-300">
            <p className="text-gray-500 font-medium text-lg">У вас поки немає призначених студентів.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {students.map((student) => (
              <div key={student.id} className="bg-slate-50 p-6 rounded-3xl border border-gray-100 hover:shadow-md transition-shadow duration-300 relative flex flex-col">
                
                <div className="flex items-center gap-4 mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-brand-dark">{student.first_name} {student.last_name}</h3>
                    <p className="text-xs text-gray-500 font-medium mt-1">Філія: {student.branch_name}</p>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm text-gray-600 flex-1 bg-white p-4 rounded-2xl border border-gray-100">
                  <p className="flex items-center gap-2">
                    <span className="font-semibold text-gray-800">Телефон:</span> 
                    {student.phone || 'Не вказано'}
                  </p>
                  <p className="flex items-center gap-2 truncate">
                    <span className="font-semibold text-gray-800">Email:</span> 
                    {student.email || 'Не вказано'}
                  </p>
                </div>
                
                <div className="mt-5 pt-4 border-t border-gray-200">
                  <button 
                    onClick={() => handleOpenDetails(student)} 
                    className="w-full text-center text-brand-light bg-brand-light/10 px-4 py-3 rounded-xl font-bold hover:bg-brand-light hover:text-white transition-colors cursor-pointer"
                  >
                    Переглянути контакти
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Модалка з деталями */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 md:p-8 rounded-[30px] w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto custom-scroll">
            
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-blue-50 text-brand-dark rounded-full flex items-center justify-center font-bold text-2xl border border-blue-100">
                  {selectedStudent.first_name[0]}{selectedStudent.last_name[0]}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-brand-dark">
                    {selectedStudent.first_name} {selectedStudent.last_name}
                  </h2>
                  <p className="text-sm text-gray-500 font-medium mt-1">ID Студента: #{selectedStudent.id}</p>
                </div>
              </div>
              <button onClick={closeModal} className="bg-gray-100 text-gray-600 hover:bg-gray-200 w-10 h-10 rounded-full font-bold cursor-pointer flex items-center justify-center transition-colors">
                ✕
              </button>
            </div>

            {loadingDetails ? (
              <div className="py-10 text-center text-gray-500 font-medium">Завантаження інформації...</div>
            ) : (
              <div className="space-y-6">
                
                {/* Інформація про студента */}
                <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100">
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Особисті контакти студента</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
                    <p><span className="font-semibold text-gray-900 block mb-1">Телефон:</span> {selectedStudent.phone || '—'}</p>
                    <p><span className="font-semibold text-gray-900 block mb-1">Email:</span> {selectedStudent.email || '—'}</p>
                    <p><span className="font-semibold text-gray-900 block mb-1">Дата народження:</span> {selectedStudent.date_of_birth || '—'}</p>
                    <p><span className="font-semibold text-gray-900 block mb-1">Адреса:</span> {selectedStudent.address || '—'}</p>
                  </div>
                </div>

                {/* Інформація про батьків */}
                <div className="bg-blue-50/50 p-5 rounded-2xl border border-blue-100">
                  <h3 className="text-sm font-bold text-blue-500 uppercase tracking-wider mb-4">Контакти батьків / опікунів</h3>
                  {parentData ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
                      <p><span className="font-semibold text-gray-900 block mb-1">ПІБ:</span> {parentData.name}</p>
                      <p><span className="font-semibold text-gray-900 block mb-1">Ким доводиться:</span> {parentData.relationship || '—'}</p>
                      <p><span className="font-semibold text-gray-900 block mb-1">Телефон:</span> {parentData.phone}</p>
                      <p><span className="font-semibold text-gray-900 block mb-1">Email:</span> {parentData.email || '—'}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic">Інформація про батьків відсутня у базі даних.</p>
                  )}
                </div>

              </div>
            )}
            
            <div className="mt-8 flex justify-end">
              <button onClick={closeModal} className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors cursor-pointer">
                Закрити
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}