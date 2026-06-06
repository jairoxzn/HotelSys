import express from 'express';
import cors from 'cors';
import 'dotenv/config';

// Import Routes
import authRoutes from './routes/authRoutes';
import roomRoutes from './routes/roomRoutes';
import customerRoutes from './routes/customerRoutes';
import reservationRoutes from './routes/reservationRoutes';
import paymentRoutes from './routes/paymentRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import reportRoutes from './routes/reportRoutes';
import configRoutes from './routes/configRoutes';

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for Frontend React client
app.use(cors({
  origin: '*', // For development flexibility
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Parse JSON request bodies
app.use(express.json());

// Request logger middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Register API Routes
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/config', configRoutes);

// Base route for connectivity check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled Error:', err);
  res.status(500).json({ error: 'Ha ocurrido un error inesperado en el servidor.' });
});

// Start Express Listener
app.listen(PORT, () => {
  console.log(`HotelFlow Server running on http://localhost:${PORT}`);
});
