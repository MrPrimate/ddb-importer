import DDBEnricherData from "../../data/DDBEnricherData";
import { areaPlacer, areaTrigger } from "../../data/AreaBuilders";

const CHILL = "Frost Squall: Chill";

/**
 * DDB sets the two effects this feature grants as bold-only paragraphs under it, so they are
 * options of one feature, and the parser folds them into one save: Frigid Sheen's Dexterity DC
 * with Frost Squall's cold dice. The save is Frigid Sheen's alone. Frost Squall is an aura: for a
 * minute a non-Elemental creature starting its turn within 15 feet is slowed to 15 feet until
 * the end of that turn, and takes the cold damage the first time it then chooses to move, which
 * is the table's call, so the damage is offered with the slow rather than rolled for it.
 */
export default class ConvocationOfIce extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      name: "Frigid Sheen",
      removeDamageParts: true,
      activationCondition: "For 1 minute, as a Reaction when hit by an attacker within 30 feet: the attacker saves or the attack is reflected",
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      areaPlacer("Frost Squall", {
        template: { type: "radius", size: "15" },
        activationType: "bonus",
        activationCondition: "For 1 minute, a non-Elemental creature that starts its turn within 15 feet is chilled",
        duration: { value: "1", units: "minute" },
        consume: true,
      }),
      areaTrigger(CHILL, {
        condition: "A non-Elemental creature starts its turn within 15 feet; roll the damage the first time it willingly moves before its next turn",
        damageParts: [
          DDBEnricherData.basicDamagePart({ number: 3, denomination: 6, types: ["cold"] }),
        ],
      }),
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Frost Squall: Slowed",
        activityMatch: CHILL,
        // every mode is capped; a downgrade leaves a speed already below 15 feet alone
        changes: ["walk", "fly", "swim", "climb", "burrow"].map((mode) =>
          DDBEnricherData.ChangeHelper.downgradeChange("15", 50, `system.attributes.movement.${mode}`)),
        options: { transfer: false, expiry: "turnEnd", description: "Speed reduced to 15 feet until the end of its turn." },
      },
    ];
  }

  // the placer and its trigger sit beside the parsed save, not instead of it
  override get keepParsedActivities(): boolean {
    return true;
  }

}
