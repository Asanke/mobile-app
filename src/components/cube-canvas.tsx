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
    camera.lookAt(0, 0.7, 0);


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

    // Materials and dimensions
    const woodMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.8,
      metalness: 0.1,
    });
    const edgeMaterial = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2 });
    const screwMaterial = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.8, roughness: 0.5 });
    
    const thickness = 0.018; // 18mm
    const cabinetHeight = 0.72;
    const cabinetWidth = 0.8;
    const cabinetDepth = 0.6;
    
    const cabinet = new THREE.Group();
    scene.add(cabinet);

    const createPanel = (width: number, height: number, depth: number) => {
        const geometry = new THREE.BoxGeometry(width, height, depth);
        const mesh = new THREE.Mesh(geometry, woodMaterial);
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        const edges = new THREE.EdgesGeometry(geometry);
        const line = new THREE.LineSegments(edges, edgeMaterial);
        mesh.add(line);
        
        return mesh;
    }
    
    const createScrew = () => {
        const screw = new THREE.Mesh(new THREE.CylinderGeometry(0.002, 0.002, thickness + 0.001, 8), screwMaterial);
        screw.rotation.x = Math.PI / 2;
        return screw;
    };

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

    // Joinery Screws
    const addScrews = (panel: THREE.Mesh, screwPositions: THREE.Vector3[], axis: 'x' | 'y' | 'z') => {
        screwPositions.forEach(pos => {
            const screw = createScrew();
            if (axis === 'x') screw.rotation.z = Math.PI / 2;
            if (axis === 'y') { /* default is already correct for y-screws into z-face */ }
            if (axis === 'z') screw.rotation.x = 0;
            
            const worldPos = panel.localToWorld(pos.clone());
            const localPos = cabinet.worldToLocal(worldPos);
            screw.position.copy(localPos);

            // This is a bit of a hack, we should add to the right parent.
            // For now, adding to the main cabinet group.
            cabinet.add(screw);
        });
    };
    
    const screwMargin = 0.05; // 50mm from edge
    // Bottom panel to side panels
    addScrews(bottom, [
        new THREE.Vector3(-cabinetWidth/2 + screwMargin, -thickness/2, cabinetDepth/2 - 0.037),
        new THREE.Vector3(-cabinetWidth/2 + screwMargin, -thickness/2, -cabinetDepth/2 + 0.037),
        new THREE.Vector3(cabinetWidth/2 - screwMargin, -thickness/2, cabinetDepth/2 - 0.037),
        new THREE.Vector3(cabinetWidth/2 - screwMargin, -thickness/2, -cabinetDepth/2 + 0.037),
    ], 'y');

    // Top stretchers to side panels
    addScrews(topStretcherFront, [
         new THREE.Vector3(-cabinetWidth/2 + thickness + screwMargin, 0, thickness/2),
         new THREE.Vector3(cabinetWidth/2 - thickness - screwMargin, 0, thickness/2),
    ], 'x');
     addScrews(topStretcherBack, [
         new THREE.Vector3(-cabinetWidth/2 + thickness + screwMargin, 0, thickness/2),
         new THREE.Vector3(cabinetWidth/2 - thickness - screwMargin, 0, thickness/2),
    ], 'x');


    // Shelf
    const shelf = createPanel(cabinetWidth - 2 * thickness, thickness, cabinetDepth - thickness - 0.002);
    shelf.position.set(0, cabinetHeight / 2, -0.001);
    cabinet.add(shelf);
    
    // Doors & Hinges
    const doorGap = 0.0015; // 1.5mm
    const doorWidth = (cabinetWidth - 3 * doorGap) / 2;
    const doorHeight = cabinetHeight - 2 * doorGap;

    const hingeMaterial = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.9, roughness: 0.4 });
    
    const HINGE_PRESET = {
      cupDiameter: 0.035, // 35mm
      cupDepth: 0.012, // 12mm
      K: 0.005, // 5mm setback from door edge to cup edge
      plateRowOffset: 0.037, // 37mm from front edge of cabinet side
    };
    const HINGE_CUP_RADIUS = HINGE_PRESET.cupDiameter / 2;
    const hingeYMargin = 0.1; // 100mm

    const createHingeCup = () => {
        const cupGeometry = new THREE.CylinderGeometry(HINGE_CUP_RADIUS, HINGE_CUP_RADIUS, HINGE_PRESET.cupDepth, 16);
        const cup = new THREE.Mesh(cupGeometry, hingeMaterial);
        cup.rotation.x = Math.PI / 2;
        return cup;
    };
    
    const createHingePlate = () => {
        const plateGeometry = new THREE.BoxGeometry(0.003, 0.05, 0.03);
        const plate = new THREE.Mesh(plateGeometry, hingeMaterial);
        return plate;
    }

    const createDoorAndHinges = (hingeSide: 'left' | 'right') => {
        const isLeft = hingeSide === 'left';
        
        const doorPivot = new THREE.Group();
        const pivotX = isLeft
          ? -cabinetWidth / 2 + doorGap
          : cabinetWidth / 2 - doorGap;
        doorPivot.position.set(pivotX, 0, cabinetDepth / 2);
        cabinet.add(doorPivot);

        const doorPanel = createPanel(doorWidth, doorHeight, thickness);
        doorPanel.userData = { open: false, isOpening: false, isClosing: false, angle: 0, hinge: hingeSide };
        
        const panelX = isLeft ? doorWidth / 2 : -doorWidth / 2;
        doorPanel.position.set(panelX, doorHeight / 2 + doorGap, -thickness / 2);
        doorPivot.add(doorPanel);


        const hingeYPositions = [hingeYMargin, doorHeight - hingeYMargin];
        
        hingeYPositions.forEach(y => {
            const cup = createHingeCup();
            const cupEdgeToCenter = HINGE_PRESET.K + HINGE_CUP_RADIUS;
            
            const cupLocalX = isLeft
                ? -doorWidth / 2 + cupEdgeToCenter
                : doorWidth / 2 - cupEdgeToCenter;

            cup.position.set(cupLocalX, y - (doorHeight/2), -thickness/2 + HINGE_PRESET.cupDepth / 2);
            doorPanel.add(cup);

            const plate = createHingePlate();
            
            const plateX = isLeft ? -cabinetWidth / 2 + thickness / 2 : cabinetWidth / 2 - thickness / 2;
            const plateZ = cabinetDepth/2 - HINGE_PRESET.plateRowOffset;
            
            const plateWorldPos = new THREE.Vector3(plateX, y + doorGap, plateZ);
            const plateLocalPos = cabinet.worldToLocal(plateWorldPos);
            plate.position.copy(plateLocalPos);

            cabinet.add(plate);
        });

        return doorPanel;
    }

    const leftDoorPanel = createDoorAndHinges('left');
    const rightDoorPanel = createDoorAndHinges('right');

    // Legs
    const legHeight = 0.15;
    const legRadius = 0.025;
    const legMaterial = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.9, roughness: 0.2 });
    const createLeg = () => new THREE.Mesh(new THREE.CylinderGeometry(legRadius, legRadius, legHeight, 16), legMaterial);

    const legPositions = [
        new THREE.Vector3(-cabinetWidth / 2 + legRadius * 1.5, -legHeight / 2, cabinetDepth / 2 - legRadius * 1.5),
        new THREE.Vector3(cabinetWidth / 2 - legRadius * 1.5, -legHeight / 2, cabinetDepth / 2 - legRadius * 1.5),
        new THREE.Vector3(-cabinetWidth / 2 + legRadius * 1.5, -legHeight / 2, -cabinetDepth / 2 + legRadius * 1.5),
        new THREE.Vector3(cabinetWidth / 2 - legRadius * 1.5, -legHeight / 2, -cabinetDepth / 2 + legRadius * 1.5),
    ];

    legPositions.forEach(pos => {
        const leg = createLeg();
        leg.position.copy(pos);
        leg.castShadow = true;
        cabinet.add(leg);
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
      const maxAngle = Math.PI * (100 / 180); // ~100 degrees
      
      [leftDoorPanel, rightDoorPanel].forEach(door => {
        const doorData = door.userData;
        const doorGroup = door.parent as THREE.Group;
        const speed = openSpeed;

        const direction = doorData.hinge === 'left' ? -1 : 1;

        if (doorData.isOpening) {
            doorGroup.rotation.y += direction * speed;
            doorData.angle += speed;
            if (doorData.angle >= maxAngle) {
                doorGroup.rotation.y = direction * maxAngle;
                doorData.isOpening = false;
                doorData.open = true;
                doorData.angle = maxAngle;
            }
        } else if (doorData.isClosing) {
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
