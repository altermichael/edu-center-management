import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Branches from "./pages/Branches";
import Teachers from "./pages/Teachers";
import Students from "./pages/Students";
import Groups from "./pages/Groups";
import Subjects from "./pages/Subjects";
import SubscriptionPlans from "./pages/SubscriptionPlans";
import Schedule from "./pages/Schedule";
import Templates from "./pages/Templates";
import Attendance from "./pages/Attendance";
import Reports from "./pages/Reports";
import MyStudents from "./pages/MyStudents";
import MySchedule from "./pages/MySchedule";
import Layout from "./components/Layout";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/branches" element={<Branches />} />
          <Route path="/teachers" element={<Teachers />} />
          <Route path="/students" element={<Students />} />
          <Route path="/groups" element={<Groups />} />
          <Route path="/subjects" element={<Subjects />} />
          <Route path="/subscriptions" element={<SubscriptionPlans />} />
          <Route path="/schedule" element={<Schedule />} />
          <Route path="/templates" element={<Templates />} />
          <Route path="/attendance" element={<Attendance />} />
          <Route path="/attendance/:lessonId" element={<Attendance />} />
          <Route path="/reports" element={<Reports />} />

          <Route path="/my-students" element={<MyStudents />} />
          <Route path="/my-schedule" element={<MySchedule />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;