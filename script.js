// const canvas = document.getElementById("game");
const THREE = window.THREE;
const scene = new THREE.Scene();

class Cube {
  constructor(x, y, z, color, scene) {
    const geometry = new THREE.BoxGeometry(3, 1, 3);
    const material = new THREE.MeshLambertMaterial({ color });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    scene.add(mesh);
  }
}

//setup scene
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
directionalLight.position.set(10, 20, 0);
scene.add(directionalLight);

const cube1 = new Cube(0, 0, 0, 0xfb8e00, scene);

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
renderer.render(scene, camera);

document.body.appendChild(renderer.domElement);
