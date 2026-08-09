import DDBEnricherData from "../../data/DDBEnricherData";

export default class DivineFury extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "creature",
      activationType: "special",
      addItemConsume: true,
      data: {
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              bonus: "(floor(@classes.barbarian.levels / 2))",
              number: 1,
              denomination: 6,
              types: ["necrotic", "radiant"],
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
        "recovery": [
          {
            "period": "turnStart",
            "type": "recoverAll",
          },
        ],
        "max": "1",
      },
    };
  }
}
