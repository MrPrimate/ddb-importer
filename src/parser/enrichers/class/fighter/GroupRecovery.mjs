/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class GroupRecovery extends DDBEnricherData {

  get type() {
    return "heal";
  }

  get activity() {
    return {
      addItemConsume: true,
      targetType: "ally",
      targetCount: "max(1, @abilities.cha.mod)",
      data: {
        healing: DDBEnricherData.basicDamagePart({
          number: "1",
          denomination: "4",
          bonus: "@classes.fighter.levels",
          types: ["healing"],
        }),
        target: {
          affects: {
            type: "ally",
          },
          template: {
            contiguous: false,
            type: "radius",
            size: "@scale.banneret.group-recovery",
            units: "ft",
          },
        },
      },
    };
  }

  get override() {
    const result = {
      data: {
        "system.uses.recovery": [],
      },
    };
    return result;
  }
}
