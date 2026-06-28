import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

const cloudinaryConfig = {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME?.trim(),
    api_key: process.env.CLOUDINARY_API_KEY?.trim(),
    api_secret: process.env.CLOUDINARY_API_SECRET?.trim(),
};

// Cloudinary Configuration
cloudinary.config(cloudinaryConfig);

const validateCloudinaryConfig = () => {
    const missingKeys = Object.entries(cloudinaryConfig)
        .filter(([, value]) => !value)
        .map(([key]) => key);

    if (missingKeys.length) {
        const error = new Error(`Cloudinary is not configured. Missing: ${missingKeys.join(", ")}`);
        error.statusCode = 503;
        error.isCloudinaryConfigError = true;
        throw error;
    }
};

// Upload function (buffer-based)
export const uploadToCloudinary = (fileBuffer, folderName = "uploads", resourceType = "image") => {
    return new Promise((resolve, reject) => {
        try {
            validateCloudinaryConfig();
        } catch (error) {
            reject(error);
            return;
        }

        const stream = cloudinary.uploader.upload_stream(
            {
                folder: folderName,
                resource_type: resourceType,
            },
            (error, result) => {
                if (error) {
                    if (error.message?.toLowerCase().includes("invalid cloud_name")) {
                        error.statusCode = 503;
                        error.isCloudinaryConfigError = true;
                    }

                    return reject(error);
                }
                resolve(result);
            }
        );
        stream.end(fileBuffer);
    });
};


