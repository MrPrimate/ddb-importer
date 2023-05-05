export function deflectMissilesAttackEffect(document) {
  setProperty(document, "system.activation.type", "reactionmanual");
  setProperty(document, "system.range.long", 60);
  return document;
}
