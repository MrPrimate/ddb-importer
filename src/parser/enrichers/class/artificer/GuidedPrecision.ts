import DDBEnricherData from "../../data/DDBEnricherData";

export default class GuidedPrecision extends DDBEnricherData {
  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Bonus Damage",
      activationType: "special",
      targetType: "creature",
      data: {
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              bonus: "@abilities.int.mod",
              types: DDBEnricherData.allDamageTypes(),
            }),
          ],
        },
      },
    };
  }

  // once per turn; DDB ships no action for the feature so the uses are spelled out
  override get override(): IDDBOverrideData {
    return {
      uses: { spent: null, max: "1", recovery: [{ period: "turn", type: "recoverAll", formula: undefined }] },
    };
  }

}
