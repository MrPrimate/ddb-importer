import { mixins } from "../../enrichers/_module";

export {};

global {

  interface ISRDItemSummonProfile {
    /** a published creature (see CREATURE_IDS in SRDCreatures.ts) */
    creature?: string;
    /** a bare object token (a key of SRD_OBJECTS in SRDObjects.ts) */
    object?: string;
    /** dnd5e rolls this, so dice are fine */
    count?: string;
  }

  /** An aura the summoned creature gives off, placed from the item onto the creature's token. */
  interface ISRDItemSummonAura {
    name: string;
    size: string;
    /** "enemy" is relative to whoever used the item, which is what "Hostile to you" means */
    affects: "creature" | "ally" | "enemy";
    events: string[];
    save: { ability: string[]; dc: string };
    /** a dnd5e status id, capitalised as effect hints expect it */
    status: string;
    durationSeconds: number;
    condition: string;
  }

  interface ISRDItemSummon {
    /** matched against the item's DDB name with `includes`; the first entry to match wins */
    match: string;
    activityName: string;
    /** whether the summon replaces the item's primary activity or sits beside it */
    placement: "primary" | "additional";
    profiles: ISRDItemSummonProfile[];
    activationType?: TActivationCost;
    /** no actor of ours: one empty profile for the table to point at the creature involved */
    blankProfile?: boolean;
    aura?: ISRDItemSummonAura;
  }

  interface ICompanionData {
    ddbParser: mixins.DDBEnricherFactoryMixin;
    document: any; // this.data,
    raw: string; // this.ddbDefinition.description,
    text: string; // this.data.system.description,
  }


  interface IArcaneHandData extends ICompanionData {
    name?: string;
    postfix?: string;
  }

  interface ICompanionEntry {
    name: string;
    version: string;
    required: null;
    isJB2A: boolean;
    needsJB2A: boolean;
    needsJB2APatreon?: boolean;
    folderName: string;
    data: I5eMonsterData;
  }

  type ICompanionResult = Record<string, ICompanionEntry>;

  interface IFamiliarUUIDProfile {
    name: string;
    uuid: string;
  }

  interface IFamiliarCRProfile {
    count: string;
    cr: string;
    name: string;
    types: string[];
  }

  interface IFindFamiliarActivityData {
    creatureTypes: string[];
    profiles: (IFamiliarUUIDProfile | IFamiliarCRProfile)[];
    creatureSizes: string[];
    match: {
      attacks: boolean;
      proficiency: boolean;
      saves: boolean;
    };
    summon: {
      identifier: string;
      mode: string;
      prompt: boolean;
    };
    bonuses: {
      ac: string;
      hp: string;
      attackDamage: string;
      saveDamage: string;
      healing: string;
    };
  }
}
