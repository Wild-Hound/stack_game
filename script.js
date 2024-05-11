const THREE = window.THREE;

class Cube {
  constructor(x, y, z, color, scene) {
    const geometry = new THREE.BoxGeometry(3, 1, 3);
    const material = new THREE.MeshLambertMaterial({ color });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    scene.add(mesh);
    return mesh;
  }
}

const initGame = (stack, boxHeight) => {
  const scene = new THREE.Scene();

  //setup scene
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
  directionalLight.position.set(10, 20, 0);
  scene.add(directionalLight);

  new Cube(0, -1, 0, 0xfb8e00, scene);
  addLayer(-18, 0, 1, 1, "x", boxHeight, stack, scene);

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

  return { scene, camera, renderer };
};

const addLayer = (x, z, width, depth, direction, boxHeight, stack, scene) => {
  const y = boxHeight * stack.length;
  const color = `hsl(${30 + stack.length * 4}, 100%, 50%)`;

  const cube = new Cube(x, y, z, color, scene);

  const cubeObj = { threejs: cube, width, depth, direction };
  stack.push(cubeObj);
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

const addBoxToStack = (stack, addLayer) => {
  console.log("adding new box");
  const topLayer = stack[stack.length - 1];
  const direction = topLayer.direction;
  // TODO: remove
  const previousBoxSize = 1;

  const nextX = direction == "x" ? 0 : -10;
  const nextZ = direction == "z" ? 0 : -10;
  const newWidth = previousBoxSize;
  const newDepth = previousBoxSize;
  const nextDirection = direction == "x" ? "z" : "x";

  addLayer(nextX, nextZ, newWidth, newDepth, nextDirection);
};

const gameClickHandler = (gameStarted, renderer, animation, addBoxToStack) => {
  console.log(gameStarted);
  if (!gameStarted) {
    renderer.setAnimationLoop(animation);
    gameStarted = true;
    return;
  }

  addBoxToStack();
};

const adapter = (stack, scene, camera, boxHeight, renderer) => {
  return {
    addLayer: (x, z, width, depth, direction) =>
      addLayer(x, z, width, depth, direction, boxHeight, stack, scene),
    animation: () => animation(stack, scene, camera, boxHeight, renderer),
  };
};

const gameStack = [];
const boxHeight = 1;
const { scene, camera, renderer } = initGame(gameStack, boxHeight);
let gameStarted = false;

const { addLayer: addLayerTemp, animation: animationTemp } = adapter(
  gameStack,
  scene,
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

  addBoxToStack(gameStack, addLayerTemp);
});

renderer.render(scene, camera);
document.body.appendChild(renderer.domElement);
