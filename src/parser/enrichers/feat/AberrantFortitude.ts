import DDBEnricherData from "../data/DDBEnricherData";

export default class AberrantFortitude extends DDBEnricherData {
  override get usesOnActivity(): boolean {
    return true;
  }

  override get activity(): IDDBActivityData {
    return {
      noConsumeTargets: true,
      addActivityConsume: true,
      data: {
        roll: {
          name: "Roll bonus",
          formula: `@scale.${this.parentIdentifier}.die`,
        },
      },
    };
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
