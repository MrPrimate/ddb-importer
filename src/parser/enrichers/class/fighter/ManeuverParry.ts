import DDBEnricherData from "../../data/DDBEnricherData";
import Maneuver from "./Maneuver";

export default class ManeuverParry extends Maneuver {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity() {
    return {
      activationType: "reaction",
      targetType: "self",
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

  get effects(): IDDBEffectHint[] {
    return [
      {
        midiOnly: true,
        midiChanges: [
          DDBEnricherData.ChangeHelper.unsignedAddChange(this.diceString, 20, "system.traits.dm.midi.all"),
        ],
        daeSpecialDurations: ["isDamaged" as const],
      },
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
