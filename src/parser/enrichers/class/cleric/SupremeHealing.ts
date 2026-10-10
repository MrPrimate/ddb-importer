import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Life Domain: spell healing dice are always maximised. Channel Divinity healing in the domain
 * (Preserve Life) rolls no dice, so spells cover it. Core dnd5e has no maximise rule; AC5e does,
 * with the heal filter from its Healer feat example.
 */
export default class SupremeHealing extends DDBEnricherData {

  override get useDefaultAdditionalActivities(): boolean {
    return true;
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Supreme Healing (Automation)",
        ac5eOnly: true,
        options: {
          transfer: true,
          description: "Healing dice from your spells use their highest number.",
        },
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.ac5eChange(
            "modifier=maximize; isHeal && healing && isSpell",
            20,
            "flags.automated-conditions-5e.damage.modifier",
          ),
        ],
      },
    ];
  }

}
