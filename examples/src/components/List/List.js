import React from 'react';
import { AnimateList } from '../../../../src';
import { uniqueId } from '../../uniqueId';

const colors = ['#007aff', '#fc0', '#ff2d55', '#5856d6', '#4cd964', '#5ac8fa'];
function getColor(id) {
  return colors[id % colors.length];
}

const heights = [40, 40, 60, 20];

function getPadding(id) {
  return heights[id % heights.length];
}

const propTypes = {};

class List extends React.Component {
  constructor() {
    super();
    const items = [
      { id: uniqueId() },
      { id: uniqueId() },
      { id: uniqueId() },
      { id: uniqueId() },
      { id: uniqueId() },
    ];
    this.state = {
      items,
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
  }

  getSnapshotBeforeUpdate() {
    this.animateList.takeSnapshotBeforeUpdate();
    return null;
  }

  componentDidUpdate() {}

  handleAdd() {
    const { items } = this.state;
    const newItem = { id: uniqueId() };
    this.setState({
      items: [newItem, ...items],
    });
  }

  handleRemove() {
    this.setState({
      items: this.state.items.slice(1),
    });
  }

  handleShuffle() {
    this.setState({
      items: this.state.items.sort(() => Math.random() - 0.5 > 0),
    });
  }

  handleReverse() {
    const { items } = this.state;
    items.reverse();
    this.setState({
      items,
    });
  }

  handlePause() {
    this.animateList.pause();
  }

  handlePlay() {
    this.animateList.animations.playAll();
  }

  render() {
    const { items } = this.state;
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
          style={{ maxWidth: 300 }}
        >
          {items.map(({ id }) => (
            <div
              key={id}
              style={{
                paddingTop: getPadding(id),
                paddingBottom: getPadding(id),
                backgroundColor: getColor(id),
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
