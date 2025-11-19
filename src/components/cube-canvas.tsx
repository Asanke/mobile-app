"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

const CubeCanvas = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const leftDoorRef = useRef<THREE.Mesh>();
  const rightDoorRef = useRef<THREE.Mesh>();

  useEffect(() => {
    const currentMount = mountRef.current;
    if (!currentMount) return;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xaaaaaa);

    // Camera
    const camera = new THREE.PerspectiveCamera(
      75,
      currentMount.clientWidth / currentMount.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 1, 2);
    camera.lookAt(0, 0, 0);


    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    currentMount.appendChild(renderer.domElement);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.target.set(0, 0.4, 0);

    // Cabinet materials and dimensions
    const material = new THREE.MeshStandardMaterial({
      color: 0xf0f0f0,
      roughness: 0.5,
      metalness: 0.1,
    });
    const thickness = 0.018; // 18mm
    const cabinetHeight = 0.72;
    const cabinetWidth = 0.8;
    const cabinetDepth = 0.6;
    
    const cabinet = new THREE.Group();
    scene.add(cabinet);

    // Carcase
    const back = new THREE.Mesh(new THREE.BoxGeometry(cabinetWidth, cabinetHeight, thickness), material);
    back.position.set(0, cabinetHeight / 2, -cabinetDepth/2 + thickness/2);
    cabinet.add(back);

    const bottom = new THREE.Mesh(new THREE.BoxGeometry(cabinetWidth, thickness, cabinetDepth), material);
    bottom.position.set(0, thickness/2, 0);
    cabinet.add(bottom);

    const leftSide = new THREE.Mesh(new THREE.BoxGeometry(thickness, cabinetHeight, cabinetDepth), material);
    leftSide.position.set(-cabinetWidth/2 + thickness/2, cabinetHeight/2, 0);
    cabinet.add(leftSide);

    const rightSide = new THREE.Mesh(new THREE.BoxGeometry(thickness, cabinetHeight, cabinetDepth), material);
    rightSide.position.set(cabinetWidth/2 - thickness/2, cabinetHeight/2, 0);
    cabinet.add(rightSide);
    
    const stretcherHeight = 0.1; // 100mm
    const topStretcherFront = new THREE.Mesh(new THREE.BoxGeometry(cabinetWidth - 2 * thickness, thickness, stretcherHeight), material);
    topStretcherFront.position.set(0, cabinetHeight - thickness / 2, cabinetDepth / 2 - stretcherHeight / 2);
    cabinet.add(topStretcherFront);

    const topStretcherBack = new THREE.Mesh(new THREE.BoxGeometry(cabinetWidth - 2 * thickness, thickness, stretcherHeight), material);
    topStretcherBack.position.set(0, cabinetHeight - thickness / 2, -cabinetDepth / 2 + stretcherHeight / 2);
    cabinet.add(topStretcherBack);

    // Shelf
    const shelf = new THREE.Mesh(new THREE.BoxGeometry(cabinetWidth - 2 * thickness, thickness, cabinetDepth - thickness), material);
    shelf.position.set(0, cabinetHeight / 2 - 0.1, 0);
    cabinet.add(shelf);
    

    // Doors
    const doorWidth = (cabinetWidth / 2);
    const doorHeight = cabinetHeight;
    const doorMaterial = new THREE.MeshStandardMaterial({
      color: 0xf0f0f0,
      roughness: 0.5,
      metalness: 0.1,
    });

    const leftDoor = new THREE.Group();
    const leftDoorPanel = new THREE.Mesh(new THREE.BoxGeometry(doorWidth, doorHeight, thickness), doorMaterial);
    leftDoorPanel.position.x = doorWidth / 2;
    leftDoor.add(leftDoorPanel);
    leftDoor.position.set(-cabinetWidth/2, cabinetHeight/2, cabinetDepth/2 - thickness/2);
    cabinet.add(leftDoor);
    leftDoorRef.current = leftDoorPanel;
    leftDoorPanel.userData = { open: false, isOpening: false, isClosing: false, angle: 0, hinge: 'left' };


    const rightDoor = new THREE.Group();
    const rightDoorPanel = new THREE.Mesh(new THREE.BoxGeometry(doorWidth, doorHeight, thickness), doorMaterial);
    rightDoorPanel.position.x = -doorWidth/2;
    rightDoor.add(rightDoorPanel);
    rightDoor.position.set(cabinetWidth/2, cabinetHeight/2, cabinetDepth/2 - thickness/2);
    cabinet.add(rightDoor);
    rightDoorRef.current = rightDoorPanel;
    rightDoorPanel.userData = { open: false, isOpening: false, isClosing: false, angle: 0, hinge: 'right' };

    // Hinges
    const hingeMaterial = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.8, roughness: 0.2 });
    const createHinge = () => {
        const hingeGroup = new THREE.Group();
        const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.01, 16), hingeMaterial);
        cup.rotation.z = Math.PI / 2;
        const arm = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.02, 0.01), hingeMaterial);
        arm.position.set(0.02, 0, 0);
        hingeGroup.add(cup);
        hingeGroup.add(arm);
        return hingeGroup;
    };

    const topHingeRight = createHinge();
    topHingeRight.position.set(-0.02, doorHeight / 2 - 0.1, -thickness/2);
    rightDoorPanel.add(topHingeRight);

    const bottomHingeRight = createHinge();
    bottomHingeRight.position.set(-0.02, -doorHeight / 2 + 0.1, -thickness/2);
    rightDoorPanel.add(bottomHingeRight);
    
    const topHingeLeft = createHinge();
    topHingeLeft.rotation.y = Math.PI;
    topHingeLeft.position.set(0.02, doorHeight / 2 - 0.1, -thickness/2);
    leftDoorPanel.add(topHingeLeft);

    const bottomHingeLeft = createHinge();
    bottomHingeLeft.rotation.y = Math.PI;
    bottomHingeLeft.position.set(0.02, -doorHeight / 2 + 0.1, -thickness/2);
    leftDoorPanel.add(bottomHingeLeft);


    // Legs
    const legHeight = 0.1;
    const legRadius = 0.025;
    const legMaterial = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.9, roughness: 0.1 });
    const createLeg = () => new THREE.Mesh(new THREE.CylinderGeometry(legRadius, legRadius, legHeight, 16), legMaterial);

    const legPositions = [
        new THREE.Vector3(-cabinetWidth / 2 + legRadius, -legHeight / 2, cabinetDepth / 2 - legRadius),
        new THREE.Vector3(cabinetWidth / 2 - legRadius, -legHeight / 2, cabinetDepth / 2 - legRadius),
        new THREE.Vector3(-cabinetWidth / 2 + legRadius, -legHeight / 2, -cabinetDepth / 2 + legRadius),
        new THREE.Vector3(cabinetWidth / 2 - legRadius, -legHeight / 2, -cabinetDepth / 2 + legRadius),
    ];

    legPositions.forEach(pos => {
        const leg = createLeg();
        leg.position.copy(pos);
        cabinet.add(leg);
    });

    cabinet.position.y = legHeight;
    
    // Ground Plane
    const planeGeometry = new THREE.PlaneGeometry(10, 10);
    const planeMaterial = new THREE.ShadowMaterial({ opacity: 0.3 });
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.rotation.x = -Math.PI / 2;
    plane.position.y = 0;
    scene.add(plane);
    
    const grid = new THREE.GridHelper(10, 20, 0xcccccc, 0xcccccc);
    grid.material.opacity = 0.2;
    grid.material.transparent = true;
    scene.add(grid);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(5, 5, 5).normalize();
    scene.add(directionalLight);
    
    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight2.position.set(-5, -5, -5).normalize();
    scene.add(directionalLight2);
    
    const topLight = new THREE.PointLight(0xffffff, 1.5, 10);
    topLight.position.set(0, 1.5, 0);
    scene.add(topLight);
    
    // Raycasting for clicks
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onClick = (event: MouseEvent) => {
        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);

        const intersects = raycaster.intersectObjects([leftDoorPanel, rightDoorPanel]);

        if (intersects.length > 0) {
            const doorPanel = intersects[0].object as THREE.Mesh;
            const doorData = doorPanel.userData;
            if (!doorData.isOpening && !doorData.isClosing) {
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
      const maxAngle = Math.PI / 2 * 0.9;
      
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
      currentMount.removeEventListener('click', onClick);
      cancelAnimationFrame(animationFrameId);
      
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry?.dispose();
          if (Array.isArray(object.material)) {
            object.material.forEach(material => material.dispose());
          } else {
            // Had to check for `material` property existence.
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
