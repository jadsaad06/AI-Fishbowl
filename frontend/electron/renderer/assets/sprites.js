import * as PIXI from "pixi.js";

const IDLE_SCENE_FISH = [
  "assets/images/fish_blue.png",
  "assets/images/fish_brown.png",
  "assets/images/fish_green.png",
  "assets/images/fish_orange.png",
  "assets/images/fish_red.png",
  "assets/images/fish_pink.png",
  "assets/images/fish_grey.png",
];

const LISTENING_SCENE_FISH = [
  "assets/images/Red_Fish_AnarkaliArt.png",
  "assets/images/animated_fish_1.png",
  "assets/images/animated_fish_2.png",
  "assets/images/fish_tuna.png",
];

export async function createBackground(
  path = "./assets/images/deep_sea_bg.jpg"
) {
  const texture = await PIXI.Assets.load(path);
  const background = new PIXI.Sprite(texture);
  return background;
}

export function createFishSprite(fishList = null) {
  const path = fishList[Math.floor(Math.random() * fishList.length)];

  const texture = PIXI.Texture.from(path);
  const fish = new PIXI.Sprite(texture);
  fish.anchor.set(0.5);

  if (fishList == LISTENING_SCENE_FISH) {
    fish.scale.set(0.05 + Math.random() * 0.1);
  } else {
    fish.scale.set(1.5 + Math.random() * 0.3);
  }
  return fish;
}

export class BigFish {
  constructor(width, height) {
    this.width = width;
    this.height = height;

    const BIG_FISH_PATH = "assets/images/Red_Fish_AnarkaliArt.png";
    this.sprite = createFishSprite(true, BIG_FISH_PATH);

    this.x = -200;
    this.y = this.height * 0.3 + Math.random() * (this.height * 0.4);
    this.speed = 0.8;

    this.sprite.scale.x = -Math.abs(this.sprite.scale.x);

    this.sprite.rotation = 0;
    this.sprite.position.set(this.x, this.y);
  }

  update() {
    this.x += this.speed;

    if (this.x > this.width + 200) {
      this.x = -200;
      this.y = Math.random() * this.height;
    }

    this.sprite.position.set(this.x, this.y);
  }
}

export function createDiver() {
  const texture = PIXI.Texture.from("assets/images/ocean_diver.png");
  const diver = new PIXI.Sprite(texture);
  diver.anchor.set(0.5);
  diver.scale.set(0.15);
  return diver;
}
export class Diver {
  constructor(width, height) {
    this.width = width;
    this.height = height;

    this.sprite = createDiver();

    this.x = width + 200;
    this.baseY = height / 2;

    this.speed = 0.5;
    this.waveSpeed = 0.02;
    this.amplitude = 20;
    this.elapsed = 0;

    this.sprite.position.set(this.x, this.baseY);
  }

  update() {
    this.x -= this.speed;

    this.elapsed += this.waveSpeed;
    const yOffset = Math.sin(this.elapsed) * this.amplitude;

    if (this.x < -200) {
      this.x = this.width + 200;
      this.baseY = this.height * 0.3 + Math.random() * (this.height * 0.4);
    }

    this.sprite.x = this.x;
    this.sprite.y = this.baseY + yOffset;

    this.sprite.rotation = Math.cos(this.elapsed) * 0.2;
  }
}

export class FishSwarm {
  constructor(count = 20, width, height, scene = "idle") {
    this.width = width;
    this.height = height;

    this.container = new PIXI.Container();
    this.fishData = [];
    this.isScattering = false;
    let list_to_use = [];

    if (scene == "idle") {
      list_to_use = IDLE_SCENE_FISH;
    } else if (scene == "listening") {
      list_to_use = LISTENING_SCENE_FISH;
    }

    for (let i = 0; i < count; i++) {
      const fish = createFishSprite(list_to_use);

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

      f.sprite.rotation = f.angle;

      if (Math.cos(f.angle) < 0) {
        f.sprite.scale.y = -Math.abs(f.sprite.scale.y);
      } else {
        f.sprite.scale.y = Math.abs(f.sprite.scale.y);
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

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}
