import DDBEnricherData from "../../data/DDBEnricherData";

export default class MisfortunesCurseOfTheInsensate extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  get activity(): IDDBActivityData {
    return {
      name: "Curse of the Insensate",
      targetType: "creature",
      activationType: "action",
      addItemConsume: true,
      itemConsumeTargetName: "Misfortunist",
      itemConsumeValue: "3",
      data: {
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
        name: "Curse of the Insensate",
        statuses: ["Blinded", "Deafened"],
        options: {
          durationSeconds: 60,
          description: "Blinded and Deafened for 1 minute; repeats the save at the end of each of its turns, ending the effect on a success.",
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
