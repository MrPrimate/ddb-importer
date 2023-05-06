import { forceManualReaction } from "../effects.js";

export function deflectMissilesAttackEffect(document) {
  document = forceManualReaction(document);
  setProperty(document, "system.range.long", 60);
  return document;
}
