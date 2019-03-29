import { SpacePath } from "./compass/SpacePath";
import craftObj from '!raw-loader!@/assets/craft.obj'
const spacepath = new SpacePath();
export {spacepath, craftObj}

export function radToDeg(rad) {
    return rad * 180 / Math.PI;
}
