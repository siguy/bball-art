/**
 * Image Processor for Multi-Platform Export
 * Uses sharp for image resizing and format conversion
 */

import sharp from 'sharp';
import { existsSync, mkdirSync } from 'fs';
import { join, dirname, basename, extname } from 'path';

// Platform configurations
const PLATFORM_CONFIGS = {
  website: {
    maxWidth: 1200,
    format: 'png',
    quality: 100
  },
  instagram: {
    maxWidth: 1080,
    format: 'jpeg',
    quality: 95
  },
  twitter: {
    maxWidth: 1200,
    format: 'jpeg',
    quality: 90
  }
};

/**
 * Process an image for a specific platform
 * @param {string} sourcePath - Path to source image
 * @param {string} outputDir - Directory to save processed image
 * @param {string} platform - Target platform ('website', 'instagram', 'twitter')
 * @param {string} [outputFilename] - Custom output filename (without extension)
 * @returns {Promise<{success: boolean, path?: string, error?: string}>}
 */
export async function processForPlatform(sourcePath, outputDir, platform, outputFilename = null) {
  try {
    const config = PLATFORM_CONFIGS[platform];
    if (!config) {
      throw new Error(`Unknown platform: ${platform}`);
    }

    // Ensure output directory exists
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }

    // Determine output filename
    const sourceBasename = basename(sourcePath, extname(sourcePath));
    const finalFilename = outputFilename || `${sourceBasename}-${platform}`;
    const outputPath = join(outputDir, `${finalFilename}.${config.format}`);

    // Process image
    let pipeline = sharp(sourcePath)
      .resize({ width: config.maxWidth, withoutEnlargement: true });

    if (config.format === 'jpeg') {
      pipeline = pipeline.jpeg({ quality: config.quality });
    } else if (config.format === 'png') {
      pipeline = pipeline.png({ quality: config.quality });
    }

    await pipeline.toFile(outputPath);

    return { success: true, path: outputPath };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Generate enhanced filename for export
 * Format: {series}-{pairingId}-{template}-{playerPose}+{figurePose}-{timestamp}-v{version}
 * @param {object} options - Filename options
 * @returns {string} Generated filename (without extension)
 */
export function generateExportFilename(options) {
  const {
    series = 's1',
    pairingId,
    template,
    playerPose = 'default',
    figurePose = 'default',
    version = 1
  } = options;

  // Compact ISO timestamp (no separators)
  const timestamp = new Date().toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}Z$/, '')
    .replace('T', 'T');

  // Clean up pose names (remove spaces, lowercase)
  const cleanPlayerPose = playerPose.toLowerCase().replace(/\s+/g, '-');
  const cleanFigurePose = figurePose.toLowerCase().replace(/\s+/g, '-');

  return `${series}-${pairingId}-${template}-${cleanPlayerPose}+${cleanFigurePose}-${timestamp}-v${version}`;
}

/**
 * Process image for multiple platforms at once
 * @param {string} sourcePath - Path to source image
 * @param {string} baseOutputDir - Base directory for outputs
 * @param {string[]} platforms - Array of platforms to process for
 * @param {string} [baseFilename] - Base filename for outputs
 * @returns {Promise<{[platform: string]: {success: boolean, path?: string, error?: string}}>}
 */
export async function processForMultiplePlatforms(sourcePath, baseOutputDir, platforms, baseFilename = null) {
  const results = {};

  for (const platform of platforms) {
    const outputDir = join(baseOutputDir, platform);
    results[platform] = await processForPlatform(sourcePath, outputDir, platform, baseFilename);
  }

  return results;
}

/**
 * Get image metadata
 * @param {string} imagePath - Path to image
 * @returns {Promise<{width: number, height: number, format: string}>}
 */
export async function getImageMetadata(imagePath) {
  const metadata = await sharp(imagePath).metadata();
  return {
    width: metadata.width,
    height: metadata.height,
    format: metadata.format
  };
}

/**
 * Trim white/light borders from an image
 * Uses Sharp's trim() to detect and remove uniform borders
 * @param {string} inputPath - Path to input image
 * @param {string} [outputPath] - Path to save trimmed image (defaults to overwriting input)
 * @param {object} [options] - Trim options
 * @param {number} [options.threshold=30] - Color similarity threshold (0-255, higher = more aggressive)
 * @returns {Promise<{success: boolean, trimmed: boolean, path?: string, error?: string, originalSize?: object, newSize?: object}>}
 */
export async function trimWhiteBorder(inputPath, outputPath = null, options = {}) {
  const { threshold = 80 } = options;
  const finalOutputPath = outputPath || inputPath;

  try {
    // Get original dimensions
    const originalMeta = await sharp(inputPath).metadata();
    const originalSize = { width: originalMeta.width, height: originalMeta.height };

    // Two-pass trim to isolate the card art:
    // Pass 1: Trim dark outer padding (auto-detects from top-left pixel)
    const pass1Buffer = await sharp(inputPath)
      .trim({ threshold })
      .toBuffer();

    // Pass 2: Trim white/gray inner border (explicitly target white)
    const pass2Buffer = await sharp(pass1Buffer)
      .trim({ background: '#ffffff', threshold })
      .toBuffer();

    // Get trimmed dimensions
    const trimmedMeta = await sharp(pass2Buffer).metadata();

    // Check if anything was actually trimmed
    const wasTrimmed = (originalSize.width !== trimmedMeta.width) || (originalSize.height !== trimmedMeta.height);

    if (!wasTrimmed) {
      await sharp(pass2Buffer).toFile(finalOutputPath);
      return {
        success: true,
        trimmed: false,
        path: finalOutputPath,
        originalSize,
        newSize: originalSize
      };
    }

    // Instead of cropping (which shifts text), composite the trimmed art
    // onto a background canvas at the ORIGINAL dimensions.
    // This replaces the white border with the card's background color.

    // Sample the card's background color (25% in from edges to avoid border area)
    const sampleX = Math.floor(trimmedMeta.width * 0.25);
    const sampleY = Math.floor(trimmedMeta.height * 0.25);
    const sampleSize = 10;

    const { data: sampleData, info: sampleInfo } = await sharp(pass2Buffer)
      .extract({ left: sampleX, top: sampleY, width: sampleSize, height: sampleSize })
      .raw()
      .toBuffer({ resolveWithObject: true });

    // Average the sampled pixels for background color
    let rSum = 0, gSum = 0, bSum = 0;
    const totalPixels = sampleSize * sampleSize;
    for (let i = 0; i < totalPixels; i++) {
      rSum += sampleData[i * sampleInfo.channels];
      gSum += sampleData[i * sampleInfo.channels + 1];
      bSum += sampleData[i * sampleInfo.channels + 2];
    }
    const bgColor = {
      r: Math.round(rSum / totalPixels),
      g: Math.round(gSum / totalPixels),
      b: Math.round(bSum / totalPixels)
    };

    // Create canvas at original size with sampled bg color, composite trimmed art centered
    await sharp({
      create: {
        width: originalSize.width,
        height: originalSize.height,
        channels: 3,
        background: bgColor
      }
    })
      .composite([{ input: pass2Buffer, gravity: 'centre' }])
      .jpeg({ quality: 95 })
      .toFile(finalOutputPath);

    return {
      success: true,
      trimmed: true,
      path: finalOutputPath,
      originalSize,
      newSize: originalSize // Same dimensions - border replaced, not removed
    };
  } catch (error) {
    return {
      success: false,
      trimmed: false,
      error: error.message
    };
  }
}

export default {
  processForPlatform,
  processForMultiplePlatforms,
  generateExportFilename,
  getImageMetadata,
  trimWhiteBorder,
  PLATFORM_CONFIGS
};
