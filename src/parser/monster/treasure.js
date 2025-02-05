import DDBMonster from "../DDBMonster.js";

DDBMonster.prototype._generateTreasure = function _generateTreasure() {

  const result = new Set();
  if (this.source.extraTreasure) {
    for (const treasure of this.source.extraTreasure) {
      const lower = treasure.toLowerCase();
      if (lower === "none") break;
      result.add(lower);
    }
  }

  foundry.utils.setProperty(this.npc, "system.details.treasure.value", Array.from(result));
};
