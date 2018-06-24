import anime from 'animejs';

Object.assign(window, { anime });

const emptyTransforms = {
  translateX: 0,
  translateY: 0,
};

function getTransformsForNode(node, animations = []) {
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
        x: clientRect.x,
        y: clientRect.y - transforms.translateY,
        top: clientRect.top - transforms.translateY,
        bottom: clientRect.bottom - transforms.translateY,
        left: clientRect.left,
        right: clientRect.right,
        width: clientRect.width,
        height: clientRect.height,
      },
      node,
    });
  }
  return positions;
}

function moveBack(prevPositions, newPositions, animations) {
  newPositions.forEach(position => {
    const prevPos = prevPositions.find(p => p.node === position.node);
    if (!prevPos) {
      console.log('enter animation');
      return;
    }
    const transforms = getTransformsForNode(prevPos.node, animations);
    console.log({ transforms });
    const diffX = prevPos.rect.left - position.rect.left;
    const diffY = prevPos.rect.top - position.rect.top + transforms.translateY;
    console.log({ diffY });
    position.node.style.transform = `translateX(${diffX}px) translateY(${diffY}px)`;
  });
}

export class AnimateList {
  constructor(target) {
    this.currentPositions = getPositions(target);
    this.animation = null;
    this.observer = new MutationObserver(this.animateChange.bind(this));
    this.observer.observe(target, { childList: true });
    this.drawingOffset = 100;
  }

  animateChange(mutations) {
    console.log('mutation change', mutations);
    const record = mutations[0];
    const shouldAccountForAnimation =
      this.animation && !this.animation.completed;
    const activeAnimations = shouldAccountForAnimation
      ? this.animation.animations
      : undefined;
    const newPositions = getPositions(record.target, activeAnimations);
    this.newPositions = newPositions;

    moveBack(this.currentPositions, newPositions, activeAnimations);
    if (activeAnimations) {
      this.animation.pause();
    }
    if (false) {
      this.animation.pause();
      this.drawPositions(this.currentPositions);
      this.drawPositions(newPositions);
      setTimeout(() => {
        this.animate(newPositions.map(p => p.node));
        this.prevPositions = this.currentPositions;
        this.currentPositions = newPositions;
      }, 1000);
    } else {
      this.animate(newPositions.map(p => p.node));
      this.prevPositions = this.currentPositions;
      this.currentPositions = newPositions;
    }

    // console.log(currentPositions, newPositions);
    // mutations
    //   .filter(m => m.type === 'childList')
    //   .filter(m => m.removedNodes.length)
    //   .forEach(m => {
    //     const removedNode = m.removedNodes[0];
    //     console.log(removedNode.getBoundingClientRect());
    //     const position = currentPositions.find(
    //       pos => pos.node === removedNode,
    //     );
    //     const clone = document.cloneNode(removedNode);
    //
    //     // document.body.appendChild(clone)
    //   });
  }

  animate(targets) {
    this.animation = anime({
      targets,
      translateX: 0,
      translateY: 0,
    });
    return this.animation;
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
    if (this.animation) {
      this.animation.pause();
    }
  }
}
