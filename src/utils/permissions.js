import { TOKEN_KEYS } from "../config/api";

const isStringList = value => Array.isArray(value) && value.every(item => typeof item === "string");

export const isMenuMap = value => Boolean(value) && typeof value === "object" && !Array.isArray(value)
  && Object.values(value).every(menu => menu && typeof menu === "object"
    && isStringList(menu.child) && isStringList(menu.permission));

export const getMenuMap = () => {
  try {
    const value = JSON.parse(sessionStorage.getItem(TOKEN_KEYS.MENU_ITEMS) || "{}");
    return isMenuMap(value) ? value : {};
  } catch { return {}; }
};

export const getMenuItems = () => Object.keys(getMenuMap());
export const getMenuPermissions = label => getMenuMap()[label]?.permission || [];
export const getMenuChildren = label => getMenuMap()[label]?.child || [];
export const getPermissions = () => [...new Set(Object.values(getMenuMap()).flatMap(menu => menu.permission))];

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
  Approval: "appr.view",
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
  Approval: "appr",
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
  Approval: "/approvals",
  Attendance: "/attendance",
  Absence: "/absence",
  Report: "/reports",
  Setting: "/settings",
};

export const getMenuReadPermissions = label => {
  const resource = MENU_RESOURCES[label];
  return resource ? [`${resource}.view`, `${resource}.read`] : [];
};

export const hasMenuAccess = (label, permissions = getMenuPermissions(label)) =>
  getMenuItems().includes(label) && hasAnyPermission(getMenuReadPermissions(label), permissions);

export const CHILD_MENUS = {
  Setting: {
    Device: { route: "/settings/device", resource: "setting.device" },
    Location: { route: "/settings/location", resource: "setting.location" },
  },
};

export const hasChildMenuAccess = (parent, child) => {
  const config = CHILD_MENUS[parent]?.[child];
  return Boolean(config) && getMenuChildren(parent).includes(child)
    && hasAnyPermission([`${config.resource}.view`, `${config.resource}.read`], getMenuPermissions(parent));
};

const menuOrder = ["Dashboard", "QR Code", "Teacher and Staff", "Student Management", "Class Management", "Attendance", "Absence", "Approval", "Report", "Setting"];
const menuPosition = new Map(menuOrder.map((label, index) => [label, index]));

// Menus are authoritative from the backend. Permission affects access, not visibility.
export const getAssignedMenuItems = (menus = getMenuItems()) =>
  menus.filter(label => MENU_ROUTES[label])
    .sort((a, b) => (menuPosition.get(a) ?? Infinity) - (menuPosition.get(b) ?? Infinity));

export const getAccessibleMenuItems = (menus = getMenuItems()) =>
  getAssignedMenuItems(menus).filter(label => hasMenuAccess(label));

export const getDefaultAuthorizedRoute = () => {
  const assignedMenus = getAssignedMenuItems();
  const firstMenu = getAccessibleMenuItems()[0] || assignedMenus[0];
  return firstMenu ? MENU_ROUTES[firstMenu] : "/";
};

// Parent and child routes share one page container.
export const getSubmenuParent = pathname => Object.keys(CHILD_MENUS).find(parent =>
  MENU_ROUTES[parent] === pathname || Object.values(CHILD_MENUS[parent]).some(child => child.route === pathname));

export const isSameSubmenuPage = (from, to) => {
  const parent = getSubmenuParent(from);
  return Boolean(parent) && parent === getSubmenuParent(to);
};
