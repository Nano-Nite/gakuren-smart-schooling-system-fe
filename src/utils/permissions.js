import { TOKEN_KEYS } from "../config/api";

const readStoredList = (key) => {
  try {
    const value = JSON.parse(sessionStorage.getItem(key) || "[]");
    if (Array.isArray(value)) return value.filter(item => typeof item === "string");
    if (value && typeof value === "object") return Object.values(value).filter(item => typeof item === "string");
    return [];
  } catch {
    return [];
  }
};

export const getMenuItems = () => readStoredList(TOKEN_KEYS.MENU_ITEMS);
export const getPermissions = () => readStoredList(TOKEN_KEYS.PERMISSIONS);

export const hasPermission = (permission, permissions = getPermissions()) =>
  typeof permission === "string" && permissions.includes(permission);

export const hasAnyPermission = (requiredPermissions, permissions = getPermissions()) =>
  requiredPermissions.some(permission => permissions.includes(permission));

export const hasAllPermissions = (requiredPermissions, permissions = getPermissions()) =>
  requiredPermissions.every(permission => permissions.includes(permission));

export const getCrudPermissions = (resource, permissions = getPermissions()) => ({
  canCreate: permissions.includes(`${resource}.create`),
  canView: permissions.includes(`${resource}.view`) || permissions.includes(`${resource}.read`),
  canUpdate: permissions.includes(`${resource}.update`),
  canDelete: permissions.includes(`${resource}.delete`),
});

export const MENU_PERMISSIONS = {
  Dashboard: "dashboard.view",
  "QR Code": "qrcode.view",
  "Teacher and Staff": "teacherandstaff.view",
  "Student Management": "student.view",
  "Class Management": "class.view",
  Attendance: "attendance.view",
  Absence: "absence.view",
  Report: "report.view",
  Setting: "setting.view",
};

export const MENU_RESOURCES = {
  Dashboard: "dashboard",
  "QR Code": "qrcode",
  "Teacher and Staff": "teacherandstaff",
  "Student Management": "student",
  "Class Management": "class",
  Attendance: "attendance",
  Absence: "absence",
  Report: "report",
  Setting: "setting",
};

export const MENU_ROUTES = {
  Dashboard: "/dashboard",
  "QR Code": "/qr-code",
  "Teacher and Staff": "/teachers",
  "Student Management": "/students",
  "Class Management": "/classes",
  Attendance: "/attendance",
  Absence: "/absence",
  Report: "/reports",
  Setting: "/settings",
};

export const getMenuReadPermissions = label => {
  const resource = MENU_RESOURCES[label];
  return resource ? [`${resource}.view`, `${resource}.read`] : [];
};

export const hasMenuAccess = (label, permissions = getPermissions()) =>
  hasAnyPermission(getMenuReadPermissions(label), permissions);

// Menus are authoritative from the backend. Permission affects access, not visibility.
export const getAssignedMenuItems = (menus = getMenuItems()) =>
  menus.filter(label => MENU_ROUTES[label]);

export const getAccessibleMenuItems = (menus = getMenuItems(), permissions = getPermissions()) =>
  getAssignedMenuItems(menus).filter(label => hasMenuAccess(label, permissions));

export const getDefaultAuthorizedRoute = () => {
  const assignedMenus = getAssignedMenuItems();
  const firstMenu = getAccessibleMenuItems()[0] || assignedMenus[0];
  return firstMenu ? MENU_ROUTES[firstMenu] : "/";
};
