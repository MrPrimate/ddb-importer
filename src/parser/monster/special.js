// these are non-compliant monsters that currently don't meet parsing requirements
// these are temporary work arounds till parsing is fixed.
export function specialCases(monster) {
  switch (monster.name) {
    case "Reduced-threat Aboleth":
    case "Aboleth": {
      monster.items.forEach(function (item, index) {
        if (item.name === "Tentacle") {
          this[index].system.formula = item.system.damage.parts[1][0];
          this[index].system.damage.parts.splice(1, 1);
        }
      }, monster.items);
      break;
    }
    case "Clay Golem": {
      monster.items.forEach(function (item, index) {
        if (item.name.startsWith("Haste")) {
          this[index].system.activation.type = "action";
        }
      }, monster.items);
      break;
    }
    case "Dullahan": {
      monster.items.forEach(function (item, index) {
        if (item.name === "Battleaxe") {
          this[index].system.damage.versatile += " + 2d10[necrotic]";
          this[index].system.damage.parts.push(["2d10[necrotic]", "necrotic"]);
        } else if (item.name === "Coordinated Assault") {
          this[index].system.activation.type = "legendary";
          this[index].system.consume = {
            type: "attribute",
            target: "resources.legact.value",
            amount: 1,
          };
          this[index].system.activation.cost = 1;
        } else if (item.name.startsWith("Headless Wail")) {
          this[index].system.activation.cost = 2;
          this[index].system.activation.type = "legendary";
          this[index].system.consume = {
            type: "attribute",
            target: "resources.legact.value",
            amount: 2,
          };
        }
      }, monster.items);
      break;
    }
    case "Duergar Warlord": {
      monster.items.forEach(function (item, index) {
        if (item.name === "Psychic-Attuned Hammer") {
          this[index].system.damage.parts.push(["1d10[psychic]", "psychic"]);
        }
      }, monster.items);
      break;
    }
    case "Autumn Eladrin (Legacy)":
    case "Autumn Eladrin": {
      monster.items.forEach(function (item, index) {
        if (item.name.startsWith("Cure Wounds")) {
          this[index].system.damage.parts[0][0] = "5d8[healing] + @mod";
        }
      }, monster.items);
      break;
    }
    // flumph tendrils have weird syntax for damage over time.
    case "Flumph": {
      monster.items.forEach(function (item, index) {
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
    case "Living Blade of Disaster": {
      monster.items.forEach(function (item, index) {
        if (item.name === "Force Blade") {
          this[index].system.critical.threshold = 18;
          this[index].system.critical.damage = "8d12";
          this[index].system.damage.parts.splice(1, 1);

        } else if (item.name === "Preemptive Strike" && game.modules.get("midi-qol")?.active) {
          this[index].system.activation.type = "reactionmanual";
        }
      }, monster.items);
      break;
    }
    case "Nilbog (Legacy)":
    case "Nilbog": {
      monster.items.forEach(function (item, index) {
        if (item.name === "Reversal of Fortune") {
          this[index].system.actionType = "heal";
        }
      }, monster.items);
      break;
    }
    case "Nosferatu": {
      monster.items.forEach(function (item, index) {
        if (item.name === "Bite") {
          this[index].system.damage.versatile = `${item.system.damage.parts[0][0]} + ${item.system.damage.parts[2][0]}`;
          this[index].system.damage.parts.splice(2, 1);
        }
      }, monster.items);
      break;
    }
    // no default
  }

  switch (monster.system.details.type.value) {
    case "dragon": {
      monster.items.forEach(function (item, index) {
        if (item.name === "Frightful Presence") {
          this[index].system.duration = {
            value: "1",
            units: "minute",
          };
          this[index].system.range.value = 120;
          this[index].system.range.units = "self";
          this[index].system.target = {
            value: 120,
            width: null,
            units: "",
            type: "enemy",
          };
        }
      }, monster.items);
      break;
    }
    // no default
  }

  monster.items.forEach(function (item, index) {
    if (item.name.startsWith("Sneak Attack")) {
      this[index].system.uses = {
        "value": null,
        "max": "",
        "per": null,
        "recovery": ""
      };
    } else if (item.name.startsWith("Soothing Word")) {
      this[index].system.target = {
        value: 1,
        width: null,
        units: "",
        type: "creature",
      };
    }
  }, monster.items);

  const magicWeapons = monster.items.some((item) => item.name === "Magic Weapons");
  if (magicWeapons) {
    monster.items.forEach(function (item, index) {
      if (item.type === "weapon") {
        this[index].system.properties.mgc = true;
      }
    }, monster.items);
  }

  return monster;
}
