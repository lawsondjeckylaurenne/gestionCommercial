import { Response } from 'express';

export const sendSuccess = (res: Response, message: string, content: any = {}, code: number = 200) => {
    res.status(code).json({
        status: 'success',
        code,
        message,
        content,
    });
};

export const sendError = (res: Response, message: string, code: number = 400, error: any = null) => {
    res.status(code).json({
        status: 'error',
        code,
        message,
        content: error ? { error } : {},
    });
};
