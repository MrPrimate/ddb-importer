import DDBEnricherData from "../../data/DDBEnricherData";

export default class MisfortunesCurseOfTheSomnolent extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  get activity(): IDDBActivityData {
    return {
      name: "Curse of the Somnolent",
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
        name: "Curse of the Somnolent",
        statuses: ["Unconscious"],
        options: {
          durationSeconds: 60,
          description: "Unconscious for 1 minute. Ends if the creature takes damage or someone within 5 feet takes an action to shake it awake.",
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
