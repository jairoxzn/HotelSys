import 'dotenv/config';
import { Client } from 'pg';

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

const ddl = `
-- Create Custom Types / Enums
DO $$ BEGIN
    CREATE TYPE "Role" AS ENUM ('ADMIN', 'RECEPCIONISTA', 'CONTADOR');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "RoomStatus" AS ENUM ('DISPONIBLE', 'OCUPADA', 'MANTENIMIENTO');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "ReservationStatus" AS ENUM ('PENDIENTE', 'CONFIRMADA', 'COMPLETADA', 'CANCELADA');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create User Table
CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT UNIQUE NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create Room Table
CREATE TABLE IF NOT EXISTS "Room" (
    "id" TEXT PRIMARY KEY,
    "number" TEXT UNIQUE NOT NULL,
    "type" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "status" "RoomStatus" NOT NULL DEFAULT 'DISPONIBLE'
);

-- Create Customer Table
CREATE TABLE IF NOT EXISTS "Customer" (
    "id" TEXT PRIMARY KEY,
    "fullname" TEXT NOT NULL,
    "dni" TEXT UNIQUE NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL
);

-- Create Reservation Table
CREATE TABLE IF NOT EXISTS "Reservation" (
    "id" TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    "customerId" TEXT NOT NULL REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    "roomId" TEXT NOT NULL REFERENCES "Room"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    "checkIn" TIMESTAMP NOT NULL,
    "checkOut" TIMESTAMP NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "status" "ReservationStatus" NOT NULL DEFAULT 'PENDIENTE',
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create Payment Table
CREATE TABLE IF NOT EXISTS "Payment" (
    "id" TEXT PRIMARY KEY,
    "reservationId" TEXT NOT NULL REFERENCES "Reservation"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "amount" DOUBLE PRECISION NOT NULL,
    "method" TEXT NOT NULL,
    "paymentDate" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create AuditLog Table
CREATE TABLE IF NOT EXISTS "AuditLog" (
    "id" TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "action" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create SystemConfig Table
CREATE TABLE IF NOT EXISTS "SystemConfig" (
    "id" TEXT PRIMARY KEY DEFAULT 'default',
    "hotelName" TEXT NOT NULL DEFAULT 'HotelFlow',
    "primaryColor" TEXT NOT NULL DEFAULT '#6366f1',
    "logoUrl" TEXT,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
`;

async function runMigration() {
  console.log("Starting migration on Neon database...");
  try {
    await client.connect();
    console.log("Connected to database. Executing DDL...");
    await client.query(ddl);
    console.log("Ensuring logoUrl column exists on SystemConfig...");
    await client.query('ALTER TABLE "SystemConfig" ADD COLUMN IF NOT EXISTS "logoUrl" TEXT;');
    console.log("Migration executed successfully! Database schema is ready.");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
