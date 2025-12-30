import { DICTIONARY } from "../config/_module.mjs";
import { CompendiumHelper, DDBSources, logger, utils } from "../lib/_module.mjs";
import { DDBReferenceLinker } from "./lib/_module.mjs";
import DDBComponentFeature from "./vehicle/DDBComponentFeature.mjs";

const ACTION_THRESHOLDS = [
  {
    id: "7",
    thresholds: {
      0: 1,
      1: 10,
      2: 20,
    },
  },
  {
    id: "11",
    thresholds: {
      0: null,
      1: null,
      2: null,
    },
  },
  {
    id: "9",
    thresholds: {
      0: null,
      1: null,
      2: null,
    },
  },
  {
    id: "1",
    thresholds: {
      0: 3,
      1: 20,
      2: 40,
    },
  },
  {
    id: "2",
    thresholds: {
      0: 1,
      1: null,
      2: 2,
    },
  },
  {
    id: "3",
    thresholds: {
      0: 20,
      1: null,
      2: 40,
    },
  },
  {
    id: "8",
    thresholds: {
      0: 1,
      1: null,
      2: 1,
    },
  },
  {
    id: "4",
    thresholds: {
      0: 1,
      1: null,
      2: 2,
    },
  },
  {
    id: "5",
    thresholds: {
      0: 3,
      1: 10,
      2: 20,
    },
  },
  {
    id: "12",
    thresholds: {
      0: null,
      1: null,
      2: null,
    },
  },
  {
    id: "10",
    thresholds: {
      0: null,
      1: null,
      2: null,
    },
  },
  {
    id: "6",
    thresholds: {
      0: 3,
      1: 10,
      2: 20,
    },
  },
];

const SIZES = [
  { name: "Tiny", value: "tiny", size: 0.5 },
  { name: "Small", value: "sm", size: 0.8 },
  { name: "Medium", value: "med", size: 1 },
  { name: "Large", value: "lg", size: 2 },
  { name: "Huge", value: "huge", size: 3 },
  { name: "Gargantuan", value: "grg", size: 4 },
];

export const FLIGHT_IDS = [
  "7",
  "8",
];

const MOVEMENT_DICT = {
  "land": "walk",
  "water": "swim",
  "air": "fly",
  "magical": "Magical",
};

export default class DDBVehicle {

  static ACTION_THRESHOLDS = ACTION_THRESHOLDS;

  static SIZES = SIZES;

  static FLIGHT_IDS = FLIGHT_IDS;

  static MOVEMENT_DICT = MOVEMENT_DICT;

  constructor({ ddbVehicle, legacyName = false, addMonsterEffects = false, addChrisPremades = false } = {}) {
    this.source = ddbVehicle;

    this.configurations = {};
    ddbVehicle.configurations.forEach((c) => {
      this.configurations[c.key] = c.value;
    });

    this.legacyName = legacyName;
    this.addMonsterEffects = addMonsterEffects;
    this.addChrisPremades = addChrisPremades;

    this.mods = this.getAbilityMods();

    this._generateDataStub();
    this.#generateSource();

    this.primaryComponent = this.source.components.find((c) => c.isPrimaryComponent);
  }


  #generateSource() {
    let ddbSource = CONFIG.DDB.sources.find((cnf) => cnf.id == this.source.sourceId);
    const ddbSources = (this.source.sources ?? []).filter((s) => s.sourceType === 1);
    if (this.source.sources && ddbSources.length > 0) {
      const highestSource = ddbSources.reduce((prev, current) => {
        return prev.sourceId > current.sourceId ? prev : current;
      });
      ddbSource = CONFIG.DDB.sources.find((cnf) => cnf.id == highestSource.sourceId);
    }

    const source = {
      book: ddbSource ? ddbSource.name : "Homebrew",
      page: this.source.sourcePageNumber ?? "",
      custom: "",
      license: "",
      id: ddbSource ? ddbSource.id : 9999999,
      sourceCategoryId: ddbSource ? ddbSource.sourceCategoryId : 9999999,
    };

    DDBSources.tweakSourceData(source);

    this.data.system.source = source;
    foundry.utils.setProperty(this.data, "flags.ddbimporter.sourceId", source.id);
    foundry.utils.setProperty(this.data, "flags.ddbimporter.sourceCategory", source.sourceCategoryId);

    this.legacy = CONFIG.DDB.sources.some((ds) =>
      DICTIONARY.sourceCategories.legacy.includes(ds.sourceCategoryId),
    );
    const force2014 = DICTIONARY.source.is2014.includes(source.sourceId ?? source.id);
    const force2024 = DICTIONARY.source.is2024.includes(source.sourceId ?? source.id);
    this.is2014 = force2014
      ? true
      : force2024
        ? false
        : Number.isInteger(source.id) && source.id < 145;
    this.is2024 = !this.is2014;

    this.data.system.source.rules = this.is2014 ? "2014" : "2024";
  }


  _generateDataStub(ddbId = null) {
    const options = {
      temporary: true,
      displaySheet: false,
    };
    const vehicleClass = new Actor.implementation({ name: this.source.name, type: "vehicle" }, options);
    let vehicle = vehicleClass.toObject();
    vehicle._id = ddbId === null
      ? foundry.utils.randomID()
      : utils.namedIDStub(vehicle.name, { postfix: ddbId });
    const flags = {
      dnd5e: {},
      monsterMunch: {},
      ddbimporter: {
        dndbeyond: {},
      },
    };
    foundry.utils.setProperty(vehicle, "flags", flags);
    this.data = vehicle;
  };

  _imageFlags() {
    let img = this.source.largeAvatarUrl;
    // foundry doesn't support gifs
    if (img && img.match(/.gif$/)) {
      img = null;
    }
    this.data.prototypeToken.name = this.source.name;
    this.data.flags.monsterMunch = {
      url: this.source.url,
      img: (img) ? img : this.source.avatarUrl,
      tokenImg: this.source.avatarUrl,
    };

  }


  static getSizeFromId(sizeId) {
    const size = CONFIG.DDB.creatureSizes.find((s) => s.id == sizeId).name;
    const sizeData = DDBVehicle.SIZES.find((s) => size == s.name);

    if (!sizeData) {
      logger.warn(`No size found, using medium`, size);
      return { name: "Medium", value: "med", size: 1 };
    }
    return sizeData;
  }

  #generateSize () {
    const sizeData = DDBVehicle.getSizeFromId(this.source.sizeId);
    const token = {
      scale: sizeData.size >= 1 ? 1 : sizeData.size,
      value: sizeData.size >= 1 ? sizeData.size : 1,
    };

    this.data.system.traits.size = sizeData.value;
    this.data.prototypeToken.width = token.value;
    this.data.prototypeToken.height = token.value;
    this.data.prototypeToken.scale = token.scale;

  }

  #generateAbilities() {
    DICTIONARY.actor.abilities.forEach((ability) => {
      const value = this.source.stats.find((stat) => stat.id === ability.id)?.value || 10;
      const mod = value === 0
        ? -5
        : CONFIG.DDB.statModifiers.find((s) => s.value == value).modifier;

      this.data.system.abilities[ability.value]['value'] = value;
      this.data.system.abilities[ability.value]['proficient'] = 0;
      this.data.system.abilities[ability.value]['mod'] = mod;

    });
  }

  getAbilityMods() {
    let abilities = {};

    DICTIONARY.actor.abilities.forEach((ability) => {
      const value = this.source.stats.find((stat) => stat.id === ability.id)?.value || 10;
      const mod = value === 0
        ? -5
        : CONFIG.DDB.statModifiers.find((s) => s.value == value).modifier;

      abilities[ability.value] = mod;
    });

    return abilities;
  }


  #generateDamageImmunities() {
    const config = CONFIG.DDB.damageTypes;

    let values = [];
    let custom = [];

    const damageTypes = DICTIONARY.actions.damageType.filter((d) => d.name !== null).map((d) => d.name);

    this.source.damageImmunities.forEach((adj) => {
      const adjustment = config.find((cadj) => adj === cadj.id);
      if (adjustment && damageTypes.includes(adjustment.name.toLowerCase())) {
        values.push(adjustment.name.toLowerCase());
      } else if (adjustment && adjustment.slug === "bludgeoning-piercing-and-slashing-from-nonmagical-attacks") {
        values.push("bludgeoning", "piercing", "slashing");
      } else if (adjustment) {
        const midiQolInstalled = game.modules.get("midi-qol")?.active;
        if (midiQolInstalled) {
          if (adjustment.name.toLowerCase().includes("silvered")) {
            values.push("silver");
          } else if (adjustment.name.toLowerCase().includes("adamantine")) {
            values.push("adamant");
          } else if (adjustment.slug === "damage-from-spells") {
            values.push("spell");
          } else {
            custom.push(adjustment.name);
          }
        } else {
          custom.push(adjustment.name);
        }
      }
    });

    this.data.system.traits.di = {
      value: values,
      custom: custom.join("; "),
    };
  }

  #generateConditionImmunities() {
    const config = CONFIG.DDB.conditions.map((condition) => {
      return {
        id: condition.definition.id,
        name: condition.definition.name,
        type: condition.definition.type,
        slug: condition.definition.slug,
      };
    });

    let values = [];
    let custom = [];

    this.source.conditionImmunities.forEach((adj) => {
      const adjustment = config.find((cadj) => adj === cadj.id);
      const valueAdjustment = DICTIONARY.conditions.find((condition) => condition.label.toLowerCase() == adjustment.name.toLowerCase());
      if (adjustment && valueAdjustment) {
        values.push(valueAdjustment.foundry);
      } else if (adjustment) {
        custom.push(adjustment.name);
      }
    });

    this.data.system.traits.ci = {
      value: values,
      custom: custom.join("; "),
    };
  }

  #generateCapacity() {
    let capacity = {
      creature: "",
      cargo: null,
    };

    if (this.source.cargoCapacity) {
      capacity.cargo = {
        "value": this.source.cargoCapacity / 2000,
        "units": "tn",
      };
    }

    if (this.source.creatureCapacity && this.source.creatureCapacity.length > 0) {
      const capacityStrings = this.source.creatureCapacity.map((c) => {
        const size = c.sizeId
          ? `${CONFIG.DDB.creatureSizes.find((s) => s.id == c.sizeId).name.toLowerCase()} `
          : "";

        return `${c.capacity} ${size}${c.type}`;
      });
      capacity.creature = capacityStrings.join(", ");

      for (const c of this.source.creatureCapacity) {
        if (c.type === "crew") {
          this.data.system.crew.max = c.capacity;
        } else if (c.type === "passengers") {
          this.data.system.passengers.max = c.capacity;
        }
      }
    }

    this.data.system.attributes.capacity = capacity;
  }

  #generateDimensions() {
    if (this.configurations.ST === "dimension") {
      this.data.system.traits.dimensions = `(${this.source.length} ft. by ${this.source.width} ft.)`;
    }
    if (this.configurations.ST === "weight") {
      this.data.system.traits.dimensions = `(${this.source.weight} lb.)`;
    }
  }

  #generateMovement() {

    const movement = foundry.utils.duplicate(this.data.system.attributes.movement);

    // is it travel pace?
    if (this.configurations.ETP) {
      movement["units"] = "mi";
      const travelPaceMilesPerHour = this.source.travelPace / 5280;
      if (DDBVehicle.FLIGHT_IDS.includes(this.source.id)
        || this.configurations.DT === "spelljammer"
        || this.configurations.DT === "elemental-airship"
      ) {
        movement["fly"] = travelPaceMilesPerHour;
      } else {
        movement["swim"] = travelPaceMilesPerHour;
      }
    } else if (this.primaryComponent
        && this.primaryComponent.definition.speeds
        && this.primaryComponent.definition.speeds.length > 0
    ) {
      const mode = this.primaryComponent.definition.speeds[0].modes[0];
      movement["units"] = "ft";
      let speedType = this.primaryComponent.definition.speeds[0].type;
      if (speedType) {
        const type = DDBVehicle.MOVEMENT_DICT[speedType];
        movement[type] = mode.value;
      } else if (mode.restrictionsText) {
        const restrictionRegex = /Fly Speed (\d+) ft/i;
        const restrictionMatch = mode.restrictionsText.match(restrictionRegex);
        if (restrictionMatch) {
          movement["fly"] = parseInt(restrictionMatch[1]);
        }
      }

      if ((mode.restrictionsText ?? "").toLowerCase().includes("hover")) {
        movement["hover"] = true;
      }
    }

    this.data.system.attributes.movement = movement;
  }

  #generateHitPoints() {
    // if we are using actor level HP apply
    if ((!this.configurations.ECCR
      || this.configurations.DT === "elemental-airship"
    )
      && this.primaryComponent
    ) {
      this.data.system.attributes.hp.value = this.primaryComponent.definition.hitPoints;
      this.data.system.attributes.hp.max = this.primaryComponent.definition.hitPoints;
      if (!this.configurations.ECMT && Number.isInteger(this.primaryComponent.definition.mishapThreshold)) {
        this.data.system.attributes.hp.mt = this.primaryComponent.definition.mishapThreshold;
      }
      if ((!this.configurations.ECDT
        || this.configurations.DT === "elemental-airship"
      ) && Number.isInteger(this.primaryComponent.definition.damageThreshold)) {
        this.data.system.attributes.hp.dt = this.primaryComponent.definition.damageThreshold;
      }
    }
  }

  #generateAC() {
    // if we are using actor level AC apply
    if (this.configurations.PCMT === "vehicle" && this.primaryComponent) {
      if (this.configurations.DT === "spelljammer") {
        this.data.system.attributes.ac.motionless = this.primaryComponent.definition.armorClassDescription;
        this.data.system.attributes.ac.flat = this.primaryComponent.definition.armorClass;
      } else {
        this.data.system.attributes.ac.motionless = this.primaryComponent.definition.armorClass;
        this.data.system.attributes.ac.flat = this.primaryComponent.definition.armorClass + this.mods["dex"];
      }
    }
  }

  #generateType() {
    let type = "land";

    if (DDBVehicle.FLIGHT_IDS.includes(this.source.id)
      || this.configurations.DT === "spelljammer"
      || this.configurations.DT === "elemental-airship"
    ) {
      type = "air";
    } else if (this.configurations.DT === "ship") {
      type = "water";
    }
    this.data.system.details.type = type;
  }

  #generateDescription() {
    this.data.system.details.biography.value = DDBReferenceLinker.parseTags(this.source.description);

    if (this.source.actionsText) {
      this.data.system.details.biography.value += `<h2>Actions</h2>\n<p>${this.source.actionsText}</p>`;
      const componentActionSummaries = this.source.componentActionSummaries.map((feature) => {
        return `<h3>${feature.name}</h3>\n<p>${feature.description}</p>`;
      }).join('\n');
      this.data.system.details.biography.value += `\n<p>${componentActionSummaries}</p>`;

      const actionsRegex = /On its turn(?:,*) the (?:.*?) can take (\d+) action/g;
      const actionsMatch = this.source.actionsText.match(actionsRegex);
      const numberOfActions = actionsMatch ? parseInt(actionsMatch[1]) : 1;

      this.data.system.attributes.actions.value = numberOfActions;
      const actionThreshold = DDBVehicle.ACTION_THRESHOLDS.find((t) => t.id === this.source.id);
      this.data.system.attributes.actions.thresholds = actionThreshold ? actionThreshold.thresholds : [];

    } else if (this.source.features.length > 0) {
      const featuresText = this.source.features.map((feature) => {
        return `<h3>${feature.name}</h3>\n<p>${feature.description}</p>`;
      }).join('\n');
      this.data.system.details.biography.value += `<h2>Features</h2>\n<p>${featuresText}</p>`;
    }
  }

  async #buildComponent(component) {
    const results = [];

    const actions = component.definition?.actions?.length > 0
      ? component.definition.actions
      : [{}];

    for (const action of actions) {
      const ddbFeature = new DDBComponentFeature(
        {
          ddbVehicle: this,
          component,
          action,
        },
      );

      await ddbFeature.loadEnricher();
      await ddbFeature.parse();

      logger.debug("built component", ddbFeature);
      results.push(ddbFeature.data);
    }

    return results;
  }

  async #generateComponents() {
    const components = this.source.components.sort((c) => c.displayOrder);

    const componentCount = {};
    const uniqueComponents = [];
    components.forEach((component) => {
      const key = component.definitionKey;
      const count = componentCount[key] || 0;
      if (count === 0) uniqueComponents.push(component);
      componentCount[key] = count + 1;
    });

    const results = [];
    for (const component of uniqueComponents.filter((f) => f.definition.name)) {
      for (let i = 0; i < componentCount[component.definitionKey]; i++) {
        const clonedComponent = foundry.utils.duplicate(component);
        clonedComponent.count = i;
        const builtItems = await this.#buildComponent(clonedComponent);
        results.push(...builtItems);
      }
    }

    for (const feature of this.source.features.filter((f) => f.name)) {
      foundry.utils.setProperty(feature, "definition.types", [{ type: "feature" }]);
      foundry.utils.setProperty(feature, "definition.name", feature.name);
      const builtItems = await this.#buildComponent(feature);

      results.push(...builtItems);
    }

    this.data.items = results;
  }

  #generateCost() {
    if (!this.primaryComponent) return;

    for (const cost of this.primaryComponent.definition.costs ?? []) {
      if (!cost.value) break;
      this.data.system.attributes.price = {
        "value": cost.value,
        "denomination": "gp",
      };
      break; // only first cost
    }
  }


  async parse() {
    logger.debug("Parsing vehicle");

    this._imageFlags();

    this.data.flags.ddbimporter = {
      id: this.source.id,
      version: CONFIG.DDBI.version,
      configurations: this.configurations,
    };

    this.#generateAbilities();
    this.#generateDamageImmunities();
    this.#generateConditionImmunities();
    this.#generateSize();
    this.#generateCapacity();
    this.#generateDimensions();
    this.#generateMovement();
    this.#generateHitPoints();
    this.#generateAC();
    this.#generateType();
    this.#generateCost();

    // No 5e support for vehicles yet:
    // fuel data

    this.#generateDescription();

    if (this.configurations.EAS) {
      this.data.system.attributes.actions.stations = true;
    }

    await this.#generateComponents();

    // finally check for existing actor
    this.data = await CompendiumHelper.existingActorCheck("vehicle", this.data);
  }
}
