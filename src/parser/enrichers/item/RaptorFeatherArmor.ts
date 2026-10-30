import DDBEnricherData from "../data/DDBEnricherData";
import { itemText } from "./_ItemActivities";

/**
 * The Raptor Feather armours: Resistance to falling damage while attuned (dnd5e 6.1 `falling`
 * trait), and where the text offers it a Reaction, when taking falling damage, for Immunity to it
 * until the end of the turn. Nothing is added before 6.1.
 */
export default class RaptorFeatherArmor extends DDBEnricherData {

  get hasReaction(): boolean {
    return (/use your Reaction to instead gain Immunity to falling damage/i).test(itemText(this));
  }

  get immunityChanges(): IActiveEffectChangeData[] {
    return DDBEnricherData.ChangeHelper.fallingDamageChanges("You have Immunity to falling damage.");
  }

  get bracesForFall(): boolean {
    return this.hasReaction && this.immunityChanges.length > 0;
  }

  // the parser builds a reaction activity from the text, so the reaction is that activity
  override get type(): IDDBActivityType | null {
    return this.bracesForFall ? DDBEnricherData.ACTIVITY_TYPES.UTILITY : null;
  }

  override get activity(): IDDBActivityData | null {
    if (!this.bracesForFall) return null;
    return {
      name: "Brace for the Fall",
      targetType: "self",
      activationType: "reaction",
      activationCondition: "When you take falling damage",
      noConsumeTargets: true,
      noTemplate: true,
    };
  }

  override get effects(): IDDBEffectHint[] {
    const resistance = DDBEnricherData.ChangeHelper.fallingDamageChanges(
      "You have Resistance to falling damage.",
    );
    if (resistance.length === 0) return [];
    return [
      { name: "Raptor Feathers", options: { transfer: true }, changes: resistance },
      ...(this.hasReaction
        ? [{
          name: "Brace for the Fall",
          activityMatch: "Brace for the Fall",
          options: { transfer: false, expiry: "turnEnd" as T5eEffectExpiry, durationSeconds: null },
          changes: this.immunityChanges,
        }]
        : []),
    ];
  }

}
