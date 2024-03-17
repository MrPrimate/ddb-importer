import DICTIONARY from "../dictionary.js";
import logger from "../logger.js";

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

  static getLooseNames(name, extraNames = [], removeMagic = true) {
    let looseNames = new Set(extraNames.map((name) => name.toLowerCase()));
    looseNames.add(name.toLowerCase());
    looseNames.add(name.replace(",", "").toLowerCase());
    let refactNameArray = name.split("(")[0].trim().split(", ");
    refactNameArray.unshift(refactNameArray.pop());
    const refactName = refactNameArray.join(" ").trim();
    looseNames.add(refactName.toLowerCase());

    let deconNameArray = name.replace("(", "").replace(")", "").trim().split(",");
    deconNameArray.unshift(deconNameArray.pop());
    const deconName = deconNameArray.join(" ").trim();
    looseNames.add(deconName.toLowerCase());

    // word smart quotes are the worst
    looseNames.add(name.replace("'", "’").toLowerCase());
    looseNames.add(name.replace("’", "'").toLowerCase());
    looseNames.add(name.replace(" armor", "").toLowerCase());
    looseNames.add(name.replace(/s$/, "").toLowerCase()); // trim s, e.g. crossbow bolt(s)
    looseNames.add(name.replace(",", "").toLowerCase()); // +1 weapons etc
    looseNames.add(`${name} attack`.toLowerCase()); // Claw Attack
    looseNames.add(name.replace(" (1 day)", "").toLowerCase());
    looseNames.add(name.replace(" (10-foot)", "").toLowerCase());
    looseNames.add(name.replace(" (bag of 20)", "").toLowerCase());
    looseNames.add(name.replace(" (bag of 1000)", "").toLowerCase());
    looseNames.add(name.replace(" (per day)", "").toLowerCase());
    looseNames.add(name.replace("(10 foot)", "(10-foot)").toLowerCase());
    looseNames.add(name.replace("(10-foot)", "(10 foot)").toLowerCase());
    looseNames.add(name.replace("(0 - Cantrip)", "Cantrip").toLowerCase());
    looseNames.add(name.replace(/\((\d..) Level\)/, "$1 Level").toLowerCase());

    if (removeMagic || (!removeMagic && name.split(",")[0].length > 1 && !(/\+\d$/).test(name.trim()))) {
      looseNames.add(name.split(",")[0].toLowerCase());
    }

    if (removeMagic) {
      let refactNamePlusArray = name
        .replace(/\+\d*\s*/, "")
        .trim()
        .split("(")[0]
        .trim()
        .split(", ");
      refactNamePlusArray.unshift(refactNamePlusArray.pop());
      const refactNamePlus = refactNamePlusArray.join(" ").trim();
      looseNames.add(refactNamePlus.toLowerCase());
      looseNames.add(
        refactName
          .replace(/\+\d*\s*/, "")
          .trim()
          .toLowerCase()
      );
      looseNames.add(
        refactName
          .replace(/\+\d*\s*/, "")
          .trim()
          .toLowerCase()
          .replace(/s$/, "")
      );
    }

    return Array.from(looseNames);
  }

  // The monster setting is less vigorous!
  static looseItemNameMatch(item, items, loose = false, monster = false, magicMatch = false) {
    // first pass is a strict match
    let matchingItem = items.find((matchItem) => {
      let activationMatch = false;
      const extraNames = foundry.utils.getProperty(matchItem, "flags.ddbimporter.dndbeyond.alternativeNames") ?? [];

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
      const magicName2 = item.name
        .replace(/(.*)\s+(\+\d*)\s*/, "$2 $1")
        .trim()
        .toLowerCase();
      matchingItem = items.find((matchItem) => [magicName, magicName2].includes(matchItem.name.trim().toLowerCase()));
    }

    if (!matchingItem && loose) {
      const extraNames = foundry.utils.getProperty(item, "flags.ddbimporter.dndbeyond.alternativeNames") ?? [];
      const looseNames = NameMatcher.getLooseNames(item.name, extraNames, !magicMatch);
      // console.warn("loose names", looseNames);
      for (const looseName of looseNames) {
        matchingItem = items.find((matchItem) => {
          const looseItemMatch = (looseName === matchItem.name.toLowerCase()
            || looseName === matchItem.name.toLowerCase().replace(" armor", ""))
            && DICTIONARY.types.inventory.includes(item.type)
            && DICTIONARY.types.inventory.includes(matchItem.type);
          return looseItemMatch;
        });
        if (matchingItem) {
          logger.debug(`Broke on ${looseName}`, matchingItem);
          break;
        }
      }

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
