/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class AlterSelf extends DDBEnricherData {

  get type() {
    return "utility";
  }

  get activity() {
    return {
      data: {
        name: "Aquatic Adaptation",
        img: "icons/creatures/fish/fish-bluefin-yellow-blue.webp",
      },
    };
  }

  get additionalActivities() {
    return [
      {
        constructor: {
          name: "Change Appearance",
          type: "utility",
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
        constructor: {
          name: "Natural Weapons",
          type: "enchant",
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
        DDBEnricherData.generateOverrideChange(`{} [Natural Weapons]`, 20, "name"),
        DDBEnricherData.generateUnsignedAddChange("mgc", 20, "system.properties"),
        DDBEnricherData.generateOverrideChange("1", 20, "system.damage.base.number"),
        DDBEnricherData.generateOverrideChange("6", 20, "system.damage.base.denomination"),
        DDBEnricherData.generateUnsignedAddChange("bludgeoning", 20, "system.damage.base.types"),
        DDBEnricherData.generateUnsignedAddChange("piercing", 20, "system.damage.base.types"),
        DDBEnricherData.generateUnsignedAddChange("slashing", 20, "system.damage.base.types"),
      ],
      activityMatch: "Natural Weapons",
    };
    if (this.is2014) {
      naturalWeaponEffect.magicalBonus = {
        makeMagical: false,
        bonus: "1",
      };
    } else {
      naturalWeaponEffect.changes.push(
        DDBEnricherData.generateOverrideChange("spellcasting", 20, "system.ability"));
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
          this.movementChange("@attributes.movement.walk", 5, "system.attributes.movement.swim"),
        ],
      },
    );

    return effects;
  }

}
