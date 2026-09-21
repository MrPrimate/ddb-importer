import DDBEnricherData from "../../data/DDBEnricherData";
import { regionPlacer } from "../../data/RegionBuilders";
import { linkMonsterSummons, monsterSummon } from "../_MonsterSummons";

// DDB's text gives the summoned rotweaver no Hunting Horn; dnd5e cannot take an item off a summon
const BLIGHT_SPAWN = [{ name: "Rotweaver", label: "Rotweaver (lacks a Hunting Horn)", ddbId: 5559940 }];

/**
 * DDB sets the three effects of this ritual as bold-only paragraphs under it, so they are
 * options of one feature. The parser builds Frenzying Spores' save; Devouring Fungus rolls
 * nothing, so it left no activity. The fungus is a 60-foot radius centred on the keeper that
 * stays where it sprouted for a minute: difficult terrain, and a creature is Poisoned while
 * inside it. The keeper is immune to Poisoned, so applying it to everything inside is harmless
 * to its owner. Blight Spawn summons a rotweaver out of the monster compendium, as the
 * keeper's ally, for a minute.
 */
export default class RottingRitual extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      name: "Frenzying Spores",
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      monsterSummon("Blight Spawn", {
        creatures: BLIGHT_SPAWN,
        activationType: "special",
        activationCondition: "Vanishes after 1 minute, or when it or the keeper dies",
        range: "30",
        duration: { value: "1", units: "minute" },
      }),
      regionPlacer("Devouring Fungus", {
        template: { type: "radius", size: "60", stationary: true },
        // the ritual is part of the keeper's Multiattack, as the parsed save is
        activationType: "special",
        activationCondition: "Lasts until the keeper uses this effect again or dies",
        duration: { value: "1", units: "minute" },
        behaviors: [
          DDBEnricherData.BehaviorHelper.difficultTerrain({ types: ["plants"] }),
          DDBEnricherData.BehaviorHelper.applyEffect({ effects: DDBEnricherData.SRDEffects.condition("poisoned") }),
        ],
      }),
    ];
  }

  // the placer sits beside the parsed save, not instead of it
  override get keepParsedActivities(): boolean {
    return true;
  }

  override async cleanup(): Promise<void> {
    await linkMonsterSummons(this.data, BLIGHT_SPAWN, this.is2024);
  }

}
