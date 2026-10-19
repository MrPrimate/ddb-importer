import DDBEnricherData from "../data/DDBEnricherData";

export default class Sequester extends DDBEnricherData {

  // 2024 puts a sequestered creature (not an object) into suspended animation as Unconscious
  override get effects(): IDDBEffectHint[] {
    if (this.is2014) return [];
    return [
      {
        name: "Sequester: Suspended Animation (Creature)",
        statuses: ["Unconscious"],
        daeSpecialDurations: ["isDamaged"],
        options: {
          durationSeconds: null,
          description: "Applies to a creature only, beside the Invisible condition. The spell ends if the target takes any damage.",
        },
      },
    ];
  }

}
