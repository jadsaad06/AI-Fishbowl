import * as PIXI from "pixi.js";
import { RESPONDERS, RESPONDER_LORE } from "../app.js";
import { subscribeResponder, getResponder } from "../state/store.js";
import anime from "https://cdn.jsdelivr.net/npm/animejs@3.2.2/lib/anime.es.js";

// export const BIO_DATA = [
//   {
//     name: "Pinto",
//     bio: "- A cute, friendly, chill guy.\n- Born and brought up off the coast of Astoria, Oregon.\n- Holds the Pacific Coral Cuteness title for 4 years running.\n- Loves to help out, but can be a little too relaxed at times.\n- Claims that the beans were named after him, but no one is sure if that one's true.",
//   },
//   {
//     name: "Jimbo",
//     bio: "- A little rough around the edges, but such is life on the Atlantic Coast.\n- Banished by the East Coast Fish Union for being a bit too competitive.\n- Moved to Oregon to start fresh in 2010, but he's grumpier than back then.\n- DOES NOT LIKE FLORIDA\n- Still very sharp though.",
//   },
//   {
//     name: "Bongo",
//     bio: "- He's been depressed for a while now, Pinto says it's because he's on social media too much.\n- Born off the coast of Japan, he drifted aimlessly across the Pacific.\n- Extremely intelligent, but extremely shy.\n- Be nice to him!",
//   },
//   {
//     name: "Koko",
//     bio: "- Your aquatic CS advisor\n- Grew up in the Willamette River and has a special bond with Kiki\n- Has a vast knowledge of CS concepts and is always ready to help you navigate through your coding journey\n- Is professional, but values a friendly and approachable demeanor",
//   },
//   {
//     name: "Kiki",
//     bio: "- Your aquatic CS Grad School Advisor\n- Born and raised in the Columbia River, but has traveled across the Willamette with Koko\n- Is familiar with PSU Grad School policies since she has been in the area for a while\n- Values precision, clarity, and prides herself on knowledge collection",
//   },
// ];

export class ArrowMenu {
  constructor({ title, items = [], side = "top", app }) {
    this.app = app;
    this.side = side;
    this.isOpen = false;
    this.container = new PIXI.Container();

    const arrowMap = {
      top: "Controls",
      bottom: "Responders",
      left: "Lore",
      right: "Available tools",
    };
    this.label = new PIXI.Text(`${arrowMap[side]} ${title}`, {
      fill: "#ffffff",
      fontSize: 20,
      fontFamily: "Arial Black",
    });
    this.label.anchor.set(0.5);

    this.menuContent = new PIXI.Container();
    this.menuContent.alpha = 0;

    items.forEach((text, i) => {
      const item = new PIXI.Text(text.toUpperCase(), {
        fill: "#00ced1",
        fontSize: 16,
        fontFamily: "Arial",
      });

      item.anchor.set(0.5);
      item.y = (i + 1) * 35;
      this.menuContent.addChild(item);
    });

    this.container.addChild(this.menuContent, this.label);
    this.setInitialPosition();
  }

  setInitialPosition() {
    const margin = 50;
    const { width, height } = this.app.screen;

    const coords = {
      top: { x: width / 2, y: margin, offX: 0, offY: 120 },
      bottom: { x: width / 2, y: height - margin, offX: 0, offY: -120 },
      left: { x: margin, y: height / 2, offX: 120, offY: 0 },
      right: { x: width - margin, y: height / 2, offX: -120, offY: 0 },
    };

    this.basePosition = coords[this.side];
    this.container.position.set(this.basePosition.x, this.basePosition.y);
  }

  _animate(show) {
    this.isOpen = show;
    const targetX = show
      ? this.basePosition.x + this.basePosition.offX
      : this.basePosition.x;
    const targetY = show
      ? this.basePosition.y + this.basePosition.offY
      : this.basePosition.y;

    anime({
      targets: this.container.position,
      x: targetX,
      y: targetY,
      duration: 600,
      easing: "easeInOutElastic(1, .8)",
    });

    anime({
      targets: this.menuContent,
      alpha: show ? 0.8 : 0,
      duration: 300,
      easing: "linear",
    });
  }

  pulldown() {
    if (this.side === "top") this._animate(!this.isOpen);
  }
  pullup() {
    if (this.side === "bottom") this._animate(!this.isOpen);
  }
  pullright() {
    if (this.side === "left") this._animate(!this.isOpen);
  }
  pullleft() {
    if (this.side === "right") this._animate(!this.isOpen);
  }
}

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
      shadowColor = "#027fb8",
      shadowBlur = 20,
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

export class Enclosure {
  constructor({
    x = 0,
    y = 0,
    header = null,
    subheader = null,
    footer = null,
    imagePath = null,
    imageMaxWidth = 200,
    imageMaxHeight = 200,
    padding = 30,
    boxColor = 0x1a1a1a,
    boxAlpha = 0.9,
    fixedSize = null,
    headerStyle = {},
    subheaderStyle = {},
    footerStyle = {},
    verticalGap = 30,
    yOffset = 0,
  } = {}) {
    this.container = new PIXI.Container();

    this.container.position.set(x, y);

    this.verticalGap = verticalGap;
    this.yOffset = yOffset;

    this.box = new ModernBox(padding, boxColor, boxAlpha);
    this.container.addChild(this.box.graphics);

    const baseStyle = {
      fontFamily: "Roboto",
      fill: "#ffffff",
      align: "center",
    };

    if (header) {
      this.header = new PIXI.Text(header, {
        ...baseStyle,
        fontSize: 42,
        fontWeight: "bold",
        ...headerStyle,
      });
      this.header.anchor.set(0.5);
      this.container.addChild(this.header);
    }

    if (imagePath) {
      this.image = PIXI.Sprite.from(imagePath);
      this.image.anchor.set(0.5);

      const scale = Math.min(
        imageMaxWidth / this.image.texture.width,
        imageMaxHeight / this.image.texture.height,
      );
      this.image.scale.set(scale);
      this.container.addChild(this.image);
    }

    if (subheader) {
      this.subheader = new PIXI.Text(subheader, {
        ...baseStyle,
        fontSize: 24,
        fill: "#bdefff",
        wordWrap: true,
        wordWrapWidth: fixedSize ? fixedSize.width - padding * 2 : 400,
        ...subheaderStyle,
      });
      this.subheader.anchor.set(0.5);
      this.container.addChild(this.subheader);
    }

    if (footer) {
      this.footer = new PIXI.Text(footer, {
        ...baseStyle,
        fontSize: 18,
        fill: "#888888",
        ...footerStyle,
      });
      this.footer.anchor.set(0.5);
      this.container.addChild(this.footer);
    }

    this.fixedSize = fixedSize;
    this.layout();
  }

  layout() {
    const gap = this.verticalGap;

    const elements = [
      this.header,
      this.image,
      this.subheader,
      this.footer,
    ].filter(Boolean);

    let currentY = 0;

    elements.forEach((element, index) => {
      const target = element;
      const halfHeight = target.height / 2;

      if (index === 0) {
        currentY = halfHeight;
      } else {
        const prevHalfHeight = elements[index - 1].height / 2;
        currentY += prevHalfHeight + gap + halfHeight;
      }
      element.y = currentY;
    });

    const totalHeight =
      elements.length > 0
        ? currentY + elements[elements.length - 1].height / 2
        : 0;

    elements.forEach((element) => {
      element.y -= totalHeight / 2 - this.yOffset;
    });

    this.box.reshape(elements, this.fixedSize);
  }

  setPosition(x, y) {
    this.container.position.set(x, y);
  }

  moveBy(dx, dy) {
    this.container.position.x += dx;
    this.container.position.y += dy;
  }

  setHeader(text) {
    if (!this.header) return;
    this.header.text = text;
    this.layout();
  }

  setSubheader(text) {
    if (!this.subheader) return;
    this.subheader.text = text;
    this.layout();
  }

  setFooter(text) {
    if (!this.footer) return;
    this.footer.text = text;
    this.layout();
  }

  setBoxColor(color) {
    this.box.color = color;
    this.layout();
  }

  refresh() {
    this.layout();
  }

  destroy() {
    if (this.container && !this.container.destroyed) {
      this.container.destroy({ children: true });
    }
  }
}

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

export class GlassBox extends ModernBox {
  constructor(padding = 30) {
    super(padding, 0xffffff, 0.1);
  }

  reshape(targets, fixedSize = null) {
    super.reshape(targets, fixedSize);
    if (this.graphics.context) {
      this.drawGlassEffects(targets, fixedSize);
    }
  }

  drawGlassEffects(targets, fixedSize) {
    let width, height;
    if (fixedSize) {
      width = fixedSize.width;
      height = fixedSize.height;
    } else {
      const target = Array.isArray(targets) ? targets[0] : targets;
      width = target.width + this.padding * 2;
      height = target.height + this.padding * 2;
    }

    const minX = -width / 2;
    const minY = -height / 2;

    this.graphics.clear();

    this.graphics.fill({ color: 0xffffff, alpha: 0.1 });
    this.graphics.roundRect(minX, minY, width, height, 20);
    this.graphics.fill();

    this.graphics.fill({ color: 0xffffff, alpha: 0.2 });
    this.graphics.roundRect(minX + 5, minY + 5, width - 10, height - 10, 15);
    this.graphics.fill();

    this.graphics.stroke({
      width: 2.5,
      color: 0x87dced,
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

export class BoxGenerator {
  constructor(app, { boxType = "glass", padding = 30 } = {}) {
    this.app = app;
    this.boxType = boxType;
    this.padding = padding;
  }

  async createCard({
    header = "Header",
    imagePath = null,
    subtext = "",
    width = 320,
    height = null,
  }) {
    const container = new PIXI.Container();

    let currentY = 0;

    const headerText = new PIXI.Text(header, {
      fontSize: 22,
      fill: "#ffffff",
      fontWeight: "bold",
    });

    headerText.anchor.set(0.5, 0);
    headerText.x = 0;
    headerText.y = currentY;

    container.addChild(headerText);

    currentY += headerText.height + 15;

    let imageSprite = null;

    if (imagePath) {
      const texture = await PIXI.Assets.get(imagePath);

      if (!texture) {
        console.warn(`Texture not found in cache: ${imagePath}`);
      } else {
        imageSprite = new PIXI.Sprite(texture);

        imageSprite.anchor.set(0.5, 0);
        imageSprite.x = 0;
        imageSprite.y = currentY;

        const targetWidth = width - this.padding * 2;
        fitSprite(imageSprite, targetWidth, texture.height);

        container.addChild(imageSprite);

        currentY += imageSprite.height + 15;
      }
    }

    const bodyText = new PIXI.Text(subtext, {
      fontSize: 16,
      fill: "#ffffff",
      wordWrap: true,
      wordWrapWidth: width - this.padding * 2,
    });

    bodyText.anchor.set(0.5, 0);
    bodyText.x = 0;
    bodyText.y = currentY;

    container.addChild(bodyText);

    currentY += bodyText.height;

    container.pivot.set(0, 0);
    container.x = width / 2;

    const box =
      this.boxType === "glass"
        ? new GlassBox(this.padding)
        : new ModernBox(this.padding);

    box.reshape(container, {
      width,
      height: height || currentY + this.padding,
    });

    container.addChildAt(box.graphics, 0);

    container.__box = box;

    return container;
  }

  layoutLinear(
    cards,
    { direction = "horizontal", spacing = 40, startX = 0, startY = 0 } = {},
  ) {
    let offset = 0;

    cards.forEach((card) => {
      if (direction === "horizontal") {
        card.x = startX + offset;
        card.y = startY;
        offset += card.width + spacing;
      } else {
        card.y = startY + offset;
        card.x = startX;
        offset += card.height + spacing;
      }
    });
  }

  layoutStack(
    cards,
    { offsetX = 15, offsetY = 15, startX = 0, startY = 0 } = {},
  ) {
    cards.forEach((card, index) => {
      card.x = startX + index * offsetX;
      card.y = startY + index * offsetY;
      card.zIndex = index;
    });
  }

  layoutCarousel(cards, { centerX, centerY, radius = 400 }) {
    const total = cards.length;

    cards.forEach((card, index) => {
      const angle = ((index / total) * Math.PI) / 2;

      card.x = centerX + Math.cos(angle) * radius;
      card.y = centerY + Math.sin(angle) * radius * 0.4;

      const scale = 0.7 + 0.3 * (1 - Math.abs(Math.sin(angle)));
      card.scale.set(scale);
    });
  }
}

export class FunFactBox {
  constructor(app, factsList = []) {
    this.app = app;
    this.factsList = factsList;

    this.container = new PIXI.Container();

    this.header = new GradientText({
      text: "Fun Fact",
      fontSize: 28,
      fontFamily: "Arial Black",
      gradientColor1: "#79eaea",
      gradientColor2: "#02aaad",
      x: 0,
      y: -60,
      bold: true,
      shadowColor: "#04618b",
      shadowBlur: 12,
    });

    this.typewriter = new TypewriterText(
      "",
      {
        fill: "#ffffff",
        fontSize: 22,
        fontFamily: "Roboto",
        wordWrap: true,
        wordWrapWidth: 700,
        align: "center",
      },
      { durationPerChar: 35 },
    );
    this.typewriter.container.position.set(0, 20);

    this.box = new GlassBox(24);
    this.box.graphics.position.set(0, 0);

    this.container.addChild(this.box.graphics);
    this.container.addChild(this.header.sprite);
    this.container.addChild(this.typewriter.container);

    this._reshapeBox();
  }

  _reshapeBox() {
    this.box.reshape(this.typewriter.textObject, {
      width: 800,
      height: 200,
    });
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

export class SlidingOverlay {
  constructor(
    app,
    {
      side = "left",
      tabText = "MENU",
      closeHint = "",
      bgColor = "#000000",
      bgAlpha = 0.9,
      animationDuration = 700,
    },
  ) {
    this.app = app;
    this.side = side;
    this.animationDuration = animationDuration;
    this.isOpen = false;

    this.container = new PIXI.Container();

    // -------- TAB LABEL (Will sit at the edge of the screen) --------
    this.tabLabel = new PIXI.Text(tabText, {
      fontFamily: "Arial Black",
      fontSize: 16,
      fill: "#00ced1",
      letterSpacing: 2,
      align: "center",
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
        fontFamily: "Arial Black",
        fontSize: 28,
        fill: "#15e0f7",
      });

      this.closeText.anchor.set(0.5);
      this.closeText.position.set(
        app.screen.width / 2,
        app.screen.height - 220,
      );
      this.panel.addChild(this.closeText);
    }

    this.setupPositions();
    this.initTabAnimation();
  }

  initTabAnimation() {
    this.bounceInterval = setInterval(() => {
      if (!this.isOpen && this.tabLabel.alpha > 0.5) {
        const isHorizontal = this.side === "left" || this.side === "right";
        const axis = isHorizontal ? "x" : "y";
        const startPos = isHorizontal ? this.tabLabel.x : this.tabLabel.y;

        anime({
          targets: this.tabLabel,
          [axis]: [startPos, startPos + 20, startPos],
          duration: 800,
          easing: "easeInOutCubic",
        });
      }
    }, 3000);
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

  rollout() {
    if (this.isOpen) return;
    this.isOpen = true;

    this.animatePanel(this.openPos);
  }

  rollin() {
    if (!this.isOpen) return;
    this.isOpen = false;

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

export class ResponderEnclosure {
  constructor(data, padding = 20, color = 0xd9b8b8, fixedSize = null) {
    this.container = new PIXI.Container();
    this.bg = new ModernBox(padding, color);
    this.container.addChild(this.bg.graphics);
    this.fixedSize = fixedSize;

    const baseStyle = {
      fontFamily: "Garamond",
      fill: "#151414",
      align: "center",
      wordWrap: true,
      wordWrapWidth: fixedSize ? fixedSize.width - padding * 2 : 280,
    };

    this.label = new PIXI.Text(data.name.toUpperCase(), {
      ...baseStyle,
      fontSize: 28,
      fontWeight: "bold",
    });
    this.label.anchor.set(0.5);
    this.label.y = fixedSize ? -fixedSize.height / 2 + padding + 20 : -220;
    this.container.addChild(this.label);

    if (data.path) {
      this.sprite = PIXI.Sprite.from(data.path);
      this.sprite.anchor.set(0.5);
      fitSprite(this.sprite, 180, 180);
      this.sprite.y = fixedSize ? -50 : -80;
      this.container.addChild(this.sprite);

      if (data.bio) {
        this.subLabel = new PIXI.Text(data.bio, {
          ...baseStyle,
          fontSize: 14,
          align: "left",
        });
        this.subLabel.anchor.set(0.5, 0);
        this.subLabel.y = 60;
        this.container.addChild(this.subLabel);
      }
    }

    if (!data.path && data.bio) {
      this.subLabel = new PIXI.Text(data.bio, {
        ...baseStyle,
        fontFamily: "Verdana",
        fontSize: 16,
        align: "left",
      });
      this.subLabel.anchor.set(0.5, 0);
      this.subLabel.y = fixedSize ? -100 : -100;
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

export class InfoOverlay extends SlidingOverlay {
  constructor(app, data, config) {
    super(app, {
      side: config.side || "left",
      tabText: config.tabText || "",
      closeHint: config.closeHint || "",
      bgColor: config.bgColor || 0x000000,
      bgAlpha: config.bgAlpha || 0.9,
    });

    this.data = data;
    this.populate();
  }

  populate() {
    const cardContainer = new PIXI.Container();
    const spacing = 365;

    const startX = -((this.data.length - 1) * spacing) / 2;

    this.data.forEach((data, i) => {
      const card = new ResponderEnclosure(data, 40, 0xffffff, {
        width: 350,
        height: 500,
      });

      card.container.x = startX + i * spacing;
      cardContainer.addChild(card.container);
    });

    cardContainer.x = this.app.screen.width / 2;
    cardContainer.y = this.app.screen.height / 2;

    this.panel.addChild(cardContainer);

    if (this.closeText) {
      this.panel.addChild(this.closeText);
    }
  }
}

// export class InfoOverlay {
//   constructor(app) {
//     this.app = app;
//     this.container = new PIXI.Container();
//     this.container.visible = true;
//     this.isOpen = false;

//     // this.tabLabel = new PIXI.Text("FISH STORIES \n       ▼", {
//     //   fontFamily: "Arial Black",
//     //   fontSize: 16,
//     //   fill: "#00ced1",
//     //   letterSpacing: 2,
//     // });
//     this.tabLabel = new PIXI.Text("F\nI\nS\nH\n\nS\nT\nO\nR\nI\nE\nS\n\n▶▶", {
//       fontFamily: "Arial Black",
//       fontSize: 16,
//       fill: "#00ced1",
//       letterSpacing: 2,
//     });
//     this.tabLabel.anchor.set(0.5);
//     //this.tabLabel.rotation = -Math.PI / 2;
//     this.tabLabel.position.set(80, app.screen.height / 2);
//     this.container.addChild(this.tabLabel);

//     this.bounceInterval = setInterval(() => {
//       if (!this.isOpen && this.tabLabel.alpha > 0.5) {
//         anime({
//           targets: this.tabLabel,
//           x: [80, 100, 80, 100, 80],
//           duration: 800,
//           easing: "easeInOutCubic",
//         });
//       }
//     }, 3000);

//     this.panel = new PIXI.Container();
//     this.container.addChild(this.panel);

//     const solidBg = new PIXI.Graphics()
//       .rect(0, 0, app.screen.width, app.screen.height)
//       .fill({ color: 0x000000, alpha: 0.9 });
//     this.panel.addChild(solidBg);

//     this.closedX = -app.screen.width;
//     this.openX = 0;
//     this.panel.x = this.closedX;

//     const totalCards = BIO_DATA.length;
//     const cardContainer = new PIXI.Container();
//     const spacing = 320;
//     const startX = -((totalCards - 1) * spacing) / 2;

//     BIO_DATA.forEach((_, i) => {
//       const card = new ResponderCard(i, 300, 500);
//       card.container.x = startX + i * spacing;
//       cardContainer.addChild(card.container);
//     });

//     cardContainer.x = app.screen.width / 2;
//     cardContainer.y = app.screen.height / 2;
//     this.panel.addChild(cardContainer);

//     const hint = new PIXI.Text("◀ LEFT ARROW TO CLOSE FISH STORIES", {
//       fontFamily: "Arial Black",
//       fontSize: 28,
//       fill: "#15e0f7",
//     });
//     this.hint = hint;
//     hint.anchor.set(0.5);
//     hint.position.set(app.screen.width / 2, app.screen.height - 220);
//     // this.hint.alpha = 0;
//     this.panel.addChild(this.hint);
//   }

//   rollout() {
//     if (this.isOpen) return;
//     this.isOpen = true;

//     anime({
//       targets: this.panel,
//       x: this.openX,
//       duration: 700,
//       easing: "easeInOutExpo",
//     });
//   }

//   rollin() {
//     if (!this.isOpen) return;
//     this.isOpen = false;

//     anime({
//       targets: this.panel,
//       x: this.closedX,
//       duration: 600,
//       easing: "easeInOutExpo",
//       complete: () => {
//         anime({
//           targets: this.tabLabel,
//           alpha: 1,
//           duration: 300,
//           easing: "linear",
//         });
//       },
//     });
//   }

//   destroy() {
//     if (this.bounceInterval) {
//       clearInterval(this.bounceInterval);
//     }

//     anime.remove(this.container);
//     anime.remove(this.panel);
//     anime.remove(this.tabLabel);
//     anime.remove(this.hint);

//     this.container.destroy({ children: true });
//   }

//   toggle() {
//     this.isOpen ? this.rollin() : this.rollout();
//   }
// }

export class OptionsOverlay {
  constructor(app) {
    this.app = app;
    this.container = new PIXI.Container();
    this.isOpen = false;
    this.currentIndex = 0;

    this.tabLabel = new PIXI.Text("RESPONDERS & CONTROLS\n         ▲", {
      fontFamily: "Arial Black",
      fontSize: 16,
      fill: "#00ced1",
      align: "center",
    });
    this.tabLabel.anchor.set(0.5);
    this.tabLabel.position.set(app.screen.width / 2, app.screen.height - 100);
    this.container.addChild(this.tabLabel);

    this.bounceInterval = setInterval(() => {
      if (!this.isOpen) {
        anime({
          targets: this.tabLabel,
          y: [
            app.screen.height - 80,
            app.screen.height - 100,
            app.screen.height - 80,
            app.screen.height - 100,
            app.screen.height - 80,
          ],
          duration: 800,
          easing: "easeInOutCubic",
        });
      }
    }, 3000);

    this.panel = new PIXI.Container();
    this.panel.y = app.screen.height;
    this.container.addChild(this.panel);

    const solidBg = new PIXI.Graphics()
      .rect(0, 0, app.screen.width, app.screen.height)
      .fill({ color: 0x000000, alpha: 0.9 });
    this.panel.addChild(solidBg);

    this.cardContainer = new PIXI.Container();
    this.cardContainer.sortableChildren = true;
    this.cardContainer.position.set(
      app.screen.width / 2,
      app.screen.height / 2 - 100,
    );
    this.panel.addChild(this.cardContainer);

    this.cards = RESPONDERS.map((path, i) => {
      const fishData = BIO_DATA[i] || { name: `Fish ${i + 1}` };
      const enclosure = new ResponderEnclosure(
        path,
        fishData.name,
        100,
        0x5ebd9d,
      );

      const instructions = `To speak: "Hey ${fishData.name}"\nTo type: Press ${i + 1} then 'K'`;
      const instText = new PIXI.Text(instructions, {
        fontFamily: "Garamond",
        fontSize: 18,
        fill: "#ff0000",
        align: "center",
      });
      instText.anchor.set(0.5);
      instText.y = 200;

      enclosure.container.addChild(instText);

      this.cardContainer.addChild(enclosure.container);
      return enclosure.container;
    });

    this.updateCarousel(true);

    this.closeHint = new PIXI.Text("▼ DOWN ARROW TO CLOSE | ◀ ▶ TO NAVIGATE", {
      fontFamily: "Arial Black",
      fontSize: 22,
      fill: "#15e0f7",
    });
    this.closeHint.anchor.set(0.5);
    this.closeHint.position.set(app.screen.width / 2, app.screen.height - 200);
    this.panel.addChild(this.closeHint);
  }

  updateCarousel(immediate = false) {
    this.cards.forEach((card, i) => {
      const diff = i - this.currentIndex;
      const isCenter = diff === 0;

      const peekWidth = 10;
      let targetX = 0;

      if (diff > 0) {
        targetX = 160 + diff * peekWidth;
      } else if (diff < 0) {
        targetX = -160 + diff * peekWidth;
      }

      const targetScale = isCenter ? 1 : 0.95;
      const targetAlpha = isCenter ? 1 : 0.2;
      const targetZ = 10 - Math.abs(diff);

      if (immediate) {
        card.x = targetX;
        card.scale.set(targetScale);
        card.alpha = targetAlpha;
        card.zIndex = targetZ;
      } else {
        anime({
          targets: card,
          x: targetX,
          alpha: targetAlpha,
          duration: 500,
          easing: "easeOutExpo",
        });

        anime({
          targets: card.scale,
          x: targetScale,
          y: targetScale,
          duration: 500,
          easing: "easeOutExpo",
        });
        card.zIndex = targetZ;
      }
    });

    this.cardContainer.sortChildren();
  }

  next() {
    if (this.currentIndex < this.cards.length - 1) {
      this.currentIndex++;
      this.updateCarousel();
    }
  }

  prev() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.updateCarousel();
    }
  }

  rollout() {
    if (this.isOpen) return;
    this.isOpen = true;
    this.tabLabel.alpha = 0;
    anime({
      targets: this.panel,
      y: 0,
      duration: 800,
      easing: "easeOutExpo",
    });
  }

  rollin() {
    if (!this.isOpen) return;
    this.isOpen = false;
    anime({
      targets: this.panel,
      y: this.app.screen.height,
      duration: 600,
      easing: "easeInExpo",
      complete: () => {
        this.tabLabel.alpha = 1;
      },
    });
  }

  destroy() {
    if (this.bounceInterval) {
      clearInterval(this.bounceInterval);
    }

    anime.remove(this.container);
    anime.remove(this.panel);
    anime.remove(this.tabLabel);
    anime.remove(this.closeHint);

    if (this.cards) {
      this.cards.forEach((card) => {
        anime.remove(card);
        anime.remove(card.scale);
      });
    }

    this.container.destroy({ children: true });
  }
}

export class ControlsOverlay {
  constructor(app) {
    this.app = app;
    this.container = new PIXI.Container();
    this.isOpen = false;

    this.tabLabel = new PIXI.Text("C\nO\nN\nT\nR\nO\nL\nS\n\n◀◀", {
      fontFamily: "Arial Black",
      fontSize: 16,
      fill: "#00ced1",
      letterSpacing: 2,
    });
    this.tabLabel.anchor.set(0.5);
    this.tabLabel.position.set(app.screen.width - 80, app.screen.height / 2);
    this.container.addChild(this.tabLabel);

    this.bounceInterval = setInterval(() => {
      if (!this.isOpen && this.tabLabel.alpha > 0.5) {
        anime({
          targets: this.tabLabel,
          x: [
            app.screen.width - 80,
            app.screen.width - 100,
            app.screen.width - 80,
            app.screen.width - 100,
            app.screen.width - 80,
          ],
          duration: 800,
          easing: "easeInOutCubic",
        });
      }
    }, 3000);

    this.panel = new PIXI.Container();
    this.closedX = app.screen.width;
    this.openX = 0;
    this.panel.x = this.closedX;
    this.container.addChild(this.panel);

    const solidBg = new PIXI.Graphics()
      .rect(0, 0, app.screen.width, app.screen.height)
      .fill({ color: 0x000000, alpha: 0.9 });
    this.panel.addChild(solidBg);

    const sections = [
      {
        title: "VOICE COMMANDS",
        text: 'Speak "Hey [Name]" to wake a responder.\nUse natural language to ask questions.',
      },
      {
        title: "KEYBOARD CONTROLS",
        text: "1-5: Select Responder\nK: Open Type Terminal\nArrow Keys: Navigate Menus",
      },
      {
        title: "SYSTEM STATUS",
        text: "Coral Net v3.0\nConnection: Stable\nActive Responders: 5",
      },
    ];

    const sectionContainer = new PIXI.Container();
    const spacing = 450;
    const startX = -((sections.length - 1) * spacing) / 2;

    sections.forEach((data, i) => {
      const group = new PIXI.Container();

      const bg = new GlassBox(30);
      group.addChild(bg.graphics);

      const header = new PIXI.Text(data.title, {
        fontFamily: "Courier New",
        fontSize: 28,
        fill: "#87dced",
        fontWeight: "bold",
      });
      header.anchor.set(0.5);
      header.y = -180;

      const body = new PIXI.Text(data.text, {
        fontFamily: "Arial",
        fontSize: 18,
        fill: "#ffffff",
        wordWrap: true,
        wordWrapWidth: 320,
        align: "center",
      });
      body.anchor.set(0.5);
      body.y = 40;

      group.addChild(header, body);
      bg.reshape(null, { width: 400, height: 500 });

      group.x = startX + i * spacing;
      sectionContainer.addChild(group);
    });

    sectionContainer.position.set(app.screen.width / 2, app.screen.height / 2);
    this.panel.addChild(sectionContainer);

    this.closeHint = new PIXI.Text("RIGHT ARROW TO CLOSE ▶", {
      fontFamily: "Arial Black",
      fontSize: 22,
      fill: "#15e0f7",
    });
    this.closeHint.anchor.set(0.5);
    this.closeHint.position.set(app.screen.width / 2, app.screen.height - 100);
    this.panel.addChild(this.closeHint);
  }

  rollout() {
    if (this.isOpen) return;
    this.isOpen = true;
    this.tabLabel.alpha = 0;

    anime({
      targets: this.panel,
      x: this.openX,
      duration: 800,
      easing: "easeOutExpo",
    });
  }

  rollin() {
    if (!this.isOpen) return;
    this.isOpen = false;
    anime({
      targets: this.panel,
      x: this.closedX,
      duration: 600,
      easing: "easeInExpo",
      complete: () => {
        this.tabLabel.alpha = 1;
      },
    });
  }

  destroy() {
    if (this.bounceInterval) {
      clearInterval(this.bounceInterval);
    }

    anime.remove(this.container);
    anime.remove(this.panel);
    anime.remove(this.tabLabel);
    anime.remove(this.closeHint);

    this.container.destroy({ children: true });
  }
}

function fitSprite(sprite, maxWidth, maxHeight) {
  const scale = Math.min(
    maxWidth / sprite.texture.width,
    maxHeight / sprite.texture.height,
  );

  sprite.scale.set(scale);
}
