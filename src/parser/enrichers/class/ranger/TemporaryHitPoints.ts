import DDBEnricherData from "../../data/DDBEnricherData";

export default class TemporaryHitPoints extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
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
          spent: null,
          max: "max(1, @abilities.wis.mod)",
          recovery: [
            { period: "lr", type: 'recoverAll', formula: undefined },
          ],
        },
      },
    };
  }

}
