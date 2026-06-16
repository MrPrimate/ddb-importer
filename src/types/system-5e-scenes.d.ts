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
    elevation?: {
      base?: number;
      bottom?: number;
      top?: number;
    };
  }

  interface I5eSceneGrid {
    type?: number;
    size?: number;
    /** grid line style (e.g. "solidLines"). */
    style?: string;
    thickness?: number;
    distance?: number;
    units?: string;
    color?: string;
    alpha?: number;
  }

  interface I5eSceneInitialView {
    x?: number | null;
    y?: number | null;
    scale?: number | null;
  }

  interface I5eSceneFog {
    /** one of CONST.FOG_EXPLORATION_MODES. */
    mode?: number;
    reset?: number;
    colors?: {
      explored?: string | null;
      unexplored?: string | null;
    };
  }

  /** A single environment lighting profile (foundry `environment.base`/`dark`). */
  interface I5eSceneEnvironmentProfile {
    hue?: number;
    intensity?: number;
    luminosity?: number;
    saturation?: number;
    shadows?: number;
  }


  interface I5eSceneEnvironment {
    darknessLevel?: number;
    darknessLock?: boolean;
    /** global light config (subset of LightData). */
    globalLight?: {
      enabled?: boolean;
      alpha?: number;
      bright?: boolean;
      color?: string | null;
      coloration?: number;
      luminosity?: number;
      saturation?: number;
      contrast?: number;
      shadows?: number;
      darkness?: { min?: number; max?: number };
    };
    cycle?: boolean;
    base?: I5eSceneEnvironmentProfile;
    dark?: I5eSceneEnvironmentProfile;
  }

  interface I5eSceneTransition {
    type?: string | null;
    /** integer ms. */
    duration?: number;
    activeOnly?: boolean;
  }

  /**
   * A placed Token doc (foundry `BaseToken`) embedded in `Scene.tokens`.
   * Extends the prototype-token appearance fields (`I5ePrototypeToken`) with the
   * instance/placement fields a placed token adds (id, position, level, sort,
   * locked/hidden state, linked actor + delta).
   */
  interface I5eTokenData extends I5ePrototypeToken {
    _id?: string;
    /** linked Actor id (idOnly). */
    actorId?: string | null;
    /** ActorDelta source (unlinked token overrides). */
    delta?: Record<string, unknown> | null;
    /** integer canvas x. */
    x?: number;
    /** integer canvas y. */
    y?: number;
    elevation?: number;
    depth?: number;
    /** one of CONST.TOKEN_SHAPES. */
    shape?: number;
    /** owning Level id. */
    level?: string;
    sort?: number;
    locked?: boolean;
    hidden?: boolean;
  }

  /**
   * Texture placement (foundry `TextureData`)  shared by Token/Note/Tile.
   * Same shape as `I5eTokenTexture`.
   */
  type I5eTextureData = I5eTokenTexture;

  /** A Drawing doc (foundry `BaseDrawing`) embedded in `Scene.drawings`. */
  interface I5eDrawingData {
    _id?: string;
    name?: string;
    /** author User id. */
    author?: string | null;
    /** ShapeData (loose). */
    shape?: Record<string, unknown>;
    x?: number;
    y?: number;
    elevation?: number;
    /** set of Level ids the drawing belongs to. */
    levels?: string[];
    sort?: number;
    rotation?: number;
    /** AlphaField, max 0.5. */
    bezierFactor?: number;
    /** one of CONST.DRAWING_FILL_TYPES. */
    fillType?: number;
    fillColor?: string;
    fillAlpha?: number;
    /** integer. */
    strokeWidth?: number;
    strokeColor?: string;
    strokeAlpha?: number;
    /** FilePathField (IMAGE). */
    texture?: string | null;
    text?: string;
    fontFamily?: string;
    /** integer 8–256. */
    fontSize?: number;
    textColor?: string;
    textAlpha?: number;
    hidden?: boolean;
    locked?: boolean;
    /** render on the interface (above tokens) layer. */
    interface?: boolean;
    flags?: Record<string, unknown>;
  }

  /** An AmbientLight doc (foundry `BaseAmbientLight`) embedded in `Scene.lights`. */
  interface I5eAmbientLightData {
    _id?: string;
    name?: string;
    /** integer. */
    x?: number;
    /** integer. */
    y?: number;
    elevation?: number;
    levels?: string[];
    rotation?: number;
    /** light is blocked by walls. */
    walls?: boolean;
    /** provides vision. */
    vision?: boolean;
    /** LightData (loose). */
    config?: Record<string, unknown>;
    hidden?: boolean;
    locked?: boolean;
    flags?: Record<string, unknown>;
  }

  /** A Note doc (foundry `BaseNote`) embedded in `Scene.notes`. */
  interface I5eNoteData {
    _id?: string;
    /** author User id. */
    author?: string | null;
    /** linked JournalEntry id. */
    entryId?: string | null;
    /** linked JournalEntryPage id. */
    pageId?: string | null;
    /** integer. */
    x?: number;
    /** integer. */
    y?: number;
    elevation?: number;
    levels?: string[];
    sort?: number;
    locked?: boolean;
    texture?: I5eTextureData;
    /** integer ≥32. */
    iconSize?: number;
    text?: string;
    fontFamily?: string;
    /** integer 8–128. */
    fontSize?: number;
    /** one of CONST.TEXT_ANCHOR_POINTS. */
    textAnchor?: number;
    textColor?: string;
    /** always visible on the canvas. */
    global?: boolean;
    flags?: Record<string, unknown>;
  }

  /** An AmbientSound doc (foundry `BaseAmbientSound`) embedded in `Scene.sounds`. */
  interface I5eAmbientSoundData {
    _id?: string;
    name?: string;
    /** integer. */
    x?: number;
    /** integer. */
    y?: number;
    elevation?: number;
    levels?: string[];
    radius?: number;
    /** FilePathField (AUDIO). */
    path?: string | null;
    repeat?: boolean;
    /** AlphaField (0–1). */
    volume?: number;
    /** sound is blocked by walls. */
    walls?: boolean;
    easing?: boolean;
    hidden?: boolean;
    locked?: boolean;
    darkness?: { min?: number; max?: number };
    effects?: {
      base?: { type?: string; intensity?: number };
      muffled?: { type?: string; intensity?: number };
    };
    flags?: Record<string, unknown>;
  }

  /** A Region doc (foundry `BaseRegion`) embedded in `Scene.regions`. */
  interface I5eRegionData {
    _id?: string;
    name?: string;
    color?: string;
    /** ShapesField (loose array of shape defs). */
    shapes?: Record<string, unknown>[];
    elevation?: {
      /** null = -Infinity. */
      bottom?: number | null;
      /** null = +Infinity. */
      top?: number | null;
      topInclusive?: boolean;
    };
    levels?: string[];
    restriction?: {
      enabled?: boolean;
      /** one of CONST.EDGE_RESTRICTION_TYPES. */
      type?: string;
      /** integer ≥0. */
      priority?: number;
    };
    attachment?: { token?: string | null };
    /** embedded RegionBehavior docs (loose). */
    behaviors?: Record<string, unknown>[];
    /** one of CONST.REGION_VISIBILITY. */
    visibility?: number;
    /** "shapes" | "coverage". */
    highlightMode?: string;
    displayMeasurements?: boolean;
    hidden?: boolean;
    locked?: boolean;
    ownership?: { default: number };
    flags?: Record<string, unknown>;
  }

  /** A Tile doc (foundry `BaseTile`) embedded in `Scene.tiles`. */
  interface I5eTileData {
    _id?: string;
    name?: string;
    texture?: I5eTextureData;
    /** integer ≥0. */
    width?: number;
    /** integer ≥0. */
    height?: number;
    /** integer. */
    x?: number;
    /** integer. */
    y?: number;
    elevation?: number;
    levels?: string[];
    sort?: number;
    rotation?: number;
    alpha?: number;
    hidden?: boolean;
    locked?: boolean;
    restrictions?: { light?: boolean; weather?: boolean };
    occlusion?: {
      /** set of CONST.OCCLUSION_MODES. */
      modes?: number[];
      alpha?: number;
    };
    video?: { loop?: boolean; autoplay?: boolean; volume?: number };
    flags?: Record<string, unknown>;
  }

  /** A Wall doc (foundry `BaseWall`) embedded in `Scene.walls`. */
  interface I5eWallData {
    _id?: string;
    /** length-4 array of integer coordinates `[x0, y0, x1, y1]`. */
    c?: number[];
    levels?: string[];
    /** one of CONST.EDGE_SENSE_TYPES. */
    light?: number;
    /** one of CONST.WALL_MOVEMENT_TYPES. */
    move?: number;
    /** one of CONST.EDGE_SENSE_TYPES. */
    sight?: number;
    /** one of CONST.EDGE_SENSE_TYPES. */
    sound?: number;
    /** one of CONST.EDGE_DIRECTIONS. */
    dir?: number;
    /** one of CONST.WALL_DOOR_TYPES. */
    door?: number;
    /** one of CONST.WALL_DOOR_STATES. */
    ds?: number;
    doorSound?: string;
    threshold?: {
      light?: number | null;
      sight?: number | null;
      sound?: number | null;
      attenuation?: boolean;
    };
    animation?: {
      /** -1 | 1. */
      direction?: number;
      double?: boolean;
      duration?: number;
      flip?: boolean;
      strength?: number;
      texture?: string | null;
      type?: string;
    } | null;
    flags?: Record<string, unknown>;
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

    // Navigation
    active?: boolean;
    navigation?: boolean;
    /** integer nav-bar order. */
    navOrder?: number;
    navName?: string;

    // Canvas dimensions
    /** FilePathField (IMAGE) thumbnail. */
    thumb?: string | null;
    width?: number;
    height?: number;
    padding?: number;
    shiftX?: number;
    shiftY?: number;
    initial?: I5eSceneInitialView;
    initialLevel?: string;

    // Grid
    grid?: I5eSceneGrid;

    // Vision / fog / environment
    tokenVision?: boolean;
    fog?: I5eSceneFog;
    environment?: I5eSceneEnvironment;
    transition?: I5eSceneTransition;

    // Embedded collections
    levels?: I5eSceneLevel[];
    tokens?: I5eTokenData[];
    drawings?: I5eDrawingData[];
    lights?: I5eAmbientLightData[];
    notes?: I5eNoteData[];
    sounds?: I5eAmbientSoundData[];
    regions?: I5eRegionData[];
    tiles?: I5eTileData[];
    walls?: I5eWallData[];

    // Linked documents (id refs)
    playlist?: string | null;
    playlistSound?: string | null;
    journal?: string | null;
    journalEntryPage?: string | null;
    weather?: string;

    // Permissions / metadata
    folder?: string;
    sort?: number;
    ownership?: { default: number };
    /** carried by the importer; not a core Scene schema field. */
    type?: string;
    _stats?: Scene["_stats"];
    flags?: {
      ddbimporter?: I5eSceneDDBImporterFlags;
      ddb?: I5eSceneDDBFlags;
    };
  }
}
