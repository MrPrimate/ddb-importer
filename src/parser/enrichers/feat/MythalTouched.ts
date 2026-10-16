import DDBEnricherData from "../data/DDBEnricherData";
import { chosenAbility } from "./_ChosenAbility";

const ABILITIES = [
  { key: "int", label: /intelligence/i, name: "Intelligence" },
  { key: "wis", label: /wisdom/i, name: "Wisdom" },
  { key: "cha", label: /charisma/i, name: "Charisma" },
];

/**
 * Mythal Touched's Mythal Ward: a Reaction to a spell that hits you or a failed save against one,
 * rolling on the Mythal-Touched Magic table, PB uses a Long Rest. The table's saves (Dexterity for
 * the force burst, Constitution for the stunning backlash) use DC 8 + the modifier of the ability
 * the feat increased + PB, so they are free save activities beside the roll: one for a recorded
 * pick, otherwise one per ability (the official shape) for the user to trim.
 */
export default class MythalTouched extends DDBEnricherData {

  get #chosen(): typeof ABILITIES[number] | null {
    return chosenAbility(this, ABILITIES);
  }

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Mythal Ward",
      activationType: "reaction",
      activationCondition: "A spell attack hits you or you fail a saving throw against a spell",
      addItemConsume: true,
      data: {
        roll: { prompt: false, visible: true, formula: "1d20", name: "Mythal-Touched Magic" },
      },
    };
  }

  #save(name: string, ability: string): IDDBAdditionalActivity {
    return {
      init: {
        name,
        type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
      },
      build: {
        generateActivation: true,
        generateSave: true,
        generateConsumption: false,
        activationOverride: {
          type: "special",
          value: null,
          condition: "A Mythal-Touched Magic effect calls for a saving throw",
        },
        saveOverride: {
          ability: ["dex", "con"],
          dc: { calculation: ability, formula: "" },
        },
      },
      overrides: {
        noConsumeTargets: true,
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    const chosen = this.#chosen;
    if (chosen) return [this.#save("Mythal Ward Save", chosen.key)];
    return ABILITIES.map((ability) => this.#save(`Mythal Ward Save (${ability.name})`, ability.key));
  }

  override get override(): IDDBOverrideData {
    return {
      uses: this._getUsesWithSpent({
        type: "feat",
        name: "Mythal Touched",
        max: "@prof",
        period: "lr",
      }),
    };
  }

}
