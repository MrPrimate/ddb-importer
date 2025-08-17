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
    const spellName = utils.pascalCase(this.name);
    if (!SpellEnrichers[spellName]) {
      return null;
    }
    return new SpellEnrichers[spellName]({
      ddbEnricher: this,
    });
  }

  NAME_HINTS_2014 = {};

  NAME_HINTS = {};

  ENRICHERS = {
    "Antipathy/Sympathy": SpellEnrichers.AntipathySympathy,
    "Bigby's Hand": SpellEnrichers.ArcaneHand,
    "Blindness/Deafness": SpellEnrichers.BlindnessDeafness,
    "Dragon's Breath": SpellEnrichers.DragonsBreath,
    "Enlarge/Reduce": SpellEnrichers.EnlargeReduce,
    // "Evard's Black Tentacles": SpellEnrichers.BlackTentacles,
    "Green-Flame Blade": SpellEnrichers.GreenFlameBlade,
    "Hunter's Mark": SpellEnrichers.HuntersMark,
    "Jallarzi's Storm of Radiance": SpellEnrichers.JallarzisStormOfRadiance,
    "Melf's Acid Arrow": SpellEnrichers.AcidArrow,
    "Mordenkainen's Faithful Hound": SpellEnrichers.FaithfulHound,
    "Mordenkainen's Sword": SpellEnrichers.ArcaneSword,
    "Otiluke's Resilient Sphere": SpellEnrichers.ResilientSphere,
    "Otto's Irresistible Dance": SpellEnrichers.IrresistibleDance,
    "Tasha's Bubbling Cauldron": SpellEnrichers.TashasBubblingCauldron,
    "Tasha's Caustic Brew": SpellEnrichers.TashasCausticBrew,
    "Tasha's Hideous Laughter": SpellEnrichers.HideousLaughter,
    "Accelerate/Decelerate": SpellEnrichers.AccelerateDecelerate,
  };

}
