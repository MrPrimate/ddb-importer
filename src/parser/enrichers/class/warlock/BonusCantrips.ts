import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Nothing to change: the feature's spells come from the granted-spell advancements. Kept so the
 * feature resolves to this empty enricher rather than to the Generic fallback, which adds DDB's
 * action-matched activities.
 */
export default class BonusCantrips extends DDBEnricherData {
}
