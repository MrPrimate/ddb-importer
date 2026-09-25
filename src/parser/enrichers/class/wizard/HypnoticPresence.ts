import DDBEnricherData from "../../data/DDBEnricherData";

export default class HypnoticPresence extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  override get useDefaultAdditionalActivities(): boolean {
    return false;
  }

  override get addAutoAdditionalActivities(): boolean {
    return false;
  }

  override get clearAutoEffects(): boolean {
    return true;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Hypnotic Presence",
      targetType: "creature",
      activationType: "action",
      addItemConsume: true,
      data: {
        save: { ability: ["wis"], dc: { calculation: "spellcasting", formula: "" } },
        range: { value: "10", units: "ft" },
        duration: { value: "1", units: "minute" },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Hypnotised",
        activityMatch: "Hypnotic Presence",
        statuses: ["Charmed", "Incapacitated"],
        changes: [
          DDBEnricherData.ChangeHelper.customChange("*0", 20, "system.attributes.movement.all"),
          ...["walk", "fly", "swim", "climb", "burrow"].map((mode) =>
            DDBEnricherData.ChangeHelper.overrideChange("0", 60, `system.attributes.movement.${mode}`)),
        ],
        options: { durationSeconds: 60 },
      },
    ];
  }

  override get override(): IDDBOverrideData {
    return {
      uses: this._getUsesWithSpent({
        type: "class",
        name: "Hypnotic Presence",
        max: "max(1, @abilities.int.mod)",
        period: "lr",
      }),
    };
  }

}
