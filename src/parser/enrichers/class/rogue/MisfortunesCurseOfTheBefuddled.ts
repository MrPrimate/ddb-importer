import DDBEnricherData from "../../data/DDBEnricherData";

export default class MisfortunesCurseOfTheBefuddled extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  get activity(): IDDBActivityData {
    return {
      name: "Curse of the Befuddled",
      targetType: "creature",
      activationType: "action",
      addItemConsume: true,
      itemConsumeTargetName: "Misfortunist",
      itemConsumeValue: "2",
      data: {
        range: {
          units: "ft",
          value: "60",
        },
        save: {
          ability: ["wis"],
          dc: {
            calculation: "",
            formula: "8 + max(@abilities.cha.mod, @abilities.int.mod) + @prof",
          },
        },
      },
    };
  }

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Charmed by Curse of the Befuddled",
        statuses: ["Charmed"],
        options: {
          durationSeconds: 600,
          description: "Charmed for 10 minutes or until the rogue or their allies damage this creature.",
        },
      },
    ];
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
