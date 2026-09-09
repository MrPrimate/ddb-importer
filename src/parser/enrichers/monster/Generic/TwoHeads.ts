import DDBEnricherData from "../../data/DDBEnricherData";
import _SaveAdvantageVsCondition from "./_SaveAdvantageVsCondition";

export default class TwoHeads extends _SaveAdvantageVsCondition {

  override get saveAdvantageStatuses(): string[] {
    return ["blinded", "charmed", "deafened", "frightened", "stunned", "unconscious"];
  }

  override get effects(): IDDBEffectHint[] {
    const effects = super.effects;
    // the trait also grants advantage on Wisdom (Perception) checks
    effects[0]?.ac5eChanges?.push(
      DDBEnricherData.ChangeHelper.ac5eChange(
        "skill.prc",
        20,
        "flags.automated-conditions-5e.skill.advantage",
      ),
    );
    return effects;
  }

}
