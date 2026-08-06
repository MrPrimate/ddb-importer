import DDBEnricherData from "../../data/DDBEnricherData";

export default class MisfortunesCurseOfTheDebilitated extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  get activity(): IDDBActivityData {
    return {
      name: "Curse of the Debilitated",
      targetType: "creature",
      activationType: "reaction",
      activationCondition: "A creature cursed by your Evil Eye takes damage",
      addItemConsume: true,
      itemConsumeTargetName: "Misfortunist",
      itemConsumeValue: "1",
      noTemplate: true,
      damageParts: [
        DDBEnricherData.basicDamagePart({ number: 1, denomination: 12, type: "necrotic" }),
      ],
    };
  }

  get override(): IDDBOverrideData {
    return {
      data: {
        system: {
          uses: { spent: null, max: "", recovery: [] },
        },
      },
    };
  }

}
