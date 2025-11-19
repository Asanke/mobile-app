"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

const CubeCanvas = () => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const currentMount = mountRef.current;
    if (!currentMount) return;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);

    // Camera
    const camera = new THREE.PerspectiveCamera(
      75,
      currentMount.clientWidth / currentMount.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 1, 2.5);
    camera.lookAt(0, 0.5, 0);


    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    currentMount.appendChild(renderer.domElement);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.target.set(0, 0.7, 0);

    // Cabinet materials and dimensions
    const woodMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.8,
      metalness: 0.1,
    });
    const thickness = 0.018; // 18mm
    const cabinetHeight = 0.72;
    const cabinetWidth = 0.8;
    const cabinetDepth = 0.6;
    
    const cabinet = new THREE.Group();
    scene.add(cabinet);

    const createPanel = (width: number, height: number, depth: number) => {
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), woodMaterial);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        return mesh;
    }

    // Carcase
    const back = createPanel(cabinetWidth, cabinetHeight, thickness);
    back.position.set(0, cabinetHeight / 2, -cabinetDepth/2 + thickness/2);
    cabinet.add(back);

    const bottom = createPanel(cabinetWidth, thickness, cabinetDepth);
    bottom.position.set(0, thickness/2, 0);
    cabinet.add(bottom);

    const leftSide = createPanel(thickness, cabinetHeight, cabinetDepth);
    leftSide.position.set(-cabinetWidth/2 + thickness/2, cabinetHeight/2, 0);
    cabinet.add(leftSide);

    const rightSide = createPanel(thickness, cabinetHeight, cabinetDepth);
    rightSide.position.set(cabinetWidth/2 - thickness/2, cabinetHeight/2, 0);
    cabinet.add(rightSide);
    
    const stretcherWidth = 0.1; // 100mm
    const topStretcherFront = createPanel(cabinetWidth - 2 * thickness, thickness, stretcherWidth);
    topStretcherFront.position.set(0, cabinetHeight - thickness / 2, cabinetDepth / 2 - stretcherWidth / 2);
    cabinet.add(topStretcherFront);

    const topStretcherBack = createPanel(cabinetWidth - 2 * thickness, thickness, stretcherWidth);
    topStretcherBack.position.set(0, cabinetHeight - thickness / 2, -cabinetDepth / 2 + stretcherWidth / 2);
    cabinet.add(topStretcherBack);

    // Shelf
    const shelf = createPanel(cabinetWidth - 2 * thickness, thickness, cabinetDepth - thickness);
    shelf.position.set(0, cabinetHeight / 2, 0);
    cabinet.add(shelf);
    
    // Doors
    const doorGap = 0.002;
    const doorWidth = (cabinetWidth / 2) - doorGap;
    const doorHeight = cabinetHeight - (2 * doorGap);
    
    const doorMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.8,
      metalness: 0.1,
    });

    // Hinges
    const hingeMaterial = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.9, roughness: 0.4 });
    const hingeOffsetFromEdge = 0.1; // 100mm from top/bottom
    const cupRadius = 0.035 / 2; // 35mm diameter
    const cupDepth = 0.012; // 12mm deep

    const createHingeCup = () => {
        const cup = new THREE.Mesh(new THREE.CylinderGeometry(cupRadius, cupRadius, cupDepth, 16), hingeMaterial);
        cup.rotation.x = Math.PI / 2;
        return cup;
    };

    const createHingePlate = () => {
        const plateGroup = new THREE.Group();
        const plate = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.06, 0.03), hingeMaterial);
        plate.position.set(0, 0, 0.015);
        plateGroup.add(plate);

        const arm = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.05, 0.02), hingeMaterial);
        arm.position.set(0.0125 + thickness/2, 0, 0.01);
        plateGroup.add(arm);
        return plateGroup;
    }
    
    // Left Door
    const leftDoorPanel = createPanel(doorWidth, doorHeight, thickness);
    const leftDoor = new THREE.Group();
    leftDoor.add(leftDoorPanel);
    
    // Position the group (pivot) at the hinge line
    leftDoor.position.set(-cabinetWidth / 2 + thickness, 0, cabinetDepth / 2 - thickness);
    cabinet.add(leftDoor);

    // Position the panel relative to the pivot
    leftDoorPanel.position.set(doorWidth / 2, doorHeight/2, 0);
    leftDoorPanel.userData = { open: false, isOpening: false, isClosing: false, angle: 0, hinge: 'left' };

    // Add hinge cups to left door
    const leftTopCup = createHingeCup();
    leftTopCup.position.set(0.025, doorHeight / 2 - hingeOffsetFromEdge, -thickness/2);
    leftDoorPanel.add(leftTopCup);
    const leftBottomCup = createHingeCup();
    leftBottomCup.position.set(0.025, -doorHeight / 2 + hingeOffsetFromEdge, -thickness/2);
    leftDoorPanel.add(leftBottomCup);
    
    // Add hinge plates to left side panel
    const leftTopPlate = createHingePlate();
    leftTopPlate.position.set(-cabinetWidth/2, doorHeight - hingeOffsetFromEdge, cabinetDepth/2 - thickness);
    cabinet.add(leftTopPlate);
    const leftBottomPlate = createHingePlate();
    leftBottomPlate.position.set(-cabinetWidth/2, hingeOffsetFromEdge, cabinetDepth/2 - thickness);
    cabinet.add(leftBottomPlate);


    // Right Door
    const rightDoorPanel = createPanel(doorWidth, doorHeight, thickness);
    const rightDoor = new THREE.Group();
    rightDoor.add(rightDoorPanel);

    // Position the group (pivot) at the hinge line
    rightDoor.position.set(cabinetWidth / 2 - thickness, 0, cabinetDepth / 2 - thickness);
    cabinet.add(rightDoor);

    // Position the panel relative to the pivot
    rightDoorPanel.position.set(-doorWidth / 2, doorHeight / 2, 0);
    rightDoorPanel.userData = { open: false, isOpening: false, isClosing: false, angle: 0, hinge: 'right' };

    // Add hinge cups to right door
    const rightTopCup = createHingeCup();
    rightTopCup.position.set(-0.025, doorHeight / 2 - hingeOffsetFromEdge, -thickness/2);
    rightDoorPanel.add(rightTopCup);
    const rightBottomCup = createHingeCup();
    rightBottomCup.position.set(-0.025, -doorHeight / 2 + hingeOffsetFromEdge, -thickness/2);
    rightDoorPanel.add(rightBottomCup);

    // Add hinge plates to right side panel
    const rightTopPlate = createHingePlate();
    rightTopPlate.rotation.y = Math.PI;
    rightTopPlate.position.set(cabinetWidth/2, doorHeight - hingeOffsetFromEdge, cabinetDepth/2 - thickness);
    cabinet.add(rightTopPlate);
    const rightBottomPlate = createHingePlate();
    rightBottomPlate.rotation.y = Math.PI;
    rightBottomPlate.position.set(cabinetWidth/2, hingeOffsetFromEdge, cabinetDepth/2-thickness);
    cabinet.add(rightBottomPlate);


    // Legs
    const legHeight = 0.15;
    const legRadius = 0.025;
    const legMaterial = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.9, roughness: 0.2 });
    const createLeg = () => new THREE.Mesh(new THREE.CylinderGeometry(legRadius, legRadius, legHeight, 16), legMaterial);

    const legPositions = [
        new THREE.Vector3(-cabinetWidth / 2 + legRadius * 1.5, legHeight / 2, cabinetDepth / 2 - legRadius * 1.5),
        new THREE.Vector3(cabinetWidth / 2 - legRadius * 1.5, legHeight / 2, cabinetDepth / 2 - legRadius * 1.5),
        new THREE.Vector3(-cabinetWidth / 2 + legRadius * 1.5, legHeight / 2, -cabinetDepth / 2 + legRadius * 1.5),
        new THREE.Vector3(cabinetWidth / 2 - legRadius * 1.5, legHeight / 2, -cabinetDepth / 2 + legRadius * 1.5),
    ];

    legPositions.forEach(pos => {
        const leg = createLeg();
        leg.position.copy(pos);
        leg.castShadow = true;
        scene.add(leg); // Add legs directly to the scene
    });

    cabinet.position.y = legHeight;
    
    // Ground Plane
    const planeGeometry = new THREE.PlaneGeometry(10, 10);
    const planeMaterial = new THREE.ShadowMaterial({ opacity: 0.3 });
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.rotation.x = -Math.PI / 2;
    plane.position.y = 0;
    plane.receiveShadow = true;
    scene.add(plane);
    
    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(3, 4, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 15;
    scene.add(directionalLight);
    
    const topLight = new THREE.PointLight(0xffffff, 0.8, 10);
    topLight.position.set(0, cabinetHeight + legHeight + 0.5, 0);
    scene.add(topLight);
    
    // Raycasting for clicks
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onClick = (event: MouseEvent) => {
        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);

        const intersects = raycaster.intersectObjects([leftDoorPanel, rightDoorPanel], true);

        if (intersects.length > 0) {
            let doorPanel = intersects[0].object;
            // Traverse up to find the panel with the user data
            while (doorPanel.parent && !doorPanel.userData.hinge) {
                doorPanel = doorPanel.parent;
            }

            const doorData = doorPanel.userData;

            if (doorData.hinge && !doorData.isOpening && !doorData.isClosing) {
                if (doorData.open) {
                    doorData.isClosing = true;
                } else {
                    doorData.isOpening = true;
                }
            }
        }
    };
    
    currentMount.addEventListener('click', onClick);


    // Animation loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const openSpeed = 0.05;
      const maxAngle = Math.PI * 0.55; // ~100 degrees
      
      [leftDoorPanel, rightDoorPanel].forEach(door => {
        const doorData = door.userData;
        const doorGroup = door.parent as THREE.Group;
        const speed = openSpeed;

        if (doorData.isOpening) {
            const direction = doorData.hinge === 'left' ? 1 : -1;
            doorGroup.rotation.y += direction * speed;
            doorData.angle += speed;
            if (doorData.angle >= maxAngle) {
                doorGroup.rotation.y = direction * maxAngle;
                doorData.isOpening = false;
                doorData.open = true;
                doorData.angle = maxAngle;
            }
        } else if (doorData.isClosing) {
            const direction = doorData.hinge === 'left' ? 1 : -1;
            doorGroup.rotation.y -= direction * speed;
            doorData.angle -= speed;
            if (doorData.angle <= 0) {
                doorGroup.rotation.y = 0;
                doorData.isClosing = false;
                doorData.open = false;
                doorData.angle = 0;
            }
        }
      });

      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    // Handle resize
    const handleResize = () => {
      if (!currentMount) return;
      const width = currentMount.clientWidth;
      const height = currentMount.clientHeight;

      camera.aspect = width / height;
      camera.updateProjectionMatrix();

      renderer.setSize(width, height);
    };

    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      if (currentMount) {
        currentMount.removeEventListener('click', onClick);
      }
      cancelAnimationFrame(animationFrameId);
      
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry?.dispose();
          if (Array.isArray(object.material)) {
            object.material.forEach(material => material.dispose());
          } else {
            if (object.material) {
              object.material.dispose();
            }
          }
        }
      });
      
      controls.dispose();
      renderer.dispose();
      
      if (currentMount && renderer.domElement) {
        currentMount.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={mountRef} className="w-full h-full" />;
};

export default CubeCanvas;

    