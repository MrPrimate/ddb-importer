import {
  generateCustomChange,
  forceItemEffect,
  effectModules,

} from "./effects.js";
// load item effects
import { cloakOfDisplacementEffect } from "./items/cloakOfDisplacement.js";
import { pearlOfPowerEffect } from "./items/pearlOfPower.js";


export async function midiItemEffects(document) {

  // KNOWN_ISSUE_4_0

  return document;

  // eslint-disable-next-line no-unreachable
  if (foundry.utils.getProperty(document, "flags.ddbimporter.dndbeyond.homebrew")) return document;

  const name = document.flags.ddbimporter?.originalName || document.name;

  if (!effectModules().hasCore) return document;
  // document = forceDocumentEffect(document);

  switch (name) {
    case "Cloak of Displacement": {
      document = await cloakOfDisplacementEffect(document);
      break;
    }
    case "Pearl of Power": {
      document = await pearlOfPowerEffect(document);
      break;
    }
    case "Potion of Speed": {
      // document = hasteEffect(document);
      break;
    }
    case "Spellguard Shield": {
      if (document.effects && document.effects.length > 0) {
        document.effects[0].changes.push(
          generateCustomChange(1, 20, "flags.midi-qol.grants.disadvantage.attack.msak"),
          generateCustomChange(1, 20, "flags.midi-qol.grants.disadvantage.attack.rsak"),
        );
      }
      break;
    }
    // no default
  }

  // eslint-disable-next-line consistent-return
  return forceItemEffect(document);
}
