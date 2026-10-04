import { NextRequest, NextResponse } from 'next/server';
import { runMLInference, loadScalerParams, resolveModelPath } from '@/lib/ml/inference';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const scaler = loadScalerParams();
    let modelAvailable = true;
    let modelLocation = '';
    try {
      modelLocation = resolveModelPath();
    } catch {
      modelAvailable = false;
    }

    return NextResponse.json({
      status: 'ok',
      service: 'FreshStream AI Real ML Inference API',
      version: '2.0.0',
      runtime: 'Node.js (onnxruntime-node)',
      model: {
        name: 'freshstream_real_rul.onnx',
        architecture: '1D-CNN + LSTM Dual-Head Recurrent Network',
        status: modelAvailable ? 'LOADED_AND_READY' : 'MODEL_NOT_FOUND',
        model_path: modelLocation,
        features: scaler.features,
        sequence_window: scaler.window_size,
        targets: ['rul_hours', 'health_index'],
      },
      endpoints: {
        predict: '/api/predict',
      },
      sample_request: {
        single_reading: {
          temperature: 8.0,
          humidity: 75.0,
          gas: 12.0,
          ethanol: 5.0,
          cargo: 'beef',
        },
        sequence_readings: {
          sequence: [
            { temperature: 4.0, humidity: 82.0, ethanol: 2.5, gas: 4.0 },
            { temperature: 5.5, humidity: 80.0, ethanol: 3.1, gas: 4.5 },
            { temperature: 7.0, humidity: 78.0, ethanol: 4.0, gas: 5.2 },
          ],
        },
      },
      documentation: 'Send POST /api/predict with JSON body containing telemetry readings to compute instantaneous biological RUL and health index.',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { status: 'error', message: 'Failed to retrieve API information', details: message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error_code: 'INVALID_JSON_BODY',
          message: 'Request body must be a valid JSON object or array.',
        },
        { status: 400 }
      );
    }

    if (!body || (typeof body !== 'object' && !Array.isArray(body))) {
      return NextResponse.json(
        {
          success: false,
          error_code: 'INVALID_PAYLOAD',
          message: 'Request payload must be a JSON object or array of telemetry readings.',
        },
        { status: 400 }
      );
    }

    const result = await runMLInference(body);

    return NextResponse.json(result, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('ML Inference Error in /api/predict:', err);

    return NextResponse.json(
      {
        success: false,
        error_code: 'INFERENCE_EXECUTION_ERROR',
        message: 'ML inference execution failed.',
        details: message,
      },
      { status: 500 }
    );
  }
}
