-- Notification log: tracks all email/whatsapp/in-app events
CREATE TABLE "notifications" (
    "id"         TEXT NOT NULL,
    "type"       TEXT NOT NULL,
    "channels"   TEXT NOT NULL,
    "orderId"    TEXT,
    "fromUserId" TEXT,
    "subject"    TEXT,
    "body"       TEXT NOT NULL,
    "metadata"   TEXT,
    "isRead"     BOOLEAN NOT NULL DEFAULT false,
    "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "notifications_createdAt_idx" ON "notifications"("createdAt" DESC);
CREATE INDEX "notifications_orderId_idx"   ON "notifications"("orderId");

ALTER TABLE "notifications"
  ADD CONSTRAINT "notifications_orderId_fkey"
    FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "notifications"
  ADD CONSTRAINT "notifications_fromUserId_fkey"
    FOREIGN KEY ("fromUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Client change requests on orders
CREATE TABLE "change_requests" (
    "id"        TEXT NOT NULL,
    "orderId"   TEXT NOT NULL,
    "userId"    TEXT NOT NULL,
    "message"   TEXT NOT NULL,
    "status"    TEXT NOT NULL DEFAULT 'pending',
    "adminNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "change_requests_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "change_requests_orderId_idx" ON "change_requests"("orderId");

ALTER TABLE "change_requests"
  ADD CONSTRAINT "change_requests_orderId_fkey"
    FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "change_requests"
  ADD CONSTRAINT "change_requests_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
