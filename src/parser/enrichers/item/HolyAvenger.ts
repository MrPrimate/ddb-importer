import DDBEnricherData from "../data/DDBEnricherData";

const AURA = "Holy Avenger Aura";
// attunement is paladin-only, so the paladin levels are there; without them the reference reads as 0
const RADIUS = "10 + 20 * min(1, floor(@classes.paladin.levels / 17))";

/**
 * Every Holy Avenger, legacy and current, whatever weapon it is. While the weapon is drawn the
 * holder and friendly creatures within 10 feet have Advantage on saves against spells and other
 * magical effects, 30 feet for a paladin of 17th level or higher. The aura is a transfer effect on
 * the holder that Active Auras or Aura Effects extend to allies inside the radius.
 *
 * dnd5e gives a saving throw no sight of what forced it (the target rolls with its own roll data
 * and nothing about the spell), so no native change can say "against spells". The effect carries
 * the two channels that can: midi's magic resistance flag and AC5e's `isSpell` condition. In a
 * world with neither module it is a marker on the token for the table to read.
 */
export default class HolyAvenger extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: AURA,
        daeStackable: "noneNameOnly",
        midiChanges: [
          DDBEnricherData.ChangeHelper.customChange("1", 20, "flags.midi-qol.magicResistance.all"),
        ],
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.ac5eChange("isSpell", 20, "flags.automated-conditions-5e.save.advantage"),
        ],
        options: {
          transfer: true,
          description: "Advantage on saving throws against spells and other magical effects while within the Holy Avenger's aura.",
        },
        data: {
          flags: {
            ActiveAuras: {
              aura: "Allies",
              radius: RADIUS,
              isAura: true,
              ignoreSelf: false,
              inactive: false,
              hidden: false,
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
          distanceFormula: RADIUS,
          disposition: 1,
          evaluatePreApply: true,
          overrideName: "",
          script: "",
        },
      },
    ];
  }

}
