import DDBEnricherData from "../../data/DDBEnricherData";
import { regionPlacer, regionTrigger } from "../../data/RegionBuilders";

const GUARDIAN_PULL = "Guardian: Pull";

/**
 * Perfected Armor (Armorer): DDB ships no action, so the feature imported with nothing usable.
 * The 2014 printing keys the Guardian pull and the Infiltrator rider off one proficiency-bonus
 * pool; the 2024 printing gives each model its own Intelligence-modifier pool, and a character
 * wears one model, so one pool serves. The Guardian pull answers a Huge or smaller creature
 * ending its turn within 30 feet, so a 30-foot emanation offers the Strength save then; taking
 * the Reaction, the pull and the follow-up attack are the artificer's call.
 */
export default class PerfectedArmor extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return this.is2014 ? DDBEnricherData.ACTIVITY_TYPES.UTILITY : null;
  }

  override get activity(): IDDBActivityData | null {
    if (!this.is2014) return null;
    return {
      name: "Perfected Armor",
      activationType: "reaction",
      activationCondition: "Guardian: a Huge or smaller creature you can see ends its turn within 30 feet (Strength save or be pulled); Infiltrator: a creature hit by your Lightning Launcher",
      targetType: "creature",
      targetCount: 1,
      rangeType: "ft",
      rangeValue: 30,
      addItemConsume: true,
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    const pull = regionTrigger(GUARDIAN_PULL, {
      condition: "Guardian model: a Huge or smaller creature you can see ends its turn within 30 feet; pulled up to 25 feet toward you on a failure",
      save: { ability: ["str"], calculation: "spellcasting" },
    });
    return [
      regionPlacer("Guardian: Place Gravitational Aura", {
        template: { type: "radius", size: "30" },
        activationType: "special",
        activationCondition: "Guardian model only",
        behaviors: [
          DDBEnricherData.BehaviorHelper.activity({
            events: ["tokenTurnEnd"],
            activityName: GUARDIAN_PULL,
            excludeSelf: true,
            sizes: ["tiny", "sm", "med", "lg", "huge"],
          }),
        ],
      }),
      {
        ...pull,
        build: { ...pull.build, activationOverride: { type: "reaction", value: 1, condition: pull.build?.activationOverride?.condition ?? "" } },
        // the 2014 pool is spent by the feature's own activity; 2024 spends it on the pull
        overrides: { ...pull.overrides, ...(this.is2014 ? {} : { noConsumeTargets: false, addItemConsume: true }) },
      },
    ];
  }

  override get override(): IDDBOverrideData | null {
    return {
      uses: this._getUsesWithSpent({
        type: "class",
        name: this.ddbParser.originalName,
        max: this.is2014 ? "@prof" : "max(1, @abilities.int.mod)",
        period: "lr",
      }),
    };
  }

}
