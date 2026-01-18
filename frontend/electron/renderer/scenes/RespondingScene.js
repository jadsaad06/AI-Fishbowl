import * as PIXI from "pixi.js";
import {
  createBackground,
  FishSwarm,
  PulsingLabel,
  createFishSprite,
  createResponder,
} from "../assets/sprites.js";
import {
  BACKGROUNDS,
  ANIMATED_FISH,
  ENHANCED_FISH,
  RESPONDERS,
} from "../app.js";

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

export class RespondingScene {
  constructor(app) {
    this.app = app;
    this.container = new PIXI.Container();
    this.bgLayer = new PIXI.Container();
    this.container.addChild(this.bgLayer);
    this.initBackground(app);

    const targetWidth = 350;
    this.responder = createResponder(app, RESPONDERS, targetWidth);
    this.container.addChild(this.responder);

    this.targetX = this.responder.x + app.screen.width * 0.1;
    this.targetY = this.responder.y - app.screen.height * 0.1;

    this.speed = 0.05;
    this.arrived = false;
    this.bubbleCreated = false;

    this.elapsed = 0;
    this.bobIntensity = 10;
    this.bobSpeed = 0.07;

    this.update = (ticker) => {
      const delta = ticker.deltaTime;

      if (!this.arrived) {
        const dx = this.targetX - this.responder.x;
        const dy = this.targetY - this.responder.y;

        this.responder.x += dx * this.speed * delta;
        this.responder.y += dy * this.speed * delta;

        if (Math.abs(dx) < 1 && Math.abs(dy) < 1) {
          this.responder.x = this.targetX;
          this.responder.y = this.targetY;
          this.arrived = true;
          this.createSpeechBubble(testSubtitles);
        }
      } else {
        this.elapsed += this.bobSpeed * delta;
        const currentBob = Math.sin(this.elapsed) * this.bobIntensity;

        const baseUpdateY = this.arrived ? this.targetY : this.responder.y;
        this.responder.y = baseUpdateY + currentBob;

        if (this.bubbleGroup) {
          this.bubbleGroup.x = this.responder.x;
          this.bubbleGroup.y = this.responder.y;
        }
      }
    };

    PIXI.Ticker.shared.add(this.update);
  }

  async initBackground(app) {
    const bg = await createBackground("assets/images/deep_sea_bg.jpg");

    bg.width = app.screen.width;
    bg.height = app.screen.height;
    this.bgLayer.addChildAt(bg, 0);
  }

  createSpeechBubble(initialText = "...") {
    if (this.bubbleCreated) return;

    this.bubbleCreated = true;

    this.bubbleGroup = new PIXI.Container();

    for (let i = 1; i <= 3; i++) {
      const circle = new PIXI.Graphics()
        .circle(0, 0, i * 12)
        .fill({ color: 0xffffff, alpha: 1 });
      circle.x = 50 + i * 55;
      circle.y = -50 - i * 55;
      this.bubbleGroup.addChild(circle);
    }

    const padding = 30;
    const rightMargin = 50;
    const textStartX = 280;
    const absoluteX = this.responder.x + textStartX;

    const dynamicWidth =
      this.app.screen.width - absoluteX - rightMargin - padding * 2;

    const style = new PIXI.TextStyle({
      fontFamily: "Arial",
      fontSize: 32,
      wordWrap: true,
      wordWrapWidth: Math.max(dynamicWidth, 200),
      breakWords: true,
    });

    this.subtitleText = new PIXI.Text({ text: initialText, style });
    //this.subtitleText.anchor.set(0, 1);
    this.subtitleText.x = textStartX;
    this.subtitleText.y = -550;

    this.bubbleBg = new PIXI.Graphics();
    this.updateBubbleBackground();

    this.bubbleGroup.addChild(this.bubbleBg);
    this.bubbleGroup.addChild(this.subtitleText);

    this.container.addChild(this.bubbleGroup);
  }

  updateSubtitles(newChunk) {
    if (!this.subtitleText) return;
    this.subtitleText.text = newChunk;
    this.updateBubbleBackground();
  }

  updateBubbleBackground() {
    if (!this.bubbleBg || !this.subtitleText) return;

    const padding = 30;
    const minWidth = 200;
    const minHeight = 200;
    const boxWidth = Math.max(this.subtitleText.width + padding * 2, minWidth);
    const boxHeight = Math.max(
      this.subtitleText.height + padding * 2,
      minHeight,
    );

    this.bubbleBg
      .clear()
      .roundRect(
        this.subtitleText.x - padding,
        this.subtitleText.y - padding,
        boxWidth,
        boxHeight,
        20,
      )
      .fill({ color: 0xffffff, alpha: 0.9 })
      .stroke({ width: 2, color: 0x000000 });
  }

  destroy() {
    PIXI.Ticker.shared.remove(this.update);
    this.container.destroy({ children: true });
  }
}
