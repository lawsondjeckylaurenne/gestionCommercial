import { Request, Response } from 'express';
import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import { AuthRequest } from '../../middleware/auth.middleware';
import { sendSuccess, sendError } from '../../utils/response.utils';

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(process.cwd(), 'uploads', 'images');

const ensureUploadsDir = async () => {
    try {
        await fs.access(uploadsDir);
    } catch {
        await fs.mkdir(uploadsDir, { recursive: true });
    }
};

// Configure multer for memory storage
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Type de fichier non supporté. Seuls JPG, PNG et WEBP sont acceptés.'));
        }
    }
});

export const uploadImage = async (req: AuthRequest, res: Response) => {
    try {
        console.log('Upload request received');
        console.log('Content-Type:', req.headers['content-type']);
        console.log('Request body keys:', Object.keys(req.body || {}));
        
        await ensureUploadsDir();

        // Use multer middleware
        upload.single('image')(req, res, async (err) => {
            console.log('Multer callback called');
            console.log('Error:', err);
            console.log('File:', req.file);
            
            if (err) {
                console.log('Multer error:', err);
                if (err instanceof multer.MulterError) {
                    if (err.code === 'LIMIT_FILE_SIZE') {
                        return sendError(res, 'Fichier trop volumineux. Taille maximum: 5MB', 400);
                    }
                }
                return sendError(res, err.message, 400);
            }

            if (!req.file) {
                console.log('No file received in req.file');
                return sendError(res, 'Aucun fichier fourni', 400);
            }

            try {
                // Generate unique filename
                const timestamp = Date.now();
                const randomString = Math.random().toString(36).substring(2, 15);
                const extension = path.extname(req.file.originalname) || '.jpg';
                const filename = `${timestamp}_${randomString}${extension}`;
                const filepath = path.join(uploadsDir, filename);

                // Process image with Sharp (resize and optimize)
                await sharp(req.file.buffer)
                    .resize(800, 600, { 
                        fit: 'inside',
                        withoutEnlargement: true 
                    })
                    .jpeg({ 
                        quality: 85,
                        progressive: true 
                    })
                    .toFile(filepath);

                // Generate URL for the uploaded image (using Next.js proxy)
                const imageUrl = `/images/${filename}`;

                sendSuccess(res, 'Image uploadée avec succès', {
                    url: imageUrl,
                    filename,
                    originalName: req.file.originalname,
                    size: req.file.size
                });

            } catch (error: any) {
                console.error('Error processing image:', error);
                sendError(res, 'Erreur lors du traitement de l\'image', 500);
            }
        });

    } catch (error: any) {
        console.error('Upload error:', error);
        sendError(res, 'Erreur lors de l\'upload', 500);
    }
};

export const serveImage = async (req: Request, res: Response) => {
    try {
        const { filename } = req.params;
        
        // Validate filename to prevent path traversal
        if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
            return sendError(res, 'Nom de fichier invalide', 400);
        }

        const filepath = path.join(uploadsDir, filename);
        
        try {
            await fs.access(filepath);
            
            // Set appropriate headers including CORS
            const ext = path.extname(filename).toLowerCase();
            const mimeTypes: { [key: string]: string } = {
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.png': 'image/png',
                '.webp': 'image/webp'
            };
            
            const mimeType = mimeTypes[ext] || 'application/octet-stream';
            res.setHeader('Content-Type', mimeType);
            res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year cache
            res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
            res.setHeader('Access-Control-Allow-Methods', 'GET');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
            
            res.sendFile(filepath);
        } catch {
            sendError(res, 'Image non trouvée', 404);
        }
        
    } catch (error: any) {
        console.error('Error serving image:', error);
        sendError(res, 'Erreur lors de la récupération de l\'image', 500);
    }
};
