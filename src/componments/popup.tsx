import React from "react";
import * as THREE from "three";

import flowIF from "./objects/flowIFs";

import styles from "./popup.less";
interface popupIF {
  node?: flowIF;
  position?: number[];
  onClose?: () => void;
}
interface popupState {
  poping: boolean;
}

export default class popup extends React.Component<popupIF, popupState> {
  popingNode: flowIF;
  onClose: () => void;
  constructor(props: popupIF) {
    super(props);
    this.state = {
      poping: false,
    };
    this.onClose = props.onClose;
    this.popingNode = null;
  }
  componentDidUpdate() {
    this.popingNode = this.props.node;
    if (this.popingNode) {
      this.setState({ poping: true });
    }
  }

  shouldComponentUpdate(nextprops: popupIF, nextState: popupState) {
    return (
      this.popingNode !== nextprops.node ||
      this.state.poping !== nextState.poping
    );
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
              this.setState({ poping: false });
              this.onClose();
            }}
          >
            x
          </button>
          标题:{this.popingNode.text!}
          <hr></hr>
          <p>内容：内容</p>
          <p>
            <a href="localhost:7000">立即查看</a>
          </p>
        </div>
      );
    else return <></>;
  }
}
