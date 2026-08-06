import DDBEnricherData from "../../data/DDBEnricherData";

export default class BorrowedTonguesAndHides extends DDBEnricherData {

  get useDefaultAdditionalActivities(): boolean {
    return true;
  }

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Arch Daemon Boon",
        options: {
          transfer: true,
          disabled: true,
          description: "While siphoning power from Arch Daemons you have Resistance to Necrotic damage, and Fiends that know at least one language can understand your speech and you theirs.",
        },
        changes: [
          DDBEnricherData.ChangeHelper.damageResistanceChange("necrotic"),
        ],
      },
      {
        name: "Arch Seraph Boon",
        options: {
          transfer: true,
          disabled: true,
          description: "While siphoning power from Arch Seraphs you have Resistance to Radiant damage, and Celestials that know at least one language can understand your speech and you theirs.",
        },
        changes: [
          DDBEnricherData.ChangeHelper.damageResistanceChange("radiant"),
        ],
      },
    ];
  }

}
