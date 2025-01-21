import { Vec3 } from "vec3";
/**
 * Represents a 3D coordinate frame with position and rotation.
 */
declare class CFrame {
    /**
     * Creates a new CFrame.
     * @param {number} x - The x-coordinate of the position.
     * @param {number} y - The y-coordinate of the position.
     * @param {number} z - The z-coordinate of the position.
     * @param {number} m11 - Matrix value at row 1, column 1.
     * @param {number} m12 - Matrix value at row 1, column 2.
     * @param {number} m13 - Matrix value at row 1, column 3.
     * @param {number} m21 - Matrix value at row 2, column 1.
     * @param {number} m22 - Matrix value at row 2, column 2.
     * @param {number} m23 - Matrix value at row 2, column 3.
     * @param {number} m31 - Matrix value at row 3, column 1.
     * @param {number} m32 - Matrix value at row 3, column 2.
     * @param {number} m33 - Matrix value at row 3, column 3.
     */
    constructor(x: number, y: number, z: number, m11: number, m12: number, m13: number, m21: number, m22: number, m23: number, m31: number, m32: number, m33: number);
    /** @type {Vec3} */
    p: Vec3;
    /** @type {Vec3} */
    position: Vec3;
    /** @type {Vec3} */
    rotation: Vec3;
    /** @type {Vec3} */
    lookVector: Vec3;
    m11: number;
    m12: number;
    m13: number;
    m21: number;
    m22: number;
    m23: number;
    m31: number;
    m32: number;
    m33: number;
    /**
     * Returns the components of the CFrame.
     * @returns {number[]} An array of components [x, y, z, m11, m12, ..., m33].
     */
    components(): number[];
    /**
     * Adds a Vec3 to the position.
     * @param {Vec3} b - The Vec3 to add.
     * @returns {CFrame} A new CFrame with the updated position.
     */
    addVec3(b: Vec3): CFrame;
    /**
     * Subtracts a Vec3 from the position.
     * @param {Vec3} b - The Vec3 to subtract.
     * @returns {CFrame} A new CFrame with the updated position.
     */
    subVec3(b: Vec3): CFrame;
    /**
     * Multiplies this CFrame with another CFrame.
     * @param {CFrame} b - The other CFrame.
     * @returns {CFrame} The resulting CFrame.
     */
    multiply(b: CFrame): CFrame;
    /**
     * Multiplies this CFrame with a Vec3.
     * @param {Vec3} b - The Vec3.
     * @returns {Vec3} The resulting Vec3.
     */
    multiplyVec3(b: Vec3): Vec3;
    /**
     * Returns the inverse of this CFrame.
     * @returns {CFrame} The inverse CFrame.
     */
    inverse(): CFrame;
    /**
     * Linearly interpolates between this CFrame and another.
     * @param {CFrame} cf - The target CFrame.
     * @param {number} t - The interpolation factor (0 to 1).
     * @returns {CFrame} The interpolated CFrame.
     */
    lerp(cf: CFrame, t: number): CFrame;
    /**
     * Converts this CFrame to world space relative to another.
     * @param {CFrame} cf - The other CFrame.
     * @returns {CFrame} The resulting CFrame in world space.
     */
    toWorldSpace(cf: CFrame): CFrame;
    /**
     * Converts this CFrame to object space relative to another.
     * @param {CFrame} cf - The other CFrame.
     * @returns {CFrame} The resulting CFrame in object space.
     */
    toObjectSpace(cf: CFrame): CFrame;
    /**
     * Converts a point to world space.
     * @param {Vec3} v - The point in object space.
     * @returns {Vec3} The point in world space.
     */
    pointToWorldSpace(v: Vec3): Vec3;
    /**
     * Converts a point to object space.
     * @param {Vec3} v - The point in world space.
     * @returns {Vec3} The point in object space.
     */
    pointToObjectSpace(v: Vec3): Vec3;
    /**
     * Converts a vector to world space.
     * @param {Vec3} v - The vector in object space.
     * @returns {Vec3} The vector in world space.
     */
    vectorToWorldSpace(v: Vec3): Vec3;
    /**
     * Converts a vector to object space.
     * @param {Vec3} v - The vector in world space.
     * @returns {Vec3} The vector in object space.
     */
    vectorToObjectSpace(v: Vec3): Vec3;
    /**
     * Converts this CFrame to Euler angles (XYZ convention).
     * @returns {Vec3} The Euler angles in degrees.
     */
    toEulerAnglesXYZ(): Vec3;
    /**
     * Converts this CFrame to Euler angles (YXZ convention).
     * @returns {Vec3} The Euler angles in degrees.
     */
    toEulerAnglesYXZ(): Vec3;
    /**
     * Converts this CFrame to Euler angles (ZYX convention).
     * @returns {Vec3} The Euler angles in degrees.
     */
    toEulerAnglesZYX(): Vec3;
    /**
     * Returns a string representation of this CFrame.
     * @returns {string} A string containing all components.
     */
    toString(): string;
    /**
     * Clones this CFrame.
     * @returns {CFrame} A new CFrame with the same components.
     */
    clone(): CFrame;
}
/**
 * Creates a new CFrame instance using various initialization options.
 *
 * This factory function provides multiple ways to create a `CFrame`:
 * 1. Position only (`x`, `y`, `z`).
 * 2. Position and rotation matrix (`x`, `y`, `z`, and 9 matrix elements).
 * 3. Position and quaternion (`x`, `y`, `z`, and quaternion components).
 * 4. Using a `Vec3` for position or `lookAt` behavior with an eye and look vector.
 *
 * @function cframe.new
 * @param {number|Vec3} x - The x-coordinate of the position, or a Vec3 for position.
 * @param {number|Vec3|null} y - The y-coordinate of the position, or a Vec3 for lookAt.
 * @param {number|null} z - The z-coordinate of the position.
 * @param {number|null} [m11] - Matrix or quaternion component.
 * @param {number|null} [m12] - Matrix or quaternion component.
 * @param {number|null} [m13] - Matrix or quaternion component.
 * @param {number|null} [m21] - Matrix or quaternion component.
 * @param {number|null} [m22] - Matrix or quaternion component.
 * @param {number|null} [m23] - Matrix or quaternion component.
 * @param {number|null} [m31] - Matrix component.
 * @param {number|null} [m32] - Matrix component.
 * @param {number|null} [m33] - Matrix component.
 * @returns {CFrame} The newly created CFrame.
 *
 * @example
 * // Example 1: Create a CFrame with position only
 * const cf1 = cframe.new(10, 20, 30);
 *
 * @example
 * // Example 2: Create a CFrame with position and rotation matrix
 * const cf2 = cframe.new(10, 20, 30, 1, 0, 0, 0, 1, 0, 0, 0, 1);
 *
 * @example
 * // Example 3: Create a CFrame with position and quaternion
 * const cf3 = cframe.new(10, 20, 30, 0, 0, 0, 1);
 *
 * @example
 * // Example 4: Create a CFrame using lookAt behavior
 * const eye = new Vec3(0, 0, 0);
 * const look = new Vec3(1, 0, 0);
 * const cf4 = cframe.new(eye, look);
 */
declare function _new(x: number | Vec3, y: number | Vec3 | null, z: number | null, m11?: number | null, m12?: number | null, m13?: number | null, m21?: number | null, m22?: number | null, m23?: number | null, m31?: number | null, m32?: number | null, m33?: number | null): CFrame;
export { _new as new };
/**
 * Creates a CFrame from an axis and angle of rotation.
 *
 * @function cframe.fromAxisAngle
 * @param {Vec3} axis - The axis of rotation (unit vector).
 * @param {number} theta - The angle of rotation in radians.
 * @returns {CFrame} The resulting CFrame.
 *
 * @example
 * const axis = new Vec3(1, 0, 0);
 * const angle = Math.PI / 4; // 45 degrees
 * const cf = cframe.fromAxisAngle(axis, angle);
 */
export declare function fromAxisAngle(axis: Vec3, theta: number): CFrame;
/**
 * Creates a CFrame from individual rotation angles (XYZ order).
 *
 * @function cframe.Angles
 * @param {number} x - Rotation around the X-axis in radians.
 * @param {number} y - Rotation around the Y-axis in radians.
 * @param {number} z - Rotation around the Z-axis in radians.
 * @returns {CFrame} The resulting CFrame.
 *
 * @example
 * const cf = cframe.Angles(Math.PI / 4, Math.PI / 6, Math.PI / 8);
 */
export declare function Angles(x: number, y: number, z: number): CFrame;
/**
 * Creates a CFrame from individual rotation angles (XYZ order).
 *
 * @function cframe.fromEulerAngles
 * @param {number} x - Rotation around the X-axis in radians.
 * @param {number} y - Rotation around the Y-axis in radians.
 * @param {number} z - Rotation around the Z-axis in radians.
 * @returns {CFrame} The resulting CFrame.
 *
 * @example
 * const cf = cframe.fromEulerAngles(Math.PI / 4, Math.PI / 6, Math.PI / 8);
 */
export declare function fromEulerAngles(x: number, y: number, z: number): CFrame;
/**
 * Creates a CFrame using Euler angles in the specified order.
 *
 * @function cframe.fromEulerAnglesXYZ
 * @param {number} x - Rotation around the X-axis in radians.
 * @param {number} y - Rotation around the Y-axis in radians.
 * @param {number} z - Rotation around the Z-axis in radians.
 * @returns {CFrame} The resulting CFrame.
 *
 * @example
 * const cf = cframe.fromEulerAnglesXYZ(Math.PI / 4, Math.PI / 6, Math.PI / 8);
 */
export declare function fromEulerAnglesXYZ(x: number, y: number, z: number): CFrame;
/**
 * Creates a CFrame using Euler angles in YXZ order.
 *
 * @function cframe.fromEulerAnglesYXZ
 * @param {number} x - Rotation around the X-axis in radians.
 * @param {number} y - Rotation around the Y-axis in radians.
 * @param {number} z - Rotation around the Z-axis in radians.
 * @returns {CFrame} The resulting CFrame.
 *
 * @example
 * const cf = cframe.fromEulerAnglesYXZ(Math.PI / 4, Math.PI / 6, Math.PI / 8);
 */
export declare function fromEulerAnglesYXZ(x: number, y: number, z: number): CFrame;
/**
 * Creates a CFrame using Euler angles in ZYX order.
 *
 * @function cframe.fromEulerAnglesZYX
 * @param {number} x - Rotation around the X-axis in radians.
 * @param {number} y - Rotation around the Y-axis in radians.
 * @param {number} z - Rotation around the Z-axis in radians.
 * @returns {CFrame} The resulting CFrame.
 *
 * @example
 * const cf = cframe.fromEulerAnglesZYX(Math.PI / 4, Math.PI / 6, Math.PI / 8);
 */
export declare function fromEulerAnglesZYX(x: number, y: number, z: number): CFrame;
/**
 * Creates a CFrame using the eye (position) and lookAt (target) vectors.
 *
 * @function cframe.lookAt
 * @param {Vec3} eye - The position of the camera or object.
 * @param {Vec3} look - The target position to look at.
 * @returns {CFrame} The resulting CFrame.
 *
 * @example
 * const eye = new Vec3(0, 5, 10);
 * const target = new Vec3(0, 0, 0);
 * const cf = cframe.lookAt(eye, target);
 */
export declare function lookAt(eye: Vec3, look: Vec3): CFrame;
