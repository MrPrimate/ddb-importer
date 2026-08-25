import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Aura traits whose rules text is "any creature that starts its turn within
 * X feet / in an X-foot Emanation must save..." (Stench, Fear Aura, Lordly
 * Presence...). The monster feature parser already extracts the radius
 * template, save and rider status; this wires the region trigger so the save
 * fires for tokens that start their turn inside, excluding the monster the
 * emanation originates from. Owner-turn auras (Fire Aura
 * and friends, "at the start/end of each of the MONSTER's turns") are NOT
 * registered here as region events cannot express them.
 */
export default class TurnStartAuraSave extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      data: {
        behaviors: [
          DDBEnricherData.BehaviorHelper.activity({
            events: ["tokenTurnStart"],
            // the emanation originates from the monster, which does not save
            // against its own stench/presence
            excludeSelf: true,
          }),
        ],
      },
    };
  }

}
