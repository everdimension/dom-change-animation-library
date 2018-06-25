import anime from 'animejs';
import { includes, flatten } from './dom-helpers';

const emptyTransforms = {
  translateX: 0,
  translateY: 0,
};

function getTransformsForNode(node, animations = []) {
  /**
   * Here we calculate how far the node is from where it should be
   * due to an unfinished animation
   */
  const targetAnimations = animations.filter(
    a => a.type === 'transform' && a.animatable.target === node,
  );
  if (!targetAnimations.length) {
    return emptyTransforms;
  }
  return targetAnimations.reduce((acc, animation) => {
    acc[animation.property] = parseFloat(animation.currentValue);
    return acc;
  }, {});
}

function getPositions(target, animations = []) {
  let positions = [];
  for (let node of target.children) {
    const clientRect = node.getBoundingClientRect();
    const transforms = getTransformsForNode(node, animations);
    positions.push({
      rect: {
        x: clientRect.x - (transforms.translateX || 0),
        y: clientRect.y - (transforms.translateY || 0),
        top: clientRect.top - (transforms.translateY || 0),
        bottom: clientRect.bottom - (transforms.translateY || 0),
        left: clientRect.left - (transforms.translateX || 0),
        right: clientRect.right - (transforms.translateX || 0),
        width: clientRect.width,
        height: clientRect.height,
      },
      node,
    });
  }
  return positions;
}

function getInversedOffsets(prevPositions, newPositions, animations) {
  return newPositions.map(position => {
    const prevPos = prevPositions.find(p => p.node === position.node);
    if (!prevPos) {
      throw new Error('No previous position found for element');
    }
    const diffX = prevPos.rect.left - position.rect.left;
    const diffY = prevPos.rect.top - position.rect.top;
    return {
      node: position.node,
      styles: {
        translateX: diffX,
        translateY: diffY,
      },
    };
  });
}

function getContainerRect(node) {
  const { top, left } = node.getBoundingClientRect();
  return { top, left };
}

function updatePositionsWithAnimation(positions, animations) {
  return positions.map(position => {
    // it is okay to mutate `position` here
    const transforms = getTransformsForNode(position.node, animations);
    if (!transforms.translateY) {
      console.log(position, transforms.translateY);
    }
    position.rect.x += (transforms.translateX || 0);
    position.rect.left += (transforms.translateX || 0);
    position.rect.right += (transforms.translateX || 0);
    position.rect.y += (transforms.translateY || 0);
    position.rect.top += (transforms.translateY || 0);
    position.rect.bottom += (transforms.translateY || 0);
    return position;
  });
}

class AnimationsStore {
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

    animation.finished.then(() => {
      this.animations[animationName] = this.animations[animationName].filter(
        a => a !== animation,
      );
    });
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
    [this.animations.moveAnimations, this.animations.enterAnimations, this.animations.leaveAnimations].forEach(
      animations => animations.forEach(a => a.play()),
    );
  }

  seek(value) {
    [this.animations.moveAnimations, this.animations.enterAnimations, this.animations.leaveAnimations].forEach(
      animations => animations.forEach(a => a.seek(value)),
    );
  }
}

export class AnimateList {
  constructor(target) {
    this.prevPositions = null;
    this.currentPositions = getPositions(target);
    this.currentContainerPosition = getContainerRect(target);
    this.animation = null;
    this.animations = new AnimationsStore();
    this.observer = new MutationObserver(this.animateChange.bind(this));
    this.observer.observe(target, { childList: true });
    this.drawingOffset = 100;
    this.autoplay = true;
    this.duration = 1000;
  }

  animateChange(mutations) {
    const record = mutations[0];
    const shouldAccountForAnimation = this.animations.hasActiveAnimations();
    const activeAnimations = shouldAccountForAnimation
      ? this.animations.getActiveAnimations()
      : undefined;
    const newPositions = getPositions(record.target, activeAnimations);

    const childListMutations = mutations.filter(m => m.type === 'childList');

    const { addedNodesRecord, removedNodesRecord } = childListMutations.reduce(
      (acc, m) => {
        acc.addedNodesRecord.push(...m.addedNodes);
        acc.removedNodesRecord.push(...m.removedNodes);
        return acc;
      },
      { addedNodesRecord: [], removedNodesRecord: [] },
    );

    const removedNodes = removedNodesRecord.filter(
      n => !addedNodesRecord.includes(n),
    );

    const addedNodes = addedNodesRecord.filter(
      n => !removedNodesRecord.includes(n),
    );

    const positionsToMove = newPositions.filter(
      p => !addedNodes.includes(p.node),
    );

    if (shouldAccountForAnimation) {
      this.animations.pause();
      this.currentPositions = updatePositionsWithAnimation(
        this.currentPositions,
        activeAnimations,
      );
    }
    const inversedPositions = getInversedOffsets(
      this.currentPositions,
      positionsToMove,
      activeAnimations,
    );

    this.animations.removeAllAnimations();
    const moveAnimation = this.animateMove(inversedPositions);
    const enterAnimation = this.animateEntrance(addedNodes);
    const leaveAnimation = this.drawRemovedNodes(removedNodes);
    this.animations.addAnimation('moveAnimations', moveAnimation);
    this.animations.addAnimation('enterAnimations', enterAnimation);
    this.animations.addAnimation('leaveAnimations', leaveAnimation);

    this.prevPositions = this.currentPositions;
    this.currentPositions = newPositions;
  }

  animateMove(startingPositions) {
    const changedPositions = startingPositions.filter(
      p => p.styles.translateX !== 0 || p.styles.translateY !== 0,
    );

    /** move elements back to where they were without animation */
    changedPositions.forEach(p => {
      const { translateX: x, translateY: y } = p.styles;
      p.node.style.transform = `translateX(${x}px) translateY(${y}px)`;
    });

    const targets = changedPositions.map(p => p.node);
    /** animate elements to where they should be */
    return anime({
      targets,
      translateX: 0,
      translateY: 0,
      opacity: 1,
      duration: this.duration,
      autoplay: this.autoplay,
    });
  }

  animateEntrance(targets) {
    const targetStyleProps = {
      opacity: 1,
      translateX: 0,
    };
    if (targets.length) {
      const targetOpacity = getComputedStyle(targets[0]).opacity;
      targetStyleProps.opacity = targetOpacity || 1;
    }
    targets.forEach(t => {
      t.style.transform = 'translateX(200px)';
      t.style.opacity = 0;
    });
    return anime({
      targets,
      translateX: targetStyleProps.translateX,
      opacity: targetStyleProps.opacity,
      duration: this.duration,
      autoplay: this.autoplay,
    });
  }

  drawRemovedNodes(nodes) {
    const clones = nodes.map(node => {
      const position = this.currentPositions.find(p => p.node === node);
      if (!position) {
        return;
      }
      const { top, left, width } = position.rect;
      const div = document.createElement('div');
      div.style.position = 'fixed';
      div.style.width = `${width}px`;
      div.style.top = `${top}px`;
      div.style.left = `${left}px`;
      const clone = node.cloneNode(true);
      clone.style.transform = '';
      div.appendChild(clone);
      return div;
    });
    clones.forEach(clone => {
      document.body.appendChild(clone);
    });
    const animation = anime({
      targets: clones,
      opacity: 0,
      duration: this.duration,
        elasticity: 0,
      complete: () => {
        clones.forEach(n => n.remove());
        clones.length = null;
      },
      autoplay: this.autoplay,
    });
    return animation;
  }

  drawPositions(positions) {
    positions.forEach(({ rect, node }) => {
      const clone = node.cloneNode(true);
      clone.style.transform = '';
      clone.style.position = 'absolute';
      clone.style.left = `${rect.left + this.drawingOffset}px`;
      clone.style.width = `${rect.width}px`;
      clone.style.top = `${rect.top}px`;
      clone.style.opacity = 0.2;
      document.body.appendChild(clone);
    });
    this.drawingOffset += 100;
  }

  pause() {
    if (this.animations) {
      this.animations.pause();
    }
  }
}
