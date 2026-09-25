import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Charmed immunity for the paladin and allies inside the Aura of Protection. Active Auras or
 * auraeffects radiate the transferred effect; without either it only covers the paladin.
 */
export default class AuraOfDevotion extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Aura of Devotion",
        options: {
          transfer: true,
          description: this.data.system.description?.value,
        },
        daeStackable: "noneNameOnly",
        data: {
          flags: {
            ActiveAuras: {
              aura: "Allies",
              radius: "@scale.paladin.aura-of-protection",
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
          distanceFormula: "@scale.paladin.aura-of-protection",
          disposition: 1,
          evaluatePreApply: true,
          overrideName: "",
          script: "",
        },
        changes: [
          DDBEnricherData.ChangeHelper.conditionImmunityChange("charmed"),
        ],
      },
    ];
  }

  override get clearAutoEffects(): boolean {
    return true;
  }

}
