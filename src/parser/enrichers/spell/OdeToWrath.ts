import DDBEnricherData from "../data/DDBEnricherData";
import { castPlacer, emanation } from "./_SpellRegions";

/**
 * The 30-foot emanation follows the caster and gives the caster and allies inside a bonus to
 * melee weapon damage equal to the caster's spellcasting modifier, so the formula is resolved
 * against the caster when the region applies it to someone else. DDB parses the bonus as an
 * attack the spell makes, which it is not.
 */
export default class OdeToWrath extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return castPlacer([
      DDBEnricherData.BehaviorHelper.applyEffect({ effects: "Ode to Wrath" }),
    ], { target: emanation("30", "ally") });
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Ode to Wrath",
        standalone: true,
        originReplacement: true,
        changes: [
          DDBEnricherData.ChangeHelper.ruleBonusChange("damage", "@attributes.spell.mod", {
            conditions: DDBEnricherData.ChangeHelper.MELEE_WEAPON_ATTACK_FILTER,
          }),
        ],
        // held only while inside: the region removes it on exit, so it carries no expiry of its own
        options: { expiry: null, durationSeconds: null, description: "Adds the caster's spellcasting ability modifier to damage rolls made with melee weapons while in the emanation." },
      },
    ];
  }

}
