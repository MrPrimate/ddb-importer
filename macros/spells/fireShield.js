const lastArg = args[args.length - 1];
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const targetActor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;
const tokenFromUuid = await fromUuid(lastArg.tokenUuid);
const targetToken = tokenFromUuid.data || token;

function getShieldName(type) {
  return `Summoned Fire Shield (${type})`;
}

function createShieldItem(type) {
  const damageType = type == "warm" ? "fire" : "cold";
  const img = type === "warm"
    ? "icons/magic/defensive/shield-barrier-flaming-pentagon-red.webp"
    : "icons/magic/defensive/shield-barrier-flaming-pentagon-blue.webp";
  const item = {
    name: getShieldName(type),
    type: "weapon",
    img: img,
    data: {
      source: "Fire Shield Spell",
      activation: {
        type: "special",
        cost: 0,
        condition: "whenever a creature within 5 feet of you hits you with a melee Attack",
      },
      actionType: "other",
      equipped: true,
      damage: {
        parts: [[`2d8[${damageType}]`, damageType]],
      },
      weaponType: "natural",
    },
    effects: [],
  };
  return item;
}

async function createFireShield(type) {
  const resistanceType = type == "warm" ? "cold" : "fire";
  const item = createShieldItem(type);
  const effect = targetActor.effects.find((e) => e.label === lastArg.efData.label);
  const changes = [
    {
      key: "system.traits.dr.value",
      mode: CONST.ACTIVE_EFFECT_MODES.ADD,
      priority: 30,
      value: resistanceType,
    },
  ];
  await effect.update({ changes: changes.concat(effect.changes) });
  await targetActor.createEmbeddedDocuments("Item", [item]);
  await DAE.setFlag(targetActor, "fireShieldSpell", type);
  ChatMessage.create({ content: `${targetToken.name} gains resistance to ${resistanceType}` });
  ChatMessage.create({ content: `${targetToken.name} has Fire Shield item added to inventory ` });
}

if (args[0] === "on") {
  new Dialog({
    title: "Warm or Cold Shield",
    content: "<p>Choose a shield type</p>",
    buttons: {
      warm: {
        label: "Warm",
        callback: async () => await createFireShield("warm"),
      },
      cold: {
        label: "Cold",
        callback: async () => await createFireShield("cold"),
      },
    },
  }).render(true);
}

if (args[0] === "off") {
  const flag = await DAE.getFlag(targetActor, "fireShieldSpell");
  const item = targetActor.items.getName(getShieldName(flag));
  ChatMessage.create({ content: "Fire Shield expires on " + targetToken.name });
  await DAE.unsetFlag(targetActor, "fireShieldSpell");
  await targetActor.deleteEmbeddedDocuments("Item", [item.id]);
}
