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
    this.container.visible = false;

    const dimmer = new PIXI.Graphics()
      .fill({ color: 0x000000, alpha: 0.85 })
      .rect(0, 0, app.screen.width, app.screen.height)
      .fill();
    this.container.addChild(dimmer);

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
    this.container.addChild(cardContainer);

    const closeTxt = new PIXI.Text("Press L to Close", {
      fontFamily: "Roboto",
      fontSize: 18,
      fill: "#888888",
    });
    closeTxt.anchor.set(0.5);
    closeTxt.position.set(app.screen.width / 2, app.screen.height - 50);
    this.container.addChild(closeTxt);
  }

  toggle() {
    this.container.visible = !this.container.visible;
  }
}

function fitSprite(sprite, maxWidth, maxHeight) {
  const scale = Math.min(
    maxWidth / sprite.texture.width,
    maxHeight / sprite.texture.height,
  );

  sprite.scale.set(scale);
}

export class AnimeIdleText {
  constructor(app) {
    this.app = app;
    this.container = new PIXI.Container();
    this.container.position.set(app.screen.width / 2, app.screen.height / 2);

    this.centerBox = new ResponderEnclosure(null, "", 40, true);

    const gap = 300;
    const instructions =
      "- Press 'k' To Type Prompt\n" +
      "- Press 'r' To Select Random Responder\n" +
      "- Press 1/2/3 To Select Your Responder\n" +
      "- Press 'L' To Open/Close Responder Lore";
    this.responders = [
      new ResponderEnclosure(RESPONDERS[0], "Bob"),
      new ResponderEnclosure(RESPONDERS[1], "Jimbo"),
      new ResponderEnclosure(RESPONDERS[2], "Bongo"),
      new ResponderEnclosure(null, instructions, 20),
    ];
    this.responders[0].subLabel.text = "Press 1 to select Bob";
    this.responders[1].subLabel.text = "Press 2 to select Jimbo";
    this.responders[2].subLabel.text = "Press 3 to select Bongo";

    const initialSelected = getResponder();

    this.responders.forEach((r, i) => {
      r.container.scale.set(0);
      if (i < 3) {
        r.subLabel.visible = true;
        r.bg.color = initialSelected === i + 1 ? 0x1e90ff : 0x1a1a1a;
        r.refresh({ width: 280, height: 350 });
      } else r.refresh();
    });

    this.responders[0].container.position.set(-gap - 80, 0);
    this.responders[1].container.position.set(0, -gap);
    this.responders[2].container.position.set(gap + 80, 0);
    this.responders[3].container.position.set(0, gap);

    this.container.addChild(this.centerBox.container);
    this.responders.forEach((r) => this.container.addChild(r.container));

    this.playAnimation();
    this.unsubscribeResponder = subscribeResponder((selected) => {
      if (!this.container || this.container.destroyed || !this.responders)
        return;
      this.responders.forEach((r, i) => {
        if (i < 3) {
          r.bg.color = selected === i + 1 ? 0x1e90ff : 0x1a1a1a;
          r.refresh({ width: 280, height: 350 });
        }
      });
    });
    this.repeatInterval = setInterval(() => this.playAnimation(), 60000);
  }

  playAnimation() {
    anime.remove([this.container, this.centerBox.container.scale]);
    this.responders.forEach((r) => anime.remove(r.container.scale));

    const hText = "AI Fishbowl";
    const sText = "Your Aquatic CS Companion";
    const state = { hChars: 0, sChars: 0 };

    this.container.alpha = 0;
    this.centerBox.label.text = "";
    this.centerBox.subLabel.text = "";
    this.centerBox.container.scale.set(0);

    const tl = anime.timeline({ autoplay: true });

    tl.add({
      targets: this.container,
      alpha: [0, 1],
      duration: 600,
      easing: "linear",
    })
      .add({
        targets: this.centerBox.container.scale,
        x: [0, 1],
        y: [0, 1],
        duration: 800,
        easing: "easeOutBack",
      })
      .add({
        targets: state,
        hChars: hText.length,
        duration: 700,
        easing: "linear",
        update: () => {
          this.centerBox.label.text = hText.slice(0, Math.floor(state.hChars));
          this.centerBox.refresh();
        },
      })
      .add({
        targets: state,
        sChars: sText.length,
        duration: 900,
        easing: "linear",
        update: () => {
          if (!this.centerBox || this.centerBox.container.destroyed) return;
          this.centerBox.subLabel.text = sText.slice(
            0,
            Math.floor(state.sChars),
          );
          this.centerBox.subLabel.y = this.centerBox.label.height / 2 + 25;
          this.centerBox.refresh();
        },
      })
      .add({
        targets: this.responders.map((r) => r.container.scale),
        x: [0, 1],
        y: [0, 1],
        delay: anime.stagger(150),
        duration: 700,
        easing: "easeOutBack",
      });
  }

  destroy() {
    if (this.unsubscribeResponder) {
      this.unsubscribeResponder();
      this.unsubscribeResponder = null;
    }

    if (this.repeatInterval) {
      clearInterval(this.repeatInterval);
      this.repeatInterval = null;
    }

    anime.remove(this.container);
    if (this.responders) {
      this.responders.forEach((r) => anime.remove(r.container.scale));
    }
    if (this.centerBox) {
      anime.remove(this.centerBox.container.scale);
    }

    if (this.container && !this.container.destroyed) {
      this.container.destroy({ children: true });
    }
  }
}
