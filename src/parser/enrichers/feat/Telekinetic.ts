import DDBEnricherData from "../data/DDBEnricherData";
import { chosenAbility } from "./_ChosenAbility";

const ABILITIES = [
  { key: "int", label: /intelligence/i, name: "Intelligence" },
  { key: "wis", label: /wisdom/i, name: "Wisdom" },
  { key: "cha", label: /charisma/i, name: "Charisma" },
];

export default class Telekinetic extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      type: DDBEnricherData.ACTIVITY_TYPES.NONE,
    };
  }

  /**
   * The save DC keys off the ability picked for the feat. DDB only generates its
   * "Telekinetic Shove" action once that pick is made, so the activity is built here: one Shove
   * for a recorded pick, otherwise one per ability (the official shape) for the user to trim.
   */
  get #chosen(): typeof ABILITIES[number] | null {
    return chosenAbility(this, ABILITIES);
  }

  #shove(name: string, ability: string): IDDBAdditionalActivity {
    return {
      init: {
        name,
        type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
      },
      build: {
        generateActivation: true,
        generateSave: true,
        generateRange: true,
        generateTarget: true,
        saveOverride: {
          ability: ["str"],
          dc: { calculation: ability, formula: "" },
        },
        rangeOverride: {
          units: "ft",
          value: "30",
        },
        targetOverride: {
          affects: {
            count: "1",
            type: "creature",
          },
        },
      },
      overrides: {
        activationType: "bonus",
        overrideActivation: true,
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    const chosen = this.#chosen;
    if (chosen) return [this.#shove("Shove", chosen.key)];
    return ABILITIES.map((ability) => this.#shove(`Shove (${ability.name})`, ability.key));
  }

}
