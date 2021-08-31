import utils from "../../utils.js";
import DICTIONARY from "../../dictionary.js";

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

export function parseSpell(data, character) {
  let spell = {
    type: "spell",
    data: JSON.parse(utils.getTemplate("spell")),
    name: data.definition.name.replace(/’/g, "'"),
    flags: {
      ddbimporter: {
        id: data.id,
        definitionId: data.definition.id,
        entityTypeId: data.entityTypeId,
        dndbeyond: data.flags.ddbimporter.dndbeyond,
        originalName: data.name,
        sources: data.definition.sources,
        tags: data.definition.tags,
      },
    },
  };

  // spell level
  spell.data.level = data.definition.level;

  // get the spell school
  const school = DICTIONARY.spell.schools.find((s) => s.name === data.definition.school.toLowerCase());
  spell.data.school = (school) ? school.id : null;


  /**
   * Gets the necessary spell components VSM + material
   */
  spell.data.components = getComponents(data);

  spell.data.materials = getMaterials(data);

  spell.data.preparation = getSpellPreparationMode(data);

  const updateExisting = data.flags.ddbimporter.generic
    ? game.settings.get("ddb-importer", "munching-policy-update-existing")
    : false;
  data.definition.description = generateTable(spell.name, data.definition.description, updateExisting);

  spell.data.description = {
    value: data.definition.description,
    chat: data.definition.description,
    unidentified: data.definition.type,
  };

  spell.data.source = utils.parseSource(data.definition);

  spell.data.activation = getActivation(data);

  spell.data.duration = getDuration(data);

  spell.data.target = getTarget(data);

  spell.data.range = getRange(data);

  spell.data.actionType = getActionType(data);

  spell.data.damage = getDamage(data, spell);

  spell.data.save = getSave(data);

  spell.data.scaling = getSpellScaling(data);

  spell.data.uses = getUses(data);

  // attach the spell ability id to the spell data so VTT always uses the
  // correct one, useful if multi-classing and spells have different
  // casting abilities
  if (character && character.data.attributes.spellcasting !== data.flags.ddbimporter.dndbeyond.ability) {
    spell.data.ability = data.flags.ddbimporter.dndbeyond.ability;
    if (spell.data.save.scaling == "spell") {
      spell.data.save.scaling = data.flags.ddbimporter.dndbeyond.ability;
    }
  }

  // If using better rolls we set alt to be versatile for spells like
  // Toll The Dead
  spell.flags.betterRolls5e = {
    quickVersatile: {
      altValue: true,
    },
    quickCharges: {
      value: {
        use: true,
        resource: true
      },
      altValue: {
        use: true,
        resource: true
      }
    },
  };

  return spell;
}
