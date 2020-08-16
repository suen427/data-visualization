const dataSource = 'https://s5.ssl.qhres.com/static/b0695e2dd30daa64.json';

/* globals d3 */
(async function () {
  const data = await (await fetch(dataSource)).json();
  const regions = d3.hierarchy(data)
    .sum(d => 1)
    .sort((a, b) => b.value - a.value);

  const pack = d3.pack()
    .size([1600, 1600])
    .padding(3);

  const root = pack(regions);

  const canvas = document.querySelector('#canvas');
  const context = canvas.getContext('2d');
  const canvasMask = document.querySelector('#canvasMask');
  const maskContext = canvasMask.getContext('2d');
  const TAU = 2 * Math.PI;

  function draw(ctx, node, {fillStyle = 'rgba(0, 0, 0, 0.2)', textColor = 'white'} = {}) {
    const children = node.children;
    const {x, y, r} = node;
    ctx.fillStyle = fillStyle;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.fill();
    if(children) {
      for(let i = 0; i < children.length; i++) {
        draw(context, children[i]);
      }
    } else {
      const name = node.data.name;
      ctx.fillStyle = textColor;
      ctx.font = '1.5rem Arial';
      ctx.textAlign = 'center';
      ctx.fillText(name, x, y);
    }
  }

  function highlight(node, { fillStyle = 'rgba(0, 198, 203, 0.2)', textColor = 'white' } = {}, ctx = maskContext) {
    const {x, y, r} = node;
    ctx.fillStyle = fillStyle;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.fill();
    const name = node.data.name;
    ctx.fillStyle = textColor;
    ctx.font = '1.5rem Arial';
    ctx.textAlign = 'center';
    ctx.fillText(name, x, y);
  }

  /**
   * 
   * @param {Object} point - {x, y}
   * @param {Object} circle - {x, y, r}
   * @returns {Boolean}
   */
  function isInCircle(point, circle, pixelRatio = 2) {
    return (point.x - circle.x / pixelRatio) ** 2 + (point.y - circle.y / pixelRatio) ** 2 < (circle.r / pixelRatio) ** 2
  }

  draw(context, root);

  canvasMask.addEventListener('mousemove', function(event) {
    let stack = [root]

    while (stack.length) {
      let node = stack.pop()
      maskContext.clearRect(0, 0, 1600, 1600);
      if (!node.children && isInCircle({ x: event.offsetX, y: event.offsetY }, node.node)) {
        return highlight(node.node)
      }
      let children = node.children || []
      for (let i = children.length - 1; i >= 0; i--) {
        stack.push({
          level: node.level + 1,
          node: children[i],
          children: children[i].children
        })
      }
    }
  })
}());