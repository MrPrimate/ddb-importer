import DDBEnricherData from "../data/DDBEnricherData";
import { hasItemSource } from "./_ItemActivities";
import { hasItemEffectChange } from "./_ItemPassive";

export default class IounStoneOfMastery extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    if (!hasItemSource(this, 146) || hasItemEffectChange(this, "system.attributes.prof")) {
      return [];
    }
    return [
      {
        name: "Orbiting Mastery",
        options: {
          transfer: true,
          durationSeconds: null,
          description: "Only while the stone orbits your head; unequip it when stowed",
        },
        changes: [DDBEnricherData.ChangeHelper.addChange("1", 20, "system.attributes.prof")],
      },
    ];
  }

}
