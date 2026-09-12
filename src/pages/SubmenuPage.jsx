import { NavLink, Outlet, useLocation } from "react-router-dom";
import { LockKeyhole, Monitor, MapPin, Settings } from "lucide-react";
import { useLocale } from "../context/LocaleContext";
import { CHILD_MENUS, getMenuChildren, hasChildMenuAccess } from "../utils/permissions";
import ModulePlaceholder from "./ModulePlaceholder";
import LocationSettings from "./LocationSettings";
import AccessDenied from "./AccessDenied";

export default function SubmenuPage({ parent }) {
  const { pathname } = useLocation();
  const child = Object.entries(CHILD_MENUS[parent] || {}).find(([, config]) => config.route === pathname)?.[0];
  const { t } = useLocale();
  const children = getMenuChildren(parent).filter(label => CHILD_MENUS[parent]?.[label]);
  const selected = child || children.find(label => hasChildMenuAccess(parent, label)) || children[0];

  return <div className="p-4 sm:p-6"><section className="min-w-0 rounded-xl border border-slate-200 bg-white shadow-card">
    {children.length > 0 && <nav aria-label={`Submenu ${t(`menu.${parent}`, parent)}`}
      className="mx-4 mt-4 grid auto-cols-fr grid-flow-col gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800 sm:mx-5 sm:mt-5">
      {children.map(label => {
        const allowed = hasChildMenuAccess(parent, label);
        const active = label === selected;
        const Icon = { Device: Monitor, Location: MapPin }[label] || Settings;
        const displayLabel = t(`menu.${label}`, label);
        return <NavLink key={label} to={CHILD_MENUS[parent][label].route}
          aria-current={active ? "page" : false}
          title={allowed ? displayLabel : `${displayLabel} | akses terbatas`}
          className={`flex min-h-11 min-w-0 items-center justify-center gap-2 rounded-lg px-2 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 sm:text-sm ${active ? "bg-white text-blue-700 shadow-sm dark:bg-slate-700 dark:text-blue-300" : "text-slate-500 hover:text-blue-600 dark:text-slate-400"}`}>
          <Icon aria-hidden="true" className="h-4 w-4 shrink-0" />
          <span className="truncate">{displayLabel}</span>
          {!allowed && <LockKeyhole aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-amber-500" />}
        </NavLink>;
      })}
    </nav>}
    <div className="min-h-[320px]"><Outlet /></div>
  </section></div>;
}

export function SubmenuContent({ parent, child }) {
  const children = getMenuChildren(parent).filter(label => CHILD_MENUS[parent]?.[label]);
  const selected = child || children.find(label => hasChildMenuAccess(parent, label)) || children[0];
  return selected ? hasChildMenuAccess(parent, selected)
    ? parent === "Setting" && selected === "Location" ? <LocationSettings /> : <ModulePlaceholder title={selected} />
    : <AccessDenied menu={selected} />
    : <ModulePlaceholder title={parent} />;
}
