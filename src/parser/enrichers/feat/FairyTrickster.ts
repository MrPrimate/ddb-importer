import DDBEnricherData from "../data/DDBEnricherData";
import { chosenAbility } from "./_ChosenAbility";

const ABILITIES = [
  { key: "dex", label: /dexterity/i, name: "Dexterity" },
  { key: "cha", label: /charisma/i, name: "Charisma" },
];

/**
 * Fairy Trickster's Flustering Strike: after a hit, a Wisdom save (DC 8 + the modifier of the
 * ability the feat increased + Proficiency Bonus) or the target has Disadvantage on saving throws
 * until the end of your next turn. Proficiency Bonus uses a Long Rest. DDB ships the feat as
 * prose only. Without a recorded pick there is one save per ability.
 */
export default class FairyTrickster extends DDBEnricherData {

  get #chosen(): typeof ABILITIES[number] | null {
    return chosenAbility(this, ABILITIES);
  }

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  override get activity(): IDDBActivityData {
    const ability = this.#chosen ?? ABILITIES[0];
    return {
      name: this.#chosen ? "Flustering Strike" : `Flustering Strike (${ability.name})`,
      activationType: "special",
      activationCondition: "When you hit a creature with an attack roll",
      addItemConsume: true,
      targetType: "creature",
      targetCount: "1",
      data: {
        save: { ability: ["wis"], dc: { calculation: ability.key, formula: "" } },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    if (this.#chosen) return [];
    return ABILITIES.slice(1).map((ability) => ({
      duplicate: true,
      overrides: {
        name: `Flustering Strike (${ability.name})`,
        data: { save: { ability: ["wis"], dc: { calculation: ability.key, formula: "" } } },
      },
    }));
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Flustered",
        activityTypesMatch: ["save"],
        options: {
          transfer: false,
          expiry: "sourceEnd",
          description: "Disadvantage on saving throws until the end of the flustering creature's next turn.",
        },
        midiChanges: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("1", 20, "flags.midi-qol.disadvantage.ability.save.all"),
        ],
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.ac5eChange("1", 20, "flags.automated-conditions-5e.save.disadvantage"),
        ],
      },
    ];
  }

  override get override(): IDDBOverrideData {
    return {
      uses: this._getUsesWithSpent({ type: "feat", name: "Flustering Strike", max: "@prof", period: "lr" }),
    };
  }

}
