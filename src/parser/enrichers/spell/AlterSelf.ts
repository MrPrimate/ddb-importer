import DDBEnricherData from "../data/DDBEnricherData";

export default class AlterSelf extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity() {
    return {
      data: {
        name: "Aquatic Adaptation",
        img: "icons/creatures/fish/fish-bluefin-yellow-blue.webp",
        midiProperties: { chooseEffects: true },
      },
    };
  }

  get additionalActivities() {
    return [
      {
        init: {
          name: "Change Appearance",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          img: "icons/creatures/magical/spirit-undead-ghost-blue.webp",
          generateDamage: false,
          generateHealing: false,
          generateRange: false,
          generateConsumption: true,
        },
      },
      {
        init: {
          name: "Natural Weapons",
          type: DDBEnricherData.ACTIVITY_TYPES.ENCHANT,
        },
        build: {
          img: "icons/creatures/abilities/fang-tooth-blood-red.webp",
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

  get effects() {
    const effects = [];
    const naturalWeaponEffect = {
      name: "Natural Weapons",
      type: "enchant",
      changes: [
        DDBEnricherData.ChangeHelper.overrideChange(`{} [Natural Weapons]`, 20, "name"),
        DDBEnricherData.ChangeHelper.unsignedAddChange("mgc", 20, "system.properties"),
        DDBEnricherData.ChangeHelper.overrideChange("1", 20, "system.damage.base.number"),
        DDBEnricherData.ChangeHelper.overrideChange("6", 20, "system.damage.base.denomination"),
        DDBEnricherData.ChangeHelper.unsignedAddChange("bludgeoning", 20, "system.damage.base.types"),
        DDBEnricherData.ChangeHelper.unsignedAddChange("piercing", 20, "system.damage.base.types"),
        DDBEnricherData.ChangeHelper.unsignedAddChange("slashing", 20, "system.damage.base.types"),
      ],
      activityMatch: "Natural Weapons",
      magicalBonus: undefined,
    };
    if (this.is2014) {
      naturalWeaponEffect.magicalBonus = {
        makeMagical: false,
        bonus: "1",
      };
    } else {
      naturalWeaponEffect.changes.push(
        DDBEnricherData.ChangeHelper.overrideChange("spellcasting", 20, "system.ability"));
    }

    effects.push(naturalWeaponEffect);
    effects.push(
      {
        name: "Change Appearance",
        activityMatch: "Change Appearance",
      },
      {
        name: "Aquatic Adaptation",
        activityMatch: "Aquatic Adaptation",
        changes: [
          DDBEnricherData.ChangeHelper.upgradeChange("@attributes.movement.walk", 5, "system.attributes.movement.swim"),
        ],
      },
    );

    return effects;
  }

}
