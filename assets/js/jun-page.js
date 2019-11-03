/* global d3*/
import {postRequest} from "./ajax-handler";
const THREE = require('three');
import OrbitControls from 'three-orbitcontrols';
import {GUI} from '../vendor/dat.gui.module.js';
require('../vendor/request-animation-frame');


// // Variables
// let skeleton;
// let positions;
// let figureScale = 2.2;
// let h = 300;
// let w = 100;
// let gap = 0.6;
// let skip = 2;
// let headJoint;
//
//
// function draw() {
//     let spectXExtent = [0, self.durationMs];
//     let spectXScale = d3.scaleLinear().range([0, w]).domain(spectXExtent);
//
//     let c1 = $('#c1');
//     // let h = c1.height();
//     // let w = c1.width();
//
//     // Prep the environment
//     let parent = d3.select("#c1");
//
//     let svg = parent.append("svg")
//     .attr("width", w)
//     .attr("height", h);
//
//     // Scale the data
//     positions = positions.map(function (f, j) {
//         return f.map(function (d, i) {
//             return {
//                 x: (d.x) * figureScale + 80,
//                 y: -1 * d.y * figureScale + h - 10,
//                 z: d.z * figureScale
//             };
//         });
//     });
//
//     let firstFrame = positions[0];
//     headJoint = 15;
//
//     let joints = svg.selectAll("circle.joints")
//     .data(firstFrame)
//     .enter();
//
//     let circles = joints.append("circle")
//     .attr("cx", function (d) {
//         return d.x;
//     })
//     .attr("cy", function (d) {
//         return d.y;
//     })
//     .attr("r", function (d, i) {
//         if (i == headJoint)
//             return 4;
//         else
//             return 2;
//     })
//     .attr("fill", function (d, i) {
//         return '#555555';
//     })
//     .attr("opacity", 0.9);
//
//     for (let fi=1; fi<10; fi++) {
//         let secondFrame = positions[fi];
//         let transition = circles.transition();
//
//         // transition.duration(2500);
//         // transition.delay(function (d) {
//         //     return d * 40;
//         // });
//         // transition.on("start", function repeat() {
//         //     d3.active(this)
//         //     .attr('cx', function (d, i) {
//         //         return secondFrame[i].x;
//         //     })
//         //     .attr('cy', function (d, i) {
//         //         return secondFrame[i].y;
//         //     })
//         //     .transition()
//         //     .on("start", repeat);
//         // });
//
//         transition.attr('cx', function (d, i) {
//             console.log(`Moving x: ${secondFrame[i].x - d.x}`);
//             return secondFrame[i].x;
//         });
//         transition.attr('cy', function (d, i) {
//             console.log(`Moving y: ${secondFrame[i].y - d.y}`);
//             return secondFrame[i].y;
//         });
//         // transition.attr("delay", function(d,i){return 1000*i});
//         transition.duration(5000);
//         transition.ease(d3.easeLinear);
//         // transition.delay(10000)
//     }
//     // // Bones
//     // let bones = svg.selectAll("line.bones" + index)
//     // .data(skeleton)
//     // .enter();
//     //
//     // let lines = bones.append("line")
//     // .attr("stroke", "#555555")
//     // .attr("stroke-width", 1)
//     // .attr("opacity", 0.9)
//     // .attr("x1", 0).attr("x2", 0)
//     // .attr("x1", function (d, j) {
//     //     return currentFrame[d[0]].x;
//     // })
//     // .attr("x2", function (d, j) {
//     //     return currentFrame[d[1]].x;
//     // })
//     // .attr("y1", function (d, j) {
//     //     return currentFrame[d[0]].y;
//     // })
//     // .attr("y2", function (d, j) {
//     //     return currentFrame[d[1]].y;
//     // });
//     // for (let index = 1; index < 2; index++) {
//     //
//     // }
// }


let socket;

let container, stats;
let camera, scene, renderer, group, particle;
let backgroundScene, backgroundCamera;
let mouseX = 0, mouseY = 0;

let i, j, skeleton, jointmap;

let skeletons = [];
let skeletonGroups = {};
let skeletonTrackingIDs = [];

let WIDTH = 960;
let HEIGHT = 540;

let PI2 = Math.PI * 2;

const canvas = document.querySelector('#c');
const image = $('#rgb img');

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


/**
 * Create the camera, then request frames continuously
 */
function init() {
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

    gui.add(fps, 'value', 1, 30).name('FPS').onChange(()=>fpsInterval = 1000 / fps.value);

    // const minMaxGUIHelper = new MinMaxGUIHelper(camera, 'near', 'far', 0.1);
    // gui.add(minMaxGUIHelper, 'min', 0.1, 50, 0.1).name('near').onChange(updateCamera);
    // gui.add(minMaxGUIHelper, 'max', 0.1, 1000, 0.1).name('far').onChange(updateCamera);
    //

    const controls = new OrbitControls(camera, canvas);
    controls.target.set(0, 5, 0);
    controls.update();
}

function updateCamera() {
    scale.change = true;
    renderSkeleton();
    camera.updateProjectionMatrix();
}


const connectingJoint = [2, 1, 21, 3, 21, 5, 6, 7, 21, 9, 10, 11, 1, 13, 14, 15, 1, 17, 18, 19, 2, 8, 8, 12, 12];


let stop = false;
let frameCount = 0;
let startTime, now, then, elapsed;
const fps = {value: 5};
let fpsInterval = 1000 / fps.value;


// initialize the timer letiables and start the animation
function startAnimating() {
    then = window.performance.now();
    startTime = then;
    animate();
}


// the animation loop calculates time elapsed since the last loop
// and only draws if your specified fps interval is achieved
function animate(newtime) {

    // stop
    if (stop) {
        return;
    }

    // request another frame
    requestAnimationFrame(animate);

    // calc elapsed time since last loop
    now = newtime;
    elapsed = now - then;

    // if enough time has elapsed, draw the next frame
    if (elapsed > fpsInterval) {

        // Get ready for next frame by setting then=now, but...
        // Also, adjust for fpsInterval not being multiple of 16.67
        then = now - (elapsed % fpsInterval);

        // draw stuff here
        drawOneFrame();
    }
}

function drawOneFrame() {
    // Put your drawing code here
    showRgbImage();
    renderSkeleton();
    frameIndex = (frameIndex + 1) % numFrames;
}


function showRgbImage() {
    let rgbFileLoc = rgbFileLocs[frameIndex];
    image.hide();
    image.attr('src', rgbFileLoc);
    image.show();
}


let scale = {x: 20, y: 20, z: 8, change: true};


function renderSkeleton() {
    skeletons = frames[frameIndex];
    //remove the skeletons which are no longer there
    for (i = 0; i < skeletonTrackingIDs.length; i++) {
        let bodyId = skeletonTrackingIDs[i];
        scene.remove(skeletonGroups[bodyId].group);
        skeletonGroups[bodyId] = null;
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
                particle.scale.x = particle.scale.y = 1;
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
    renderer.autoClear = false;
    renderer.clear();
    camera.lookAt(scene.position);
    renderer.render(scene, camera);
}

export const run = function () {
    return Promise.resolve();
};

let rgbFileLocs;
let frames;
let frameIndex = 0;
let numFrames;

export const postRun = function () {
    init();
    postRequest({
        requestSlug: 'mainapp/get-movement-data',
        data: {'movement-id': 'S017C003P020R002A060'},
        onSuccess(data) {
            frames = data.frames;
            rgbFileLocs = data.imgs;
            numFrames = frames.length;
            startAnimating();
        },
        immediate: true
    });
    //
    //
    // // Read the files
    // $.getJSON("https://omid.al/moveviz/data/Skeleton_Slash.json", function (json) {
    //     skeleton = json;
    //     $.getJSON("https://omid.al/moveviz/data/Slash.json", function (json) {
    //         positions = json;
    //         draw();
    //     });
    // });
    return Promise.resolve();
};
