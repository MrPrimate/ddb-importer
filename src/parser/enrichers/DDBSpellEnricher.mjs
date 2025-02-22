import { utils } from "../../lib/_module.mjs";
import { SpellEnrichers } from "./_module.mjs";
import DDBEnricherFactoryMixin from "./mixins/DDBEnricherFactoryMixin.mjs";

export default class DDBSpellEnricher extends DDBEnricherFactoryMixin {
  constructor({ activityGenerator, notifier = null } = {}) {
    super({
      activityGenerator,
      effectType: "spell",
      enricherType: "spell",
      notifier,
      ddbActionType: "spell",
    });
  }

  _defaultNameLoader() {
    const spellName = utils.camelCase(this.name);
    if (!SpellEnrichers[spellName]) {
      return null;
    }
    return new SpellEnrichers[spellName]({
      ddbEnricher: this,
    });
  }

  NAME_HINTS_2014 = {};

  NAME_HINTS = {
    "Bigby's Hand": "Arcane Hand",
    "Melf's Acid Arrow": "Acid Arrow",
    "Mordenkainen's Sword": "Arcane Sword",
    "Mordenkainen's Faithful Hound": "Faithful Hound",
    "Evard's Black Tentacles": "Black Tentacles",
    "Otiluke's Resilient Sphere": "Resilient Sphere",
    "Otto's Irresistible Dance": "Irresistible Dance",
    "Tasha's Hideous Laughter": "Hideous Laughter",
  };

  ENRICHERS = {
    "Dragon's Breath": SpellEnrichers.DragonsBreath,
    "Enlarge/Reduce": SpellEnrichers.EnlargeReduce,
    "Green-Flame Blade": SpellEnrichers.GreenFlameBlade,
    "Hunter's Mark": SpellEnrichers.HuntersMark,
    "Jallarzi's Storm of Radiance": SpellEnrichers.JallarzisStormOfRadiance,
    "Tasha's Bubbling Cauldron": SpellEnrichers.TashasBubblingCauldron,
    "Tasha's Caustic Brew": SpellEnrichers.TashasCausticBrew,
    "Blindness/Deafness": SpellEnrichers.BlindnessDeafness,
    "Antipathy/Sympathy": SpellEnrichers.AntipathySympathy,
  };

}
