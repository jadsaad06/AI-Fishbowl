import * as PIXI from "pixi.js";
import anime from "https://cdn.jsdelivr.net/npm/animejs@3.2.2/lib/anime.es.js";
import { BackgroundManager, FishSwarm } from "../assets/sprites.js";
import {
  getResponder,
  subscribeResponder,
  subscribeMic,
  getMicActive,
} from "../state/store.js";

import {
  TypewriterText,
  GradientText,
  InfoOverlay,
  GlassBox,
  FunFactBox,
  SlidingOverlay,
  ResponderEnclosure,
  MicIndicator,
} from "../assets/sprites_anime.js";
import {
  BACKGROUNDS,
  ANIMATED_FISH,
  RESPONDERS,
  RESPONDER_LORE,
  CONTROLS,
  RESPONDER_OPTIONS,
} from "../app.js";

export class IdleSceneAnime {
  constructor(app) {
    this.app = app;
    this.container = new PIXI.Container();
    this.container.sortableChildren = true;

    this.bgManager = new BackgroundManager(app, BACKGROUNDS);
    this.container.addChild(this.bgManager.container);

    this.swarm = new FishSwarm(
      12,
      app.screen.width,
      app.screen.height,
      ANIMATED_FISH,
      80,
    );
    this.container.addChild(this.swarm.container);

    this.swarmUpdate = () => this.swarm.update();
    PIXI.Ticker.shared.add(this.swarmUpdate);

    const titleData = {
      name: "CORAL NET",
    };

    this.titleEnclosure = new ResponderEnclosure(
      titleData,
      40,
      0xffffff,
      {
        width: 600,
        height: 200,
      },
      { c1: "#ff2402", c2: "#ffff00" },
      {
        header: {
          fontSize: 64,
          fontFamily: "Verdana",
          fontWeight: "italic",
        },
      },
    );
    this.titleEnclosure.container.position.set(
      this.app.screen.width / 2,
      this.app.screen.height * 0.3,
    );
    this.container.addChild(this.titleEnclosure.container);

    this.micIndicator = new MicIndicator(app, 250, 80);
    this.micIndicator.container.position.set(
      this.app.screen.width * 0.4,
      this.app.screen.height * 0.5,
    );
    this.container.addChild(this.micIndicator.container);

    this.unsubscribeMic = subscribeMic((active) => {
      this.micIndicator.setVoiceActive(active);
    });

    this.micIndicator.setVoiceActive(getMicActive());

    // this.funFactBox = new FunFactBox(app, [
    //   "The first computer bug was an actual bug — a moth found in a relay.",
    //   "Ada Lovelace is considered the first programmer.",
    //   "The first 1GB hard drive weighed 550 lbs and cost $40,000.",
    // ]);
    // this.funFactBox.setPosition(
    //   (app.screen.width / 2) * 0.8,
    //   app.screen.height * 0.6,
    // );
    // this.container.addChild(this.funFactBox.container);

    // this.funFactBox.updateFunFact();
    // this.funFactInterval = setInterval(() => {
    //   this.funFactBox.updateFunFact();
    // }, 10000);

    this.infoOverlay = new InfoOverlay(app, RESPONDER_LORE, {
      side: "left",
      tabText: "F\nI\nS\nH\n\nS\nT\nO\nR\nI\nE\nS\n\n▶▶",
      closeHint: "◀ Left Arrow To Close",
    });

    this.optionsOverlay = new InfoOverlay(this.app, RESPONDER_OPTIONS, {
      side: "bottom",
      tabText: "GET STARTED HERE\n▲",
      closeHint:
        "Press ENTER To Select\n\n▼ Down Arrow To Close | ◀ ▶ To Navigate",
      type: "carousel",
    });

    this.controlsOverlay = new InfoOverlay(app, CONTROLS, {
      side: "right",
      tabText: "C\nO\nN\nT\nR\nO\nL\nS\n\n◀◀",
      closeHint: "Right Arrow To Close ▶",
    });

    this.shuffleInterval = setInterval(() => {
      this.bgManager.next();
    }, 30000);

    this.responderDisplayContainer = new PIXI.Container();
    this.container.addChild(this.responderDisplayContainer);
    this.container.addChild(this.infoOverlay.container);
    this.container.addChild(this.optionsOverlay.container);
    this.container.addChild(this.controlsOverlay.container);

    this.updateActiveResponder = (responderId) => {
      this.responderDisplayContainer
        .removeChildren()
        .forEach((child) => child.destroy({ children: true }));

      if (responderId === null || responderId === undefined) return;

      const data =
        RESPONDER_LORE.find((f) => f.id == responderId) ||
        RESPONDER_LORE[responderId - 1];

      if (!data) return;
      const displayData = {
        name: `${data.name}`,
        path: data.path,
        bio: `Choose Someone Else:\nPress [1-5] OR ▲`,
      };

      const activeFishCard = new ResponderEnclosure(
        displayData,
        20,
        0xffffff,
        { width: 300, height: 400 },
        { c1: "#ff2402", c2: "#ffff00" },
      );

      activeFishCard.container.position.set(
        this.app.screen.width * 0.6,
        this.app.screen.height * 0.65,
      );

      this.responderDisplayContainer.addChild(activeFishCard.container);
    };

    this.unsubscribeResponder = subscribeResponder((id) =>
      this.updateActiveResponder(id),
    );

    const initialId = getResponder();
    if (initialId) this.updateActiveResponder(initialId);

    this.helpText = new TypewriterText(
      "Use Arrow Keys [▲ ▼ ◀ ▶] To Operate\n\n" +
        `Speak To Fish By Saying:\n` +
        `   'Hey', 'Hello', 'Hi' To Your Fish\n` +
        `Chat With Your Fish By Pressing K\n` +
        `   ▶ Get To Know Your Fish!\n` +
        `   ◀ Get To Know The System!\n` +
        `   ▲ Choose Your Fish And Get Started!`,
      {
        fontFamily: "Garamond",
        fontSize: 24,
        fill: "#ebee40",
        fontWeight: "bold",
        align: "left",
      },
      { durationPerChar: 30 },
    );

    this.helpText.container.position.set(
      this.app.screen.width * 0.4,
      this.app.screen.height * 0.65,
    );
    this.container.addChild(this.helpText.container);

    this.helpBox = new GlassBox(25);
    this.helpText.container.addChildAt(this.helpBox.graphics, 0);

    this.updateLoop = () => {
      if (this.helpBox && this.helpText) {
        this.helpBox.reshape(this.helpText.textObject);
      }
    };
    this.app.ticker.add(this.updateLoop);

    const triggerHelpEffect = () => {
      this.helpBox.ripple("#1bdcf6");
      this.helpText.play();
    };

    triggerHelpEffect();
    this.helpInterval = setInterval(triggerHelpEffect, 30000);

    window.currentActiveScene = this;
  }

  destroy() {
    if (this.shuffleInterval) clearInterval(this.shuffleInterval);
    if (this.helpInterval) clearInterval(this.helpInterval);
    if (this.funFactInterval) clearInterval(this.funFactInterval);
    if (this.unsubscribeResponder) this.unsubscribeResponder();
    if (this.unsubscribeMic) this.unsubscribeMic();
    if (this.micIndicator) this.micIndicator.destroy();
    if (this.responderDisplayContainer) {
      this.responderDisplayContainer.destroy({ children: true });
    }

    if (this.updateLoop) {
      this.app.ticker.remove(this.updateLoop);
    }

    if (this.infoOverlay) this.infoOverlay.destroy();
    if (this.optionsOverlay) this.optionsOverlay.destroy();
    if (this.controlsOverlay) this.controlsOverlay.destroy();
    if (this.helpText) this.helpText.destroy();
    //this.funFactBox.destroy();

    PIXI.Ticker.shared.remove(this.swarmUpdate);

    if (this.bgManager && this.bgManager.destroy) this.bgManager.destroy();
    if (this.swarm && this.swarm.destroy) this.swarm.destroy();

    window.currentActiveScene = null;

    this.container.destroy({ children: true });
  }
}

/**
 * VERSION 2 -- FULLY WORKING DO NOT DELETE
 */

// export class IdleSceneAnime {
//   constructor(app) {
//     this.app = app;
//     this.container = new PIXI.Container();

//     this.bgManager = new BackgroundManager(app, BACKGROUNDS);
//     this.container.addChild(this.bgManager.container);

//     this.swarm = new FishSwarm(
//       20,
//       app.screen.width,
//       app.screen.height,
//       ANIMATED_FISH,
//       80,
//     );
//     this.container.addChild(this.swarm.container);

//     this.swarmUpdate = () => this.swarm.update();
//     PIXI.Ticker.shared.add(this.swarmUpdate);

//     this.title = new GradientText({
//       text: "CORAL NET",
//       fontSize: 80,
//       fontFamily: "Arial",
//       gradientColor1: "#efef05",
//       gradientColor2: "#db9271",
//       x: app.screen.width / 2,
//       y: app.screen.height / 2,
//       bold: true,
//       shadowColor: "rgba(239, 255, 11, 0.5)",
//       shadowBlur: 10,
//     });

//     this.titleBox = new GlassBox(20);
//     this.titleBox.graphics.position.set(
//       this.title.sprite.x,
//       this.title.sprite.y,
//     );
//     this.container.addChild(this.titleBox.graphics);
//     this.container.addChild(this.title.sprite);
//     this.titleBox.reshape(this.title.sprite);

//     this.funFactBox = new FunFactBox(app, [
//       "The first computer bug was an actual bug — a moth found in a relay.",
//       "Ada Lovelace is considered the first programmer.",
//       "The first 1GB hard drive weighed 550 lbs and cost $40,000.",
//     ]);
//     this.funFactBox.setPosition(
//       app.screen.width / 2,
//       (app.screen.height / 2) * 0.25,
//     );
//     this.container.addChild(this.funFactBox.container);

//     this.funFactBox.updateFunFact();
//     this.funFactInterval = setInterval(() => {
//       this.funFactBox.updateFunFact();
//     }, 10000);

//     this.infoOverlay = new InfoOverlay(app);
//     this.container.addChild(this.infoOverlay.container);

//     this.optionsOverlay = new OptionsOverlay(app);
//     this.container.addChild(this.optionsOverlay.container);

//     this.controlsOverlay = new ControlsOverlay(app);
//     this.container.addChild(this.controlsOverlay.container);

//     this.shuffleInterval = setInterval(() => {
//       this.bgManager.next();
//     }, 30000);

//     window.currentActiveScene = this;
//   }

//   destroy() {
//     if (this.shuffleInterval) clearInterval(this.shuffleInterval);
//     if (this.funFactInterval) clearInterval(this.funFactInterval);

//     if (this.infoOverlay) this.infoOverlay.destroy();
//     if (this.optionsOverlay) this.optionsOverlay.destroy();
//     if (this.controlsOverlay) this.controlsOverlay.destroy();

//     this.funFactBox.destroy();

//     PIXI.Ticker.shared.remove(this.swarmUpdate);

//     if (this.bgManager && this.bgManager.destroy) this.bgManager.destroy();
//     if (this.swarm && this.swarm.destroy) this.swarm.destroy();

//     window.currentActiveScene = null;

//     this.container.destroy({
//       children: true,
//       texture: true,
//       baseTexture: true,
//     });
//   }
// }

/**
 * VERSION 1 -- FULLY WORKING DO NOT DELETE
 */

// export class IdleSceneAnime {
//   constructor(app) {
//     this.app = app;
//     this.container = new PIXI.Container();

//     this.shuffleBoxes = [];
//     this.fixedBoxes = [];

//     this.shufflePositions = [
//       { x: app.screen.width * 0.2, y: app.screen.height * 0.8 },
//       { x: app.screen.width * 0.5, y: app.screen.height * 0.8 },
//       { x: app.screen.width * 0.8, y: app.screen.height * 0.8 },
//     ];

//     this.bgManager = new BackgroundManager(app, BACKGROUNDS);
//     this.container.addChild(this.bgManager.container);

//     this.swarm = new FishSwarm(
//       15,
//       app.screen.width,
//       app.screen.height,
//       ANIMATED_FISH,
//       120,
//     );
//     this.container.addChild(this.swarm.container);
//     this.swarmUpdate = () => this.swarm.update();

//     PIXI.Ticker.shared.add(this.swarmUpdate);

//     const initialResponder = getResponder();

//     this.headerBox = new Enclosure({
//       header: "AI Fishbowl",
//       headerStyle: { fontSize: 80, fontFamily: "Brush Script MT" },
//       subheader: "Your Aquatic CS Companion",
//       subheaderStyle: { fontSize: 32, fontFamily: "Garamond" },
//       fixedSize: { width: 500, height: 200 },
//       boxColor: 0x000000,
//     });

//     this.headerBox.setPosition(app.screen.width / 2, app.screen.height * 0.2);

//     this.container.addChild(this.headerBox.container);

//     if (this.headerBox.header) {
//       this.headerBox.container.removeChild(this.headerBox.header);
//     }
//     if (this.headerBox.subheader) {
//       this.headerBox.container.removeChild(this.headerBox.subheader);
//     }

//     this.headerTypewriter = new TypewriterText(
//       "AI Fishbowl",
//       {
//         fontSize: 80,
//         fontFamily: "Brush Script MT",
//         fill: "#ffffff",
//         align: "center",
//       },
//       {
//         durationPerChar: 50,
//       },
//     );

//     this.headerTypewriter.textObject.anchor.set(0.5);

//     this.subheaderTypewriter = new TypewriterText(
//       "Your Aquatic CS Companion",
//       {
//         fontSize: 32,
//         fontFamily: "Garamond",
//         fill: "#ffffff",
//         align: "center",
//       },
//       {
//         durationPerChar: 60,
//       },
//     );

//     this.subheaderTypewriter.textObject.anchor.set(0.5);

//     this.headerBox.container.addChild(this.headerTypewriter.container);
//     this.headerBox.container.addChild(this.subheaderTypewriter.container);
//     this.headerBox.header = this.headerTypewriter.textObject;
//     this.headerBox.subheader = this.subheaderTypewriter.textObject;
//     this.headerBox.layout();
//     this.headerTypewriter.play();
//     this.subheaderTypewriter.play();

//     this.factsList = [
//       "Parrotfish produce about 85% of the white sand on tropical beaches by eating and excreting coral.",
//       "The first hard drive, the IBM 350, weighed over a ton and held only 5MB of data.",
//       "Greenland Sharks are the longest-lived vertebrates, capable of reaching ages over 400 years.",
//       "The first webcam was created at Cambridge to monitor the water level of a coffee pot.",
//     ];

//     const names = ["Pinto", "Jimbo", "Bongo", "Koko", "Kiki"];

//     for (let i = 0; i < names.length; i++) {
//       const isSelected = initialResponder === i + 1;
//       const responderBox = new Enclosure({
//         header: names[i],
//         imagePath: RESPONDERS[i],
//         subheader: `Press ${i + 1} for ${names[i]}`,
//         fixedSize: { width: 280, height: 350 },
//         headerStyle: { fontSize: 36, fontFamily: "Brush Script MT" },
//         boxColor: isSelected ? 0x1e90ff : 0x333344,
//       });

//       if (i < 3) {
//         this.shuffleBoxes.push(responderBox);
//       } else {
//         const fixedPos =
//           i === 3
//             ? { x: app.screen.width * 0.75, y: app.screen.height * 0.2 }
//             : { x: app.screen.width * 0.9, y: app.screen.height * 0.2 };

//         responderBox.setPosition(fixedPos.x, fixedPos.y);
//         this.fixedBoxes.push(responderBox);
//       }
//     }

//     this.allResponders = [
//       ...this.shuffleBoxes,
//       this.fixedBoxes[0],
//       this.fixedBoxes[1],
//     ];

//     this.unsubscribeResponder = subscribeResponder((selected) => {
//       if (this.container.destroyed || !this.allResponders) return;

//       this.allResponders.forEach((box, i) => {
//         const highlightColor = selected === i + 1 ? 0x1e90ff : 0x333344;

//         if (typeof box.setBoxColor === "function") {
//           box.setBoxColor(highlightColor);
//         }
//       });
//     });

//     this.instructionsBox = new Enclosure({
//       header: "Controls",
//       subheader:
//         "- Press K to Type\n" +
//         "- Press L to View Responder Lore\n" +
//         "- Press R to Select Random Responder\n" +
//         "- Press 1-5 to Select Your Responder\n",
//       subheaderStyle: { align: "left", fontSize: 18 },
//       fixedSize: { width: 350, height: 300 },
//     });

//     this.instructionsBox.setPosition(
//       app.screen.width * 0.18,
//       app.screen.height * 0.2,
//     );
//     this.fixedBoxes.push(this.instructionsBox);

//     this.fixedBoxes.forEach((box) => this.container.addChild(box.container));
//     this.shuffleBoxes.forEach((box, index) => {
//       box.setPosition(
//         this.shufflePositions[index].x,
//         this.shufflePositions[index].y,
//       );
//       this.container.addChild(box.container);
//     });

//     this.funFactBox = new Enclosure({
//       header: "Here's a fact for you:",
//       headerStyle: { fontSize: 30, fontFamily: "Times New Roman" },
//       subheader: this.factsList[0],
//       fixedSize: { width: app.screen.width - 400, height: 220 },
//       boxColor: 0x1e1e2e,
//       verticalGap: 50,
//       yOffset: -10,
//     });

//     if (this.funFactBox.header) {
//       this.funFactBox.container.removeChild(this.funFactBox.header);
//     }
//     if (this.funFactBox.subheader) {
//       this.funFactBox.container.removeChild(this.funFactBox.subheader);
//     }

//     this.funFactTypewriter = new TypewriterText(
//       "Here's a fact for you:",
//       {
//         fontSize: 64,
//         fontFamily: "Brush Script MT",
//         fill: "#ffffff",
//         align: "center",
//       },
//       {
//         durationPerChar: 50,
//       },
//     );
//     this.funFactTypewriter.textObject.anchor.set(0.5);

//     this.funFactSubTypewriter = new TypewriterText(
//       "Initializing Fact Generator...",
//       {
//         fontSize: 24,
//         fill: "#ffffff",
//         wordWrap: true,
//         wordWrapWidth: app.screen.width - 440,
//         align: "center",
//       },
//       {
//         durationPerChar: 20,
//       },
//     );

//     this.funFactSubTypewriter.textObject.anchor.set(0.5);

//     this.funFactBox.container.addChild(this.funFactTypewriter.container);
//     this.funFactBox.container.addChild(this.funFactSubTypewriter.container);
//     this.funFactBox.header = this.funFactTypewriter.textObject;
//     this.funFactBox.subheader = this.funFactSubTypewriter.textObject;

//     this.funFactBox.layout();

//     this.funFactTypewriter.play();
//     this.funFactSubTypewriter.play();

//     this.funFactBox.setPosition(app.screen.width / 2, app.screen.height * 0.5);

//     this.container.addChild(this.funFactBox.container);

//     this.shuffleInterval = setInterval(() => {
//       this.shuffleEnclosures();
//       this.updateFunFact();
//       this.bgManager.next();
//     }, 25000);
//   }

//   shuffleEnclosures() {
//     const shuffled = [...this.shufflePositions].sort(() => Math.random() - 0.5);

//     this.shuffleBoxes.forEach((box, i) => {
//       const target = shuffled[i];

//       anime.remove(box.container);

//       anime({
//         targets: box.container,
//         x: target.x,
//         y: target.y,
//         duration: 1200,
//         easing: "easeInOutQuad",
//       });
//     });

//     this.headerTypewriter.play();
//     this.subheaderTypewriter.play();
//     this.funFactTypewriter.play();
//     this.funFactSubTypewriter.play();
//   }

//   updateFunFact() {
//     const applyFact = (text) => {
//       this.funFactSubTypewriter.setText(text);
//       this.funFactSubTypewriter.play();
//       this.funFactBox.layout();
//     };

//     const fallbackLocal = () => {
//       const randomIndex = Math.floor(Math.random() * this.factsList.length);
//       applyFact(this.factsList[randomIndex]);
//     };

//     const fetchNinjas = () => {
//       const url =
//         "https://api.api-ninjas.com/v1/historicalevents?text=computer";

//       // --------- UNCOMMENT FOR NINJAS API (3000 calls rate limit / month) ---------
//       // const apiKey = window.fishbowl.config.apiNinjasKey;

//       // --------- PLACEHOLDER FOR NINJAS TO SAVE CALLS WHILE TESTING -------------
//       const apiKey = "";
//       return fetch(url, {
//         method: "GET",
//         headers: { "X-Api-Key": apiKey, "Content-Type": "application/json" },
//       })
//         .then((res) => {
//           if (!res.ok) throw new Error("Ninjas Limit Reached");
//           return res.json();
//         })
//         .then((data) => {
//           if (data && data.length > 0) {
//             const item = data[Math.floor(Math.random() * data.length)];

//             applyFact(`${item.year}: ${item.event}`);
//           } else {
//             throw new Error("No Ninjas Data");
//           }
//         });
//     };

//     const fetchWiki = () => {
//       const today = new Date();
//       const month = today.getMonth() + 1;
//       const day = today.getDate();

//       const url = `https://en.wikipedia.org/api/rest_v1/feed/onthisday/selected/${month}/${day}`;

//       return fetch(url)
//         .then((res) => res.json())
//         .then((data) => {
//           if (data.selected && data.selected.length > 0) {
//             const event =
//               data.selected[Math.floor(Math.random() * data.selected.length)];

//             applyFact(`${event.year}: ${event.text}`);
//           } else {
//             throw new Error("No Wiki Data");
//           }
//         });
//     };

//     const fetchTrivia = () => {
//       const url = `https://opentdb.com/api.php?amount=1&category=18&type=boolean`;

//       return fetch(url)
//         .then((res) => res.json())
//         .then((data) => {
//           if (data.results && data.results.length > 0) {
//             const item = data.results[0];
//             const fact = this.decodeHTML
//               ? this.decodeHTML(item.question)
//               : item.question;

//             applyFact(fact);
//           } else {
//             throw new Error("No Trivia Data");
//           }
//         });
//     };

//     fetchNinjas()
//       .catch(() => fetchWiki())
//       .catch(() => fetchTrivia())
//       .catch(() => fallbackLocal());
//   }

//   destroy() {
//     if (this.unsubscribeResponder) {
//       this.unsubscribeResponder();
//       this.unsubscribeResponder = null;
//     }
//     if (this.headerTypewriter) this.headerTypewriter.destroy();
//     if (this.shuffleInterval) {
//       clearInterval(this.shuffleInterval);
//       this.shuffleInterval = null;
//     }

//     PIXI.Ticker.shared.remove(this.swarmUpdate);

//     anime.remove(this.container);

//     this.shuffleBoxes.forEach((box) => {
//       anime.remove(box.container);
//       box.destroy();
//     });

//     this.headerBox.destroy();
//     this.funFactBox.destroy();

//     this.container.destroy({ children: true });
//   }
// }
