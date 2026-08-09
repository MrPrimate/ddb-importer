import DDBEnricherData from "../../data/DDBEnricherData";

export default class MisfortunesCurseOfTheFearful extends DDBEnricherData {

  override get type() {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Curse of the Fearful",
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

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Frightened by Curse of the Fearful",
        statuses: ["Frightened"],
        options: {
          durationSeconds: 60,
          description: "Frightened for 1 minute; repeats the save at the end of each of its turns, ending the effect on a success.",
        },
      },
    ];
  }

  override get override(): IDDBOverrideData {
    return {
      data: {
        system: {
          uses: { spent: null, max: "", recovery: [] },
        },
      },
    };
  }

}
