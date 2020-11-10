import DICTIONARY from "../../dictionary.js";

export function getSize(data) {
  let size = DICTIONARY.character.actorSizes.find(
    (size) => size.name === data.character.race.size || size.id === data.character.race.sizeId
  );
  return size ? size.value : "med";
}
