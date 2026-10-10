import DDBEnricherData from "../../data/DDBEnricherData";
import type DDBClassFeatureEnricher from "../../DDBClassFeatureEnricher";

export default class OrdersWrath extends DDBEnricherData<DDBClassFeatureEnricher> {
  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "creature",
      noeffect: true,
      activationType: "special",
      data: {
        sort: 2,
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              // the 2024 reprint rides on the Cleric's own Divine Strike scale
              customFormula: this.ddbEnricher.isClass2014("Cleric") ? "@scale.order.divine-strike" : "@scale.cleric.divine-strike",
              types: ["psychic"],
            }),
          ],
        },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
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

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Cursed by Order's Wrath",
        statuses: ["Cursed"],
      },
    ];
  }
}
