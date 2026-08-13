const MODULE_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  sales: "Ventas",
  purchases: "Compras",
  products: "Productos",
  categories: "Categorias",
  stock: "Inventario",
  cash_registers: "Cajas",
  cash_sessions: "Sesiones de caja",
  cash_movements: "Movimientos de caja",
  cash_reports: "Reportes de caja",
  payment_methods: "Metodos de pago",
  customers: "Clientes",
  suppliers: "Proveedores",
  deposits: "Depositos",
  reports: "Reportes",
  users: "Usuarios",
  business: "Negocio",
  subscription: "Suscripcion",
};

const ACTION_LABELS: Record<string, string> = {
  view: "Ver",
  create: "Crear",
  update: "Editar",
  cancel: "Anular",
  change_prices: "Cambiar precios de",
  import: "Importar",
  change_status: "Cambiar estado de",
  adjust: "Ajustar",
  transfer: "Transferir",
  view_movements: "Ver movimientos de",
  view_critical: "Ver stock critico de",
  open: "Abrir",
  close: "Cerrar",
  view_history: "Ver historial de",
  view_all_users: "Ver cajas de otros usuarios",
  set_default: "Definir predeterminado en",
  change_role: "Cambiar rol de",
  manage_permissions: "Gestionar permisos de",
};

const PERMISSION_LABELS: Record<string, string> = {
  "dashboard.view": "Ver dashboard",
  "sales.view": "Ver ventas",
  "sales.create": "Crear ventas",
  "sales.cancel": "Anular ventas",
  "purchases.view": "Ver compras",
  "purchases.create": "Crear compras",
  "purchases.cancel": "Anular compras",
  "products.view": "Ver productos",
  "products.create": "Crear productos",
  "products.update": "Editar productos",
  "products.change_prices": "Cambiar precios de productos",
  "products.import": "Importar productos",
  "products.change_status": "Cambiar estado de productos",
  "categories.view": "Ver categorias",
  "categories.create": "Crear categorias",
  "categories.update": "Editar categorias",
  "categories.change_status": "Cambiar estado de categorias",
  "stock.view": "Ver inventario",
  "stock.adjust": "Ajustar stock",
  "stock.transfer": "Transferir stock",
  "stock.view_movements": "Ver movimientos de stock",
  "stock.view_critical": "Ver stock critico",
  "cash_registers.view": "Ver cajas",
  "cash_registers.create": "Crear cajas",
  "cash_registers.update": "Editar cajas",
  "cash_registers.change_status": "Cambiar estado de cajas",
  "cash_sessions.view": "Ver caja actual",
  "cash_sessions.open": "Abrir caja",
  "cash_sessions.close": "Cerrar caja",
  "cash_sessions.view_history": "Ver historial de caja",
  "cash_sessions.view_all_users": "Ver cajas de otros usuarios",
  "cash_movements.view": "Ver movimientos de caja",
  "cash_movements.create": "Crear movimientos de caja",
  "cash_reports.view": "Ver reportes de caja",
  "payment_methods.view": "Ver metodos de pago",
  "payment_methods.create": "Crear metodos de pago",
  "payment_methods.update": "Editar metodos de pago",
  "payment_methods.change_status": "Cambiar estado de metodos de pago",
  "payment_methods.set_default": "Definir metodo predeterminado",
  "customers.view": "Ver clientes",
  "customers.create": "Crear clientes",
  "customers.update": "Editar clientes",
  "customers.change_status": "Cambiar estado de clientes",
  "suppliers.view": "Ver proveedores",
  "suppliers.create": "Crear proveedores",
  "suppliers.update": "Editar proveedores",
  "suppliers.change_status": "Cambiar estado de proveedores",
  "deposits.view": "Ver depositos",
  "deposits.create": "Crear depositos",
  "deposits.update": "Editar depositos",
  "deposits.change_status": "Cambiar estado de depositos",
  "reports.view": "Ver reportes",
  "users.view": "Ver usuarios",
  "users.create": "Crear usuarios",
  "users.update": "Editar usuarios",
  "users.change_role": "Cambiar rol de usuarios",
  "users.change_status": "Cambiar estado de usuarios",
  "users.manage_permissions": "Gestionar permisos de usuarios",
  "business.view": "Ver negocio",
  "business.update": "Editar negocio",
  "subscription.view": "Ver suscripcion",
};

const humanizeToken = (value: string): string => {
  return value
    .split("_")
    .filter(Boolean)
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
    .join(" ");
};

export const humanizePermissionModule = (module: string): string => {
  return MODULE_LABELS[module] ?? humanizeToken(module);
};

export const humanizePermissionLabel = (
  code: string,
  module: string,
  action: string,
): string => {
  const explicitLabel = PERMISSION_LABELS[code];

  if (explicitLabel) return explicitLabel;

  const actionLabel = ACTION_LABELS[action] ?? humanizeToken(action);
  const moduleLabel = humanizePermissionModule(module).toLowerCase();

  return `${actionLabel} ${moduleLabel}`.trim();
};
