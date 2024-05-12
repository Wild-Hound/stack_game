const THREE = window.THREE;
const CANNON = window.CANNON;

class Cube {
  constructor(x, y, z, color, width, depth, boxHeight, falls, scene, world) {
    // threejs
    const geometry = new THREE.BoxGeometry(3, 1, 3);
    const material = new THREE.MeshLambertMaterial({ color });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    scene.add(mesh);

    // cannonjs
    const shape = new CANNON.Box(
      new CANNON.Vec3(width / 2, boxHeight / 2, depth / 2)
    );
    let mass = falls ? 5 : 0;
    const body = new CANNON.Body({ shape, mass });
    body.position.set(x, y, z);
    world.addBody(body);

    return { mesh, body };
  }
}

const initGame = (stack, boxHeight) => {
  const scene = new THREE.Scene();
  const world = new CANNON.World();

  //setup scene
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
  directionalLight.position.set(10, 20, 0);
  scene.add(directionalLight);

  // world setup
  world.gravity.set(0, -10, 0);
  world.broadphase = new CANNON.NaiveBroadphase();
  world.solver.iterations = 40;

  addLayer(0, 0, 1, 1, "z", boxHeight, false, stack, scene, world);
  addLayer(-18, 0, 1, 1, "x", boxHeight, stack, false, scene, world);

  //setup camera
  const aspect = window.innerWidth / window.innerHeight;
  const width = 10;
  const height = width / aspect;

  const camera = new THREE.OrthographicCamera(
    width / -1,
    width,
    height,
    height / -1,
    1,
    100
  );
  camera.position.set(4, 4, 4);
  camera.lookAt(0, 0, 0);

  //render game
  const renderer = new THREE.WebGL1Renderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);

  return { scene, world, camera, renderer };
};

const addLayer = (
  x,
  z,
  width,
  depth,
  direction,
  boxHeight,
  fall,
  stack,
  scene,
  world
) => {
  const y = boxHeight * stack.length;
  const color = `hsl(${30 + stack.length * 4}, 100%, 50%)`;

  const { mesh, body } = new Cube(
    x,
    y,
    z,
    color,
    width,
    depth,
    boxHeight,
    fall,
    scene,
    world
  );

  const cubeObj = { threejs: mesh, cannonjs: body, width, depth, direction };
  stack.push(cubeObj);
};

const addOverhang = (
  x,
  z,
  width,
  depth,
  boxHeight,
  stack,
  overHangStack,
  scene,
  world
) => {
  const y = boxHeight * stack.length;
  const color = `hsl(${30 + stack.length * 4}, 100%, 50%)`;

  const cube = new Cube(
    x,
    y,
    z,
    color,
    width,
    depth,
    boxHeight,
    true,
    scene,
    world
  );

  const cubeObj = { threejs: cube, width, depth, direction: "x" };
  overHangStack.push(cubeObj);
};

const animation = (stack, scene, camera, boxHeight, renderer) => {
  const speed = 0.15;
  const topLayer = stack[stack.length - 1];
  topLayer.threejs.position[topLayer.direction] += speed;

  if (camera.position.y < boxHeight * (stack.length - 2) + 4) {
    camera.position.y += speed;
  }

  renderer.render(scene, camera);
};

const addBoxToStack = (stack, addLayer, addOverhang) => {
  const topLayer = stack[stack.length - 1];
  const previousLayer = stack[stack.length - 2];

  const direction = topLayer.direction;

  // find overlap and overhang
  const delta =
    topLayer.threejs.position[direction] -
    previousLayer.threejs.position[direction];
  const overhangSize = Math.abs(delta);
  const size = direction === "x" ? topLayer.width : topLayer.depth;
  const overlap = size - overhangSize;

  // if box overlaps
  if (overlap > 0) {
    // overlapping box
    const newWidth = direction === "x" ? overlap : topLayer.width;
    const newDepth = direction === "z" ? overlap : topLayer.depth;

    topLayer.width = newWidth;
    topLayer.depth = newDepth;

    topLayer.threejs.scale[direction] = overlap / size;
    topLayer.threejs.position[direction] -= delta / 2;

    // overhanging box
    const overhangShift = (overlap / 2 + overhangSize / 2) * Math.sign(delta);
    const overhangX =
      direction === "x"
        ? topLayer.threejs.position.x + overhangShift
        : topLayer.threejs.x;
    const overhangZ =
      direction === "Z"
        ? topLayer.threejs.position.z + overhangShift
        : topLayer.threejs.z;
    const overhangWidth = direction === "x" ? overhangSize : newWidth;
    const overhangDepth = direction === "z" ? overhangSize : newDepth;

    addOverhang(overhangX, overhangZ, overhangWidth, overhangDepth);

    // new box
    const nextX = direction === "x" ? topLayer.threejs.position.x : -10;
    const nextZ = direction === "z" ? topLayer.threejs.position.z : -10;
    const nextDirection = direction === "x" ? "z" : "x";

    addLayer(nextX, nextZ, newWidth, newDepth, nextDirection, false);
  }
};

const gameClickHandler = (gameStarted, renderer, animation, addBoxToStack) => {
  if (!gameStarted) {
    renderer.setAnimationLoop(animation);
    gameStarted = true;
    return;
  }

  addBoxToStack();
};

const adapter = (
  stack,
  overhangStack,
  scene,
  world,
  camera,
  boxHeight,
  renderer
) => {
  return {
    addLayer: (x, z, width, depth, direction, fall) =>
      addLayer(
        x,
        z,
        width,
        depth,
        direction,
        boxHeight,
        fall,
        stack,
        scene,
        world
      ),
    animation: () => animation(stack, scene, camera, boxHeight, renderer),
    addOverhang: (x, z, width, depth) =>
      addOverhang(
        x,
        z,
        width,
        depth,
        boxHeight,
        stack,
        overhangStack,
        scene,
        world
      ),
  };
};

const gameStack = [];
const overhangStack = [];
const boxHeight = 1;
const { scene, world, camera, renderer } = initGame(gameStack, boxHeight);
let gameStarted = false;

const {
  addLayer: addLayerTemp,
  addOverhang: addOverhangTemp,
  animation: animationTemp,
} = adapter(
  gameStack,
  overhangStack,
  scene,
  world,
  camera,
  boxHeight,
  renderer
);

window.addEventListener("click", () => {
  if (!gameStarted) {
    renderer.setAnimationLoop(animationTemp);
    gameStarted = true;
    return;
  }

  addBoxToStack(gameStack, addLayerTemp, addOverhangTemp);
});

renderer.render(scene, camera);
document.body.appendChild(renderer.domElement);
