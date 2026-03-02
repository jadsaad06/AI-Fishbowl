import * as PIXI from "pixi.js";
import {
  BackgroundManager,
  createFishSprite,
  FishSwarm,
} from "../assets/sprites.js";
import {
  PulseText,
  TypewriterText,
  ModernBox,
} from "../assets/sprites_anime.js";
import { BACKGROUNDS, ENHANCED_FISH } from "../app.js";
import anime from "https://cdn.jsdelivr.net/npm/animejs@3.2.2/lib/anime.es.js";

export class ListeningSceneAnime {
  constructor(app) {
    this.app = app;
    this.container = new PIXI.Container();

    this.bgManager = new BackgroundManager(app, BACKGROUNDS);
    this.container.addChild(this.bgManager.container);

    this.swarm = new FishSwarm(
      10,
      app.screen.width,
      app.screen.height,
      ENHANCED_FISH,
      80,
    );
    this.container.addChild(this.swarm.container);

    this.swarmUpdate = () => this.swarm.update();
    this.app.ticker.add(this.swarmUpdate);

    this.swarmInterval = setInterval(() => {
      this.handleSwarmCycle();
    }, 5000);

    this.syncGroup = new PIXI.Container();
    this.syncGroup.position.set(app.screen.width / 2, app.screen.height / 2);
    this.container.addChild(this.syncGroup);

    this.ripples = [];
    const rippleColor = 0x2990cc;

    for (let i = 0; i < 3; i++) {
      const ripple = new PIXI.Graphics();
      ripple.setStrokeStyle({ width: 10, color: rippleColor, alpha: 1 });
      ripple.circle(0, 0, 300);
      ripple.stroke();
      ripple.scale.set(0);
      ripple.alpha = 0;

      this.syncGroup.addChild(ripple);
      this.ripples.push(ripple);

      anime({
        targets: ripple,
        alpha: [1, 0],
        scale: [0.8, 1.5],
        duration: 3000,
        delay: i * 1000,
        easing: "easeOutExpo",
        loop: true,
      });
    }

    const fishPath = ["assets/images/listening_fish_cropped.png"];
    this.centerFish = createFishSprite(fishPath, 600);
    this.centerFish.position.set(0, 0);
    this.syncGroup.addChild(this.centerFish);

    this.pulseText = new PulseText(
      "Don't worry, I'm paying attention!\nPSU made me good at multi-tasking :)",
      {
        fontFamily: "Garamond",
        fontSize: 28,
        fill: "#FFC35C",
        wordWrap: true,
        wordWrapWidth: 600,
      },
      {
        minScale: 0.98,
        maxScale: 1.03,
        minAlpha: 0.4,
        maxAlpha: 1,
        duration: 1800,
      },
    );

    this.pulseBox = new ModernBox(50, 0x2990cc, 1);
    this.pulseText.container.addChildAt(this.pulseBox.graphics, 0);

    this.pulseText.container.position.set(0, 380);
    this.syncGroup.addChild(this.pulseText.container);

    this.pulseBox.reshape(this.pulseText.textObject);

    this.listeningText = new TypewriterText(
      "I'm All Ears",
      {
        fontFamily: "Brush Script MT",
        fontSize: 72,
        fontWeight: "bold",
        fill: "#FFC35C",
        align: "center",
      },
      {
        durationPerChar: 150,
        loop: true,
      },
    );

    this.listeningBox = new ModernBox(30, 0x2990cc, 1);
    this.listeningText.container.addChildAt(this.listeningBox.graphics, 0);

    this.listeningText.container.position.set(0, -350);
    this.syncGroup.addChild(this.listeningText.container);

    this.listeningBox.reshape(null, { width: 500, height: 120 });

    this.listeningText.play();

    anime({
      targets: this.syncGroup,
      y: app.screen.height / 2 - 40,
      duration: 2500,
      easing: "easeInOutQuad",
      direction: "alternate",
      loop: true,
    });
  }

  handleSwarmCycle() {
    this.swarm.scatter(this.app.screen.width / 2, this.app.screen.height / 2);

    setTimeout(() => {
      this.swarm.isScattering = false;
      this.swarm.fishData.forEach((f) => {
        f.speed = 0.5 + Math.random() * 1;
        f.x = Math.random() * this.app.screen.width;
        f.y = Math.random() * this.app.screen.height;
        f.angle = Math.random() * Math.PI * 2;
      });
    }, 1000);
  }

  destroy() {
    if (this.swarmUpdate) {
      this.app.ticker.remove(this.swarmUpdate);
    }
    if (this.swarmInterval) {
      clearInterval(this.swarmInterval);
    }
    if (this.listeningText) this.listeningText.destroy();
    if (this.pulseText) this.pulseText.destroy();
    if (this.ripples) this.ripples.forEach((r) => anime.remove(r));
    anime.remove(this.syncGroup);

    //if (this.bgManager) this.bgManager.destroy();
    if (this.container && !this.container.destroyed) {
      this.container.destroy({ children: true });
    }
  }
}
