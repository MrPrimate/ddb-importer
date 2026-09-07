import DDBEnricherData from "../../data/DDBEnricherData";

export default class ManeuverApexDominance extends DDBEnricherData {

  override get builtFeaturesFromActionFilters(): string[] {
    return ["Apex Dominance"];
  }

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "creature",
      activationType: "action",
      data: {
        range: {
          units: "ft",
          value: "5",
        },
        save: {
          ability: ["str"],
          dc: {
            calculation: "con",
            formula: "",
          },
        },
        damage: {
          onSave: "half",
          parts: [
            DDBEnricherData.basicDamagePart({ number: 6, denomination: 10, type: "force" }),
          ],
        },
      },
    };
  }

}
