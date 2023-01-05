// these are non-compliant monsters that currently don't meet parsing requirements
// these are temporary work arounds till parsing is fixed.
export function specialCases(monster) {
  switch (monster.name) {
    case "Reduced-threat Aboleth":
    case "Aboleth": {
      monster.items.forEach(function(item, index) {
        if (item.name === "Tentacle") {
          this[index].system.formula = item.system.damage.parts[1][0];
          this[index].system.damage.parts.splice(1, 1);
        }
      }, monster.items);
      break;
    }
    case "Dullahan": {
      monster.items.forEach(function(item, index) {
        if (item.name === "Battleaxe") {
          this[index].system.damage.versatile += " + 2d10[necrotic]";
          this[index].system.damage.parts.push(["2d10[necrotic]", "necrotic"]);
        } else if (item.name === "Coordinated Assault") {
          this[index].system.activation.type = "legendary";
          this[index].system.consume = {
            type: "attribute",
            target: "resources.legact.value",
            amount: 1
          };
          this[index].system.activation.cost = 1;
        } else if (item.name.startsWith("Headless Wail")) {
          this[index].system.activation.cost = 2;
          this[index].system.activation.type = "legendary";
          this[index].system.consume = {
            type: "attribute",
            target: "resources.legact.value",
            amount: 2
          };
        }
      }, monster.items);
      break;
    }
    // flumph tendrils have weird syntax for damage over time.
    case "Flumph": {
      monster.items.forEach(function(item, index) {
        if (item.name === "Tendrils") {
          if (item.system.damage.parts.length > 2) {
            this[index].system.formula = item.system.damage.parts[2][0];
            this[index].system.damage.parts.splice(2, 1);
          }
          this[index].system.save.ability = "";
        }
      }, monster.items);
      break;
    }
    case "Hypnos Magen": {
      monster.flags.monsterMunch.spellList.atwill = ["Suggestion"];
      monster.flags.monsterMunch.spellList.material = false;
      monster.system.attributes.spellcasting = "int";
      break;
    }
    case "Nosferatu": {
      monster.items.forEach(function(item, index) {
        if (item.name === "Bite") {
          this[index].system.damage.versatile = `${item.system.damage.parts[0][0]} + ${item.system.damage.parts[2][0]}`;
          this[index].system.damage.parts.splice(2, 1);
        }
      }, monster.items);
      break;
    }
    case "Sephek Kaltro": {
      monster.flags.monsterMunch.spellList.innate = [{ name: "Misty Step", type: "day", value: 3 }];
      monster.flags.monsterMunch.spellList.material = false;
      break;
    }
    // no default
  }

  return monster;
}
