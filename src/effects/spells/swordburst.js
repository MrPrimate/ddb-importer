export function swordBurstEffect(document) {
  foundry.utils.setProperty(document, "flags.midi-qol.AoETargetType", "any");
  foundry.utils.setProperty(document, "flags.midi-qol.AoETargetTypeIncludeSelf", false);

  return document;
}
