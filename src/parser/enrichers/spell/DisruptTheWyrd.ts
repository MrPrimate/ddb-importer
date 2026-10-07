import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Disrupt the Wyrd: the target rerolls its saving throw, adding or subtracting the caster's
 * spellcasting modifier. The Boon and Bane effects ride on the target; originReplacement resolves
 * the modifier against the caster when they are applied. AC5e spends the bonus on the next save,
 * without it the rule bonus stays until the effect is deleted.
 */
export default class DisruptTheWyrd extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      data: {
        target: {
          override: true,
          prompt: false,
          affects: {
            count: "1",
            type: "creature",
          },
          template: {},
        },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      { name: "Boon", sign: "" },
      { name: "Bane", sign: "-" },
    ].flatMap((data) => {
      const name = `Disrupt the Wyrd: ${data.name}`;
      const description = `${data.sign === "-" ? "Subtract the caster's spellcasting modifier from" : "Add the caster's spellcasting modifier to"} the rerolled saving throw.`;
      return [
        {
          name,
          ac5eOnly: true,
          originReplacement: true,
          options: { description },
          ac5eChanges: [
            DDBEnricherData.ChangeHelper.ac5eChange(
              `bonus=${data.sign}@attributes.spell.mod; once`,
              20,
              "flags.automated-conditions-5e.save.bonus",
            ),
          ],
        },
        {
          name,
          ac5eNever: true,
          originReplacement: true,
          options: { description: `${description} Delete this effect after the reroll.` },
          changes: [
            DDBEnricherData.ChangeHelper.ruleBonusChange("save", `${data.sign}@attributes.spell.mod`),
          ],
        },
      ];
    });
  }

}
