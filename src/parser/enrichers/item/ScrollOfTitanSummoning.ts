import DDBEnricherData from "../data/DDBEnricherData";
import { TITANS, titanKey } from "../../companions/types/_titans";

/**
 * Reading the scroll spends it and calls the titan the DM picks or rolls on its table. The titans
 * are Monster Manual stat blocks the proxy serves only to Patreon supporters, so for them the read
 * is a summon (with a free roll for the table beside it); everyone else gets the roll alone.
 */
export default class ScrollOfTitanSummoning extends DDBEnricherData {

  // the stored tier, read through the module api (the Patreon helper is not a leaf module)
  get #summonsTitans(): boolean {
    const patreon = globalThis.DDBImporter?.patreon;
    if (!patreon) return false;
    return patreon.calculateAccessMatrix(patreon.getPatreonTier()).all;
  }

  override get type(): IDDBActivityType | null {
    return this.#summonsTitans ? DDBEnricherData.ACTIVITY_TYPES.SUMMON : DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get summonsFunction(): ((data: ICompanionData) => Promise<ICompanionResult>) | null {
    return this.#summonsTitans ? DDBImporter.lib.DDBSummonsInterface.getTitanSummons : null;
  }

  override get generateSummons(): boolean {
    return this.#summonsTitans;
  }

  override get activity(): IDDBActivityData {
    const range: I5eActivityRange = { override: true, value: "1", units: "mi" };
    if (!this.#summonsTitans) {
      return {
        name: "Read Scroll",
        activationType: "action",
        addItemConsume: true,
        data: {
          roll: { prompt: false, visible: true, formula: "1d100", name: "Titan" },
          range,
        },
      };
    }
    return {
      name: "Read Scroll",
      activationType: "action",
      addItemConsume: true,
      noTemplate: true,
      profileKeys: TITANS.map((titan) => ({ count: "1", name: titanKey(titan.name) })),
      summons: {
        // the titan is Hostile toward all other creatures: it keeps its own disposition
        match: { proficiency: false, attacks: false, saves: false, disposition: false },
        bonuses: { ac: "", hp: "", attackDamage: "", saveDamage: "", healing: "" },
      },
      data: {
        range,
        target: { affects: { count: "1", type: "space", special: "unoccupied, on the ground or in water" } },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    if (!this.#summonsTitans) return [];
    return [
      {
        init: { name: "Roll for Titan", type: DDBEnricherData.ACTIVITY_TYPES.UTILITY },
        build: {
          generateActivation: true,
          activationOverride: { type: "special", value: null, condition: "Before reading the scroll, if the DM rolls" },
          generateConsumption: false,
          generateRoll: true,
          rollOverride: { prompt: false, visible: true, formula: "1d100", name: "Titan" },
        },
        overrides: { noConsumeTargets: true },
      },
    ];
  }

}
