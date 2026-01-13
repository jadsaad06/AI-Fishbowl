import * as PIXI from "pixi.js";

export function createFishSprite(color = 0xffffff, width = 40, height = 20) {
  const fish = new PIXI.Container();

  const body = new PIXI.Graphics();
  body.beginFill(color);
  body.drawEllipse(0, 0, width / 2, height / 2);
  body.endFill();
  fish.addChild(body);

  const eye = new PIXI.Graphics();
  eye.beginFill(0x000000);
  eye.drawCircle(width * 0.25, -height * 0.1, Math.max(width, height) * 0.05);
  eye.endFill();
  fish.addChild(eye);

  const tailColor = Math.floor(Math.random() * 0xffffff);
  const tail = new PIXI.Graphics();
  tail.beginFill(tailColor);
  tail.moveTo(-width / 2, 0);
  tail.lineTo(-width / 2 - width * 0.3, -height * 0.4);
  tail.lineTo(-width / 2 - width * 0.3, height * 0.4);
  tail.endFill();
  tail.closePath();
  fish.addChild(tail);

  const finColor = Math.floor(Math.random() * 0xffffff);
  const topFin = new PIXI.Graphics();
  topFin.beginFill(finColor);
  topFin.moveTo(-width * 0.1, -height / 2);
  topFin.lineTo(0, -height / 2 - height * 0.3);
  topFin.lineTo(width * 0.1, -height / 2);
  topFin.endFill();
  topFin.closePath();
  fish.addChild(topFin);

  return fish;
}

export function createFancyFish(color = 0xffab00) {
  const fish = new PIXI.Container();
  const width = 100;
  const height = 50;

  const body = new PIXI.Graphics();
  body.beginFill(color);
  body.drawEllipse(0, 0, width / 2, height / 2);
  body.endFill();

  // const stripes = new PIXI.Graphics();
  // stripes.beginFill(0xffffff, 0.2);
  // stripes.drawRect(-10, -20, 5, 40);
  // stripes.drawRect(10, -20, 5, 40);
  // stripes.endFill();
  // stripes.mask = body;

  const tail = new PIXI.Graphics();
  tail.beginFill(color);
  tail.moveTo(-width / 2, 0);
  tail.bezierCurveTo(-width, -30, -width, 30, -width / 2, 0);
  tail.endFill();

  fish.addChild(body, tail);
  return fish;
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
    this.container = new PIXI.Container();
    this.fishData = [];
    this.isScattering = false;

    for (let i = 0; i < count; i++) {
      const fish = createFishSprite(
        Math.floor(Math.random() * 0xffffff),
        100,
        50
      );

      const data = {
        sprite: fish,
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        angle: Math.random() * Math.PI * 2,
        speed: 0.5 + Math.random() * 1,
      };

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
        if (f.x > window.innerWidth + 50) f.x = -50;
        if (f.x < -50) f.x = window.innerWidth + 50;
        if (f.y > window.innerHeight + 50) f.y = -50;
        if (f.y < -50) f.y = window.innerHeight + 50;
      }

      f.sprite.position.set(f.x, f.y);
      f.sprite.rotation = f.angle;
    });
  }

  scatter(originX = window.innerWidth / 2, originY = window.innerHeight / 2) {
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
