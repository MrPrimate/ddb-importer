export {};

global {
  // Loose stand-in for EmbeddedCollection<BaseLevel> (fvtt-types has no Level document).
  // Adds the EmbeddedCollection methods used by this repo on top of plain Collection.
  // v14 common/abstract/embedded-collection.mjs:332 -- toObject(source=true).
  // Element of scene.levels: a BaseLevel document at runtime -- data shape plus toObject().
  type TCoreSceneLevelDocument = I5eSceneLevel & {
    toObject(source?: boolean): I5eSceneLevel;
  };

  type TCoreSceneLevelsCollection = foundry.utils.Collection<TCoreSceneLevelDocument> & {
    toObject(source?: boolean): I5eSceneLevel[];
  };

  type ICoreSceneLevelsSchema = foundry.data.fields.DataField<
    foundry.data.fields.DataField.DefaultOptions,
    I5eSceneLevel[],
    TCoreSceneLevelsCollection,
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
      // NOTE: do not redeclare fields fvtt-types already has (e.g. `name`) -- a merged
      // duplicate with different StringField options collapses the Source type to never.
      // v14 common/documents/scene.mjs:86 -- new fields.DocumentIdField({readonly: false})
      initialLevel: foundry.data.fields.DocumentIdField<{ readonly: false }>;

      // v14 common/documents/scene.mjs:147 -- new fields.EmbeddedCollectionField(BaseLevel).
      // fvtt-types #main has no Level document, so this is modelled loosely against the
      // existing I5eSceneLevel data shape via DataField generics:
      //   <Options, AssignmentType, InitializedType, PersistedType>
      // initialized -> Collection (scene.levels), source -> array (scene.toObject().levels).
      levels: ICoreSceneLevelsSchema;
      shiftX: foundry.data.fields.NumberField<{ required: true }>;
      shiftY: foundry.data.fields.NumberField<{ required: true }>;

      // v14 common/documents/scene.mjs:137 -- new fields.SchemaField({type, duration, activeOnly})
      transition: foundry.data.fields.SchemaField<{
        type: foundry.data.fields.StringField<{ required: true; nullable: true; blank: false; initial: null }>;
        duration: foundry.data.fields.NumberField<{ required: true; nullable: false; integer: true; initial: 1500 }>;
        activeOnly: foundry.data.fields.BooleanField;
      }>;
    }

    // v14 common/documents/scene.mjs:106 -- fog.mode NumberField, choices
    // CONST.FOG_EXPLORATION_MODES, initial INDIVIDUAL (1). fvtt-types #main still has the
    // v13 shape (exploration/overlay) -- merging can add `mode` but not remove those.
    interface FogSchema {
      mode: foundry.data.fields.NumberField<{ required: true; initial: 1 }>;
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

  namespace NoteDocument {
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

  namespace TokenDocument {
    interface Schema {
      level: string | null;
      depth: foundry.data.fields.NumberField<{ required: true; nullable: false; integer: true; initial: 1 }>;
    }

  }
}
