import * as PIXI from "pixi.js";
import anime from "https://cdn.jsdelivr.net/npm/animejs@3.2.2/lib/anime.es.js";
import { BackgroundManager, FishSwarm } from "../assets/sprites.js";

import {
  AnimeIdleText,
  Enclosure,
  TypewriterText,
} from "../assets/sprites_anime.js";
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

    if (this.headerBox.header) {
      this.headerBox.container.removeChild(this.headerBox.header);
    }
    if (this.headerBox.subheader) {
      this.headerBox.container.removeChild(this.headerBox.subheader);
    }

    this.headerTypewriter = new TypewriterText(
      "AI Fishbowl",
      {
        fontSize: 80,
        fontFamily: "Brush Script MT",
        fill: "#ffffff",
        align: "center",
      },
      {
        durationPerChar: 50,
      },
    );

    this.headerTypewriter.textObject.anchor.set(0.5);

    this.subheaderTypewriter = new TypewriterText(
      "Your Aquatic CS Companion",
      {
        fontSize: 32,
        fontFamily: "Garamond",
        fill: "#ffffff",
        align: "center",
      },
      {
        durationPerChar: 60,
      },
    );

    this.subheaderTypewriter.textObject.anchor.set(0.5);

    this.headerBox.container.addChild(this.headerTypewriter.container);
    this.headerBox.container.addChild(this.subheaderTypewriter.container);
    this.headerBox.header = this.headerTypewriter.textObject;
    this.headerBox.subheader = this.subheaderTypewriter.textObject;
    this.headerBox.layout();
    this.headerTypewriter.play();
    this.subheaderTypewriter.play();

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
      verticalGap: 50,
      yOffset: -10,
    });

    if (this.funFactBox.header) {
      this.funFactBox.container.removeChild(this.funFactBox.header);
    }
    if (this.funFactBox.subheader) {
      this.funFactBox.container.removeChild(this.funFactBox.subheader);
    }

    this.funFactTypewriter = new TypewriterText(
      "Here's a fact for you:",
      {
        fontSize: 64,
        fontFamily: "Brush Script MT",
        fill: "#ffffff",
        align: "center",
      },
      {
        durationPerChar: 50,
      },
    );
    this.funFactTypewriter.textObject.anchor.set(0.5);

    let randomFact =
      this.factsList[Math.floor(Math.random() * this.factsList.length)];

    this.funFactSubTypewriter = new TypewriterText(
      randomFact,
      {
        fontSize: 24,
        fill: "#ffffff",
        wordWrap: true,
        wordWrapWidth: 740,
        align: "center",
      },
      {
        durationPerChar: 20,
      },
    );

    this.funFactSubTypewriter.textObject.anchor.set(0.5);

    this.funFactBox.container.addChild(this.funFactTypewriter.container);
    this.funFactBox.container.addChild(this.funFactSubTypewriter.container);
    this.funFactBox.header = this.funFactTypewriter.textObject;
    this.funFactBox.subheader = this.funFactSubTypewriter.textObject;

    this.funFactBox.layout();

    this.funFactTypewriter.play();
    this.funFactSubTypewriter.play();

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

    this.headerTypewriter.play();
    this.subheaderTypewriter.play();
    this.funFactTypewriter.play();
    this.funFactSubTypewriter.play();
  }

  updateFunFact() {
    const applyFact = (text) => {
      this.funFactSubTypewriter.setText(text);
      this.funFactSubTypewriter.play();
      this.funFactBox.layout();
    };

    const fallbackLocal = () => {
      const randomIndex = Math.floor(Math.random() * this.factsList.length);
      applyFact(this.factsList[randomIndex]);
    };

    const fetchNinjas = () => {
      const url =
        "https://api.api-ninjas.com/v1/historicalevents?text=computer";
      // const apiKey = window.fishbowl.config.apiNinjasKey;

      const apiKey = "";
      return fetch(url, {
        method: "GET",
        headers: { "X-Api-Key": apiKey, "Content-Type": "application/json" },
      })
        .then((res) => {
          if (!res.ok) throw new Error("Ninjas Limit Reached");
          return res.json();
        })
        .then((data) => {
          if (data && data.length > 0) {
            const item = data[Math.floor(Math.random() * data.length)];

            applyFact(`${item.year}: ${item.event}`);
          } else {
            throw new Error("No Ninjas Data");
          }
        });
    };

    const fetchWiki = () => {
      const today = new Date();
      const month = today.getMonth() + 1;
      const day = today.getDate();

      const url = `https://en.wikipedia.org/api/rest_v1/feed/onthisday/selected/${month}/${day}`;

      return fetch(url)
        .then((res) => res.json())
        .then((data) => {
          if (data.selected && data.selected.length > 0) {
            const event =
              data.selected[Math.floor(Math.random() * data.selected.length)];

            applyFact(`${event.year}: ${event.text}`);
          } else {
            throw new Error("No Wiki Data");
          }
        });
    };

    const fetchTrivia = () => {
      const url = `https://opentdb.com/api.php?amount=1&category=18&type=boolean`;

      return fetch(url)
        .then((res) => res.json())
        .then((data) => {
          if (data.results && data.results.length > 0) {
            const item = data.results[0];
            const fact = this.decodeHTML
              ? this.decodeHTML(item.question)
              : item.question;

            applyFact(fact);
          } else {
            throw new Error("No Trivia Data");
          }
        });
    };

    fetchNinjas()
      .catch(() => fetchWiki())
      .catch(() => fetchTrivia())
      .catch(() => fallbackLocal());
  }

  // updateFunFact() {
  //   //if (!this.factsList || this.factsList.length === 0) return;
  //   // -------- OPTION 1: Open Trivia DB API (DO NOT REMOVE) --------
  //   // const category = Math.random() > 0.5 ? 18 : 27;
  //   // const category = 18;
  //   // const url = `https://opentdb.com/api.php?amount=1&category=${category}&type=boolean`;

  //   // -------- OPTION 2: Wikipedia On This Day API (DO NOT REMOVE) --------
  //   // const today = new Date();
  //   // const month = today.getMonth() + 1;
  //   // const day = today.getDate();

  //   // const url = `https://en.wikipedia.org/api/rest_v1/feed/onthisday/selected/${month}/${day}`;

  //   // -------- OPTION 3: Wikipedia Category API (DO NOT REMOVE) --------
  //   // const category = "Category:Computer_science";
  //   // const url = `https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*&generator=categorymembers&gcmtitle=${category}&gcmlimit=1&prop=extracts&exintro&explaintext&exchars=300`;

  //   // -------- OPTION 4: Ninjas Historical Events API (DO NOT REMOVE) --------
  //   const url = "https://api.api-ninjas.com/v1/historicalevents?text=computer";
  //   const apiKey = window.fishbowl.config.apiNinjasKey;

  //   fetch(url, {
  //     method: "GET",
  //     headers: {
  //       "X-Api-Key": apiKey,
  //       "Content-Type": "application/json",
  //     },
  //   })
  //     .then((response) => response.json())
  //     // -------- OPTION 1: Open Trivia DB API Implementation (DO NOT REMOVE) --------
  //     // .then((data) => {
  //     //   if (data.results && data.results.length > 0) {
  //     //     const item = data.results[0];
  //     //     const decodedFact = this.decodeHTML(item.question);
  //     //     this.funFactSubTypewriter.setText(decodedFact);
  //     //     this.funFactSubTypewriter.play();
  //     //     this.funFactBox.layout();
  //     //   }
  //     // })

  //     // -------- OPTION 2: Wikipedia On This Day API Implementation (DO NOT REMOVE) --------
  //     // .then((data) => {
  //     //   if (data.selected && data.selected.length > 0) {
  //     //     const randomIndex = Math.floor(Math.random() * data.selected.length);
  //     //     const event = data.selected[randomIndex];

  //     //     const fact = `${event.year}: ${event.text}`;

  //     //     this.funFactSubTypewriter.setText(fact);
  //     //     this.funFactSubTypewriter.play();
  //     //     this.funFactBox.layout();
  //     //   }
  //     // })

  //     // -------- OPTION 3: Wikipedia Category API Implementation (DO NOT REMOVE) --------
  //     // .then((data) => {
  //     //   const pages = data.query.pages;
  //     //   const pageId = Object.keys(pages)[0];
  //     //   const fact = pages[pageId].extract;

  //     //   if (fact) {
  //     //     this.funFactSubTypewriter.setText(fact);
  //     //     this.funFactSubTypewriter.play();
  //     //     this.funFactBox.layout();
  //     //   }
  //     // })

  //     // -------- OPTION 4: Ninjas Historical Events API Implementation (DO NOT REMOVE) --------
  //     .then((data) => {
  //       if (data && data.length > 0) {
  //         const randomIndex = Math.floor(Math.random() * data.length);
  //         const item = data[randomIndex];

  //         const fact = `${item.year}: ${item.event}`;

  //         this.funFactSubTypewriter.setText(fact);
  //         this.funFactSubTypewriter.play();
  //         this.funFactBox.layout();
  //       }
  //     })
  //     .catch((err) => {
  //       const randomIndex = Math.floor(Math.random() * this.factsList.length);
  //       this.funFactSubTypewriter.setText(this.factsList[randomIndex]);
  //       this.funFactSubTypewriter.play();
  //       this.funFactBox.layout();
  //     });
  // }

  // OPTION 1: Helper function to decode HTML entities from API responses (DO NOT REMOVE)
  // decodeHTML(html) {
  //   const txt = document.createElement("textarea");
  //   txt.innerHTML = html;
  //   return txt.value;
  // }

  destroy() {
    if (this.headerTypewriter) this.headerTypewriter.destroy();
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
