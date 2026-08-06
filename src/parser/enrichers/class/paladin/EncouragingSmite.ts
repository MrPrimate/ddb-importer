import { DICTIONARY } from "../../../../config/_module";
import DDBEnricherData from "../../data/DDBEnricherData";

export default class EncouragingSmite extends DDBEnricherData {

  get activity(): IDDBActivityData {
    return {
      name: "Encouraging Smite",
      type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
      addItemConsume: true,
      itemConsumeTargetName: "Channel Divinity",
      activationType: "special",
      activationCondition: "Immediately after you cast Divine Smite",
      targetType: "ally",
      data: {
        range: {
          units: "ft",
          value: "30",
        },
      },
    };
  }

  get effects(): IDDBEffectHint[] {
    return [{
      name: "Encouraged",
      options: {
        durationTurns: 1,
        description: "Until the start of the paladin's next turn, this creature has Advantage on attack rolls and saving throws against the target of the Divine Smite, and its attacks against that target deal an extra 1d4 Thunder damage.",
      },
      daeSpecialDurations: ["turnStartSource"],
      changes: DICTIONARY.actor.abilities.map((ability) =>
        DDBEnricherData.ChangeHelper.addChange(`${CONFIG.Dice.D20Roll.ADV_MODE.ADVANTAGE}`, 20, `system.abilities.${ability.value}.save.roll.mode`),
      ),
      midiChanges: [
        DDBEnricherData.ChangeHelper.unsignedAddChange("1", 20, "flags.midi-qol.advantage.attack.all"),
      ],
    }];
  }

}
