import DDBEnricherData from "../../data/DDBEnricherData";

export default class KeenSenses extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    // matched via the "Keen " starts-with hint, so guard against unrelated traits
    const senses = ["Smell", "Hearing", "Sight", "Senses"];
    if (!senses.some((sense) => this.name.includes(sense))) return [];
    return [
      {
        options: {
          transfer: true,
          description: "Advantage on Wisdom (Perception) checks. This cannot be restricted to checks that rely on the listed sense.",
        },
        name: this.name,
        changes: [
          DDBEnricherData.ChangeHelper.advantageSkillChange("prc"),
        ],
      },
    ];
  }

}
