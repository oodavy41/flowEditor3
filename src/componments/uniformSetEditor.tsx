import React from "react";
import * as THREE from "three";
import ShaderIF from "./shaders/shadeIF";
import shaderList from "./shaders/shaderList";

interface UniformSetEditorProps {
  uniformList: {
    label: string;
    key: string;
    type: "color" | "number" | "image";
    value: string | number | File;
  }[];
  setFunction: (
    value: {
      key: string;
      type: "color" | "number" | "image";
      value: string | number | File;
    }[]
  ) => void;
}

export default function UniformSetEditor(props: UniformSetEditorProps) {
  const { uniformList, setFunction } = props;
  const data = uniformList;
  function onChangeValue(key: string, value: string | number | File) {
    setFunction(
      data.map((item) => {
        if (item.key === key) {
          return {
            key,
            type: item.type,
            value,
          };
        }
        return item;
      })
    );
  }
  return (
    <div>
      {data.map((uniform) => (
        <div key={uniform.key}>
          <div>{uniform.label}</div>
          <div>
            <input
              type={
                { number: "number", color: "color", image: "file" }[
                  uniform.type
                ]
              }
              {...((uniform.value instanceof File ||
                uniform.type !== "image") && { accept: "image/*" })}
              {...(uniform.type !== "image" &&
                !(uniform.value instanceof File) && {
                  value:
                    uniform.type === "color"
                      ? "#" + uniform.value.toString(16)
                      : uniform.value,
                })}
              onChange={(e) => {
                switch (uniform.type) {
                  case "number":
                    onChangeValue(uniform.key, +e.target.value);
                    break;
                  case "color":
                    onChangeValue(uniform.key, e.target.value);
                    break;
                  case "image":
                    onChangeValue(uniform.key, e.target.files[0]);
                    break;
                }
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
