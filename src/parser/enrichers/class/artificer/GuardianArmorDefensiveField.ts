import DDBEnricherData from "../../data/DDBEnricherData";

export default class GuardianArmorDefensiveField extends DDBEnricherData {
  get type() {
    return "heal";
  }

  get activity() {
    return {
      targetType: "self",
      data: {
        healing: DDBEnricherData.basicDamagePart({
          bonus: "@classes.artificer.levels",
          types: ["temphp"],
        }),
      },
    };
  }

  get effects() {
    return [];
  }
}
