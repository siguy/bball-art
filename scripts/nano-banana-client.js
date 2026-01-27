#!/usr/bin/env node
/**
 * Nano Banana Client - AI Studio Image Generation
 *
 * Uses Google's Gemini API via AI Studio for image generation.
 * Models:
 *   - gemini-2.5-flash-image (Nano Banana) - Fast, efficient
 *   - gemini-3-pro-image-preview (Nano Banana Pro) - Higher quality
 */

import { GoogleGenAI } from '@google/genai';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');

// Default model for image generation
const DEFAULT_IMAGE_MODEL = 'gemini-2.5-flash-image';
const DEFAULT_TEXT_MODEL = 'gemini-2.0-flash';

// Initialize the client
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

/**
 * Generate an image using Nano Banana
 * @param {string} prompt - The image generation prompt
 * @param {Object} options - Generation options
 * @returns {Object} - Result with image data or error
 */
export async function generateImage(prompt, options = {}) {
  const {
    model = process.env.GEMINI_IMAGE_MODEL || DEFAULT_IMAGE_MODEL,
    outputPath = null,
    aspectRatio = '2:3', // Card ratio (close to 2.5:3.5)
  } = options;

  console.log(`Generating image with ${model}...`);
  console.log(`Prompt length: ${prompt.length} characters`);

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseModalities: ['image', 'text'],
      }
    });

    // Check for image in response
    if (response.candidates && response.candidates[0]) {
      const candidate = response.candidates[0];

      // Look for image parts
      for (const part of candidate.content.parts || []) {
        if (part.inlineData && part.inlineData.mimeType?.startsWith('image/')) {
          const imageData = part.inlineData.data;
          const mimeType = part.inlineData.mimeType;
          const extension = mimeType.split('/')[1] || 'png';

          if (outputPath) {
            // Ensure directory exists
            const dir = dirname(outputPath);
            if (!existsSync(dir)) {
              mkdirSync(dir, { recursive: true });
            }

            // Write image file
            const buffer = Buffer.from(imageData, 'base64');
            const finalPath = outputPath.endsWith(`.${extension}`)
              ? outputPath
              : `${outputPath}.${extension}`;
            writeFileSync(finalPath, buffer);
            console.log(`Image saved to: ${finalPath}`);

            return {
              success: true,
              path: finalPath,
              mimeType,
              size: buffer.length
            };
          }

          return {
            success: true,
            data: imageData,
            mimeType
          };
        }
      }

      // No image found, check for text response
      const textPart = candidate.content.parts?.find(p => p.text);
      if (textPart) {
        console.log('Model response (text):', textPart.text);
        return {
          success: false,
          error: 'No image generated',
          message: textPart.text
        };
      }
    }

    return {
      success: false,
      error: 'No valid response from model',
      raw: response
    };

  } catch (error) {
    console.error('Generation error:', error.message);
    return {
      success: false,
      error: error.message,
      code: error.code
    };
  }
}

/**
 * Test the API connection
 */
export async function testConnection() {
  console.log('Testing Gemini API connection...');

  try {
    // Use text model for connection test (faster)
    const response = await ai.models.generateContent({
      model: DEFAULT_TEXT_MODEL,
      contents: 'Say "API connection successful!" in exactly those words.',
    });

    const text = response.candidates?.[0]?.content?.parts?.[0]?.text;
    console.log('Response:', text);
    return { success: true, message: text };
  } catch (error) {
    console.error('Connection test failed:', error.message);
    return { success: false, error: error.message };
  }
}

// CLI interface
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const command = process.argv[2];

  if (command === 'test') {
    testConnection().then(result => {
      console.log(result.success ? '✓ Connection successful' : '✗ Connection failed');
      process.exit(result.success ? 0 : 1);
    });
  } else if (command === 'generate') {
    const prompt = process.argv[3];
    const outputPath = process.argv[4];

    if (!prompt) {
      console.error('Usage: node nano-banana-client.js generate "<prompt>" [output-path]');
      process.exit(1);
    }

    generateImage(prompt, { outputPath }).then(result => {
      if (result.success) {
        console.log('✓ Image generated successfully');
        if (result.path) console.log(`  Path: ${result.path}`);
      } else {
        console.log('✗ Generation failed:', result.error);
        if (result.message) console.log('  Message:', result.message);
      }
      process.exit(result.success ? 0 : 1);
    });
  } else {
    console.log('Nano Banana Client');
    console.log('==================');
    console.log('Commands:');
    console.log('  test                          - Test API connection');
    console.log('  generate "<prompt>" [output]  - Generate an image');
    console.log('');
    console.log('Environment:');
    console.log(`  GEMINI_API_KEY: ${process.env.GEMINI_API_KEY ? '✓ Set' : '✗ Not set'}`);
    console.log(`  GEMINI_IMAGE_MODEL: ${process.env.GEMINI_IMAGE_MODEL || DEFAULT_IMAGE_MODEL}`);
  }
}
