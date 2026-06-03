import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function Login() {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await axios.post("http://localhost:8000/api/v1/auth/login/", {
        phone: phone,
        password: password,
      });

      localStorage.setItem("accessToken", response.data.access);
      localStorage.setItem("refreshToken", response.data.refresh);

      navigate("/dashboard");
    } catch (err) {
      setError("Невірний номер телефону або пароль");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      
      <div className="absolute top-0 left-0 w-64 h-full bg-brand-light hidden md:block"></div>
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-brand-dark hidden md:block"></div>

      <div className="max-w-md w-full bg-white p-10 rounded-[2rem] shadow-xl border border-gray-100 z-10">
        <h2 className="text-3xl font-bold text-center text-brand-dark mb-8">
          Вхід у систему
        </h2>
        
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-semibold text-brand-dark mb-2">
              Номер телефону
            </label>
            <input
              type="text"
              className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-brand-light focus:border-brand-light focus:bg-white outline-none transition-all duration-200 text-gray-700"
              placeholder="+380xxx"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-brand-dark mb-2">
              Пароль
            </label>
            <input
              type="password"
              className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-brand-light focus:border-brand-light focus:bg-white outline-none transition-all duration-200 text-gray-700"
              placeholder="xxxxxx"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="h-[25px] w-full">
            {error && (
              <div className="w-full h-[10px] bg-red-50 text-red-600 p-5 rounded-2xl text-center text-sm font-medium border border-red-100 flex items-center justify-center">
                {error}
              </div>
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-brand-light text-white font-bold py-3.5 rounded-2xl hover:bg-brand-dark hover:cursor-pointer transition-colors duration-300 shadow-lg shadow-brand-light/30 mt-4"
          >
            Увійти
          </button>
        </form>
      </div>
    </div>
  );
}