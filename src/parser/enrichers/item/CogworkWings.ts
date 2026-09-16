import DDBEnricherData from "../data/DDBEnricherData";
import { itemActivity } from "./_ItemActivities";

/**
 * Cogwork Wings: the fly speed depends on the wearer's total weight, so the flight activity offers
 * one effect per weight band (60 ft under 150 lb, 30 ft up to 250 lb, no flight above that).
 */
export default class CogworkWings extends DDBEnricherData {
  override get activity(): IDDBActivityData {
    return {
      name: "Glide",
      activationCondition: "While falling; 50% chance the wings stick in the gliding position",
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      itemActivity("Wings in Motion", DDBEnricherData.ACTIVITY_TYPES.UTILITY, {
        activationCondition: "Set the wings in motion before donning them; up to 1 hour of flight in total",
        noeffect: false,
      }),
    ];
  }

  override get effects(): IDDBEffectHint[] {
    const flight = (name: string, speed: number): IDDBEffectHint => ({
      name,
      activityMatch: "Wings in Motion",
      options: {
        transfer: false,
        durationSeconds: 3600,
        description: "Total weight includes the wings (20 lb.) and all worn and carried gear. The wings regain 10 minutes of flight for every 4 hours they aren't in use.",
      },
      changes: [
        DDBEnricherData.ChangeHelper.upgradeChange(speed, 20, "system.attributes.movement.speeds.fly"),
      ],
    });
    return [
      flight("Flight (Under 150 lb.)", 60),
      flight("Flight (150 to 250 lb.)", 30),
    ];
  }

}
