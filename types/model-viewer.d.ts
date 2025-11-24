/**
 * TypeScript type definitions for Google Model Viewer web component
 * @see https://modelviewer.dev/
 */

declare namespace JSX {
  interface IntrinsicElements {
    'model-viewer': React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLElement> & {
        src?: string;
        alt?: string;
        'auto-rotate'?: boolean;
        'camera-controls'?: boolean;
        'shadow-intensity'?: string;
        'exposure'?: string;
        'ar'?: boolean;
        'ar-modes'?: string;
        'camera-orbit'?: string;
        loading?: 'auto' | 'lazy' | 'eager';
        reveal?: 'auto' | 'interaction' | 'manual';
        style?: React.CSSProperties;
      },
      HTMLElement
    >;
  }
}

export {};
