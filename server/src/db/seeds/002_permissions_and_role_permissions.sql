/* Required permissions and default role permissions seed. */
USE `punto_venta_dev_clean_2`;

INSERT INTO permissions (code, module, action, name, description, is_active)
VALUES
('dashboard.view','dashboard','view','Ver dashboard','Permite ver metricas y panel principal',1),
('sales.view','sales','view','Ver ventas','Permite ver ventas e historial',1),
('sales.create','sales','create','Crear ventas','Permite registrar ventas',1),
('sales.cancel','sales','cancel','Anular ventas','Permite anular ventas',1),
('sale_payments.view','sale_payments','view','Ver pagos de venta','Permite ver pagos asociados a ventas',1),
('sale_payments.create','sale_payments','create','Crear pagos de venta','Permite registrar pagos asociados a ventas',1),
('sale_payments.update','sale_payments','update','Editar pagos de venta','Permite corregir pagos pendientes',1),
('sale_payments.collect','sale_payments','collect','Cobrar pagos en reparto','Permite marcar pagos como cobrados por cadete',1),
('sale_payments.confirm','sale_payments','confirm','Confirmar pagos','Permite confirmar pagos en caja',1),
('sale_payments.cancel','sale_payments','cancel','Anular pagos','Permite anular pagos pendientes',1),
('deliveries.view','deliveries','view','Ver entregas','Permite ver entregas de ventas',1),
('deliveries.view_all','deliveries','view_all','Ver todas las entregas','Permite ver entregas asignadas a cualquier cadete',1),
('deliveries.assign','deliveries','assign','Asignar entregas','Permite asignar cadetes a entregas',1),
('deliveries.update_status','deliveries','update_status','Actualizar entregas','Permite cambiar estado de entregas',1),
('cash_settlements.view','cash_settlements','view','Ver liquidaciones','Permite ver liquidaciones de efectivo cobradas por cadetes',1),
('cash_settlements.create','cash_settlements','create','Crear liquidaciones','Permite liquidar efectivo cobrado por cadetes',1),
('purchases.view','purchases','view','Ver compras','Permite ver compras e historial',1),
('purchases.create','purchases','create','Crear compras','Permite registrar compras',1),
('purchases.cancel','purchases','cancel','Anular compras','Permite anular compras',1),
('products.view','products','view','Ver productos','Permite ver productos',1),
('products.create','products','create','Crear productos','Permite crear productos',1),
('products.update','products','update','Editar productos','Permite editar productos',1),
('products.change_prices','products','change_prices','Cambiar precios','Permite modificar precios de productos',1),
('products.import','products','import','Importar productos','Permite importar productos por Excel',1),
('products.change_status','products','change_status','Cambiar estado de productos','Permite activar o desactivar productos',1),
('categories.view','categories','view','Ver categorias','Permite ver categorias de productos',1),
('categories.create','categories','create','Crear categorias','Permite crear categorias',1),
('categories.update','categories','update','Editar categorias','Permite editar categorias',1),
('categories.change_status','categories','change_status','Cambiar estado de categorias','Permite activar o desactivar categorias',1),
('stock.view','stock','view','Ver inventario','Permite ver existencias de stock',1),
('stock.adjust','stock','adjust','Ajustar stock','Permite realizar ajustes manuales de stock',1),
('stock.transfer','stock','transfer','Transferir stock','Permite transferir stock entre depositos',1),
('stock.view_movements','stock','view_movements','Ver movimientos de stock','Permite ver auditoria de movimientos',1),
('stock.view_critical','stock','view_critical','Ver stock critico','Permite ver informe critico de inventario',1),
('cash_registers.view','cash_registers','view','Ver cajas','Permite ver cajas del negocio',1),
('cash_registers.create','cash_registers','create','Crear cajas','Permite crear cajas del negocio',1),
('cash_registers.update','cash_registers','update','Editar cajas','Permite editar cajas del negocio',1),
('cash_registers.change_status','cash_registers','change_status','Cambiar estado de cajas','Permite activar, desactivar o marcar cajas predeterminadas',1),
('cash_sessions.view','cash_sessions','view','Ver caja actual','Permite ver la sesion de caja actual',1),
('cash_sessions.open','cash_sessions','open','Abrir caja','Permite abrir sesiones de caja',1),
('cash_sessions.close','cash_sessions','close','Cerrar caja','Permite cerrar sesiones de caja',1),
('cash_sessions.view_history','cash_sessions','view_history','Ver historial de caja','Permite ver sesiones historicas de caja',1),
('cash_sessions.view_all_users','cash_sessions','view_all_users','Ver cajas de otros usuarios','Permite auditar sesiones operadas por otros usuarios',1),
('cash_movements.view','cash_movements','view','Ver movimientos de caja','Permite ver ingresos y egresos manuales de caja',1),
('cash_movements.create','cash_movements','create','Crear movimientos de caja','Permite registrar ingresos y egresos manuales de caja',1),
('cash_reports.view','cash_reports','view','Ver reportes de caja','Permite ver reportes y resumenes de caja',1),
('payment_methods.view','payment_methods','view','Ver metodos de pago','Permite ver metodos de pago del negocio',1),
('payment_methods.create','payment_methods','create','Crear metodos de pago','Permite crear metodos de pago del negocio',1),
('payment_methods.update','payment_methods','update','Editar metodos de pago','Permite editar metodos de pago del negocio',1),
('payment_methods.change_status','payment_methods','change_status','Cambiar estado de metodos de pago','Permite activar o desactivar metodos de pago',1),
('payment_methods.set_default','payment_methods','set_default','Definir metodo predeterminado','Permite marcar un metodo de pago como predeterminado',1),
('customers.view','customers','view','Ver clientes','Permite ver clientes',1),
('customers.create','customers','create','Crear clientes','Permite crear clientes',1),
('customers.update','customers','update','Editar clientes','Permite editar clientes',1),
('customers.change_status','customers','change_status','Cambiar estado de clientes','Permite activar o desactivar clientes',1),
('suppliers.view','suppliers','view','Ver proveedores','Permite ver proveedores',1),
('suppliers.create','suppliers','create','Crear proveedores','Permite crear proveedores',1),
('suppliers.update','suppliers','update','Editar proveedores','Permite editar proveedores',1),
('suppliers.change_status','suppliers','change_status','Cambiar estado de proveedores','Permite activar o desactivar proveedores',1),
('deposits.view','deposits','view','Ver depositos','Permite ver depositos',1),
('deposits.create','deposits','create','Crear depositos','Permite crear depositos',1),
('deposits.update','deposits','update','Editar depositos','Permite editar depositos',1),
('deposits.change_status','deposits','change_status','Cambiar estado de depositos','Permite activar o desactivar depositos',1),
('reports.view','reports','view','Ver reportes','Permite ver reportes',1),
('users.view','users','view','Ver usuarios','Permite ver usuarios del negocio',1),
('users.create','users','create','Crear usuarios','Permite crear usuarios del negocio',1),
('users.update','users','update','Editar usuarios','Permite editar usuarios del negocio',1),
('users.change_role','users','change_role','Cambiar rol de usuarios','Permite cambiar roles ADMIN/SELLER/DELIVERY',1),
('users.change_status','users','change_status','Cambiar estado de usuarios','Permite activar o desactivar usuarios',1),
('users.manage_permissions','users','manage_permissions','Gestionar permisos','Permite personalizar permisos por usuario',1),
('business.view','business','view','Ver negocio','Permite ver configuracion del negocio',1),
('business.update','business','update','Editar negocio','Permite editar configuracion del negocio',1),
('subscription.view','subscription','view','Ver suscripcion','Permite ver estado comercial de suscripcion',1)
ON DUPLICATE KEY UPDATE
  module = VALUES(module),
  action = VALUES(action),
  name = VALUES(name),
  description = VALUES(description),
  is_active = VALUES(is_active),
  updated_at = NOW();

DELETE FROM role_permissions WHERE role IN ('ADMIN','SELLER','DELIVERY');

INSERT INTO role_permissions (role, idPermission)
SELECT 'ADMIN', idPermission
FROM permissions
WHERE code IN (
  'dashboard.view',
  'sales.view','sales.create','sales.cancel',
  'sale_payments.view','sale_payments.create','sale_payments.update','sale_payments.collect','sale_payments.confirm','sale_payments.cancel',
  'deliveries.view','deliveries.view_all','deliveries.assign','deliveries.update_status',
  'cash_settlements.view','cash_settlements.create',
  'purchases.view','purchases.create','purchases.cancel',
  'products.view','products.create','products.update','products.change_prices','products.import','products.change_status',
  'categories.view','categories.create','categories.update','categories.change_status',
  'stock.view','stock.adjust','stock.transfer','stock.view_movements','stock.view_critical',
  'cash_registers.view','cash_registers.create','cash_registers.update','cash_registers.change_status',
  'cash_sessions.view','cash_sessions.open','cash_sessions.close','cash_sessions.view_history','cash_sessions.view_all_users',
  'cash_movements.view','cash_movements.create','cash_reports.view',
  'payment_methods.view','payment_methods.create','payment_methods.update','payment_methods.change_status','payment_methods.set_default',
  'customers.view','customers.create','customers.update','customers.change_status',
  'suppliers.view','suppliers.create','suppliers.update','suppliers.change_status',
  'deposits.view','deposits.create','deposits.update','deposits.change_status',
  'reports.view',
  'subscription.view',
  'business.view'
);

INSERT INTO role_permissions (role, idPermission)
SELECT 'SELLER', idPermission
FROM permissions
WHERE code IN (
  'dashboard.view',
  'sales.view',
  'sales.create',
  'products.view',
  'stock.view',
  'cash_registers.view',
  'cash_sessions.view',
  'cash_sessions.open',
  'cash_movements.view',
  'cash_movements.create',
  'payment_methods.view',
  'deposits.view',
  'customers.view',
  'customers.create',
  'business.view'
);

INSERT INTO role_permissions (role, idPermission)
SELECT 'DELIVERY', idPermission
FROM permissions
WHERE code IN (
  'deliveries.view',
  'deliveries.update_status',
  'sale_payments.view',
  'sale_payments.collect'
);
