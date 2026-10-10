import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Disrupt the Wyrd: the target rerolls its saving throw, adding or subtracting the caster's
 * spellcasting modifier. The Boon and Bane effects ride on the target, and AC5e reads the modifier
 * from the effect's origin actor (the caster) and spends the bonus on the next save. dnd5e 5.x has
 * no origin replacement for applied changes, so without AC5e the effect only describes the bonus.
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
          options: { description },
          ac5eChanges: [
            DDBEnricherData.ChangeHelper.ac5eChange(
              `bonus=${data.sign}effectOriginActor.attributes.spell.mod; once`,
              20,
              "flags.automated-conditions-5e.save.bonus",
            ),
          ],
        },
        {
          name,
          ac5eNever: true,
          options: { description: `${description} Apply the modifier by hand, then delete this effect.` },
        },
      ];
    });
  }

}
