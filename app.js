import * as THREE from 'three';
import { DoubleSide } from 'three';
import fragment from './shaders/fragment.glsl'
import vertex from './shaders/vertex.glsl'
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"
import t1 from './img/1.png'
import t2 from './img/2.png'
import mask from './img/particle_mask.png'
import gsap from 'gsap';
import *as dat from  'dat.gui';


export default class Sketch {

    constructor(){
        this.renderer = new THREE.WebGLRenderer( { antialias: true } );
        this.renderer.setSize( window.innerWidth, window.innerHeight );
        document.querySelector('.app').appendChild( this.renderer.domElement );

        this.camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 0.1, 3000 );
        this.camera.position.z = 1000;
        this.scene = new THREE.Scene();


        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.point = new THREE.Vector2();

        this.textures = [
            new THREE.TextureLoader().load(t1),
            new THREE.TextureLoader().load(t2),
        ],

        this.mask = new THREE.TextureLoader().load(mask)


        this.time = 0
        this.move = 0
        // this.controls = new OrbitControls (this.camera, this.renderer.domElement);

        this.settings()

        this.addMesh();

        this.mouseEffect();

        this.render();



    }


    settings(){
        let that = this;
        this.settings = {
            progress: 0,
        };

        this.gui = new dat.GUI();
        this.gui.add(this.settings, "progress", 0, 1, 0.01);
    }


    mouseEffect(){

        this.test = new THREE.Mesh(
            new THREE.PlaneBufferGeometry(2000,2000),
            new THREE.MeshBasicMaterial()
        )


        window.addEventListener('mouseup', e=>{

            gsap.to(this.material.uniforms.mousePressed,{
                duration: 1,
                value: 0,
                ease: "elastic.out(1, 0.3)"
            })

        });

        window.addEventListener('mousedown', e=>{

            gsap.to(this.material.uniforms.mousePressed,{
                duration: 1,
                value:1,
                ease: "elastic.out(1, 0.3)"
            })

        });


        window.addEventListener('mousewheel', e=>{
            this.move += e.wheelDeltaY/4000;
        });

        window.addEventListener( 'mousemove', e =>{

            this.mouse.x = ( e.clientX / window.innerWidth ) * 2 - 1;
            this.mouse.y = - ( e.clientY / window.innerHeight ) * 2 + 1;

            // update the picking ray with the camera and mouse position
            this.raycaster.setFromCamera( this.mouse, this.camera );

            // calculate objects intersecting the picking ray
            let intersects = this.raycaster.intersectObjects( [this.test] );
            this.point.y = intersects[0].point.y
            this.point.x = intersects[0].point.x


        }, false);



    }




    addMesh(){

        // this.material = new THREE.MeshNormalMaterial({side: THREE.DoubleSide});
        this.material = new THREE.ShaderMaterial({
            fragmentShader : fragment,
            vertexShader: vertex,
            uniforms: {
                progress: {type:'f', value:0},
                t1: {type:'t', value: this.textures[0]},          
                t2: {type:'t', value: this.textures[1]},     
                mask: {type:'t', value: this.mask},   
                mousePressed: {type:'f', value: 0},    
                time: {type:'f', value: 0},   
                move: {type:'f', value: 0}, 
                mouse: {type:'v2', value: null}, 
                transition: {type:'f', value: null},
            },

            side :DoubleSide,
            transparent :true,
            depthTest: false,
            depthWrite: false,
        })

        let pixels = 512
        let number = pixels*pixels
        this.geometry = new THREE.BufferGeometry()
        this.positions = new THREE.BufferAttribute(new Float32Array(number*3),3)
        this.coordinates = new THREE.BufferAttribute(new Float32Array(number*3),3)

        this.speeds = new THREE.BufferAttribute(new Float32Array(number),1)
        this.offset = new THREE.BufferAttribute(new Float32Array(number),1)
        this.direction = new THREE.BufferAttribute(new Float32Array(number),1)
        this.press = new THREE.BufferAttribute(new Float32Array(number),1)

        function rand(a,b) {
            return a + (b-a) * Math.random();
        }

        let index = 0

        for (let i = 0; i < pixels; i++) {
            let posX = i - pixels/2
            for (let j = 0; j < pixels; j++) {
                
                this.positions.setXYZ(index,posX,(j - pixels/2),0)
                this.coordinates.setXYZ(index,i,j,0)

                this.offset.setX(index,rand(-1000,1000))
                this.speeds.setX(index,rand(0.4,1))
                this.direction.setX(index,Math.random()>0.5?1:-1)
                this.press.setX(index,rand(0.4,1))
                index++
            }
            
        }

        this.geometry.setAttribute(`position`,this.positions)
        this.geometry.setAttribute(`aCoordinates`,this.coordinates)
        this.geometry.setAttribute(`aOffset`,this.offset)
        this.geometry.setAttribute(`aSpeed`,this.speeds)

        this.geometry.setAttribute(`aDirection`,this.direction)
        this.geometry.setAttribute(`aPress`,this.press)

        this.mesh = new THREE.Points( this.geometry, this.material );
        this.scene.add( this.mesh );


    }

    render(){
        this.time++

        let next = Math.floor(this.move + 40)%2;
        let prev = (Math.floor(this.move) + 1 + 40)%2;

        this.material.uniforms.t1.value = this.textures[prev];
        this.material.uniforms.t2.value = this.textures[next];
        // this.mesh.rotation.x += 0.01;
        // this.mesh.rotation.y += 0.01;


        

        gsap.to(this.material.uniforms.transition,{

            duration: 3,
            value: 1,

        })

        //     this.material.uniforms.transition.value = this.settings.progress;


        this.material.uniforms.time.value = this.time;
        this.material.uniforms.move.value = this.move;
        this.material.uniforms.mouse.value = this.point;
        this.renderer.render( this.scene, this.camera );
        window.requestAnimationFrame(this.render.bind(this));

    }




}



new Sketch()



