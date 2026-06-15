export {};

global {

  interface I5eSceneLevelBackground {
    src?: string;
    color?: string;
    tint?: string;
    alphaThreshold?: number;
  }

  interface I5eSceneLevelForeground {
    src?: string | null;
    tint?: string;
    alphaThreshold?: number;
  }

  interface I5eSceneLevelTextures {
    anchorX?: number;
    anchorY?: number;
    offsetX?: number;
    offsetY?: number;
    fit?: string;
    scaleX?: number;
    scaleY?: number;
    rotation?: number;
  }

  interface I5eSceneLevel {
    _id?: string;
    name?: string;
    background?: I5eSceneLevelBackground;
    foreground?: I5eSceneLevelForeground | null;
    textures?: I5eSceneLevelTextures;
  }

  interface I5eSceneGrid {
    type?: number;
    size?: number;
    distance?: number;
    units?: string;
    color?: string;
    alpha?: number;
  }

  /** ddb-importer's own scene flags (foundry `flags.ddbimporter`). */
  interface I5eSceneDDBImporterFlags extends IDDBImporterFlags {
    bookCode?: string;
    sceneAdjustment?: boolean;
    edgeBackgroundColor?: string | null;
  }

  interface I5eSceneDDBFlags {
    ddbId: number;
    cobaltId: number | null;
    parentId: number | null;
    contentChunkId: string;
    slug: string | null;
    bookCode: string;
    source: string;
    player: boolean;
    imageFilename: string | null;
  }

  // replace this when a ddb tables is revised
  interface I5eSceneData {
    _id?: string;
    name?: string;
    navName?: string;
    width?: number;
    height?: number;
    padding?: number;
    initialLevel?: string;
    levels?: I5eSceneLevel[];
    shiftX?: number;
    shiftY?: number;
    grid?: I5eSceneGrid;
    folder?: string;
    sort?: number;
    ownership?: { default: number };
    type?: string;
    flags?: {
      ddbimporter?: I5eSceneDDBImporterFlags;
      ddb?: I5eSceneDDBFlags;
    };
  }
}
