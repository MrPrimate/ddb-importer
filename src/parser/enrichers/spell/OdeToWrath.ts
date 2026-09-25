import DDBEnricherData from "../data/DDBEnricherData";

/**
 * The 30-foot emanation follows the caster and gives the caster and allies inside a bonus to
 * melee weapon damage equal to the caster's spellcasting modifier. With an aura module the effect
 * spreads from the caster and the formula is resolved against the caster before it is applied.
 * DDB parses the bonus as an attack the spell makes, which it is not.
 */
export default class OdeToWrath extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Cast",
      removeDamageParts: true,
      data: {
        target: {
          override: true,
          affects: { type: "ally" },
          template: { contiguous: false, units: "ft", type: "radius", size: "30", count: "1" },
        },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Ode to Wrath",
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("+@attributes.spell.mod", 20, "system.bonuses.mwak.damage"),
        ],
        daeStackable: "noneNameOnly",
        options: {
          description: "Adds the caster's spellcasting ability modifier to damage rolls made with melee weapons while in the emanation.",
        },
        data: {
          flags: {
            ActiveAuras: {
              isAura: true,
              aura: "Allies",
              radius: "30",
              alignment: "",
              type: "",
              ignoreSelf: false,
              height: false,
              hidden: false,
              onlyOnce: false,
              displayTemp: true,
            },
          },
        },
        auraeffects: {
          applyToSelf: true,
          bestFormula: "",
          canStack: false,
          collisionTypes: ["move"],
          combatOnly: false,
          disableOnHidden: true,
          distanceFormula: `30`,
          disposition: 1,
          evaluatePreApply: true,
          overrideName: "",
          script: "",
        },
      },
    ];
  }

}
