import { NextResponse } from 'next/server';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

/**
 * GET /api/predictions/model
 * 
 * Returns the trained ML model parameters as JSON
 */
export async function GET() {
  try {
    // Path to model file in scripts directory
    const modelPath = join(process.cwd(), 'scripts', 'model_params.json');
    
    if (!existsSync(modelPath)) {
      return NextResponse.json(
        { error: 'Model not found. Please run train_model.py first.' },
        { status: 404 }
      );
    }
    
    const modelData = readFileSync(modelPath, 'utf-8');
    const model = JSON.parse(modelData);
    
    return NextResponse.json(model);
  } catch (error) {
    console.error('Error loading model:', error);
    return NextResponse.json(
      { 
        error: 'Failed to load model',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
