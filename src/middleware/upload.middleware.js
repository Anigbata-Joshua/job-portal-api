import multer from 'multer';
import ApiError from '../utils/ApiError.js';

// Store the file in memory temporarily, as a buffer — we don't want it
// saved to local disk, since we're streaming it straight to Cloudinary.
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    const allowedMimeTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    const allowedExtensions = ['.pdf', '.doc', '.docx'];

    const hasValidMime = allowedMimeTypes.includes(file.mimetype);
    const hasValidExtension = allowedExtensions.some((ext) =>
        file.originalname.toLowerCase().endsWith(ext)
    );

    if (hasValidMime || hasValidExtension) {
        cb(null, true);
    } else {
        cb(new ApiError(400, 'Only PDF and Word documents are allowed'), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
});

export default upload;