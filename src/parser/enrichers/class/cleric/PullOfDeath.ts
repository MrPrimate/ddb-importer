import DDBEnricherData from "../../data/DDBEnricherData";

export default class PullOfDeath extends DDBEnricherData {
  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  get activity(): IDDBActivityData {
    return {
      targetType: "creature",
      noeffect: true,
      activationType: "special",
      addItemConsume: true,
      data: {
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              customFormula: "@scale.grave.pull-of-death",
              types: ["necrotic"],
            }),
          ],
        },
      },
    };
  }

  get override(): IDDBOverrideData {
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
