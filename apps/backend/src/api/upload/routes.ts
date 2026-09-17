// src/api/upload/routes.ts
import { Router } from 'express';
import { uploadController } from './controller';
import multer from 'multer';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|mp4|mov/;
    const extname = allowedTypes.test(file.mimetype.toLowerCase());
    if (extname) {
      return cb(null, true);
    }
    cb(new Error('Only images, PDFs, and videos are allowed'));
  }
});

const router = Router();

// Upload profile picture
router.post('/profile-picture', upload.single('image'), uploadController.uploadProfilePicture);

// Upload event images
router.post('/event-images', upload.array('images', 10), uploadController.uploadEventImages);

// Upload documents (ID, tickets, etc.)
router.post('/documents', upload.array('files', 5), uploadController.uploadDocuments);

// Delete uploaded file
router.delete('/:publicId', uploadController.deleteFile);

export default router;