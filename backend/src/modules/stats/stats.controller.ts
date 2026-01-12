import { Request, Response } from 'express';
import { StatsService } from './stats.service';
import { AuthRequest } from '../../middleware/auth.middleware';
import { sendSuccess, sendError } from '../../utils/response.utils';

const statsService = new StatsService();

export const getStats = async (req: AuthRequest, res: Response) => {
    try {
        const { role, tenantId } = req.user!;

        if (role === 'SUPERADMIN') {
            const stats = await statsService.getSuperadminStats();
            return sendSuccess(res, 'Superadmin stats retrieved', stats);
        }

        if (role === 'DIRECTEUR' && tenantId) {
            const stats = await statsService.getDirectorStats(tenantId);
            return sendSuccess(res, 'Director stats retrieved', stats);
        }

        sendError(res, 'Forbidden', 403);
    } catch (error: any) {
        sendError(res, 'Error fetching stats', 500, error);
    }
};
