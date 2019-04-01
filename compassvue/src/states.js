import { SpacePath } from "./compass/SpacePath";
import craftObj from '!raw-loader!@/assets/craft.obj'
const spacepath = new SpacePath();
export {spacepath, craftObj}

export function radToDeg(rad) {
    return rad * 180 / Math.PI;
}
export var cameraParam = {
    camera: null,
    dwy: 0,
    wratio: 0.01,
    dragged: false,
    dx: 0, 
    dy: 0,
    lastPos: null,
    curPos: null,
    yratio: 0.25,
    xratio: 0.3,
}

export function wheelScroll(event) {
    cameraParam.dwy = event.deltaY * cameraParam.wratio + cameraParam.camera.dis;
    cameraParam.camera.rotate(null, null, cameraParam.dwy);
    event.preventDefault();
    return false;
}

export function onMouseUp(event) {
    cameraParam.dragged = false;
}

export function onMouseMove(e) {
    cameraParam.curPos = getMousePos(cameraParam.canvas, e);
    if(cameraParam.dragged) {
        // console.log(camera.theta)

        cameraParam.dx = (cameraParam.lastPos.x - cameraParam.curPos.x) * cameraParam.xratio + radToDeg(cameraParam.camera.phi);
        cameraParam.dy = (cameraParam.lastPos.y - cameraParam.curPos.y) * cameraParam.yratio + radToDeg(cameraParam.camera.theta);
        if(cameraParam.dx < 0) {
            cameraParam.dx += 360;
        } else if(cameraParam.dx > 360) {
            cameraParam.dx -= 360;
        }
        // console.log(dy, dx)
        cameraParam.camera.rotate(cameraParam.dy, cameraParam.dx);
        cameraParam.lastPos = cameraParam.curPos;
    }
}

export function onMouseDown(e) {
    cameraParam.lastPos = getMousePos(cameraParam.canvas, e)
    cameraParam.dragged = true;
}

function getMousePos(canvasDom, mouseEvent) {
    var rect = canvasDom.getBoundingClientRect();
    return {
        x: mouseEvent.clientX - rect.left,
        y: mouseEvent.clientY - rect.top
    }
}