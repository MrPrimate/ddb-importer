import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Arcana Unleashed Enchanter: an Intelligence modifier bonus (minimum +1) to checks with the
 * chosen skill. A character import knows the choice and gets one enabled effect; the muncher
 * does not, so it ships all three disabled for the player to toggle.
 */
export default class EnchantingConversationalist extends DDBEnricherData {

  static SKILLS: { label: string; key: string }[] = [
    { label: "Deception", key: "dec" },
    { label: "Intimidation", key: "itm" },
    { label: "Persuasion", key: "per" },
  ];

  get chosenSkill(): string | null {
    if (this.ddbParser.isMuncher) return null;
    const labels = (this.ddbParser._chosen ?? []).map((choice) => choice.label);
    return EnchantingConversationalist.SKILLS.find((skill) => labels.includes(skill.label))?.label ?? null;
  }

  override get effects(): IDDBEffectHint[] {
    const chosen = this.chosenSkill;
    const skills = chosen
      ? EnchantingConversationalist.SKILLS.filter((skill) => skill.label === chosen)
      : EnchantingConversationalist.SKILLS;
    return skills.map((skill) => ({
      name: `Enchanting Conversationalist: ${skill.label}`,
      options: {
        transfer: true,
        disabled: chosen === null,
      },
      changes: [
        DDBEnricherData.ChangeHelper.ruleBonusChange("check", "max(1, @abilities.int.mod)", {
          conditions: { k: "roll.skill", o: "exact", v: skill.key },
        }),
      ],
    }));
  }

}
