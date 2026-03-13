/**
 * This file contains the animations that are spawned when an agent response is received and the responding state is invoked.
 * It only spawns when the Text To Speech functionality is active. Which is an opaque dependency. Refer to tts_wrapper.py when debugging state invokations.
 *
 * It spawns the chosen responder, with subtitles received via the Inter Process Communication handler, and uses the TypewriterText class to type out the subtitles
 * in human speech speed to imitate subtitle streaming.
 *
 * It automatically closes and gets cleaned up once the Text to Speech model prints the TTS_SPEECH_ENDED flag from the child process.
 */

import * as PIXI from "pixi.js";
import { getResponder } from "../state/store.js";
import { BackgroundRandomizer, createResponder } from "../assets/sprites.js";
import {
  TypewriterText,
  ModernBox,
  GlassBox,
} from "../assets/sprites_anime.js";
import { RESPONDERS, BACKGROUNDS } from "../app.js";
import anime from "https://cdn.jsdelivr.net/npm/animejs@3.2.2/lib/anime.es.js";

const testSubtitles =
  "DEBUG_LOG_START: [Error_404_Unexpected_Token_In_JSON_Payload_At_Line_128] " +
  "This is a standard sentence to test word wrapping. " +
  "Now we test a very_long_string_without_any_spaces_to_verify_that_breakWords_is_functioning_correctly_and_not_pushing_the_box_off_the_right_edge_of_the_screen. " +
  "\n\n" +
  "Paragraph 2 Check: Testing vertical expansion. \n" +
  "Line 1...\nLine 2...\nLine 3...\nLine 4...\nLine 5...\n" +
  "Final Edge Case: !@#$%^&*()_+|}{[]:;?><,./~`" +
  "More" +
  "Extremely long line with a bunch of text and strings and random stuff that is going to or planning to test the width expansion of the subtitles box and to see if the wordwrap functionality actually works as intended, if it works it's fantastic!";

export class RespondingSceneAnime {
  constructor(app, initialSubtitles) {
    this.app = app;
    this.container = new PIXI.Container();

    this.bg = new BackgroundRandomizer(app, BACKGROUNDS);
    this.container.addChild(this.bg.container);

    const margin = 100;
    const startX = app.screen.width * 0.15 + 250;
    this.MAX_WIDTH = app.screen.width - startX - margin;
    this.MAX_HEIGHT = 800;

    this.syncGroup = new PIXI.Container();
    this.syncGroup.position.set(app.screen.width * 0.1, app.screen.height / 2);
    this.container.addChild(this.syncGroup);

    const selectedID = getResponder();
    const responderIndex = selectedID && selectedID > 0 ? selectedID - 1 : 0;
    const responderPath = RESPONDERS[responderIndex];

    this.responder = createResponder(app, responderPath, 350);
    this.responder.position.set(0, 0);
    this.syncGroup.addChild(this.responder);

    this.typewriter = new TypewriterText(
      "",
      {
        fontFamily: "Courier New",
        fontSize: 28,
        fill: "#000000",
        align: "left",
        wordWrap: true,
        wordWrapWidth: this.MAX_WIDTH,
        breakWords: true,
      },
      {
        durationPerChar: 40,
        loop: false,
      },
    );
    this.typewriter.textObject.anchor.set(0, 0);
    this.typewriter.container.position.set(250, -200);

    this.subBox = new ModernBox(40, 0xffffff, 0.9);
    this.typewriter.container.addChildAt(this.subBox.graphics, 0);
    this.syncGroup.addChild(this.typewriter.container);

    this.typewriter.setText(initialSubtitles || testSubtitles);

    this.micOffContainer = new PIXI.Container();

    this.micMuteBox = new GlassBox(12);

    const muteIcon = PIXI.Sprite.from("assets/images/mic_mute.png");
    muteIcon.anchor.set(0.5);
    muteIcon.width = 80;
    muteIcon.height = 80;

    this.micOffContainer.addChild(this.micMuteBox.graphics);
    this.micOffContainer.addChild(muteIcon);

    this.micOffContainer.position.set(
      this.app.screen.width / 2,
      this.app.screen.height * 0.1,
    );

    this.container.addChild(this.micOffContainer);

    this.micMuteBox.reshape(muteIcon);

    //this.updateSubtitles(initialSubtitles || testSubtitles);

    this.initAnimations();

    this.updateLoop = () => {
      if (this.subBox && this.typewriter) {
        const isAnimating =
          this.typewriter._animation && !this.typewriter._animation.paused;
        if (
          !isAnimating &&
          this.typewriter.textObject.height > this.MAX_HEIGHT
        ) {
          this.truncateText();
        }
        this.subBox.reshape(this.typewriter.textObject);
      }
    };
    this.app.ticker.add(this.updateLoop);
  }

  truncateText() {
    this.typewriter.stop();
    let currentText = this.typewriter.textObject.text;

    while (
      this.typewriter.textObject.height > this.MAX_HEIGHT &&
      currentText.length > 0
    ) {
      currentText = currentText.substring(0, currentText.length - 4);
      this.typewriter.textObject.text = currentText + "...";
    }
  }

  initAnimations() {
    const finalX = this.app.screen.width * 0.15;
    const finalY = this.app.screen.height / 2;

    anime({
      targets: this.syncGroup,
      x: finalX,
      y: finalY,
      duration: 2000,
      easing: "easeOutCubic",
      complete: () => {
        this.typewriter.play();

        anime({
          targets: this.syncGroup,
          y: finalY - 30,
          duration: 2000,
          direction: "alternate",
          loop: true,
          easing: "easeOutSine",
        });
      },
    });
  }

  updateSubtitles(newText) {
    if (!this.typewriter) return;

    // const safeText =
    //   newText.length > 1000 ? newText.substring(0, 1000) + "..." : newText;
    this.typewriter.stop();
    this.typewriter.setText(newText);
    this.typewriter.play();
  }

  destroy() {
    if (this.updateLoop) {
      this.app.ticker.remove(this.updateLoop);
    }
    anime.remove(this.syncGroup);
    if (this.typewriter) this.typewriter.destroy();
    if (this.container && !this.container.destroyed) {
      this.container.destroy({ children: true });
    }
  }
}
