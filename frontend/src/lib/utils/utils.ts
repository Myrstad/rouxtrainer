export class Vector3 {
    public x: number;
    public y: number;
    public z: number;

    constructor (x: number = 0, y: number = 0, z: number = 0) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    public normalize() : Vector3 {
        const length = Math.sqrt(this.x ** 2 + this.y ** 2 + this.z ** 2);
        if (length > 0) {
            this.x /= length;
            this.y /= length;
            this.z /= length;
        }
        return this;
    }

    public applyQuaternion(q: Quaternion) : Vector3 {
        const x = this.x; const y = this.y; const z = this.z;
        const qx = q.x; const qy = q.y; const qz = q.z; const qw = q.w;

        const ix = qw * x + qy * z - qz * y;
        const iy = qw * y + qz * x - qx * z;
        const iz = qw * z + qx * y - qy * x;
        const iw = -qx * x - qy * y - qz * z;

        this.x = ix * qw + iw * -qx + iy * -qz - iz * -qy;
        this.y = iy * qw + iw * -qy + iz * -qx - ix * -qz;
        this.z = iz * qw + iw * -qz + ix * -qy - iy * -qx;

        return this;
    }
}

export class Quaternion {
    public x: number;
    public y: number;
    public z: number;
    public w: number;

    constructor (x: number = 0, y: number = 0, z: number = 0, w: number = 1) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.w = w;
    }

    public identity() : Quaternion {
        this.x = 0;
        this.y = 0;
        this.z = 0;
        this.w = 1;
        return this;
    }

    // Sets the quaternion from an axis and angle
    public setFromAxisAngle(axis: Vector3, angle: number): Quaternion {
        // angle = angle * 0.5; // Half angle
        const s = Math.sin(angle / 2);
        this.x = axis.x * s;
        this.y = axis.y * s;
        this.z = axis.z * s;
        this.w = Math.cos(angle / 2);
        return this.normalize();
    }

    // Multiplies this quaternion by another quaternion (Q_this = Q_this * Q_other)
    public multiply(q: Quaternion) : Quaternion {
        return this.multiplyQuaternions(this, q);
    }

    // Multiplies another quaternion by this quaternion (Q_this = Q_other * Q_this)
    public premultiply(q: Quaternion) : Quaternion {
        return this.multiplyQuaternions(q, this);
    }

    // Helper for multiplication
    private multiplyQuaternions(a: Quaternion, b: Quaternion): Quaternion {
        const qax = a.x, qay = a.y, qaz = a.z, qaw = a.w;
        const qbx = b.x, qby = b.y, qbz = b.z, qbw = b.w;

        this.x = qax * qbw + qaw * qbx + qay * qbz - qaz * qby;
        this.y = qay * qbw + qaw * qby + qaz * qbx - qax * qbz;
        this.z = qaz * qbw + qaw * qbz + qax * qby - qay * qbx;
        this.w = qaw * qbw - qax * qbx - qay * qby - qaz * qbz;

        return this;
    }

    // Normalizes the quaternion
    public normalize() : Quaternion {
        let length = Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w);
        if (length === 0) {
            this.identity()
        } else {
            length = 1 / length;
            this.x *= length;
            this.y *= length;
            this.z *= length;
            this.w *= length;
        }
        return this;
    }

    // Assumes order XYZ
    public setFromEuler(x: number, y: number, z: number) : Quaternion {
        const c1 = Math.cos(x / 2);
        const c2 = Math.cos(y / 2);
        const c3 = Math.cos(z / 2);

        const s1 = Math.sin(x / 2);
        const s2 = Math.sin(y / 2);
        const s3 = Math.sin(z / 2);

        // Again assumes order XYZ
        this.x = s1 * c2 * c3 + c1 * s2 * s3;
        this.y = c1 * s2 * c3 - s1 * c2 * s3;
        this.z = c1 * c2 * s3 + s1 * s2 * c3;
        this.w = c1 * c2 * c3 - s1 * s2 * s3;

        return this.normalize();
    }

    public toEuler() : { x:number, y:number, z:number } {
        // Assumes order XYZ

        const x = this.x, y = this.y, z = this.z, w = this.w;
        let pitch = 0, roll = 0, yaw = 0;

        const t0 = 2 * (w * x + y * z);
        const t1 = 1 - 2 * (x * x + y * y);
        pitch = Math.atan2(t0, t1);

        let t2 = 2 * (w * y - z * x);
        t2 > 1 ? t2 = 1 : null;
        t2 < -1 ? t2 = -1 : null;
        roll = Math.asin(t2);

        const t3 = 2 * (w * z + x * y);
        const t4 = 1 - 2 * (y * y + z * z);
        yaw = Math.atan2(t3, t4);

        return { x: pitch, y: roll, z: yaw }
    }
}