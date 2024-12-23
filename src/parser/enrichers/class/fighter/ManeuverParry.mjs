/* eslint-disable class-methods-use-this */
import Maneuver from "./Maneuver.mjs";

export default class ManeuverParry extends Maneuver {

  get type() {
    return "utility";
  }

  get activity() {
    return {
      data: {
        roll: {
          prompt: false,
          visible: false,
          formula: this.diceString,
          name: "Reduce Damage Roll",
        },
      },
    };
  }

  get effects() {
    return [
      // Future Enhancement: Add a macro that rolls dice and applies dr effect
      // {
      //   changes: [
      //     {
      //       key: "system.traits.dm.amount.bludgeoning",
      //       value: "-@scale.battle-master.combat-superiority-die",
      //       mode: CONST.ACTIVE_EFFECT_MODES.ADD,
      //       priority: 20,
      //     },
      //     {
      //       key: "system.traits.dm.amount.piercing",
      //       value: "-@scale.battle-master.combat-superiority-die",
      //       mode: CONST.ACTIVE_EFFECT_MODES.ADD,
      //       priority: 20,
      //     },
      //     {
      //       key: "system.traits.dm.amount.slashing",
      //       value: "-@scale.battle-master.combat-superiority-die",
      //       mode: CONST.ACTIVE_EFFECT_MODES.ADD,
      //       priority: 20,
      //     },
      //   ],
      // },
    ];
  }

}
