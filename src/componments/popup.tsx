import React, { useState, useRef, useEffect } from "react";
import * as THREE from "three";

import flowIF from "./flowIF";

import styles from "./popup.less";
interface popupIF {
  node?: flowIF;
  position?: number[];
}

export default function popup(props: popupIF) {
  let popingNode = useRef<flowIF>();
  let [state, setState] = useState(0);
  useEffect(() => {
    popingNode.current = props.node;
  },[popingNode.current===props.node]);
  console.log(props);

  if (popingNode.current)
    return (
      <div
        className={styles.main}
        style={{
          left: props.position[0],
          top: props.position[1],
        }}
      >
        <button
          className={styles.closeBtn}
          onClick={() => {
            popingNode.current = null;
            setState(Math.random());
          }}
        >
          x
        </button>
        弹窗:{popingNode.current.name}
        <hr></hr>
      </div>
    );
  else return <></>;
}
