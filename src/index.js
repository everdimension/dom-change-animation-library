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

function getChildrenPositions(target, animations = []) {
  const positions = [];
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

function collectPositionsData(target, animations) {
  const children = getChildrenPositions(target, animations);
  const containerRect = target.getBoundingClientRect();
  const container = {
    x: containerRect.x,
    y: containerRect.y,
    left: containerRect.left,
    top: containerRect.top,
  };
  return {
    container,
    children,
  };
}

function getInversedOffsets(prevPositions, newPositionsData, animations) {
  return newPositionsData.map(position => {
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
    position.rect.x += transforms.translateX || 0;
    position.rect.left += transforms.translateX || 0;
    position.rect.right += transforms.translateX || 0;
    position.rect.y += transforms.translateY || 0;
    position.rect.top += transforms.translateY || 0;
    position.rect.bottom += transforms.translateY || 0;
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

const defaultAnimationOptions = {
  autoplay: true,
  duration: 1000,
};
const defaultLeaveAnimationOptions = Object.assign(
  { elasticity: 0 },
  defaultAnimationOptions,
);

export class AnimateList {
  constructor(
    target,
    { animationOptions } = {
      animationOptions: {
        enter: defaultAnimationOptions,
        move: defaultAnimationOptions,
        leave: defaultLeaveAnimationOptions,
      },
    },
  ) {
    this.target = target;
    this.positionsData = collectPositionsData(target);
    this.currentContainerPosition = getContainerRect(target);
    this.animation = null;
    this.animations = new AnimationsStore();
    this.observer = new MutationObserver(this.animateChange.bind(this));
    this.observer.observe(target, { childList: true });

    /** animejs params */
    this.animationOptions = Object.assign({}, defaultAnimationOptions, {
      move: Object.assign({}, defaultAnimationOptions, animationOptions.move),
      enter: Object.assign({}, defaultAnimationOptions, animationOptions.enter),
      leave: Object.assign(
        defaultLeaveAnimationOptions,
        animationOptions.leave,
      ),
    });
  }

  takeSnapshotBeforeUpdate() {
    this.positionsData = collectPositionsData(this.target);
    this.didTakeSnapshotBeforeUpdate = true;
  }

  animateChange(mutations) {
    const record = mutations[0];
    const shouldAccountForAnimation = this.animations.hasActiveAnimations();
    const activeAnimations = shouldAccountForAnimation
      ? this.animations.getActiveAnimations()
      : undefined;
    const newPositionsData = collectPositionsData(
      record.target,
      activeAnimations,
    );

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

    const positionsToMove = newPositionsData.children.filter(
      p => !addedNodes.includes(p.node),
    );

    /** To calculate containerDiff, we need to add removedNodes.back */

    if (shouldAccountForAnimation) {
      this.animations.pause();
    }

    if (shouldAccountForAnimation && !this.didTakeSnapshotBeforeUpdate) {
      this.positionsData.children = updatePositionsWithAnimation(
        this.positionsData.children,
        activeAnimations,
      );
    }
    const inversedOffsets = getInversedOffsets(
      this.positionsData.children,
      positionsToMove,
      activeAnimations,
    );

    this.animations.removeAllAnimations();
    const moveAnimation = this.animateMove(
      inversedOffsets,
      this.positionsData,
      newPositionsData,
    );
    const enterAnimation = this.animateEntrance(addedNodes);
    const leaveAnimation = this.drawRemovedNodes(removedNodes);
    this.animations.addAnimation('moveAnimations', moveAnimation);
    this.animations.addAnimation('enterAnimations', enterAnimation);
    this.animations.addAnimation('leaveAnimations', leaveAnimation);

    this.positionsData = newPositionsData;
    this.didTakeSnapshotBeforeUpdate = false;
  }

  animateMove(inversedOffsets, positionData, newPositionsData) {
    const containerDiff = {
      x: 0, // positionData.container.left - newPositionsData.container.left,
      y: 0, // positionData.container.top - newPositionsData.container.top,
    };
    const nonZeroOffsets = inversedOffsets.filter(
      offset =>
        offset.styles.translateX - containerDiff.x !== 0 ||
        offset.styles.translateY - containerDiff.y !== 0,
    );

    /** move elements back to where they were without animation */
    nonZeroOffsets.forEach(offset => {
      const { translateX, translateY } = offset.styles;
      const x = translateX - containerDiff.x;
      const y = translateY - containerDiff.y;
      offset.node.style.transform = `translateX(${x}px) translateY(${y}px)`;
    });

    const targets = nonZeroOffsets.map(p => p.node);
    /** animate elements to where they should be */
    return anime({
      ...this.animationOptions.move,
      targets,
      translateX: 0,
      translateY: 0,
      opacity: 1,
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
      ...this.animationOptions.enter,
      targets,
      translateX: targetStyleProps.translateX,
      opacity: targetStyleProps.opacity,
    });
  }

  drawRemovedNodes(nodes) {
    const clones = nodes.map(node => {
      const position = this.positionsData.children.find(p => p.node === node);
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
      ...this.animationOptions.leave,
      targets: clones,
      opacity: 0,
      complete: () => {
        clones.forEach(n => n.remove());
        clones.length = null;
      },
    });
    return animation;
  }

  pause() {
    if (this.animations) {
      this.animations.pause();
    }
  }
}
