-- CreateIndex
CREATE INDEX IF NOT EXISTS "Listing_status_isDeleted_idx" ON "Listing"("status", "isDeleted");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Listing_area_idx" ON "Listing"("area");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Listing_city_idx" ON "Listing"("city");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Listing_price_idx" ON "Listing"("price");
