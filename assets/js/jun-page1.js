/* global d3*/
import {postRequest} from "./ajax-handler";
const THREE = require('three');
import OrbitControls from 'three-orbitcontrols';
import {GUI} from '../vendor/dat.gui.module.js';
require('../vendor/request-animation-frame');

let camera, scene, renderer, group, particle;
let backgroundScene, backgroundCamera;

let i, j, skeleton, jointmap;

let skeletons = [];
let skeletonGroups = {};
let skeletonTrackingIDs = [];

let WIDTH = 960;
let HEIGHT = 540;

let PI2 = Math.PI * 2;

const connectingJoint = [2, 1, 21, 3, 21, 5, 6, 7, 21, 9, 10, 11, 1, 13, 14, 15, 1, 17, 18, 19, 2, 8, 8, 12, 12];

let color = 0x000000;

function init() {
    const canvas = document.querySelector('#c');
    const renderer = new THREE.WebGLRenderer({canvas});
    renderer.setSize(WIDTH, HEIGHT);

    const fov = 45;
    const aspect = WIDTH / HEIGHT;  // the canvas default
    const near = 0.1;
    const far = 100;
    const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    camera.position.set(0, 10, 20);

    class MinMaxGUIHelper {
        constructor(obj, minProp, maxProp, minDif) {
            this.obj = obj;
            this.minProp = minProp;
            this.maxProp = maxProp;
            this.minDif = minDif;
        }

        get min() {
            return this.obj[this.minProp];
        }

        set min(v) {
            this.obj[this.minProp] = v;
            this.obj[this.maxProp] = Math.max(this.obj[this.maxProp], v + this.minDif);
        }

        get max() {
            return this.obj[this.maxProp];
        }

        set max(v) {
            this.obj[this.maxProp] = v;
            this.min = this.min;  // this will call the min setter
        }
    }

    function updateCamera() {
        camera.updateProjectionMatrix();
    }

    const gui = new GUI();
    gui.add(camera, 'fov', 1, 180).onChange(updateCamera);
    const minMaxGUIHelper = new MinMaxGUIHelper(camera, 'near', 'far', 0.1);
    gui.add(minMaxGUIHelper, 'min', 0.1, 50, 0.1).name('near').onChange(updateCamera);
    gui.add(minMaxGUIHelper, 'max', 0.1, 1000, 0.1).name('far').onChange(updateCamera);

    const controls = new OrbitControls(camera, canvas);
    controls.target.set(0, 5, 0);
    controls.update();

    const scene = new THREE.Scene();
        // Create a cube
        let geometry = new THREE.BoxGeometry(100, 100, 100);
        let material = new THREE.MeshLambertMaterial({
            color: 0xff00ff,
            ambient: 0x121212,
            emissive: 0x121212
        });

        let cube = new THREE.Mesh(geometry, material);
        scene.add(cube);

        // Set up the main camera
        // camera.position.z = 5;
        camera.position.z = 1000;

        // Load the background texture
        let texture = THREE.ImageUtils.loadTexture('/static/images/bg.jpg');
        let backgroundMesh = new THREE.Mesh(
                new THREE.PlaneGeometry(2, 2, 0),
                new THREE.MeshBasicMaterial({
                    map: texture
                }));

        backgroundMesh.material.depthTest = false;
        backgroundMesh.material.depthWrite = false;

        // Create your background scene
        backgroundScene = new THREE.Scene();
        backgroundCamera = new THREE.Camera();
        backgroundScene.add(backgroundCamera);
        backgroundScene.add(backgroundMesh);

        // const planeSize = 40;
        //
        // const loader = new THREE.TextureLoader();
        // const texture = loader.load('https://threejsfundamentals.org/threejs/resources/images/checker.png');
        // texture.wrapS = THREE.RepeatWrapping;
        // texture.wrapT = THREE.RepeatWrapping;
        // texture.magFilter = THREE.NearestFilter;
        // const repeats = planeSize / 2;
        // texture.repeat.set(repeats, repeats);
        //
        // const planeGeo = new THREE.PlaneBufferGeometry(planeSize, planeSize);
        // const planeMat = new THREE.MeshPhongMaterial({
        //     map: texture,
        //     side: THREE.DoubleSide,
        // });
        // const mesh = new THREE.Mesh(planeGeo, planeMat);
        // mesh.rotation.x = Math.PI * -.5;
        // scene.add(mesh);

        // const cubeSize = 4;
        // const cubeGeo = new THREE.BoxBufferGeometry(cubeSize, cubeSize, cubeSize);
        // const cubeMat = new THREE.MeshPhongMaterial({color: '#8AC'});
        // const mesh = new THREE.Mesh(cubeGeo, cubeMat);
        // mesh.position.set(cubeSize + 1, cubeSize / 2, 0);
        // scene.add(mesh);


        // const color = 0xFFFFFF;
        // const intensity = 1;
        // const light = new THREE.DirectionalLight(color, intensity);
        // light.position.set(0, 10, 0);
        // light.target.position.set(-5, 0, 0);
        // scene.add(light);
        // scene.add(light.target);

        // Create lights
        let light = new THREE.PointLight(0xEEEEEE);
        light.position.set(20, 0, 20);
        scene.add(light);

        let lightAmb = new THREE.AmbientLight(0x777777);
        scene.add(lightAmb);

    // function resizeRendererToDisplaySize(renderer) {
    //     const canvas = renderer.domElement;
    //     const width = canvas.clientWidth;
    //     const height = canvas.clientHeight;
    //     const needResize = canvas.width !== width || canvas.height !== height;
    //     if (needResize) {
    //         console.log(`width=${width}, height=${height}`);
    //         renderer.setSize(width, height, false);
    //     }
    //     return needResize;
    // }

    function render() {
        // Update the color to set
        if (color < 0xdddddd) color += 0x0000ff;

        // Update the cube color
        cube.material.color.setHex(color);

        // Update the cube rotations
        cube.rotation.x += 0.05;
        cube.rotation.y += 0.02;

        // if (resizeRendererToDisplaySize(renderer)) {
        //     const canvas = renderer.domElement;
        //     camera.aspect = canvas.clientWidth / canvas.clientHeight;
        //     camera.updateProjectionMatrix();
        // }

        // renderer.autoClear = false;
        // renderer.clear();
        // renderer.render(backgroundScene, backgroundCamera);
        renderer.render(scene, camera);

        requestAnimationFrame(render);
    }

    requestAnimationFrame(render);
}

export const run = function () {
    return Promise.resolve();
};

export const postRun = function () {
    postRequest({
        requestSlug: 'mainapp/get-movement-data',
        data: {},
        onSuccess(data) {
            jointmap = data.jointmap;
            skeletons = data.skeletons;

            // skeleton = JSON.parse(data.skeleton);
            // positions = JSON.parse(data.positions);
            // draw();

            init();
        },
        immediate: true
    });
    return Promise.resolve();
};
