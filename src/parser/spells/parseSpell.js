import utils from "../../lib/utils.js";
import DICTIONARY from "../../dictionary.js";
import DDBHelper from "../../lib/DDBHelper.js";

// Import parsing functions
import { getMaterials, getComponents } from "./components.js";
import { getSpellPreparationMode } from "./prepartion.js";
import { getUses } from "./uses.js";
import { getActivation } from "./activation.js";
import { getDuration } from "./duration.js";
import { getTarget } from "./target.js";
import { getRange } from "./range.js";
import { getActionType } from "./action.js";
import { getDamage } from "./damage.js";
import { getSave } from "./save.js";
import { getSpellScaling } from "./scaling.js";
import { generateTable } from "../../muncher/table.js";
import { spellEffectAdjustment } from "../../effects/specialSpells.js";
import { getName } from "./name.js";
import { parseTags } from "../../lib/DDBReferenceLinker.js";

export async function parseSpell(data, character) {
  let spell = {
    type: "spell",
    system: utils.getTemplate("spell"),
    name: getName(data, character),
    flags: {
      ddbimporter: {
        id: data.id,
        definitionId: data.definition.id,
        entityTypeId: data.entityTypeId,
        dndbeyond: data.flags.ddbimporter.dndbeyond,
        originalName: utils.nameString(data.definition.name),
        sources: data.definition.sources,
        tags: data.definition.tags,
        version: CONFIG.DDBI.version,
      },
      "midi-qol": {
        removeAttackDamageButtons: "default",
      },
      midiProperties: {
        confirmTargets: "default",
        magicdam: true,
        magiceffect: true,
      },
      // "spellbook-assistant-manager": data.flags["spellbook-assistant-manager"],
      "spell-class-filter-for-5e": data.flags["spell-class-filter-for-5e"],
      "tidy5e-sheet-kgar": data.flags["tidy5e-sheet-kgar"],
    },
  };

  const isGeneric = foundry.utils.getProperty(data, "flags.ddbimporter.generic");
  const addSpellEffects = isGeneric
    ? game.settings.get("ddb-importer", "munching-policy-add-spell-effects")
    : game.settings.get("ddb-importer", "character-update-policy-add-spell-effects");
  foundry.utils.setProperty(data, "flags.ddbimporter.addSpellEffects", addSpellEffects);

  // spell level
  spell.system.level = data.definition.level;

  // get the spell school
  const school = DICTIONARY.spell.schools.find((s) => s.name === data.definition.school.toLowerCase());
  spell.system.school = (school) ? school.id : null;

  /**
   * Gets the necessary spell components VSM + material
   */
  spell.system.properties = getComponents(data)?.properties ?? [];
  spell.system.materials = getMaterials(data);
  spell.system.preparation = getSpellPreparationMode(data);

  const updateExisting = data.flags.ddbimporter.generic
    ? game.settings.get("ddb-importer", "munching-policy-update-existing")
    : false;
  // eslint-disable-next-line require-atomic-updates
  data.definition.description = await generateTable(spell.name, data.definition.description, updateExisting);

  spell.system.description = {
    value: parseTags(data.definition.description),
    chat: "",
    // unidentified: data.definition.type,
  };

  spell.system.source = DDBHelper.parseSource(data.definition);
  spell.system.activation = getActivation(data);
  spell.system.duration = getDuration(data);
  spell.system.target = getTarget(data);
  spell.system.range = getRange(data);
  spell.system.actionType = getActionType(data);
  const [damage, chatFlavor] = getDamage(data, spell);
  spell.system.damage = damage;
  spell.system.chatFlavor = chatFlavor;
  spell.system.save = getSave(data);
  spell.system.scaling = getSpellScaling(data);
  spell.system.uses = getUses(data, character);
  spell.system.consume.target = "";

  // attach the spell ability id to the spell data so VTT always uses the
  // correct one, useful if multi-classing and spells have different
  // casting abilities
  if (character && character.system.attributes.spellcasting !== data.flags.ddbimporter.dndbeyond.ability) {
    spell.system.ability = data.flags.ddbimporter.dndbeyond.ability;
    if (spell.system.save.scaling == "spell") {
      spell.system.save.scaling = data.flags.ddbimporter.dndbeyond.ability;
    }
  }
  if (spell.system.ability === null) spell.system.ability = "";

  await spellEffectAdjustment(spell, addSpellEffects);
  foundry.utils.setProperty(spell, "flags.ddbimporter.effectsApplied", true);

  return spell;
}
