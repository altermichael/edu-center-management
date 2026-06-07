import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api";

export default function Attendance() {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  
  const [lesson, setLesson] = useState(null);
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (lessonId) {
      loadLessonAndStudents();
    } else {
      setLoading(false); // Ми не в режимі маркування конкретного уроку
    }
  }, [lessonId]);

  const loadLessonAndStudents = async () => {
    try {
      setLoading(true);
      // 1. Отримуємо дані уроку
      const lessonRes = await api.get(`api/v1/schedule/lessons/${lessonId}/`);
      setLesson(lessonRes.data);

      // 2. Отримуємо список студентів (група або індивідуальний)
      let studentsList = [];
      if (lessonRes.data.student) {
        const sRes = await api.get(`api/v1/students/students/${lessonRes.data.student}/`);
        studentsList = [sRes.data];
      } else if (lessonRes.data.group) {
        const gRes = await api.get(`api/v1/students/groups/${lessonRes.data.group}/`);
        const groupStudentIds = gRes.data.students || [];
        const sPromises = groupStudentIds.map(id => api.get(`api/v1/students/students/${id}/`));
        const sResults = await Promise.all(sPromises);
        studentsList = sResults.map(r => r.data);
      }
      setStudents(studentsList);

      // 3. Отримуємо існуючі записи відвідуваності
      const attRes = await api.get(`api/v1/schedule/attendances/?lesson=${lessonId}`);
      const initialAttendance = {};
      attRes.data.forEach(item => {
        initialAttendance[item.student] = { id: item.id, status: item.status, note: item.note || '' };
      });
      setAttendance(initialAttendance);
    } catch (err) {
      setError("Не вдалося завантажити дані. Перевірте з'єднання.");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (studentId, status) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], status }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      for (const student of students) {
        const record = attendance[student.id];
        if (!record || !record.status) continue;

        const payload = { lesson: lessonId, student: student.id, status: record.status, note: record.note };

        if (record.id) {
          await api.patch(`api/v1/schedule/attendances/${record.id}/`, payload);
        } else {
          await api.post("api/v1/schedule/attendances/", payload);
        }
      }
      navigate("/schedule");
    } catch (err) {
      setError("Помилка при збереженні.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="p-8">Завантаження...</div>;

  // РЕЖИМ МАРКУВАННЯ (Якщо є lessonId)
  if (lessonId) {
    return (
      <div className="bg-white p-8 rounded-[30px] shadow-sm">
        <h2 className="text-2xl font-bold text-brand-dark mb-1">{lesson?.subject_name}</h2>
        <p className="text-gray-500 mb-6 font-medium">{lesson?.date} — {lesson?.start_time.substring(0,5)}</p>
        
        {error && <div className="bg-red-50 text-red-600 p-4 rounded-2xl mb-6 text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {students.map(student => (
            <div key={student.id} className="flex items-center gap-4 p-6 bg-gray-50 rounded-2xl border border-gray-100">
              <span className="flex-1 font-bold">{student.first_name} {student.last_name}</span>
              <div className="flex gap-2">
                <button type="button" onClick={() => handleStatusChange(student.id, 'PRESENT')} className={`px-4 py-2 rounded-xl text-sm font-bold ${attendance[student.id]?.status === 'PRESENT' ? 'bg-green-100 text-green-700' : 'bg-white border'}`}>Присутній</button>
                <button type="button" onClick={() => handleStatusChange(student.id, 'ABSENT')} className={`px-4 py-2 rounded-xl text-sm font-bold ${attendance[student.id]?.status === 'ABSENT' ? 'bg-red-100 text-red-700' : 'bg-white border'}`}>Відсутній</button>
              </div>
            </div>
          ))}
          <div className="flex justify-end gap-3 pt-6 border-t">
            <button type="button" onClick={() => navigate("/schedule")} className="px-6 py-3.5 bg-gray-100 font-bold rounded-2xl">Назад</button>
            <button type="submit" disabled={isSubmitting} className="px-8 py-3.5 bg-brand-light text-white font-bold rounded-2xl">Зберегти</button>
          </div>
        </form>
      </div>
    );
  }

  // РЕЖИМ СПИСКУ (Якщо натиснули на "Відвідуваність" у меню)
  return (
    <div className="bg-white p-8 rounded-[30px] shadow-sm">
      <h2 className="text-2xl font-bold text-brand-dark mb-6">Відвідуваність</h2>
      <p className="text-gray-500">Будь ласка, перейдіть у <span className="font-bold text-brand-light cursor-pointer" onClick={() => navigate("/schedule")}>Розклад</span> та виберіть урок для маркування.</p>
    </div>
  );
}