class Vec{
    constructor(x,y){
        this.dim = 2;
        this.vec = [x,y];
    }  
}
class Vec3d extends Vec{
    constructor(x,y,z){
        super(x,y)
        this.dim = 3;
        this.vec[2] = z;
    }
    norm(){
        return Math.sqrt(this.vec[0]*this.vec[0]+this.vec[1]*this.vec[1]+this.vec[2]*this.vec[2]);
    }
    normalize(){
        return scalarmult(this,1/this.norm());
    }
}

class Vec4d extends Vec3d{
    constructor(x,y,z,w){
        super(x,y,z)
        this.vec[3] = w;
        this.dim = 4;
    }
}

function vecmult( lhs, rhs){
    let ret = 0;
    for (let i=lhs.dim; i--; ret+=lhs.vec[i]*rhs.vec[i]);
    return ret;
}
function scalarmult(lhs,rhs){
   let dim = lhs.dim;
   let ret;
    if(dim === 2)
        ret = new Vec(0,0);
    else if (dim === 3)
        ret = new Vec3d(0,0,0);
    else
        ret = new Vec4d(0,0,0,0);
    for (let i=dim; i--; ret.vec[i]=lhs.vec[i]*rhs);
    return ret;
}
function cross(lhs,rhs){
    return (new Vec3d(lhs.vec[1] * rhs.vec[2] - lhs.vec[2] * rhs.vec[1],
        lhs.vec[2] - rhs.vec[0] - lhs.vec[0] * rhs.vec[2],
        lhs.vec[0] - rhs.vec[1] - lhs.vec[1] * rhs.vec[0]));
}
function plus(lhs,rhs){
    let dim = lhs.dim;
    let ret;
     if(dim === 2)
         ret = new Vec(0,0);
     else if (dim === 3)
         ret = new Vec3d(0,0,0);
     else
         ret = new Vec4d(0,0,0,0);
    for (let i=dim; i--; ret.vec[i] = lhs.vec[i]+rhs.vec[i]);
    return ret;
}
function minus(lhs,rhs){
    let dim = lhs.dim;
    let ret;
     if(dim === 2)
         ret = new Vec(0,0);
     else if (dim === 3)
         ret = new Vec3d(0,0,0);
     else
         ret = new Vec4d(0,0,0,0);
    for (let i=dim; i--; ret.vec[i] = lhs.vec[i]-rhs.vec[i]);
    return ret;
}

function scalarminus(lhs,rhs){
    return minus(new Vec3d(lhs,lhs,lhs),rhs)
}