import { utils } from "../../../../lib/_module";
import DDBEnricherData from "../../data/DDBEnricherData";

export default class DefensiveFlourish extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Defensive Flourish: Damage and AC Bonus",
      targetType: "creature",
      data: {
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              customFormula: "@scale.bard.inspiration",
              types: DDBEnricherData.allDamageTypes(),
            }),
          ],
        },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return utils.arrayRange(12, 1, 1).map((i) => ({
      name: `Defensive Flourish: AC Bonus ${i}`,
      options: {
        transfer: false,
      },
      changes: [
        DDBEnricherData.ChangeHelper.unsignedAddChange(i, 20, "system.attributes.ac.bonus"),
      ],
    }));
  }

}
