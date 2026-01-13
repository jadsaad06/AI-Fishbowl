import * as PIXI from "pixi.js";

const FISH_TEXTURE_PATHS = [
  "assets/images/fish_blue.png",
  "assets/images/fish_brown.png",
  "assets/images/fish_green.png",
  "assets/images/fish_orange.png",
  "assets/images/fish_red.png",
  "assets/images/fish_pink.png",
  "assets/images/fish_grey.png",
];

export function createFishSprite(isBig = false, customPath = null) {
  const path =
    customPath ||
    FISH_TEXTURE_PATHS[Math.floor(Math.random() * FISH_TEXTURE_PATHS.length)];

  const texture = PIXI.Texture.from(path);
  const fish = new PIXI.Sprite(texture);
  fish.anchor.set(0.5);

  if (isBig) {
    fish.scale.set(0.1 + Math.random() * 0.1);
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

export async function createBackground(
  path = "./assets/images/Underwater BG Blank.png"
) {
  const texture = await PIXI.Assets.load(path);
  const background = new PIXI.Sprite(texture);
  return background;
}
export class FishSwarm {
  constructor(count = 20, width, height) {
    this.width = width;
    this.height = height;

    this.container = new PIXI.Container();
    this.fishData = [];
    this.isScattering = false;

    for (let i = 0; i < count; i++) {
      const fish = createFishSprite(false);

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

      f.speed = 40 + Math.random() * 20;
    });
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
