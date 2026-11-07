import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Oath of the Ebon Blade and the World of Warcraft Death Knight: Resistance to Cold, Necrotic and
 * Psychic damage for the paladin and allies inside the Aura of Protection, built as Aura of Devotion
 * is (an auraeffects transfer, or a placed template applying the standalone effect).
 */
export default class AuraOfDeathlyEndurance extends DDBEnricherData {

  static RESISTANCES = ["cold", "necrotic", "psychic"];

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Place Aura",
      targetType: "ally",
      activationType: "special",
      data: {
        target: {
          template: {
            contiguous: false,
            type: "radius",
            size: `@scale.${this.classIdentifier("Paladin")}.aura-of-protection`,
            units: "ft",
          },
        },
        behaviors: [
          DDBEnricherData.BehaviorHelper.applyEffect({
            effects: "Aura of Deathly Endurance",
            auraeffectsNever: true,
          }),
        ],
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Aura of Deathly Endurance",
        standalone: true,
        auraeffectsNever: true,
        options: { description: this.data.system.description?.value },
        changes: AuraOfDeathlyEndurance.RESISTANCES.map((damage) =>
          DDBEnricherData.ChangeHelper.damageResistanceChange(damage),
        ),
      },
      {
        name: "Aura of Deathly Endurance",
        auraeffectsOnly: true,
        options: {
          transfer: true,
          description: this.data.system.description?.value,
        },
        daeStackable: "noneNameOnly",
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
