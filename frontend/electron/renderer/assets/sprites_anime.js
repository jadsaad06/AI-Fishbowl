import * as PIXI from "pixi.js";
import { RESPONDERS } from "../app.js";
import { subscribeResponder, getResponder } from "../state/store.js";
import anime from "https://cdn.jsdelivr.net/npm/animejs@3.2.2/lib/anime.es.js";

const BIO_DATA = [
  {
    name: "Bob",
    bio: "- The cutest seahorse found on the Pacific Coast\n- Empathetic, Charismatic, and Considerate are qualities that Bob prides himself with\n- PS: He is a little sensitive",
  },
  {
    name: "Jimbo",
    bio: "- A little rough around the edges, but such is life on the Atlantic Coast\n- Extremely helpful, however, he can be a little crude and expects you to leave your ego at the door",
  },
  {
    name: "Bongo",
    bio: "- No one knows where he's from, other responders call him an alien\n- Very proud of his multi-color outfit",
  },
];

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
    sprite.y = -120;
    const scale = 150 / sprite.texture.width;
    sprite.scale.set(scale);
    this.container.addChild(sprite);

    const nameLabel = new PIXI.Text(BIO_DATA[index].name, {
      fontFamily: "Times New Roman",
      fontSize: 36,
      fontWeight: "bold",
      fill: "#1e90ff",
    });
    nameLabel.anchor.set(0.5);
    this.container.addChild(nameLabel);

    const bioLabel = new PIXI.Text(BIO_DATA[index].bio, {
      fontFamily: "Roboto",
      fontSize: 20,
      fill: "#ffffff",
      align: "center",
      lineHeight: 28,
      wordWrap: true,
      wordWrapWidth: width - 50,
    });

    bioLabel.anchor.set(0.5, 0);
    bioLabel.y = 100;
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

    const cardContainer = new PIXI.Container();
    const spacing = 450;

    BIO_DATA.forEach((_, i) => {
      const card = new ResponderCard(i);
      card.container.x = (i - 1) * spacing;
      cardContainer.addChild(card.container);
    });

    cardContainer.x = app.screen.width / 2;
    cardContainer.y = app.screen.height / 2;
    this.container.addChild(cardContainer);

    const closeTxt = new PIXI.Text("Press 'I' to Close", {
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
      "- Press 'r' To Reset Responder\n" +
      "- Press 1/2/3 To Select Your Responder\n" +
      "- Press 'i' To View Responder Lore";
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
      this.responders.forEach((r, i) => {
        if (i < 3) {
          r.bg.color = selected === i + 1 ? 0x1e90ff : 0x1a1a1a;
          r.refresh({ width: 280, height: 350 });
        }
      });
    });
    this.repeatInterval = setInterval(() => this.playAnimation(), 10000);
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
    if (this.unsubscribeResponder) this.unsubscribeResponder();
    if (this.repeatInterval) clearInterval(this.repeatInterval);
    anime.remove(this.container);
    this.responders.forEach((r) => anime.remove(r.container.scale));
    anime.remove(this.centerBox.container.scale);
    this.container.destroy({ children: true });
  }
}
