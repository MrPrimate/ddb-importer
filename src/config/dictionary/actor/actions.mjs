export const ACTIONS = {
  activationTypes: [
    { id: 0, value: "none" },
    { id: 1, value: "action" },
    { id: 2, value: "action" },
    { id: 3, value: "bonus" },
    { id: 4, value: "reaction" },
    { id: 5, value: "action" },
    { id: 6, value: "minute" },
    { id: 7, value: "hour" },
    { id: 8, value: "special" },
  ],
  attackTypes: [
    //  natural improv
    // { attackSubtype: 1, value: "" },
    { attackSubtype: 2, value: "natural" },
    { attackSubtype: 3, value: "simpleM" }, // unarmed
  ],
  damageType: [
    { name: "bludgeoning", id: 1 },
    { name: "piercing", id: 2 },
    { name: "slashing", id: 3 },
    { name: "necrotic", id: 4 },
    { name: "acid", id: 5 },
    { name: "cold", id: 6 },
    { name: "fire", id: 7 },
    { name: "lightning", id: 8 },
    { name: "thunder", id: 9 },
    { name: "poison", id: 10 },
    { name: "psychic", id: 11 },
    { name: "radiant", id: 12 },
    { name: "force", id: 13 },
    { name: null, id: null },
  ],
  aoeType: [
    { id: 1, value: "cone" },
    { id: 2, value: "cube" },
    { id: 3, value: "cylinder" },
    { id: 4, value: "line" },
    { id: 5, value: "sphere" },
    { id: 9, value: "square" },
    { id: 13, value: "square" },
    { id: 14, value: "radius" }, // emanation
    // presumably others here too! add when found
  ],
};
