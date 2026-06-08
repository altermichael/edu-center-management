import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import api from "../api";

export default function Attendance() {
  const { lessonId } = useParams();
  const navigate = useNavigate();

  const [lesson, setLesson] = useState(null);
  const [participants, setParticipants] = useState([]);
  
  const [attendanceData, setAttendanceData] = useState({});
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Якщо немає ID (тобто зайшли через сайдбар), не робимо запитів
    if (lessonId) {
      fetchLessonData();
    }
  }, [lessonId]);

  const fetchLessonData = async () => {
    try {
      setLoading(true);
      setError("");
      
      // Дані уроку
      const lessonRes = await api.get(`api/v1/schedule/lessons/${lessonId}/`);
      const currentLesson = lessonRes.data;
      setLesson(currentLesson);

      // Якщо урок скасовано, блокуємо доступ
      if (currentLesson.status === 'CANCELLED') {
        setError("Неможливо відмітити відвідуваність для скасованого уроку.");
        setLoading(false);
        return;
      }

      // Визначаємо індивідуальний чи груповий
      let studentsList = [];
      if (currentLesson.student) {
        // Індивідуальний
        const studentRes = await api.get(`api/v1/students/students/${currentLesson.student}/`);
        studentsList = [studentRes.data];
      } else if (currentLesson.group) {
        // Груповий
        const groupRes = await api.get(`api/v1/students/groups/${currentLesson.group}/`);
        const groupStudents = groupRes.data.students || []; 

        // Перевіряємо, чи бекенд повернув масив ID (тобто чисел)
        if (groupStudents.length > 0 && typeof groupStudents[0] === 'number') {
          // Якщо це числа, то завантажуємо кожного студента повністю
          const studentsPromises = groupStudents.map(id => api.get(`api/v1/students/students/${id}/`));
          const responses = await Promise.all(studentsPromises);
          studentsList = responses.map(res => res.data);
        } else {
          // Якщо бекенд одразу повернув об'єкти
          studentsList = groupStudents;
        }
      }
      setParticipants(studentsList);

      // данні відвідуваності
      const attendanceRes = await api.get(`api/v1/schedule/attendances/?lesson=${lessonId}`);
      const existingRecords = attendanceRes.data.results || attendanceRes.data;
      
      const initialAttendance = {};
      
      studentsList.forEach(student => {
        const record = existingRecords.find(r => r.student === student.id);
        if (record) {
          initialAttendance[student.id] = { id: record.id, status: record.status, note: record.note || "" };
        } else {
          initialAttendance[student.id] = { id: null, status: "PRESENT", note: "" };
        }
      });
      
      setAttendanceData(initialAttendance);

    } catch (err) {
      console.error(err);
      setError("Не вдалося завантажити дані уроку. Перевірте підключення.");
    } finally {
      setLoading(false);
    }
  };

  const getReturnPath = () => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      const decoded = jwtDecode(token);
      return decoded.role.toUpperCase() === "TEACHER" ? "/my-schedule" : "/schedule";
    }
    return "/schedule";
  };

  const returnPath = getReturnPath();

  const handleStatusChange = (studentId, newStatus) => {
    setAttendanceData(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], status: newStatus }
    }));
  };

  const handleNoteChange = (studentId, newNote) => {
    setAttendanceData(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], note: newNote }
    }));
  };

  const handleSaveAttendance = async () => {
    try {
      setSaving(true);
      setError("");

      const promises = Object.keys(attendanceData).map(studentId => {
        const data = attendanceData[studentId];
        const payload = {
          lesson: parseInt(lessonId),
          student: parseInt(studentId),
          status: data.status,
          note: data.note
        };

        if (data.id) {
          return api.patch(`api/v1/schedule/attendances/${data.id}/`, payload);
        } else {
          return api.post(`api/v1/schedule/attendances/`, payload);
        }
      });

      await Promise.all(promises);
      navigate(getReturnPath());
    } catch (err) {
      console.error(err);
      const errorMessage = err.response?.data?.lesson?.[0] || "Помилка збереження відвідуваності. Спробуйте ще раз.";
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  // Заглушка
  if (!lessonId) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto mt-10">
        <div className="bg-white p-12 rounded-[30px] shadow-sm border border-gray-100 flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-blue-50 text-brand-dark rounded-full flex items-center justify-center text-3xl mb-6">📅</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Оберіть урок для відмітки</h2>
          <p className="text-gray-500 font-medium max-w-md">
            Щоб відмітити присутність студентів, будь ласка, перейдіть до загального розкладу та оберіть конкретний урок.
          </p>
          <button 
            onClick={() => navigate(getReturnPath())}
            className="mt-8 px-8 py-3.5 bg-brand-light hover:bg-brand-dark text-white rounded-2xl font-bold shadow-sm shadow-brand-light/30 transition-all cursor-pointer"
          >
            Перейти до розкладу
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="text-center py-10 text-brand-dark font-bold text-xl">Завантаження даних...</div>;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      
      <div className="flex items-center gap-4 bg-white p-6 rounded-[30px] shadow-sm border border-gray-100">
        <button 
          onClick={() => navigate(getReturnPath())}
          className="w-12 h-12 flex items-center justify-center bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-brand-dark rounded-full font-bold transition-colors cursor-pointer"
        >
          ←
        </button>
        <div>
          <h1 className="text-2xl font-bold text-brand-dark">Відвідуваність уроку</h1>
          {lesson && (
            <p className="text-sm font-medium text-gray-500 mt-1">
              {lesson.date} • {lesson.start_time.substring(0,5)} - {lesson.end_time.substring(0,5)}
            </p>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm font-bold border border-red-100">
          🚨 {error}
        </div>
      )}

      {/* Список студентів */}
      {!loading && lesson?.status !== 'CANCELLED' && (
        <div className="bg-white p-8 rounded-[30px] shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">Список студентів</h2>
            <span className="bg-blue-50 text-brand-dark px-4 py-2 rounded-xl text-sm font-bold">
              Всього: {participants.length}
            </span>
          </div>

          {participants.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-[20px] border border-dashed border-gray-300">
              <p className="text-gray-500 font-medium text-lg">Студентів не знайдено.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {participants.map(student => {
                // перевіряємо, чи є ім'я, щоб реакт більше не крашився і рендеримо
                const initial1 = student?.first_name ? student.first_name[0] : "?";
                const initial2 = student?.last_name ? student.last_name[0] : "";

                return (
                  <div key={student.id} className="flex flex-col md:flex-row items-start md:items-center justify-between bg-slate-50 p-5 rounded-2xl border border-gray-100 hover:shadow-md transition-shadow gap-4">
                    
                    {/* Інфо про студента */}
                    <div className="flex items-center gap-4 min-w-[250px]">
                      <div className="w-12 h-12 bg-brand-light/10 text-brand-dark rounded-full flex items-center justify-center font-bold text-lg">
                        {initial1}{initial2}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-800">
                          {student?.first_name || "Невідомий"} {student?.last_name || "Студент"}
                        </h3>
                        <p className="text-xs text-gray-500 font-medium">ID: {student?.id}</p>
                      </div>
                    </div>

                    {/* Перемикач присутній / відсутній */}
                    <div className="flex bg-gray-200/60 p-1 rounded-2xl w-full md:w-auto">
                      <button 
                        onClick={() => handleStatusChange(student.id, 'PRESENT')}
                        className={`flex-1 md:w-32 py-2.5 text-sm font-bold rounded-xl transition-all cursor-pointer ${
                          attendanceData[student.id]?.status === 'PRESENT' 
                            ? "bg-white text-green-600 shadow-sm" 
                            : "text-gray-500 hover:text-gray-700"
                        }`}
                      >
                        ✅ Присутній
                      </button>
                      <button 
                        onClick={() => handleStatusChange(student.id, 'ABSENT')}
                        className={`flex-1 md:w-32 py-2.5 text-sm font-bold rounded-xl transition-all cursor-pointer ${
                          attendanceData[student.id]?.status === 'ABSENT' 
                            ? "bg-white text-red-500 shadow-sm" 
                            : "text-gray-500 hover:text-gray-700"
                        }`}
                      >
                        ❌ Відсутній
                      </button>
                    </div>

                    {/* Нотатка */}
                    <div className="w-full md:w-1/3">
                      <input 
                        type="text" 
                        placeholder="Додати нотатку (необов'язково)"
                        value={attendanceData[student.id]?.note || ""}
                        onChange={(e) => handleNoteChange(student.id, e.target.value)}
                        className="base-input !py-2.5 text-sm"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {participants.length > 0 && (
            <div className="flex justify-end pt-8 mt-6 border-t border-gray-100">
              <button 
                onClick={handleSaveAttendance}
                disabled={saving}
                className={`px-8 py-4 text-white rounded-2xl font-bold shadow-sm shadow-brand-light/30 transition-all text-lg cursor-pointer ${
                  saving ? 'bg-gray-400 cursor-not-allowed' : 'bg-brand-light hover:bg-brand-dark'
                }`}
              >
                {saving ? 'Збереження...' : 'Зберегти відвідуваність'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}