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
    const backPanelThickness = 0.006; // 6mm
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
        const screwGeo = new THREE.CylinderGeometry(0.0025, 0.0025, thickness + 0.001, 8);
        const screw = new THREE.Mesh(screwGeo, screwMaterial);
        return screw;
    };
    
    // Carcase Construction
    const backGroove = 0.005;

    // Bottom panel (full width and depth)
    const bottom = createPanel(cabinetWidth, thickness, cabinetDepth);
    bottom.position.set(0, thickness / 2, 0);
    cabinet.add(bottom);
    
    // Side panels (sit on top of the bottom panel)
    const sidePanelHeight = cabinetHeight - thickness;
    const leftSide = createPanel(thickness, sidePanelHeight, cabinetDepth);
    leftSide.position.set(-cabinetWidth / 2 + thickness / 2, sidePanelHeight / 2 + thickness, 0);
    cabinet.add(leftSide);

    const rightSide = createPanel(thickness, sidePanelHeight, cabinetDepth);
    rightSide.position.set(cabinetWidth / 2 - thickness / 2, sidePanelHeight / 2 + thickness, 0);
    cabinet.add(rightSide);
    
    // Top stretchers (between side panels)
    const stretcherWidth = 0.1; // 100mm
    const stretcherLength = cabinetWidth - 2 * thickness;
    const topStretcherFront = createPanel(stretcherLength, thickness, stretcherWidth);
    topStretcherFront.position.set(0, cabinetHeight - thickness / 2, cabinetDepth / 2 - stretcherWidth / 2);
    cabinet.add(topStretcherFront);

    const topStretcherBack = createPanel(stretcherLength, thickness, stretcherWidth);
    topStretcherBack.position.set(0, cabinetHeight - thickness / 2, -cabinetDepth/2 + backPanelThickness + backGroove + stretcherWidth / 2);
    cabinet.add(topStretcherBack);

    // Nailer Strips
    const nailerStripWidth = 0.1; // 100mm
    const nailerStripLength = cabinetWidth - 2 * thickness;
    const topNailer = createPanel(nailerStripLength, nailerStripWidth, thickness);
    topNailer.position.set(0, cabinetHeight - nailerStripWidth/2, -cabinetDepth/2 + thickness/2);
    cabinet.add(topNailer);

    const bottomNailer = createPanel(nailerStripLength, nailerStripWidth, thickness);
    bottomNailer.position.set(0, thickness + nailerStripWidth/2, -cabinetDepth/2 + thickness/2);
    cabinet.add(bottomNailer);

    // Back panel (fits inside a groove, in front of nailer)
    const backPanelWidth = cabinetWidth - 2 * thickness + 2 * backGroove;
    const backPanelHeight = cabinetHeight - thickness + 2 * backGroove;
    const backPanel = createPanel(backPanelWidth, backPanelHeight, backPanelThickness);
    backPanel.position.set(0, backPanelHeight/2 + thickness - backGroove, -cabinetDepth / 2 + thickness + backPanelThickness/2);
    cabinet.add(backPanel);


    // Joinery Screws
    const addScrews = (targetPanel: THREE.Mesh, screwCount: number, screwAxis: 'x'|'y'|'z', length: number, center: THREE.Vector3, rotation: THREE.Euler) => {
        for(let i = 0; i < screwCount; i++) {
            const screw = createScrew();
            const screwPos = new THREE.Vector3();
            // Use screwCount + 1 to create space at the ends
            const spacing = length / (screwCount + 1); 
            const start = -length/2;
            
            if (screwAxis === 'x') screwPos.x = start + (i + 1) * spacing;
            if (screwAxis === 'y') screwPos.y = start + (i + 1) * spacing;
            if (screwAxis === 'z') screwPos.z = start + (i + 1) * spacing;

            screw.position.copy(screwPos.add(center));
            screw.rotation.copy(rotation);
            targetPanel.add(screw);
        }
    };
    
    // Sides to bottom
    addScrews(bottom, 3, 'z', cabinetDepth * 0.8, new THREE.Vector3(-cabinetWidth/2 + thickness/2, -thickness/2, 0), new THREE.Euler(Math.PI/2, 0, 0));
    addScrews(bottom, 3, 'z', cabinetDepth * 0.8, new THREE.Vector3(cabinetWidth/2 - thickness/2, -thickness/2, 0), new THREE.Euler(Math.PI/2, 0, 0));

    // Stretchers to sides
    addScrews(topStretcherFront, 2, 'x', stretcherLength * 0.8, new THREE.Vector3(0, thickness/2, 0), new THREE.Euler(Math.PI/2, 0, 0));
    addScrews(topStretcherBack, 2, 'x', stretcherLength * 0.8, new THREE.Vector3(0, thickness/2, 0), new THREE.Euler(Math.PI/2, 0, 0));
    
    // Nailer strips to sides
    addScrews(topNailer, 2, 'x', nailerStripLength * 0.8, new THREE.Vector3(0, 0, thickness/2), new THREE.Euler(0, 0, 0));
    addScrews(bottomNailer, 2, 'x', nailerStripLength * 0.8, new THREE.Vector3(0, 0, thickness/2), new THREE.Euler(0, 0, 0));


    // Shelf
    const shelfWidth = cabinetWidth - 2 * thickness - 2 * backGroove;
    const shelfDepth = cabinetDepth - thickness - backPanelThickness - 2 * backGroove - 0.005; // 5mm front gap
    const shelf = createPanel(shelfWidth, thickness, shelfDepth);
    shelf.position.set(0, cabinetHeight / 2, (thickness-backPanelThickness)/2 - backGroove - 0.0025);
    cabinet.add(shelf);
    
    // Doors & Hinges
    const doorGap = 0.002; // 2mm
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
          ? -cabinetWidth / 2 
          : cabinetWidth / 2;
        doorPivot.position.set(pivotX, 0, cabinetDepth / 2);
        cabinet.add(doorPivot);

        const doorPanel = createPanel(doorWidth, doorHeight, thickness);
        doorPanel.userData = { open: false, isOpening: false, isClosing: false, angle: 0, hinge: hingeSide };
        
        const panelX = isLeft 
            ? doorWidth / 2 - doorGap
            : -doorWidth / 2 + doorGap;
        doorPanel.position.set(panelX, doorHeight / 2 + doorGap, -thickness/2);
        doorPivot.add(doorPanel);


        const hingeYPositions = [hingeYMargin, doorHeight - hingeYMargin];
        const cupEdgeToCenter = HINGE_PRESET.K + HINGE_CUP_RADIUS;
        
        hingeYPositions.forEach(y => {
            const cup = createHingeCup();
            
            const cupLocalX = isLeft
                ? -doorWidth / 2 + cupEdgeToCenter
                : doorWidth / 2 - cupEdgeToCenter;

            cup.position.set(cupLocalX, y - doorHeight / 2, -thickness/2 + HINGE_PRESET.cupDepth / 2);
            doorPanel.add(cup);

            const plate = createHingePlate();
            const plateSide = isLeft ? leftSide : rightSide;
            
            const plateY = y + doorGap;
            const plateZ = cabinetDepth/2 - HINGE_PRESET.plateRowOffset;
            
            const plateWorldPos = new THREE.Vector3(0, plateY, plateZ);
            cabinet.localToWorld(plateWorldPos);

            plate.position.copy(plateSide.worldToLocal(plateWorldPos));
            plate.position.x = isLeft ? thickness/2 : -thickness/2;
            
            plateSide.add(plate);
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
    const planeMaterial = new THREE.ShadowMaterial({ opacity: 0.2 });
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.rotation.x = -Math.PI / 2;
    plane.position.y = 0;
    plane.receiveShadow = true;
    scene.add(plane);
    
    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
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
      const maxAngle = Math.PI * (110 / 180); // 110 degrees
      
      [leftDoorPanel, rightDoorPanel].forEach(door => {
        const doorData = door.userData;
        const doorGroup = door.parent as THREE.Group;
        const speed = openSpeed;

        const direction = doorData.hinge === 'left' ? 1 : -1;

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
              const mat = object.material as THREE.Material;
              mat.dispose();
              if((mat as THREE.MeshStandardMaterial).map) {
                (mat as THREE.MeshStandardMaterial).map?.dispose();
              }
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
