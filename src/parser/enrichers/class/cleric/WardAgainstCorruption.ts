import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Purification Domain: a Magic action shares the ward (Advantage on saves against disease and
 * form-changing effects) with a willing creature for an hour, at the cost of Fire damage equal to
 * your Wisdom modifier that ignores Resistance and Immunity.
 */
export default class WardAgainstCorruption extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Grant Ward",
      targetType: "creature",
      targetCount: 1,
      activationType: "action",
      data: {
        range: { override: true, units: "touch" },
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({ customFormula: "max(1, @abilities.wis.mod)", types: ["fire"] }),
          ],
        },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    // the fire damage the warded creature takes ignores Resistance and Immunity
    const options = { conditions: this.selfActivityFilter() };
    return [
      ...DDBEnricherData.damageRuleEffect("Ward Against Corruption: Searing Cost", [
        ...DDBEnricherData.ChangeHelper.ignoreResistanceChanges("fire", options),
        ...DDBEnricherData.ChangeHelper.ignoreImmunityChanges("fire", options),
      ]),
      {
        name: "Ward Against Corruption",
        activityMatch: "Grant Ward",
        options: {
          durationSeconds: 3600,
          description: "Advantage on saving throws to avoid or end diseases and against any effect that would change your form, such as the Polymorph spell.",
        },
      },
    ];
  }

}
