import DDBCharacter from "../DDBCharacter.js";

DDBCharacter.prototype._generateCurrency = function _generateCurrency() {
  this.raw.character.system.currency = {
    pp: this.source.ddb.character.currencies.pp,
    gp: this.source.ddb.character.currencies.gp,
    ep: this.source.ddb.character.currencies.ep,
    sp: this.source.ddb.character.currencies.sp,
    cp: this.source.ddb.character.currencies.cp,
  };

  this._currency = foundry.utils.deepClone(this.raw.character.system.currency);
};
