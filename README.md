## 图型数据导入格式

### 概述

以点`Node`，线`Line`类型为元素组成的数组

### Node 点

    - type:"Node"
      - 类型声明
    - uuid:
      - 全局唯一
    - name:
      - 节点名称，会显示在节点边
    - color?:
      - 节点显示颜色
    - lineColor?:
      - 节点模型描边颜色

### Line 线

    - type:"Line"
      - 类型声明
    - startID:
      - 自身起点的点UUID
    - endID:
      - 自身终点的点UUID
    - color?:
      - 连线显示颜色

## 弹窗消息格式

- 数据集 array[1]~[4]
- array[1]: state (enum)
  - 可选字段: `red` `yellow` `green`
- array[2]: 标题(string)
  - 消息标题
- array[3]: 内容(string)
- array[4]?: 跳转链接(string/url)
