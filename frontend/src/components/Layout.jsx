import { Outlet, Link, useNavigate } from "react-router-dom";

export default function Layout() {
  const navigate = useNavigate();
  
  const userRole = "ADMIN"; 

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    navigate("/login");
  };

  return (
    <div className="max-w-[1800px] mx-auto flex">
      {/* Sidebar */}
      <div className="min-h-screen bg-slate-50 flex p-4">
        <div className="w-64 rounded-[30px] bg-brand-dark text-white flex flex-col shadow-sm">
            <div className="p-6">
            <h1 className="text-2xl font-bold text-white tracking-wider">EduCenter</h1>
            </div>
            
            <nav className="flex-1 px-4 space-y-2 mt-4">
            {userRole === "ADMIN" && (
                <>
                <Link to="/dashboard" className="block px-4 py-3 rounded-xl hover:bg-white/10 transition">Дашборд</Link>
                <Link to="/branches" className="block px-4 py-3 rounded-xl hover:bg-white/10 transition">Філії</Link>
                <Link to="/subjects" className="block px-4 py-3 rounded-xl hover:bg-white/10 transition">Предмети</Link>
                <Link to="/students" className="block px-4 py-3 rounded-xl hover:bg-white/10 transition">Студенти</Link>
                <Link to="/groups" className="block px-4 py-3 rounded-xl hover:bg-white/10 transition">Групи</Link>
                <Link to="/schedule" className="block px-4 py-3 rounded-xl hover:bg-white/10 transition">Розклад</Link>
                </>
            )}

            {userRole === "TEACHER" && (
                <>
                <Link to="/my-schedule" className="block px-4 py-3 rounded-xl hover:bg-white/10 transition">Мій розклад</Link>
                <Link to="/attendance" className="block px-4 py-3 rounded-xl hover:bg-white/10 transition">Відвідуваність</Link>
                </>
            )}
            </nav>

            <div className="p-4 border-t border-white/10">
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
      <main className="flex-1 flex flex-col h-screen p-4">
        {/* Header */}
        <header className="h-16 rounded-[30px] bg-white flex items-center px-8 shadow-sm">
          <div className="ml-auto flex items-center text-gray-600 font-medium">
            Роль: {userRole}
          </div>
        </header>

        {/* Підставка сторінок */}
        <div className="flex-1 py-4">
          <Outlet />
        </div>
      </main>
    </div>
  );
}