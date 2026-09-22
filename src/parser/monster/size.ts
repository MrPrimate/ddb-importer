import { DICTIONARY } from "../../config/_module";
import { logger } from "../../lib/_module";
import DDBMonster from "../DDBMonster";
import ChangeHelper from "../enrichers/effects/ChangeHelper";
import type { IDDBActorSizeData } from "../../config/dictionary/actor/sizes";

/** DDB represents size choices as one configured name, such as "Medium or Small". */
function getSizeOptions(sizeId: number): IDDBActorSizeData[] {
  const name = CONFIG.DDB.creatureSizes.find((size) => size.id === sizeId)?.name;
  const names = new Set(name?.split(/,|\bor\b/i).map((part) => part.trim().toLowerCase()) ?? []);
  return DICTIONARY.sizes.filter((size) => names.has(size.name.toLowerCase()));
}

DDBMonster.prototype.getSizeFromId = function getSizeFromId(this: DDBMonster, sizeId: number): IDDBActorSizeData {
  const size = CONFIG.DDB.creatureSizes.find((s) => s.id === sizeId)?.name;
  const sizeData = DICTIONARY.sizes.find((s) => size === s.name);

  if (!sizeData) {
    // Combined sizes retain the historical Medium default; their other sizes are optional effects.
    if (getSizeOptions(sizeId).length < 2) {
      logger.warn(`No foundry size found for "${size}" (${this.name}), using medium`);
    }
    return { name: "Medium", value: "med", size: 1, id: sizeId, scale: 1 };
  }
  return sizeData;
};

DDBMonster.prototype._generateSize = function _generateSize (this: DDBMonster) {
  const sizeData = this.getSizeFromId(this.source.sizeId);

  this.npc.system.traits.size = sizeData.value;
  this.npc.prototypeToken.width = sizeData.size;
  this.npc.prototypeToken.height = sizeData.size;
  this.npc.prototypeToken.texture.scaleX = sizeData.scale;
  this.npc.prototypeToken.texture.scaleY = sizeData.scale;

  const sizeOptions = getSizeOptions(this.source.sizeId);
  if (sizeOptions.length < 2) return;

  this.npc.effects ??= [];
  for (const size of sizeOptions.filter((option) => option.value !== sizeData.value)) {
    this.npc.effects.push({
      _id: foundry.utils.randomID(),
      name: `Size: ${size.name}`,
      type: "base",
      img: "icons/magic/control/silhouette-grow-shrink-tan.webp",
      disabled: true,
      transfer: false,
      flags: { ddbimporter: { disabled: true } },
      // A size choice is a baseline, so form-changing effects at priority 20 still take precedence.
      changes: [ChangeHelper.overrideChange(size.value, 10, "system.traits.size")],
    });
  }

};
