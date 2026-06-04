import { useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";

export default function Dashboard() {
  const [role, setRole] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setRole(decoded.role?.toUpperCase());
      } catch (e) {
        console.error("Помилка розшифровки токена");
      }
    }
  }, []);

  return (
    <div className="bg-white p-8 rounded-[30px] shadow-sm">
      <h1 className="text-3xl font-bold text-brand-dark mb-8">Головна панель</h1>
      
      {role === "ADMIN" && (
        <div className="bg-blue-50 p-8 rounded-3xl border border-blue-100">
          <h2 className="text-2xl font-bold text-blue-900 mb-3">👋 Вітаємо, Адміністраторе!</h2>
          <p className="text-blue-700 text-lg">
            Це ваш робочий простір. Загальна статистика по філіях, студентах, кількості уроків та відвідуваності.
          </p>
        </div>
      )}

      {role === "TEACHER" && (
        <div className="bg-emerald-50 p-8 rounded-3xl border border-emerald-100">
          <h2 className="text-2xl font-bold text-emerald-900 mb-3">👋 Вітаємо, Вчителю!</h2>
          <p className="text-emerald-700 text-lg">
            Це ваш особистий простір. Статистика ваших проведених уроків та відвідуваності ваших студентів.
          </p>
        </div>
      )}
    </div>
  );
}