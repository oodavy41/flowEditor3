import React, { useState, useRef, useEffect } from "react";
import styles from "./FlowNode.less";

function useDrag(position) {
  let draging = false;
  let [posX, setPosX] = useState(position[0]);
  let [posY, setPosY] = useState(position[1]);
  let mouseDown = () => {
    draging = true;
  };
  let mouseMove = (e) => {
    if (draging) {
      setPosX((posX) => posX + e.movementX);
      setPosY((posY) => posY + e.movementY);
    }
  };
  let mouseUp = () => {
    draging = false;
  };

  return [posX, posY, mouseDown, mouseMove, mouseUp];
}
export default function FlowNode(props) {
  const dom = useRef();
  const [positionX, positionY, mouseDown, mouseMove, mouseUp] = useDrag([0, 0]);
  useEffect(() => {
    // dom.current.addEventListener("",'');
  },'');

  return (
    <div
      ref={dom}
      className={styles.flowNode}
      draggable="true"
      onMouseDown={mouseDown}
      onMouseMove={mouseMove}
      onMouseUp={mouseUp}
      style={{transform:``}}
    >
      {props.text}
    </div>
  );
}
