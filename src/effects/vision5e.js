import { effectModules } from "./effects.js";
import { baseSpellEffect } from "./specialSpells";


const VISION_EFFECTS = {
  "Detect Evil and Good": {
    effectName: "Detect Evil and Good",
    type: "spell",
    transfer: false,
  },
  "Echolocation": {
    effectName: "Echolocation",
    type: "feat",
    transfer: true,
  },
  "Detect Thoughts": {
    effectName: "Detect Thoughts",
    type: "spell",
    transfer: false,
  },
  "Detect Magic": {
    effectName: "Detect Magic",
    type: "spell",
    transfer: false,
  },
  "Detect Poison and Disease": {
    effectName: "Detect Poison and Disease",
    type: "spell",
    transfer: false,
  },
  "Devil's Sight": {
    effectName: "Devil's Sight",
    type: "feat",
    transfer: true,
  },
  "See Invisibility": {
    effectName: "See Invisibility",
    type: "spell",
    transfer: false,
  },
  "Ghostly Gaze": {
    effectName: "Ghostly Gaze",
    type: "feat",
    transfer: false,
  },
};

export function addVision5eStub(document) {
  if (!document.effects) document.effects = [];

  const name = document.flags.ddbimporter?.originalName ?? document.name;

  // if document name in Vision effects then add effect
  if (VISION_EFFECTS[name] && document.type === VISION_EFFECTS[name].type) {
    const effect = baseSpellEffect(document, VISION_EFFECTS[name].effectName);
    effect.transfer = VISION_EFFECTS[name].transfer;
    document.effects.push(effect);
  }
  return document;
}

export async function addVision5eStubs(documents) {
  // check that we can gen effects
  const deps = effectModules();
  if (!deps.vision5eInstalled) return documents;

  for (let document of documents) {
    document = addVision5eStub(document);
  }

  return documents;
}
