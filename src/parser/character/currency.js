export function getCurrency(data) {
  return {
    pp: data.character.currencies.pp,
    gp: data.character.currencies.gp,
    ep: data.character.currencies.ep,
    sp: data.character.currencies.sp,
    cp: data.character.currencies.cp,
  };
}
