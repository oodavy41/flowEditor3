import React from "react";
import * as THREE from "three";

import flowIF from "./flowIF";

import styles from "./popup.less";
interface popupIF {
  node?: flowIF;
  position?: number[];
}
interface popupState {
  updateFlag: number;
}

export default class popup extends React.Component<popupIF, popupState> {
  popingNode: flowIF;
  wait: number;
  constructor(props: popupIF) {
    super(props);
    this.state = {
      updateFlag: 0,
    };
    this.popingNode = null;
    this.wait = 0;
  }
  componentDidUpdate() {
    if (this.wait > 0) {
      this.popingNode = this.props.node;
    }
    this.wait++;
    console.log(this.wait);
  }
  render() {
    if (this.popingNode)
      return (
        <div
          className={styles.main}
          style={{
            left: this.props.position[0],
            top: this.props.position[1],
          }}
        >
          <button
            className={styles.closeBtn}
            onClick={() => {
              this.popingNode = null;
              this.wait = 0;
              this.setState({ updateFlag: Math.random() });
            }}
          >
            x
          </button>
          弹窗:{this.popingNode.name}
          <hr></hr>
        </div>
      );
    else return <></>;
  }
}
