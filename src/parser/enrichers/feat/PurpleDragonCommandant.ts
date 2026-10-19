import DDBEnricherData from "../data/DDBEnricherData";
import { chosenAbility } from "./_ChosenAbility";

const ABILITIES = [
  { key: "str", label: /strength/i, name: "Strength" },
  { key: "dex", label: /dexterity/i, name: "Dexterity" },
];

export default class PurpleDragonCommandant extends DDBEnricherData {

  get #chosen(): typeof ABILITIES[number] | null {
    return chosenAbility(this, ABILITIES);
  }

  #healing(ability: string) {
    return DDBEnricherData.basicDamagePart({ number: 2, denomination: 6, bonus: `@abilities.${ability}.mod`, types: ["temphp"] });
  }

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  override get activity(): IDDBActivityData {
    return {
      // without a recorded pick, one activity per ability (the official shape)
      name: this.#chosen ? "Encourage Ally" : `Encourage Ally (${ABILITIES[0].name})`,
      activationType: "bonus",
      targetType: "ally",
      targetCount: "1",
      addItemConsume: true,
      data: {
        range: { override: true, value: "30", units: "ft" },
        healing: this.#healing((this.#chosen ?? ABILITIES[0]).key),
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    if (this.#chosen) return [];
    return ABILITIES.slice(1).map((ability) => ({
      duplicate: true,
      overrides: {
        name: `Encourage Ally (${ability.name})`,
        data: { healing: this.#healing(ability.key) },
      },
    }));
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Last Stand (Bloodied)",
        options: { transfer: true, disabled: true },
        midiChanges: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("1", 20, "flags.midi-qol.advantage.attack.all"),
        ],
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.ac5eChange("1", 20, "flags.automated-conditions-5e.attack.advantage"),
        ],
      },
    ];
  }

  override get override(): IDDBOverrideData {
    return {
      uses: this._getUsesWithSpent({ type: "feat", name: "Encourage Ally", max: "@prof", period: "lr" }),
    };
  }

}
