const { Vec3 } = require("vec3");
var cframe = {};

var max = Math.max;
// @ts-ignore
var cos = Math.cos;
// @ts-ignore
var sin = Math.sin;
var acos = Math.acos;
var asin = Math.asin;
var sqrt = Math.sqrt;
var atan2 = Math.atan2;

var identityMatrix = {
	m11: 1, m12: 0, m13: 0,
	m21: 0, m22: 1, m23: 0,
	m31: 0, m32: 0, m33: 1
}

var m41 = 0;
var m42 = 0;
var m43 = 0;
var m44 = 1;

// @ts-ignore
function rad(angle) {
	return angle * (Math.PI / 180);
}

function deg(angle) {
	return angle * (180 / Math.PI);
}

function vec3Lerp(v1, v2, t) {
	return v1.plus(v2.minus(v1)).scaled(t);
}

function fromAxisAngle(axis, vector, theta) {
	axis = axis.unit();

	const part1 = vector.scaled(Math.cos(theta));
	const part2 = axis.scaled(vector.dot(axis) * (1 - Math.cos(theta)));
	const part3 = axis.cross(vector).scaled(Math.sin(theta));

	return part1.plus(part2).plus(part3);
}

function cfTimesv3(cf, v3) {
	// Extract the components from the cf matrix
	const components = cf.components();

	// Extract the rotation matrix elements
	const m11 = components[3], m12 = components[4], m13 = components[5];
	const m21 = components[6], m22 = components[7], m23 = components[8];
	const m31 = components[9], m32 = components[10], m33 = components[11];

	// Create Vec3 vectors for the matrix's right, top, and back directions
	const right = new Vec3(m11, m21, m31);
	const top = new Vec3(m12, m22, m32);
	const back = new Vec3(m13, m23, m33);

	// Calculate the transformed position
	const transformed = cf.p
		.plus(right.scaled(v3.x))
		.plus(top.scaled(v3.y))
		.plus(back.scaled(v3.z));

	return transformed;
}

function fourByfour(a, b) {
	var a11 = a[0];
	var a12 = a[1];
	var a13 = a[2];
	var a14 = a[3];
	var a21 = a[4];
	var a22 = a[5];
	var a23 = a[6];
	var a24 = a[7];
	var a31 = a[8];
	var a32 = a[9];
	var a33 = a[10];
	var a34 = a[11];
	var a41 = a[12];
	var a42 = a[13];
	var a43 = a[14];
	var a44 = a[15];

	var b11 = b[0];
	var b12 = b[1];
	var b13 = b[2];
	var b14 = b[3];
	var b21 = b[4];
	var b22 = b[5];
	var b23 = b[6];
	var b24 = b[7];
	var b31 = b[8];
	var b32 = b[9];
	var b33 = b[10];
	var b34 = b[11];
	var b41 = b[12];
	var b42 = b[13];
	var b43 = b[14];
	var b44 = b[15];

	var m11 = a11 * b11 + a12 * b21 + a13 * b31 + a14 * b41;
	var m12 = a11 * b12 + a12 * b22 + a13 * b32 + a14 * b42;
	var m13 = a11 * b13 + a12 * b23 + a13 * b33 + a14 * b43;
	var m14 = a11 * b14 + a12 * b24 + a13 * b34 + a14 * b44;
	var m21 = a21 * b11 + a22 * b21 + a23 * b31 + a24 * b41;
	var m22 = a21 * b12 + a22 * b22 + a23 * b32 + a24 * b42;
	var m23 = a21 * b13 + a22 * b23 + a23 * b33 + a24 * b43;
	var m24 = a21 * b14 + a22 * b24 + a23 * b34 + a24 * b44;
	var m31 = a31 * b11 + a32 * b21 + a33 * b31 + a34 * b41;
	var m32 = a31 * b12 + a32 * b22 + a33 * b32 + a34 * b42;
	var m33 = a31 * b13 + a32 * b23 + a33 * b33 + a34 * b43;
	var m34 = a31 * b14 + a32 * b24 + a33 * b34 + a34 * b44;
	var m41 = a41 * b11 + a42 * b21 + a43 * b31 + a44 * b41;
	var m42 = a41 * b12 + a42 * b22 + a43 * b32 + a44 * b42;
	var m43 = a41 * b13 + a42 * b23 + a43 * b33 + a44 * b43;
	var m44 = a41 * b14 + a42 * b24 + a43 * b34 + a44 * b44;

	return [m11, m12, m13, m14, m21, m22, m23, m24, m31, m32, m33, m34, m41, m42, m43, m44];
}

function cfTimescf(cf1, cf2) {
	var componentsA = cf1.components();
	var componentsB = cf2.components();

	var a14 = componentsA[0];
	var a24 = componentsA[1];
	var a34 = componentsA[2];
	var a11 = componentsA[3];
	var a12 = componentsA[4];
	var a13 = componentsA[5];
	var a21 = componentsA[6];
	var a22 = componentsA[7];
	var a23 = componentsA[8];
	var a31 = componentsA[9];
	var a32 = componentsA[10];
	var a33 = componentsA[11];

	var b14 = componentsB[0];
	var b24 = componentsB[1];
	var b34 = componentsB[2];
	var b11 = componentsB[3];
	var b12 = componentsB[4];
	var b13 = componentsB[5];
	var b21 = componentsB[6];
	var b22 = componentsB[7];
	var b23 = componentsB[8];
	var b31 = componentsB[9];
	var b32 = componentsB[10];
	var b33 = componentsB[11];

	var result = fourByfour([
		a11, a12, a13, a14,
		a21, a22, a23, a24,
		a31, a32, a33, a34,
		m41, m42, m43, m44
	], [
		b11, b12, b13, b14,
		b21, b22, b23, b24,
		b31, b32, b33, b34,
		m41, m42, m43, m44
	])

	var m11 = result[0];
	var m12 = result[1];
	var m13 = result[2];
	var m14 = result[3];

	var m21 = result[4];
	var m22 = result[5];
	var m23 = result[6];
	var m24 = result[7];

	var m31 = result[8];
	var m32 = result[9];
	var m33 = result[10];
	var m34 = result[11];

	return cframe.new(m14, m24, m34, m11, m12, m13, m21, m22, m23, m31, m32, m33);
}

function getDeterminant(cf) {
	var componentsA = cf.components();

	var a14 = componentsA[0];
	var a24 = componentsA[1];
	var a34 = componentsA[2];
	var a11 = componentsA[3];
	var a12 = componentsA[4];
	var a13 = componentsA[5];
	var a21 = componentsA[6];
	var a22 = componentsA[7];
	var a23 = componentsA[8];
	var a31 = componentsA[9];
	var a32 = componentsA[10];
	var a33 = componentsA[11];

	var det = a11 * a22 * a33 * m44 + a11 * a23 * a34 * m42 + a11 * a24 * a32 * m43
		+ a12 * a21 * a34 * m43 + a12 * a23 * a31 * m44 + a12 * a24 * a33 * m41
		+ a13 * a21 * a32 * m44 + a13 * a22 * a34 * m41 + a13 * a24 * a31 * m42
		+ a14 * a21 * a33 * m42 + a14 * a22 * a31 * m43 + a14 * a23 * a32 * m41
		- a11 * a22 * a34 * m43 - a11 * a23 * a32 * m44 - a11 * a24 * a33 * m42
		- a12 * a21 * a33 * m44 - a12 * a23 * a34 * m41 - a12 * a24 * a31 * m43
		- a13 * a21 * a34 * m42 - a13 * a22 * a31 * m44 - a13 * a24 * a32 * m41
		- a14 * a21 * a32 * m43 - a14 * a22 * a33 * m41 - a14 * a23 * a31 * m42;

	return det;
}

function invert4x4(cf) {
	var componentsA = cf.components();

	var a14 = componentsA[0];
	var a24 = componentsA[1];
	var a34 = componentsA[2];
	var a11 = componentsA[3];
	var a12 = componentsA[4];
	var a13 = componentsA[5];
	var a21 = componentsA[6];
	var a22 = componentsA[7];
	var a23 = componentsA[8];
	var a31 = componentsA[9];
	var a32 = componentsA[10];
	var a33 = componentsA[11];

	var det = getDeterminant(cf);
	if (det == 0) return cf;

	var b11 = (a22 * a33 * m44 + a23 * a34 * m42 + a24 * a32 * m43 - a22 * a34 * m43 - a23 * a32 * m44 - a24 * a33 * m42) / det;
	var b12 = (a12 * a34 * m43 + a13 * a32 * m44 + a14 * a33 * m42 - a12 * a33 * m44 - a13 * a34 * m42 - a14 * a32 * m43) / det;
	var b13 = (a12 * a23 * m44 + a13 * a24 * m42 + a14 * a22 * m43 - a12 * a24 * m43 - a13 * a22 * m44 - a14 * a23 * m42) / det;
	var b14 = (a12 * a24 * a33 + a13 * a22 * a34 + a14 * a23 * a32 - a12 * a23 * a34 - a13 * a24 * a32 - a14 * a22 * a33) / det;
	var b21 = (a21 * a34 * m43 + a23 * a31 * m44 + a24 * a33 * m41 - a21 * a33 * m44 - a23 * a34 * m41 - a24 * a31 * m43) / det;
	var b22 = (a11 * a33 * m44 + a13 * a34 * m41 + a14 * a31 * m43 - a11 * a34 * m43 - a13 * a31 * m44 - a14 * a33 * m41) / det;
	var b23 = (a11 * a24 * m43 + a13 * a21 * m44 + a14 * a23 * m41 - a11 * a23 * m44 - a13 * a24 * m41 - a14 * a21 * m43) / det;
	var b24 = (a11 * a23 * a34 + a13 * a24 * a31 + a14 * a21 * a33 - a11 * a24 * a33 - a13 * a21 * a34 - a14 * a23 * a31) / det;
	var b31 = (a21 * a32 * m44 + a22 * a34 * m41 + a24 * a31 * m42 - a21 * a34 * m42 - a22 * a31 * m44 - a24 * a32 * m41) / det;
	var b32 = (a11 * a34 * m42 + a12 * a31 * m44 + a14 * a32 * m41 - a11 * a32 * m44 - a12 * a34 * m41 - a14 * a31 * m42) / det;
	var b33 = (a11 * a22 * m44 + a12 * a24 * m41 + a14 * a21 * m42 - a11 * a24 * m42 - a12 * a21 * m44 - a14 * a22 * m41) / det;
	var b34 = (a11 * a24 * a32 + a12 * a21 * a34 + a14 * a22 * a31 - a11 * a22 * a34 - a12 * a24 * a31 - a14 * a21 * a32) / det;
	// @ts-ignore
	var b41 = (a21 * a33 * m42 + a22 * a31 * m43 + a23 * a32 * m41 - a21 * a32 * m43 - a22 * a33 * m41 - a23 * a31 * m42) / det;
	// @ts-ignore
	var b42 = (a11 * a32 * m43 + a12 * a33 * m41 + a13 * a31 * m42 - a11 * a33 * m42 - a12 * a31 * m43 - a13 * a32 * m41) / det;
	// @ts-ignore
	var b43 = (a11 * a23 * m42 + a12 * a21 * m43 + a13 * a22 * m41 - a11 * a22 * m43 - a12 * a23 * m41 - a13 * a21 * m42) / det;
	// @ts-ignore
	var b44 = (a11 * a22 * a33 + a12 * a23 * a31 + a13 * a21 * a32 - a11 * a23 * a32 - a12 * a21 * a33 - a13 * a22 * a31) / det;

	return cframe.new(b14, b24, b34, b11, b12, b13, b21, b22, b23, b31, b32, b33);
}

function quaternionToMatrix(i, j, k, w) {
	var m11 = 1 - 2 * j ^ 2 - 2 * k ^ 2;
	var m12 = 2 * (i * j - k * w);
	var m13 = 2 * (i * k + j * w);
	var m21 = 2 * (i * j + k * w);
	var m22 = 1 - 2 * i ^ 2 - 2 * k ^ 2;
	var m23 = 2 * (j * k - i * w);
	var m31 = 2 * (i * k - j * w);
	var m32 = 2 * (j * k + i * w);
	var m33 = 1 - 2 * i ^ 2 - 2 * j ^ 2;

	return [0, 0, 0, m11, m12, m13, m21, m22, m23, m31, m32, m33];
}

function quaternionFromCFrame(cf) {
	var components = cf.components();

	// @ts-ignore
	var mx = components[0];
	// @ts-ignore
	var my = components[1];
	// @ts-ignore
	var mz = components[2];
	var m11 = components[3];
	var m12 = components[4];
	var m13 = components[5];
	var m21 = components[6];
	var m22 = components[7];
	var m23 = components[8];
	var m31 = components[9];
	var m32 = components[10];
	var m33 = components[11];

	var trace = m11 + m22 + m33;

	if (trace > 0) {
		var s = sqrt(1 + trace);
		var r = 0.5 / s;
		return [s * 0.5, new Vec3((m32 - m23) * r, (m13 - m31) * r, (m21 - m12) * r)];
	} else {
		var big = max(m11, m22, m33);

		if (big == m11) {
			var s = sqrt(1 + m11 - m22 - m33);
			var r = 0.5 / s;
			return [(m32 - m23) * r, new Vec3(0.5 * s, (m21 + m12) * r, (m13 + m31) * r)];
		} else if (big == m22) {
			var s = sqrt(1 - m11 + m22 - m33);
			var r = 0.5 / s;
			return [(m13 - m31) * r, new Vec3((m21 + m12) * r, 0.5 * s, (m32 + m23) * r)];
		} else if (big == m33) {
			var s = sqrt(1 - m11 - m22 + m33);
			var r = 0.5 / s;
			return [(m21 - m12) * r, new Vec3((m13 + m31) * r, (m32 + m23) * r, 0.5 * s)];
		}
	}
}

function lerp(a, b, t) {
	var cf = a.inverse().multiply(b);
	var quat = quaternionFromCFrame(cf);

	var w = quat[0];
	var v = quat[1];

	// @ts-ignore
	var theta = acos(w) * 2;
	var p = vec3Lerp(a.p, b.p, t);

	if (theta != 0) {
		// @ts-ignore
		var rot = a.multiply(cframe.fromAxisAngle(v, theta * t));
		var components = rot.components();

		var m11 = components[3];
		var m12 = components[4];
		var m13 = components[5];

		var m21 = components[6];
		var m22 = components[7];
		var m23 = components[8];

		var m31 = components[9];
		var m32 = components[10];
		var m33 = components[11];

		return cframe.new(p.x, p.y, p.z, m11, m12, m13, m21, m22, m23, m31, m32, m33);
	} else {
		var components = a.components();

		var m11 = components[3];
		var m12 = components[4];
		var m13 = components[5];

		var m21 = components[6];
		var m22 = components[7];
		var m23 = components[8];

		var m31 = components[9];
		var m32 = components[10];
		var m33 = components[11];

		return cframe.new(p.x, p.y, p.z, m11, m12, m13, m21, m22, m23, m31, m32, m33);
	}
}

/**
 * Represents a 3D coordinate frame with position and rotation.
 */
class CFrame {
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
	constructor(x, y, z, m11, m12, m13, m21, m22, m23, m31, m32, m33) {
		/** @type {Vec3} */
		this.p = new Vec3(x, y, z);
		/** @type {Vec3} */
		this.position = new Vec3(x, y, z);
		/** @type {Vec3} */
		this.rotation = new Vec3(0, 0, 0);
		/** @type {Vec3} */
		this.lookVector = new Vec3(-m13, -m23, -m33);

		this.m11 = m11;
		this.m12 = m12;
		this.m13 = m13;

		this.m21 = m21;
		this.m22 = m22;
		this.m23 = m23;

		this.m31 = m31;
		this.m32 = m32;
		this.m33 = m33;
	}

	/**
	 * Returns the components of the CFrame.
	 * @returns {number[]} An array of components [x, y, z, m11, m12, ..., m33].
	 */
	components() {
		return [this.p.x, this.p.y, this.p.z, this.m11, this.m12, this.m13, this.m21, this.m22, this.m23, this.m31, this.m32, this.m33];
	}

	/**
	 * Adds a Vec3 to the position.
	 * @param {Vec3} b - The Vec3 to add.
	 * @returns {CFrame} A new CFrame with the updated position.
	 */
	addVec3(b) {
		return cframe.new(this.p.x + b.x, this.p.y + b.y, this.p.z + b.z, this.m11, this.m12, this.m13, this.m21, this.m22, this.m23, this.m31, this.m32, this.m33);
	}

	/**
	 * Subtracts a Vec3 from the position.
	 * @param {Vec3} b - The Vec3 to subtract.
	 * @returns {CFrame} A new CFrame with the updated position.
	 */
	subVec3(b) {
		return cframe.new(this.p.x - b.x, this.p.y - b.y, this.p.z - b.z, this.m11, this.m12, this.m13, this.m21, this.m22, this.m23, this.m31, this.m32, this.m33);
	}

	/**
	 * Multiplies this CFrame with another CFrame.
	 * @param {CFrame} b - The other CFrame.
	 * @returns {CFrame} The resulting CFrame.
	 */
	multiply(b) {
		return cfTimescf(this, b);
	}

	/**
	 * Multiplies this CFrame with a Vec3.
	 * @param {Vec3} b - The Vec3.
	 * @returns {Vec3} The resulting Vec3.
	 */
	multiplyVec3(b) {
		return cfTimesv3(this, b);
	}

	/**
	 * Returns the inverse of this CFrame.
	 * @returns {CFrame} The inverse CFrame.
	 */
	inverse() {
		return invert4x4(this);
	}

	/**
	 * Linearly interpolates between this CFrame and another.
	 * @param {CFrame} cf - The target CFrame.
	 * @param {number} t - The interpolation factor (0 to 1).
	 * @returns {CFrame} The interpolated CFrame.
	 */
	lerp(cf, t) {
		return lerp(this, cf, t);
	}

	/**
	 * Converts this CFrame to world space relative to another.
	 * @param {CFrame} cf - The other CFrame.
	 * @returns {CFrame} The resulting CFrame in world space.
	 */
	toWorldSpace(cf) {
		return this.multiply(cf);
	}

	/**
	 * Converts this CFrame to object space relative to another.
	 * @param {CFrame} cf - The other CFrame.
	 * @returns {CFrame} The resulting CFrame in object space.
	 */
	toObjectSpace(cf) {
		return this.inverse().multiply(cf);
	}

	/**
	 * Converts a point to world space.
	 * @param {Vec3} v - The point in object space.
	 * @returns {Vec3} The point in world space.
	 */
	pointToWorldSpace(v) {
		return this.multiplyVec3(v);
	}

	/**
	 * Converts a point to object space.
	 * @param {Vec3} v - The point in world space.
	 * @returns {Vec3} The point in object space.
	 */
	pointToObjectSpace(v) {
		return this.inverse().multiplyVec3(v);
	}

	/**
	 * Converts a vector to world space.
	 * @param {Vec3} v - The vector in object space.
	 * @returns {Vec3} The vector in world space.
	 */
	vectorToWorldSpace(v) {
		return this.subVec3(this.p).multiplyVec3(v);
	}

	/**
	 * Converts a vector to object space.
	 * @param {Vec3} v - The vector in world space.
	 * @returns {Vec3} The vector in object space.
	 */
	vectorToObjectSpace(v) {
		return this.subVec3(this.p).inverse().multiplyVec3(v);
	}

	/**
	 * Converts this CFrame to Euler angles (XYZ convention).
	 * @returns {Vec3} The Euler angles in degrees.
	 */
	toEulerAnglesXYZ() {
		var components = this.components();

		var m11 = components[3];
		var m12 = components[4];
		var m13 = components[5];

		var m21 = components[6];
		var m22 = components[7];
		var m23 = components[8];

		// @ts-ignore
		var m31 = components[9];
		// @ts-ignore
		var m32 = components[10];
		var m33 = components[11];

		var xAngle = 0;
		var yAngle = 0;
		var zAngle = 0;

		if (m13 < 1) {
			if (m13 > -1) {
				xAngle = atan2(-m23, m33);
				yAngle = asin(m13);
				zAngle = atan2(-m12, m11);
			} else {
				xAngle = -atan2(m21, m22);
				yAngle = -(Math.PI / 2);
				zAngle = 0;
			}
		} else {
			xAngle = atan2(m21, m22);
			yAngle = (Math.PI / 2);
			zAngle = 0;
		}

		return new Vec3(deg(xAngle), deg(yAngle), deg(zAngle));
	}

	/**
	 * Converts this CFrame to Euler angles (YXZ convention).
	 * @returns {Vec3} The Euler angles in degrees.
	 */
	toEulerAnglesYXZ() {
		var components = this.components();

		var m11 = components[3];
		var m12 = components[4];
		var m13 = components[5];

		var m21 = components[6];
		var m22 = components[7];
		var m23 = components[8];

		// @ts-ignore
		var m31 = components[9];
		// @ts-ignore
		var m32 = components[10];
		var m33 = components[11];

		var xAngle = 0;
		var yAngle = 0;
		var zAngle = 0;

		if (m23 < 1) {
			if (m23 > -1) {
				yAngle = atan2(m13, m33);
				xAngle = asin(-m23);
				zAngle = atan2(m21, m22);
			} else {
				yAngle = atan2(m12, m11);
				xAngle = (Math.PI / 2);
				zAngle = 0;
			}
		} else {
			yAngle = atan2(-m12, m11);
			xAngle = -(Math.PI / 2);
			zAngle = 0;
		}

		return new Vec3(deg(xAngle), deg(yAngle), deg(zAngle));
	}

	/**
	 * Converts this CFrame to Euler angles (ZYX convention).
	 * @returns {Vec3} The Euler angles in degrees.
	 */
	toEulerAnglesZYX() {
		var components = this.components();

		var m11 = components[3];
		var m12 = components[4];
		var m13 = components[5];

		var m21 = components[6];
		// @ts-ignore
		var m22 = components[7];
		// @ts-ignore
		var m23 = components[8];

		var m31 = components[9];
		var m32 = components[10];
		var m33 = components[11];

		var xAngle = 0;
		var yAngle = 0;
		var zAngle = 0;

		if (m31 < 1) {
			if (m31 > -1) {
				zAngle = atan2(m21, m11);
				yAngle = asin(-m32);
				xAngle = atan2(m32, m33);
			} else {
				zAngle = -atan2(m12, m13);
				yAngle = (Math.PI / 2);
				xAngle = 0;
			}
		} else {
			zAngle = atan2(-m12, -m13);
			yAngle = -(Math.PI / 2);
			xAngle = 0;
		}

		return new Vec3(deg(xAngle), deg(yAngle), deg(zAngle));
	}

	/**
	 * Returns a string representation of this CFrame.
	 * @returns {string} A string containing all components.
	 */
	toString() {
		return this.components().toString();
	}

	/**
	 * Clones this CFrame.
	 * @returns {CFrame} A new CFrame with the same components.
	 */
	clone() {
		return cframe.new(this.p.x, this.p.y, this.p.z, this.m11, this.m12, this.m13, this.m21, this.m22, this.m23, this.m31, this.m32, this.m33);
	}
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
cframe.new = (x, y, z, m11, m12, m13, m21, m22, m23, m31, m32, m33) => {
	var cf = new CFrame(0, 0, 0, identityMatrix.m11, identityMatrix.m12, identityMatrix.m13, identityMatrix.m21, identityMatrix.m22, identityMatrix.m23, identityMatrix.m31, identityMatrix.m32, identityMatrix.m33);

	if (typeof x == "object" && y == null) {
		cf.p = new Vec3(x.x, x.y, x.z);
		cf.position = new Vec3(x.x, x.y, x.z);
	} else if (typeof x == "object" && typeof y == "object") {
		var eye = x;
		var look = y;

		var zaxis = (eye.minus(look)).unit();
		var xaxis = new Vec3(0, 1, 0).cross(zaxis).unit();
		var yaxis = zaxis.cross(xaxis).unit();

		if (xaxis.distanceSquared(new Vec3(0, 0, 0)) == 0) {
			if (zaxis.y < 0) {
				xaxis = new Vec3(0, 0, -1);
				yaxis = new Vec3(1, 0, 0);
				zaxis = new Vec3(0, -1, 0);
			} else {
				xaxis = new Vec3(0, 0, 1);
				yaxis = new Vec3(1, 0, 0);
				zaxis = new Vec3(0, 1, 0);
			}
		}

		cf.p = new Vec3(eye.x, eye.y, eye.z);
		cf.position = new Vec3(eye.x, eye.y, eye.z);

		cf.m11 = xaxis.x;
		cf.m12 = xaxis.y;
		cf.m13 = xaxis.z;

		cf.m21 = yaxis.x;
		cf.m22 = yaxis.y;
		cf.m23 = yaxis.z;

		cf.m31 = zaxis.x;
		cf.m32 = zaxis.y;
		cf.m33 = zaxis.z;
	} else if (typeof x == "number" && typeof y == "number" && typeof z == "number" && m11 == null) {
		cf.p = new Vec3(x, y, z);
		cf.position = new Vec3(x, y, z);
	} else if (typeof x == "number" && typeof y == "number" && typeof z == "number" && m11 != null && m33 == null) {
		var m = quaternionToMatrix(m11, m12, m13, m21);

		cf.p = new Vec3(x, y, z);
		cf.position = new Vec3(x, y, z);

		cf.m11 = m[3];
		cf.m12 = m[4];
		cf.m13 = m[5];

		cf.m21 = m[6];
		cf.m22 = m[7];
		cf.m23 = m[8];

		cf.m31 = m[9];
		cf.m32 = m[10];
		cf.m33 = m[11];
	} else {
		// @ts-ignore
		cf.p = new Vec3(x, y, z);
		// @ts-ignore
		cf.position = new Vec3(x, y, z);

		cf.m11 = m11;
		cf.m12 = m12;
		cf.m13 = m13;

		cf.m21 = m21;
		cf.m22 = m22;
		cf.m23 = m23;

		cf.m31 = m31;
		cf.m32 = m32;
		cf.m33 = m33;
	}

	cf.lookVector = new Vec3(-cf.m13, -cf.m23, -cf.m33);
	cf.rotation = cf.toEulerAnglesYXZ();

	return cf;
}

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
cframe.fromAxisAngle = (axis, theta) => {
	// @ts-ignore
	var axis = new Vec3(axis.x, axis.y, axis.z).unit();
	var r = fromAxisAngle(axis, new Vec3(1, 0, 0), theta);
	var t = fromAxisAngle(axis, new Vec3(0, 1, 0), theta);
	var b = fromAxisAngle(axis, new Vec3(0, 0, 1), theta);

	return cframe.new(
		0, 0, 0,
		r.x, t.x, b.x,
		r.y, t.y, b.y,
		r.z, t.z, b.z
	);
}

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
cframe.Angles = (x, y, z) => {
	var cfx = cframe.fromAxisAngle(new Vec3(1, 0, 0), x);
	var cfy = cframe.fromAxisAngle(new Vec3(0, 1, 0), y);
	var cfz = cframe.fromAxisAngle(new Vec3(0, 0, 1), z);

	return cfx.multiply(cfy).multiply(cfz);
}

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
cframe.fromEulerAngles = (x, y, z) => {
	return cframe.Angles(x, y, z)
}

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
cframe.fromEulerAnglesXYZ = (x, y, z) => {
	return cframe.Angles(x, y, z)
}

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
cframe.fromEulerAnglesYXZ = (x, y, z) => {
	var cfx = cframe.fromAxisAngle(new Vec3(1, 0, 0), x);
	var cfy = cframe.fromAxisAngle(new Vec3(0, 1, 0), y);
	var cfz = cframe.fromAxisAngle(new Vec3(0, 0, 1), z);

	return cfy.multiply(cfx).multiply(cfz);
}

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
cframe.fromEulerAnglesZYX = (x, y, z) => {
	var cfx = cframe.fromAxisAngle(new Vec3(1, 0, 0), x);
	var cfy = cframe.fromAxisAngle(new Vec3(0, 1, 0), y);
	var cfz = cframe.fromAxisAngle(new Vec3(0, 0, 1), z);

	return cfz.multiply(cfy).multiply(cfx);
}

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
cframe.lookAt = (eye, look) => {
	// @ts-ignore
	return cframe.new(eye, look);
}

module.exports = cframe;