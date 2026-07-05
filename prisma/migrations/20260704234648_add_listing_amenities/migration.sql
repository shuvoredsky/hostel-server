-- CreateEnum
CREATE TYPE "Amenity" AS ENUM ('WIFI', 'FILTERED_WATER', 'AC', 'LIFT', 'SECURITY_24_7', 'CCTV', 'PARKING');

-- CreateEnum
CREATE TYPE "GasType" AS ENUM ('CYLINDER', 'SUPPLY', 'NOT_AVAILABLE');

-- CreateEnum
CREATE TYPE "NearbyLandmarkType" AS ENUM ('UNIVERSITY', 'METRO_STATION', 'BUS_STOP');

-- AlterTable
ALTER TABLE "Listing" ADD COLUMN     "amenities" "Amenity"[] DEFAULT ARRAY[]::"Amenity"[],
ADD COLUMN     "gasType" "GasType" DEFAULT 'NOT_AVAILABLE',
ADD COLUMN     "nearbyName" TEXT,
ADD COLUMN     "nearbyType" "NearbyLandmarkType";
