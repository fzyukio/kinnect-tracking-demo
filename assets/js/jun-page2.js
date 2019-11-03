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

let render;
let scale = {x: 20, y: 20, z: 8, change: true};

function updateCamera() {
    scale.change = true;
    addSkeleton();
    camera.updateProjectionMatrix();
}

function addSkeleton() {
    //remove the skeletons which are no longer there
        for (i = 0; i < skeletonTrackingIDs.length; i++) {
            let bodyId = skeletonTrackingIDs[i];
            let index = -1;
            for (j = 0; j < skeletons.length; j++) {
                if (skeletons[j].bodyId == bodyId) {
                    index = j;
                    break;
                }
            }
            if (index == -1) {
                scene.remove(skeletonGroups[bodyId].group);
                skeletonGroups[bodyId] = null;
            }

            if (skeletonGroups[bodyId] != null && scale.change) {
                scene.remove(skeletonGroups[bodyId].group);
                skeletonGroups[bodyId] = null;
            }
        }
        //reset the tracking IDs
        skeletonTrackingIDs = [];
        // create a blue LineBasicMaterial
        let material = new THREE.LineBasicMaterial({color: 0xffffff});

        let skeletonColours = [0xFF0000, 0x0000FF];
        for (i = 0; i < skeletons.length; i++) {
            skeleton = skeletons[i];
            skeletonTrackingIDs.push(skeleton.bodyId);
            //get the skeleton group by it's tracking id
            if (skeletonGroups[skeleton.bodyId] == null) {
                skeletonGroups[skeleton.bodyId] = {};
                skeletonGroups[skeleton.bodyId].group = new THREE.Object3D();
                scene.add(skeletonGroups[skeleton.bodyId].group);

                skeletonGroups[skeleton.bodyId].particles = [];
                for (j = 0; j < skeleton.joints.length; j++) {
                    let canvas = document.createElement('canvas');
                    canvas.width = 100;
                    canvas.height = 100;

                    let context = canvas.getContext('2d');
                    context.beginPath();
                    context.arc(0, 0, 1, 0, PI2, true);
                    context.closePath();
                    context.fill();

                    let texture = new THREE.Texture(canvas);
                    texture.needsUpdate = true;

                    particle = new THREE.Sprite(new THREE.MeshBasicMaterial({color: skeletonColours[i]}));
                    // particle = new THREE.Sprite({map: texture, useScreenCoordinates: false});

                    particle.position.x = skeleton.joints[j].x * scale.x;
                    particle.position.y = skeleton.joints[j].y * scale.y;
                    particle.position.z = skeleton.joints[j].z * scale.z;
                    particle.scale.x = particle.scale.y = 0.2;
                    skeletonGroups[skeleton.bodyId].particles.push(particle);
                    skeletonGroups[skeleton.bodyId].group.add(particle);
                }
                for (j = 0; j < skeletonGroups[skeleton.bodyId].particles.length; j++) {
                    let jointA = skeletonGroups[skeleton.bodyId].particles[j];
                    let jointB = skeletonGroups[skeleton.bodyId].particles[connectingJoint[j] - 1];
                    let linegeo = new THREE.Geometry();
                    linegeo.vertices.push(new THREE.Vector3(jointA.position.x, jointA.position.y, jointA.position.z));
                    linegeo.vertices.push(new THREE.Vector3(jointB.position.x, jointB.position.y, jointB.position.z));
                    let line = new THREE.Line(linegeo, material);
                    skeletonGroups[skeleton.bodyId].group.add(line);
                }
            }
        }
        scale.change = false;
}
/**
 * Create the camera, then request frames continuously
 */
function init() {
    const canvas = document.querySelector('#c');

    let color = 0x000000;

    // Create your main scene
    scene = new THREE.Scene();

    // Create your main camera
    // camera = new THREE.PerspectiveCamera(75, WIDTH / HEIGHT, 0.1, 1000);
    // camera.position.z = 1000;

    const fov = 55;
    const aspect = WIDTH / HEIGHT;  // the canvas default
    const near = 0.1;
    const far = 1000;
    camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    camera.position.set(-3, 6, 100);
    scene.position.set(1, 1, 10);

    // Create lights
    let light = new THREE.PointLight(0xEEEEEE);
    light.position.set(20, 0, 20);
    scene.add(light);

    let lightAmb = new THREE.AmbientLight(0x777777);
    scene.add(lightAmb);

    // Create your renderer
    renderer = new THREE.WebGLRenderer({canvas});
    renderer.setSize(WIDTH, HEIGHT);

    // Create a cube
    let geometry = new THREE.BoxGeometry(1, 1, 1);
    let material = new THREE.MeshLambertMaterial({
        color: 0xff00ff,
        ambient: 0x121212,
        emissive: 0x121212
    });

    let cube = new THREE.Mesh(geometry, material);
    scene.add(cube);

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

    const gui = new GUI();
    gui.add(camera, 'fov', 1, 180).onChange(updateCamera);
    gui.add(camera.position, 'x', -100, 500).name('camX').onChange(updateCamera);
    gui.add(camera.position, 'y', -100, 500).name('camY').onChange(updateCamera);
    gui.add(camera.position, 'z', -100, 500).name('camZ').onChange(updateCamera);

    gui.add(scene.position, 'x', 1, 20).name('sceneX').onChange(updateCamera);
    gui.add(scene.position, 'y', 1, 20).name('sceneY').onChange(updateCamera);
    gui.add(scene.position, 'z', 1, 20).name('sceneZ').onChange(updateCamera);

    gui.add(scale, 'x', 1, 20).name('scaleX').onChange(updateCamera);
    gui.add(scale, 'y', 1, 20).name('scaleY').onChange(updateCamera);
    gui.add(scale, 'z', 1, 20).name('scaleZ').onChange(updateCamera);
    const minMaxGUIHelper = new MinMaxGUIHelper(camera, 'near', 'far', 0.1);
    gui.add(minMaxGUIHelper, 'min', 0.1, 50, 0.1).name('near').onChange(updateCamera);
    gui.add(minMaxGUIHelper, 'max', 0.1, 1000, 0.1).name('far').onChange(updateCamera);


    const controls = new OrbitControls(camera, canvas);
    controls.target.set(0, 5, 0);
    controls.update();

    // Rendering function
    render = function () {
        requestAnimationFrame(render);

        // Update the color to set
        if (color < 0xdddddd) color += 0x0000ff;

        // Update the cube color
        cube.material.color.setHex(color);

        // Update the cube rotations
        cube.rotation.x += 0.05;
        cube.rotation.y += 0.02;

        addSkeleton();

        renderer.autoClear = false;
        renderer.clear();
        renderer.render(backgroundScene, backgroundCamera);
        camera.lookAt(scene.position);
        renderer.render(scene, camera);

    };

    render();
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
