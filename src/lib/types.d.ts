export {};

global {
  interface IDDBImporterDebugLogEntry {
    level: string;
    message: string;
    payload?: any[];
  }
  interface IDDBImporterDebugConfig {
    record: boolean;
    log: IDDBImporterDebugLogEntry[];
    download: () => void;
  }

  interface IIconMapEntry {
    type: string;
    folder: string | null;
    _id: string;
    uuid: string;
    name: string;
    img: string;
    prototypeToken?: {
      texture: {
        src: string;
        scaleY: number;
        scaleX: number;
      };
    };
  }

  interface ICompendiumLookup {
    _id: string;
    name: string;
    uuid: string;
    img: string;
    [key: string]: any;
  }

  type TGridSource =
    | "detected"
    | "template"
    | "tokenScale-snapped"
    | "tokenScale"
    | "default";

  interface IResolvedGrid {
    size: number;
    offsetX: number;
    offsetY: number;
    sceneScale: number;
    source: TGridSource;
  }

  interface IGridResolverInput {
    detection: IGridDetectionResult | null;
    tokenScale?: number | null;
    width: number;
    multiplier: number;
    // When set, the resolver clamps the Foundry grid.size to at least this
    // many pixels by scaling sceneScale up. Used to keep scenes playable when
    // the detected painted period is so small the default cell would be too
    // tiny to interact with (e.g. low-resolution DDB exports).
    minGridSize?: number;
  }

  interface ICandidateEntry {
    paintedSize: number;
    gridSize: number;
    sceneScale: number;
    sceneWidth: number;
    offsetX: number;
    offsetY: number;
    rawPaintedOffsetX: number;
    rawPaintedOffsetY: number;
  }

  interface ICandidateSummary {
    autocorrelation: ICandidateEntry | null;
    template: ICandidateEntry | null;
    priorPeriod: ICandidateEntry | null;
    tokenScale: ICandidateEntry | null;
    tokenScaleDoubled: ICandidateEntry | null;
    tokenScaleHalved: ICandidateEntry | null;
    multiplier: number;
  }

  interface IGridDetectorOptions {
    expectedScale?: number;            // tokenScale hint from DDB (cell width / image width)
    targetMaxSide?: number;            // downsample target (default 1024)
    confidenceThreshold?: number;      // default 0.25
    searchPaddingFraction?: number;    // ±fraction around expected size (default 0.5)
    squareToleranceFraction?: number;  // X vs Y agreement (default 0.05)
    edgeTrimFraction?: number;         // strip this fraction off each edge before detection (default 0.05)
  }

  interface IGridDetectionResult {
    detected: boolean;
    size: number;
    offsetX: number;
    offsetY: number;
    confidence: number;
    priorOffsetX?: number | null;
    priorOffsetY?: number | null;
    priorSize?: number | null;
    templateSize?: number | null;
    templateOffsetX?: number | null;
    templateOffsetY?: number | null;
    templateScore?: number | null;
    diagnostics?: {
      sizeX: number;
      sizeY: number;
      confidenceX: number;
      confidenceY: number;
      width: number;
      height: number;
      scaleFactor: number;
      expectedSize: number | null;
      lagMin: number;
      lagMax: number;
    };
  }
}
