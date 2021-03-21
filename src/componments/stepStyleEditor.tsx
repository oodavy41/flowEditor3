import React from "react";
import { StyleNode } from "../GLOBAL";

interface stepStyleProps {
  levels: StyleNode[];
  UUID: string;
  onChange: (array: StyleNode[]) => void;
}

interface stepStyleStats {
  fold: boolean;
  steps: StyleNode[];
}

export default class stepStyleEditor extends React.Component<
  stepStyleProps,
  stepStyleStats
> {
  UUID: string;
  constructor(props: stepStyleProps) {
    super(props);
    this.UUID = props.UUID;
    this.state = {
      fold: true,
      steps: [...this.props.levels],
    };
  }

  componentDidUpdate() {
    if (this.UUID != this.props.UUID) {
      this.setState({ steps: [...this.props.levels] });
      this.UUID = this.props.UUID;
    }
  }

  changeSteps(newSteps: StyleNode[]) {
    this.props.onChange(newSteps);
    this.setState({ steps: newSteps });
  }

  changeStep(value: number) {
    value = Math.max(value, 0);
    value = Math.min(value, 4);
    let newSteps = [...this.state.steps];
    while (newSteps.length !== value) {
      if (newSteps.length > value) {
        newSteps.pop();
      } else {
        newSteps.push({
          cutPoint: Infinity,
          color: "#fff",
          lineColor: "#fff",
        });
      }
    }
    this.changeSteps(newSteps);
  }
  changeValue(index: number, value: StyleNode) {
    let newSteps = [...this.state.steps];
    newSteps[index] = value;
    this.changeSteps(newSteps);
  }

  render() {
    let { fold, steps } = this.state;
    return (
      <div>
        <div>
          <div>
            状态数
            <input
              type="number"
              value={steps.length}
              max={4}
              min={0}
              step={1}
              onChange={(event) => this.changeStep(+event.target.value)}
            ></input>
            <button onClick={() => this.setState({ fold: !fold })}>
              {fold ? "折叠" : "展开"}
            </button>
          </div>
        </div>
        {!fold &&
          steps.map((step, index) => (
            <div key={Math.random()}>
              <div>
                割点:
                <input
                  type="number"
                  value={step.cutPoint}
                  step={1}
                  onChange={(event) =>
                    this.changeValue(index, {
                      ...step,
                      cutPoint: +event.target.value,
                    })
                  }
                ></input>
              </div>
              <div key={Math.random()}>
                颜色:
                <input
                  type="color"
                  value={step.color}
                  onChange={(event) =>
                    this.changeValue(index, {
                      ...step,
                      color: event.target.value,
                    })
                  }
                />
              </div>
              <div key={Math.random()}>
                副颜色:
                <input
                  type="color"
                  value={step.lineColor}
                  onChange={(event) =>
                    this.changeValue(index, {
                      ...step,
                      lineColor: event.target.value,
                    })
                  }
                />
              </div>
            </div>
          ))}
      </div>
    );
  }
}
