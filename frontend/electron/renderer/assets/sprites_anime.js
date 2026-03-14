/**
 * This file also creates sprites, textures, and animation renders similar to sprites.js
 * However, this file also integrates the animeJS framework into the Coral Net animations.
 *
 * It contains text options, bounding background boxes, pullout menus, and more.
 */
import * as PIXI from "pixi.js";
import { RESPONDERS, RESPONDER_LORE } from "../app.js";
import { subscribeResponder, getResponder } from "../state/store.js";
import anime from "https://cdn.jsdelivr.net/npm/animejs@3.2.2/lib/anime.es.js";

/**
 * This gradient text allows the calling routine to define the text style required for the gradient,
 * and applies two colors into a gradient to the provided text.
 *
 * For the gradient, a canvas document needs to be created inside the staged scene, and needs the gradient overlay
 * set on the canvas. The canvas is then exported as a PIXI Texture to display onto the application.
 *
 * Since it is a pre-generated canvas, the text is static and cannot be animated with moving features.
 */
export class GradientText {
  constructor(options = {}) {
    const {
      text = "",
      fontSize = 48,
      fontFamily = "Arial",
      gradientColor1 = "#ffffff",
      gradientColor2 = "#00ced1",
      x = 0,
      y = 0,
      bold = true,
      shadowColor = "#000000",
      shadowBlur = 10,
      padding = 40,
    } = options;

    this.settings = {
      text,
      fontSize,
      fontFamily,
      gradientColor1,
      gradientColor2,
      bold,
      shadowColor,
      shadowBlur,
      padding,
    };

    this.sprite = new PIXI.Sprite(PIXI.Texture.EMPTY);
    this.sprite.anchor.set(0.5);
    this.setPosition(x, y);

    this.update();
  }

  _generateCanvas() {
    const {
      text,
      fontSize,
      fontFamily,
      gradientColor1,
      gradientColor2,
      bold,
      shadowColor,
      shadowBlur,
      padding,
    } = this.settings;

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    const weight = bold ? "bold" : "normal";
    const font = `${weight} ${fontSize}px ${fontFamily}`;

    context.font = font;
    const metrics = context.measureText(text);

    canvas.width = Math.ceil(metrics.width + padding * 2);
    canvas.height = Math.ceil(fontSize * 1.5 + padding);

    context.font = font;
    context.textBaseline = "middle";

    context.shadowColor = shadowColor;
    context.shadowBlur = shadowBlur;

    const textTop = (canvas.height - fontSize) / 2;
    const textBottom = (canvas.height + fontSize) / 2;

    const gradient = context.createLinearGradient(0, textTop, 0, textBottom);
    gradient.addColorStop(0, gradientColor1 || "#ffffff");
    gradient.addColorStop(1, gradientColor2 || "#000000");

    context.fillStyle = gradient;
    context.fillText(text, padding, canvas.height / 2);

    return canvas;
  }

  update() {
    const canvas = this._generateCanvas();
    const newTexture = PIXI.Texture.from(canvas);

    if (this.sprite.texture && this.sprite.texture !== PIXI.Texture.EMPTY) {
      this.sprite.texture.destroy(true);
    }

    this.sprite.texture = newTexture;
  }

  setPosition(x, y) {
    this.sprite.position.set(x, y);
  }

  setText(newText) {
    this.settings.text = newText;
    this.update();
  }
}

/**
 * This text type allows the calling routine to apply pulsing and strobing effects to a given text and
 * its bounding box.
 *
 * It can increase and decrease in size, transparency, and can apply default text styles to all pulsing animations.
 */
export class PulseText {
  constructor(text = "", style = {}, options = {}) {
    this.options = {
      minScale: 0.9,
      maxScale: 1.1,
      minAlpha: 0.5,
      maxAlpha: 1,
      duration: 1200,
      easing: "easeInOutSine",
      ...options,
    };

    this.container = new PIXI.Container();

    this.textObject = new PIXI.Text(text, style);
    this.textObject.anchor.set(0.5);

    this.container.addChild(this.textObject);

    this._animation = null;
    this.play();
  }

  play() {
    if (this._animation) {
      this._animation.pause();
    }

    this._animation = anime({
      targets: this.textObject,
      alpha: [this.options.minAlpha, this.options.maxAlpha],
      scale: [this.options.minScale, this.options.maxScale],
      duration: this.options.duration,
      easing: this.options.easing,
      direction: "alternate",
      loop: true,
    });
  }

  stop() {
    if (this._animation) {
      this._animation.pause();
      this._animation = null;
    }
  }

  setText(newText) {
    this.textObject.text = newText;
  }

  destroy() {
    this.stop();
    anime.remove(this.textObject);

    if (this.container && !this.container.destroyed) {
      this.container.destroy({ children: true });
    }
  }
}

/**
 * This text class allows the calling routine to invoke a text type that imitates a typewriter
 * where the next character in the displayed text is staggered and appears character by character
 * based on a specified per char duration speed.
 *
 * This is used to display subtitles, print instructions and controls, and so on.
 */
export class TypewriterText {
  constructor(text = "", style = {}, options = {}) {
    this.fullText = text;

    this.options = {
      durationPerChar: 40,
      easing: "linear",
      loop: false,
      ...options,
    };

    this.container = new PIXI.Container();

    this.textObject = new PIXI.Text("", style);
    this.textObject.anchor.set(0.5);
    this.container.addChild(this.textObject);

    this._animation = null;
    this._state = { chars: 0 };
  }

  appendText(extraText) {
    if (!extraText) return;

    const previousLength = this.fullText.length;
    this.fullText += extraText;

    if (!this._animation) {
      this.play();
      return;
    }

    const currentChars = Math.floor(this._state.chars);

    this._animation.pause();

    this._animation = anime({
      targets: this._state,
      chars: this.fullText.length,
      duration:
        (this.fullText.length - currentChars) * this.options.durationPerChar,
      easing: this.options.easing,
      round: 1,
      update: () => {
        if (!this.textObject || this.textObject.destroyed) return;

        const count = Math.floor(this._state.chars);
        this.textObject.text = this.fullText.slice(0, count);
      },
    });
  }

  setText(newText) {
    this.fullText = newText;
    this.textObject.text = "";
  }

  play() {
    if (this._animation) {
      this._animation.pause();
    }

    this._state.chars = 0;
    this.textObject.text = "";

    this._animation = anime({
      targets: this._state,
      chars: this.fullText.length,
      duration: this.fullText.length * this.options.durationPerChar,
      easing: this.options.easing,
      round: 1,
      update: () => {
        if (!this.textObject || this.textObject.destroyed) return;

        const count = Math.floor(this._state.chars);
        this.textObject.text = this.fullText.slice(0, count);
      },
      complete: () => {
        if (this.options.loop) {
          this.play();
        }
      },
    });
  }

  stop() {
    if (this._animation) {
      this._animation.pause();
      this._animation = null;
    }
  }

  destroy() {
    this.stop();
    anime.remove(this._state);
    if (this.container && !this.container.destroyed) {
      this.container.destroy({ children: true });
    }
  }
}

/**
 * A simple box implementation that can be used as a high contrast background for
 * text objects, images, cards, and so on.
 *
 * Generic class that is made to encapsulate any objects or sprites created in the rest of the file.
 * The reshape function automatically refits the box to the given object with a specified padding
 * going between the content and the bounding box.
 */
export class ModernBox {
  constructor(padding = 30, color = 0x5ebd9d, alpha = 0.9) {
    this.graphics = new PIXI.Graphics();
    this.padding = padding;
    this.color = color;
    this.boxAlpha = alpha;
  }

  reshape(targets, fixedSize = null) {
    if (!this.graphics || this.graphics.destroyed) return;

    let width, height, minX, minY;

    if (fixedSize) {
      width = fixedSize.width;
      height = fixedSize.height;
      minX = -width / 2;
      minY = -height / 2;
    } else {
      const targetArray = Array.isArray(targets) ? targets : [targets];
      let tminX = Infinity,
        tminY = Infinity;
      let tmaxX = -Infinity,
        tmaxY = -Infinity;

      targetArray.forEach((target) => {
        if (!target || target.destroyed) return;

        let x, y, w, h;

        // Handle objects with anchors (Sprite, Text)
        if (target.anchor) {
          w = target.width;
          h = target.height;
          x = target.x - target.anchor.x * w;
          y = target.y - target.anchor.y * h;
        } else {
          // Handle Containers or Graphics without anchors
          const bounds = target.getLocalBounds();
          w = bounds.width;
          h = bounds.height;
          x = target.x + bounds.x;
          y = target.y + bounds.y;
        }

        // Skip invalid/empty calculations
        if (w === 0 && h === 0) return;

        tminX = Math.min(tminX, x);
        tminY = Math.min(tminY, y);
        tmaxX = Math.max(tmaxX, x + w);
        tmaxY = Math.max(tmaxY, y + h);
      });

      width = tmaxX - tminX + this.padding * 2;
      height = tmaxY - tminY + this.padding * 2;
      minX = tminX - this.padding;
      minY = tminY - this.padding;
    }

    this.graphics.clear();
    this.graphics.fill({ color: this.color, alpha: this.boxAlpha });
    this.graphics.roundRect(minX, minY, width, height, 12);
    this.graphics.fill();
    this.graphics.stroke({ width: 1, color: 0x333333 });
  }
}

/**
 * A specialized version of ModernBox that applies transparent background and highlight
 * effects to a ModernBox object to make it look like a glass box, which is used to imitate
 * an aquarium or to display background objects.
 *
 * Also has ripple functionality that can generate periodic rippling animations originating from the bounding box.
 */
export class GlassBox extends ModernBox {
  constructor(padding = 30) {
    super(padding, 0xffffff, 0.1);
    this.rippleContainer = new PIXI.Container();
    this.graphics.addChild(this.rippleContainer);
  }

  reshape(targets, fixedSize = null) {
    if (targets !== null) {
      const target = Array.isArray(targets) ? targets[0] : targets;
      if (target && target.text === "") {
        this.graphics.clear();
        return;
      }
    }

    super.reshape(targets, fixedSize);
    if (this.graphics.context && !this.graphics.destroyed) {
      this.drawGlassEffects(targets, fixedSize);
    }
  }

  ripple(rippleColor = 0xffffff) {
    if (!this.graphics || this.graphics.destroyed) return;

    const bounds = this.graphics.getLocalBounds();
    const width = bounds.width || 100;
    const height = bounds.height || 40;
    const centerX = bounds.x + width / 2;
    const centerY = bounds.y + height / 2;

    for (let i = 1; i <= 4; i++) {
      const g = new PIXI.Graphics();
      this.rippleContainer.addChild(g);

      const state = {
        expansion: 0,
        alpha: 0.8 * (1 - i / 5),
      };

      anime({
        targets: state,
        expansion: i * 40,
        alpha: 0,
        duration: 1500,
        delay: i * 100,
        easing: "easeOutExpo",
        update: () => {
          if (g.destroyed) return;
          g.clear();
          g.stroke({ width: 2, color: rippleColor, alpha: state.alpha });
          // Draw expanding from center
          g.roundRect(
            centerX - (width + state.expansion) / 2,
            centerY - (height + state.expansion) / 2,
            width + state.expansion,
            height + state.expansion,
            20 + i * 2,
          );
          g.stroke();
        },
        complete: () => g.destroy(),
      });
    }
  }

  drawGlassEffects(targets, fixedSize) {
    let width, height, minX, minY;

    if (fixedSize) {
      width = fixedSize.width;
      height = fixedSize.height;
      minX = -width / 2;
      minY = -height / 2;
    } else {
      const targetArray = Array.isArray(targets) ? targets : [targets];
      let tminX = Infinity,
        tminY = Infinity;
      let tmaxX = -Infinity,
        tmaxY = -Infinity;

      targetArray.forEach((t) => {
        if (!t || t.destroyed) return;
        const w = t.width;
        const h = t.height;
        const ax = t.anchor ? t.anchor.x : 0;
        const ay = t.anchor ? t.anchor.y : 0;
        const x = t.x - ax * w;
        const y = t.y - ay * h;
        tminX = Math.min(tminX, x);
        tminY = Math.min(tminY, y);
        tmaxX = Math.max(tmaxX, x + w);
        tmaxY = Math.max(tmaxY, y + h);
      });

      width = tmaxX - tminX + this.padding * 2;
      height = tmaxY - tminY + this.padding * 2;
      minX = tminX - this.padding;
      minY = tminY - this.padding;
    }

    this.graphics.fill({ color: 0xffffff, alpha: 0.05 });
    this.graphics.roundRect(minX + 4, minY + 4, width - 8, height - 8, 15);
    this.graphics.fill();

    this.graphics.fill({ color: 0xffffff, alpha: 0.2 });
    this.graphics.roundRect(minX + 5, minY + 5, width - 10, height - 10, 15);
    this.graphics.fill();

    this.graphics.stroke({
      width: 2.5,
      color: "#b0cbfc",
      alpha: 0.8,
      alignment: 0,
    });
    this.graphics.roundRect(minX, minY, width, height, 20);
    this.graphics.stroke();

    this.graphics.poly([
      minX + 25,
      minY + 2,
      minX + width - 25,
      minY + 2,
      minX + width - 15,
      minY + 8,
      minX + 15,
      minY + 8,
    ]);
    this.graphics.fill({ color: 0xffffff, alpha: 0.3 });
  }
}

/**
 * Mic Indicator class that uses MIC_STARTED and MIC_STOPPED events from the main process
 * to display mic activity on the frontend to let the user know when the mic is picking up their
 * input and when it is not.
 *
 * This is not a generic class and it only applies when the Speech To Text backend process is spawned
 * and functional in the main process pipeline.
 *
 * It uses randomized sine wave animations to imitate random frequency input for the voice detection and then
 * leverages the events to change the text based on input status (Standby/Listening).
 */
export class MicIndicator {
  constructor(app, width = 300, height = 100) {
    this.app = app;
    this.container = new PIXI.Container();
    this.isActive = false;

    this.waveProps = {
      amplitude: 0,
      phase: 0,
      frequency: 0.1,
      speed: 0.15,
    };

    this.header = new PIXI.Text({
      text: "Mic Standby",
      style: {
        fontFamily: "Arial",
        fontSize: 18,
        fill: "#ffff00",
        fontWeight: "bold",
        letterSpacing: 1,
      },
    });
    this.header.anchor.set(0.5, 0.5);
    this.header.y = -height / 2 + 30;

    this.waveOffset = height / 4;

    this.waveGraphics = new PIXI.Graphics();
    this.glassBox = new GlassBox(30);

    this.container.addChild(this.glassBox.graphics);
    this.container.addChild(this.header);
    this.container.addChild(this.waveGraphics);

    this.width = width;
    this.height = height;
    this.glassBox.reshape([], { width: this.width, height: this.height });

    this.app.ticker.add(this.update, this);
  }

  update(ticker) {
    if (this.waveGraphics.destroyed) return;

    this.waveGraphics.clear();
    this.waveGraphics.poly(this.calculateWavePoints());
    this.waveGraphics.stroke({
      width: 4,
      color: this.isActive ? "#37ff24" : "#f70101",
      alpha: 0.8,
    });

    this.waveProps.phase += this.waveProps.speed * (this.isActive ? 1 : 0.2);
  }

  calculateWavePoints() {
    const points = [];
    const segments = 60;
    const waveWidth = this.width - 60;
    const startX = -waveWidth / 2;

    for (let i = 0; i <= segments; i++) {
      const x = startX + (i / segments) * waveWidth;

      const variation = this.isActive ? Math.random() * 0.2 + 0.9 : 0.1;
      const y =
        Math.sin(i * this.waveProps.frequency + this.waveProps.phase) *
          this.waveProps.amplitude *
          variation +
        Math.sin(
          i * this.waveProps.frequency * 1.7 + this.waveProps.phase * 1.3,
        ) *
          this.waveProps.amplitude *
          0.3;
      points.push(x, y + this.waveOffset);
    }

    return points;
  }

  setVoiceActive(active) {
    if (this.isActive === active) return;
    this.isActive = active;

    this.header.text = active ? "Collecting Input..." : "Mic Standby";
    this.header.style = {
      fontFamily: "Arial",
      fontSize: 18,
      fill: this.isActive ? "#ffff00" : "#eef071",
      fontWeight: "bold",
      letterSpacing: 1,
    };

    anime({
      targets: this.waveProps,
      amplitude: active ? 20 : 0,
      duration: 400,
      easing: "easeOutElastic(1, .6)",
    });

    if (active) {
      this.glassBox.ripple("#ff9100");
    }
  }

  destroy() {
    this.app.ticker.remove(this.update);
    this.container.destroy({ children: true });
  }
}

/**
 * This random fact generator box spawns in the idle state on the arrow down key press.
 * It has nested API calls for multiple sequential fallbacks to ensure that the facts never stop generating.
 *
 * It calls on Ninjas, Wikipedia, OpenTDB, or as a final fallback, calls on a local repository of fun facts.
 *
 * The facts are bounded in a fixed size GlassBox object, and has a GradientText title.
 */
export class FunFactBox {
  constructor(app, factsList = []) {
    this.app = app;
    this.factsList = factsList;

    this.container = new PIXI.Container();

    this.header = new GradientText({
      text: "Random Fact Generator",
      fontSize: 56,
      fontFamily: "Brush Script MT",
      gradientColor1: "#f53500",
      gradientColor2: "#a8540a",
      x: 0,
      y: -160,
      bold: true,
      shadowColor: "#000000",
      shadowBlur: 12,
    });

    this.typewriter = new TypewriterText(
      "",
      {
        fill: "#ffea00",
        fontSize: 28,
        fontFamily: "Georgia",
        wordWrap: true,
        wordWrapWidth: 600,
        align: "center",
      },
      { durationPerChar: 35 },
    );
    this.typewriter.container.position.set(0, 20);

    this.box = new GlassBox(40);
    this.box.graphics.position.set(0, 0);

    this.container.addChild(this.box.graphics);
    this.container.addChild(this.header.sprite);
    this.container.addChild(this.typewriter.container);

    this._reshapeBox();
  }

  _reshapeBox() {
    const size = { width: 800, height: 500 };
    this.box.reshape(null, size);
  }

  applyFact(text) {
    this.typewriter.setText(text);
    this.typewriter.play();
    this._reshapeBox();
  }

  updateFunFact() {
    const applyFact = (text) => this.applyFact(this._decodeHTML(text));

    const fallbackLocal = () => {
      if (!this.factsList.length) return;
      const randomIndex = Math.floor(Math.random() * this.factsList.length);
      applyFact(this.factsList[randomIndex]);
    };

    const fetchNinjas = () => {
      const url =
        "https://api.api-ninjas.com/v1/historicalevents?text=computer";
      //const apiKey = window.fishbowl?.config?.apiNinjasKey ?? "";
      const apiKey = "";
      return fetch(url, {
        method: "GET",
        headers: { "X-Api-Key": apiKey, "Content-Type": "application/json" },
      })
        .then((res) => {
          if (!res.ok) throw new Error("Ninjas limit reached");
          return res.json();
        })
        .then((data) => {
          if (!data?.length) throw new Error("No Ninjas data");
          const item = data[Math.floor(Math.random() * data.length)];
          applyFact(`${item.year}: ${item.event}`);
        });
    };

    const fetchWiki = () => {
      const today = new Date();
      const url = `https://en.wikipedia.org/api/rest_v1/feed/onthisday/selected/${today.getMonth() + 1}/${today.getDate()}`;
      return fetch(url)
        .then((res) => res.json())
        .then((data) => {
          if (!data.selected?.length) throw new Error("No Wiki data");
          const event =
            data.selected[Math.floor(Math.random() * data.selected.length)];
          applyFact(`${event.year}: ${event.text}`);
        });
    };

    const fetchTrivia = () => {
      return fetch(
        "https://opentdb.com/api.php?amount=1&category=18&type=boolean",
      )
        .then((res) => res.json())
        .then((data) => {
          if (!data.results?.length) throw new Error("No Trivia data");
          applyFact(data.results[0].question);
        });
    };

    fetchNinjas()
      .catch(() => fetchWiki())
      .catch(() => fetchTrivia())
      .catch(() => fallbackLocal());
  }

  _decodeHTML(html) {
    const txt = document.createElement("textarea");
    txt.innerHTML = html;
    return txt.value;
  }

  setPosition(x, y) {
    this.container.position.set(x, y);
  }

  destroy() {
    this.typewriter.destroy();
    this.container.destroy({ children: true });
  }
}

/**
 * A generic class for pullout menu backgrounds, that allows the calling routine
 * to define a bouncing tab label that contains a fullscreen background that is tucked away
 * in the specified side of the screen, with a label that overflows on the screen and bounces.
 *
 * This would allow an arrow keypress to pullout a menu and roll it back when done viewing. It also
 * allows a close hint text to be displayed at a chosen position, which enables operating instructions
 * for the content displayed on the pullout menus.
 */
export class SlidingOverlay {
  constructor(
    app,
    {
      side = "left",
      tabText = "MENU",
      closeHint = "",
      bgColor = "#000000",
      bgAlpha = 0.95,
      animationDuration = 1200,
    },
  ) {
    this.app = app;
    this.side = side;
    this.animationDuration = animationDuration;
    this.isOpen = false;

    this.container = new PIXI.Container();

    // -------- TAB LABEL (Will sit at the edge of the screen) --------
    this.tabLabel = new PIXI.Text(tabText, {
      fontFamily: "Trebuchet MS",
      fontSize: 20,
      fill: "#ffff00",
      letterSpacing: 2,
      align: "center",
      fontWeight: "bold",
    });

    this.tabLabel.anchor.set(0.5);
    this.container.addChild(this.tabLabel);

    // ---------- SLIDING PANEL ----------
    this.panel = new PIXI.Container();
    this.container.addChild(this.panel);

    this.solidBg = new PIXI.Graphics()
      .rect(0, 0, app.screen.width, app.screen.height)
      .fill({ color: bgColor, alpha: bgAlpha });
    this.panel.addChild(this.solidBg);

    if (closeHint) {
      this.closeText = new PIXI.Text(closeHint, {
        fontFamily: "Garamond",
        fontSize: 28,
        fill: "#ffff00",
        align: "center",
      });

      this.closeText.anchor.set(0.5);
      this.closeText.position.set(
        app.screen.width / 2,
        app.screen.height * 0.15,
      );
      this.panel.addChild(this.closeText);
    }

    this.setupPositions();
    this.initTabAnimation();
  }

  initTabAnimation() {
    if (this.bounceInterval) clearInterval(this.bounceInterval);

    const config = {
      left: { axis: "x", distance: 50 }, // Move Right (+20) then back
      right: { axis: "x", distance: -50 }, // Move Left (-20) then back
      bottom: { axis: "y", distance: -50 }, // Move Up (-20) then back
      top: { axis: "y", distance: 50 }, // Move Down (+20) then back
    }[this.side];

    const axis = config.axis;
    const startPos = this.tabLabel[axis];

    this.tabAnimation = anime({
      targets: this.tabLabel,
      [axis]: [
        { value: startPos + config.distance, duration: 400 },
        { value: startPos, duration: 400 },
        { value: startPos + config.distance, duration: 400 },
        { value: startPos, duration: 400 },
      ],
      easing: "easeInOutCubic",
      loop: true,
      delay: 2000,
      autoplay: true,
      // update: () => {
      //   if (this.isOpen) {
      //     this.tabAnimation.pause();
      //     this.tabLabel[axis] = startPos;
      //   }
      // },
    });
  }

  setupPositions() {
    const { width, height } = this.app.screen;

    switch (this.side) {
      case "left":
        this.closedPos = -width;
        this.openPos = 0;
        this.panel.x = this.closedPos;

        this.tabLabel.position.set(80, height / 2);
        break;
      case "right":
        this.closedPos = width;
        this.openPos = 0;
        this.panel.x = this.closedPos;

        this.tabLabel.position.set(width - 80, height / 2);
        break;

      case "top":
        this.closedPos = -height;
        this.openPos = 0;
        this.panel.y = this.closedPos;

        this.tabLabel.position.set(width / 2, 80);
        break;

      case "bottom":
        this.closedPos = height;
        this.openPos = 0;
        this.panel.y = this.closedPos;

        this.tabLabel.position.set(width / 2, height - 80);
        break;
    }
  }

  animatePanel(targetValue) {
    const prop = this.side === "left" || this.side === "right" ? "x" : "y";
    anime.remove(this.panel);
    anime({
      targets: this.panel,
      [prop]: targetValue,
      duration: this.animationDuration,
      easing: "easeInOutExpo",
    });
  }

  attachContent(displayObject, x, y) {
    this.panel.addChild(displayObject);
    displayObject.position.set(x, y);
  }

  rollout(onOpen) {
    if (this.isOpen) return;
    this.isOpen = true;
    this.container.zIndex = 100;
    this.animatePanel(this.openPos);

    if (onOpen) onOpen();
  }

  rollin() {
    if (!this.isOpen) return;
    this.isOpen = false;
    this.container.zIndex = 1;

    this.animatePanel(this.closedPos);
  }

  toggle() {
    this.isOpen ? this.rollin() : this.rollout();
  }

  destroy() {
    if (this.bounceInterval) clearInterval(this.bounceInterval);
    anime.remove(this.panel);
    anime.remove(this.tabLabel);

    this.container.destroy({ children: true });
  }
}

/**
 * Creates a card for a responder specifically, where there is a header for the name, an allocated space
 * on the card for the responder's image, and a subtext section where the responder information can be displayed.
 *
 * It creates the card inside a GlassBox object and is thus transparent.
 */
export class ResponderEnclosure {
  constructor(
    data,
    padding = 20,
    color = "#ffffff",
    fixedSize = null,
    gradientColors = { c1: "#50ffc8", c2: "#036b97" },
    styles = {},
  ) {
    const defaultStyles = {
      header: {
        fontSize: fixedSize ? 28 : 36,
        fontFamily: "Tahoma",
      },
      subLabel: {
        fontSize: data.path ? 14 : 18,
        fontFamily: data.path ? "Garamond" : "Verdana",
      },
    };

    this.config = {
      header: { ...defaultStyles.header, ...styles.header },
      subLabel: { ...defaultStyles.subLabel, ...styles.subLabel },
    };

    this.container = new PIXI.Container();
    this.bg = new GlassBox(padding);
    this.container.addChild(this.bg.graphics);
    this.fixedSize = fixedSize;

    const baseStyle = {
      fill: "#ffff00",
      align: "center",
      fontSize: 20,
      wordWrap: true,
      wordWrapWidth: fixedSize ? fixedSize.width - padding * 2 : 280,
    };

    this.labelObj = new GradientText({
      text: data.name.toUpperCase(),
      fontSize: this.config.header.fontSize,
      fontFamily: this.config.header.fontFamily,
      gradientColor1: gradientColors.c1,
      gradientColor2: gradientColors.c2,
      bold: true,
    });

    this.label = this.labelObj.sprite;
    this.label.anchor.set(0.5);
    this.container.addChild(this.label);

    const startY = fixedSize
      ? -fixedSize.height / 2 + padding + this.label.height / 2
      : 0;
    this.label.y = startY;

    let nextY = this.label.y + this.label.height / 2 + 20;

    if (data.path) {
      this.sprite = PIXI.Sprite.from(data.path);
      this.sprite.anchor.set(0.5);

      fitSprite(this.sprite, 180, 180);

      this.sprite.y = nextY + this.sprite.height / 2;
      this.container.addChild(this.sprite);
      nextY = this.sprite.y + this.sprite.height / 2 + 20;
    }

    if (data.bio) {
      this.subLabel = new PIXI.Text(data.bio, {
        ...baseStyle,
        fontFamily: this.config.subLabel.fontFamily,
        fontSize: this.config.subLabel.fontSize,
        align: "center",
      });
      this.subLabel.anchor.set(0.5, 0); // Top-center anchor
      this.subLabel.y = nextY;
      this.container.addChild(this.subLabel);
    }

    this.refresh();
  }

  refresh() {
    if (this.fixedSize) {
      this.bg.reshape(null, this.fixedSize);
    } else {
      const targets = [this.label, this.subLabel];
      if (this.sprite) targets.push(this.sprite);

      this.bg.reshape(targets);
    }
  }
}

/**
 * This is a specialized implementation of the pullout menu section that leverages
 * the SlidingOverlay's rollout and rollin functionality along with the tab label and the closing
 * instructions section it provides, and adds several ResponderEnclosures to the overlay to populate
 * the pullout menu with cards containing content about the responders.
 *
 * It also implements a carousel that uses left and right arrow key presses to navigate among the
 * populated cards, while hiding the next and previous cards.
 */
export class InfoOverlay extends SlidingOverlay {
  constructor(app, data, config) {
    super(app, config);

    this.data = data;
    this.type = config.type || "linear";
    this.currentIndex = 0;
    this.cards = [];

    this.populate();

    if (this.type === "carousel") {
      this.updateCarousel(true);
    }
  }

  populate() {
    this.cardContainer = new PIXI.Container();
    this.cardContainer.sortableChildren = true;
    const spacing = 380;

    const startX = -((this.data.length - 1) * spacing) / 2;

    this.cards = this.data.map((data, i) => {
      const card = new ResponderEnclosure(
        data,
        40,
        0xffffff,
        {
          width: 360,
          height: 580,
        },
        { c1: "#ff2402", c2: "#ffff00" },
        {
          header: { fontSize: 24, fontFamily: "Verdana" },
          subLabel: { fontSize: 18, fontFamily: "Garamond" },
        },
      );

      if (this.type === "linear") {
        card.container.x = startX + i * spacing;
      }
      this.cardContainer.addChild(card.container);
      return card.container;
    });

    this.cardContainer.x = this.app.screen.width / 2;
    this.cardContainer.y = this.app.screen.height / 2;

    this.panel.addChild(this.cardContainer);

    if (this.closeText) {
      this.panel.addChild(this.closeText);
    }
  }

  updateCarousel(immediate = false) {
    if (this.type !== "carousel") return;

    const peekWidth = 350;

    this.cards.forEach((card, i) => {
      const diff = i - this.currentIndex;
      const isCenter = diff === 0;

      const targetX = diff * peekWidth;
      const targetScale = isCenter ? 1 : 0.75;
      const targetAlpha = isCenter ? 1 : 0.2;
      const targetZ = 10 - Math.abs(diff);

      card.zIndex = targetZ;

      if (immediate) {
        card.x = targetX;
        card.scale.set(targetScale);
        card.alpha = targetAlpha;
      } else {
        anime.remove(card);
        anime.remove(card.scale);
        anime({
          targets: card,
          x: targetX,
          alpha: targetAlpha,
          duration: 600,
          easing: "easeOutExpo",
        });
        anime({
          targets: card.scale,
          x: targetScale,
          y: targetScale,
          duration: 600,
          easing: "easeOutExpo",
        });
      }
    });

    this.cardContainer.sortChildren();
  }

  next() {
    if (this.type === "carousel" && this.currentIndex < this.cards.length - 1) {
      this.currentIndex++;
      this.updateCarousel();
    }
  }

  prev() {
    if (this.type === "carousel" && this.currentIndex > 0) {
      this.currentIndex--;
      this.updateCarousel();
    }
  }

  getSelectedData() {
    return this.data[this.currentIndex];
  }

  destroy() {
    if (this.cards) {
      this.cards.forEach((card) => anime.remove([card, card.scale]));
    }
    super.destroy();
  }
}

/**
 * Scales the given sprite according to the given dimensions
 * @param {*} sprite
 * @param {*} maxWidth
 * @param {*} maxHeight
 */
function fitSprite(sprite, maxWidth, maxHeight) {
  const scale = Math.min(
    maxWidth / sprite.texture.width,
    maxHeight / sprite.texture.height,
  );

  sprite.scale.set(scale);
}
