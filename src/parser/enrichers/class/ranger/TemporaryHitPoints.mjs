/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class TemporaryHitPoints extends DDBEnricherData {

  get type() {
    return "heal";
  }

  get activity() {
    return {
      name: "Temporary Hit Points",
      type: "heal",
      targetType: "self",
      activationType: "action",
      addActivityConsume: true,
      data: {
        healing: DDBEnricherData.basicDamagePart({ number: 1, denomination: 8, bonus: "max(1, @abilities.wis.mod)", types: ["temphp"] }),
        uses: {
          override: true,
          spent: 0,
          max: "max(1, @abilities.wis.mod)",
          recovery: [
            { period: "lr", type: 'recoverAll', formula: undefined },
          ],
        },
      },
    };
  }

}
