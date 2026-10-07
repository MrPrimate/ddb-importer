import DDBEnricherData from "../data/DDBEnricherData";
import SpellComponentItem from "./_SpellComponentItem";

/** The Magus Class: consumed when casting Dragon's Breath; the spell's target gains a 30 foot Fly Speed for the spell's minute. */
export default class DragonsWingscale extends SpellComponentItem {

  override get spellName(): string {
    return "Dragon's Breath";
  }

  override get componentActivity(): IDDBActivityData {
    return {
      targetType: "creature",
      targetCount: 1,
      rangeType: "touch",
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Dragon's Wingscale",
        activityMatch: "Consume with Dragon's Breath",
        options: {
          transfer: false,
          durationSeconds: 60,
        },
        changes: [
          DDBEnricherData.ChangeHelper.upgradeChange("30", 20, "system.attributes.movement.speeds.fly"),
        ],
      },
    ];
  }

}
