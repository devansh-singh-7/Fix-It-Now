
import { NextResponse } from 'next/server';
import { generateUploadSignature } from '@/app/lib/cloudinary';

/**
 * GET /api/upload/sign
 * Generates a signature for client-side Cloudinary uploads.
 * 
 * Response: { success: true, data: { signature, timestamp, folder, apiKey, cloudName } }
 */
export async function GET() {
  try {
    // In a production app, you should check for authentication here
    // e.g. const uid = request.headers.get('x-user-id');
    // if (!uid) return error...

    const signData = generateUploadSignature();

    return NextResponse.json({
      success: true,
      data: signData
    });
  } catch (error) {
    console.error('Error generating signature:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate upload signature' },
      { status: 500 }
    );
  }
}
