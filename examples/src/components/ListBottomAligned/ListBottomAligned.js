import React from 'react';
import { AnimateList } from '../../../../src';

const propTypes = {};

class ListBottomAligned extends React.Component {
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
    this.animateList = new AnimateList(this.listNode);
    Object.assign(window, { animateListBottomAligned: this.animateList });
  }

  handleAdd() {
    const { order, values } = this.state;
    const newItem = Object.keys(values).find(name => !order.includes(name));
    if (newItem) {
      this.setState({
        order: [newItem, ...order],
      });
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

  render() {
    const { order, values } = this.state;
    return (
      <div
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
            >
              {values[key].name}
            </div>
          ))}
        </div>
      </div>
    );
  }
}

ListBottomAligned.propTypes = propTypes;

export { ListBottomAligned };
