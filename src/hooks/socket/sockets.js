import logger from "../../logger.js";

/**
 * This is a stripped down socketlib like implementation
 *  for some unique circumstances where confusion arises when using
 * with DAE GM Macros
 *
 * This is a MIT license and the inspiration is https://github.com/manuelVo/foundryvtt-socketlib/
 */

export class DDBSocket {

  constructor() {
    this.functions = new Map();
    this.requests = new Map();
    this.name = "module.ddb-importer";

    game.socket.on(this.name, this._received.bind(this));
  }

  register(name, f) {
    this.functions.set(name, f);
  }

  static isExecutingGM() {
    if (!game.user.isGM) return false;
    const online = game.users.filter((u) => u.isGM && u.active);
    // run as lowest ranking online GM
    return !online.some((u) => u.id < game.user.id);
  }

  #getFunction(func) {
    if (func instanceof Function) {
      for (const [key, value] of this.functions.entries()) {
        if (value === func) return [key, func];
      }
      throw new Error(`Function '${func.name}' has not been registered with DDB Importer Socket`);
    } else {
      const fn = this.functions.get(func);
      if (fn) return [func, fn];
      throw new Error(`No DDB socket function with the name '${func}' has been registered.`);
    }
  }

  async _receiveRequest(message, senderId) {
    const { functionName, args, recipient, id } = message;
    if (recipient instanceof Array) {
      if (!recipient.includes(game.userId)) return;
    } else {
      switch (recipient) {
        case "GM":
        case "gm":
          if (!DDBSocket.isExecutingGM()) return;
          break;
        default:
          logger.error(
            `Unknown recipient '${recipient}' when trying to execute '${functionName}' for 'DDB Importer internal socket handler.`,
          );
          return;
      }
    }

    const [name, func] = this.#getFunction(functionName);
    const socketData = { userId: senderId };

    try {
      const result = await func.call({ socketData }, ...args);
      game.socket.emit(this.name, { id, result, type: "RESULT" });
    } catch (e) {
      logger.error(`An exception occurred while executing ddb macro function '${name}'.`, { name, func });
      game.socket.emit(this.name, { id, type: "EXCEPTION", userId: game.userId });
      throw e;
    }
  }

  // eslint-disable-next-line no-unused-vars
  _receiveResponse(message, _senderId) {
    const { id, result, type } = message;
    const request = this.requests.get(id);
    if (!request) return;
    switch (type) {
      case "RESULT":
        request.resolve(result);
        break;
      case "EXCEPTION":
        request.reject(
          new Error(`An exception occurred during remote execution of DDB function '${request.functionName}'. Please see ${game.users.get(message.userId).name}'s error console for details.`),
        );
        break;
      default:
        request.reject(
          new Error(`Unknown result type '${type}' for DDB function '${request.functionName}'. Catastrophic error.`),
        );
        break;
    }
    this.requests.delete(id);
  }

  _received(message, senderId) {
    if (["REQUEST"].includes(message.type)) {
      this._receiveRequest(message, senderId);
    } else {
      this._receiveResponse(message, senderId);
    }
  }

  _sendRequest(functionName, args, recipient) {
    const message = {
      functionName,
      args,
      recipient,
      type: "REQUEST",
      id: foundry.utils.randomID(),
    };
    const promise = new Promise((resolve, reject) =>
      this.requests.set(message.id, { functionName, resolve, reject, recipient }),
    );
    game.socket.emit(this.name, message);
    return promise;
  }

  static _executeLocal(func, ...args) {
    const socketData = { userId: game.userId };
    return func.call({ socketData }, ...args);
  }

  async executeAsGM(functionName, ...args) {
    const [name, func] = this.#getFunction(functionName);
    if (game.user.isGM) {
      return DDBSocket._executeLocal(func, ...args);
    } else {
      if (!game.users.find((u) => u.isGM && u.active)) {
        throw new Error(`Could not execute DDB function '${name}' (${func.name}) as GM, because no GM is connected.`);
      }
      return this._sendRequest(name, args, "GM");
    }
  }

  async executeAsUser(functionName, userId, ...args) {
    const [name, func] = this.#getFunction(functionName);
    if (userId === game.userId) return DDBSocket._executeLocal(func, ...args);
    const user = game.users.get(userId);
    if (!user) throw new Error(`No user with id '${userId}' exists.`);
    if (!user.active) throw new Error(`User '${user.name}' (${userId}) is not online.`);
    return this._sendRequest(name, args, [userId]);
  }

}

export function setupSockets() {
  const socket = new DDBSocket();
  socket.register("simpleButtonDialog", DDBImporter.lib.DialogHelper.buttonDialog);
  socket.register("chooserDialog", DDBImporter.lib.DialogHelper.ChooserDialog.Ask);
  socket.register("ddbMacro", DDBImporter.lib.DDBMacros.executeDDBMacro);
  socket.register("ddbMacroFunction", DDBImporter.lib.DDBSimpleMacro.execute);
  socket.register("ddbSimpleMacro", DDBImporter.lib.DDBSimpleMacro.execute);
  socket.register("addCondition", DDBImporter.lib.DDBEffectHelper.addCondition);
  socket.register("removeCondition", DDBImporter.lib.DDBEffectHelper.removeCondition);

  globalThis.DDBImporter.socket = socket;
}
