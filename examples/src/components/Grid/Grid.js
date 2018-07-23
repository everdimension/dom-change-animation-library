import React from 'react';
import { AnimateList } from '../../../../src';
import { uniqueId } from '../../uniqueId';
import s from './Grid.css';

const propTypes = {};

class Grid extends React.Component {
  constructor() {
    super();
    const items = [...new Array(25)].map(() => ({ id: uniqueId() }));
    this.state = {
      items,
    };
    this.handleShuffle = this.handleShuffle.bind(this);
  }

  componentDidMount() {
    this.animateList = new AnimateList(this.listNode);
  }

  getSnapshotBeforeUpdate() {
    this.animateList.takeSnapshotBeforeUpdate();
    return null;
  }

  componentDidUpdate() {}

  handleShuffle() {
    this.setState({
      items: this.state.items.sort(() => Math.random() - 0.5 > 0),
    });
  }

  render() {
    const { items } = this.state;
    return (
      <div>
        <div style={{ marginBottom: 50 }}>
          <button onClick={this.handleShuffle}>shuffle</button>
        </div>
        <div
          ref={n => {
            this.listNode = n;
          }}
          className={s.Grid}
        >
          {items.map(({ id }) => (
            <div
              key={id}
              className={s.Square}
            />
          ))}
        </div>
      </div>
    );
  }
}

Grid.propTypes = propTypes;

export { Grid };
