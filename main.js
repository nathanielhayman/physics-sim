class Object {
    constructor(init) {
        if (init.position) {
            this.position = init.position
        } else {
            this.position = {x:0,y:0}
        }
        this.forces = JSON;
        if (init.forces) {
            this.forces = init.forces;
        }
        this.velocity = JSON;
        this.velocity.initial = init.velocity;
        this.velocity.current = init.velocity;
        this.velocity.equation = init.velocity;
        this.mass = init.mass;
        if (init.acceleration) {
            this.acceleration = JSON; this.acceleration = init.acceleration; 
        }
    }

    getVelocity(i=null) {
        if (i.acceleration) {
            return this.integrate(acceleration);
        } else if (i.displacement) {
            return this.derivate(displacement);
        } else {
            try {
                return this.velocity.equation;
            } catch (e) {
                return null;
            }
        }
    }

    getAcceleration(i=null) {
        if (i.velocity) {
            return this.derivate(velocity);
        } else {
            try {
                return this.acceleration.equation;
            } catch (e) {
                return null;
            }
        }
    }

    getAllForces() {
        return this.forces;
    }

    integrate(equation) {
        
    }

    addForce(direction, magnitude) {
        this.forces += {direction: direction, magnitude: magnitude};
    }

    getElectrostaticAttraction(o2, distance) {
        return (coulombsConstant*o2.charge*this.charge)/distance**2;
    }

    getGravitationalAttraction(o2, distance) {
        return (gravitationalConstant*o2.mass*this.mass)/distance**2;
    }

    iterate(t) {
        this.position.x += this.acceleration.x*(t**2)/2 + this.velocity.current.x*t
        this.position.y += this.acceleration.y*(t**2)/2 + this.velocity.current.y*t
        this.velocity.current.x += this.acceleration.x*t;
        this.velocity.current.y += this.acceleration.y*t;
        console.log(`(${this.velocity.current.x},${this.velocity.current.y})`)
        console.log(`(${this.position.x},${this.position.y})`)
    }
}

var init = JSON; init.velocity = {x:0,y:5.0}; init.mass = 10; init.acceleration = {x:0,y:-9.8}
var o = new Object(init)
o.iterate(2);