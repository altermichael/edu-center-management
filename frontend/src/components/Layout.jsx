import { useState, useEffect } from "react";
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import api from "../api"; // Не забудь додати імпорт api, якщо його там не було!

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [userRole, setUserRole] = useState(null); 
  // НОВИЙ СТЕЙТ: Зберігаємо дані користувача (ім'я, телефон)
  const [userData, setUserData] = useState(null); 

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUserRole(decoded.role?.toUpperCase());
        
        // Дістаємо ID користувача з токена (SimpleJWT зберігає його як user_id)
        const userId = decoded.user_id || decoded.id;
        
        // Якщо ID є, робимо запит до бекенду
        if (userId) {
          fetchUserData(userId);
        }
      } catch (error) {
        handleLogout();
      }
    } else {
      navigate("/login");
    }
  }, [navigate]);

  // ФУНКЦІЯ: Завантаження профілю
  const fetchUserData = async (id) => {
    try {
      const response = await api.get(`api/v1/users/${id}/`);
      setUserData(response.data);
    } catch (error) {
      console.error("Не вдалося завантажити профіль користувача", error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    navigate("/login");
  };

  const isActive = (path) => location.pathname === path ? "bg-white/20 font-semibold" : "hover:bg-white/10";

  if (!userRole) {
    return <div className="h-screen bg-slate-50 flex items-center justify-center text-gray-500">Завантаження...</div>;
  }

  return (
    <div className="max-w-[1800px] mx-auto flex h-screen overflow-hidden bg-slate-50">
      
      {/* Sidebar (Залишається без змін) */}
      <div className="max-h-[1000px] flex p-4 shrink-0"> 
        <div className="w-64 h-full rounded-[30px] bg-brand-dark text-white flex flex-col shadow-sm">
          <div className="p-6 shrink-0">
            <h1 className="text-2xl font-bold text-white tracking-wider">EduCenter</h1>
          </div>

          <nav className="flex-1 min-h-0 overflow-y-auto px-4 space-y-2 mt-4 custom-scroll">
            {userRole === "ADMIN" && (
              <>
                <Link to="/dashboard" className={`block px-5 py-3.5 rounded-2xl transition-all duration-200 ${isActive('/dashboard')}`}>Головна</Link>
                <Link to="/branches" className={`block px-5 py-3.5 rounded-2xl transition-all duration-200 ${isActive('/branches')}`}>Філії</Link>
                <Link to="/subjects" className={`block px-5 py-3.5 rounded-2xl transition-all duration-200 ${isActive('/subjects')}`}>Предмети</Link>
                <Link to="/teachers" className={`block px-5 py-3.5 rounded-2xl transition-all duration-200 ${isActive('/teachers')}`}>Вчителі</Link>
                <Link to="/students" className={`block px-5 py-3.5 rounded-2xl transition-all duration-200 ${isActive('/students')}`}>Студенти</Link>
                <Link to="/groups" className={`block px-5 py-3.5 rounded-2xl transition-all duration-200 ${isActive('/groups')}`}>Групи</Link>
                <Link to="/subscriptions" className={`block px-5 py-3.5 rounded-2xl transition-all duration-200 ${isActive('/subscriptions')}`}>Підписки</Link>
                <Link to="/schedule" className={`block px-5 py-3.5 rounded-2xl transition-all duration-200 ${isActive('/schedule')}`}>Розклад</Link>
                <Link to="/templates" className={`block px-5 py-3.5 rounded-2xl transition-all duration-200 ${isActive('/templates')}`}>Шаблони уроків</Link>
                <Link to="/attendance" className={`block px-5 py-3.5 rounded-2xl transition-all duration-200 ${isActive('/attendance')}`}>Відвідуваність</Link>
                <Link to="/reports" className={`block px-5 py-3.5 rounded-2xl transition-all duration-200 ${isActive('/reports')}`}>Звіти</Link>
              </>
            )}

            {userRole === "TEACHER" && (
              <>
                <Link to="/dashboard" className={`block px-5 py-3.5 rounded-2xl transition-all duration-200 ${isActive('/dashboard')}`}>Головна</Link>
                <Link to="/my-schedule" className={`block px-5 py-3.5 rounded-2xl transition-all duration-200 ${isActive('/my-schedule')}`}>Мій розклад</Link>
                <Link to="/my-students" className={`block px-5 py-3.5 rounded-2xl transition-all duration-200 ${isActive('/my-students')}`}>Мої студенти</Link>
                <Link to="/attendance" className={`block px-5 py-3.5 rounded-2xl transition-all duration-200 ${isActive('/attendance')}`}>Відвідуваність</Link>
              </>
            )}
          </nav>

          <div className="p-4 border-t border-white/10 shrink-0">
            <button
              onClick={handleLogout}
              className="w-full bg-white/10 hover:bg-red-500/80 text-white px-4 py-3 rounded-xl transition-colors duration-300 cursor-pointer"
            >
              Вийти
            </button>
          </div>
        </div>
      </div>

      {/* Main */}
      <main className="flex-1 flex flex-col h-full p-4 overflow-hidden">
        
        {/* Header */}
        <header className="h-16 w-full rounded-[30px] bg-white flex justify-end items-center px-8 shadow-sm shrink-0">
          
          {/* Профіль і Роль */}
          <div className="flex items-center gap-6">
            
            {userData ? (
              <div className="flex items-center gap-3 border-r border-gray-200 pr-6">
                <div className="flex flex-col items-center gap-1">
                  <span className="text-sm font-bold text-gray-800 leading-tight">
                    {userData.first_name} {userData.last_name}
                  </span>
                  <span className="text-xs text-gray-500 font-medium leading-tight">
                    {userData.phone}
                  </span>
                </div>
              </div>
            ) : (
              <div className="border-r border-gray-200 pr-6 text-sm text-gray-400">
                Завантаження профілю...
              </div>
            )}

            {/* Роль */}
            <div className="text-gray-600 font-medium text-sm flex items-center gap-2">
              {userRole === "ADMIN" ? "Адміністратор" : "Вчитель"}
            </div>
            
          </div>
        </header>

        {/* Підставка сторінок */}
        <div className="flex-1 mt-4 overflow-y-auto custom-scroll-2 pr-2 px-[2px] pb-[2px]">
          <Outlet />
        </div>
      </main>
    </div>
  );
}