import utils from "../utils.js";
// import queryEntity from "./type/queryEntity.js";
// import addEntity from "./type/addEntity.js";
import roll from "./type/roll.js";

import query from "./type/query/index.js";
import add from "./type/add/index.js";

const REQUIRED_EXTENSION_VERSION = "3.1.6";

/* eslint-disable no-bitwise */
let uuidv4 = () => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    var r = (Math.random() * 16) | 0,
      v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};
/* eslint-enable no-bitwise */

class EventPort {
  constructor() {
    this.id = uuidv4();
  }

  start() {
    document.addEventListener("ddb-importer:module:message", async (event) => {
      utils.log("Foundry module: Received message", "communication");
      utils.log(event.detail, "communication");
      let { head, body } = event.detail;

      // switching to see how to process each message received
      if (head.type === "query") {
        try {
          // Legacy: Old Webstore extenion
          if (typeof body === "string" && body === "id") {
            body = {
              type: body,
            };
          }
          let result = await query(body);
          utils.log("Dispatching result", "messaging");
          let message = {
            detail: {
              head: {
                id: head.id,
                type: body.type,
                code: 200,
              },
              body: result,
            },
          };
          document.dispatchEvent(new CustomEvent(head.id, message));
        } catch (error) {
          utils.log(error);
          document.dispatchEvent(
            new CustomEvent(head.id, {
              detail: {
                head: {
                  id: head.id,
                  type: body.type,
                  code: 500,
                },
                body: error.message,
              },
            })
          );
        }
      }

      if (head.type === "import" || head.type === "add") {
        try {
          let result = await add(body);
          document.dispatchEvent(
            new CustomEvent(head.id, {
              detail: {
                head: {
                  id: head.id,
                  type: body.type,
                  code: 200,
                },
                body: result,
              },
            })
          );
        } catch (error) {
          document.dispatchEvent(
            new CustomEvent(head.id, {
              detail: {
                head: {
                  id: head.id,
                  type: body.type,
                  code: 500,
                },
                body: error.message,
              },
            })
          );
        }
      }

      if (head.type === "roll") {
        let entityName = body.data.name;

        // check the current scene first
        let persona = undefined;
        if (game.scenes.active) {
          let token = game.scenes.active.data.tokens.find((token) => {
            return (
              (token.actorData && token.actorData.name && token.actorData.name === entityName) ||
              token.name === entityName
            );
          });

          if (token) {
            persona = game.actors.entities.find((actor) => actor.id === token.actorId);

            // overwrite the name for the roll
            if (token.actorData.name) {
              persona.data.name = token.actorData.name;
            }
          }
        }
        if (persona === undefined) {
          persona = game.actors.entities.find((actor) => actor.name === entityName);
        }

        // report failure to roll to the user
        if (persona === undefined) {
          document.dispatchEvent(
            new CustomEvent(head.id, {
              detail: {
                head: {
                  id: head.id,
                  type: body,
                  code: 404,
                },
                body: entityName,
              },
            })
          );
        } else {
          roll(persona, body.data)
            .then((response) => {
              utils.log("Roll successful", "extension");
              utils.log(response, "extension");
              document.dispatchEvent(
                new CustomEvent(head.id, {
                  detail: {
                    head: {
                      id: head.id,
                      type: body,
                      code: 200,
                    },
                    body: response,
                  },
                })
              );
            })
            .catch((error) => {
              utils.log("Error in import", "extension");
              utils.log(error, "extension");
              document.dispatchEvent(
                new CustomEvent(head.id, {
                  detail: {
                    head: {
                      id: head.id,
                      type: body,
                      code: error.code,
                    },
                    body: error.message,
                  },
                })
              );
            });
        }
      }

      if (head.type === "ping") {
        utils.log("Received ping from extension");
        utils.log(event.detail);
        // display the connection version to Foundry
        if (body && body.version) {
          // check the version number
          if (utils.versionCompare(body.version, REQUIRED_EXTENSION_VERSION) === -1) {
            window.ddbimporter.notification.show(
              "<h2>Chrome extension outdated</h2>Chrome extension <b>v" +
                body.version +
                "</b> connected, but <b>v" +
                REQUIRED_EXTENSION_VERSION +
                "</b> is required.</p><p>Please wait for the update to be applied for you in the next couple of hours or uninstall and re-install the extension manually to receive the update.</p>",
              null
            );
            window.ddbimporter.isConnected = true;
            window.ddbimporter.pid = body.pid;
          } else {
            window.ddbimporter.notification.show("Chrome extension <b>v" + body.version + "</b> connected.");
            window.ddbimporter.isConnected = true;
            window.ddbimporter.pid = body.pid;

            // display an indicator to the user that the connection is established
            $("#players").find("h3").addClass("ddbimporterConnected");
          }
        }
        // answer back to the extensions wanting to establish communications
        this.send("ping").then((response) => utils.log(response, "communication"));
      }
    });

    // try to establish communications with an already injected extension
    this.send("ping").then((response) => utils.log(response, "communication"));
  }

  send(type, data = null) {
    return new Promise((resolve) => {
      let message = {
        head: {
          id: this.id,
          type: type,
        },
        body: data,
      };

      utils.log("Foundry module: Sending data", "communication");
      utils.log(message);

      // once a response is received, dispatch it to the port again
      let listener = (event) => {
        utils.log("Foundry module: Received response", "communication");
        utils.log(event.detail, "communication");

        resolve(event.detail);
        // remove the event listener for this message id
        document.removeEventListener(message.head.id, listener);
      };

      document.addEventListener(message.head.id, listener);
      document.dispatchEvent(
        new CustomEvent("ddb-importer:extension:message", {
          detail: message,
        })
      );
    });
  }
}

export default EventPort;
