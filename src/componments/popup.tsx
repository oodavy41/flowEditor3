import React from "react";
import * as THREE from "three";

import flowIF from "./objects/flowIFs";

import styles from "./popup.less";
interface popupIF {
  info?: string[];
  position?: number[];
  onClose?: () => void;
}
interface popupState {
  poping: boolean;
}
// info : [status,titie,content,url]
export default class popup extends React.Component<popupIF, popupState> {
  lastPopping: string;
  onClose: () => void;
  constructor(props: popupIF) {
    super(props);
    this.state = {
      poping: false,
    };
    this.onClose = props.onClose;
    this.lastPopping=null;
  }
  componentDidUpdate() {
    let { info } = this.props;
    this.lastPopping = info ? info[0] + info[1] + info[2] + info[3] : null;
    if (this.lastPopping) {
      this.setState({ poping: true });
    }
  }

  shouldComponentUpdate(nextprops: popupIF, nextState: popupState) {
    let nextInfo = nextprops.info;
    console.log("should",this.lastPopping,nextInfo)
    let thisPopping=nextInfo
          ? nextInfo[0] + nextInfo[1] + nextInfo[2] + nextInfo[3]
          : null
    console.log(thisPopping,this.lastPopping !== thisPopping,this.lastPopping !== thisPopping || this.state.poping !== nextState.poping)
    return (
      this.lastPopping !== thisPopping || this.state.poping !== nextState.poping
    );
  }
  render() {
    let { info } = this.props;
    if (this.lastPopping && info) {
      let status = info[0],
        title = info[1],
        content = info[2],
        url = info[3];
      let statusMap: { [key: string]: string } = {
        red: styles.red,
        yellow: styles.yellow,
        green: styles.green,
      };
      return (
        <div
          className={[styles.main, statusMap[status]].join(" ")}
          style={{
            left: this.props.position[0],
            top: this.props.position[1],
          }}
        >
          <button
            className={styles.closeBtn}
            onClick={() => {
              this.lastPopping = null;
              this.setState({ poping: false });
              this.onClose();
            }}
          >
            x
          </button>
          标题:{title}
          <hr></hr>
          <p>{content}</p>
          <p>
            <a href={url}>立即查看</a>
          </p>
        </div>
      );
    } else return <></>;
  }
}
