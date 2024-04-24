import utils from "../../../lib/utils.js";
import logger from "../../../logger.js";
import DDBMonsterFeature from "./DDBMonsterFeature.js";

export default class DDBMonsterFeatureFactory {

  // some monsters now have [rollable] tags - if these exist we need to parse them out
  // in the future we may be able to use them, but not consistent yet
  static replaceRollable(text) {
    const rollableRegex = new RegExp(/(\[rollable\])([^;]*);(.*)(\[\/rollable\])/g);
    return text.replaceAll(rollableRegex, "$2");
  }

  constructor({ ddbMonster, hideDescription, updateExisting } = {}) {
    this.ddbMonster = ddbMonster;

    this.hideDescription = hideDescription;
    this.updateExisting = updateExisting;

    this.featureBlocks = {
      action: [],
      reaction: [],
      bonus: [],
      mythic: [],
      lair: [],
      legendary: [],
      special: [],
    };

    this.features = {
      action: [],
      reaction: [],
      bonus: [],
      mythic: [],
      lair: [],
      legendary: [],
      special: [],
    };

    this.characterDescription = {
      action: "",
      reaction: "",
      bonus: "",
      mythic: "",
      lair: "",
      legendary: "",
      special: "",
      unexpected: null,
    };

    this.html = {
      action: "",
      reaction: "",
      bonus: "",
      mythic: "",
      lair: "",
      legendary: "",
      special: "",
    };

    this.resources = {
      legendary: {
        value: 3,
        max: 3
      },
      lair: {
        value: false,
        initiative: null
      },
      resistance: {
        value: 0,
        max: 0
      },
    };

    this.resistance = {};
  }

  getFeatures(type) {
    return this.features[type].map((feature) => foundry.utils.deepClone(feature.feature));
  }

  get actions() {
    return this.getFeatures("action");
  }

  get reactions() {
    return this.getFeatures("reaction");
  }

  get bonus() {
    return this.getFeatures("bonus");
  }

  get mythic() {
    return this.getFeatures("mythic");
  }

  get lair() {
    return this.getFeatures("lair");
  }

  get legendary() {
    return this.getFeatures("legendary");
  }

  get special() {
    return this.getFeatures("special");
  }

  #buildDom(type) {
    const dom = utils.htmlToDocumentFragment(this.html[type]);
    dom.childNodes.forEach((node) => {
      if (node.textContent == "\n" || node.textContent == "\r\n") {
        dom.removeChild(node);
      }
    });
    return dom;
  }

  static EM_STRONG_EXCEPTIONS = [
    "Yeenoghu",
  ];

  #generateActionActions(type) {
    let splitActions = this.html[type].split("<h3>Roleplaying Information</h3>");
    if (splitActions.length > 1) {
      this.characterDescription[type] = `<h3>Roleplaying Information</h3>${splitActions[1]}`;
    }
    this.html[type] = splitActions[0];

    let dom = this.#buildDom(type);

    // build out skeleton actions
    dom.querySelectorAll("p").forEach((node) => {
      const pDom = utils.htmlToDocumentFragment(node.outerHTML);
      const query = pDom.querySelector("em strong") ?? pDom.querySelector("strong em");
      if (!query) return;
      let name = query.textContent.trim().replace(/\./g, '');
      name = DDBMonsterFeatureFactory.splitName(name, node.textContent);
      const action = { name, options: { html: "", ddbMonster: this.ddbMonster, type, titleHTML: query.outerHTML, fullName: query.textContent } };
      this.featureBlocks[type].push(action);
    });

    // there is inconsistent formatting
    if (this.featureBlocks[type].length == 0) {
      dom.querySelectorAll("p").forEach((node) => {
        const pDom = utils.htmlToDocumentFragment(node.outerHTML);
        const query = pDom.querySelector("strong");
        if (!query) return;
        let name = query.textContent.trim().replace(/\./g, '');
        name = DDBMonsterFeatureFactory.splitName(name, node.textContent);
        const action = { name, options: { html: "", ddbMonster: this.ddbMonster, type, titleHTML: query.outerHTML, fullName: query.textContent } };
        this.featureBlocks[type].push(action);
      });
    }

    // there is inconsistent formatting
    if (this.featureBlocks[type].length == 0) {
      dom.querySelectorAll("p").forEach((node) => {
        const pDom = utils.htmlToDocumentFragment(node.outerHTML);
        const query = pDom.querySelector("b");
        if (!query) return;
        let name = query.textContent.trim().replace(/\./g, '');
        name = DDBMonsterFeatureFactory.splitName(name, node.textContent);
        const action = { name, options: { html: "", ddbMonster: this.ddbMonster, type, titleHTML: query.outerHTML, fullName: query.textContent } };
        this.featureBlocks[type].push(action);
      });
    }


    // there is inconsistent formatting
    if (this.featureBlocks[type].length == 0) {
      dom.querySelectorAll("p").forEach((node) => {
        const pDom = utils.htmlToDocumentFragment(node.outerHTML);
        const title = pDom.textContent.split('.')[0];
        const name = title.trim();
        if (name && name.length > 0) {
          const titleHTML = pDom.outerHTML ? pDom.outerHTML.split('.')[0] : undefined;
          const action = { name, options: { html: "", ddbMonster: this.ddbMonster, type, titleHTML } };
          this.featureBlocks[type].push(action);
        }
      });
    }

    // homebrew fun
    if (this.featureBlocks[type].length == 0) {
      dom.querySelectorAll("div").forEach((node) => {
        const pDom = utils.htmlToDocumentFragment(node.outerHTML);
        const title = pDom.textContent.split('.')[0];
        const name = title.trim();
        if (name && name.length > 0) {
          const titleHTML = pDom.outerHTML ? pDom.outerHTML.split('.')[0] : undefined;
          const action = { name, options: { html: "", ddbMonster: this.ddbMonster, type, titleHTML } };
          this.featureBlocks[type].push(action);
        }
      });
    }

    let action = this.featureBlocks[type][0];

    dom.childNodes.forEach((node) => {
      const nodeContextSplit = node.textContent.split('.');
      const nodeName = nodeContextSplit[0].trim();
      const longNodeName = (nodeContextSplit.length > 2 && nodeContextSplit[1].trim().startsWith('('))
        ? `${nodeName} ${nodeContextSplit[1].trim()}`
        : nodeName;
      let switchAction = this.featureBlocks[type].find((act) => nodeName === act.name || longNodeName === act.name);

      if (!switchAction) {
        switchAction = this.featureBlocks[type].find((act) =>
          act.options?.fullName
          && node.textContent.startsWith(act.options.fullName)
        );
      }
      let startFlag = false;
      if (switchAction) {
        action = switchAction;
        if (action.options.html === "") {
          startFlag = true;
        }
      }

      if (!action) return;

      if (node.outerHTML) {
        let outerHTML = `${node.outerHTML}`;
        if (switchAction && startFlag) {
          const replaceName = foundry.utils.getProperty(action, "fullName") ?? nodeName;
          outerHTML = outerHTML.replace(replaceName, "");
          const titleDom = utils.htmlToDocumentFragment(outerHTML);
          if (titleDom.textContent.startsWith(".")) outerHTML = outerHTML.replace(".", "");
        }
        action.options.html += outerHTML;
      }
    });
  }

  #generateLairActions(type = "lair") {
    let dom = this.#buildDom(type);

    const defaultAction = { name: "Lair Actions", options: { html: "", ddbMonster: this.ddbMonster, type } };
    this.featureBlocks[type].push(defaultAction);

    dom.querySelectorAll("h4").forEach((node) => {
      const name = node.textContent.trim();
      if (name !== "") {
        const action = { name, options: { html: "", ddbMonster: this.ddbMonster, type } };
        if (node.textContent == "Lair Actions" || node.textContent == "") {
          return;
        }
        this.featureBlocks[type].push(action);
      }
    });

    dom.querySelectorAll("h3").forEach((node) => {
      const name = node.textContent.trim();
      if (name !== "") {
        const action = { name, options: { html: "", ddbMonster: this.ddbMonster, type } };
        if (node.textContent == "Lair Actions" || action.name == "") {
          return;
        }
        this.featureBlocks[type].push(action);
      }
    });

    let actionType = "Lair Actions";
    let action = this.featureBlocks[type].find((act) => act.name == actionType);

    if (!action) {
      action = this.featureBlocks[type][0];
    }

    dom.childNodes.forEach((node) => {
      // const switchAction = dynamicActions.find((act) => act.name == node.textContent);
      const nodeName = node.textContent.split('.')[0].trim();
      const switchAction = this.featureBlocks[type].find((act) => nodeName === act.name);
      let startFlag = false;
      if (switchAction) {
        actionType = node.textContent;
        action = switchAction;
        if (action.options.html === "") startFlag = true;
      }
      if (node.outerHTML) {
        let outerHTML = node.outerHTML;
        if (switchAction && startFlag) {
          outerHTML = outerHTML.replace(`${nodeName}.`, "");
        }
        action.options.html += outerHTML;
      }

      const initiativeMatch = node.textContent.match(/initiative count (\d+)/);
      if (initiativeMatch) {
        this.resources.lair = {
          value: true,
          initiative: parseInt(initiativeMatch[1]),
        };
      }
    });
  }

  #generateLegendaryActions(type) {
    let dom = this.#buildDom(type);

    // Base feat
    const feat = { name: "Legendary Actions", options: { html: "", ddbMonster: this.ddbMonster, type, actionCopy: false } };
    feat.options.html = `${this.html[type]}`;
    this.featureBlocks[type].push(feat);


    // build out skeleton actions
    dom.querySelectorAll("strong").forEach((node) => {
      const name = node.textContent.trim().replace(/\.$/, '').trim();
      const action = { name, options: { html: "", ddbMonster: this.ddbMonster, type, actionCopy: false } };

      const actionMatch = this.features["action"].concat(
        this.features.reaction,
        this.features.reaction,
        this.features.bonus,
      ).find((mstAction) =>
        name == mstAction.name
        || name == `${mstAction.name} Attack`
        || name == `${mstAction.name}`.split('(', 1)[0].trim()
        || name == `${mstAction.name} Attack`.split('(', 1)[0].trim()
      );

      if (actionMatch) {
        const dupFeature = new DDBMonsterFeature(name, { ddbMonster: this.ddbMonster, html: actionMatch.html, type, actionCopy: true });
        dupFeature.feature = foundry.utils.duplicate(actionMatch.feature);
        dupFeature.feature._id = foundry.utils.randomID();
        dupFeature.feature.name = action.name; // fix up name to make sure things like Attack are included
        this.features[type].push(dupFeature);
        action.options.actionCopy = true;
      }
      this.featureBlocks[type].push(action);

    });

    let action = this.featureBlocks[type].find((act) => act.name == "Legendary Actions");

    dom.childNodes
      .forEach((node) => {
      // check for action numbers
      // can take 3 legendary actions
        let startFlag = false;
        const actionMatch = node.textContent.match(/can take (d+) legendary actions/);
        if (actionMatch) {
          this.resource.legendary.value = parseInt(actionMatch[1]);
          this.resource.legendary.max = parseInt(actionMatch[1]);
        }

        const nodeName = node.textContent.split('.')[0].trim();
        const switchAction = this.featureBlocks[type].find((act) => nodeName === act.name);
        if (action.name !== "Legendary Actions" || switchAction) {

          if (switchAction) {
            action = switchAction;
            if (action.options.html === "") {
              startFlag = true;
            }
          }

          if (action.options.actionCopy) return;
          if (node.outerHTML) {
            let outerHTML = node.outerHTML;
            if (switchAction && startFlag) {
              outerHTML = outerHTML.replace(`${nodeName}.`, "");
            }
            action.options.html += outerHTML;
          }
        }
      });
  }

  static splitName(name, nodeText) {
    if (!name.includes("Spell;") && !name.includes("Psionics;") && !name.includes("Mythic Trait;")) {
      const split = name.split(";");
      if (split.length > 1 && split[0].includes("(") && !split[0].includes(")")) {
        return name.trim();
      } else if (split.length > 1) {
        return split.pop().trim();
      } else {
        return name.trim();
      }
    } else if (name.includes("Spell;")) {
      return nodeText.trim().split(".")[0];
    } else {
      return name.trim();
    }
  }

  #generateSpecialActions(type) {
    let splitActions = this.html[type].split("<h3>Roleplaying Information</h3>");
    if (splitActions.length > 1) {
      this.characterDescription[type] = `<h3>Roleplaying Information</h3>${splitActions[1]}`;
    }

    this.html[type] = splitActions[0];
    let dom = this.#buildDom(type);

    // build out skeleton actions
    dom.querySelectorAll("p").forEach((node) => {
      const pDom = utils.htmlToDocumentFragment(node.outerHTML);
      const query = pDom.querySelector("em");
      if (!query) return;
      let name = query.textContent.trim().replace(/\./g, '');
      name = DDBMonsterFeatureFactory.splitName(name, node.textContent);
      if (name) {
        const action = { name, options: { html: "", ddbMonster: this.ddbMonster, type, titleHTML: query.outerHTML, fullName: query.textContent } };
        this.featureBlocks[type].push(action);
      }
    });

    if (this.featureBlocks[type].length == 0) {
      dom.querySelectorAll("p").forEach((node) => {
        const pDom = utils.htmlToDocumentFragment(node.outerHTML);
        const query = pDom.querySelector("strong");
        if (!query) return;
        let name = query.textContent.trim().replace(/\./g, '');
        name = DDBMonsterFeatureFactory.splitName(name, node.textContent);
        if (name) {
          const action = { name, options: { html: "", ddbMonster: this.ddbMonster, type, titleHTML: query.outerHTML, fullName: query.textContent } };
          this.featureBlocks[type].push(action);
        }
      });
    }

    if (this.featureBlocks[type].length == 0) {
      dom.querySelectorAll("em").forEach((node) => {
        const name = node.textContent.trim().replace(/\.$/, '').trim();
        if (name) {
          const action = { name, options: { html: "", ddbMonster: this.ddbMonster, type, titleHTML: node.outerHTML, fullName: node.textContent } };
          this.featureBlocks[type].push(action);
        }
      });
    }

    if (this.featureBlocks[type].length == 0) {
      dom.querySelectorAll("strong").forEach((node) => {
        const name = node.textContent.trim().replace(/\.$/, '').trim();
        if (name) {
          const action = { name, options: { html: "", ddbMonster: this.ddbMonster, type, titleHTML: node.outerHTML, fullName: node.textContent } };
          this.featureBlocks[type].push(action);
        }
      });
    }

    if (this.featureBlocks[type].length == 0) {
      const action = { name: "Special Traits", options: { html: "", ddbMonster: this.ddbMonster, type } };
      this.featureBlocks[type].push(action);
    }

    if (this.featureBlocks[type].length === 0) return;

    let action = this.featureBlocks[type][0];

    dom.childNodes.forEach((node) => {
      const nodeName = node.textContent.split('.')[0].trim();
      let switchAction = this.featureBlocks[type].find((act) => nodeName === act.name);
      if (action.name.includes("; Recharges after a Short or Long Rest")) action.name = action.name.replace("; Recharges after a Short or Long Rest", "");
      if (action.name.includes("; Recharges after a Long Rest")) action.name = action.name.replace("; Recharges after a Long Rest", "");
      if (!switchAction) {
        switchAction = this.featureBlocks[type].find((act) => node.textContent.startsWith(act.options.fullName));
      }
      let startFlag = false;
      if (switchAction) {
        action = switchAction;
        if (action.options.html === "") {
          startFlag = true;
        }
      }

      if (node.outerHTML) {
        let outerHTML = node.outerHTML;
        if (switchAction && startFlag) {
          if (action.options.fullName) {
            outerHTML = outerHTML.replace(action.fullName, "");
          } else {
            outerHTML = outerHTML.replace(nodeName, "");
          }
        }
        const titleDom = utils.htmlToDocumentFragment(outerHTML);
        if (titleDom.textContent.startsWith(". ")) outerHTML = outerHTML.replace(". ", "");
        action.options.html += outerHTML;
      }

      const resistanceMatch = node.textContent.match(/Legendary Resistance \((\d+)\/Day/i);
      if (resistanceMatch) {
        this.resources.resistance.value = parseInt(resistanceMatch[1]);
        this.resources.resistance.max = parseInt(resistanceMatch[1]);
      }
    });
  }

  // possible regular types:
  // action, reaction, bonus, mythic
  // this.ddbMonster.source.actionsDescription
  // this.ddbMonster.source.reactionsDescription
  // this.ddbMonster.source.bonusActionsDescription
  // this.ddbMonster.source.mythicActionsDescription

  async generateActions(html, type = "action") {
    if (!html || html.trim() == "") return;

    this.html[type] = DDBMonsterFeatureFactory.replaceRollable(utils.replaceHtmlSpaces(`${html}`))
      .replace(/<\/strong> <strong>/g, "")
      .replace(/<\/strong><strong>/g, "")
      .replace(/<strong>\.<\/strong>/g, ".")
      .replace(/<em>\.<\/em>/g, ".")
      .replace(/&shy;/g, "");

    switch (type) {
      case "action":
      case "bonus":
      case "mythic":
      case "reaction":
        this.#generateActionActions(type);
        break;
      case "lair":
        this.#generateLairActions(type);
        break;
      case "legendary":
        this.#generateLegendaryActions(type);
        break;
      case "special":
        this.#generateSpecialActions(type);
        break;
      default:
        logger.error(`Unknown action parsing type ${this.type}`, { DDBFeatureFactory: this });
        throw new Error(`Unknown action parsing type ${this.type}`);
    }

    // some features are duplicated and we parse these first
    for (const feature of this.features[type]) {
      // eslint-disable-next-line no-await-in-loop
      await feature.parse();
    }

    // parse remaining feature blocks
    for (const feature of this.featureBlocks[type].filter((feature) => !feature.options.actionCopy)) {
      feature.options["hideDescription"] = this.hideDescription;
      feature.options["updateExisting"] = this.updateExisting;
      const ddbFeature = new DDBMonsterFeature(feature.name, feature.options);
      // eslint-disable-next-line no-await-in-loop
      await ddbFeature.parse();
      this.features[type].push(ddbFeature);
    }
  }

}

