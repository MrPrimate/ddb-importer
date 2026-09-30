import DDBEnricherData from "../../data/DDBEnricherData";

export default class ArcaneFirearm extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "creature",
      activationType: "special",
      // every artificer spell cast through the firearm, with no limit
      noConsumeTargets: true,
      data: {
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              number: 1,
              denomination: 8,
              types: DDBEnricherData.allDamageTypes(),
            }),
          ],
          critical: {
            allow: true,
          },
        },
      },
    };
  }

  override get override(): IDDBOverrideData {
    return {
      uses: {
        "spent": 0,
        "recovery": [],
        "max": "",
      },
    };
  }
}
