# iOS Video Editor Capacitor Plugin

Native iOS video picker with trim and compression.

## Features

- ✅ Pick video from Photos (iteration 1)
- ⏳ Trim with native UI (iteration 2)
- ⏳ Compress to 720p/2Mbps (iteration 3)

## Installation

```bash
npm install file:./capacitor-plugin-ios-video-editor
npx cap sync ios
```

## Usage

```typescript
import { IosVideoEditor } from 'capacitor-plugin-ios-video-editor';

const result = await IosVideoEditor.pickAndEditVideo({
  source: 'prompt',
  allowTrim: true,
  quality: 'medium'
});

console.log('Video path:', result.path);
console.log('Duration:', result.duration);
console.log('Size:', result.size);
```

## Iterations

- **v0.0.1**: Basic video picker (current)
- **v0.0.2**: Add trim capability
- **v0.0.3**: Add compression
