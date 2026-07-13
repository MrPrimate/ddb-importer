export {};

global {
  /** One imported/required monster entry in a DDB adventure export. */
  interface IDDBAdventureMonsterData {
    actorId: string;
    ddbId: number;
    folderId: string;
    name?: string;
  }

  /** Documents/data a DDB adventure export declares it needs present before import. */
  interface IDDBAdventureRequired {
    monsterData: IDDBAdventureMonsterData[];
    monsters: string[];
    items: string[];
    spells: string[];
    vehicles: string[];
    skills: string[];
    senses: string[];
    conditions: string[];
    actions: string[];
    weaponproperties: string[];
  }

  /** Parsed `adventure.json` metadata from a DDB adventure export zip. */
  interface IDDBAdventure {
    id: string;
    name: string;
    description: string;
    system: string;
    modules: string[];
    version: number | string;
    options: {
      folders: boolean;
    };
    required: IDDBAdventureRequired;
    folderColour: string;
  }

  /** ddb-importer's own flags stamped on the built Adventure (`flags.ddbimporter`). */
  interface I5eAdventureDDBImporterFlags {
    isDDBAdventure: boolean;
    adventure: {
      required: IDDBAdventureRequired;
      revisitUuids: string[];
    };
  }

  interface I5eAdventureFlags {
    ddbimporter?: I5eAdventureDDBImporterFlags;
    core?: { sheetClass: string };
  }

  /**
   * Adventure document data assembled by `AdventureMunch._createAdventure`.
   * Embedded collections hold `toObject()` source data for each document type;
   * unused collections (combats/macros/cards/playlists) are emitted empty.
   */
  interface I5eAdventureData {
    _id?: string;
    name: string;
    img?: string;
    caption?: string;
    description?: string;
    folders?: I5eFolderData[];
    combats?: object[];
    items?: I5eItemData[];
    actors?: I5eActorData[];
    journal?: I5eJournalData[];
    scenes?: I5eSceneData[];
    tables?: I5eTableData[];
    macros?: I5eMacroData[];
    cards?: object[];
    playlists?: object[];
    folder?: string | null;
    sort?: number;
    flags?: I5eAdventureFlags;
    _stats?: I5eDocumentStats;
  }
}
