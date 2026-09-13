import DDBEnricherData from "../data/DDBEnricherData";

export default class _IntuitionActionBase extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      data: {
        roll: {
          name: "Roll bonus",
          formula: `@scale.${this.parentIdentifier}.die`,
        },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        options: {
          transfer: true,
          durationSeconds: undefined,
        },
        data: {
          duration: {
            value: null,
            expiry: null,
            expired: undefined,
          },
        },
        changes: [],
      },
    ];

  }

  override get additionalAdvancements(): I5eAdvancement[] {
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
