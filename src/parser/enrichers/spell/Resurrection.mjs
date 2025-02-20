/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class Resurrection extends DDBEnricherData {
  get type() {
    return "heal";
  }

  get activity() {
    return {
      data: {
        healing: DDBEnricherData.basicDamagePart({
          bonus: "10000",
          types: ["healing"],
        }),
      },
    };
  }

  get effects() {
    const keys = [
      "system.bonuses.abilities.check",
      "system.bonuses.abilities.save",
      "system.attributes.init.bonus",
      "system.bonuses.mwak.attack",
      "system.bonuses.msak.attack",
      "system.bonuses.rwak.attack",
      "system.bonuses.rsak.attack",
    ];
    return [1, 2, 3, 4].map((day) => {
      return {
        name: `Resurrection Penalty (Day ${day})`,
        changes: keys.map((key) => DDBEnricherData.ChangeHelper.addChange(`-${5 - day}`, 99, key)),
      };
    });
  }
}
