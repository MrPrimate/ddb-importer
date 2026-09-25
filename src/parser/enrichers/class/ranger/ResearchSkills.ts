import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * "Whenever you make an Intelligence check, you gain a bonus to the check equal
 * to your Wisdom modifier (minimum of +1)." DDB carries the bonus as a modifier
 * with no value, so the generated effect holds only the skill proficiency
 * choice; the change is added to that same effect.
 */
export default class ResearchSkills extends DDBEnricherData {

  override get useDefaultAdditionalActivities(): boolean {
    return true;
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        noCreate: true,
        name: "Research Skills",
        options: {
          transfer: true,
          disabled: false,
          description: "Whenever you make an Intelligence check, you gain a bonus to the check equal to your Wisdom modifier (minimum of +1).",
        },
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange(
            "max(@abilities.wis.mod, 1)",
            20,
            "system.abilities.int.bonuses.check",
          ),
        ],
      },
    ];
  }

}
