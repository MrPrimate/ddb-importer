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
      midiUseCondition: `reaction == 'isDamaged' && ['mwak', 'msak'].includes(workflow.activity?.actionType)`,
      // with Midi the effect rolls the reduction itself, and a utility roll would hold the
      // reaction until it is rolled by hand, after the damage has already landed
      data: this.useMidiAutomations
        ? {}
        : {
          roll: {
            prompt: false,
            visible: false,
            formula: this.reductionFormula,
            name: "Reduce Damage Roll",
          },
        },
    };
  }

  /** The die plus Strength or Dexterity (2024), Dexterity (2014). */
  get reductionFormula(): string {
    return `${this.diceString} + ${this.is2014 ? "@abilities.dex.mod" : "max(@abilities.str.mod, @abilities.dex.mod)"}`;
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        midiOnly: true,
        // Midi adds traits.dm values to the damage and ignores dice there, so the reduction is
        // negative and DAE rolls the inline term when the reaction applies the effect
        midiChanges: [
          DDBEnricherData.ChangeHelper.unsignedAddChange(`-[[${this.reductionFormula}]]`, 20, "system.traits.dm.midi.all"),
        ],
        // a reduction that absorbs the whole hit does not count as being damaged
        daeSpecialDurations: ["isDamaged", "1Reaction"],
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
