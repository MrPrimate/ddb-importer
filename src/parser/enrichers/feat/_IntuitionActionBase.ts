import DDBEnricherData from "../data/DDBEnricherData";

export default class _IntuitionActionBase extends DDBEnricherData {

  get activity(): IDDBActivityData {
    return {
      data: {
        roll: {
          name: "Roll bonus",
          formula: `@scale.${this.parentIdentifier}.die`,
        },
      },
    };
  }

  get effects(): IDDBEffectHint[] {
    return [
      {
        options: {
          transfer: true,
          durationSeconds: null,
          durationRounds: null,
        },
        data: {
          duration: {
            seconds: null,
            rounds: null,
          },
        },
        changes: [],
      },
    ];

  }

  get additionalAdvancements(): I5eAdvancement[] {
    // to do determine advancement here
    return [
      DDBEnricherData.AdvancementBuilder.buildDiceScale({
        name: this.name,
        identifier: "die",
        hint: "A scale value which can be updated by its Greater Mark feat.",
        scale: { 0: { number: 1, faces: 4 } },
      }),
    ];
  }

}
