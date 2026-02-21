import { addStatusEffectChange, forceItemEffect } from "./effects";

// import { generateTauntEffect } from "./monsterFeatures/taunt";
import { skeletalJuggernautEffects } from "./monsterFeatures/skeletalJuggernautEffects";
import { venomTrollEffects } from "./monsterFeatures/venomTroll";
import { quasitEffects } from "./monsterFeatures/quasit";
import { deathlyChoirEffect } from "./monsterFeatures/deathlyChoir";
import { strahdZombieEffects } from "./monsterFeatures/strahdZombie";
// import { beholderEyeRaysEffect } from "./monsterFeatures/beholderEyeRays";
import { giantSpiderEffects } from "./monsterFeatures/giantSpider";
// import { beholderEyeRayLegendaryEffect } from "./monsterFeatures/beholderEyeRayLegendary";
import AutoEffects from "../parser/enrichers/effects/AutoEffects";

export function baseMonsterFeatureEffect(document, label,
  { transfer = false, disabled = false, showIcon = null } = {},
) {
  return AutoEffects.MonsterFeatureEffect(document, label, { transfer, disabled, showIcon });
}

 
export async function monsterFeatureEffectAdjustment(ddbMonster, addMidiEffects = false) {
  let npc = foundry.utils.duplicate(ddbMonster.npc);

  if (!npc.effects) npc.effects = [];

  if (!addMidiEffects) return npc;

  switch (npc.name) {
    // case "Bard": {
    //   npc.items.forEach((item) => {
    //     if (item.name === "Taunt") {
    //       item = generateTauntEffect(item);
    //     }
    //   });
    //   break;
    // }
    // case "Beholder": {
    //   for (let [index, item] of npc.items.entries()) {
    //     if (item.name === "Eye Rays") {
    //       npc.items[index] = await beholderEyeRaysEffect(item, 3, 120);
    //     } else if (item.name === "Eye Ray") {
    //       npc.items[index] = await beholderEyeRayLegendaryEffect(item, 3, 120);
    //     }
    //   }
    //   break;
    // }
    // case "Beholder Zombie": {
    //   for (let [index, item] of npc.items.entries()) {
    //     if (item.name === "Eye Ray") {
    //       npc.items[index] = await beholderEyeRaysEffect(item, 1, 60);
    //     }
    //   }
    //   break;
    // }
    case "Carrion Crawler":
    case "Reduced-threat Carrion Crawler": {
      npc.items.forEach(function(item, index) {
        if (item.name === "Tentacles") {
          addStatusEffectChange({ effect: this[index].effects[0], statusName: "Paralyzed" });
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
    // case "Spectator": {
    //   for (let [index, item] of npc.items.entries()) {
    //     if (item.name === "Eye Rays") {
    //       npc.items[index] = await beholderEyeRaysEffect(item, 2, 90);
    //     }
    //   }
    //   break;
    // }
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
