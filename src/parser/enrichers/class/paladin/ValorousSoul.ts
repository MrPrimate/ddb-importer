import { DICTIONARY } from "../../../../config/_module";
import DDBEnricherData from "../../data/DDBEnricherData";

export default class ValorousSoul extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      name: "Valorous Soul",
      type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
      activationType: "special",
      activationCondition: "You reduce a foe to 0 Hit Points with a melee attack",
      targetType: "ally",
      data: {
        range: {
          units: "ft",
          value: "60",
        },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [{
      name: "Valorous",
      options: {
        durationSeconds: 60,
        description: "This ally has Advantage on attack rolls and saving throws for 1 minute.",
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
