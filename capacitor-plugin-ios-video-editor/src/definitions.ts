export interface IosVideoEditorPlugin {
  /**
   * Pick and optionally edit a video
   */
  pickAndEditVideo(options: {
    source?: 'camera' | 'photos' | 'prompt';
    allowTrim?: boolean;
    quality?: 'low' | 'medium' | 'high';
  }): Promise<{
    path: string;
    duration: number;
    size: number;
    status: 'selected' | 'trimmed' | 'compressed';
  }>;
}
