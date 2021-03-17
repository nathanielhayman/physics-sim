
var objects = [];
var leftActive, rightActive, upActive, downActive;

function drawObject(x,y,ob) {
    var canvas = document.getElementById("main-canvas");
    var ctx = canvas.getContext("2d");
    ctx.beginPath()
    ctx.arc(x, y, ob.radius, 0, 2 * Math.PI);
    ctx.stroke();
    var maxv = Math.max(Math.abs(ob.velocity.x*60),Math.abs(ob.velocity.y*60)) 
    ctx.fillStyle = `rgba(187, 67, 67, ${maxv/300})`;
    if (ob.active) {
        ctx.fillStyle = "red";
    }
    ctx.fill();
    if (ob.active) {
        ctx.beginPath();
        ctx.moveTo(x,y);
        ctx.lineTo(x + ob.velocity.x * 15, y + ob.velocity.y * 15);
        ctx.strokeStyle = "black";
        ctx.stroke();   
    }
}

function repeat() {
    var canvas = document.getElementById("main-canvas");
    var ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight)
    requestAnimationFrame(repeat);
    objects.forEach(object => {
        object.iterate();
        object.checkForCollisions()
        drawObject(object.position.x, object.position.y, object);
        
        if (object.active) {
            document.getElementById("position-report").innerHTML = `Position: (${(object.position.x).toFixed(3)},${(object.position.y).toFixed(3)})`;
            document.getElementById("velocity-report").innerHTML = `Velocity: (${(object.velocity.x*60).toFixed(3)},${(object.velocity.y*60).toFixed(3)})`;
            document.getElementById("acceleration-report").innerHTML = `Acceleration: (${(object.acceleration.x*60).toFixed(3)},${(object.acceleration.y*60).toFixed(3)})`;
        }
    })
}
requestAnimationFrame(repeat);

class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}

function computeResultantMotion(ob1, ob2, v1, v2) {
    var thetaTwo =  Math.atan(Math.abs(Math.abs(ob1.position.y) - Math.abs(ob2.position.y))/Math.abs(Math.abs(ob1.position.x) - Math.abs(ob2.position.x)));
    var v2f = v1*Math.cos(thetaTwo);
    var v1f = Math.sqrt(v1**2-v2**2);
    var thetaOne = Math.asin(v2f/v1f*Math.sin(thetaTwo))
    return {v1f, v2f, thetaOne, thetaTwo}
}

function solveQuadratic(v1,a,b,c) {
    var p1 = (b.squared().minusv(c.timesv(a.times(4)))).sqrt()
    one = ( b.times(-1).plusv(p1) ).dividev(a.times(2));
    two = (b.times(-1).minusv(p1)).dividev(a.times(2));
    if (one === v1) {
        return two;
    } else {
        return one;
    }
}

function solveQuadratic2(v1,a,b,c) {
    var p1 = Math.sqrt(Math.pow(b, 2)-4*a*c)
    one = (-b + p1)/(2*a)
    two = (-b - p1)/(2*a)
    if (one === v1) {
        return two;
    } else {
        return one;
    }
}

class PhysObject {

    constructor(i) {
        if (i.radius) {
            this.radius = i.radius;
        } else {
            this.radius = 10;
        }

        if (i.position) {
            this.position = i.position
        } else {
            this.position = new Point(0,0)
        }

        if (i.velocity) {
            this.velocity = i.velocity;
            this.velocity_init = i.velocity;
            this.velocity_eq = i.velocity;
        }

        this.mass = i.mass;

        if (i.acceleration) {
            this.acceleration = i.acceleration; 
        } else {
            this.acceleration = new Point(0,0)
        }

        if (i.active) {
            this.active = true;
        } else {
            this.active = false;
        }

        if (i.forces) {
            i.forces.forEach(force => {
                this.acceleration.x += force.x/this.mass;
                this.acceleration.y += force.y/this.mass;
            })
        }
    }

    addForce(force) {
        this.forces.push(force);
        this.acceleration.x += force.x/this.mass;
        this.acceleration.y += force.y/this.mass;
    }

    checkForCollisions() {
        var distToGround = Math.abs(400 - this.position.y)
        if (distToGround <= this.radius) {
            var depth = this.radius - distToGround;
            this.position.y -= depth;
        }
        if (this.position.x <= this.radius) {
            var depth = this.radius - this.position.x
            this.position.x += depth
        }

        //var thisSlope = this.velocity.y/this.velocity.x;
        //var thisIntercept = this.position.y-(thisSlope*this.position.x);

        objects.forEach(object => {

            //var objectSlope = object.velocity.y/object.velocity.x;
            //var objectIntercept = object.position.y-(objectSlope*object.position.x);
            //if(thisSlope !== objectSlope && objectSlope) {
                //var colX = (objectIntercept - thisIntercept)/(thisIntercept - objectIntercept);
                //var colY = thisSlope*colX+thisIntercept;
                //console.log(colX, colY);
            //}
            
            if (object !== this && !object.active) {
                var deltaX = object.position.x - this.position.x;
                var deltaY = object.position.y - this.position.y;
                var distanceBetween = Math.sqrt(Math.abs(deltaX)**2 + Math.abs(deltaY)**2);
                if (distanceBetween <= this.radius + object.radius) {
                    var depth = this.radius + object.radius - distanceBetween;
                    var factor = depth/distanceBetween;

                    this.position.x -= deltaX*factor;
                    this.position.y -= deltaY*factor;
                    var v1x = this.velocity.x
                    var v1y = this.velocity.y
                    var v2x = object.velocity.x
                    var v2y = object.velocity.y
                    // Our solution technique requires a local v2 = 0, so we will subract v2 from both  objects
                    if (Math.abs(v2x) + Math.abs(v2y) > 0) {
                        v1x -= v2x;
                        v1y -= v2y;
                    }
                    var v1 = Math.sqrt(Math.pow(v1x, 2) + Math.pow(v1y, 2));

                    //Compute rotation angle between canvas x-axis and the v1 vector
                    var thetaR = Math.atan2(v1y,v1x);

                    // Rotate the coordinate system, such that v1, Theta2, and Theta1 are represented in the new local system such that:
                    // v1 is along the positive local x-axis
                    var newDeltax =  Math.cos(thetaR)*deltaX + Math.sin(thetaR)*deltaY;
                    var newDeltay = -Math.sin(thetaR)*deltaX + Math.cos(thetaR)*deltaY;
                    var newDelta  = Math.sqrt(newDeltax*newDeltax+newDeltay*newDeltay)
                    var cosTheta2 = newDeltax / newDelta;
                    var sinTheta2 = newDeltay / newDelta;
                    //var v2 = Math.sqrt(Math.pow(object.velocity.x, 2) + Math.pow(object.velocity.y, 2))
                   // var cosTheta2 = (v1x*deltaX + v1y*deltaY)/(Math.sqrt(Math.pow(deltaX, 2)+Math.pow(deltaY, 2))*v1);
                   // var theta2 = Math.acos( -(v1x*deltaX + v1y*deltaY)/(Math.sqrt(Math.pow(deltaX, 2)+Math.pow(deltaY, 2))*v1) )              

                    var m1 = this.mass;
                    var m2 = object.mass;
                    var v2f = ( (2*m1*m2)/(m1*m2 + m2*m2) ) * v1 * cosTheta2;
                    var v1f = Math.sqrt(Math.pow(v1, 2) - (m2/m1)*Math.pow(v2f, 2));

                    
                    if (v1f === 0) {
                        var sinTheta1 = 0;
                        var cosTheta1 = 1;
                    } else {
                        var sinTheta1 = -(m2*v2f)*sinTheta2/(m1*v1f);
                        var cosTheta1 = (m1*v1 - m2*v2f*cosTheta2)/(m1*v1f)
                    }
                    
                    var v1fx = v1f*( (Math.cos(thetaR)*cosTheta1) - (Math.sin(thetaR)*sinTheta1) );
                    var v2fx = v2f*( (Math.cos(thetaR)*cosTheta2) - (Math.sin(thetaR)*sinTheta2) );
                    var v1fy = v1f*( (Math.sin(thetaR)*cosTheta1) + (Math.cos(thetaR)*sinTheta1) );
                    var v2fy = v2f*( (Math.sin(thetaR)*cosTheta2) + (Math.cos(thetaR)*sinTheta2) );

                    this.velocity.x = v1fx+v2x;
                    this.velocity.y = v1fy+v2y;
                    object.velocity.x = v2fx+v2x;
                    object.velocity.y = v2fy+v2y;
                }
            }
        })
    }

    iterate() {

        if (this.active) {
            if (this.upActive) {
                this.acceleration.y = -0.1
            } 
            
            if (this.downActive) {
                this.acceleration.y = 0.1
            } 
            
            if (this.rightActive) {
                this.acceleration.x = 0.1
            }
            
            if (this.leftActive) {
                this.acceleration.x = -0.1
            }
    
            if (!this.upActive && !this.downActive) {
                this.acceleration.y = 0
            }
    
            if (!this.leftActive && !this.rightActive) {
                this.acceleration.x = 0
            }
        }

        var frictionConstant = 0.02
        this.velocity.x *= 1-frictionConstant
        this.velocity.y *= 1-frictionConstant
        this.position.x += (this.acceleration.x/2 + this.velocity.x)
        this.position.y += (this.acceleration.y/2 + this.velocity.y)
        this.velocity.x += this.acceleration.x;
        this.velocity.y += this.acceleration.y;
    }
}

for (y=1; y<8; y++) {
    for (x=2; x<20; x++) {
        objects.push(new PhysObject({radius: 7, position: new Point(x*50,y*50), velocity: new Point(0,0), acceleration: new Point(0,0), mass: 1, active: false}))
    }
}

const o1 = new PhysObject({radius: 10, position: new Point(0,350), velocity: new Point(0,0), acceleration: new Point(0,0), mass: 10, active: true});
objects.push(o1);

document.addEventListener('keydown', function(e) {

    if (e.defaultPrevented) {
        return
    }

    var o = objects.find(object => object.active === true);

    switch (e.key) {
        case "ArrowUp":
            o.upActive = true;
            e.preventDefault();
            break;
        case "ArrowRight":
            o.rightActive = true;
            e.preventDefault();
            break;
        case "ArrowLeft":
            o.leftActive = true;
            e.preventDefault();
            break;
        case "ArrowDown":
            o.downActive = true;
            e.preventDefault();
            break;
        default:
            return;
    }
});

document.addEventListener('keyup', function(e) {

    if (e.defaultPrevented) {
        return
    }

    var o = objects.find(object => object.active === true);

    switch (e.key) {
        case "ArrowUp":
            o.upActive = false;
            e.preventDefault();
            break;
        case "ArrowRight":
            o.rightActive = false;
            e.preventDefault();
            break;
        case "ArrowLeft":
            o.leftActive = false;
            e.preventDefault();
            break;
        case "ArrowDown":
            o.downActive = false;
            e.preventDefault();
            break;
        default:
            return;
    }
});