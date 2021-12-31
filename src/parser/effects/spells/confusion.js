import { baseSpellEffect, generateMacroChange, generateMacroFlags } from "../specialSpells.js";

export function confusionEffect(document) {
  let effectConfusionConfusion = baseSpellEffect(document, document.name);
  effectConfusionConfusion.changes.push({
    key: "flags.midi-qol.OverTime",
    mode: CONST.ACTIVE_EFFECT_MODES.ADD,
    value: "turn=end, saveAbility=wis, saveDC=@attributes.spelldc,",
    priority: "20",
  });
  effectConfusionConfusion.flags.dae.macroRepeat = "startEveryTurn";
  const itemMacroText = `
//DAE Macro , Effect Value = @attributes.spelldc

const lastArg = args[args.length - 1];
let tactor;
if (lastArg.tokenId) tactor = canvas.tokens.get(lastArg.tokenId).actor;
else tactor = game.actors.get(lastArg.actorId);

if (args[0] === "each") {

  let confusionRoll = await new Roll("1d10").evaluate();
  let result = confusionRoll.total;
  let content;
  switch (result) {
    case 1:
      content = "The creature uses all its movement to move in a random direction. To determine the direction, roll a  [[d8]] and assign a direction to each die face. The creature doesn't take an action this turn.";
      break;
    case 2:
      content = "The creature doesn't move or take actions this turn.";
      break;
    case 3:
    case 4:
    case 5:
    case 6:
    case 7:
      content = "The creature uses its action to make a melee attack against a randomly determined creature within its reach. If there is no creature within its reach, the creature does nothing this turn.";
      break;
    case 8:
    case 9:
    case 10:
      content = "The creature can act and move normally.";
      break;
  }
  ChatMessage.create({ content: \`Confusion roll for \${tactor.name} is \${result}:<br> \` + content });
}
`;
  document.flags["itemacro"] = generateMacroFlags(document, itemMacroText);
  effectConfusionConfusion.changes.push(generateMacroChange("@attributes.spelldc"));
  document.effects.push(effectConfusionConfusion);

  return document;
}
