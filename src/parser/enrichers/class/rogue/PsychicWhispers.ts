import DDBEnricherData from "../../data/DDBEnricherData";

export default class PsychicWhispers extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return null;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Psychic Whispers",
      addItemConsume: true,
      addSingleFreeUse: true,
      data: {
        target: {
          affects: {
            count: "@prof",
            type: "ally",
            choice: true,
            special: "",
          },
        },
        roll: {
          prompt: false,
          visible: false,
          formula: "@scale.soulknife.energy-die.die",
          name: "Hours active roll",
        },
      },
    };
  }

}
