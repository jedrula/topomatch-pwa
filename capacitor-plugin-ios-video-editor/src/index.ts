import { registerPlugin } from '@capacitor/core';
import type { IosVideoEditorPlugin } from './definitions';

const IosVideoEditor = registerPlugin<IosVideoEditorPlugin>('IosVideoEditor', {
  web: () => {
    throw new Error('IosVideoEditor plugin is only available on iOS');
  },
});

export * from './definitions';
export { IosVideoEditor };
