import { flatten } from './dom-helpers';

export class AnimationsStore {
  constructor() {
    this.animations = {
      moveAnimations: [],
      enterAnimations: [],
      leaveAnimations: [],
    };
  }

  addAnimation(animationName, animation) {
    if (!this.animations[animationName] || animation.completed) {
      return;
    }
    this.animations[animationName].push(animation);

    if (animation.finished) {
      animation.finished.then(() => {
        this.animations[animationName] = this.animations[animationName].filter(
          a => a !== animation,
        );
      });
    }
  }

  removeAllAnimations() {
    this.animations.moveAnimations = [];
    this.animations.enterAnimations = [];
    // this.animations.leaveAnimations = [];
  }

  getActiveAnimations() {
    return flatten(
      flatten(Object.values(this.animations))
        .filter(a => !a.completed)
        .map(a => a.animations),
    );
  }

  hasActiveAnimations() {
    return Object.values(this.animations).some(
      animations => animations.length && animations.some(a => !a.completed),
    );
  }

  pause() {
    [this.animations.moveAnimations, this.animations.enterAnimations].forEach(
      animations => animations.forEach(a => a.pause()),
    );
  }

  playAll() {
    Object.values(this.animations).forEach(animations =>
      animations.forEach(a => a.play()),
    );
  }

  seek(value) {
    [
      this.animations.moveAnimations,
      this.animations.enterAnimations,
      this.animations.leaveAnimations,
    ].forEach(animations => animations.forEach(a => a.seek(value)));
  }
}
