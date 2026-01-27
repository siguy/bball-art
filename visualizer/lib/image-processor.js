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

export default {
  processForPlatform,
  processForMultiplePlatforms,
  generateExportFilename,
  getImageMetadata,
  PLATFORM_CONFIGS
};
