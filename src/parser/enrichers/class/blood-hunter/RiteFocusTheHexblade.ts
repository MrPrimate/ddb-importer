import DDBEnricherData from "../../data/DDBEnricherData";
import _RiteFocus from "./_RiteFocus";


export default class RiteFocusTheHexblade extends _RiteFocus {

  override get patronName(): string {
    return "The Hexblade";
  }

  override get type() {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  override get activity(): IDDBActivityData {
    return {
      name: this.activityName,
      targetType: "creature",
      targetCount: 1,
      activationType: "special",
      activationCondition: "The next time you hit a creature that is under one of your blood curses, while you have an active crimson rite",
      allowCritical: false,
      data: {
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              customFormula: "@prof",
            }),
          ],
        },
      },
    };
  }

}
