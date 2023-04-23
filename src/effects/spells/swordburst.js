export function swordBurstEffect(document) {
  document.system.target = {
    value: 5,
    width: null,
    units: "ft",
    type: "creature",
  };
  document.system.range = { value: null, units: "special", long: null };

  return document;
}
