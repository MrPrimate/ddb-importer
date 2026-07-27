import { addStatusEffectChange, forceItemEffect } from "./effects";

import { skeletalJuggernautEffects } from "./monsterFeatures/skeletalJuggernautEffects";
import { venomTrollEffects } from "./monsterFeatures/venomTroll";
import { quasitEffects } from "./monsterFeatures/quasit";
import { deathlyChoirEffect } from "./monsterFeatures/deathlyChoir";
import { strahdZombieEffects } from "./monsterFeatures/strahdZombie";
import { giantSpiderEffects } from "./monsterFeatures/giantSpider";
import AutoEffects from "../parser/enrichers/effects/AutoEffects";
import type DDBMonster from "../parser/DDBMonster";

export function baseMonsterFeatureEffect(document: any, label: string,
  { transfer = false, disabled = false, showIcon }: IDDBEffectOptions = {},
): TInitializedEffect {
  return AutoEffects.MonsterFeatureEffect(document, label, { transfer, disabled, showIcon }) as TInitializedEffect;
}


export async function monsterFeatureEffectAdjustment(ddbMonster: DDBMonster, addMidiEffects = false) {
  let npc: I5eMonsterData = foundry.utils.duplicate(ddbMonster.npc) as unknown as I5eMonsterData;

  if (!npc.effects) npc.effects = [];

  if (!addMidiEffects) return npc;

  switch (npc.name) {
    case "Carrion Crawler":
    case "Reduced-threat Carrion Crawler": {
      npc.items.forEach(function(this: I5eMonsterItem[], item: any, index: number) {
        if (item.name === "Tentacles") {
          addStatusEffectChange({ effect: this[index].effects![0], statusName: "Paralyzed" });
          this[index] = forceItemEffect(this[index]);
        }
      }, npc.items);
      break;
    }
    case "Giant Spider": {
      npc = giantSpiderEffects(npc);
      break;
    }
    case "Quasit": {
      npc = await quasitEffects(npc);
      break;
    }
    case "Rahadin": {
      for (const [index, item] of npc.items.entries()) {
        if (item.name === "Deathly Choir") {
          npc.items[index] = await deathlyChoirEffect(item);
        }
      }
      break;
    }
    case "Skeletal Juggernaut": {
      npc = await skeletalJuggernautEffects(npc);
      break;
    }
    case "Strahd Zombie": {
      npc = await strahdZombieEffects(npc);
      break;
    }
    case "Venom Troll": {
      npc = await venomTrollEffects(npc);
      break;
    }
    // no default
  }

  return npc;
}
