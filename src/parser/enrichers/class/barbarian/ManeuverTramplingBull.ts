import DDBEnricherData from "../../data/DDBEnricherData";

export default class ManeuverTramplingBull extends DDBEnricherData {


  override get builtFeaturesFromActionFilters(): string[] {
    return ["Trampling Bull"];
  }

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Trample",
      activationType: "bonus",
      targetType: "creature",
      data: {
        save: {
          ability: ["str"],
          dc: {
            calculation: "con",
            formula: "",
          },
        },
        damage: {
          onSave: "none",
          parts: [
            DDBEnricherData.basicDamagePart({
              number: 1,
              denomination: 8,
              bonus: "@abilities.str.mod",
              type: "bludgeoning",
            }),
          ],
        },
      },
    };
  }

}
