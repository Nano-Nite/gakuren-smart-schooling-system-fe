import { useEffect, useMemo, useRef, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Box, Calendar, ChevronDown, ChevronLeft, ChevronRight, CircleUser, FileText, LayoutDashboard, LockKeyhole, LogOut, Menu, QrCode, Settings, Shield, Signal, User, Users, X } from "lucide-react";
import { logoutUser } from "../utils/api";
import { getAssignedMenuItems, getPermissions, hasMenuAccess, MENU_ROUTES } from "../utils/permissions";
import ThemeToggle from "./ThemeToggle";
import PageSkeleton from "./PageSkeleton";
import { usePageLoading } from "../context/PageLoadingContext";

const icons = { Dashboard: LayoutDashboard, "QR Code": QrCode, "Teacher and Staff": Users, "Student Management": User, "Class Management": Box, Attendance: Calendar, Absence: Shield, Report: Signal, Setting: Settings };
const subtitles = { Dashboard: "Ringkasan aktivitas sekolah", "Class Management": "Kelola data kelas di sekolah" };
const pageTitles = { "Class Management": "Kelas" };

export default function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [expanded, setExpanded] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const accountMenuRef = useRef(null);
  const previousPath = useRef(location.pathname);
  const navigationStarted = useRef(false);
  const { isPageLoading, startLoading, stopLoading } = usePageLoading();
  const permissions = useMemo(() => getPermissions(), []);
  const menus = useMemo(() => getAssignedMenuItems(), []);
  const user = useMemo(() => { try { return JSON.parse(sessionStorage.getItem("userData") || "{}"); } catch { return {}; } }, []);
  const activeMenu = location.pathname === "/profile" ? "Profile" : menus.find(label => MENU_ROUTES[label] === location.pathname) || menus[0];

  useEffect(() => {
    const closeAccountMenu = event => {
      if (event.type === "keydown" && event.key !== "Escape") return;
      if (event.type === "mousedown" && accountMenuRef.current?.contains(event.target)) return;
      setAccountOpen(false);
    };
    document.addEventListener("mousedown", closeAccountMenu);
    document.addEventListener("keydown", closeAccountMenu);
    return () => {
      document.removeEventListener("mousedown", closeAccountMenu);
      document.removeEventListener("keydown", closeAccountMenu);
    };
  }, []);

  useEffect(() => {
    if (previousPath.current === location.pathname) return;
    previousPath.current = location.pathname;
    if (!navigationStarted.current) startLoading();
    navigationStarted.current = false;
    stopLoading();
  }, [location.pathname, startLoading, stopLoading]);

  const navigateWithLoading = target => {
    setMobileOpen(false);
    if (target === location.pathname) return;
    startLoading();
    navigationStarted.current = true;
    navigate(target);
  };
  const goTo = label => navigateWithLoading(MENU_ROUTES[label]);
  const logout = async () => { try { await logoutUser(user.email); navigate("/login"); } catch (error) { console.error("Logout error:", error); } };

  return <div className="flex h-dvh min-h-[600px] overflow-hidden bg-slate-50 text-slate-900">
    {mobileOpen && <button aria-label="Tutup navigasi" onClick={() => setMobileOpen(false)} className="no-action-animation fixed inset-0 z-30 bg-slate-950/40 backdrop-blur-sm lg:hidden" />}
    <aside className={`${expanded ? "lg:w-[280px]" : "lg:w-24"} ${mobileOpen ? "translate-x-0" : "-translate-x-full"} fixed inset-y-0 z-40 flex w-[280px] max-w-[86vw] flex-col border-r border-slate-200 bg-white shadow-2xl transition-all duration-500 lg:static lg:relative lg:translate-x-0 lg:shadow-none`}>
      <div className="flex h-[72px] shrink-0 items-center px-3">
        <div className="flex min-w-0 items-center gap-3"><img src="/favicon.svg" alt="Gakuren" className={`h-10 w-10 shrink-0 rounded-xl transition-transform duration-500 ${expanded ? "lg:translate-x-0" : "lg:translate-x-4"}`} /><div className={`overflow-hidden whitespace-nowrap transition-all duration-300 ${expanded ? "lg:max-w-[190px] lg:opacity-100" : "lg:max-w-0 lg:opacity-0"}`}><p className="font-bold">Gakuren</p><p className="text-[10px] text-slate-400">Aplikasi Manajemen Sekolah Modern</p></div></div>
        <button aria-label={expanded ? "Ciutkan sidebar" : "Perluas sidebar"} onClick={() => setExpanded(value => !value)} className="absolute -right-3 top-6 z-10 hidden h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 lg:flex">{expanded ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}</button>
        <button aria-label="Tutup navigasi" onClick={() => setMobileOpen(false)} className="ml-auto rounded-lg p-2 lg:hidden"><X className="h-5 w-5" /></button>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-3">{menus.map(label => { const Icon = icons[label] || FileText; const active = MENU_ROUTES[label] === location.pathname; const allowed = hasMenuAccess(label, permissions); return <button key={label} title={!expanded ? label : allowed ? undefined : `${label} — akses terbatas`} onClick={() => goTo(label)} className={`flex w-full items-center gap-3 overflow-hidden rounded-lg px-3 py-2.5 text-sm ${active ? "bg-blue-50 font-semibold text-blue-600" : "text-slate-600 hover:bg-slate-50"}`}><Icon className={`h-[18px] w-[18px] shrink-0 transition-transform duration-500 ${expanded ? "lg:translate-x-0" : "lg:translate-x-[15px]"}`} /><span className={`min-w-0 flex-1 truncate whitespace-nowrap text-left transition-all duration-300 ${expanded ? "lg:max-w-[150px] lg:opacity-100" : "lg:max-w-0 lg:opacity-0"}`}>{label}</span>{!allowed && <LockKeyhole className={`h-3.5 w-3.5 shrink-0 text-amber-500 transition-opacity ${expanded ? "opacity-100" : "lg:opacity-0"}`} />}</button>; })}</nav>
      <div className={`m-3 overflow-hidden rounded-xl bg-slate-50 transition-all duration-300 ${expanded ? "p-3 opacity-100" : "lg:m-0 lg:max-h-0 lg:p-0 lg:opacity-0"}`}><p className="whitespace-nowrap text-[10px] text-slate-500">Tahun Ajaran</p><p className="mt-1 whitespace-nowrap text-xs font-semibold text-blue-600">2026/2027 - Genap</p></div>
    </aside>
    <div className="flex min-w-0 flex-1 flex-col">
      <header className="flex h-[72px] shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3"><button aria-label="Buka navigasi" onClick={() => setMobileOpen(true)} className="rounded-lg border border-slate-200 p-2 lg:hidden"><Menu className="h-5 w-5" /></button><div className="min-w-0"><h1 className="truncate text-lg font-bold"><span className="sm:hidden">{pageTitles[activeMenu] || activeMenu || "Gakuren"}</span><span className="hidden sm:inline">{activeMenu || "Gakuren"}</span></h1><p className="truncate text-xs text-slate-500">{subtitles[activeMenu] || "Kelola data sekolah"}</p></div></div>
        <div className="flex items-center gap-2"><ThemeToggle /><div ref={accountMenuRef} className="relative shrink-0">
          <button type="button" aria-haspopup="menu" aria-expanded={accountOpen} onClick={() => setAccountOpen(value => !value)} className={`flex items-center gap-3 rounded-xl p-1.5 hover:bg-slate-50 ${accountOpen ? "bg-slate-50" : ""}`}><img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.user_name || "Admin")}&background=DBEAFE&color=1D4ED8&bold=true`} alt="" className="h-10 w-10 rounded-full" /><div className="hidden text-left sm:block"><p className="text-sm font-bold">{user.user_name || "Admin"}</p><p className="text-[10px] text-slate-400">{user.role_name || "Administrator"}</p></div><ChevronDown className={`h-4 w-4 text-slate-500 transition-transform duration-200 ${accountOpen ? "rotate-180" : ""}`} /></button>
          <div role="menu" className={`absolute right-0 top-[calc(100%+8px)] z-50 w-48 origin-top-right rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl transition-all duration-200 ${accountOpen ? "visible translate-y-0 scale-100 opacity-100" : "invisible -translate-y-2 scale-95 opacity-0"}`}>
            <button role="menuitem" onClick={() => { navigateWithLoading("/profile"); setAccountOpen(false); }} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50"><CircleUser className="h-4 w-4" />Profile</button>
            <div className="my-1 border-t border-slate-100" />
            <button role="menuitem" onClick={logout} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-rose-600 hover:bg-rose-50"><LogOut className="h-4 w-4" />Logout</button>
          </div>
        </div></div>
      </header>
      <main className="flex-1 overflow-y-auto">{isPageLoading && <PageSkeleton />}<div className={isPageLoading ? "hidden" : "contents"}><Outlet /></div></main>
    </div>
  </div>;
}
