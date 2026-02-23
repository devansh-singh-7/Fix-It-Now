import { NextResponse } from 'next/server';
import { uploadImage, ALLOWED_MIME_TYPES, MAX_FILE_SIZE } from '@/app/lib/cloudinary';

/**
 * POST /api/upload
 * Upload an image file to Cloudinary
 * 
 * Request: multipart/form-data with 'file' field
 * Response: { success: true, data: { secure_url, public_id, format } }
 */
export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File | null;

        // Validate file presence
        if (!file) {
            return NextResponse.json(
                { success: false, error: 'No file provided' },
                { status: 400 }
            );
        }

        // Validate file type
        if (!ALLOWED_MIME_TYPES.includes(file.type)) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Only image files are allowed (jpg, jpeg, png, webp)'
                },
                { status: 400 }
            );
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json(
                { success: false, error: 'File size exceeds 5MB limit' },
                { status: 400 }
            );
        }

        // Convert File to Buffer for Cloudinary upload
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Upload to Cloudinary
        const result = await uploadImage(buffer, file.type);

        return NextResponse.json({
            success: true,
            data: {
                secure_url: result.secure_url,
                public_id: result.public_id,
                format: result.format,
            }
        });
    } catch (error) {
        console.error('Upload error:', error);

        const errorMessage = error instanceof Error
            ? error.message
            : 'Failed to upload image';

        return NextResponse.json(
            { success: false, error: errorMessage },
            { status: 500 }
        );
    }
}
