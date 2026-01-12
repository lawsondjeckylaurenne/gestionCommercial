import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import authRoutes from './modules/auth/auth.routes';
import twofaRoutes from './modules/auth/twofa.routes';
import uploadRoutes from './modules/upload/upload.routes';
import tenantRoutes from './modules/tenants/tenant.routes';
import userRoutes from './modules/users/user.routes';
import productRoutes from './modules/products/product.routes';
import saleRoutes from './modules/sales/sale.routes';
import statsRoutes from './modules/stats/stats.routes';
import { rateLimitMiddleware, initRedis } from './middleware/rateLimit.middleware';
import { errorHandler } from './middleware/error.middleware';
import { initSocket } from './utils/socket.utils';

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3001;

// Initialize Redis
initRedis();

app.use(helmet());
app.use(cors({
    origin: 'http://localhost:3000', // Frontend URL
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Content-Type', 'Cache-Control'],
}));
// Global Rate Limiter
app.use(rateLimitMiddleware);

// Upload routes first (no JSON parsing needed)
app.use('/api/upload', uploadRoutes);

// JSON parser for all other routes
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// All other routes
app.use('/api/auth', authRoutes);
app.use('/api/auth/2fa', twofaRoutes);
app.use('/api/tenants', tenantRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/stats', statsRoutes);

app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
});

// Global Error Handler
app.use(errorHandler);

// Initialize Socket.io
initSocket(httpServer);

httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
