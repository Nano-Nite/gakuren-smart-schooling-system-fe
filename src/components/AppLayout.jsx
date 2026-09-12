import AcademicTermSelector from "./AcademicTermSelector";
import NotificationStack from "./NotificationStack";
import { withMinimumDuration } from "../utils/withMinimumDuration";
import AuthSplash from "./AuthSplash";
import { syncDailyReferences } from "../utils/dailyReferenceCache";
import { useEffect, useMemo, useRef, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { BarChart3 as ChartNoAxesColumnIncreasing, CalendarCheck2, CalendarX2, ChevronDown, ChevronLeft, ChevronRight, CircleUser, ClipboardCheck, FileText, GraduationCap, LayoutDashboard, LockKeyhole, LogOut, MapPin, Menu, Monitor, QrCode, School, Settings, UsersRound, X } from "lucide-react";
import { logoutUser } from "../utils/api";
import { getAssignedMenuItems, getMenuChildren, hasChildMenuAccess, CHILD_MENUS, hasMenuAccess, isSameSubmenuPage, MENU_ROUTES } from "../utils/permissions";
import ThemeToggle from "./ThemeToggle";
import PageSkeleton from "./PageSkeleton";
import { usePageLoading } from "../context/PageLoadingContext";
import { useLocale } from "../context/LocaleContext";

const icons = { Dashboard: LayoutDashboard, "QR Code": QrCode, "Teacher and Staff": UsersRound, "Student Management": GraduationCap, "Class Management": School, Attendance: CalendarCheck2, Absence: CalendarX2, Approval: ClipboardCheck, Report: ChartNoAxesColumnIncreasing, Setting: Settings };


export default function AppLayout() {
  useEffect(() => {
    const controller = new AbortController();
    const sync = () => {
      if (document.visibilityState === "visible" && navigator.onLine) syncDailyReferences({ signal: controller.signal });
    };
    sync();
    const interval = window.setInterval(sync, 60000);
    window.addEventListener("online", sync);
    window.addEventListener("focus", sync);
    window.addEventListener("storage", sync);
    document.addEventListener("visibilitychange", sync);
    return () => {
      controller.abort();
      window.clearInterval(interval);
      window.removeEventListener("online", sync);
      window.removeEventListener("focus", sync);
      window.removeEventListener("storage", sync);
      document.removeEventListener("visibilitychange", sync);
    };
  }, []);

  const navigate = useNavigate();
  const location = useLocation();
  const splashRef = useRef(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openMenus, setOpenMenus] = useState({});
  const [accountOpen, setAccountOpen] = useState(false);
  const accountMenuRef = useRef(null);
  const previousPath = useRef(location.pathname);
  const navigationStarted = useRef(false);
  const { isPageLoading, startLoading, stopLoading } = usePageLoading();
  const { t } = useLocale();
  const menus = getAssignedMenuItems();
  const user = useMemo(() => { try { return JSON.parse(sessionStorage.getItem("userData") || "{}"); } catch { return {}; } }, []);
  const activeChild = Object.values(CHILD_MENUS).flatMap(children => Object.entries(children)).find(([, config]) => config.route === location.pathname)?.[0];
  const activeMenu = activeChild || (location.pathname === "/profile" ? "Profile" : menus.find(label => MENU_ROUTES[label] === location.pathname) || menus[0]);

  useEffect(() => {
    const parent = Object.entries(CHILD_MENUS).find(([, children]) =>
      Object.values(children).some(child => child.route === location.pathname))?.[0];
    if (parent) setOpenMenus(current => ({ ...current, [parent]: true }));
  }, [location.pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    const closeOnEscape = event => { if (event.key === "Escape") setMobileOpen(false); };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [mobileOpen]);

  useEffect(() => {
    document.title = `${activeMenu ? t(`menu.${activeMenu}`, activeMenu) : "Gakuren"} | Gakuren`;
    if (Object.values(MENU_ROUTES).includes(location.pathname)) {
      localStorage.setItem("gakuren:last-menu-route", location.pathname);
    }
  }, [activeMenu, location.pathname, t]);

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
    const withinSubmenu = isSameSubmenuPage(previousPath.current, location.pathname);
    previousPath.current = location.pathname;
    if (withinSubmenu && !navigationStarted.current) return;
    if (!navigationStarted.current) startLoading();
    navigationStarted.current = false;
    stopLoading();
  }, [location.pathname, startLoading, stopLoading]);

  const navigateWithLoading = target => {
    setMobileOpen(false);
    if (target === location.pathname) return;
    if (!isSameSubmenuPage(location.pathname, target)) {
      startLoading();
      navigationStarted.current = true;
    }
    navigate(target);
  };
  const goTo = label => navigateWithLoading(MENU_ROUTES[label]);
  const logout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    setAccountOpen(false);
    try { await withMinimumDuration(() => logoutUser(user.email)); await splashRef.current?.fadeOut(); navigate("/login"); }
    catch (error) { navigate("/login", { replace: true, state: { logoutError: "Anda sudah keluar dari aplikasi ini. Sesi server belum berhasil dicabut; hubungkan internet dan coba keluar dari server kembali." } }); }
    finally { await splashRef.current?.fadeOut(); setLoggingOut(false); }
  };

  return <div className="flex h-dvh min-h-0 overflow-hidden bg-slate-50 text-slate-900">
    <NotificationStack />
    <AuthSplash ref={splashRef} open={loggingOut} />
    {mobileOpen && <button aria-label="Tutup navigasi" onClick={() => setMobileOpen(false)} className="no-action-animation fixed inset-0 z-30 bg-slate-950/40 backdrop-blur-sm lg:hidden" />}
    <aside className={`${expanded ? "lg:w-[280px]" : "lg:w-24"} ${mobileOpen ? "translate-x-0" : "-translate-x-full"} fixed inset-y-0 z-40 flex w-[280px] max-w-[86vw] flex-col border-r border-slate-200 bg-white shadow-2xl transition-all duration-500 lg:static lg:relative lg:translate-x-0 lg:shadow-none`}>
      <div className="flex h-[72px] shrink-0 items-center px-3">
        <div className="flex min-w-0 items-center gap-3"><img src="/favicon.svg" alt="Gakuren" className={`h-10 w-10 shrink-0 rounded-xl transition-transform duration-500 ${expanded ? "lg:translate-x-0" : "lg:translate-x-4"}`} /><div className={`overflow-hidden whitespace-nowrap transition-all duration-300 ${expanded ? "lg:max-w-[190px] lg:opacity-100" : "lg:max-w-0 lg:opacity-0"}`}><p className="font-bold">Gakuren</p><p className="text-[10px] text-slate-400">Aplikasi Manajemen Sekolah Modern</p></div></div>
        <button aria-label={expanded ? "Ciutkan sidebar" : "Perluas sidebar"} onClick={() => setExpanded(value => !value)} className="sidebar-toggle absolute -right-3 top-6 z-10 hidden h-7 w-7 items-center justify-center rounded-full border shadow-sm transition-colors lg:flex">{expanded ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}</button>
        <button aria-label="Tutup navigasi" onClick={() => setMobileOpen(false)} className="ml-auto rounded-lg p-2 lg:hidden"><X className="h-5 w-5" /></button>
      </div>
      <nav aria-label="Navigasi utama" className="min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain px-3 py-3">
        {menus.map(label => {
          const Icon = icons[label] || FileText;
          const children = getMenuChildren(label).filter(child => CHILD_MENUS[label]?.[child]);
          const active = MENU_ROUTES[label] === location.pathname;
          const childActive = children.some(child => CHILD_MENUS[label][child].route === location.pathname);
          const allowed = hasMenuAccess(label);
          const displayLabel = t(`menu.${label}`, label);
          const open = Boolean(openMenus[label]);
          const submenuId = `sidebar-${label.toLowerCase().replace(/\s+/g, "-")}`;
          const toggleChildren = () => {
            if (!expanded && window.matchMedia("(min-width: 1024px)").matches) {
              setExpanded(true);
              setOpenMenus(current => ({ ...current, [label]: true }));
            } else setOpenMenus(current => ({ ...current, [label]: !current[label] }));
          };
          return <div key={label}>
            <div className={`flex items-center rounded-lg transition-colors ${active || childActive ? "bg-blue-50 text-blue-600" : "text-slate-600 hover:bg-slate-50"}`}>
              <button type="button" aria-label={displayLabel} aria-current={active ? "page" : undefined}
                title={allowed ? displayLabel : `${displayLabel} | akses terbatas`}
                onClick={() => {
                  if (children.length && !expanded && window.matchMedia("(min-width: 1024px)").matches) toggleChildren();
                  else goTo(label);
                }}
                className={`flex min-h-11 min-w-0 flex-1 items-center gap-3 rounded-lg px-3 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${active || childActive ? "font-semibold" : ""}`}>
                <Icon aria-hidden="true" strokeWidth={1.75} className={`h-[18px] w-[18px] shrink-0 transition-transform duration-300 ${expanded ? "lg:translate-x-0" : "lg:translate-x-[15px]"}`} />
                <span className={`min-w-0 flex-1 truncate text-left ${expanded ? "" : "lg:hidden"}`}>{displayLabel}</span>
                {!allowed && <LockKeyhole aria-hidden="true" className={`h-3.5 w-3.5 shrink-0 text-amber-500 ${expanded ? "" : "lg:hidden"}`} />}
              </button>
              {children.length > 0 && <button type="button" aria-label={`${open ? "Tutup" : "Buka"} submenu ${displayLabel}`}
                aria-expanded={open} aria-controls={submenuId} onClick={toggleChildren}
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg outline-none hover:bg-blue-100/60 focus-visible:ring-2 focus-visible:ring-blue-500 ${expanded ? "" : "lg:hidden"}`}>
                <ChevronDown aria-hidden="true" className={`h-4 w-4 transition-transform duration-200 motion-reduce:transition-none ${open ? "rotate-180" : ""}`} />
              </button>}
            </div>
            {children.length > 0 && <div id={submenuId} hidden={!open} className={`ml-[21px] mt-1 space-y-1 border-l border-slate-200 pl-3 ${expanded ? "" : "lg:hidden"}`}>
              {children.map(child => {
                const config = CHILD_MENUS[label][child];
                const allowed = hasChildMenuAccess(label, child);
                const active = location.pathname === config.route;
                const ChildIcon = { Device: Monitor, Location: MapPin }[child] || Settings;
                const displayChild = t(`menu.${child}`, child);
                return <button type="button" key={child} aria-current={active ? "page" : undefined}
                  title={allowed ? displayChild : `${displayChild} | akses terbatas`}
                  onClick={() => navigateWithLoading(config.route)}
                  className={`flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 ${active ? "bg-blue-50 font-semibold text-blue-600" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"}`}>
                  <ChildIcon aria-hidden="true" className="h-4 w-4 shrink-0" />
                  <span className="min-w-0 flex-1 truncate text-left">{displayChild}</span>
                  {!allowed && <LockKeyhole aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-amber-500" />}
                </button>;
              })}
            </div>}
          </div>;
        })}
      </nav>
      <div className={`m-3 shrink-0 overflow-y-auto rounded-xl bg-slate-50 transition-all duration-300 ${expanded ? "max-h-[60vh] opacity-100" : "max-h-[60vh] lg:hidden"}`}><AcademicTermSelector key={`${sessionStorage.getItem("tenantId")}:${sessionStorage.getItem("schoolUuid")}:${user.uuid || user.email || user.user_name}`} storageKey={`gakuren:academic-term:${sessionStorage.getItem("tenantId")}:${sessionStorage.getItem("schoolUuid")}:${user.uuid || user.email || user.user_name}`} /></div>
    </aside>
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <header className="flex h-[72px] shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 sm:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-3"><button aria-label="Buka navigasi" onClick={() => setMobileOpen(true)} className="sidebar-toggle rounded-lg border p-2 shadow-sm lg:hidden"><Menu className="h-5 w-5" /></button><div className="min-w-0"><h1 className="truncate text-lg font-bold">{activeMenu ? t(`menu.${activeMenu}`, activeMenu) : "Gakuren"}</h1><p className="truncate text-xs text-slate-500">{t(`subtitle.${activeMenu}`, t("subtitle.fallback"))}</p></div></div>
        <div className="flex shrink-0 items-center gap-2"><ThemeToggle /><div ref={accountMenuRef} className="relative shrink-0">
          <button type="button" aria-haspopup="menu" aria-expanded={accountOpen} onClick={() => setAccountOpen(value => !value)} className={`flex items-center gap-3 rounded-xl p-1.5 hover:bg-slate-50 ${accountOpen ? "bg-slate-50" : ""}`}><img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.user_name || "Admin")}&background=DBEAFE&color=1D4ED8&bold=true`} alt="" className="h-10 w-10 rounded-full" /><div className="hidden text-left sm:block"><p className="text-sm font-bold">{user.user_name || "Admin"}</p><p className="text-[10px] text-slate-400">{user.role_name || "Administrator"}</p></div><ChevronDown className={`h-4 w-4 text-slate-500 transition-transform duration-200 ${accountOpen ? "rotate-180" : ""}`} /></button>
          <div role="menu" className={`absolute right-0 top-[calc(100%+8px)] z-50 w-48 origin-top-right rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl transition-all duration-200 ${accountOpen ? "visible translate-y-0 scale-100 opacity-100" : "invisible -translate-y-2 scale-95 opacity-0"}`}>
            <button role="menuitem" onClick={() => { navigateWithLoading("/profile"); setAccountOpen(false); }} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50"><CircleUser className="h-4 w-4" />{t("common.profile")}</button>
            <div className="my-1 border-t border-slate-100" />
            <button role="menuitem" onClick={logout} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-rose-600 hover:bg-rose-50"><LogOut className="h-4 w-4" />{t("common.logout")}</button>
          </div>
        </div></div>
      </header>
      <main className="min-h-0 min-w-0 flex-1 overflow-y-auto">{isPageLoading && <PageSkeleton pathname={location.pathname} />}<div className={isPageLoading ? "hidden" : "page-content-reveal min-h-full"}><Outlet /></div></main>
    </div>
  </div>;
}
