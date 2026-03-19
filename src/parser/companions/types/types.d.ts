import { mixins } from "../../enrichers/_module";

export {};

global {

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
