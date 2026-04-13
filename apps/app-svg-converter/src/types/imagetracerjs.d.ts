declare module 'imagetracerjs' {
  interface ImageTracerOptions {
    colorsampling?: number;
    numberofcolors?: number;
    blurradius?: number;
    blurdelta?: number;
    strokewidth?: number;
    linefilter?: boolean;
    pathomit?: number;
    roundcoords?: number;
    ltres?: number;
    qtres?: number;
    scale?: number;
    mincolorratio?: number;
    colorquantcycles?: number;
    layering?: number;
    desc?: boolean;
    viewbox?: boolean;
  }

  interface ImageTracer {
    imageToSVG(
      url: string,
      callback: (svgstr: string) => void,
      options?: string | ImageTracerOptions
    ): void;
    imagedataToSVG(
      imgd: ImageData,
      options?: string | ImageTracerOptions
    ): string;
  }

  const ImageTracer: ImageTracer;
  export default ImageTracer;
}
