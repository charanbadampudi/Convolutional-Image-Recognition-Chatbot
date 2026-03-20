// 3D Background with Three.js
class ThreeBackground {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.particles = null;
        this.animationFrame = null;
        
        this.init();
    }

    init() {
        const canvas = document.getElementById('bgCanvas');
        if (!canvas) return;

        // Scene
        this.scene = new THREE.Scene();
        
        // Camera
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.z = 30;

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ 
            canvas, 
            alpha: true,
            antialias: true 
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        // Lights
        const ambientLight = new THREE.AmbientLight(0x404060);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(1, 1, 1);
        this.scene.add(directionalLight);

        // Create particles
        this.createParticles();
        
        // Create floating shapes
        this.createShapes();
        
        // Start animation
        this.animate();

        // Handle resize
        window.addEventListener('resize', () => this.onResize());
    }

    createParticles() {
        const geometry = new THREE.BufferGeometry();
        const count = 2000;
        
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);

        for (let i = 0; i < count * 3; i += 3) {
            // Positions
            positions[i] = (Math.random() - 0.5) * 100;
            positions[i + 1] = (Math.random() - 0.5) * 100;
            positions[i + 2] = (Math.random() - 0.5) * 100;

            // Colors
            const color = new THREE.Color().setHSL(
                Math.random() * 0.2 + 0.6, // Hue
                0.8, // Saturation
                0.5 + Math.random() * 0.3 // Lightness
            );
            
            colors[i] = color.r;
            colors[i + 1] = color.g;
            colors[i + 2] = color.b;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const material = new THREE.PointsMaterial({
            size: 0.1,
            vertexColors: true,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });

        this.particles = new THREE.Points(geometry, material);
        this.scene.add(this.particles);
    }

    createShapes() {
        // Create floating toruses
        for (let i = 0; i < 3; i++) {
            const geometry = new THREE.TorusGeometry(2, 0.5, 16, 100);
            const material = new THREE.MeshPhongMaterial({
                color: new THREE.Color().setHSL(0.6 + i * 0.1, 0.8, 0.6),
                emissive: new THREE.Color().setHSL(0.6 + i * 0.1, 0.5, 0.1),
                transparent: true,
                opacity: 0.3,
                wireframe: true
            });
            
            const torus = new THREE.Mesh(geometry, material);
            torus.position.x = (i - 1) * 8;
            torus.position.y = Math.sin(i) * 5;
            torus.position.z = -10 - i * 5;
            
            torus.userData = {
                speed: 0.001 + i * 0.001,
                rotationSpeed: 0.001
            };
            
            this.scene.add(torus);
        }

        // Create floating spheres
        for (let i = 0; i < 5; i++) {
            const geometry = new THREE.SphereGeometry(0.5 + i * 0.3, 32, 32);
            const material = new THREE.MeshPhongMaterial({
                color: new THREE.Color().setHSL(0.7 + i * 0.05, 0.9, 0.5),
                emissive: new THREE.Color().setHSL(0.7 + i * 0.05, 0.5, 0.1),
                transparent: true,
                opacity: 0.2
            });
            
            const sphere = new THREE.Mesh(geometry, material);
            sphere.position.x = Math.sin(i * 2) * 15;
            sphere.position.y = Math.cos(i * 2) * 10;
            sphere.position.z = -15 - i * 3;
            
            sphere.userData = {
                speed: 0.002,
                offset: i
            };
            
            this.scene.add(sphere);
        }
    }

    animate() {
        this.animationFrame = requestAnimationFrame(() => this.animate());

        // Rotate particles
        if (this.particles) {
            this.particles.rotation.y += 0.0002;
            this.particles.rotation.x += 0.0001;
        }

        // Animate shapes
        this.scene.children.forEach(child => {
            if (child.isMesh) {
                if (child.geometry.type === 'TorusGeometry') {
                    child.rotation.x += 0.01;
                    child.rotation.y += 0.005;
                    
                    child.position.y += Math.sin(Date.now() * child.userData.speed) * 0.01;
                }
                
                if (child.geometry.type === 'SphereGeometry') {
                    child.position.x += Math.sin(Date.now() * 0.001 + child.userData.offset) * 0.02;
                    child.position.y += Math.cos(Date.now() * 0.001 + child.userData.offset) * 0.02;
                }
            }
        });

        this.renderer.render(this.scene, this.camera);
    }

    onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    destroy() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
        
        window.removeEventListener('resize', this.onResize);
        
        // Cleanup Three.js resources
        this.scene.traverse(object => {
            if (object.geometry) object.geometry.dispose();
            if (object.material) {
                if (Array.isArray(object.material)) {
                    object.material.forEach(m => m.dispose());
                } else {
                    object.material.dispose();
                }
            }
        });
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ThreeBackground();
});