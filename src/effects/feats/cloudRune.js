import { baseFeatEffect } from "../specialFeats.js";

export async function cloudRuneEffect(ddb, character, document) {
  // If a rune requires a saving throw, your Rune Magic save
  // DC equals 8 + your proficiency bonus + your Constitution modifier.

  // const dcString = "8 + @prof + @attributes.con.mod";

  let baseEffect = baseFeatEffect(document, document.name);
  setProperty(document, "data.target.type", "self");
  setProperty(document, "data.range.units", "");
  setProperty(document, "data.range.value", null);

  baseEffect.transfer = true;
  baseEffect.changes.push(
    {
      key: "flags.midi-qol.advantage.skill.dec",
      mode: CONST.ACTIVE_EFFECT_MODES.ADD,
      value: "1",
      priority: "20",
    },
    {
      key: "flags.midi-qol.advantage.skill.slt",
      mode: CONST.ACTIVE_EFFECT_MODES.ADD,
      value: "1",
      priority: "20",
    },
  );

  // Missing: reaction effect to transfer attack

  document.effects.push(baseEffect);
  return document;
}
