import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    console.error(err);

    if (err instanceof ZodError) {
        return res.status(400).json({
            status: 'error',
            code: 400,
            message: 'Validation Error',
            content: { errors: err.errors },
        });
    }

    if (err.name === 'UnauthorizedError') {
        return res.status(401).json({
            status: 'error',
            code: 401,
            message: 'Invalid Token',
            content: {},
        });
    }

    // Prisma Errors (Basic handling)
    if (err.code && err.code.startsWith('P')) {
        return res.status(400).json({
            status: 'error',
            code: 400,
            message: 'Database Error',
            content: { code: err.code, detail: err.meta },
        });
    }

    res.status(500).json({
        status: 'error',
        code: 500,
        message: 'Internal Server Error',
        content: process.env.NODE_ENV === 'development' ? { error: err.message } : {},
    });
};
