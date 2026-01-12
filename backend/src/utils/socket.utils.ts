import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { verifyToken } from './jwt.utils';

let io: Server;

export const initSocket = (httpServer: HttpServer) => {
    io = new Server(httpServer, {
        cors: {
            origin: 'http://localhost:3000',
            methods: ['GET', 'POST'],
            credentials: true,
        },
    });

    io.use((socket: Socket, next) => {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

        if (!token) {
            return next(new Error('Authentication error'));
        }

        const decoded = verifyToken(token);
        if (!decoded) {
            return next(new Error('Authentication error'));
        }

        // @ts-ignore
        socket.user = decoded;
        next();
    });

    io.on('connection', (socket: Socket) => {
        // @ts-ignore
        const user = socket.user;
        console.log(`User connected: ${user.userId} (Tenant: ${user.tenantId})`);

        // Join tenant room for isolation
        if (user.tenantId) {
            socket.join(`tenant:${user.tenantId}`);
        }

        socket.on('disconnect', () => {
            console.log('User disconnected');
        });
    });

    return io;
};

export const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized!');
    }
    return io;
};

export const notifyStockUpdate = (tenantId: string, productId: string, newStock: number) => {
    if (io) {
        io.to(`tenant:${tenantId}`).emit('stock:update', { productId, newStock });
    }
};
