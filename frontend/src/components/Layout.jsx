import { useState, useEffect } from "react";
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [userRole, setUserRole] = useState(null); 

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        // Зберігаємо роль (ADMIN або TEACHER)
        setUserRole(decoded.role.toUpperCase());
      } catch (error) {
        handleLogout();
      }
    } else {
      navigate("/login");
    }
  }, [navigate]);

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
    {/* Sidebar */}
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
      <header className="h-16 w-full rounded-[30px] bg-white flex items-center px-8 shadow-sm shrink-0">
        <div className="ml-auto flex items-center text-gray-600 font-medium">
          Роль: {userRole === "ADMIN" ? "Адміністратор" : "Вчитель"}
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