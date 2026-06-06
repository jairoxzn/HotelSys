import { prisma } from './client.js';
import bcrypt from 'bcrypt';

async function main() {
  console.log("Seeding database with mock data...");

  // 1. Seed Users (with hashed passwords)
  const passwordAdmin = await bcrypt.hash('admin123', 10);
  const passwordRecep = await bcrypt.hash('recep123', 10);
  const passwordConta = await bcrypt.hash('conta123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@hotelflow.com' },
    update: {},
    create: {
      name: 'Administrador Flow',
      email: 'admin@hotelflow.com',
      password: passwordAdmin,
      role: 'ADMIN',
    },
  });

  const recep = await prisma.user.upsert({
    where: { email: 'recepcionista@hotelflow.com' },
    update: {},
    create: {
      name: 'Recepcionista Flow',
      email: 'recepcionista@hotelflow.com',
      password: passwordRecep,
      role: 'RECEPCIONISTA',
    },
  });

  const conta = await prisma.user.upsert({
    where: { email: 'contador@hotelflow.com' },
    update: {},
    create: {
      name: 'Contador Flow',
      email: 'contador@hotelflow.com',
      password: passwordConta,
      role: 'CONTADOR',
    },
  });

  console.log("Users seeded successfully.");

  // 2. Seed Rooms
  const roomsData = [
    { number: '101', type: 'Individual', price: 45, status: 'DISPONIBLE' as const },
    { number: '102', type: 'Individual', price: 45, status: 'MANTENIMIENTO' as const },
    { number: '201', type: 'Doble', price: 75, status: 'OCUPADA' as const },
    { number: '202', type: 'Doble', price: 75, status: 'DISPONIBLE' as const },
    { number: '301', type: 'Suite', price: 120, status: 'OCUPADA' as const },
    { number: '302', type: 'Delux', price: 200, status: 'DISPONIBLE' as const },
  ];

  const rooms = [];
  for (const r of roomsData) {
    const room = await prisma.room.upsert({
      where: { number: r.number },
      update: {},
      create: r,
    });
    rooms.push(room);
  }
  console.log("Rooms seeded successfully.");

  // 3. Seed Customers
  const customersData = [
    { fullname: 'Juan Pérez', dni: '12345678A', phone: '+34 600 111 222', email: 'juan.perez@example.com' },
    { fullname: 'María García', dni: '87654321B', phone: '+34 600 333 444', email: 'maria.garcia@example.com' },
    { fullname: 'John Doe', dni: 'Y9876543Z', phone: '+1 555 123 456', email: 'john.doe@example.com' },
  ];

  const customers = [];
  for (const c of customersData) {
    const customer = await prisma.customer.upsert({
      where: { dni: c.dni },
      update: {},
      create: c,
    });
    customers.push(customer);
  }
  console.log("Customers seeded successfully.");

  // 4. Seed Reservations and Payments (if none exist)
  const reservationCount = await prisma.reservation.count();
  if (reservationCount === 0) {
    const today = new Date();

    // Past Completed Reservation for Maria Garcia
    const checkInPast = new Date(today);
    checkInPast.setDate(today.getDate() - 10);
    const checkOutPast = new Date(today);
    checkOutPast.setDate(today.getDate() - 7);
    const room101 = rooms.find(r => r.number === '101')!;
    const customerMaria = customers.find(c => c.dni === '87654321B')!;
    
    const resPast = await prisma.reservation.create({
      data: {
        userId: recep.id,
        customerId: customerMaria.id,
        roomId: room101.id,
        checkIn: checkInPast,
        checkOut: checkOutPast,
        total: room101.price * 3,
        status: 'COMPLETADA',
      },
    });

    // Seed Payment for completed reservation
    await prisma.payment.create({
      data: {
        reservationId: resPast.id,
        amount: resPast.total,
        method: 'TARJETA',
        paymentDate: checkInPast,
      },
    });

    // Active Reservation for Juan Perez in Room 201
    const checkInActive1 = new Date(today);
    checkInActive1.setDate(today.getDate() - 1);
    const checkOutActive1 = new Date(today);
    checkOutActive1.setDate(today.getDate() + 3);
    const room201 = rooms.find(r => r.number === '201')!;
    const customerJuan = customers.find(c => c.dni === '12345678A')!;

    const resActive1 = await prisma.reservation.create({
      data: {
        userId: recep.id,
        customerId: customerJuan.id,
        roomId: room201.id,
        checkIn: checkInActive1,
        checkOut: checkOutActive1,
        total: room201.price * 4,
        status: 'CONFIRMADA',
      },
    });

    await prisma.payment.create({
      data: {
        reservationId: resActive1.id,
        amount: resActive1.total / 2, // paid half
        method: 'EFECTIVO',
        paymentDate: checkInActive1,
      },
    });

    // Active Reservation for John Doe in Room 301
    const checkInActive2 = new Date(today);
    const checkOutActive2 = new Date(today);
    checkOutActive2.setDate(today.getDate() + 5);
    const room301 = rooms.find(r => r.number === '301')!;
    const customerJohn = customers.find(c => c.dni === 'Y9876543Z')!;

    const resActive2 = await prisma.reservation.create({
      data: {
        userId: recep.id,
        customerId: customerJohn.id,
        roomId: room301.id,
        checkIn: checkInActive2,
        checkOut: checkOutActive2,
        total: room301.price * 5,
        status: 'CONFIRMADA',
      },
    });

    await prisma.payment.create({
      data: {
        reservationId: resActive2.id,
        amount: resActive2.total, // fully paid
        method: 'TRANSFERENCIA',
        paymentDate: checkInActive2,
      },
    });

    console.log("Reservations and Payments seeded successfully.");
  } else {
    console.log("Reservations already exist, skipping reservations seed.");
  }

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error("Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
