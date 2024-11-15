/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class DemonArmor extends DDBEnricherData {

  get type() {
    return "enchant";
  }

  // get activity() {
  //   return {
  //     data: {

  //     },
  //   };
  // }

  // "Demon Armor": {
  // previous DAE/Midi effect
  //   noCreate: true,
  //   changes: [
  //     {
  //       key: "items.Unarmed Strike.system.attack.bonus",
  //       value: "1",
  //       mode: CONST.ACTIVE_EFFECT_MODES.ADD,
  //       priority: 20,
  //     },
  //     {
  //       key: "items.Unarmed Strike.system.damage.parts.0.0",
  //       value: "1d8+@mod+1",
  //       mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
  //       priority: 20,
  //     },
  //     {
  //       key: "items.Unarmed Strike.system.properties.mgc",
  //       value: "true",
  //       mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
  //       priority: 20,
  //     },
  //   ],
  // },

  get effects() {
    return [
      {
        type: "enchant",
        descriptionHint: true,
        magicalBonus: {
          makeMagical: true,
          bonus: "1",
        },
        changes: [
          DDBEnricherData.generateOverrideChange("1", 20, "system.bonuses.base.number"),
          DDBEnricherData.generateOverrideChange("8", 20, "system.damage.base.denomination"),
          DDBEnricherData.generateOverrideChange("false", 20, "system.damage.base.custom.enabled"),
        ],
        data: {
          "restrictions.type": "weapon",
        },
      },
    ];
  }

}
