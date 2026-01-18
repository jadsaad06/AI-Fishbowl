import * as PIXI from "pixi.js";
import {
  BACKGROUNDS,
  ANIMATED_FISH,
  ENHANCED_FISH,
  RESPONDERS,
} from "../app.js";

export async function createBackground(
  path = "./assets/images/background_2.png",
) {
  const texture = await PIXI.Assets.load(path);
  const background = new PIXI.Sprite(texture);
  return background;
}

export class BackgroundManager {
  constructor(app, texturePaths) {
    this.app = app;
    this.texturePaths = texturePaths;
    this.currentIndex = 0;
    this.container = new PIXI.Container();

    this.sprite = new PIXI.Sprite();
    this.sprite.anchor.set(0.5);
    this.sprite.x = app.screen.width / 2;
    this.sprite.y = app.screen.height / 2;

    this.container.addChild(this.sprite);
    this.updateTexture();
  }

  updateTexture() {
    const texturePath = this.texturePaths[this.currentIndex];
    this.sprite.texture = PIXI.Assets.get(texturePath);

    const ratio = Math.max(
      this.app.screen.width / this.sprite.texture.width,
      this.app.screen.height / this.sprite.texture.height,
    );
    this.sprite.scale.set(ratio);
  }

  next() {
    this.currentIndex = (this.currentIndex + 1) % this.texturePaths.length;
    this.updateTexture();
  }
}

export function createFishSprite(fishList = [], targetWidth = 100) {
  const path = fishList[Math.floor(Math.random() * fishList.length)];

  const texture = PIXI.Texture.from(path);
  const fish = new PIXI.Sprite(texture);
  fish.anchor.set(0.5);

  autoScale(fish, targetWidth);

  const variance = 0.9 + Math.random() * 0.2;
  fish.scale.x *= variance;
  fish.scale.y *= variance;

  return fish;
}

export function createDiver() {
  const texture = PIXI.Texture.from("assets/images/ocean_diver.png");
  const diver = new PIXI.Sprite(texture);
  diver.anchor.set(0.5);
  diver.scale.set(0.15);
  return diver;
}
export class Diver {
  constructor(app, targetWidth = 150) {
    this.app = app;
    this.sprite = createDiver();

    const randomScale = 0.8 + Math.random() * 0.4;
    targetWidth = targetWidth * randomScale;

    autoScale(this.sprite, targetWidth);

    this.sprite.x =
      Math.random() * (app.screen.width - this.sprite.width) +
      this.sprite.width / 2;
    this.sprite.y =
      Math.random() * (app.screen.height - this.sprite.height) +
      this.sprite.height / 2;

    const speed = 0.3 + Math.random() * 2;
    this.vx = Math.random() > 0.5 ? speed : -speed;
    this.vy = Math.random() > 0.5 ? speed : -speed;

    this.rotationSpeed = 0.02;
  }

  update() {
    this.sprite.x += this.vx;
    this.sprite.y += this.vy;

    const halfWidth = this.sprite.width / 2;
    const halfHeight = this.sprite.height / 2;

    if (
      this.sprite.x + halfWidth >= this.app.screen.width ||
      this.sprite.x - halfWidth <= 0
    ) {
      this.vx *= -1;
      this.sprite.scale.x *= -1;
    }
    if (
      this.sprite.y + halfHeight >= this.app.screen.height ||
      this.sprite.y - halfHeight <= 0
    ) {
      this.vy *= -1;
    }

    const baseAngle = Math.atan2(this.vy, this.vx);

    this.sprite.rotation = baseAngle + Math.PI;

    if (this.vx > 0) {
      this.sprite.scale.x = -Math.abs(this.sprite.scale.x);
    } else {
      this.sprite.scale.x = Math.abs(this.sprite.scale.x);
    }

    this.sprite.scale.x = Math.abs(this.sprite.scale.x);
  }
}

export class FishSwarm {
  constructor(count = 20, width, height, fishFiles, targetWidth = 100) {
    this.width = width;
    this.height = height;
    this.container = new PIXI.Container();
    this.fishData = [];
    this.isScattering = false;
    this.fishFiles = fishFiles;

    for (let i = 0; i < count; i++) {
      const fish = createFishSprite(fishFiles, targetWidth);

      const data = {
        sprite: fish,
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        angle: Math.random() * Math.PI * 2,
        speed: 0.5 + Math.random() * 1,
      };

      fish.position.set(data.x, data.y);
      this.container.addChild(fish);
      this.fishData.push(data);
    }
  }

  update() {
    this.fishData.forEach((f) => {
      f.x += Math.cos(f.angle) * f.speed;
      f.y += Math.sin(f.angle) * f.speed;

      if (this.isScattering) {
        f.speed *= 0.98;
      }

      if (!this.isScattering) {
        if (f.x > this.width + 50) f.x = -50;
        if (f.x < -50) f.x = this.width + 50;
        if (f.y > this.height + 50) f.y = -50;
        if (f.y < -50) f.y = this.height + 50;
      }

      f.sprite.position.set(f.x, f.y);

      if (this.fishFiles == "ENHANCED_FISH") {
        f.sprite.rotation = f.angle + Math.PI;

        if (Math.cos(f.angle) > 0) {
          f.sprite.scale.y = -Math.abs(f.sprite.scale.y);
        } else {
          f.sprite.scale.y = Math.abs(f.sprite.scale.y);
        }
      } else if (this.fishFiles == "ANIMATED_FISH") {
        f.sprite.rotation = f.angle;

        if (Math.cos(f.angle) < 0) {
          f.sprite.scale.y = -Math.abs(f.sprite.scale.y);
        } else {
          f.sprite.scale.y = Math.abs(f.sprite.scale.y);
        }
      }
    });
  }

  scatter(originX = this.width / 2, originY = this.height / 2) {
    this.isScattering = true;

    this.fishData.forEach((f) => {
      const dx = f.x - originX;
      const dy = f.y - originY;

      f.angle = Math.atan2(dy, dx);

      f.speed = 30 + Math.random() * 10;
    });
  }
}

export function createResponder(app, imageList = [], targetWidth = 200) {
  const path = imageList[Math.floor(Math.random() * imageList.length)];
  const texture = PIXI.Texture.from(path);
  const responder = new PIXI.Sprite(texture);

  responder.anchor.set(0.5);

  autoScale(responder, targetWidth);

  const variance = 0.9 + Math.random() * 0.2;
  responder.x = 0;
  responder.y = app.screen.height - responder.height / 2;

  return responder;
}
// export class Responder {
//   constructor(app, fishFiles, targetWidth = 150) {
//     this.app = app;
//     this.container = new PIXI.Container();

//     const path = fishFiles[Math.floor(Math.random() * fishFiles.length)];
//     this.sprite = PIXI.Sprite.from(path);
//     this.sprite.anchor.set(0.5);
//     // autoScale(this.sprite, targetWidth);

//     // this.container.x = -100;
//     // this.container.y = app.screen.height - 150;
//     this.container.x = 400;
//     this.container.y = 400;

//     this.targetX = app.screen.width * 0.15;
//     this.targetY = app.screen.height - 200;

//     this.isStationary = false;
//     this.bubbleCreated = false;
//     this.container.addChild(this.sprite);
//   }

//   update(delta) {
//     if (!this.isStationary) {
//       const dx = this.targetX - this.container.x;
//       const dy = this.targetY - this.container.y;

//       this.container.x += dx * 0.05 * delta;
//       this.container.y += dy * 0.05 * delta;

//       if (Math.abs(dx) < 1 && Math.abs(dy) < 1) {
//         this.isStationary = true;
//       }
//     }
//   }

//   createSpeechBubble(text = "...") {
//     if (this.bubbleCreated) return;

//     this.bubbleCreated = true;

//     const bubbleGroup = new PIXI.Container();

//     for (let i = 1; i <= 3; i++) {
//       const circle = new PIXI.Graphics()
//         .circle(0, 0, i * 5)
//         .fill({ color: 0xffffff, alpha: 0.8 });
//       circle.x = 40 + i * 20;
//       circle.y = -40 - i * 20;
//       bubbleGroup.addChild(circle);
//     }

//     const style = new PIXI.TextStyle({
//       fontFamily: "Arial",
//       fontSize: 24,
//       wordWrap: true,
//       wordWrapWidth: 400,
//     });

//     const txt = new PIXI.Text({ text, style });
//     txt.anchor.set(0);
//     txt.x = 120;
//     txt.y = -250;

//     const bg = new PIXI.Graphics()
//       .roundRect(txt.x - 20, txt.y - 20, txt.width + 40, txt.height + 40, 15)
//       .fill({ color: 0xffffff, alpha: 0.9 })
//       .stroke({ width: 2, color: 0x000000 });

//     bubbleGroup.addChild(bg);
//     bubbleGroup.addChild(txt);

//     this.container.addChild(bubbleGroup);
//   }
// }

export class PulsingLabel {
  constructor(app, text = "INTERACT TO START") {
    this.container = new PIXI.Container();

    const style = new PIXI.TextStyle({
      fontFamily: "Times New Roman",
      fontSize: 54,
      fill: "#ffffff",
      fontWeight: "bold",
      dropShadow: true,
      dropShadowColor: "#000000",
      dropShadowBlur: 10,
      dropShadowDistance: 0,
    });

    this.text = new PIXI.Text(text, style);
    this.text.anchor.set(0.5);

    const padding = 60;
    const ellipseWidth = this.text.width + padding * 2;
    const ellipseHeight = this.text.height + padding * 4;

    this.bg = new PIXI.Graphics();

    this.bg.ellipse(0, 0, ellipseWidth / 2, ellipseHeight / 2);
    this.bg.fill({ color: 0x000000, alpha: 0.8 });
    this.bg.stroke({ width: 4, color: 0xffffff });

    this.container.addChild(this.bg);
    this.container.addChild(this.text);
    this.container.position.set(app.screen.width / 2, app.screen.height / 2);

    this.elapsed = 0;
  }

  update(delta) {
    this.elapsed += 0.01;

    this.container.alpha = 0.6 + Math.sin(this.elapsed) * 0.4;
  }
}

export const CommonStyles = {
  header: new PIXI.TextStyle({
    fontFamily: "Times New Roman",
    fontSize: 36,
    fill: "#0f0202ff",
    fontWeight: "bold",
  }),
};

export function autoScale(sprite, targetWidth) {
  if (!sprite.texture || !sprite.texture.width || sprite.texture.width === 0)
    return;
  const scaleFactor = targetWidth / sprite.texture.width;
  sprite.scale.set(scaleFactor);
}

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}
