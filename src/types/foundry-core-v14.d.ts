export {};

global {
  type ICoreSceneLevelsSchema = foundry.data.fields.DataField<
    foundry.data.fields.DataField.DefaultOptions,
    I5eSceneLevel[],
    foundry.utils.Collection<I5eSceneLevel>,
    I5eSceneLevel[]
  >;

  // v14 SceneLevelsSetField = SetField<DocumentIdField>: a set of level ids in
  // which a placeable is visible. Initialized -> Set<string>, source -> string[].
  // Used by Tile / AmbientLight / Region / Drawing documents.
  type ICoreSceneLevelsSetSchema = foundry.data.fields.DataField<
    foundry.data.fields.DataField.DefaultOptions,
    string[],
    Set<string>,
    string[]
  >;

  // v14 client/canvas/board.mjs:449 -- `get level()` returns the active Level document
  // (or null). Canvas is a class, not a Document, so this is class+interface merging on
  // the global Canvas class, NOT a `namespace Canvas { interface Schema }` (nothing reads
  // a Canvas Schema). Level documents expose both `id` and `_id`.
  interface Canvas {
    level: (I5eSceneLevel & { id: string }) | null;
  }
}

// Native Foundry v14 Scene schema fields missing from foundry-vtt-types #main.
// Merged into Scene.Schema so Source / InitializedData / CreateData / UpdateData all
// derive automatically. Use the configuration module, NOT `declare global` -- merging
// the re-exported Scene namespace globally overrides it instead of merging (see the
// header comment in fvtt-types configuration/globals.d.mts).
declare module "fvtt-types/configuration" {
  namespace Scene {
    interface Schema {
      name: foundry.data.fields.StringField<{ required: true }>;
      // v14 common/documents/scene.mjs:86 -- new fields.DocumentIdField({readonly: false})
      initialLevel: foundry.data.fields.DocumentIdField<{ readonly: false }>;

      // v14 common/documents/scene.mjs:147 -- new fields.EmbeddedCollectionField(BaseLevel).
      // fvtt-types #main has no Level document, so this is modelled loosely against the
      // existing I5eSceneLevel data shape via DataField generics:
      //   <Options, AssignmentType, InitializedType, PersistedType>
      // initialized -> Collection (scene.levels), source -> array (scene.toObject().levels).
      levels: ICoreSceneLevelsSchema;
    }
  }

  // v14 placeables gained a `levels` SceneLevelsSetField (set of level ids in
  // which the placeable is visible). Not modelled by fvtt-types  yet. Native
  // source: tile.mjs:48, ambient-light.mjs:40, region.mjs:64, drawing.mjs:54.
  namespace TileDocument {
    interface Schema {
      levels: ICoreSceneLevelsSetSchema;
    }
  }

  namespace DrawingDocument {
    interface Schema {
      levels: ICoreSceneLevelsSetSchema;
    }
  }

  namespace RegionDocument {
    interface Schema {
      levels: ICoreSceneLevelsSetSchema;
    }
  }

  namespace AmbientLightDocument {
    interface Schema {
      levels: ICoreSceneLevelsSetSchema;
    }
  }
}
