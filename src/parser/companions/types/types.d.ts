// import { mixins } from "../../enrichers/_module";
import { mixins as activityMixins } from "../../activities/mixins/_module";

export {};

global {

  interface ISRDItemSummonProfile {
    /** a published creature (see CREATURE_IDS in SRDCreatures.ts) */
    creature?: string;
    /** a bare object token (a key of SRD_OBJECTS in SRDObjects.ts) */
    object?: string;
    /** dnd5e rolls this, so dice are fine */
    count?: string;
    /** the 2024 printing's count, where it differs from the 2014 one */
    count2024?: string;
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
    /**
     * One creature per item charge spent: the activity spends one charge and scales by amount up to
     * `max` charges, and a profile count of "@scaling" follows the charges spent.
     */
    chargesPerCreature?: { max: string };
    activationCondition?: string;
    duration?: I5eActivityDuration;
    /** the creature is not under the user's control, so it keeps its own token disposition */
    uncontrolled?: boolean;
    /**
     * "Can't be used again until N days have passed": N uses regaining one a day, all spent by a
     * use (the official data's model of a long reuse).
     */
    reuseDays?: number;
  }

  interface ICompanionData {
    ddbParser: activityMixins.DDBActivityFactoryMixin;
    document: any; // this.data,
    raw: string; // this.ddbDefinition.description,
    text: I5eItemDescription; // this.data.system.description,
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
