import * as PIXI from "pixi.js";
import { RESPONDERS } from "../app.js";
import { subscribeResponder, getResponder } from "../state/store.js";
import anime from "https://cdn.jsdelivr.net/npm/animejs@3.2.2/lib/anime.es.js";

const BIO_DATA = [
  {
    name: "Pinto",
    bio: "- A cute, friendly, chill guy.\n- Born and brought up off the coast of Astoria, Oregon.\n- Holds the Pacific Coral Cuteness title for 4 years running.\n- Loves to help out, but can be a little too relaxed at times.\n- Claims that the beans were named after him, but no one is sure if that one's true.",
  },
  {
    name: "Jimbo",
    bio: "- A little rough around the edges, but such is life on the Atlantic Coast.\n- Banished by the East Coast Fish Union for being a bit too competitive.\n- Moved to Oregon to start fresh in 2010, but he's grumpier than back then.\n- DOES NOT LIKE FLORIDA\n- Still very sharp though.",
  },
  {
    name: "Bongo",
    bio: "- He's been depressed for a while now, Pinto says it's because he's on social media too much.\n- Born off the coast of Japan, he drifted aimlessly across the Pacific.\n- Extremely intelligent, but extremely shy.\n- Be nice to him!",
  },
  {
    name: "Koko",
    bio: "- Your aquatic CS advisor\n- Grew up in the Willamette River and has a special bond with Kiki\n- Has a vast knowledge of CS concepts and is always ready to help you navigate through your coding journey\n- Is professional, but values a friendly and approachable demeanor",
  },
  {
    name: "Kiki",
    bio: "- Your aquatic CS Grad School Advisor\n- Born and raised in the Columbia River, but has traveled across the Willamette with Koko\n- Is familiar with PSU Grad School policies since she has been in the area for a while\n- Values precision, clarity, and prides herself on knowledge collection",
  },
];

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
  constructor(padding = 30, color = 0x1a1a1a, alpha = 0.9) {
    this.graphics = new PIXI.Graphics();
    this.padding = padding;
    this.color = color;
    this.boxAlpha = alpha;
  }

  reshape(targets, fixedSize = null) {
    if (!this.graphics || this.graphics.destroyed) {
      return;
    }
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
        if (!target || target.destroyed || !target.anchor) {
          return;
        }
        if (target.text === "" && targetArray.length === 1) {
          tminX = -10;
          tminY = -10;
          tmaxX = 10;
          tmaxY = 10;
          return;
        }

        const w = target.width;
        const h = target.height;
        const ax = target.anchor ? target.anchor.x : 0;
        const ay = target.anchor ? target.anchor.y : 0;

        const x = target.x - ax * w;
        const y = target.y - ay * h;

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

    if (this.graphics.context) {
      this.graphics.clear();
      this.graphics.fill({ color: this.color, alpha: this.boxAlpha });
      this.graphics.stroke({ width: 1, color: 0x333333 });
      this.graphics.roundRect(minX, minY, width, height, 12);
      this.graphics.fill();
    }
  }
}

export class ResponderEnclosure {
  constructor(imagePath, name, padding = 20, isHeader = false) {
    this.container = new PIXI.Container();
    this.bg = new ModernBox(padding);
    this.container.addChild(this.bg.graphics);

    const baseStyle = {
      fontFamily: "Roboto",
      fill: "#ffffff",
      align: "center",
    };

    if (imagePath) {
      this.sprite = PIXI.Sprite.from(imagePath);
      this.sprite.anchor.set(0.5);

      fitSprite(this.sprite, 200, 200);
      this.sprite.y = -40;
      this.container.addChild(this.sprite);
    }

    this.label = new PIXI.Text(name, {
      ...baseStyle,
      fontFamily: isHeader ? "Brush Script MT" : "Garamond",
      fontSize: isHeader ? 64 : 24,
      fontWeight: isHeader ? "bold" : "normal",
    });
    this.label.anchor.set(0.5);
    if (this.sprite) {
      this.label.y = this.sprite.y + this.sprite.height / 2 + 80;
    } else {
      this.label.y = 0;
    }
    this.container.addChild(this.label);

    this.subLabel = new PIXI.Text("", {
      ...baseStyle,
      fontSize: 24,
      fill: "#bdefff",
    });
    this.subLabel.anchor.set(0.5);
    this.subLabel.y = 80;
    this.subLabel.visible = isHeader;
    this.container.addChild(this.subLabel);

    this.refresh();
  }

  refresh(fixedSize = null) {
    const targets = [this.label];
    if (this.sprite) targets.push(this.sprite);
    if (this.subLabel && this.subLabel.text !== "") targets.push(this.subLabel);

    this.bg.reshape(targets, fixedSize);
  }
}

class ResponderCard {
  constructor(index, width = 400, height = 600) {
    this.container = new PIXI.Container();

    const cardBg = new PIXI.Graphics()
      .fill({ color: 0x2a2a2a, alpha: 1 })
      .stroke({ width: 2, color: 0x1e90ff })
      .roundRect(-width / 2, -height / 2, width, height, 20)
      .fill();
    this.container.addChild(cardBg);

    const sprite = PIXI.Sprite.from(RESPONDERS[index]);
    sprite.anchor.set(0.5);
    sprite.y = -height * 0.25;

    const targetWidth = index === 2 ? 80 : 180;
    const scale = targetWidth / sprite.texture.width;
    sprite.scale.set(scale);
    this.container.addChild(sprite);

    const nameLabel = new PIXI.Text(BIO_DATA[index].name, {
      fontFamily: "Brush Script MT",
      fontSize: 36,
      fontWeight: "bold",
      fill: "#1e90ff",
    });
    nameLabel.anchor.set(0.5);
    nameLabel.y = -height * 0.03;
    this.container.addChild(nameLabel);

    const bioLabel = new PIXI.Text(BIO_DATA[index].bio, {
      fontFamily: "Roboto",
      fontSize: 16,
      fill: "#ffffff",
      align: "left",
      lineHeight: 22,
      wordWrap: true,
      wordWrapWidth: width - 40,
    });

    bioLabel.anchor.set(0.5, 0);
    bioLabel.y = 20;
    this.container.addChild(bioLabel);
  }
}

export class InfoOverlay {
  constructor(app) {
    this.app = app;
    this.container = new PIXI.Container();
    this.container.visible = true;
    this.isOpen = false;

    this.tabLabel = new PIXI.Text("FISH STORIES \n       ▼", {
      fontFamily: "Arial Black",
      fontSize: 16,
      fill: "#00ced1",
      letterSpacing: 2,
    });
    this.tabLabel.anchor.set(0.5);
    this.tabLabel.rotation = -Math.PI / 2;
    this.tabLabel.position.set(80, app.screen.height / 2);
    this.container.addChild(this.tabLabel);

    this.panel = new PIXI.Container();
    this.container.addChild(this.panel);

    const TAB_WIDTH = 60;
    this.closedX = -app.screen.width;
    this.openX = 0;
    this.panel.x = this.closedX;

    const totalCards = BIO_DATA.length;
    const cardContainer = new PIXI.Container();
    const spacing = 320;
    const startX = -((totalCards - 1) * spacing) / 2;

    BIO_DATA.forEach((_, i) => {
      const card = new ResponderCard(i, 300, 500);
      card.container.x = startX + i * spacing;
      cardContainer.addChild(card.container);
    });

    cardContainer.x = app.screen.width / 2;
    cardContainer.y = app.screen.height / 2;
    this.panel.addChild(cardContainer);

    const hint = new PIXI.Text("◀ LEFT ARROW TO CLOSE FISH STORIES", {
      fontFamily: "Arial Black",
      fontSize: 28,
      fill: "#15e0f7",
    });
    this.hint = hint;
    hint.anchor.set(0.5);
    hint.position.set(app.screen.width / 2, app.screen.height - 220);
    this.hint.alpha = 0;
    this.panel.addChild(this.hint);
  }

  rollout() {
    if (this.isOpen) return;
    this.isOpen = true;
    this.hint.alpha = 1;
    this.tabLabel.alpha = 0;

    anime({
      targets: this.panel,
      x: this.openX,
      duration: 700,
      easing: "easeInOutExpo",
    });
  }

  rollin() {
    if (!this.isOpen) return;
    this.isOpen = false;

    anime({
      targets: this.panel,
      x: this.closedX,
      duration: 600,
      easing: "easeInOutExpo",
      complete: () => {
        anime({
          targets: this.tabLabel,
          alpha: 1,
          duration: 300,
          easing: "linear",
        });
      },
    });
  }

  toggle() {
    this.isOpen ? this.rollin() : this.rollout();
  }
}

function fitSprite(sprite, maxWidth, maxHeight) {
  const scale = Math.min(
    maxWidth / sprite.texture.width,
    maxHeight / sprite.texture.height,
  );

  sprite.scale.set(scale);
}

// export class IdleTitle {
//   constructor(text, subtext) {
//     this.container = new PIXI.Container();

//     this.title = this._createGradientText(
//       text.toUpperCase(),
//       100,
//       "Arial Black",
//     );
//     this.title.anchor.set(0.5);
//     this.title.y = 0;

//     this.subtitle = new PIXI.Text({
//       text: subtext,
//       style: {
//         fontFamily: "Garamond",
//         fontSize: 28,
//         fill: "#e0f7fa",
//         letterSpacing: 4,
//         fontStyle: "italic",
//         align: "center",
//       },
//     });

//     this.subtitle.anchor.set(0.5);
//     this.subtitle.y = 80;

//     this.container.addChild(this.title);
//     this.container.addChild(this.subtitle);

//     this.startAnimations();
//   }

//   /**
//    * The following function is pasted straight from Claude
//    * ------ VERIFY --------
//    */
//   _createGradientText(text, fontSize, fontFamily) {
//     const canvas = document.createElement("canvas");
//     const ctx = canvas.getContext("2d");

//     const font = `bold ${fontSize}px ${fontFamily}`;
//     ctx.font = font;

//     const metrics = ctx.measureText(text);
//     const padding = 40;
//     canvas.width = metrics.width + padding * 2;
//     canvas.height = fontSize * 1.5 + padding;

//     // Re-apply font after resize (canvas reset clears it)
//     ctx.font = font;
//     ctx.textBaseline = "middle";

//     // Drop shadow
//     ctx.shadowColor = "#027fb8";
//     ctx.shadowBlur = 20;
//     ctx.shadowOffsetX = 0;
//     ctx.shadowOffsetY = 0;

//     // Vertical gradient: white → aqua
//     const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
//     gradient.addColorStop(0, "#ffffff");
//     gradient.addColorStop(1, "#00d2ff");

//     ctx.fillStyle = gradient;
//     ctx.fillText(text, padding, canvas.height / 2);

//     const texture = PIXI.Texture.from(canvas);
//     const sprite = new PIXI.Sprite(texture);
//     sprite.anchor.set(0.5);
//     return sprite;
//   }

//   startAnimations() {
//     const baseY = this.container.y;
//     anime({
//       targets: this.container,
//       y: [baseY, baseY - 15, baseY],
//       duration: 3000,
//       direction: "alternate",
//       loop: true,
//       easing: "easeInOutSine",
//     });

//     anime({
//       targets: this.title.style,
//       dropShadowBlur: [8, 28, 8],
//       duration: 2000,
//       direction: "alternate",
//       loop: true,
//       easing: "easeInOutQuad",
//     });
//   }

//   setPosition(x, y) {
//     this.container.position.set(x, y);
//     anime.remove(this.container);
//     anime({
//       targets: this.container,
//       y: [y, y - 15, y],
//       duration: 3000,
//       loop: true,
//       easing: "easeInOutSine",
//     });
//   }
// }
