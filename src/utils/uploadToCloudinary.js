import cloudinary from "../config/cloudinary.js";
import streamifier from 'streamifier';

const uploadToCloudinary = (buffer) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { resource_type: 'raw', folder: 'resumes' },
            (error, result) => {
                if (error) reject(error);
                else resolve(result);
            }
        );
        streamifier.createReadStream(buffer).pipe(stream);
    });
};

export default uploadToCloudinary;