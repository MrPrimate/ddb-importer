import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Oath of the Ebon Blade and the World of Warcraft Death Knight: Resistance to Cold, Necrotic and
 * Psychic damage for the paladin and allies inside the Aura of Protection, built as Aura of Devotion
 * is: Active Auras or auraeffects radiate the transferred effect; without either it only covers the
 * paladin.
 */
export default class AuraOfDeathlyEndurance extends DDBEnricherData {

  static RESISTANCES = ["cold", "necrotic", "psychic"];

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Aura of Deathly Endurance",
        options: {
          transfer: true,
          description: this.data.system.description?.value,
        },
        daeStackable: "noneNameOnly",
        data: {
          flags: {
            ActiveAuras: {
              aura: "Allies",
              radius: `@scale.${this.classIdentifier("Paladin")}.aura-of-protection`,
              isAura: true,
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
          distanceFormula: `@scale.${this.classIdentifier("Paladin")}.aura-of-protection`,
          disposition: 1,
          evaluatePreApply: true,
          overrideName: "",
          script: "",
        },
        changes: AuraOfDeathlyEndurance.RESISTANCES.map((damage) =>
          DDBEnricherData.ChangeHelper.damageResistanceChange(damage),
        ),
      },
    ];
  }

  override get clearAutoEffects(): boolean {
    return true;
  }

}
