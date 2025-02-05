import DDBMonster from "../DDBMonster.js";

DDBMonster.prototype._generateTreasure = function _generateTreasure() {

  const result = new Set();
  // console.warn("extraTreasure", { treasure: this.source.extraTreasure });
  if (this.source.extraTreasure) {
    const lower = this.source.extraTreasure.toLowerCase();
    if (lower !== "none") result.add(lower);
  }

  foundry.utils.setProperty(this.npc, "system.details.treasure.value", Array.from(result));
};
