import React from 'react';
import { AnimateList } from '../../../../src';
import { animate } from '../../animate';

const propTypes = {};

class ListBottomAligned extends React.Component {
  constructor() {
    super();
    const values = {
      ringo: { name: 'ringo', desc: 'online', state: 1 },
      john: { name: 'john', desc: 'offline', state: 1 },
      paul: { name: 'paul', desc: 'online', state: 1 },
      george: { name: 'george', desc: 'offline', state: 1 },
    };
    this.state = {
      values,
      order: Object.keys(values),
    };
    this.handleRemove = this.handleRemove.bind(this);
    this.handleRemoveLast = this.handleRemoveLast.bind(this);
    this.handleAdd = this.handleAdd.bind(this);
    this.handleAddLast = this.handleAddLast.bind(this);
    this.handleShuffle = this.handleShuffle.bind(this);
    this.handleReverse = this.handleReverse.bind(this);
    this.handlePause = this.handlePause.bind(this);
    this.handlePlay = this.handlePlay.bind(this);
  }

  componentDidMount() {
    this.animateList = new AnimateList(this.listNode, {
      rootNode: this.rootNode,
      animations: {
        // enter: { duration: 4000 },
        enter({ targets }) {
          targets.forEach(node => {
            node.style.transform = 'translateX(200px)';
            node.style.opacity = 0;
          });
          const duration = 500;
          return animate({
            targets,
            to: { translateX: 0, opacity: 1 },
            duration,
            transition: [
              `transform ${duration}ms cubic-bezier(0.25, 0.12, 0.33, 1.22)`,
              `opacity ${duration}ms ease-in-out`,
            ].join(', '),
          });
        },
        move: ({ targets, to }) => {
          const duration = 500;
          return animate({
            targets,
            to,
            duration,
            transition: [
              `transform ${duration}ms cubic-bezier(0.25, 0.12, 0.33, 1.22)`,
              `opacity ${duration}ms ease-in-out`,
            ].join(', '),
          });
        },
      },
    });
    Object.assign(window, { animateListBottomAligned: this.animateList });
  }

  getSnapshotBeforeUpdate() {
    this.animateList.takeSnapshotBeforeUpdate();
    return null;
  }

  componentDidUpdate() {}

  handleAdd() {
    const { order, values } = this.state;
    const newItem = Object.keys(values).find(name => !order.includes(name));
    if (newItem) {
      this.setState({
        order: [newItem, ...order],
      });
      setTimeout(() => {
        const value = this.state.values[newItem];
        value.state += 1;
        this.setState({
          values: {
            ...this.state.values,
            [newItem.name]: value,
          },
        });
      }, 250);
    }
  }

  handleAddLast() {
    const { order, values } = this.state;
    const newItem = Object.keys(values).find(name => !order.includes(name));
    if (newItem) {
      this.setState({
        order: [...order, newItem],
      });
    }
  }

  handleRemove() {
    this.setState({
      order: this.state.order.slice(1),
    });
  }

  handleRemoveLast() {
    this.setState({
      order: this.state.order.slice(0, this.state.order.length - 1),
    });
  }

  handleShuffle() {
    this.setState({
      order: this.state.order.sort(() => Math.random() - 0.5 > 0),
    });
  }

  handleReverse() {
    const { order } = this.state;
    order.reverse();
    this.setState({
      order,
    });
  }

  handlePause() {
    this.animateList.pause();
  }

  handlePlay() {
    this.animateList.animations.playAll();
  }

  handleBlock() {
    function sleep(seconds, cb) {
      var e = Date.now() + seconds * 1000;
      while (Date.now() <= e) {}
      cb();
    }
    function repeatSleep() {
      sleep(0.5, () => {
        setTimeout(repeatSleep, 1000);
      });
    }
    repeatSleep();
  }

  handleUpdate(key) {
    const value = this.state.values[key];
    value.desc = value.desc === 'online' ? 'offline' : 'online';
    this.setState({
      values: {
        ...this.state.values,
        [key]: value,
      },
      order: [key, ...this.state.order.filter(k => k !== key)],
    });
  }

  render() {
    const { order, values } = this.state;
    return (
      <div
        ref={n => (this.rootNode = n)}
        style={{
          height: 600,
          position: 'relative',
        }}
      >
        <div style={{ marginBottom: 50 }}>
          <button onClick={this.handleRemove}>remove first</button>
          <button onClick={this.handleRemoveLast}>remove last</button>
          <button onClick={this.handleShuffle}>shuffle</button>
          <button onClick={this.handleReverse}>reverse</button>
          <button onClick={this.handleAdd}>add to beginning</button>
          <button onClick={this.handleAddLast}>add to end</button>
          <button onClick={this.handlePause}>pause</button>
          <button onClick={this.handlePlay}>playAll</button>
          <button onClick={this.handleBlock}>block main thread</button>
        </div>
        <div
          ref={n => {
            this.listNode = n;
          }}
          style={{ width: 300, position: 'absolute', bottom: 0, right: 0 }}
        >
          {order.map(key => (
            <div
              key={key}
              style={{
                padding: 20,
                backgroundColor: '#444',
                color: 'white',
                marginBottom: '0.5em',
                opacity: 0.8,
              }}
              onClick={() => this.handleUpdate(key)}
            >
              {values[key].name} - {values[key].desc} - {values[key].state}
            </div>
          ))}
        </div>
      </div>
    );
  }
}

ListBottomAligned.propTypes = propTypes;

export { ListBottomAligned };
