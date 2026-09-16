const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const gazeText = document.getElementById("gaze");
const startButton = document.getElementById("startButton");

let cameraStarted = false;


// START CAMERA
startButton.addEventListener("click", startCamera);

function startCamera() {

    navigator.mediaDevices.getUserMedia({
        video: {
            facingMode: "user"
        },
        audio: false
    })

    .then(function(stream) {

        video.srcObject = stream;

        cameraStarted = true;

        startButton.style.display = "none";

        detectFace();

    })

    .catch(function(error) {

        console.error(error);

        alert("Please allow camera access.");

    });
}


// MEDIAPIPE FACE MESH
const faceMesh = new FaceMesh({

    locateFile: function(file) {

        return "https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/" + file;

    }

});


faceMesh.setOptions({

    maxNumFaces: 1,

    refineLandmarks: true,

    minDetectionConfidence: 0.5,

    minTrackingConfidence: 0.5

});


faceMesh.onResults(processResults);


// FACE DETECTION
async function detectFace() {

    if (cameraStarted && video.readyState >= 2) {

        await faceMesh.send({
            image: video
        });

    }

    requestAnimationFrame(detectFace);
}


// PROCESS FACE
function processResults(results) {

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


    // NO FACE
    if (
        !results.multiFaceLandmarks ||
        results.multiFaceLandmarks.length === 0
    ) {

        gazeText.innerHTML = "GAZE: NO FACE";

        return;
    }


    const landmarks =
        results.multiFaceLandmarks[0];


    // IRIS LANDMARKS
    const leftIris = [
        474, 475, 476, 477
    ];

    const rightIris = [
        469, 470, 471, 472
    ];


    // EYE CORNERS
    const leftEyeCorners = [
        33, 133
    ];

    const rightEyeCorners = [
        362, 263
    ];


    // EYE POSITION
    const leftPosition =
        getEyePosition(
            landmarks,
            leftIris,
            leftEyeCorners
        );

    const rightPosition =
        getEyePosition(
            landmarks,
            rightIris,
            rightEyeCorners
        );


    const gazePosition =
        (leftPosition + rightPosition) / 2;


    // GAZE RESULT

    if (gazePosition < 0.35) {

        gazeText.innerHTML =
            "👈 LOOKING LEFT";

    }

    else if (gazePosition > 0.65) {

        gazeText.innerHTML =
            "👉 LOOKING RIGHT";

    }

    else {

        gazeText.innerHTML =
            "👁️ LOOKING CENTER";

    }


    // DRAW IRIS
    drawIris(
        landmarks,
        leftIris
    );

    drawIris(
        landmarks,
        rightIris
    );
}


// CALCULATE IRIS POSITION
function getEyePosition(
    landmarks,
    irisIndexes,
    cornerIndexes
) {

    let irisX = 0;


    irisIndexes.forEach(function(index) {

        irisX += landmarks[index].x;

    });


    irisX =
        irisX / irisIndexes.length;


    const corner1 =
        landmarks[cornerIndexes[0]].x;

    const corner2 =
        landmarks[cornerIndexes[1]].x;


    const minX =
        Math.min(corner1, corner2);

    const maxX =
        Math.max(corner1, corner2);


    return (
        (irisX - minX) /
        (maxX - minX)
    );
}


// DRAW IRIS POINTS
function drawIris(
    landmarks,
    irisIndexes
) {

    irisIndexes.forEach(function(index) {

        const x =
            landmarks[index].x *
            canvas.width;

        const y =
            landmarks[index].y *
            canvas.height;


        ctx.beginPath();

        ctx.arc(
            x,
            y,
            5,
            0,
            2 * Math
