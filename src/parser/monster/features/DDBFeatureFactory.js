import utils from "../../../lib/utils.js";
import logger from "../../../logger.js";
import DDBFeature from "./DDBFeature.js";

export class DDBFeatureFactory {

  // some monsters now have [rollable] tags - if these exist we need to parse them out
  // in the future we may be able to use them, but not consistent yet
  static replaceRollable(text) {
    const rollableRegex = new RegExp(/(\[rollable\])([^;]*);(.*)(\[\/rollable\])/g);
    return text.replaceAll(rollableRegex, "$2");
  }

  constructor({ ddbMonster } = {}) {
    this.ddbMonster = ddbMonster;

    this.hideDescription = game.settings.get("ddb-importer", "munching-policy-hide-description");
    this.updateExisting = game.settings.get("ddb-importer", "munching-policy-update-existing");

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
    return this.features[type].map((feature) => deepClone(feature.feature));
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
    let dom = new DocumentFragment();
    $.parseHTML(this.html[type]).forEach((element) => {
      dom.appendChild(element);
    });
    dom.childNodes.forEach((node) => {
      if (node.textContent == "\n" || node.textContent == "\r\n") {
        dom.removeChild(node);
      }
    });
    return dom;
  }

  #generateActionActions(type) {
    let splitActions = this.html[type].split("<h3>Roleplaying Information</h3>");
    if (splitActions.length > 1) {
      this.characterDescription[type] = `<h3>Roleplaying Information</h3>${splitActions[1]}`;
    }
    this.html[type] = splitActions[0];

    let dom = this.#buildDom(type);

    // build out skeleton actions
    dom.querySelectorAll("p").forEach((node) => {

      let pDom = new DocumentFragment();
      $.parseHTML(node.outerHTML).forEach((element) => {
        pDom.appendChild(element);
      });
      const query = pDom.querySelector("strong");
      if (!query) return;
      let name = query.textContent.trim().replace(/\./g, '');
      if (!name.includes("Spell;") && !name.includes("Mythic Trait;")) {
        name = name.split(";").pop().trim();
      }
      const action = new DDBFeature(name, { ddbMonster: this.ddbMonster, type, titleHTML: query.outerHTML, fullName: query.textContent });
      this.features[type].push(action);
    });

    // there is inconsistent formatting
    if (this.features[type].length == 0) {
      dom.querySelectorAll("p").forEach((node) => {

        let pDom = new DocumentFragment();
        $.parseHTML(node.outerHTML).forEach((element) => {
          pDom.appendChild(element);
        });
        const query = pDom.querySelector("b");
        if (!query) return;
        let name = query.textContent.trim().replace(/\./g, '');
        if (!name.includes("Spell;") && !name.includes("Mythic Trait;")) {
          name = name.split(";").pop().trim();
        }
        const action = new DDBFeature(name, { ddbMonster: this.ddbMonster, type, titleHTML: query.outerHTML, fullName: query.textContent });
        this.features[type].push(action);
      });
    }


    // there is inconsistent formatting
    if (this.features[type].length == 0) {
      dom.querySelectorAll("p").forEach((node) => {

        let pDom = new DocumentFragment();
        $.parseHTML(node.outerHTML).forEach((element) => {
          pDom.appendChild(element);
        });
        const title = pDom.textContent.split('.')[0];
        const name = title.trim();
        if (name && name.length > 0) {
          const titleHTML = pDom.outerHTML ? pDom.outerHTML.split('.')[0] : undefined;
          const action = new DDBFeature(name, { ddbMonster: this.ddbMonster, type, titleHTML });
          this.features[type].push(action);
        }
      });
    }

    // homebrew fun
    if (this.features[type].length == 0) {
      dom.querySelectorAll("div").forEach((node) => {

        let pDom = new DocumentFragment();
        $.parseHTML(node.outerHTML).forEach((element) => {
          pDom.appendChild(element);
        });
        const title = pDom.textContent.split('.')[0];
        const name = title.trim();
        if (name && name.length > 0) {
          const titleHTML = pDom.outerHTML ? pDom.outerHTML.split('.')[0] : undefined;
          const action = new DDBFeature(name, { ddbMonster: this.ddbMonster, type, titleHTML });
          this.features[type].push(action);
        }
      });
    }

    let action = this.features[type][0];

    dom.childNodes.forEach((node) => {
      const nodeContextSplit = node.textContent.split('.');
      const nodeName = nodeContextSplit[0].trim();
      const longNodeName = (nodeContextSplit.length > 2 && nodeContextSplit[1].trim().startsWith('('))
        ? `${nodeName} ${nodeContextSplit[1].trim()}`
        : nodeName;
      let switchAction = this.features[type].find((act) => nodeName === act.name || longNodeName === act.name);

      if (!switchAction) {
        switchAction = this.features[type].find((act) =>
          act.feature.flags.monsterMunch?.fullName
          && node.textContent.startsWith(act.feature.flags.monsterMunch.fullName)
        );
      }
      let startFlag = false;
      if (switchAction) {
        action = switchAction;
        if (action.html === "") {
          startFlag = true;
        }
      }

      if (!action) return;

      if (node.outerHTML) {
        let outerHTML = `${node.outerHTML}`;
        if (switchAction && startFlag) {
          const replaceName = getProperty(action.feature, "flags.monsterMunch.fullName") ?? nodeName;
          outerHTML = outerHTML.replace(replaceName, "");

          const titleDom = new DocumentFragment();
          $.parseHTML(outerHTML).forEach((element) => {
            titleDom.appendChild(element);
          });
          if (titleDom.textContent.startsWith(".")) outerHTML = outerHTML.replace(".", "");
        }
        action.html += outerHTML;
      }
    });
  }

  #generateLairActions(type = "lair") {
    let dom = this.#buildDom(type);

    const defaultAction = new DDBFeature("Lair Actions", { ddbMonster: this.ddbMonster, type });
    this.features[type].push(defaultAction);

    dom.querySelectorAll("h4").forEach((node) => {
      const name = node.textContent.trim();
      if (name !== "") {
        const action = new DDBFeature(name, { ddbMonster: this.ddbMonster, type });
        if (node.textContent == "Lair Actions" || node.textContent == "") {
          return;
        }
        this.features[type].push(action);
      }
    });

    dom.querySelectorAll("h3").forEach((node) => {
      const name = node.textContent.trim();
      if (name !== "") {
        const action = new DDBFeature(name, { ddbMonster: this.ddbMonster, type });
        if (node.textContent == "Lair Actions" || action.name == "") {
          return;
        }
        this.features[type].push(action);
      }
    });

    let actionType = "Lair Actions";
    let action = this.features[type].find((act) => act.name == actionType);

    if (!action) {
      action = this.features[type][0];
    }

    dom.childNodes.forEach((node) => {
      // const switchAction = dynamicActions.find((act) => act.name == node.textContent);
      const nodeName = node.textContent.split('.')[0].trim();
      const switchAction = this.features[type].find((act) => nodeName === act.name);
      let startFlag = false;
      if (switchAction) {
        actionType = node.textContent;
        action = switchAction;
        if (action.html === "") startFlag = true;
      }
      if (node.outerHTML) {
        let outerHTML = node.outerHTML;
        if (switchAction && startFlag) {
          outerHTML = outerHTML.replace(`${nodeName}.`, "");
        }
        action.html += outerHTML;
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
    const feat = new DDBFeature("Legendary Actions", { ddbMonster: this.ddbMonster, type, actionCopy: false });
    feat.html = `${this.html[type]}`;
    feat.feature.system.activation.type = "";
    this.features[type].push(feat);


    // build out skeleton actions
    dom.querySelectorAll("strong").forEach((node) => {
      const name = node.textContent.trim().replace(/\.$/, '').trim();
      let action = new DDBFeature(name, { ddbMonster: this.ddbMonster, type, actionCopy: false });

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
        action.html = duplicate(actionMatch.html);
        action.feature = duplicate(actionMatch.feature);
        action.feature.name = action.name; // fix up name to make sure things like Attack are included
        action.feature.flags.monsterMunch.actionCopy = true;
      }
      this.features[type].push(action);
    });

    let action = this.features[type].find((act) => act.name == "Legendary Actions");

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
        const switchAction = this.features[type].find((act) => nodeName === act.name);
        if (action.name !== "Legendary Actions" || switchAction) {

          if (switchAction) {
            action = switchAction;
            if (this.html === "") {
              startFlag = true;
            }
          }

          if (action.feature.flags.monsterMunch.actionCopy) return;
          if (node.outerHTML) {
            let outerHTML = node.outerHTML;
            if (switchAction && startFlag) {
              outerHTML = outerHTML.replace(`${nodeName}.`, "");
            }
            action.html += outerHTML;
          }
        }
      });
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
      let pDom = new DocumentFragment();
      $.parseHTML(node.outerHTML).forEach((element) => {
        pDom.appendChild(element);
      });
      const query = pDom.querySelector("em");
      if (!query) return;
      let name = query.textContent.trim().replace(/\./g, '');
      if (!name.includes("Spell;") && !name.includes("Mythic Trait;")) {
        name = name.split(";").pop().trim();
      }
      if (name) {
        const action = new DDBFeature(name, { ddbMonster: this.ddbMonster, type, titleHTML: query.outerHTML, fullName: query.textContent });
        this.features[type].push(action);
      }
    });

    if (this.features[type].length == 0) {
      dom.querySelectorAll("p").forEach((node) => {
        let pDom = new DocumentFragment();
        $.parseHTML(node.outerHTML).forEach((element) => {
          pDom.appendChild(element);
        });
        const query = pDom.querySelector("strong");
        if (!query) return;
        let name = query.textContent.trim().replace(/\./g, '');
        if (!name.includes("Spell;") && !name.includes("Mythic Trait;")) {
          name = name.split(";").pop().trim();
        }
        if (name) {
          const action = new DDBFeature(name, { ddbMonster: this.ddbMonster, type, titleHTML: query.outerHTML, fullName: query.textContent });
          this.features[type].push(action);
        }
      });
    }

    if (this.features[type].length == 0) {
      dom.querySelectorAll("em").forEach((node) => {
        const name = node.textContent.trim().replace(/\.$/, '').trim();
        if (name) {
          const action = new DDBFeature(name, { ddbMonster: this.ddbMonster, type, titleHTML: node.outerHTML, fullName: node.textContent });
          this.features[type].push(action);
        }
      });
    }

    if (this.features[type].length == 0) {
      dom.querySelectorAll("strong").forEach((node) => {
        const name = node.textContent.trim().replace(/\.$/, '').trim();
        if (name) {
          const action = new DDBFeature(name, { ddbMonster: this.ddbMonster, type, titleHTML: node.outerHTML, fullName: node.textContent });
          this.features[type].push(action);
        }
      });
    }

    if (this.features[type].length == 0) {
      const action = new DDBFeature("Special Traits", { ddbMonster: this.ddbMonster, type });
      this.features[type].push(action);
    }

    let action = this.features[type][0];

    dom.childNodes.forEach((node) => {
      const nodeName = node.textContent.split('.')[0].trim();
      let switchAction = this.features[type].find((act) => nodeName === act.name);
      if (action.name.includes("; Recharges after a Short or Long Rest")) action.name = action.name.replace("; Recharges after a Short or Long Rest", "");
      if (!switchAction) {
        switchAction = this.features[type].find((act) => node.textContent.startsWith(act.feature.flags.monsterMunch.fullName));
      }
      let startFlag = false;
      if (switchAction) {
        action = switchAction;
        if (action.html === "") {
          startFlag = true;
        }
      }

      if (node.outerHTML) {
        let outerHTML = node.outerHTML;
        if (switchAction && startFlag) {
          if (action.feature.flags.monsterMunch?.fullName) {
            outerHTML = outerHTML.replace(action.feature.flags.monsterMunch.fullName, "");
          } else {
            outerHTML = outerHTML.replace(nodeName, "");
          }
        }
        const titleDom = new DocumentFragment();
        $.parseHTML(outerHTML).forEach((element) => {
          titleDom.appendChild(element);
        });
        if (titleDom.textContent.startsWith(". ")) outerHTML = outerHTML.replace(". ", "");
        action.html += outerHTML;
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

  generateActions(html, type = "action") {
    if (!html || html.trim() == "") return;

    this.html[type] = DDBFeatureFactory.replaceRollable(utils.replaceHtmlSpaces(`${html}`))
      .replace(/<\/strong> <strong>/g, "")
      .replace(/<\/strong><strong>/g, "")
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

    this.features[type].forEach((feature) => {
      feature.parse();
    });
  }

}
