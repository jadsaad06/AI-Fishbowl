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

export class FishSwarm {
  constructor(count = 20, width, height) {
    this.container = new PIXI.Container();
    this.fishData = [];

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
        speed: 1 + Math.random() * 2,
      };

      this.container.addChild(fish);
      this.fishData.push(data);
    }
  }

  update() {
    this.fishData.forEach((f) => {
      f.x += Math.cos(f.angle) * f.speed;
      f.y += Math.sin(f.angle) * f.speed;

      if (f.x > window.innerWidth + 50) f.x = -50;
      if (f.x < -50) f.x = window.innerWidth + 50;
      if (f.y > window.innerHeight + 50) f.y = -50;
      if (f.y < -50) f.y = window.innerHeight + 50;

      f.sprite.position.set(f.x, f.y);
      f.sprite.rotation = f.angle;
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
