import * as THREE from 'three';

export class SceneManager {
    constructor(canvasContainer) {
        this.container = canvasContainer;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.tree = null;
        this.snowSystem = null;
        this.lights = [];
        this.clock = new THREE.Clock();
        this.mouseX = 0;
        this.mouseY = 0;
        
        this.init();
    }

    init() {
        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0a192f);
        this.scene.fog = new THREE.FogExp2(0x0a192f, 0.002); // Fog for depth

        // Camera
        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 15, 30);
        this.camera.lookAt(0, 10, 0);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit pixel ratio for performance
        this.renderer.shadowMap.enabled = true;
        this.container.appendChild(this.renderer.domElement);

        // Lighting
        const ambientLight = new THREE.AmbientLight(0x404040, 0.5); // Soft white light
        this.scene.add(ambientLight);

        // Moonlight
        const dirLight = new THREE.DirectionalLight(0xb0c4de, 0.6); 
        dirLight.position.set(10, 20, 10);
        dirLight.castShadow = true;
        this.scene.add(dirLight);
        
        // Warm spotlight on tree to highlight it
        const spotLight = new THREE.SpotLight(0xffaa00, 0.8);
        spotLight.position.set(0, 30, 20);
        spotLight.lookAt(0, 5, 0);
        spotLight.angle = Math.PI / 4;
        spotLight.penumbra = 0.5;
        this.scene.add(spotLight);

        // Objects
        this.createGround();
        this.createTree();
        this.createSnow();

        // Event Listeners
        window.addEventListener('resize', this.onWindowResize.bind(this));
        document.addEventListener('mousemove', this.onMouseMove.bind(this));

        // Start Loop
        this.animate();
    }

    createGround() {
        const geometry = new THREE.PlaneGeometry(200, 200);
        const material = new THREE.MeshStandardMaterial({ 
            color: 0xe0f7fa, // Icy white
            roughness: 0.8,
            metalness: 0.1
        });
        const ground = new THREE.Mesh(geometry, material);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);
    }

    createTree() {
        this.tree = new THREE.Group();

        // Leaves Materials
        const leaveMaterial = new THREE.MeshStandardMaterial({ color: 0x2d5a27, roughness: 0.8 });

        // Tree Levels (Cones)
        const levels = [
            { radius: 6, height: 8, y: 4 },
            { radius: 5, height: 7, y: 8 },
            { radius: 4, height: 6, y: 11.5 },
            { radius: 3, height: 5, y: 14.5 }
        ];

        levels.forEach(level => {
            const geometry = new THREE.ConeGeometry(level.radius, level.height, 16);
            const mesh = new THREE.Mesh(geometry, leaveMaterial);
            mesh.position.y = level.y;
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            this.tree.add(mesh);

            // Add decorations per level
            this.addDecorations(mesh, level.radius, level.height);
        });

        // Trunk
        const trunkGeo = new THREE.CylinderGeometry(1.5, 1.5, 6, 8);
        const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4a3728 });
        const trunk = new THREE.Mesh(trunkGeo, trunkMat);
        trunk.position.y = 3;
        trunk.castShadow = true;
        this.tree.add(trunk);

        // Star topper
        this.createStar();

        this.scene.add(this.tree);
    }

    addDecorations(coneMesh, coneRadius, coneHeight) {
        // Add Baubles randomly
        const baubleCount = 18;
        const baubleGeo = new THREE.SphereGeometry(0.28, 16, 16);
        const baubleColors = [0xd32f2f, 0xffd700, 0xc0c0c0, 0xffffff]; // Red, Gold, Silver, White

        for (let i = 0; i < baubleCount; i++) {
            const mat = new THREE.MeshStandardMaterial({
                color: baubleColors[Math.floor(Math.random() * baubleColors.length)],
                roughness: 0.1,
                metalness: 0.9
            });
            const bauble = new THREE.Mesh(baubleGeo, mat);

            // Angle around the cone
            const angle = Math.random() * Math.PI * 2;
            
            // Random Y position in local cone coords [-height/2, height/2]
            const yOffset = (Math.random() - 0.5) * coneHeight * 0.9;
            
            // Cone Radius at this Y:
            const ratio = (coneHeight / 2 - yOffset) / coneHeight;
            // Radius of the cone surface at this height
            const radiusAtY = coneRadius * ratio;

            // Place ON the surface, plus a tiny bit
            const r = radiusAtY + 0.15; 

            bauble.position.set(
                Math.cos(angle) * r,
                yOffset,
                Math.sin(angle) * r
            );
            
            coneMesh.add(bauble);
        }

        // Add Lights
        const lightCount = 12;
        const lightGeo = new THREE.SphereGeometry(0.12, 8, 8);
        for (let i = 0; i < lightCount; i++) {
            const color = 0xffffcc; // Warm white
            const mat = new THREE.MeshStandardMaterial({ 
                color: color, 
                emissive: 0xffaa00,
                emissiveIntensity: 1
            });
            const lightMesh = new THREE.Mesh(lightGeo, mat);
            
            const angle = Math.random() * Math.PI * 2;
            const yOffset = (Math.random() - 0.5) * coneHeight * 0.8;
            
            const ratio = (coneHeight / 2 - yOffset) / coneHeight;
            const radiusAtY = coneRadius * ratio;
            
            // Lights sit on the surface
            const r = radiusAtY + 0.1;

            lightMesh.position.set(Math.cos(angle) * r, yOffset, Math.sin(angle) * r);
            
            // Actual PointLight
            const pointLight = new THREE.PointLight(0xffaa00, 0.6, 2.5);
            pointLight.position.copy(lightMesh.position);
            
            coneMesh.add(lightMesh);
            coneMesh.add(pointLight);
            
            this.lights.push({ mesh: lightMesh, light: pointLight, initialIntensity: 1, speed: Math.random() * 2 + 1 });
        }
    }

    createStar() {
        const starShape = new THREE.Shape();
        const points = 5;
        const outerRadius = 1.8;
        const innerRadius = 0.9;

        for (let i = 0; i < points * 2; i++) {
            const angle = (i * Math.PI) / points;
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            if (i === 0) starShape.moveTo(x, y);
            else starShape.lineTo(x, y);
        }
        starShape.closePath();

        const geometry = new THREE.ExtrudeGeometry(starShape, {
            depth: 0.5,
            bevelEnabled: true,
            bevelThickness: 0.1,
            bevelSize: 0.1,
            bevelSegments: 2
        });
        
        geometry.center();

        const material = new THREE.MeshStandardMaterial({
            color: 0xffd700,
            emissive: 0xffd700,
            emissiveIntensity: 0.6,
            roughness: 0.1,
            metalness: 0.8
        });
        
        const star = new THREE.Mesh(geometry, material);
        star.position.y = 17.8;
        star.rotation.z = Math.PI / 10;
        
        const light = new THREE.PointLight(0xffd700, 2, 12);
        light.position.set(0, 0, 0.5);
        star.add(light);

        this.tree.add(star);
    }

    createSnow() {
        const particleCount = 1500; // Optimized for performance
        const geometry = new THREE.BufferGeometry();
        const positions = [];
        const velocities = [];

        for (let i = 0; i < particleCount; i++) {
            positions.push(
                Math.random() * 100 - 50, // x
                Math.random() * 60,       // y
                Math.random() * 100 - 50  // z
            );
            velocities.push(
                (Math.random() - 0.5) * 0.05, // x velocity
                -(Math.random() * 0.05 + 0.05), // y velocity (falling)
                (Math.random() - 0.5) * 0.05  // z velocity
            );
        }

        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        
        const material = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.3,
            transparent: true,
            opacity: 0.8
        });

        this.snowSystem = new THREE.Points(geometry, material);
        this.snowSystem.userData = { velocities: velocities };
        this.scene.add(this.snowSystem);
    }

    onMouseMove(event) {
        this.mouseX = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));
        
        const time = this.clock.getElapsedTime();

        if (this.tree) {
            this.tree.rotation.y += 0.002;
        }

        this.lights.forEach(l => {
            const intensity = 0.5 + Math.sin(time * l.speed) * 0.5; 
            l.light.intensity = intensity;
            l.mesh.material.emissiveIntensity = intensity;
        });

        if (this.snowSystem) {
            const positions = this.snowSystem.geometry.attributes.position.array;
            const velocities = this.snowSystem.userData.velocities;

            for (let i = 0; i < positions.length; i += 3) {
                positions[i] += velocities[i/3 * 3];     
                positions[i+1] += velocities[i/3 * 3 + 1]; 
                positions[i+2] += velocities[i/3 * 3 + 2]; 

                if (positions[i+1] < 0) {
                    positions[i+1] = 60;
                    positions[i] = Math.random() * 100 - 50;
                    positions[i+2] = Math.random() * 100 - 50;
                }
            }
            this.snowSystem.geometry.attributes.position.needsUpdate = true;
        }

        const targetX = this.mouseX * 2;
        const targetY = this.mouseY * 1 + 15;
        
        this.camera.position.x += (targetX - this.camera.position.x) * 0.05;
        this.camera.position.y += (targetY - this.camera.position.y) * 0.05;
        this.camera.lookAt(0, 10, 0);

        this.renderer.render(this.scene, this.camera);
    }
}
