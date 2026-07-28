/*
  Business permissions bootstrap
  --------------------------------
  Objetivo:
    Agregar un modelo hibrido de autorizacion para usuarios de negocio:
    rol + permisos predeterminados + excepciones por usuario.

  Orden de ejecucion recomendado:
    1. Ejecutar las tablas base del sistema: users, businesses, business_users.
    2. Ejecutar las tablas de suscripcion si se usan limites de plan.
    3. Ejecutar este archivo.
    4. Ejecutar server/src/db/procedures/business_users.sql.

  Dependencias:
    - businesses(idBusiness)
    - users(idUser)
    - business_users(idBusiness, idUser, role, is_active)

  Consideraciones:
    - OWNER no se persiste en role_permissions: el backend lo resuelve como acceso total.
    - ADMIN y SELLER reciben seeds idempotentes.
    - Los overrides se guardan en business_user_permissions.
    - must_change_password se agrega de forma separada para usuarios creados con clave temporal.
*/

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS must_change_password TINYINT(1) NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS permissions (
  idPermission INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(100) NOT NULL,
  module VARCHAR(50) NOT NULL,
  action VARCHAR(50) NOT NULL,
  name VARCHAR(120) NOT NULL,
  description VARCHAR(255) NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_permissions_code (code),
  INDEX idx_permissions_module (module),
  INDEX idx_permissions_active (is_active)
);

CREATE TABLE IF NOT EXISTS role_permissions (
  role VARCHAR(30) NOT NULL,
  idPermission INT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (role, idPermission),
  CONSTRAINT fk_role_permissions_permission
    FOREIGN KEY (idPermission)
    REFERENCES permissions(idPermission)
);

CREATE TABLE IF NOT EXISTS business_user_permissions (
  idBusinessUserPermission BIGINT AUTO_INCREMENT PRIMARY KEY,
  idBusiness INT NOT NULL,
  idUser INT NOT NULL,
  idPermission INT NOT NULL,
  effect ENUM('ALLOW','DENY') NOT NULL,
  created_by_user_id INT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_business_user_permission (idBusiness, idUser, idPermission),
  INDEX idx_business_user_permissions_business_user (idBusiness, idUser),
  CONSTRAINT fk_business_user_permissions_business
    FOREIGN KEY (idBusiness)
    REFERENCES businesses(idBusiness),
  CONSTRAINT fk_business_user_permissions_user
    FOREIGN KEY (idUser)
    REFERENCES users(idUser),
  CONSTRAINT fk_business_user_permissions_permission
    FOREIGN KEY (idPermission)
    REFERENCES permissions(idPermission),
  CONSTRAINT fk_business_user_permissions_created_by
    FOREIGN KEY (created_by_user_id)
    REFERENCES users(idUser)
);

INSERT INTO permissions (code, module, action, name, description, is_active)
VALUES
('dashboard.view','dashboard','view','Ver dashboard','Permite ver metricas y panel principal',1),
('sales.view','sales','view','Ver ventas','Permite ver ventas e historial',1),
('sales.create','sales','create','Crear ventas','Permite registrar ventas',1),
('sales.cancel','sales','cancel','Anular ventas','Permite anular ventas',1),
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
('users.change_role','users','change_role','Cambiar rol de usuarios','Permite cambiar roles ADMIN/SELLER',1),
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

DELETE FROM role_permissions WHERE role IN ('ADMIN','SELLER');

INSERT INTO role_permissions (role, idPermission)
SELECT 'ADMIN', idPermission
FROM permissions
WHERE code IN (
  'dashboard.view',
  'sales.view','sales.create','sales.cancel',
  'purchases.view','purchases.create','purchases.cancel',
  'products.view','products.create','products.update','products.change_prices','products.import','products.change_status',
  'categories.view','categories.create','categories.update','categories.change_status',
  'stock.view','stock.adjust','stock.transfer','stock.view_movements','stock.view_critical',
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
  'customers.view',
  'customers.create'
);
