/* Required subscription plan seed. */
USE `punto_venta_dev_clean_2`;


INSERT INTO subscription_plans (
  code,
  name,
  description,
  billing_period,
  price,
  currency,
  trial_days,
  max_users,
  max_products,
  max_deposits,
  is_active
)
SELECT
  'BASIC_MONTHLY',
  'Plan Basico Mensual',
  'Plan inicial para prueba gratuita de 30 dias al registrar un nuevo negocio.',
  'MONTHLY',
  0.00,
  'ARS',
  30,
  3,
  30,
  5,
  1
WHERE NOT EXISTS (
  SELECT 1
  FROM subscription_plans
  WHERE code = 'BASIC_MONTHLY'
);
