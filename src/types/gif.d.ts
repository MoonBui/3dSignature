declare module 'gif.js-upgrade' {
  interface GIFOptions {
    workers?: number;
    quality?: number;
    width?: number;
    height?: number;
    workerScript?: string;
    [key: string]: any;
  }

  interface GIFFrameOptions {
    delay?: number;
    copy?: boolean;
    [key: string]: any;
  }

  class GIF {
    constructor(options?: GIFOptions);
    addFrame(imageElement: HTMLCanvasElement | HTMLImageElement | ImageData, options?: GIFFrameOptions): void;
    on(event: 'finished', callback: (blob: Blob) => void): void;
    on(event: string, callback: Function): void;
    render(): void;
  }

  export default GIF;
} 