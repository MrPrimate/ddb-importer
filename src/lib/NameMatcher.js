import DICTIONARY from "../dictionary.js";

export default class NameMatcher {

  static getMonsterNames(name) {
    let magicNames = [name, name.toLowerCase()];

    // +2 sword
    let frontPlus = name.match(/^(\+\d*)\s*(.*)/);
    if (frontPlus) {
      magicNames.push(`${frontPlus[2].trim()}, ${frontPlus[1]}`.toLowerCase().trim());
    }

    // sword +2
    let backPlus = name.match(/(.*)\s*(\+\d*)$/);
    if (backPlus) {
      magicNames.push(`${backPlus[1].trim()}, ${backPlus[2]}`.toLowerCase().trim());
    }

    return magicNames;
  }

  static getLooseNames(name, extraNames = []) {
    let looseNames = extraNames;
    looseNames.push(name.toLowerCase());
    let refactNameArray = name.split("(")[0].trim().split(", ");
    refactNameArray.unshift(refactNameArray.pop());
    const refactName = refactNameArray.join(" ").trim();
    looseNames.push(refactName, refactName.toLowerCase());
    looseNames.push(
      refactName
        .replace(/\+\d*\s*/, "")
        .trim()
        .toLowerCase()
    );
    looseNames.push(
      refactName
        .replace(/\+\d*\s*/, "")
        .trim()
        .toLowerCase()
        .replace(/s$/, "")
    );

    let refactNamePlusArray = name
      .replace(/\+\d*\s*/, "")
      .trim()
      .split("(")[0]
      .trim()
      .split(", ");
    refactNamePlusArray.unshift(refactNamePlusArray.pop());
    const refactNamePlus = refactNamePlusArray.join(" ").trim();
    looseNames.push(refactNamePlus.toLowerCase());

    let deconNameArray = name.replace("(", "").replace(")", "").trim().split(",");
    deconNameArray.unshift(deconNameArray.pop());
    const deconName = deconNameArray.join(" ").trim();
    looseNames.push(deconName, deconName.toLowerCase());

    // word smart quotes are the worst
    looseNames.push(name.replace("'", "’").toLowerCase());
    looseNames.push(name.replace("’", "'").toLowerCase());
    looseNames.push(name.replace(/s$/, "").toLowerCase()); // trim s, e.g. crossbow bolt(s)
    looseNames.push(name.replace(",", "").toLowerCase()); // +1 weapons etc
    looseNames.push(`${name} attack`.toLowerCase()); // Claw Attack
    looseNames.push(name.split(",")[0].toLowerCase());

    return looseNames;
  }

  // The monster setting is less vigorous!
  static async looseItemNameMatch(item, items, loose = false, monster = false, magicMatch = false) {
    // first pass is a strict match
    let matchingItem = items.find((matchItem) => {
      let activationMatch = false;
      const alternativeNames = matchItem.flags?.ddbimporter?.dndbeyond?.alternativeNames;
      const extraNames = alternativeNames ? matchItem.flags.ddbimporter.dndbeyond.alternativeNames : [];

      const itemActivationProperty = Object.prototype.hasOwnProperty.call(item.system, "activation");
      const matchItemActivationProperty = Object.prototype.hasOwnProperty.call(item.system, "activation");

      if (itemActivationProperty && item.system?.activation?.type == "") {
        activationMatch = true;
      } else if (matchItemActivationProperty && itemActivationProperty) {
        // I can't remember why I added this. Maybe I was concerned about identical named items with
        // different activation times?
        // maybe I just want to check it exists?
        // causing issues so changed.
        // activationMatch = matchItem.system.activation.type === item.system.activation.type;
        activationMatch = matchItemActivationProperty && itemActivationProperty;
      } else if (!itemActivationProperty) {
        activationMatch = true;
      }

      const nameMatch = item.name === matchItem.name || extraNames.includes(item.name);
      const isMatch = nameMatch && item.type === matchItem.type && activationMatch;
      return isMatch;
    });

    if (!matchingItem && monster) {
      matchingItem = items.find((matchItem) => {
        const monsterNames = NameMatcher.getMonsterNames(matchItem.name);
        const monsterMatch = monsterNames.includes(item.name.toLowerCase())
          && DICTIONARY.types.monster.includes(matchItem.type)
          && DICTIONARY.types.inventory.includes(item.type);
        return monsterMatch;
      });
    }

    if (!matchingItem && magicMatch) {
      // is this an inverse match for updates?
      // if so strip out the non-magic names, we want to match on the magic names
      const magicName = item.name
        .replace(/(.*)\s+(\+\d*)\s*/, "$1, $2")
        .trim()
        .toLowerCase();
      matchingItem = items.find((matchItem) => matchItem.name.trim().toLowerCase() == magicName);
    }

    if (!matchingItem && loose) {
      const looseNames = NameMatcher.getLooseNames(item.name).filter((name) => {
        if (!magicMatch) return true;
        const removeMagicName = name.replace(/\+\d*\s*/, "").trim();
        if (name === removeMagicName) return false;
        return true;
      });
      // lets go loosey goosey on matching equipment, we often get types wrong
      matchingItem = items.find(
        (matchItem) =>
          (looseNames.includes(matchItem.name.toLowerCase())
            || looseNames.includes(matchItem.name.toLowerCase().replace(" armor", "")))
          && DICTIONARY.types.inventory.includes(item.type)
          && DICTIONARY.types.inventory.includes(matchItem.type)
      );

      // super loose name match!
      if (!matchingItem) {
        // still no matching item, lets do a final pass
        matchingItem = items.find((matchItem) =>
          looseNames.includes(matchItem.name.split("(")[0].trim().toLowerCase())
        );
      }
    }
    return matchingItem;
  }
}
