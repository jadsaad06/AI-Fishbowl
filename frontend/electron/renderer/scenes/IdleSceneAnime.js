import * as PIXI from "pixi.js";
import anime from "https://cdn.jsdelivr.net/npm/animejs@3.2.2/lib/anime.es.js";
import { BackgroundManager, FishSwarm } from "../assets/sprites.js";

import { AnimeIdleText, Enclosure } from "../assets/sprites_anime.js";
import { BACKGROUNDS, ANIMATED_FISH, RESPONDERS } from "../app.js";

export class IdleSceneAnime {
  constructor(app) {
    this.app = app;
    this.container = new PIXI.Container();

    this.shuffleBoxes = [];

    this.shufflePositions = [
      // Top Left
      { x: app.screen.width * 0.18, y: app.screen.height * 0.2 },
      // Top Right
      { x: app.screen.width * 0.82, y: app.screen.height * 0.2 },
      // Bottom Left
      { x: app.screen.width * 0.18, y: app.screen.height * 0.8 },
      // Bottom Right
      { x: app.screen.width * 0.82, y: app.screen.height * 0.8 },
    ];

    this.bgManager = new BackgroundManager(app, BACKGROUNDS);
    this.container.addChild(this.bgManager.container);

    this.swarm = new FishSwarm(
      15,
      app.screen.width,
      app.screen.height,
      ANIMATED_FISH,
      120,
    );
    this.container.addChild(this.swarm.container);
    this.swarmUpdate = () => this.swarm.update();

    PIXI.Ticker.shared.add(this.swarmUpdate);

    this.headerBox = new Enclosure({
      header: "AI Fishbowl",
      headerStyle: { fontSize: 80, fontFamily: "Brush Script MT" },
      subheader: "Your Aquatic CS Companion",
      subheaderStyle: { fontSize: 32, fontFamily: "Garamond" },
      fixedSize: { width: 500, height: 200 },
      boxColor: 0x000000,
    });

    this.headerBox.setPosition(app.screen.width / 2, app.screen.height * 0.2);

    this.container.addChild(this.headerBox.container);

    this.factsList = [
      "Parrotfish produce about 85% of the white sand on tropical beaches by eating and excreting coral.",
      "The first hard drive, the IBM 350, weighed over a ton and held only 5MB of data.",
      "Greenland Sharks are the longest-lived vertebrates, capable of reaching ages over 400 years.",
      "The first webcam was created at Cambridge to monitor the water level of a coffee pot.",
    ];

    const names = ["Bob", "Jimbo", "Bongo"];

    for (let i = 0; i < 3; i++) {
      const responderBox = new Enclosure({
        header: names[i],
        imagePath: RESPONDERS[i],
        subheader: `Press ${i + 1} for ${names[i]}`,
        fixedSize: { width: 300, height: 420 },
        headerStyle: { fontSize: 36, fontFamily: "Brush Script MT" },
      });

      this.shuffleBoxes.push(responderBox);
    }

    this.instructionsBox = new Enclosure({
      header: "Controls",
      subheader:
        "- Press K to Type\n" +
        "- Press L to View Responder Lore\n" +
        "- Press R to Select Random Responder\n" +
        "- Press 1, 2, or 3 to Select Your Responder\n",
      subheaderStyle: { align: "left", fontSize: 20 },
      fixedSize: { width: 350, height: 300 },
    });

    this.shuffleBoxes.push(this.instructionsBox);

    this.shuffleBoxes.forEach((box, index) => {
      const pos = this.shufflePositions[index];
      box.setPosition(pos.x, pos.y);
      this.container.addChild(box.container);
    });

    this.funFactBox = new Enclosure({
      header: "Here's a fact for you:",
      headerStyle: { fontSize: 30, fontFamily: "Times New Roman" },
      subheader: this.factsList[0],
      fixedSize: { width: 800, height: 220 },
      boxColor: 0x1e1e2e,
    });

    this.funFactBox.setPosition(app.screen.width / 2, app.screen.height * 0.5);

    this.container.addChild(this.funFactBox.container);

    this.shuffleInterval = setInterval(() => {
      this.shuffleEnclosures();
      this.updateFunFact();
      this.bgManager.next();
    }, 5000);

    // this.factInterval = setInterval(() => {
    //   this.updateFunFact();
    // }, 5000);
  }

  shuffleEnclosures() {
    const shuffled = [...this.shufflePositions].sort(() => Math.random() - 0.5);

    this.shuffleBoxes.forEach((box, i) => {
      const target = shuffled[i];

      anime.remove(box.container);

      anime({
        targets: box.container,
        x: target.x,
        y: target.y,
        duration: 1200,
        easing: "easeInOutQuad",
      });
    });
  }

  updateFunFact() {
    //if (!this.factsList || this.factsList.length === 0) return;
    // const category = Math.random() > 0.5 ? 18 : 27;
    const category = 18;
    const url = `https://opentdb.com/api.php?amount=1&category=${category}&type=boolean`;

    fetch(url)
      .then((response) => response.json())
      .then((data) => {
        if (data.results && data.results.length > 0) {
          const item = data.results[0];
          const decodedFact = this.decodeHTML(item.question);
          this.funFactBox.setSubheader(decodedFact);
        }
      })
      .catch((err) => {
        const randomIndex = Math.floor(Math.random() * this.factsList.length);
        this.funFactBox.setSubheader(this.factsList[randomIndex]);
      });
  }

  decodeHTML(html) {
    const txt = document.createElement("textarea");
    txt.innerHTML = html;
    return txt.value;
  }

  destroy() {
    if (this.shuffleInterval) {
      clearInterval(this.shuffleInterval);
      this.shuffleInterval = null;
    }

    PIXI.Ticker.shared.remove(this.swarmUpdate);

    anime.remove(this.container);

    this.shuffleBoxes.forEach((box) => {
      anime.remove(box.container);
      box.destroy();
    });

    this.headerBox.destroy();
    this.funFactBox.destroy();

    this.container.destroy({ children: true });
  }
}
