export {};

global {

  interface IDDBEncounterMonster {
    id: number;
    quantity: number;
    uniqueId?: string;
    initiative?: number | null;
    currentHitPoints?: number;
    maximumHitPoints?: number;
    temporaryHitPoints?: number;
    name?: string | null;
  }

  interface IDDBEncounterPlayer {
    id: string | number;
    name?: string;
    hidden?: boolean;
    initiative?: number | null;
  }

  interface IDDBEncounterData {
    id: string;
    name: string;
    inProgress?: boolean;
    turnNum?: number;
    roundNum?: number;
    difficulty?: number | null;
    description?: string | null;
    rewards?: string | null;
    flavorText?: string | null;
    campaign?: { id?: number; name?: string } | null;
    monsters: IDDBEncounterMonster[];
    players: IDDBEncounterPlayer[];
  }

  interface IEncounterWorldMonsterData {
    ddbId: number;
    name: string;
    id: string;
    quantity: number;
    journalLink: string;
    uniqueId?: string;
    initiative?: number | null;
    currentHitPoints?: number;
    maximumHitPoints?: number;
    temporaryHitPoints?: number;
    ddbName?: string | null;
  }

  interface IEncounterParsedData {
    id?: string;
    name?: string;
    inProgress?: boolean;
    turnNum?: number;
    roundNum?: number;
    // difficulty is a DIFFICULTY_LEVELS entry, but is also compared against "" at
    // use sites, so it is left as any
    difficulty?: any;
    description?: string | null;
    rewards?: string | null;
    summary?: string | null;
    campaign?: { id?: number; name?: string } | null;
    monsters?: IDDBEncounterMonster[];
    characters?: IDDBEncounterPlayer[];
    goodMonsterIds?: { ddbId: number; name: string; id: string; quantity: number }[];
    missingMonsterIds?: { ddbId: number; quantity: number }[];
    goodCharacterData?: { id: string; name: string; ddbId: string | number }[];
    missingCharacterData?: { ddbId: string | number; name?: string }[];
    missingMonsters?: boolean;
    missingCharacters?: boolean;
    monsterData?: IEncounterWorldMonsterData[];
    worldMonsters?: IEncounterWorldMonsterData[];
  }

  interface ICombatantData {
    // token placeables report `id` as string | null in fvtt-types
    tokenId: string | null;
    actorId: string;
    hidden: boolean;
    initiative?: number;
  }
}
