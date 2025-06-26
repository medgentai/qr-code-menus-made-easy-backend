-- CreateIndex
CREATE INDEX "idx_orders_venue_created" ON "orders"("venue_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_orders_venue_status_created" ON "orders"("venue_id", "status", "created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_orders_status_created" ON "orders"("status", "created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_orders_created" ON "orders"("created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_orders_payment_status_created" ON "orders"("payment_status", "created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_orders_customer_name" ON "orders"("customer_name");

-- CreateIndex
CREATE INDEX "idx_orders_customer_email" ON "orders"("customer_email");

-- CreateIndex
CREATE INDEX "idx_orders_customer_phone" ON "orders"("customer_phone");

-- CreateIndex
CREATE INDEX "idx_orders_table_created" ON "orders"("table_id", "created_at" DESC);
