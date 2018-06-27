import React from 'react';
import { AnimateList } from '../../../../src';

const propTypes = {};

class List extends React.Component {
  constructor() {
    super();
    const values = {
      ringo: { name: 'ringo' },
      john: { name: 'john' },
      paul: { name: 'paul' },
      george: { name: 'george' },
    };
    this.state = {
      values,
      order: Object.keys(values),
      colors: {
        ringo: '#2ecc71',
        john: '#8e44ad',
        paul: '#e74c3c',
        george: '#16a085',
      },
    };
    this.handleRemove = this.handleRemove.bind(this);
    this.handleAdd = this.handleAdd.bind(this);
    this.handleShuffle = this.handleShuffle.bind(this);
    this.handleReverse = this.handleReverse.bind(this);
    this.handlePause = this.handlePause.bind(this);
    this.handlePlay = this.handlePlay.bind(this);
  }

  componentDidMount() {
    this.animateList = new AnimateList(this.listNode);
    Object.assign(window, { animateList: this.animateList });
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
    }
  }

  handleRemove() {
    this.setState({
      order: this.state.order.slice(1),
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

  render() {
    const { order, values } = this.state;
    return (
      <div>
        <div style={{ marginBottom: 50 }}>
          <button onClick={this.handleRemove}>remove first</button>
          <button onClick={this.handleShuffle}>shuffle</button>
          <button onClick={this.handleReverse}>reverse</button>
          <button onClick={this.handleAdd}>add to beginning</button>
          <button onClick={this.handlePause}>pause</button>
          <button onClick={this.handlePlay}>playAll</button>
        </div>
        <div
          ref={n => {
            this.listNode = n;
          }}
          style={{ width: 300 }}
        >
          {order.map(key => (
            <div
              key={key}
              style={{
                padding: 20,
                height: 40,
                backgroundColor: this.state.colors[key],
                color: 'white',
                marginBottom: '0.5em',
              }}
            />
          ))}
        </div>
      </div>
    );
  }
}

List.propTypes = propTypes;

export { List };
