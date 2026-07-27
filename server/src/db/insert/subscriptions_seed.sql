UPDATE subscription_plans
SET
  name = 'Plan Basico Mensual',
  description = 'Plan inicial para prueba gratuita de 30 dias al registrar un nuevo negocio.',
  billing_period = 'MONTHLY',
  price = 0.00,
  currency = 'ARS',
  trial_days = 30,
  max_users = NULL,
  max_products = NULL,
  max_deposits = NULL,
  is_active = 1,
  updated_at = NOW()
WHERE code = 'BASIC_MONTHLY';

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
  NULL,
  NULL,
  NULL,
  1
WHERE NOT EXISTS (
  SELECT 1
  FROM subscription_plans
  WHERE code = 'BASIC_MONTHLY'
);
