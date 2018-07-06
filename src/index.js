import anime from 'animejs';
import { AnimationsStore } from './AnimationsStore';

const emptyTransforms = {
  translateX: 0,
  translateY: 0,
};

function getChildrenPositions(target) {
  const positions = [];
  for (let node of target.children) {
    const clientRect = node.getBoundingClientRect();
    const transforms = emptyTransforms;
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

function collectPositionsData(target) {
  const children = getChildrenPositions(target);
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

function getInversedOffsets(prevPositions, newPositionsData) {
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

function resetTransforms(target) {
  for (let child of target.children) {
    child.style.transform = '';
    child.style.transition = 'none';
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

const defaultOptions = {
  animations: {
    enter: defaultAnimationOptions,
    move: defaultAnimationOptions,
    leave: defaultLeaveAnimationOptions,
  },
  rootNode: document.body,
};

export class AnimateList {
  constructor(target, options = {}) {
    this.target = target;
    this.positionsData = collectPositionsData(target);
    this.currentContainerPosition = getContainerRect(target);
    this.animation = null;
    this.animations = new AnimationsStore();
    this.observer = new MutationObserver(this.animateChange.bind(this));
    this.observer.observe(target, { childList: true });

    /** animejs params */
    this.options = Object.assign({}, defaultOptions, options);
    const { move, enter, leave } = this.options.animations;
    this.options.animations = Object.assign({}, defaultAnimationOptions, {
      move:
        typeof move === 'function'
          ? move
          : Object.assign({}, defaultAnimationOptions, move),
      enter:
        typeof enter === 'function'
          ? enter
          : Object.assign({}, defaultAnimationOptions, enter),
      leave:
        typeof leave === 'function'
          ? leave
          : Object.assign(defaultLeaveAnimationOptions, leave),
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

    const childListMutations = mutations.filter(m => m.type === 'childList');

    const { addedNodesRecord, removedNodesRecord } = childListMutations.reduce(
      (acc, m) => {
        acc.addedNodesRecord.push(...m.addedNodes);
        acc.removedNodesRecord.push(...m.removedNodes);
        return acc;
      },
      { addedNodesRecord: [], removedNodesRecord: [] },
    );

    resetTransforms(this.target);

    if (shouldAccountForAnimation) {
      this.animations.pause();
    }

    const newPositionsData = collectPositionsData(record.target);

    const removedNodes = removedNodesRecord.filter(
      n => !addedNodesRecord.includes(n),
    );

    const addedNodes = addedNodesRecord.filter(
      n => !removedNodesRecord.includes(n),
    );

    const positionsToMove = newPositionsData.children.filter(
      p => !addedNodes.includes(p.node),
    );

    removedNodes.forEach(node => {
      node.style.transition = 'none';
    });
    positionsToMove.forEach(p => {
      p.node.style.transition = 'none';
    });

    /** To calculate containerDiff, we need to add removedNodes.back */

    if (!this.didTakeSnapshotBeforeUpdate) {
      console.warn(
        '`didTakeSnapshotBeforeUpdate` is false. Something may be wrong',
      );
    }

    const inversedOffsets = getInversedOffsets(
      this.positionsData.children,
      positionsToMove,
    );

    this.animations.removeAllAnimations();
    const moveAnimation = this.animateMove(
      inversedOffsets,
      this.positionsData,
      newPositionsData,
    );
    this.animations.addAnimation('moveAnimations', moveAnimation);
    if (addedNodes.length) {
      const enterAnimation = this.animateEntrance(addedNodes);
      this.animations.addAnimation('enterAnimations', enterAnimation);
    }

    if (removedNodes.length) {
      const leaveAnimation = this.animateLeave(removedNodes);
      this.animations.addAnimation('leaveAnimations', leaveAnimation);
    }

    this.positionsData = newPositionsData;
    this.didTakeSnapshotBeforeUpdate = false;
  }

  animateMove(inversedOffsets, positionData, newPositionsData) {
    const nonZeroOffsets = inversedOffsets.filter(
      offset =>
        offset.styles.translateX !== 0 || offset.styles.translateY !== 0,
    );

    /** move elements back to where they were without animation */
    nonZeroOffsets.forEach(offset => {
      const { translateX, translateY } = offset.styles;
      const x = translateX;
      const y = translateY;
      offset.node.style.transform = `translateX(${x}px) translateY(${y}px)`;
    });

    const targets = nonZeroOffsets.map(p => p.node);
    const { move } = this.options.animations;
    if (typeof move === 'function') {
      return move({ targets, to: { translateX: 0, translateY: 0 } });
    }

    /** animate elements to where they should be */
    return anime({
      ...move,
      targets,
      translateX: 0,
      translateY: 0,
      opacity: 1,
    });
  }

  animateEntrance(targets) {
    const from = { translateX: 200, opacity: 0 };
    const to = { translateX: 0, opacity: 1 };
    const { enter } = this.options.animations;
    if (typeof enter === 'function') {
      return enter({ targets, from, to });
    }
    targets.forEach(t => {
      t.style.transform = `translateX(${from.translateX}px)`;
      t.style.opacity = from.opacity;
    });
    return anime({
      ...enter,
      targets,
      translateX: to.translateX,
      opacity: to.opacity,
    });
  }

  animateLeave(nodes) {
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
      div.style.zIndex = 10;
      const clone = node.cloneNode(true);
      clone.style.transform = '';
      div.appendChild(clone);
      return div;
    });
    clones.forEach(clone => {
      this.options.rootNode.appendChild(clone);
    });
    const animation = anime({
      ...this.options.animations.leave,
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
