#!/usr/bin/env node
/**
 * Draft Client - fal.ai FLUX.1 [dev]
 *
 * Cheap image generation for draft exploration (~$0.025/image).
 * Same interface as nano-banana-client.js so scripts can swap between them.
 *
 * Uses fal.ai's FLUX.1 [dev] endpoint for text-to-image.
 * Set FAL_KEY in .env to use.
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { dirname } from 'path';
import 'dotenv/config';

const FAL_API_URL = 'https://queue.fal.run/fal-ai/flux/dev';
// Status/result URLs use the base model path (without /dev subpath)
const FAL_REQUESTS_BASE = 'https://queue.fal.run/fal-ai/flux/requests';

// Map aspect ratios to fal.ai image_size presets
const ASPECT_RATIO_MAP = {
  '3:4': { width: 768, height: 1024 },
  '4:3': { width: 1024, height: 768 },
  '1:1': { width: 1024, height: 1024 },
  '16:9': { width: 1024, height: 576 },
  '9:16': { width: 576, height: 1024 },
};

/**
 * Generate an image using fal.ai FLUX.1 [dev]
 * @param {string} prompt - The image generation prompt
 * @param {Object} options - Generation options (same interface as nano-banana-client)
 * @param {string} options.outputPath - Where to save the image
 * @param {string} options.aspectRatio - Aspect ratio (default: '3:4')
 * @param {Array} options.referenceImages - Ignored for drafts (logged as skipped)
 * @returns {Object} - Result with image data or error
 */
export async function generateImage(prompt, options = {}) {
  const {
    outputPath = null,
    aspectRatio = '3:4',
    referenceImages = [],
  } = options;

  const apiKey = process.env.FAL_KEY;
  if (!apiKey) {
    return {
      success: false,
      error: 'FAL_KEY not set in .env',
    };
  }

  console.log(`[DRAFT] Generating with fal.ai FLUX.1 [dev]...`);
  console.log(`Prompt length: ${prompt.length} characters`);

  if (referenceImages.length > 0) {
    console.log(`  Note: Skipping ${referenceImages.length} reference image(s) in draft mode`);
  }

  const dims = ASPECT_RATIO_MAP[aspectRatio] || ASPECT_RATIO_MAP['3:4'];
  console.log(`Dimensions: ${dims.width}x${dims.height} (${aspectRatio})`);

  try {
    // Submit to queue
    const submitResponse = await fetch(FAL_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        image_size: { width: dims.width, height: dims.height },
        num_images: 1,
        enable_safety_checker: false,
        output_format: 'png',
      }),
    });

    if (!submitResponse.ok) {
      const errorBody = await submitResponse.text();
      return {
        success: false,
        error: `fal.ai API error ${submitResponse.status}: ${errorBody}`,
      };
    }

    const submitData = await submitResponse.json();

    // If we got images directly (sync mode), use them
    if (submitData.images) {
      return await downloadAndSave(submitData.images[0].url, outputPath);
    }

    // Otherwise poll the queue
    const requestId = submitData.request_id;
    if (!requestId) {
      return {
        success: false,
        error: 'No request_id in queue response',
        raw: submitData,
      };
    }

    console.log(`[DRAFT] Queued (${requestId}), polling for result...`);

    // Poll for completion
    const statusUrl = `${FAL_REQUESTS_BASE}/${requestId}/status`;
    const resultUrl = `${FAL_REQUESTS_BASE}/${requestId}`;

    for (let i = 0; i < 60; i++) {
      await new Promise(r => setTimeout(r, 2000));

      const statusResponse = await fetch(statusUrl, {
        headers: { 'Authorization': `Key ${apiKey}` },
      });

      if (!statusResponse.ok) continue;

      const status = await statusResponse.json();

      if (status.status === 'COMPLETED') {
        // Fetch the result
        const resultResponse = await fetch(resultUrl, {
          headers: { 'Authorization': `Key ${apiKey}` },
        });

        if (!resultResponse.ok) {
          return {
            success: false,
            error: `Failed to fetch result: ${resultResponse.status}`,
          };
        }

        const result = await resultResponse.json();

        if (!result.images || !result.images[0]) {
          return {
            success: false,
            error: 'No images in result',
            raw: result,
          };
        }

        return await downloadAndSave(result.images[0].url, outputPath);
      }

      if (status.status === 'FAILED') {
        return {
          success: false,
          error: `Generation failed: ${status.error || 'unknown error'}`,
        };
      }

      // Still IN_QUEUE or IN_PROGRESS, keep polling
    }

    return {
      success: false,
      error: 'Timed out waiting for image generation',
    };
  } catch (error) {
    console.error('[DRAFT] Generation error:', error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Download image from URL and save to disk
 */
async function downloadAndSave(imageUrl, outputPath) {
  const imageResponse = await fetch(imageUrl);
  if (!imageResponse.ok) {
    return {
      success: false,
      error: `Failed to download image: ${imageResponse.status}`,
    };
  }

  const buffer = Buffer.from(await imageResponse.arrayBuffer());

  if (outputPath) {
    const dir = dirname(outputPath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    const finalPath = outputPath.endsWith('.png') ? outputPath : `${outputPath}.png`;
    writeFileSync(finalPath, buffer);
    console.log(`[DRAFT] Image saved to: ${finalPath}`);

    return {
      success: true,
      path: finalPath,
      mimeType: 'image/png',
      size: buffer.length,
    };
  }

  return {
    success: true,
    data: buffer.toString('base64'),
    mimeType: 'image/png',
  };
}

// CLI interface
if (process.argv[1] && process.argv[1].endsWith('draft-client.js')) {
  const command = process.argv[2];

  if (command === 'test') {
    console.log('Testing fal.ai connection...');
    const result = await generateImage('A simple red circle on a white background', {
      outputPath: null,
    });
    console.log(result.success ? '✓ Connection successful' : `✗ Connection failed: ${result.error}`);
    process.exit(result.success ? 0 : 1);
  } else if (command === 'generate') {
    const prompt = process.argv[3];
    const outputPath = process.argv[4];

    if (!prompt) {
      console.error('Usage: node draft-client.js generate "<prompt>" [output-path]');
      process.exit(1);
    }

    const result = await generateImage(prompt, { outputPath });
    if (result.success) {
      console.log('✓ Draft image generated');
      if (result.path) console.log(`  Path: ${result.path}`);
    } else {
      console.log('✗ Generation failed:', result.error);
    }
    process.exit(result.success ? 0 : 1);
  } else {
    console.log('Draft Client (fal.ai FLUX.1 [dev])');
    console.log('====================================');
    console.log('Commands:');
    console.log('  test                          - Test API connection');
    console.log('  generate "<prompt>" [output]  - Generate a draft image');
    console.log('');
    console.log('Environment:');
    console.log(`  FAL_KEY: ${process.env.FAL_KEY ? '✓ Set' : '✗ Not set'}`);
  }
}
