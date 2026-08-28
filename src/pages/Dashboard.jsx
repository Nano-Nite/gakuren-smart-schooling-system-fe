import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LogOut,
  LayoutDashboard,
  Users,
  Calendar,
  FileText,
  Clock,
  Settings,
  Menu,
  X,
  CheckCircle,
  AlertCircle,
  User,
  Box,
  Shield,
  Signal,
  QrCode,
} from "lucide-react";
import { Helmet } from "react-helmet-async";
import { logoutUser } from "../utils/api";
import { TOKEN_KEYS } from "../config/api";

const Dashboard = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const userData = JSON.parse(sessionStorage.getItem("userData") || "{}");
  const menuItems = JSON.parse(sessionStorage.getItem("menuItems") || "[]");
  const permissions = JSON.parse(sessionStorage.getItem("permissions") || "[]");

  const handleLogout = async() => {
    try {
      await logoutUser(userData.email);
      navigate("/login");
    } catch(err) {
      console.error('Login error:', err)
    }
  };

  const iconMap = {
    Dashboard: LayoutDashboard,
    "QR Code": QrCode,
    "Teacher and Staff": Users,
    "Student Management": User,
    "Class Management": Box,
    Attendance: Calendar,
    Absence: Shield,
    Report: Signal,
    Setting: Settings,
  };

  const stats = [
    { title: "Kehadiran Guru", value: "18", total: "21", icon: "👨‍🏫" },
    { title: "Kehadiran Siswa", value: "421", total: "433", icon: "👥" },
    { title: "Keterlambatan Hari Ini", value: "7", icon: "⏰" },
  ];

  const mockPermissions = [
    { id: 1, name: "Admin", role: "Admin", status: "Mundur", date: "Jul 23" },
    {
      id: 2,
      name: "Cai Anuem",
      role: "Kepala Sekolah",
      status: "Mundur",
      date: "Jul 23",
    },
    {
      id: 3,
      name: "Ahmef Fazil",
      role: "Guru",
      status: "Mundur",
      date: "Jul 22",
    },
    {
      id: 4,
      name: "Hafis Tulbuni",
      role: "Staff",
      status: "Staro",
      date: "Jul 22",
    },
    {
      id: 5,
      name: "Bni Alqyoh",
      role: "Guru",
      status: "Mundur",
      date: "Jul 22",
    },
  ];

  const recentRecords = [
    {
      id: 1,
      name: "Haris Mustafi",
      officer: "Mustafa",
      time: "08:30",
      status: "HADIR",
      location: "Gedung Utama",
      score: "94%",
    },
    {
      id: 2,
      name: "Haris Mustafi",
      officer: "Mustafa",
      time: "08:30",
      status: "HADIR",
      location: "Gedung Utama",
      score: "94%",
    },
    {
      id: 3,
      name: "Haris Mustafi",
      officer: "Mustafa",
      time: "08:30",
      status: "HADIR",
      location: "Gedung Utama",
      score: "94%",
    },
    {
      id: 4,
      name: "Haris Mustafi",
      officer: "Mustafa",
      time: "08:30",
      status: "HADIR",
      location: "Gedung Utama",
      score: "94%",
    },
    {
      id: 5,
      name: "Haris Mustafi",
      officer: "Mustafa",
      time: "08:30",
      status: "HADIR",
      location: "Gedung Utama",
      score: "94%",
    },
    {
      id: 6,
      name: "Haris Mustafi",
      officer: "Mustafa",
      time: "08:30",
      status: "HADIR",
      location: "Gedung Utama",
      score: "94%",
    },
    {
      id: 7,
      name: "Haris Mustafi",
      officer: "Mustafa",
      time: "08:30",
      status: "HADIR",
      location: "Gedung Utama",
      score: "94%",
    },
    {
      id: 8,
      name: "Haris Mustafi",
      officer: "Mustafa",
      time: "08:30",
      status: "HADIR",
      location: "Gedung Utama",
      score: "94%",
    },
  ];

  const menuItemsData = sessionStorage.getItem(TOKEN_KEYS.MENU_ITEMS);
  const menusObject = menuItemsData ? JSON.parse(menuItemsData) : {};
  const menusArray = Object.values(menusObject);

  const mockMenuItems = [];

  for (let i = 0; i < menusArray.length; i++) {
    const labelText = menusArray[i];

    const IconComponent = iconMap[labelText] || FileText;

    mockMenuItems.push({
      icon: IconComponent,
      label: labelText,
      ...(i === 0 && { active: true }),
    });
  }

  return (
    <>
      <Helmet>
        <title>Dashboard — Gakuren</title>
      </Helmet>

      <div className="flex h-screen bg-gray-50">
        <aside
          className={`${sidebarOpen ? "w-64" : "w-20"} bg-white border-r border-gray-200 transition-all duration-300 flex flex-col`}>
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-brand-500 flex items-center justify-center text-white font-bold">
                  G
                </div>
                {sidebarOpen && (
                  <span className="font-bold text-slate-900">Gakuren</span>
                )}
              </div>
            </div>
          </div>

          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {mockMenuItems.map((item, idx) => (
              <button
                key={idx}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  item.active
                    ? "bg-brand-50 text-brand-600 font-medium"
                    : "text-gray-600 hover:bg-gray-50"
                }`}>
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && <span className="text-sm">{item.label}</span>}
              </button>
            ))}
          </nav>

          <div className="p-4 border-t border-gray-200">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="w-full flex items-center gap-3 px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg">
              <Menu className="w-5 h-5" />
              {sidebarOpen && <span className="text-sm">Toggle</span>}
            </button>
          </div>
        </aside>

        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Assalamualaikum, {userData.user_name || "Admin"}!
              </h1>
              <p className="text-sm text-gray-500">
                Lihat halaman dashboard Anda di sini | 📍 {userData.tenant_name}{" "}
                | 🕐 {new Date().toLocaleTimeString("id-ID")}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 px-4 py-2 bg-gray-100 rounded-lg">
                <img
                  src={`https://ui-avatars.com/api/?name=${userData.user_name || "Admin"}&background=5A5FE0&color=fff`}
                  alt={userData.user_name || "Admin"}
                  className="w-10 h-10 rounded-full"
                />
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {userData.user_name || "Admin"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {userData.role_name || "Administrator"}
                  </p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg font-medium transition">
                <LogOut className="w-4 h-4" />
                Keluar
              </button>
            </div>
          </header>

          <main className="flex-1 overflow-auto">
            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {stats.map((stat, idx) => (
                  <div
                    key={idx}
                    className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <p className="text-gray-600 text-sm font-medium mb-2">
                          {stat.title}
                        </p>
                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl font-bold text-brand-600">
                            {stat.value}
                          </span>
                          {stat.total && (
                            <span className="text-gray-400">
                              / {stat.total}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="text-4xl">{stat.icon}</span>
                    </div>
                    {stat.total && (
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                          className="bg-brand-500 h-2 rounded-full"
                          style={{
                            width: `${(parseInt(stat.value) / parseInt(stat.total)) * 100}%`,
                          }}></div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100">
                      <h2 className="text-lg font-bold text-slate-900">
                        Daftar Hadil Terbaru
                      </h2>
                      <p className="text-xs text-gray-500 mt-1">List Servis</p>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-100 bg-gray-50">
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                              Nama
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                              Petugas
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                              Waktu
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                              Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                              Lokasi
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                              Test Score
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {recentRecords.map((record) => (
                            <tr
                              key={record.id}
                              className="border-b border-gray-100 hover:bg-gray-50 transition">
                              <td className="px-6 py-4 text-sm text-gray-900">
                                {record.name}
                              </td>
                              <td className="px-6 py-4 text-sm text-brand-500 font-medium">
                                {record.officer}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-600">
                                {record.time}
                              </td>
                              <td className="px-6 py-4">
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                  {record.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-600">
                                {record.location}
                              </td>
                              <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                {record.score}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100">
                      <h3 className="text-base font-bold text-slate-900">
                        Permohonan Perizinan
                      </h3>
                    </div>
                    <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
                      {mockPermissions.map((perm) => (
                        <div
                          key={perm.id}
                          className="px-6 py-4 hover:bg-gray-50 transition">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <img
                                src={`https://ui-avatars.com/api/?name=${perm.name}&background=random&color=fff&size=40`}
                                alt={perm.name}
                                className="w-10 h-10 rounded-full"
                              />
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {perm.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {perm.role}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span
                              className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                                perm.status === "Mundur"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-blue-100 text-blue-700"
                              }`}>
                              {perm.status}
                            </span>
                            <span className="text-xs text-gray-400">
                              {perm.date}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
