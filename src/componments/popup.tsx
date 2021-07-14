import React from "react";
import * as THREE from "three";

import flowIF from "./objects/flowIFs";

import styles from "./popup.less";
interface popupIF {
  info?: { status: string; title: string; content: string; url: string };
  position?: number[];
  onClose?: () => void;
}
interface popupState {
  poping: boolean;
}
// info : {status,titie,content,url}
export default class popup extends React.Component<popupIF, popupState> {
  lastPopping: string;
  onClose: () => void;
  constructor(props: popupIF) {
    super(props);
    this.state = {
      poping: false,
    };
    this.onClose = props.onClose;
    this.lastPopping = null;
  }
  componentDidUpdate() {
    let { info } = this.props;
    if (info) {
      this.lastPopping = info.status + info.title + info.content + info.url;
      this.setState({ poping: true });
    }
  }

  shouldComponentUpdate(nextprops: popupIF, nextState: popupState) {
    let nextInfo = nextprops.info;
    let thisPopping = nextInfo
      ? nextInfo.status + nextInfo.title + nextInfo.content + nextInfo.url
      : null;
    return (
      this.lastPopping !== thisPopping || this.state.poping !== nextState.poping
    );
  }
  render() {
    let { info } = this.props;
    if (this.lastPopping && info) {
      let { status, title, content, url } = info;
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
