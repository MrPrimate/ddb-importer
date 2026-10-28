import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Demon Rattle (OTFY): demons in a 15-foot Emanation that fail the DC 15 Wisdom save are Pacified
 * while you keep shaking the rattle (a Magic action each turn). Pacified has no dnd5e condition, so
 * the effect carries the restrictions as its description, as Pacify Monster does. The +1 to saves
 * against demons' effects depends on the source, so it stays description only.
 */
export default class DemonRattle extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      name: "Shake Rattle",
      activationCondition: "Takes effect at the end of your turn; continue with a Magic action each turn",
      targetType: "enemy",
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Pacified",
        activityMatch: "Shake Rattle",
        options: {
          transfer: false,
          description: "You can't attack, cast a spell that affects an enemy, or deal damage to another creature. Ends if the rattle stops, you take damage, or you can no longer hear it.",
        },
      },
    ];
  }

}
