import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Biting Cold: weapon attacks and Ranger spells and features ignore Cold Resistance, as a dnd5e 6.1
 * damage rule (6.1 reports `item.classIdentifier` for ranger features as well as ranger spells).
 */
export default class FrigidExplorer extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    return DDBEnricherData.damageRuleEffect(
      "Biting Cold",
      DDBEnricherData.ChangeHelper.ignoreResistanceChanges("cold", {
        conditions: {
          o: "OR",
          v: [
            DDBEnricherData.ChangeHelper.WEAPON_ATTACK_FILTER,
            DDBEnricherData.ChangeHelper.classSpellFilter(this.classIdentifier("Ranger")),
          ],
        },
      }),
    );
  }

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "creature",
      activationType: "special",
      activationCondition: "Once per turn",
      func: ({ activity }: { activity: IActivityData }) => {
        for (const part of activity.damage?.parts ?? []) {
          part.types = ["cold"];
        }
      },
      data: {
        range: {
          units: "spec",
        },
      },
    };
  }

}
