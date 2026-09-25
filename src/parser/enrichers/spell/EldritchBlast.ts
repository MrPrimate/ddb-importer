import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Eldritch Blast: a plain 1d10 force attack. The invocations that modify it (Agonizing Blast
 * damage, Eldritch Spear range, Repelling Blast) are enchantments on their own feature documents
 * that the character importer's enchantment step applies to this spell, so nothing from the DDB
 * eldritch-blast modifiers is baked in here; doing both would double them.
 */
export default class EldritchBlast extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.ATTACK;
  }

  override get activity(): IDDBActivityData {
    return {
      data: {
        damage: {
          parts: [DDBEnricherData.basicDamagePart({ number: 1, denomination: 10, type: "force", scalingMode: "none" })],
        },
      },
    };
  }

}
