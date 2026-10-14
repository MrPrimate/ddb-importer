import DDBEnricherData from "../../data/DDBEnricherData";
import Maneuver from "./Maneuver";

export default class ManeuverParry extends Maneuver {

  override get type(): IDDBActivityType {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      activationType: "reaction",
      targetType: "self",
      data: {
        roll: {
          prompt: false,
          visible: false,
          // the die plus Strength or Dexterity (2024), Dexterity (2014)
          formula: `${this.diceString} + ${this.is2014 ? "@abilities.dex.mod" : "max(@abilities.str.mod, @abilities.dex.mod)"}`,
          name: "Reduce Damage Roll",
        },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        midiOnly: true,
        midiChanges: [
          DDBEnricherData.ChangeHelper.unsignedAddChange(this.diceString, 20, "system.traits.dm.midi.all"),
        ],
        daeSpecialDurations: ["isDamaged"],
      },
      // Future Enhancement: Add a macro that rolls dice and applies dr effect
      // {
      //   changes: [
      //     {
      //       key: "system.traits.dm.amount.bludgeoning",
      //       value: "-@scale.battle-master.combat-superiority-die",
      //       type: "add",
      //       priority: 20,
      //     },
      //     {
      //       key: "system.traits.dm.amount.piercing",
      //       value: "-@scale.battle-master.combat-superiority-die",
      //       type: "add",
      //       priority: 20,
      //     },
      //     {
      //       key: "system.traits.dm.amount.slashing",
      //       value: "-@scale.battle-master.combat-superiority-die",
      //       type: "add",
      //       priority: 20,
      //     },
      //   ],
      // },
    ];
  }

}
