/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class TashasOtherworldlyGuise extends DDBEnricherData {

  get type() {
    return "utility";
  }

  get activity() {
    return {
      name: "Cast",
    };
  }

  get clearAutoEffects() {
    return true;
  }

  get effects() {
    const sharedChanges = [
      DDBEnricherData.ChangeHelper.upgradeChange("40", 20, "system.attributes.movement.fly"),
      DDBEnricherData.ChangeHelper.signedAddChange("2", 20, "system.attributes.ac.bonus"),
    ];
    const upperPlanesChanges = [
      DDBEnricherData.ChangeHelper.addChange("radiant", 20, "system.traits.di.value"),
      DDBEnricherData.ChangeHelper.addChange("necrotic", 20, "system.traits.di.value"),
      DDBEnricherData.ChangeHelper.addChange("charmed", 20, "system.traits.ci.value"),
    ].concat(sharedChanges);
    const lowerPlanesChanges = [
      DDBEnricherData.ChangeHelper.addChange("fire", 20, "system.traits.di.value"),
      DDBEnricherData.ChangeHelper.addChange("poison", 20, "system.traits.di.value"),
      DDBEnricherData.ChangeHelper.addChange("poisoned", 20, "system.traits.ci.value"),
    ].concat(sharedChanges);
    const effects = [
      {
        name: "Upper Planes",
        changes: upperPlanesChanges,
        activityMatch: "Cast",
      },
      {
        name: "Lower Planes",
        changes: lowerPlanesChanges,
        activityMatch: "Cast",
      },
      {
        name: "Otherworldly Weapon",
        type: "enchant",
        changes: [
          DDBEnricherData.ChangeHelper.overrideChange(`{} [Otherworldly Weapon]`, 20, "name"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("mgc", 20, "system.properties"),
          DDBEnricherData.ChangeHelper.overrideChange("spellcasting", 20, "system.ability"),
        ],
        activityMatch: "Otherworldly Weapon",
      },
    ];
    return effects;
  }

  get additionalActivities() {
    return [
      {
        constructor: {
          name: "Otherworldly Weapon",
          type: "enchant",
        },
        build: {
          img: "icons/magic/holy/angel-wings-gray.webp",
          generateDamage: false,
          generateHealing: false,
          generateRange: false,
          generateConsumption: true,
          data: {
            restrictions: {
              type: "weapon",
              allowMagical: true,
            },
          },
        },
      },
    ];
  }

}
