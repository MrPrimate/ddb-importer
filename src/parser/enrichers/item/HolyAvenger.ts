import DDBEnricherData from "../data/DDBEnricherData";
import { regionPlacer } from "../data/RegionBuilders";

const AURA = "Holy Avenger Aura";

/**
 * Every Holy Avenger, legacy and current, whatever weapon it is. While the weapon is drawn the
 * holder and friendly creatures within 10 feet have Advantage on saves against spells and other
 * magical effects, 30 feet for a paladin of 17th level or higher. The aura is an emanation placed
 * from the weapon that applies one effect to the holder and allies inside.
 *
 * dnd5e gives a saving throw no sight of what forced it (the target rolls with its own roll data
 * and nothing about the spell), so no native rule condition can say "against spells". The effect
 * carries the two channels that can: midi's magic resistance flag and AC5e's `isSpell` condition.
 * In a world with neither module it is a marker on the token for the table to read.
 */
export default class HolyAvenger extends DDBEnricherData {

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      regionPlacer(AURA, {
        // attunement is paladin-only, so the class is there; without it the reference reads as 0
        template: { type: "radius", size: "10 + 20 * min(1, floor(@classes.paladin.levels / 17))" },
        // the holder counts as its own ally, so the emanation covers "you and friendly creatures"
        affects: "ally",
        activationType: "special",
        activationCondition: "While holding the drawn weapon",
        duration: { units: "perm" },
        behaviors: [
          DDBEnricherData.BehaviorHelper.applyEffect({ effects: AURA }),
        ],
      }),
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: AURA,
        standalone: true,
        midiChanges: [
          DDBEnricherData.ChangeHelper.customChange("1", 20, "flags.midi-qol.magicResistance.all"),
        ],
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.ac5eChange("isSpell", 20, "flags.automated-conditions-5e.save.advantage"),
        ],
        options: {
          description: "Advantage on saving throws against spells and other magical effects while within the Holy Avenger's aura.",
        },
      },
    ];
  }

}
