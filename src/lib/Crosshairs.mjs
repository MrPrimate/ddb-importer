import { utils } from "./_module.mjs";

/**
 * This class is based on Chris' Premades, and is also licensed under MIT.
 * https://github.com/chrisk123999/chris-premades/blob/development/scripts/lib/crosshairs.js
 */

const Sheet = foundry.canvas?.placeables?.MeasuredTemplate ?? MeasuredTemplate;

export default class Crosshairs extends Sheet {
  constructor(config, callbacks = {}) {
    const templateData = {
      t: config.shape ?? "circle",
      user: game.user.id,
      distance: config.size,
      x: config.x,
      y: config.y,
      document: {
        fillColor: config.fillColor,
      },
      width: 1,
      texture: config.texture,
      direction: config.direction,
    };
    const template = new CONFIG.MeasuredTemplate.documentClass(templateData, { parent: canvas.scene });
    super(template);
    this.icon = config.icon ?? Crosshairs.ERROR_TEXTURE;
    this.label = config.label;
    this.labelOffset = config.labelOffset;
    this.tag = config.tag;
    this.drawIcon = config.drawIcon;
    this.drawOutline = config.drawOutline;
    this.fillAlpha = config.fillAlpha;
    this.tileTexture = config.tileTexture;
    this.lockSize = config.lockSize;
    this.lockPosition = config.lockPosition;
    // Equivalent to old Interval
    this.resolution = config.resolution;
    // Optional functions to be called during Crosshairs
    this.callbacks = callbacks;
    // This can be set to true to stop the Crosshairs during flight and return that position
    this.inFlight = false;
    this.cancelled = true;
    // Location of Crosshairs at cancel
    this.rightX = 0;
    this.rightY = 0;
    this.radius = (this.document.distance * this.scene.grid.size) / 2;
  }

  static defaultCrosshairsConfig() {
    return {
      size: canvas.dimensions.distance,
      icon: "icons/svg/dice-target.svg",
      label: "",
      labelOffset: {
        x: 0,
        y: 0,
      },
      tag: "crosshairs",
      drawIcon: true,
      drawOutline: true,
      resolution: 2,
      fillAlpha: 0,
      tileTexture: false,
      lockSize: true,
      lockPosition: false,
      rememberControlled: false,
      // Measured template defaults
      texture: null,
      direction: 0,
      fillColor: game.user.color,
    };
  }

  /**
   * Outwards facing function of the Crosshairs class, will do the constructing itself.
   * @param {object} [config] Configuration for the Crosshairs.
   * @param {object} [callbacks] Callbacks for the Crosshairs.
   * @returns {Promise<object>} Current Crosshairs Data.
   */
  static async showCrosshairs(config = {}, callbacks = {}) {
    config = foundry.utils.mergeObject(config, Crosshairs.defaultCrosshairsConfig(), { overwrite: false });
    let controlled = [];
    if (config.rememberControlled) {
      controlled = canvas.tokens.controlled;
    }
    if (!Object.prototype?.hasOwnProperty?.call(config, "x") && !Object.prototype?.hasOwnProperty?.call(config, "y")) {
      let mouseLoc = canvas.app.renderer.events.pointer.getLocalPosition(canvas.app.stage);
      mouseLoc = Crosshairs.getSnappedPosition(mouseLoc, config.resolution);
      config.x = mouseLoc.x;
      config.y = mouseLoc.y;
    }
    const template = new Crosshairs(config, callbacks);
    await template.drawPreview();
    let dataObj = template.toObject();
    for (const token of controlled) {
      token.control({ releaseOthers: false });
    }
    return dataObj;
  }

  // Will return the current Crosshairs Data
  toObject() {
    const data = foundry.utils.mergeObject(this.document.toObject(), {
      cancelled: this.cancelled,
      scene: this.scene,
      radius: this.radius,
      size: this.document.distance,
    });
    delete data.width;
    return data;
  }

  /**
   * Returns desired types of placeables whose center point
   * is within the crosshairs radius.
   *
   * @param {object} crosshairsData Requires at least {x,y,radius,parent} (all in pixels, parent is a Scene)
   * @param {string|Array<string>} [types='Token'] Collects the desired embedded placeable types.
   * @param {Function} [containedFilter=Gateway._containsCenter] Optional function for determining if a placeable
   *   is contained by the crosshairs. Default function tests for centerpoint containment. {@link Gateway._containsCenter}
   *
   * @returns {Object<string,PlaceableObject>} List of collected placeables keyed by embeddedName
   */
  static collectPlaceables(crosshairsData, types = "Token", containedFilter = Crosshairs._containsCenter) {
    let isArray = Array.isArray(types);
    if (!isArray) types = [types];
    let result = types.reduce((acc, embeddedName) => {
      let collection = crosshairsData.scene.getEmbeddedCollection(embeddedName);
      let contained = collection.filter((document) => {
        return containedFilter(document.object, crosshairsData);
      });
      acc[embeddedName] = contained;
      return acc;
    }, {});
    return isArray ? result : result[types[0]];
  }

  static _containsCenter(placeable, crosshairsData) {
    const calcDistance = (A, B) => {
      return Math.hypot(A.x - B.x, A.y - B.y);
    };
    let distance = calcDistance(placeable.center, crosshairsData);
    return distance <= crosshairsData.radius;
  }

  // Returns the active crosshairs object based on tag given
  static getCrosshair(tag) {
    return canvas.templates.preview.children.find((child) => child.tag === tag);
  }

  static getSnappedPosition({ x, y }, resolution) {
    const offset = resolution < 0 ? canvas.grid.size / 2 : 0;
    const snapped = canvas.grid.getSnappedPoint({ x: x - offset, y: y - offset }, { mode: 1, resolution: resolution });
    return { x: snapped.x + offset, y: snapped.y + offset };
  }

  static ERROR_TEXTURE = "icons/svg/hazard.svg"; // Update this to be a setting

  /**
   * Main function of the Crosshairs Class, will return the finished Crosshairs object which the X and Y can be taken from for position
   *
   * Renders the Crosshairs object and adds it to the canvas preview layer,
   * waiting indefinitely for placement to be decided.
   * @returns {Crosshairs} Returns the Crosshairs object
   */
  async drawPreview() {
    await this.draw();
    this.layer.preview.addChild(this);
    this.layer.interactiveChildren = false;
    this.inFlight = true;
    // Activate interactivity
    this.activatePreviewListeners();
    // Callbacks
    this.callbacks?.show?.(this);
    /* wait _indefinitely_ for placement to be decided. */
    await utils.waitFor(() => !this.inFlight, -1);
    if (this.activeHandlers) {
      this.clearHandlers();
    }
    return this;
  }

  /** @override */
  async draw() {
    this.clear();
    const texture = this.document.texture;
    if (texture) {
      this._texture = await loadTexture(texture, { fallback: "icons/svg/hazard.svg" }); // Update to be the setting
    } else {
      this._texture = null;
    }
    this.template = this.addChild(new PIXI.Graphics());
    this.controlIcon = this.addChild(this._drawControlIcon());
    this.ruler = this.addChild(Crosshairs.drawRulerText());
    this.refresh();
    this._setRulerText();
    if (this.id) this.activateListeners();
    return this;
  }

  // Internal functions for updating text, ruler, and icon, controlled in the draw function
  _setRulerText() {
    this.ruler.text = this.label;
    this.ruler.position.set(
      // eslint-disable-next-line no-mixed-operators
      -this.ruler.width / 2 + this.labelOffset.x,
      // eslint-disable-next-line no-mixed-operators
      this.template.height / 2 + 5 + this.labelOffset.y,
    );
  }

  static drawRulerText() {
    const style = CONFIG.canvasTextStyle.clone();
    style.fontSize = Math.max(Math.round(canvas.dimensions.size * 0.36 * 12) / 12, 36);
    const text = new PreciseText(null, style);
    text.anchor.set(0, 0);
    return text;
  }

  _drawControlIcon() {
    const size = Math.max(Math.round((canvas.dimensions.size * 0.5) / 20) * 20, 40);
    let icon = new ControlIcon({ texture: this.icon, size: size });
    icon.visible = this.drawIcon;
    icon.pivot.set(size * 0.5, size * 0.5);
    icon.angle = this.document.direction;
    return icon;
  }

  /** @override */
  refresh() {
    if (!this.template || this._destroyed) return;
    let d = canvas.dimensions;
    const document = this.document;
    this.position.set(document.x, document.y);
    let { direction, distance } = document;
    distance *= d.size / 2;
    direction = Math.toRadians(direction);
    // Create ray and bounding rectangle
    this.ray = Ray.fromAngle(document.x, document.y, direction, distance);
    // Get the Template shape
    this.t = this.computeShape(this);
    // Draw the Template outline using styles included
    this.template.clear().lineStyle(this._borderThickness, this.document.borderColor, this.drawOutline ? 0.75 : 0);
    if (this._texture) {
      // Will fill texture if included in passed config, tileTexture means it can be tiled without scaling/offset
      let scale = this.tileTexture ? 1 : (distance * 2) / this._texture.width;
      let offset = this.tileTexture ? 0 : distance;
      this.template.beginTextureFill({
        texture: this._texture,
        matrix: new PIXI.Matrix().scale(scale, scale).translate(-offset, -offset),
      });
    } else {
      this.template.beginFill(this.document.fillColor, this.fillAlpha);
    }
    this.template.drawShape(this.t);
    // Update visibility
    if (this.drawIcon) {
      this.controlIcon.visible = true;
      this.controlIcon.border.visible = this._hover;
      this.controlIcon.angle = document.direction;
    }
    // Gives ruler text
    this._setRulerText();
  }

  // eslint-disable-next-line class-methods-use-this
  get layer() {
    return canvas.activeLayer;
  }

  // Activates listeners for the template preview
  activatePreviewListeners() {
    this.moveTime = 0;
    this.initTime = Date.now();
    this.removeAllListeners();
    this.activeMoveHandler = this._mouseMoveHandler.bind(this);
    this.activeLeftClickHandler = this._leftClickHandler.bind(this);
    this.rightDownHandler = this._rightDownHandler.bind(this);
    this.rightUpHandler = this._rightUpHandler.bind(this);
    this.activeWheelHandler = this._mouseWheelHandler.bind(this);

    this.clearHandlers = this._clearHandlers.bind(this);

    // Update placement (mouse-move)
    canvas.stage.on("mousemove", this.activeMoveHandler);

    // Confirm the workflow (left-click)
    canvas.stage.on("mousedown", this.activeLeftClickHandler);

    // Mouse Wheel rotate
    canvas.app.view.onwheel = this.activeWheelHandler;

    // Right click cancel
    canvas.app.view.onmousedown = this.rightDownHandler;
    canvas.app.view.onmouseup = this.rightUpHandler;
  }

  // Handling for mouse events during crosshairs flight
  _mouseMoveHandler(event) {
    event.stopPropagation();
    // Prevents movement from mouse if position is locked
    if (this.lockPosition) return;
    // 20ms throttle using real time
    let now = Date.now();
    if (now - this.moveTime <= 20) return;
    const center = event.data.getLocalPosition(this.layer);
    const { x, y } = Crosshairs.getSnappedPosition(center, this.resolution);
    this.document.updateSource({ x, y });
    this.refresh();
    this.moveTime = now;
    if (now - this.initTime > 1000) {
      canvas._onDragCanvasPan(event.data.originalEvent);
    }
  }

  _leftClickHandler(event) {
    event.preventDefault();
    const document = this.document;
    const thisSceneSize = this.scene.grid.size;
    const destination = Crosshairs.getSnappedPosition(this.document, this.resolution);
    this.radius = (document.distance * thisSceneSize) / 2;
    this.cancelled = false;
    this.document.updateSource({ ...destination });
    this.clearHandlers(event);
    return true;
  }

  /**
   * Rotate the template by 3 degree increments (mouse-wheel)
   * none = rotate 5 degrees
   * shift = scale size (if not locked)
   * ctrl = rotate 30 or 15 degrees (square/hex)
   * alt = zoom canvas
   *
   * @param {MouseEvent} event The mouse event that triggered this function.
   * @returns {undefined}
   */
  _mouseWheelHandler(event) {
    if (event.ctrlKey) event.preventDefault(); // Avoid zooming the browser window
    if (!event.altKey) event.stopPropagation();
    const delta = canvas.grid.type > CONST.GRID_TYPES.SQUARE ? 30 : 15;
    const snap = event.ctrlKey ? delta : 5;
    const document = this.document;
    const thisSceneSize = this.scene.grid.size;
    if (event.shiftKey && !this.lockSize) {
      // eslint-disable-next-line no-mixed-operators
      let distance = document.distance + 0.25 * Math.sign(event.deltaY);
      distance = Math.max(distance, 0.25);
      this.document.updateSource({ distance });
      this.radius = (document.distance * thisSceneSize) / 2;
    } else if (!event.altKey) {
      // eslint-disable-next-line no-mixed-operators
      const direction = document.direction + snap * Math.sign(event.deltaY);
      this.document.updateSource({ direction });
    }
    this.refresh();
  }

  _rightDownHandler(event) {
    if (event.button !== 2) return;
    this.rightX = event.screenX;
    this.rightY = event.screenY;
  }

  _rightUpHandler(event) {
    if (event.button !== 2) return;
    const isWithinThreshold = (current, previous) => Math.abs(current - previous) < 10;
    if (isWithinThreshold(this.rightX, event.screenX) && isWithinThreshold(this.rightY, event.screenY)) {
      this.cancelled = true;
      this.clearHandlers(event);
    }
  }

  // Cleans up not-needed handlers
  // eslint-disable-next-line no-unused-vars
  _clearHandlers(event) {
    this.template.destroy();
    this._destroyed = true;
    this.layer.preview.removeChild(this);
    this.inFlight = false;
    canvas.stage.off("mousemove", this.activeMoveHandler);
    canvas.stage.off("mousedown", this.activeLeftClickHandler);
    canvas.app.view.onmousedown = null;
    canvas.app.view.onmouseup = null;
    canvas.app.view.onwheel = null;
    if (this.actorSheet) this.actorSheet.maximize();
    canvas.mouseInteractionManager.reset({ interactionData: true });
    this.layer.interactiveChildren = true;
  }

  // Wrap the template's computeShape function and fix sizing
  computeShape(crosshairs) {
    let shape = crosshairs._computeShape();
    if (crosshairs.document.t === "rect") {
      let length = this.document.distance * this.scene.grid.size;
      shape.height = length;
      shape.width = length;
      shape.y = this.scene.grid.size / -2;
      shape.x = this.scene.grid.size / -2;
    } else if (crosshairs.document.t === "ray") {
      // Figure out a way to get the template to center on the crosshairs...
    } else if (crosshairs.document.t === "circle" && !game.settings.get("core", "gridTemplates")) {
      shape.radius = Math.round(shape.radius / (canvas.grid.size / 2)) * (canvas.grid.size / 2);
    }
    return shape;
  }

  static async aimCrosshair({ token, maxRange, crosshairsConfig, centerpoint, drawBoundries,
    customCallbacks, trackDistance = true, fudgeDistance = 0, validityFunctions = [] } = {},
  ) {
    let distance = 0;
    let widthAdjust = 0;
    if (!centerpoint && token) {
      let actualHalf = token.document.width / 2;
      widthAdjust += canvas.grid.distance * Math.floor(actualHalf);
      if (!fudgeDistance && widthAdjust !== actualHalf * canvas.grid.distance) {
        fudgeDistance = 2.5;
      }
      fudgeDistance += widthAdjust;
    }
    centerpoint = centerpoint ?? token?.center ?? canvas.app.renderer.events.pointer.getLocalPosition(canvas.app.stage);

    let drawing;
    let container;

    const checkDistance = async (crosshairs) => {
      if (maxRange && drawBoundries) {
        let radius = canvas.grid.size * ((maxRange + fudgeDistance + widthAdjust) / canvas.grid.distance);
        drawing = new PIXI.Graphics();
        drawing.lineStyle(5, 0xffffff);
        let matchTemplates = game.settings.get("core", "gridTemplates")
          && game.settings.get("core", "gridDiagonals") !== CONST.GRID_DIAGONALS.EXACT;
        if (matchTemplates) {
          drawing.drawPolygon(canvas.grid.getCircle(centerpoint, maxRange + fudgeDistance + widthAdjust));
        } else {
          drawing.drawCircle(centerpoint.x, centerpoint.y, radius);
        }
        drawing.tint = 0x32cd32;
        container = new PIXI.Container();
        container.addChild(drawing);
        canvas.drawings.addChild(container);
      }
      while (crosshairs.inFlight) {
        await utils.wait(100);
        if (trackDistance) {
          distance = canvas.grid.measurePath([centerpoint, crosshairs]).distance.toNearest(0.01);
          distance = Math.max(0, distance - widthAdjust);
          // Below checks if token can see place wants to move thing to - sort of
          if (
            token.checkCollision(crosshairs, { origin: token.center, type: "move", mode: "any" })
            || distance > maxRange
            || validityFunctions.some((i) => !i(crosshairs))
          ) {
            crosshairs.icon = "icons/svg/hazard.svg";
            if (drawing) drawing.tint = 0xff0000;
          } else {
            crosshairs.icon = crosshairsConfig?.icon;
            if (drawing) drawing.tint = 0x32cd32;
          }
          crosshairs.draw();
          crosshairs.label = distance + "/" + maxRange + "ft.";
        }
      }
    };

    const callbacks = {
      show: checkDistance,
      ...(customCallbacks ?? {}),
    };
    let options = {};
    if (trackDistance) options.label = "0ft";
    options = {
      ...options,
      ...crosshairsConfig,
    };
    if (!maxRange) {
      const result = await Crosshairs.showCrosshairs(options);
      return result;
    }
    const result = await Crosshairs.showCrosshairs(options, callbacks);
    if (drawing) {
      drawing.destroy();
      container.destroy();
    }
    return result;
  }
}
