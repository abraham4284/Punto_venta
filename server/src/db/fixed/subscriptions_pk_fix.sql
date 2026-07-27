ALTER TABLE subscription_events
  DROP FOREIGN KEY fk_subscription_events_business_subscriptions1;

ALTER TABLE subscription_payments
  DROP FOREIGN KEY fk_subscription_payments_business_subscriptions1;

ALTER TABLE business_subscriptions
  DROP PRIMARY KEY,
  ADD PRIMARY KEY (idBusinessSubscription);

ALTER TABLE subscription_payments
  DROP PRIMARY KEY,
  ADD PRIMARY KEY (idSubscriptionPayment);

ALTER TABLE subscription_events
  DROP PRIMARY KEY,
  ADD PRIMARY KEY (idSubscriptionEvent);

ALTER TABLE subscription_payments
  ADD CONSTRAINT fk_subscription_payments_business_subscriptions1
    FOREIGN KEY (idBusinessSubscription)
    REFERENCES business_subscriptions (idBusinessSubscription);

ALTER TABLE subscription_events
  ADD CONSTRAINT fk_subscription_events_business_subscriptions1
    FOREIGN KEY (idBusinessSubscription)
    REFERENCES business_subscriptions (idBusinessSubscription);
