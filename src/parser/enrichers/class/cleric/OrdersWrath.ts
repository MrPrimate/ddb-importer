import DDBEnricherData from "../../data/DDBEnricherData";

export default class OrdersWrath extends DDBEnricherData {
  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  get activity() {
    return {
      targetType: "creature",
      noeffect: true,
      activationType: "special",
      data: {
        sort: 2,
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              customFormula: "@scale.order.divine-strike",
              types: ["psychic"],
            }),
          ],
        },
      },
    };
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Curse",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
        },
        overrides: {
          targetType: "creature",
          activationType: "special",
          data: {
            sort: 1,
          },
        },
      },
    ];
  }

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Cursed by Order's Wrath",
      },
    ];
  }
}
