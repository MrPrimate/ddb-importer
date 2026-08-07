import { utils } from "../../lib/_module";
import * as SpellEnrichers from "./spell/_module";
import DDBEnricherFactoryMixin from "./mixins/DDBEnricherFactoryMixin";
import type DDBEnricherData from "./data/DDBEnricherData";

export default class DDBSpellEnricher extends DDBEnricherFactoryMixin {
  constructor({ activityGenerator, notifier = null }: {
    activityGenerator?: TActivityGenerator;
    notifier?: NotifierV1 | null;
    fallbackEnricher?: string | null;
  } = {}) {
    super({
      activityGenerator,
      effectType: "spell",
      enricherType: "spell",
      notifier,
      ddbActionType: "spell",
    });
  }

  _defaultNameLoader(): DDBEnricherData | null {
    if (!this.name) return null;
    const spellName = utils.pascalCase(this.name);
    const Enricher = (SpellEnrichers as Record<string, EnricherConstructor | undefined>)[spellName];
    if (!Enricher) {
      return null;
    }
    return new Enricher({
      ddbEnricher: this,
    });
  }

  NAME_HINTS_2014: Record<string, string> = {};

  NAME_HINTS: Record<string, string> = {};

  ENRICHERS: Record<string, EnricherConstructor> = {
    "Antipathy/Sympathy": SpellEnrichers.AntipathySympathy,
    "Bigby's Hand": SpellEnrichers.ArcaneHand,
    "Blindness/Deafness": SpellEnrichers.BlindnessDeafness,
    "Dragon's Breath": SpellEnrichers.DragonsBreath,
    "Enlarge/Reduce": SpellEnrichers.EnlargeReduce,
    // "Evard's Black Tentacles": SpellEnrichers.BlackTentacles,
    "Green-Flame Blade": SpellEnrichers.GreenFlameBlade,
    "Hold Monster": SpellEnrichers.HoldThing,
    "Hold Person": SpellEnrichers.HoldThing,
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

  FALLBACK_ENRICHERS: Record<string, EnricherConstructor> = {};
}
