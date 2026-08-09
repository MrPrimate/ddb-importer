import DDBEnricherData from "../data/DDBEnricherData";

export default class TashasOtherworldlyGuise extends DDBEnricherData {

  override get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Cast",
    };
  }

  override get clearAutoEffects() {
    return true;
  }

  override get effects(): IDDBEffectHint[] {
    const sharedChanges = [
      DDBEnricherData.ChangeHelper.upgradeChange("40", 20, "system.attributes.movement.fly"),
      DDBEnricherData.ChangeHelper.signedAddChange("2", 20, "system.attributes.ac.bonus"),
    ];
    const upperPlanesChanges = [
      DDBEnricherData.ChangeHelper.damageImmunityChange("radiant"),
      DDBEnricherData.ChangeHelper.damageImmunityChange("necrotic"),
      DDBEnricherData.ChangeHelper.conditionImmunityChange("charmed"),
    ].concat(sharedChanges);
    const lowerPlanesChanges = [
      DDBEnricherData.ChangeHelper.damageImmunityChange("fire"),
      DDBEnricherData.ChangeHelper.damageImmunityChange("poison"),
      DDBEnricherData.ChangeHelper.conditionImmunityChange("poisoned"),
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

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Otherworldly Weapon",
          type: DDBEnricherData.ACTIVITY_TYPES.ENCHANT,
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
