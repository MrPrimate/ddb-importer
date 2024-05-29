function pluralToSingular(plural) {
  // Define common English plural suffixes and their corresponding singular forms
  const pluralSuffixes = [
    { suffix: 's', singular: '' },
    { suffix: 'es', singular: '' },
    { suffix: 'ies', singular: 'y' },
  ];

  // Iterate through the suffixes and attempt to remove them from the plural word
  for (const suffixInfo of pluralSuffixes) {
    const { suffix, singular } = suffixInfo;
    if (plural.endsWith(suffix)) {
      return plural.slice(0, -suffix.length) + singular;
    }
  }

  // If no common suffix is found, return the input as is
  return plural;
}
if (rolledItem.name === "Multiattack") {
    let desc = rolledItem.system.description.value;
    desc = desc.replaceAll(" one ", " 1 ");
    desc = desc.replaceAll(" once ", " 1 ");
    desc = desc.replaceAll(" two times ", " 2 ");
    desc = desc.replaceAll(" two ", " 2 ");
    desc = desc.replaceAll(" twice ", " 2 ");
    desc = desc.replaceAll(" three times ", " 3 ");
    desc = desc.replaceAll(" three ", " 3 ");
    desc = desc.replaceAll(" thrice ", " 3 ");
    desc = desc.replaceAll(" four times ", " 4 ")
    desc = desc.replaceAll(" four ", " 4 ");
    desc = desc.replaceAll(" five ", " 5 ");
    desc = desc.replaceAll(" five times ", " 5 ");


    matches = desc.matchAll(/(\d+)\s+with\s+its\s+([^\d]+)/g)
    // const regex = /.*(\d+)\s*([a-zA-Z]+)\s*attacks?/;
    const regex = /.*(\d+)\s*(\b[a-zA-Z]+\b(?:\s+\b[a-zA-Z]+\b){0,3})\s*attacks?/i;

    let match = desc.match(regex);
    if (match) {
      matches = [["", match[1], match[2]]];
    }
    for (let match of matches) {
        let count = match[1].replace(",").trim();
        let attack = match[2].replace(/,.*/, "").replace(" and ", "").trim();
        attack = attack.charAt(0).toUpperCase() + attack.slice(1);
        attack = attack.replace(/\..*/, "").replace(/,.*/,"");
        attack = pluralToSingular(attack);
        let attackItem = actor.items.getName(attack);
        if (!attackItem) {
          console.error("Could not find item ", attack);
          continue;
        }
        let numericCount = Number(count);
        for (let i = 0; i < numericCount; i++) {
          await MidiQOL.completeItemUse(attackItem, {}, {});
          await new Promise(resolve => setTimeout(resolve, game.settings.get("midi-qol", "DebounceInterval")))
        }
    }

}
return true;
