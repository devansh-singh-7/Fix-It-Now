/**
 * Cloudinary Configuration and Utilities
 * 
 * Server-side utilities for uploading and deleting images from Cloudinary.
 * NEVER expose API secret to the client side.
 */

import { v2 as cloudinary } from 'cloudinary';
import crypto from 'crypto';

// Configure Cloudinary with environment variables
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Folder path for issue images
const UPLOAD_FOLDER = 'fixitnow/issues';

// Allowed image formats
export const ALLOWED_FORMATS = ['jpg', 'jpeg', 'png', 'webp'];

// Max file size in bytes (5MB)
export const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Allowed MIME types for validation
export const ALLOWED_MIME_TYPES = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
];

/**
 * Generate a unique filename for uploaded images
 * Pattern: issue_<timestamp>_<randomHash>
 */
function generateUniqueFilename(): string {
    const timestamp = Date.now();
    const randomHash = crypto.randomBytes(8).toString('hex');
    return `issue_${timestamp}_${randomHash}`;
}

/**
 * Upload result interface
 */
export interface CloudinaryUploadResult {
    secure_url: string;
    public_id: string;
    format: string;
}

/**
 * Upload an image buffer to Cloudinary
 * @param buffer - Image buffer from multipart form data
 * @param mimeType - MIME type of the image
 * @returns Upload result with secure_url, public_id, and format
 */
export async function uploadImage(
    buffer: Buffer,
    mimeType: string
): Promise<CloudinaryUploadResult> {
    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
        throw new Error(`Invalid file type. Allowed types: ${ALLOWED_FORMATS.join(', ')}`);
    }

    // Validate file size
    if (buffer.length > MAX_FILE_SIZE) {
        throw new Error('File size exceeds 5MB limit');
    }

    const filename = generateUniqueFilename();

    // Upload using upload_stream for buffer data
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: UPLOAD_FOLDER,
                public_id: filename,
                resource_type: 'image',
                // Preserve original format
                format: undefined,
            },
            (error, result) => {
                if (error) {
                    reject(new Error(`Upload failed: ${error.message}`));
                } else if (result) {
                    resolve({
                        secure_url: result.secure_url,
                        public_id: result.public_id,
                        format: result.format,
                    });
                } else {
                    reject(new Error('Upload failed: No result returned'));
                }
            }
        );

        // Write buffer to stream
        uploadStream.end(buffer);
    });
}

/**
 * Delete a single image from Cloudinary
 * @param publicId - The public_id of the image to delete
 */
export async function deleteImage(publicId: string): Promise<void> {
    try {
        await cloudinary.uploader.destroy(publicId);
    } catch (error) {
        console.error(`Failed to delete image ${publicId}:`, error);
        // Don't throw - image deletion failures shouldn't break ticket deletion
    }
}

/**
 * Delete multiple images from Cloudinary
 * @param publicIds - Array of public_ids to delete
 */
export async function deleteMultipleImages(publicIds: string[]): Promise<void> {
    if (!publicIds || publicIds.length === 0) return;

    try {
        // Delete in parallel for efficiency
        await Promise.all(publicIds.map(id => deleteImage(id)));
    } catch (error) {
        console.error('Failed to delete some images:', error);
        // Don't throw - continue even if some deletions fail
    }
}

/**
 * Generate a signed upload signature for client-side uploads
 * This allows the client to upload directly to Cloudinary
 */
export function generateUploadSignature() {
    const timestamp = Math.round(new Date().getTime() / 1000);
    const folder = UPLOAD_FOLDER;

    const signature = cloudinary.utils.api_sign_request(
        {
            timestamp,
            folder,
        },
        process.env.CLOUDINARY_API_SECRET!
    );

    return {
        signature,
        timestamp,
        folder,
        apiKey: process.env.CLOUDINARY_API_KEY,
        cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    };
}
