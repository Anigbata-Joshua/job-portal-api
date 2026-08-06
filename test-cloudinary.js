import { v2 as cloudinary } from 'cloudinary';
import 'dotenv/config';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Try uploading a tiny raw text file (no need for a real PDF right now —
// we're testing whether raw uploads are permitted at all)
cloudinary.uploader.upload('data:text/plain;base64,SGVsbG8gV29ybGQ=', {
    resource_type: 'raw',
    folder: 'test',
})
    .then((res) => console.log('✅ RAW UPLOAD SUCCESS:', res.secure_url))
    .catch((err) => console.log('❌ RAW UPLOAD FAILED:', err.message));