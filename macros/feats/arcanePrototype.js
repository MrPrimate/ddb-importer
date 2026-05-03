// Maverick Artificer "Arcane Prototype" macro.
// Pick a spell from the Artificer/Cleric/Wizard lists, spend Arcane Charges
// equal to the imbued level, and drop a one-shot Arcane Prototype consumable
// onto the actor with a Cast activity wired to that spell.

async function arcanePrototype(actor, feature) {
  const artificerLevels = actor.classes?.artificer?.system?.levels ?? 0;
  if (artificerLevels < 3) {
    ui.notifications.warn("Arcane Prototype requires Artificer level 3+.");
    return;
  }

  const tiers = [
    { lvl: 3, maxSpell: 1, maxCharges: 1, maxPrototypes: 1 },
    { lvl: 5, maxSpell: 2, maxCharges: 3, maxPrototypes: 2 },
    { lvl: 9, maxSpell: 3, maxCharges: 5, maxPrototypes: 3 },
    { lvl: 13, maxSpell: 4, maxCharges: 7, maxPrototypes: 3 },
    { lvl: 15, maxSpell: 5, maxCharges: 9, maxPrototypes: 4 },
    { lvl: 17, maxSpell: 6, maxCharges: 11, maxPrototypes: 4 },
    { lvl: 20, maxSpell: 6, maxCharges: 13, maxPrototypes: 5 },
  ];
  const tier = tiers.filter((t) => t.lvl <= artificerLevels).pop();

  const existingPrototypes = actor.items.filter((i) => foundry.utils.getProperty(i, "flags.ddbimporter.arcanePrototype") != null);
  if (existingPrototypes.length >= tier.maxPrototypes) {
    ui.notifications.warn(`You already have ${existingPrototypes.length} Arcane Prototype${existingPrototypes.length === 1 ? "" : "s"} (max ${tier.maxPrototypes} at Artificer level ${artificerLevels}).`);
    return;
  }

  const uses = feature.system?.uses ?? {};
  if (!uses.max) {
    ui.notifications.warn("Arcane Prototype feature has no uses configured. Set system.uses.max to track Arcane Charges.");
    return;
  }
  const remainingCharges = (Number(uses.max) || 0) - (uses.spent ?? 0);
  if (remainingCharges <= 0) {
    ui.notifications.warn("No Arcane Charges remaining.");
    return;
  }

  const levelCap = Math.min(tier.maxSpell, remainingCharges);

  const uuid = await dnd5e.applications.CompendiumBrowser.selectOne({
    filters: {
      locked: {
        documentClass: "Item",
        types: new Set(["spell"]),
        additional: {},
        arbitrary: [],
      },
      initial: {
        additional: {
          spelllist: {
            "class:artificer": 1,
            "class:cleric": 1,
            "class:wizard": 1,
          },
          level: { min: 1, max: levelCap },
        },
      },
    },
    selection: {},
  });

  if (!uuid) {
    ui.notifications.warn("No spell selected, aborting.");
    return;
  }

  const spell = await fromUuid(uuid);
  if (!spell) {
    ui.notifications.error(`Could not load spell with UUID: ${uuid}`);
    return;
  }

  const minLevel = Math.max(1, spell.system.level ?? 1);
  if (minLevel > levelCap) {
    ui.notifications.warn(`Cannot imbue ${spell.name}: requires level ${minLevel}, you can afford up to level ${levelCap}.`);
    return;
  }

  const levelOptions = [];
  for (let l = minLevel; l <= levelCap; l++) {
    levelOptions.push(`<option value="${l}">Level ${l} (${l} charge${l === 1 ? "" : "s"})</option>`);
  }

  const chosenLevel = await foundry.applications.api.DialogV2.wait({
    rejectClose: false,
    window: { title: `Imbue ${spell.name}` },
    position: { width: 400 },
    content: `<p>Charges remaining: <strong>${remainingCharges}</strong> / ${tier.maxCharges}</p>
              <div class="form-group"><label>Imbue at level:</label>
              <select name="lvl">${levelOptions.join("")}</select></div>`,
    buttons: [
      {
        action: "create",
        icon: "fa-solid fa-flask",
        label: "Create Prototype",
        callback: (_event, _button, dialog) => Number(dialog.element.querySelector("[name=lvl]").value),
      },
    ],
  });

  if (!chosenLevel) return;

  const itemData = {
    name: `Arcane Prototype: ${spell.name}`,
    type: "consumable",
    img: spell.img,
    system: {
      type: { value: "trinket" },
      description: {
        value: `<p>An experimental arcane prototype imbued with <em>${spell.name}</em> at level ${chosenLevel}.</p>`
          + `<p>Only its creator can use it; once cast, it crumbles to dust unless preserved by expending a spell slot of equal level.</p>`,
      },
      quantity: 1,
      weight: { value: 0 },
      rarity: "common",
      uses: { spent: 0, max: "1", autoDestroy: true, recovery: [] },
      properties: ["mgc"],
      attuned: false,
      identified: true,
    },
    flags: {
      ddbimporter: {
        arcanePrototype: { spellUuid: uuid, imbuedLevel: chosenLevel, creatorId: actor.id },
      },
    },
  };

  const [createdItem] = await actor.createEmbeddedDocuments("Item", [itemData]);
  if (!createdItem) {
    ui.notifications.error("Failed to create Arcane Prototype item.");
    return;
  }

  const rollData = actor.getRollData();
  const spellOverride = {
    uuid,
    properties: ["vocal", "somatic"],
    level: chosenLevel,
    challenge: {
      attack: rollData.attributes.spell.attack,
      save: rollData.attributes.spell.dc,
      override: true,
    },
    spellbook: false,
  };

  await DDBImporter.lib.Activities.DDBBasicActivity.addQuickCastActivity({
    uuid,
    actor,
    document: createdItem,
    spellOverride,
    nameIdPostfix: "C",
    activityData: {
      name: `Cast ${spell.name} (Destroy Prototype)`,
    },
  });

  await DDBImporter.lib.Activities.DDBBasicActivity.addQuickCastActivity({
    uuid,
    actor,
    document: createdItem,
    spellOverride,
    consumptionTargetOverrides: [
      {
        type: "spellSlots",
        target: String(chosenLevel),
        value: 1,
        scaling: { mode: "", formula: "" },
      },
    ],
    activityData: {
      name: `Cast ${spell.name} (Spell Slot)`,
    },
    nameIdPostfix: "S",
  });

  await feature.update({ "system.uses.spent": (uses.spent ?? 0) + chosenLevel });

  ui.notifications.info(`Created Arcane Prototype: ${spell.name} (level ${chosenLevel}). ${chosenLevel} charge${chosenLevel === 1 ? "" : "s"} expended.`);
}

if (scope && foundry.utils.getProperty(scope, "flags.ddb-importer.ddbMacroFunction")) {
  if (!actor || !item) {
    logger.error("No actor or item passed to arcane prototype");
    return;
  }
  console.info("Running Arcane Prototype macro with:", {
    actor,
    item,
  });
  await arcanePrototype(actor, item);
}
