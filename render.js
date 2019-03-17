var c = document.getElementById("myCanvas");
var ctx = c.getContext("2d");
ctx.imageSmoothingEnabled = true;
var framebuffer = [];
var width = 1024;
var height = 768;
const fov      = Math.PI/3.;
const maxrecur = 4;
var camera = new Vec3d(0,0,0);
class Material {
	constructor(albedo, color, spec){
		this.diffuseColor = color; //Vec3d
		this.albedo = albedo; //Vec3d
		this.specularExponent = spec; //float
	}
}

class Light {
	constructor(position, intensity){
		this.position = position;
		this.intensity = intensity;
	}
}
class Obj{
	constructor(material){
		this.material=material;
	}
}
class Triangle extends Obj{
constructor(v1,v2,v3,material){
	super(material);
	this.center = v2;
	this.v1=v1;
	this.v2=v2;
	this.v3=v3;
}
	rayIntersect(orig,dir){
		let e1 = minus(this.v2, this.v1);
		let e2 = minus(this.v3, this.v1);
		let h = cross(dir,e2)
		let a = vecmult(e1,h);
		if (a > -0.00001 && a < 0.00001)	return [false,null];
		let f = 1/a;
		let s = minus(orig,this.v1);
		let u = f * vecmult(s,h);
		if (u < 0.0 || u > 1.0) 	return [false,null];
		let q = cross(s,e1);
		let v = f * vecmult(dir,q);
		if (v < 0.0 || u + v > 1.0) 	return [false,null];
		let t = f * vecmult(e2,q);
		if (t > 0.0001) return([true,t]);
		else 
			return [false,null];
	}
}
class Sphere extends Obj{

constructor(center,radius, material){
	super(material);
	this.center=center;
	this.radius=radius;
}

rayIntersect(orig,dir) {
		let L = minus(this.center, orig); //center-orig
		let tca = vecmult(L,dir); //L*dir
		let d2 = vecmult(L,L) - tca*tca; // L*L - tca*tca
		if (d2 > this.radius*this.radius) return [false, null];
		let thc = Math.sqrt(this.radius*this.radius - d2);
		let t0       = tca - thc;
		let t1 = tca + thc;
		if (t0 < 0) t0 = t1;
		if (t0 < 0) return [false, null];
		return [true, t0];
    }
}
function reflect(I, N) {
	return minus(I, scalarmult(scalarmult(N,2),vecmult(I,N)));
}
function scenceIntersect(orig,dir,spheres){
	var N, hit, material, spheres_dist = 1000;
    for (let i=0;i<spheres.length;++i) {
				let [intersects, dist_i] = spheres[i].rayIntersect(orig, dir);
        if (intersects  && dist_i <= spheres_dist) {
            spheres_dist = dist_i;
						hit = plus(orig, scalarmult(dir,dist_i));
            N = (minus(hit, spheres[i].center)).normalize();
						material = spheres[i].material;	
				}
		}
		return [spheres_dist < 1000, hit, N, material];
	}
function castRay(orig,dir,spheres, lights, depth=0){
	
	let [intersects,point,N,material] = scenceIntersect(orig, dir, spheres);
	if (depth > maxrecur || !intersects) {
		return (new Vec3d(0, 0, 0)); // background color
	}

	let reflect_dir = reflect(dir, N).normalize();
	let reflect_orig = vecmult(reflect_dir, N) < 0 ? minus(point, scalarmult(N,0.001)) : plus(point, scalarmult(N,0.001));
	let reflect_color = castRay(reflect_orig, reflect_dir, spheres, lights, depth + 1);


	let diffuse_light_intensity = 0, specular_light_intensity = 0;
	for (let i=0; i<lights.length; ++i) {
			let light_dir      = (minus(lights[i].position, point)).normalize();
			let light_distance = (minus(lights[i].position, point)).norm();
			let shadow_orig = vecmult(light_dir,N) < 0 ? minus(point,scalarmult(N,0.001)) : plus(point,scalarmult(N,0.001));
			let [shadow_intersects, shadow_point ,shadow_N , shadow_material] = scenceIntersect(shadow_orig, light_dir, spheres);
      if (shadow_intersects && (minus(shadow_point, shadow_orig)).norm() < light_distance)
          continue;
			diffuse_light_intensity  += Math.max(0, vecmult(light_dir,N))*lights[i].intensity;
			specular_light_intensity += Math.pow(Math.max(0, -vecmult(reflect(minus(new Vec3d(0,0,0),light_dir), N),dir)), material.specularExponent)*lights[i].intensity;
		}
	

return plus(
			scalarmult(material.diffuseColor, diffuse_light_intensity*material.albedo.vec[0]) , 
			plus(
			scalarmult(new Vec3d(1,1,1), specular_light_intensity*material.albedo.vec[1]),
			scalarmult(reflect_color, material.albedo.vec[2])
			)
			);
}

function draw(){
	console.time("drawing");

var imageData = ctx.getImageData(0, 0, width, height);
	var buf = new ArrayBuffer(imageData.data.length);
	var buf8 = new Uint8ClampedArray(buf);
	var data = new Uint32Array(buf);

	for (var y = 0; y < height; ++y) {
    for (var x = 0; x < width; ++x) {
        data[y * width + x] =
            (255   << 24) |    // alpha
						((Math.min(1,framebuffer[x][y].vec[2])*255) << 16) |    // blue
						((Math.min(1,framebuffer[x][y].vec[1])*255) << 8) |    // green
						(Math.min(1,framebuffer[x][y].vec[0])*255) ;            // red
		}}
		imageData.data.set(buf8);

ctx.putImageData(imageData, 0, 0);

		console.timeEnd("drawing");
}
function render(spheres,lights){
	console.time("rendering")
	for(let i = 0; i<width; ++i){
		for(let j = 0; j< height; ++j){
			let x =  (2*(i + 0.5)/width  - 1)*Math.tan(fov/2.)*width/height;
			let y = -(2*(j + 0.5)/height - 1)*Math.tan(fov/2.);
			framebuffer[i][j] = castRay(camera, (new Vec3d(x, y, -1)).normalize(), spheres, lights);
		}
	}
	console.timeEnd("rendering");
}
function init(){
	for(let i=0;i<width;i++) {
		framebuffer[i] = [];
	for(let j=0;j<height;j++) {
			framebuffer[i][j] = (new Vec3d(0,0,0));
		}
	}
}

var rightPressed = false;
var leftPressed = false;
var upPressed = false;
var downPressed = false;
function demo(){
	document.addEventListener('keydown', keyDownHandler, false);
document.addEventListener('keyup', keyUpHandler, false);
window.requestAnimationFrame(step);
}
function keyDownHandler(event) {
	if(event.keyCode == 39) {
			rightPressed = true;
	}
	else if(event.keyCode == 37) {
			leftPressed = true;
	}
	if(event.keyCode == 40) {
		downPressed = true;
	}
	else if(event.keyCode == 38) {
		upPressed = true;
	}
}
function step(){
	if(rightPressed) camera.vec[0] += 5;
	else if(leftPressed) camera.vec[0] -= 5;
	else if(upPressed) camera.vec[2] -= 5;
	else if(downPressed) camera.vec[2] += 5;
	else 	{
		window.requestAnimationFrame(step);
		return;
	}
	render(spheres,lights);
	draw();
 	window.requestAnimationFrame(step);
}
function keyUpHandler(event) {
	if(event.keyCode == 39) {
			rightPressed = false;
	}
	else if(event.keyCode == 37) {
			leftPressed = false;
	}
	if(event.keyCode == 40) {
		downPressed = false;
	}
	else if(event.keyCode == 38) {
		upPressed = false;
	}
}


let ivory = new Material(new Vec3d(0.6,  0.3, 0.1), new Vec3d(0.4, 0.4, 0.3),   50.);
let red_rubber = new Material(new Vec3d(0.9,  0.1, 0), new Vec3d(0.3, 0.1, 0.1),   10.);
let mirror = new Material(new Vec3d(0.,10,0.8), new Vec3d(1,1,1),1425.);
let lights = [];
let spheres = [];
lights.push(new Light(new Vec3d(-20, 20,  20), 1.5));
lights.push(new Light(new Vec3d( 30, 50, -25), 1.8));
lights.push(new Light(new Vec3d( 30, 20,  30), 1.7));
spheres.push(new Sphere(new Vec3d( 1.5, -0.5, -18), 3, red_rubber));
spheres.push(new Sphere(new Vec3d(-1.0, -1.5, -12), 2, mirror));
spheres.push(new Sphere(new Vec3d(-3,    0,   -16), 2,      ivory));
spheres.push(new Sphere(new Vec3d( 7,    5,   -18), 4,      mirror));
spheres.push(new Triangle(new Vec3d( 1, -0.5, -12),new Vec3d( 3, 4.5, -12),new Vec3d( 6, -0.5, -12), red_rubber))
init();
render(spheres,lights);
draw();