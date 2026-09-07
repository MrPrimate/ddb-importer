import { DICTIONARY } from "../../../../config/_module";
import DDBEnricherData from "../../data/DDBEnricherData";

export default class EncouragingSmite extends DDBEnricherData {

  override get activity(): IDDBActivityData {
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

  override get effects(): IDDBEffectHint[] {
    return [{
      name: "Encouraged",
      options: {
        expiry: "sourceStart",
        description: "Until the start of the paladin's next turn, this creature has Advantage on attack rolls and saving throws against the target of the Divine Smite, and its attacks against that target deal an extra 1d4 Thunder damage.",
      },
      changes: DICTIONARY.actor.abilities.map((ability) =>
        DDBEnricherData.ChangeHelper.advantageAbilitySaveChange(ability.value),
      ),
      midiChanges: [
        DDBEnricherData.ChangeHelper.unsignedAddChange("1", 20, "flags.midi-qol.advantage.attack.all"),
      ],
    }];
  }

}
