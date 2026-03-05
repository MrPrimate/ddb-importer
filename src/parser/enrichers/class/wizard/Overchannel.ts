import DDBEnricherData from "../../data/DDBEnricherData";

export default class Overchannel extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity(): IDDBActivityData {
    return {
      name: "First Use",
      activationType: "special",
      addActivityConsume: true,
      data: {
        uses: {
          override: true,
          spent: null,
          max: "1",
          recovery: [{ period: "lr", type: "recoverAll" }],
        },
      },
    };
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Second+ Use",
          type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
        },
        build: {
          generateConsumption: true,
          generateTarget: true,
          generateActivation: true,
          generateDamage: true,
        },
        overrides: {
          addActivityConsume: true,
          targetType: "self",
          rangeSelf: true,
          data: {
            uses: {
              override: true,
              spent: null,
              max: "20",
              recovery: [{ period: "lr", type: "recoverAll" }],
            },
            damage: {
              parts: [
                DDBEnricherData.basicDamagePart({
                  customFormula: "(2 + @item.uses.spent - 1)d12",
                  types: ["necrotic"],
                }),
              ],
            },
          },
        },
      },
    ];
  }

}
