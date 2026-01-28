# Debugging Playbook

Quick reference for troubleshooting issues at each phase.

## Phase 1: Data Issues

- [ ] **Validate JSON syntax**: `node -e "require('./data/file.json')"`
- [ ] **Check required fields**: Compare against schema in templates
- [ ] **Verify color arrays**: Must be valid CSS color names or hex values
- [ ] **Check era matches player**: 90s player shouldn't have 2020s era

## Phase 2: Generation Issues

### API Problems
- [ ] **API key valid?** Check `.env` file and Google Cloud console
- [ ] **Rate limited?** Vertex AI has quotas - wait and retry
- [ ] **Prompt too long?** Gemini has token limits - trim description
- [ ] **Model unavailable?** Check model name: `gemini-3-pro-image-preview`

### Output Quality
- [ ] **Bad output?** Log the prompt, compare to successful ones
- [ ] **Logos appearing?** Add stronger negative: "no NBA logos, no team names, no brand marks"
- [ ] **Wrong style?** Check card-type template matches era
- [ ] **Likeness off?** Add more specific player description (signature pose, jersey colors)

### Common Fixes
```
# Test API connection
node -e "const {VertexAI} = require('@google-cloud/vertexai'); console.log('Loaded OK')"

# Check environment
node -e "require('dotenv').config(); console.log(process.env.GOOGLE_CLOUD_PROJECT)"
```

## Phase 3: Social Issues

- [ ] **API credentials valid?** Test with Meta Graph API explorer
- [ ] **Rate limits hit?** Max 50 API posts per 24 hours
- [ ] **Image dimensions?** Instagram feed: 1080x1080 or 1080x1350
- [ ] **Token expired?** Extend via Access Token Debugger in Meta for Developers

### n8n Specific
- [ ] **Workflow not triggering?** Check trigger configuration
- [ ] **Data not passing?** Use n8n's built-in debug mode
- [ ] **API node failing?** Test the endpoint in Postman first

## Phase 4: Website Issues

- [ ] **Build locally first**: `npm run dev`
- [ ] **Check console for JS errors**: Open DevTools
- [ ] **Environment variables set?** Vercel dashboard or `.env.local`
- [ ] **Shopify API connection?** Test storefront access token
- [ ] **Images not loading?** Check paths are relative or use Next.js Image

### Common Next.js Fixes
```bash
# Clear cache and rebuild
rm -rf .next && npm run dev

# Check for hydration errors in console
# Usually caused by date/time or browser-specific code
```

## Phase 5: Game Issues

- [ ] **Asset loading?** Check paths in Phaser's `preload()` function
- [ ] **Performance?** Profile with Chrome DevTools Performance tab
- [ ] **Physics off?** Check collision bounds and arcade physics settings
- [ ] **Sprites not showing?** Verify spritesheet dimensions match config

### Phaser Specific
```javascript
// Debug: Show physics bodies
this.physics.world.createDebugGraphic();

// Debug: Log asset loading
this.load.on('complete', () => console.log('All assets loaded'));
```

## Visualizer & Export Issues

### Server Won't Start
- [ ] **Port in use?** `lsof -i :3333` then kill the process
- [ ] **Missing dependencies?** Run `npm install` in visualizer/
- [ ] **Module errors?** Check imports in server.js match lib/ files

### Export Problems
- [ ] **Image processing fails?** Check sharp is installed: `npm ls sharp`
- [ ] **Caption empty?** Verify pairing has poseFileId linking to pose files
- [ ] **Quotes missing?** Check `data/quotes/figures/{figureId}.json` exists
- [ ] **Queue not saving?** Check `visualizer/data/export-queue.json` is writable

### Buffer Integration
- [ ] **Not configured?** Set `BUFFER_ACCESS_TOKEN` environment variable
- [ ] **No profiles?** Connect Instagram/Twitter in Buffer dashboard first
- [ ] **Posts failing?** Buffer requires publicly accessible image URLs

### Common Fixes
```bash
# Test visualizer modules
node -e "import('./lib/image-processor.js').then(() => console.log('OK'))"
node -e "import('./lib/caption-generator.js').then(() => console.log('OK'))"

# Test caption generation
node -e "
import cg from './lib/caption-generator.js';
console.log(cg.generateCaption({
  templateId: 'standard',
  platform: 'instagram',
  pairingId: 'jordan-moses'
}));
"

# Rebuild manifest
curl http://localhost:3333/api/manifest
```

## General Debugging Tips

1. **Start small**: Test with one pairing, one style before batching
2. **Log everything**: Prompts, API responses, errors
3. **Compare working vs broken**: What changed?
4. **Check the obvious first**: Typos, missing files, wrong paths
5. **Read error messages**: They usually tell you exactly what's wrong
