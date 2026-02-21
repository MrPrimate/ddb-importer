export const WEAPONS = {
  weaponRange: [
    { attackType: 1, value: "M" },
    { attackType: 2, value: "R" },
    { attackType: null, value: "R" },
  ],
  weaponType: [
    { categoryId: 1, value: "simple" },
    { categoryId: 2, value: "martial" },
    { categoryId: 3, value: "martial" }, // this is not 100% correct. a martialF for "Martial Firearms" would be better
    { categoryId: 0, value: "simple" }, // this is totally incorrect, this is of type ammunition
  ],
  properties: [
    { name: "Adamantine", value: "ada" },
    { name: "Ammunition (Firearms)", value: "fir" },
    { name: "Ammunition", value: "amm" },
    { name: "Finesse", value: "fin" },
    { name: "Firearm", value: "fir" },
    { name: "Focus", value: "foc" },
    { name: "Heavy", value: "hvy" },
    { name: "Light", value: "lgt" },
    { name: "Loading", value: "lod" },
    { name: "Magical", value: "mgc" },
    { name: "Reach", value: "rch" },
    { name: "Reload", value: "rel" },
    { name: "Returning", value: "ret" },
    { name: "Silvered", value: "sil" },
    { name: "Special", value: "spc" },
    { name: "Thrown", value: "thr" },
    { name: "Two-Handed", value: "two" },
    { name: "Versatile", value: "ver" },
    // { name: "Range", value: "fir" },
  ],
};
