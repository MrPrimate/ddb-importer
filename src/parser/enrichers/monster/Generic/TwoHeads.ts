import DDBEnricherData from "../../data/DDBEnricherData";
import _SaveAdvantageVsCondition from "./_SaveAdvantageVsCondition";

export default class TwoHeads extends _SaveAdvantageVsCondition {

  override get saveAdvantageStatuses(): string[] {
    return ["blinded", "charmed", "deafened", "frightened", "stunned", "unconscious"];
  }

  override get effects(): IDDBEffectHint[] {
    // the condition saves need AC5e's riderStatuses (base class); the Perception advantage
    // is a plain skill roll mode, so it is a separate effect that needs no module
    return [
      ...super.effects,
      {
        name: `${this.name}: Perception`,
        options: {
          transfer: true,
          description: "Advantage on Wisdom (Perception) checks.",
        },
        changes: [
          DDBEnricherData.ChangeHelper.advantageSkillChange("prc"),
        ],
      },
    ];
  }

}
