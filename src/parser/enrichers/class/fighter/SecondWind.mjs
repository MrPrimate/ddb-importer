/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class SecondWind extends DDBEnricherData {
  get type() {
    return "heal";
  }

  get activity() {
    return {
      addItemConsume: true,
      targetType: "self",
      data: {
        healing: DDBEnricherData.basicDamagePart({
          number: "1",
          denomination: "10",
          bonus: "@classes.fighter.levels",
          types: ["healing"],
        }),
      },
    };
  }

  get override() {
    const result = {
      data: {},
    };
    if (this.is2024) {
      const recovery = foundry.utils.deepClone(this.data.system.uses.recovery ?? []);
      if (recovery.length === 0) recovery.push({ period: "lr", type: 'recoverAll' });
      recovery.push({ period: "sr", type: 'formula', formula: "1" });
      result.data = {
        "system.uses.recovery": recovery,
      };
    }
    return result;
  }
}
