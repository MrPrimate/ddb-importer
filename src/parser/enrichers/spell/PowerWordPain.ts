import DDBEnricherData from "../data/DDBEnricherData";

/**
 * 2014: no damage, a Constitution save against crippling pain; AU 2024: 6d8 Force and the
 * pain rider only if the target has 100 HP or fewer.
 */
export default class PowerWordPain extends DDBEnricherData {

  override get clearAutoEffects(): boolean {
    return true;
  }

  override get type(): IDDBActivityType | null {
    return this.is2014 ? DDBEnricherData.ACTIVITY_TYPES.SAVE : DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  override get activity(): IDDBActivityData {
    if (this.is2014) {
      return {
        targetType: "creature",
        data: {
          save: { ability: ["con"], dc: { calculation: "spellcasting", formula: "" } },
          damage: { parts: [] },
        },
      };
    }
    return {
      targetType: "creature",
      data: {
        damage: {
          parts: [DDBEnricherData.basicDamagePart({ number: 6, denomination: 8, type: "force", scalingMode: "none" })],
        },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: this.is2014 ? "Crippling Pain" : "Pained",
        statuses: this.is2014 ? [] : ["Charmed"],
        changes: [
          DDBEnricherData.ChangeHelper.downgradeChange("10", 20, "system.attributes.movement.walk"),
          DDBEnricherData.ChangeHelper.ruleDisadvantageChange("attack"),
          DDBEnricherData.ChangeHelper.ruleDisadvantageChange("check"),
          DDBEnricherData.ChangeHelper.ruleDisadvantageChange("save", {
            conditions: { o: "NOT", v: { k: "roll.ability", o: "exact", v: "con" } },
          }),
        ],
        options: {
          durationSeconds: 60,
          description: this.is2014
            ? "Speed 10 feet; Disadvantage on attack rolls, ability checks and saves except Constitution; must succeed on a Constitution save to cast a spell."
            : "Applies only if the target had 100 HP or fewer. Speed no more than 10 feet; Disadvantage on D20 Tests except Constitution saves; a Constitution save is needed to cast a spell.",
        },
        midiChanges: [
          DDBEnricherData.ChangeHelper.overTimeSaveChange({
            document: this.data,
            turn: "end",
            saveAbility: "con",
            saveRemove: true,
            dc: "@attributes.spell.dc",
          }),
        ],
      },
    ];
  }

}
