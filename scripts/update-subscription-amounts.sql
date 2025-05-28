-- Update subscription amounts to match the correct plan pricing based on billing cycle

-- Update annual subscriptions to use annual price from their plan
UPDATE subscriptions
SET amount = (
  SELECT CASE
    WHEN subscriptions."billingCycle" = 'ANNUAL' THEN plans.annual_price
    WHEN subscriptions."billingCycle" = 'MONTHLY' THEN plans.monthly_price
    ELSE subscriptions.amount
  END
  FROM plans
  WHERE plans.id = subscriptions.plan_id
)
WHERE EXISTS (
  SELECT 1 FROM plans WHERE plans.id = subscriptions.plan_id
);

-- Verify the update
SELECT
  s.id,
  o.name as organization_name,
  p.name as plan_name,
  s."billingCycle",
  s.amount as subscription_amount,
  p.monthly_price as plan_monthly,
  p.annual_price as plan_annual,
  CASE
    WHEN s."billingCycle" = 'ANNUAL' AND s.amount = p.annual_price THEN '✅ Correct'
    WHEN s."billingCycle" = 'MONTHLY' AND s.amount = p.monthly_price THEN '✅ Correct'
    ELSE '❌ Incorrect'
  END as status
FROM subscriptions s
JOIN organizations o ON s.organization_id = o.id
JOIN plans p ON s.plan_id = p.id
ORDER BY o.name;
