/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

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
