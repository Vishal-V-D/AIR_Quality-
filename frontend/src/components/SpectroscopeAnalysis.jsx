import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { ArrowLeft, Plus, Minus, Droplets, Thermometer, Eye, Wind, Layers, Sun, X, Send } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function SpectroscopeAnalysis({ actionId, actions, lightTheme, onClose, telemetry: externalTelemetry, anomalyActive: externalAnomaly, onExecuteAction }) {
  const mountRef = useRef(null);
  const chatEndRef = useRef(null);
  const [is3D, setIs3D] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(40);
  const [selectedLocation, setSelectedLocation] = useState('Delhi Region, India');

  const [rainfall, setRainfall] = useState(0);
  const [humidity, setHumidity] = useState(84);
  const [temperature, setTemperature] = useState(23);
  const [visibility, setVisibility] = useState(5);

  // Dynamic AI State variables
  const [spikeInjected, setSpikeInjected] = useState(externalAnomaly || false);
  const [copilotTab, setCopilotTab] = useState('fingerprint');
  const [chatLanguage, setChatLanguage] = useState('en');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [executingAction, setExecutingAction] = useState(null);
  const [chatHistory, setChatHistory] = useState([
    {
      role: 'assistant',
      text: '👋 Hello! I am **NEXUS AI Sentinel Copilot** — powered by Groq LLM with live Delhi telemetry.\n\nI have already analyzed PM2.5 across all 6 wards. Try the quick-fire queries below, or type your own question.'
    },
    {
      role: 'user',
      text: 'Where should I deploy 3 inspectors today?'
    },
    {
      role: 'assistant',
      text: '📍 **Ranked Deployment Directive (Live Data):**\n\n1. **Okhla Industrial (Ward-3)** — PM2.5 118+ µg/m³. Priority: SO₂ stack checks on Phase-II smelter units. Expected AQI reduction: −28 pts.\n2. **Anand Vihar (Ward-4)** — PM2.5 72+ µg/m³. Deploy emission checker at NH-9 freight entry. Expected reduction: −18 pts.\n3. **Wazirpur Industrial (Ward-6)** — PM2.5 92+ µg/m³. Check wet-suppression compliance. Expected reduction: −14 pts.',
      isGroq: false
    },
    {
      role: 'user',
      text: 'What is the expected impact of a traffic diversion on Anand Vihar?'
    },
    {
      role: 'assistant',
      text: '🚛 **AI Scenario Prediction — NH-9 Freight Diversion:**\n\n• Diverting commercial freight 07:00–09:00 reduces local diesel PM2.5 by **~38%**\n• Ward-4 PM2.5 projected: **210 → 130 µg/m³** (Poor → Moderate category)\n• SO₂/NO₂ expected drop: **−45 ppm** within 90 minutes\n• Estimated health benefit: **15% fewer respiratory surge cases** in local clinics today',
      isGroq: false
    },
    {
      role: 'user',
      text: 'Why does Okhla have higher AQI than Dwarka today?'
    },
    {
      role: 'assistant',
      text: '🔬 **Forensic Fingerprint — Okhla vs Dwarka:**\n\n• **Wind corridor trap:** NE wind shift at 06:00 (direction 72°E) channels industrial exhaust into the Okhla basin\n• **Boundary layer collapse:** Height dropped 180m vs yesterday — concentrating stack emissions\n• **Source mix:** Okhla = 68% industrial (smelters) vs Dwarka = 71% construction dust\n• **Traffic load:** Okhla carries 3.2× more freight tonnage per km than Dwarka bypass routes',
      isGroq: false
    }
  ]);
  const [isCopilotOpen, setIsCopilotOpen] = useState(true);

  // Hourly values for stacked columns
  const [hourlyData, setHourlyData] = useState([
    { label: '8 AM', val: 45 },
    { label: '9 AM', val: 52 },
    { label: '10 AM', val: 38 },
    { label: '11 AM', val: 42 },
    { label: 'O PM', val: 36 },
    { label: '1 PM', val: 54 },
    { label: '2 PM', val: 44 },
    { label: '3 PM', val: 39 },
    { label: '4 PM', val: 51 },
  ]);

  // Theme tokens
  const T = lightTheme
    ? {
        bg: '#eef1f6',
        cardSolid: '#ffffff',
        text: '#0f172a',
        muted: '#64748b',
        border: 'rgba(0, 0, 0, 0.08)',
        sceneBg: '#e8eaf0',
        gridA: '#c5c8d0',
        gridB: '#d9dce4',
        floorCol: '#dde0e8',
        floatingBg: 'rgba(255, 255, 255, 0.85)',
        floatingBorder: 'rgba(255, 255, 255, 0.7)',
        bottomBg: 'rgba(255, 255, 255, 0.85)',
        bottomBorder: 'rgba(0, 0, 0, 0.06)',
        periodTabBg: '#f0f2f7',
        barBg: '#e4e7ed',
        ctrlBg: '#ffffff',
        ctrlShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
        inputBg: 'rgba(255, 255, 255, 0.8)',
      }
    : {
        bg: '#0b0f19',
        cardSolid: '#1f2937',
        text: '#f3f4f6',
        muted: '#9ca3af',
        border: 'rgba(255, 255, 255, 0.08)',
        sceneBg: '#0c101b',
        gridA: '#1e2840',
        gridB: '#151d2f',
        floorCol: '#0f1420',
        floatingBg: 'rgba(17, 24, 39, 0.8)',
        floatingBorder: 'rgba(255, 255, 255, 0.08)',
        bottomBg: 'rgba(17, 24, 39, 0.8)',
        bottomBorder: 'rgba(255, 255, 255, 0.06)',
        periodTabBg: '#111827',
        barBg: '#1f2937',
        ctrlBg: '#1f2937',
        ctrlShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
        inputBg: 'rgba(17, 24, 39, 0.8)',
      };

  useEffect(() => {
    if (actions && actionId) {
      const act = actions.find(a => a.id === actionId);
      if (act) {
        setSelectedLocation(`${act.ward_name}, Delhi, India`);
        setTemperature(Math.floor(22 + Math.random() * 6));
        setHumidity(Math.floor(75 + Math.random() * 15));
        setRainfall(Math.random() > 0.6 ? Math.floor(Math.random() * 3) : 0);
        setVisibility(Math.floor(3 + Math.random() * 5));
        const baseAqi = act.status === 'Completed' ? 25 : 50;
        setHourlyData([
          { label: '8 AM', val: Math.floor(baseAqi * 0.9) },
          { label: '9 AM', val: Math.floor(baseAqi * 1.1) },
          { label: '10 AM', val: Math.floor(baseAqi * 0.8) },
          { label: '11 AM', val: Math.floor(baseAqi * 0.95) },
          { label: 'O PM', val: Math.floor(baseAqi * 0.85) },
          { label: '1 PM', val: Math.floor(baseAqi * 1.15) },
          { label: '2 PM', val: Math.floor(baseAqi * 1.05) },
          { label: '3 PM', val: Math.floor(baseAqi * 0.9) },
          { label: '4 PM', val: Math.floor(baseAqi * 1.1) },
        ]);
      }
    }
  }, [actionId, actions]);

  // ── Three.js Scene Setup ───────────────────────────────────────────────────
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(T.sceneBg);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    
    // Position to overlook the street
    let radius = zoomLevel;
    let theta = -0.5; // Yaw angle
    let phi = 0.65;   // Pitch angle

    const updateCamera = () => {
      if (is3D) {
        camera.position.set(
          radius * Math.sin(theta) * Math.cos(phi),
          radius * Math.sin(phi),
          radius * Math.cos(theta) * Math.cos(phi)
        );
      } else {
        camera.position.set(0, radius + 20, 0.1);
      }
      camera.lookAt(0, 1.5, 0);
    };
    updateCamera();

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // Ground Grid
    const gridHelper = new THREE.GridHelper(100, 50, T.gridA, T.gridB);
    gridHelper.position.y = 0.05;
    scene.add(gridHelper);

    // Floor
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(250, 250),
      new THREE.MeshStandardMaterial({ color: T.floorCol, roughness: 0.85, metalness: 0.05 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // ── WINDOWS GRID CANVAS TEXTURE ─────────────────────────────────────────
    const winCanvas = document.createElement('canvas');
    winCanvas.width = 64; winCanvas.height = 64;
    const winCtx = winCanvas.getContext('2d');
    winCtx.fillStyle = '#0f172a'; // Dark wall baseline
    winCtx.fillRect(0, 0, 64, 64);
    
    // Fill realistic window light patterns
    winCtx.fillStyle = lightTheme ? '#eab308' : '#fef08a';
    for (let x = 4; x < 64; x += 10) {
      for (let y = 4; y < 64; y += 12) {
        if (Math.random() > 0.25) {
          winCtx.fillRect(x, y, 4, 6);
        }
      }
    }
    const winTex = new THREE.CanvasTexture(winCanvas);
    winTex.wrapS = THREE.RepeatWrapping;
    winTex.wrapT = THREE.RepeatWrapping;
    winTex.repeat.set(3, 4);

    // Buildings Grid Material with Emissive Windows
    const buildingMat = new THREE.MeshStandardMaterial({
      color: lightTheme ? '#d1d5db' : '#1e293b',
      roughness: 0.5,
      metalness: 0.3,
      flatShading: true,
      emissive: lightTheme ? '#1e293b' : '#334155',
      emissiveMap: winTex,
      emissiveIntensity: lightTheme ? 0.15 : 1.3
    });

    // Trees Generator Group
    const treeGroup = new THREE.Group();
    const treeTrunkGeom = new THREE.CylinderGeometry(0.04, 0.06, 0.4, 5);
    const treeTrunkMat = new THREE.MeshStandardMaterial({ color: '#78350f', roughness: 0.9 });
    const treeLeavesGeom = new THREE.ConeGeometry(0.24, 0.7, 5);
    const treeLeavesMat = new THREE.MeshStandardMaterial({ color: '#16a34a', roughness: 0.8, flatShading: true });

    // Spawn trees along the main highway canyon
    for (let z = -65; z <= 65; z += 6) {
      // Left side edge
      const t1 = new THREE.Group();
      const trunk1 = new THREE.Mesh(treeTrunkGeom, treeTrunkMat);
      trunk1.position.y = 0.2;
      trunk1.castShadow = true;
      const leaves1 = new THREE.Mesh(treeLeavesGeom, treeLeavesMat);
      leaves1.position.y = 0.65;
      leaves1.castShadow = true;
      t1.add(trunk1);
      t1.add(leaves1);
      t1.position.set(-2.6, 0.05, z + (Math.random() - 0.5) * 1.5);
      treeGroup.add(t1);

      // Right side edge
      const t2 = new THREE.Group();
      const trunk2 = new THREE.Mesh(treeTrunkGeom, treeTrunkMat);
      trunk2.position.y = 0.2;
      trunk2.castShadow = true;
      const leaves2 = new THREE.Mesh(treeLeavesGeom, treeLeavesMat);
      leaves2.position.y = 0.65;
      leaves2.castShadow = true;
      t2.add(trunk2);
      t2.add(leaves2);
      t2.position.set(2.6, 0.05, z + (Math.random() - 0.5) * 1.5);
      treeGroup.add(t2);
    }
    scene.add(treeGroup);

    // Cars Simulators
    const carsArray = [];
    const carColors = ['#ef4444', '#3b82f6', '#f59e0b', '#10b981', '#a855f7', '#64748b'];
    
    const carGeom = new THREE.BoxGeometry(0.22, 0.13, 0.45);
    const lightGeom = new THREE.SphereGeometry(0.03, 4, 4);
    const headLightMat = new THREE.MeshBasicMaterial({ color: '#fef08a' });
    const tailLightMat = new THREE.MeshBasicMaterial({ color: '#f87171' });

    for (let c = 0; c < 24; c++) {
      const car = new THREE.Group();
      const bodyColor = carColors[c % carColors.length];
      const bodyMat = new THREE.MeshStandardMaterial({ color: bodyColor, roughness: 0.3, metalness: 0.5 });
      const body = new THREE.Mesh(carGeom, bodyMat);
      body.position.y = 0.085;
      body.castShadow = true;
      car.add(body);

      // Headlights (z = -0.23)
      const hl1 = new THREE.Mesh(lightGeom, headLightMat);
      hl1.position.set(-0.07, 0.085, -0.23);
      const hl2 = new THREE.Mesh(lightGeom, headLightMat);
      hl2.position.set(0.07, 0.085, -0.23);
      car.add(hl1);
      car.add(hl2);

      // Taillights (z = 0.23)
      const tl1 = new THREE.Mesh(lightGeom, tailLightMat);
      tl1.position.set(-0.07, 0.085, 0.23);
      const tl2 = new THREE.Mesh(lightGeom, tailLightMat);
      tl2.position.set(0.07, 0.085, 0.23);
      car.add(tl1);
      car.add(tl2);

      const direction = Math.random() > 0.5 ? 1 : -1;
      const speed = 0.09 + Math.random() * 0.15;
      const lane = direction > 0 ? 0.75 : -0.75;
      const startZ = (Math.random() - 0.5) * 130;
      
      car.position.set(lane, 0.05, startZ);
      if (direction < 0) {
        car.rotation.y = Math.PI;
      }
      
      scene.add(car);
      carsArray.push({ mesh: car, speed, direction });
    }

    const bGroup = new THREE.Group();
    const cols = 20, rows = 20, spacing = 4.5;
    const hw = (cols * spacing) / 2, hh = (rows * spacing) / 2;

    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        // Create a central highway canyon by skipping cols 9 and 10
        if (i === 9 || i === 10) continue;
        if (Math.random() < 0.18) continue; // Random street gaps (slightly lower gap rate for more buildings!)

        const px = -hw + i * spacing + (Math.random() - 0.5) * 0.6;
        const pz = -hh + j * spacing + (Math.random() - 0.5) * 0.6;
        const dist = Math.sqrt(px * px + pz * pz);
        
        // Tallest buildings in the core city area, tapering off
        const maxH = Math.max(2.5, 20 - dist * 0.38);
        const bH = 2.5 + Math.random() * maxH;
        const bW = 2.2 + Math.random() * 1.5;
        const bD = 2.2 + Math.random() * 1.5;

        // Choose a futuristic building style randomly
        const bType = Math.floor(Math.random() * 6);
        let mesh;

        if (bType === 0) {
          // 1. Box geometry with glass panels
          mesh = new THREE.Mesh(new THREE.BoxGeometry(bW, bH, bD), buildingMat);
          mesh.position.set(px, bH / 2, pz);
        } else if (bType === 1) {
          // 2. Tapered cylinder / tower shape (Hexagonal or Pentagonal shard)
          const geom = new THREE.CylinderGeometry(bW * 0.2, bW * 0.7, bH, 5);
          mesh = new THREE.Mesh(geom, buildingMat);
          mesh.position.set(px, bH / 2, pz);
        } else if (bType === 2) {
          // 3. Stepped skyscraper (wedding cake structure)
          const baseH = bH * 0.4;
          const topH = bH * 0.6;
          const baseGeom = new THREE.BoxGeometry(bW, baseH, bD);
          const topGeom = new THREE.BoxGeometry(bW * 0.7, topH, bD * 0.7);
          
          const baseMesh = new THREE.Mesh(baseGeom, buildingMat);
          baseMesh.position.set(0, baseH / 2, 0);
          baseMesh.castShadow = true;
          baseMesh.receiveShadow = true;
          
          const topMesh = new THREE.Mesh(topGeom, buildingMat);
          topMesh.position.set(0, baseH + topH / 2, 0);
          topMesh.castShadow = true;
          topMesh.receiveShadow = true;
          
          const stepGroup = new THREE.Group();
          stepGroup.add(baseMesh);
          stepGroup.add(topMesh);
          stepGroup.position.set(px, 0, pz);
          mesh = stepGroup;
        } else if (bType === 3) {
          // 4. Hexagonal tower with spire
          const bodyH = bH * 0.82;
          const spireH = bH * 0.18;
          const bodyGeom = new THREE.CylinderGeometry(bW * 0.5, bW * 0.5, bodyH, 6);
          const spireGeom = new THREE.CylinderGeometry(0.02, bW * 0.12, spireH, 4);
          
          const bodyMesh = new THREE.Mesh(bodyGeom, buildingMat);
          bodyMesh.position.set(0, bodyH / 2, 0);
          bodyMesh.castShadow = true;
          bodyMesh.receiveShadow = true;
          
          const spireMesh = new THREE.Mesh(spireGeom, new THREE.MeshStandardMaterial({
            color: '#f89c1d', emissive: '#f89c1d', emissiveIntensity: lightTheme ? 0.25 : 0.85, roughness: 0.1
          }));
          spireMesh.position.set(0, bodyH + spireH / 2, 0);
          
          const spireGroup = new THREE.Group();
          spireGroup.add(bodyMesh);
          spireGroup.add(spireMesh);
          spireGroup.position.set(px, 0, pz);
          mesh = spireGroup;
        } else if (bType === 4) {
          // 5. Cylindrical tower with horizontal accent rings
          const cylGeom = new THREE.CylinderGeometry(bW * 0.45, bW * 0.45, bH, 12);
          const cylMesh = new THREE.Mesh(cylGeom, buildingMat);
          cylMesh.position.set(0, bH / 2, 0);
          cylMesh.castShadow = true;
          cylMesh.receiveShadow = true;
          
          const cylGroup = new THREE.Group();
          cylGroup.add(cylMesh);
          
          // Add accent rings
          const ringMat = new THREE.MeshStandardMaterial({ color: '#f89c1d', roughness: 0.2 });
          const ringGeom = new THREE.CylinderGeometry(bW * 0.49, bW * 0.49, 0.25, 12);
          for (let k = 1; k < 4; k++) {
            const ring = new THREE.Mesh(ringGeom, ringMat);
            ring.position.set(0, bH * (k / 4), 0);
            cylGroup.add(ring);
          }
          
          cylGroup.position.set(px, 0, pz);
          mesh = cylGroup;
        } else {
          // 6. Modern architectural arch compound with glass dome
          const blockH = bH;
          const blockMesh = new THREE.Mesh(new THREE.BoxGeometry(bW, blockH, bD), buildingMat);
          blockMesh.position.set(0, blockH / 2, 0);
          blockMesh.castShadow = true;
          blockMesh.receiveShadow = true;

          const topGlassGeom = new THREE.SphereGeometry(bW * 0.42, 8, 8);
          const topGlass = new THREE.Mesh(topGlassGeom, new THREE.MeshStandardMaterial({
            color: '#3498db', roughness: 0.1, metalness: 0.9, transparent: true, opacity: 0.65
          }));
          topGlass.position.set(0, blockH, 0);

          const compoundGroup = new THREE.Group();
          compoundGroup.add(blockMesh);
          compoundGroup.add(topGlass);
          compoundGroup.position.set(px, 0, pz);
          mesh = compoundGroup;
        }

        bGroup.add(mesh);
      }
    }
    scene.add(bGroup);

    // Dynamic Pollution Corridor Flow
    const canvas = document.createElement('canvas');
    canvas.width = 64; canvas.height = 256;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createLinearGradient(0, 0, 0, 256);
    if (spikeInjected) {
      // Hot red / purple toxic corridor flow during transport spike
      grad.addColorStop(0,   'rgba(231, 76, 60, 0.9)');   // Severe red
      grad.addColorStop(0.45, 'rgba(155, 89, 182, 0.95)'); // Purple haze
      grad.addColorStop(1,   'rgba(142, 68, 173, 0.95)');  // Deep violet
    } else {
      grad.addColorStop(0,   'rgba(46, 204, 113, 0.4)');
      grad.addColorStop(0.35, 'rgba(241, 196, 15, 0.55)');
      grad.addColorStop(0.7, 'rgba(230, 126, 34, 0.6)');
      grad.addColorStop(1,   'rgba(231, 76, 60, 0.55)');
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 256);

    const pathTex = new THREE.CanvasTexture(canvas);
    pathTex.wrapS = THREE.RepeatWrapping;
    pathTex.wrapT = THREE.RepeatWrapping;

    const pathMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(8.2, 140),
      new THREE.MeshBasicMaterial({ map: pathTex, transparent: true, depthWrite: false })
    );
    pathMesh.rotation.x = -Math.PI / 2;
    pathMesh.position.set(0, 0.08, 0);
    scene.add(pathMesh);

    // Lighting
    scene.add(new THREE.AmbientLight('#ffffff', lightTheme ? 1.05 : 0.65));
    const sun = new THREE.DirectionalLight('#ffffff', lightTheme ? 1.35 : 0.85);
    sun.position.set(40, 60, 25);
    sun.castShadow = true;
    scene.add(sun);

    if (!lightTheme) {
      const pl1 = new THREE.PointLight('#f89c1d', 4.5, 30);
      pl1.position.set(0, 3, 5);
      scene.add(pl1);
      const pl2 = new THREE.PointLight('#e74c3c', 4, 30);
      pl2.position.set(0, 3, -15);
      scene.add(pl2);
    }

    // Camera Drag to Orbit
    let dragging = false;
    let prevX = 0, prevY = 0;

    const onMouseDown = (e) => {
      dragging = true;
      prevX = e.offsetX;
      prevY = e.offsetY;
    };

    const onMouseMove = (e) => {
      if (!dragging || !is3D) return;
      theta -= (e.offsetX - prevX) * 0.0045;
      phi = Math.max(0.12, Math.min(Math.PI / 2 - 0.05, phi - (e.offsetY - prevY) * 0.0045));
      updateCamera();
      prevX = e.offsetX;
      prevY = e.offsetY;
    };

    const onMouseUp = () => { dragging = false; };

    container.addEventListener('mousedown', onMouseDown);
    container.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    const onResize = () => {
      if (!mountRef.current) return;
      const w = mountRef.current.clientWidth, h = mountRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    // Animation Loop
    let raf;
    const animate = () => {
      raf = requestAnimationFrame(animate);
      pathTex.offset.y -= 0.0022; // Animate the flow of pollution
      
      // Animate simulated traffic flow
      carsArray.forEach(car => {
        car.mesh.position.z += car.speed * car.direction;
        if (car.mesh.position.z > 65) {
          car.mesh.position.z = -65;
        } else if (car.mesh.position.z < -65) {
          car.mesh.position.z = 65;
        }
      });

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(raf);
      container.removeEventListener('mousedown', onMouseDown);
      container.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('resize', onResize);
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
      
      // Memory cleanup
      winTex.dispose();
      treeTrunkGeom.dispose();
      treeLeavesGeom.dispose();
      carGeom.dispose();
      lightGeom.dispose();
      renderer.dispose();
    };
  }, [is3D, zoomLevel, lightTheme, spikeInjected]);

  const zoomIn = () => setZoomLevel(p => Math.max(15, p - 5));
  const zoomOut = () => setZoomLevel(p => Math.min(75, p + 5));

  // CSS Styles for UI Elements overlaying the 3D canvas
  const styles = {
    floatingContainer: {
      position: 'relative',
      background: T.floatingBg,
      backdropFilter: 'blur(16px)',
      borderRadius: '16px',
      border: `1px solid ${T.floatingBorder}`,
      padding: '16px',
      boxShadow: lightTheme ? '0 10px 30px rgba(0,0,0,0.06)' : '0 10px 40px rgba(0,0,0,0.3)',
      display: 'flex',
      flexDirection: 'column',
      color: T.text,
      zIndex: 10,
      height: '100%',
    },
    metricBadge: {
      position: 'absolute',
      background: T.floatingBg,
      backdropFilter: 'blur(12px)',
      borderRadius: '40px',
      padding: '8px 18px 8px 8px',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      boxShadow: lightTheme ? '0 8px 24px rgba(0,0,0,0.06)' : '0 8px 30px rgba(0,0,0,0.35)',
      border: `1px solid ${T.floatingBorder}`,
      zIndex: 10,
    },
    badgeIconCircle: {
      width: '38px',
      height: '38px',
      borderRadius: '50%',
      background: T.cardSolid,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
    }
  };

  const displayHourlyData = hourlyData.map((item, idx) => {
    if (spikeInjected && idx >= 4) {
      return { ...item, val: Math.min(100, item.val + 22) };
    }
    return item;
  });

  const baseVal = displayHourlyData[8] ? displayHourlyData[8].val : 50;
  const y_base = 100 - (baseVal / 60) * 85;

  const val_no = spikeInjected ? 78 : 58;
  const val_wi = spikeInjected ? 52 : 42;
  const y_no = 100 - (val_no / 60) * 85;
  const y_wi = 100 - (val_wi / 60) * 85;

  const val_no2 = spikeInjected ? 85 : 60;
  const val_wi2 = spikeInjected ? 44 : 35;
  const y_no2 = 100 - (val_no2 / 60) * 85;
  const y_wi2 = 100 - (val_wi2 / 60) * 85;

  const advisories = {
    en: spikeInjected 
      ? `🚨 CRITICAL AQI WARNING: Dynamic traffic congestion has spiked PM2.5 levels to hazardous indices. Wear N95 masks, avoid outdoor activity, and limit exposure.`
      : `Advisory: AQI is Moderate in ${selectedLocation.split(',')[0]}. Sensitive groups should consider wearing masks during peak hours.`,
    hi: spikeInjected
      ? `🚨 प्रदूषण चेतावनी: भारी वाहनों के कारण पीएम२.५ का स्तर अत्यंत खतरनाक है। बाहर जाने से बचें और मास्क का प्रयोग अवश्य करें।`
      : `सलाह: ${selectedLocation.split(',')[0]} में हवा की गुणवत्ता मध्यम है। संवेदनशील समूह बाहरी गतिविधियों को सीमित करें।`,
    ta: spikeInjected
      ? `🚨 அவசர காற்று மாசு எச்சரிக்கை: வாகன நெரிசலால் காற்று தரம் மிக மோசமாக உள்ளது. முதியவர்கள், குழந்தைகள் வெளியே செல்வதை தவிர்க்கவும்.`
      : `அறிவிப்பு: ${selectedLocation.split(',')[0]} பகுதியில் காற்றின் தரம் ஓரளவு சீராக உள்ளது. சுவாச பிரச்சனை உள்ளவர்கள் எச்சரிக்கையுடன் இருக்கவும்.`
  };

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, chatLoading]);

  const handleChatPrompt = useCallback(async (prompt) => {
    if (chatLoading || !prompt.trim()) return;
    const msg = prompt.trim();
    setChatLoading(true);
    setChatInput('');
    setChatHistory(prev => [...prev, { role: 'user', text: msg }]);

    try {
      const res = await fetch(`${API_URL}/api/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msg,
          context: { anomaly_active: spikeInjected, location: selectedLocation }
        })
      });
      const data = await res.json();
      setChatHistory(prev => [...prev, {
        role: 'assistant',
        text: data.reply,
        isGroq: data.source === 'groq',
        model: data.model
      }]);
    } catch (e) {
      setChatHistory(prev => [...prev, {
        role: 'assistant',
        text: '⚠️ Could not reach AI backend. Please ensure backend is running on localhost:8000.'
      }]);
    } finally {
      setChatLoading(false);
    }
  }, [chatLoading, spikeInjected, selectedLocation]);

  const handleSpikeToggle = async () => {
    const next = !spikeInjected;
    setSpikeInjected(next);
    try {
      await fetch(`${API_URL}/api/simulate/${next ? 'inject' : 'reset'}`, { method: 'POST' });
    } catch (e) { /* ignore */ }
  };

  const handleExecuteAction = async (actId) => {
    if (executingAction === actId) return;
    setExecutingAction(actId);
    try {
      await fetch(`${API_URL}/api/enforcement/${actId}/execute`, { method: 'POST' });
      if (onExecuteAction) onExecuteAction(actId);
    } catch (e) { /* ignore */ } finally {
      setTimeout(() => setExecutingAction(null), 1500);
    }
  };

  return (
    <div style={{
      width: '100%', height: '100%', position: 'relative', background: T.bg,
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      color: T.text, overflow: 'hidden',
    }}>
      
      {/* ── BACKGROUND 3D WORLD ───────────────────────────────────────────────── */}
      <div ref={mountRef} style={{
        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1
      }} />

      {/* ── TOP NAV BAR ───────────────────────────────────────────────────────── */}
      <div style={{
        position: 'absolute', top: 16, left: 16, right: 16,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        zIndex: 20, pointerEvents: 'none',
      }}>
        {/* Back, dropdown, and spike injector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, pointerEvents: 'auto' }}>
          <button onClick={onClose} style={{
            width: 36, height: 36, borderRadius: '8px', background: T.ctrlBg,
            border: `1px solid ${T.border}`, boxShadow: T.ctrlShadow,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: T.text, transition: 'all 0.2s',
          }}>
            <ArrowLeft size={16} />
          </button>

          <div style={{
            background: T.ctrlBg, padding: '8px 16px', borderRadius: '8px',
            boxShadow: T.ctrlShadow, border: `1px solid ${T.border}`,
            display: 'flex', alignItems: 'center', gap: 8,
            fontSize: 13, fontWeight: 600, color: T.text,
          }}>
            📍 <span>{selectedLocation}</span>
          </div>

          <button
            onClick={handleSpikeToggle}
            style={{
              background: spikeInjected ? '#e74c3c' : T.ctrlBg,
              color: spikeInjected ? '#ffffff' : '#e74c3c',
              padding: '8px 16px', borderRadius: '8px',
              boxShadow: spikeInjected ? '0 0 18px rgba(231,76,60,0.55)' : T.ctrlShadow,
              border: `2px solid ${spikeInjected ? '#e74c3c' : '#e74c3c'}`,
              display: 'flex', alignItems: 'center', gap: 6,
              fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all 0.25s',
            }}
            className="ai-pulse-button"
          >
            🚨 <span>{spikeInjected ? '⬛ Clear Spike' : '▶ Inject Transport Spike'}</span>
          </button>
        </div>

        {/* Temperature & Clock (Margin reacts dynamically to sidebar state) */}
        <div style={{ pointerEvents: 'auto', marginRight: isCopilotOpen ? 396 : 16, transition: 'all 0.3s ease-in-out' }}>
          <div style={{
            background: T.ctrlBg, padding: '8px 16px', borderRadius: '8px',
            boxShadow: T.ctrlShadow, border: `1px solid ${T.border}`,
            display: 'flex', alignItems: 'center', gap: 8,
            fontSize: 13, fontWeight: 600, color: T.text,
          }}>
            <Sun size={14} style={{ color: '#f89c1d' }} />
            <span>{temperature}°C, {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>
      </div>

      {/* ── FLOATING OVERLAYS (Left-aligned to prevent overlap) ────────────────── */}
      
      {/* Rainfall Badge */}
      <div style={{ ...styles.metricBadge, top: '20%', left: '12%' }}>
        <div style={styles.badgeIconCircle}><Droplets size={16} style={{ color: '#3498db' }} /></div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: T.text, lineHeight: 1 }}>
            {rainfall} <span style={{ fontSize: 10, fontWeight: 500, color: T.muted }}>mm</span>
          </div>
          <div style={{ fontSize: 9, color: T.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Rainfall</div>
        </div>
      </div>

      {/* Humidity Badge */}
      <div style={{ ...styles.metricBadge, top: '10%', left: '38%' }}>
        <div style={styles.badgeIconCircle}><Wind size={16} style={{ color: '#2ecc71' }} /></div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: T.text, lineHeight: 1 }}>
            {humidity} <span style={{ fontSize: 10, fontWeight: 500, color: T.muted }}>%</span>
          </div>
          <div style={{ fontSize: 9, color: T.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Humidity</div>
        </div>
      </div>

      {/* Temperature Badge */}
      <div style={{ ...styles.metricBadge, bottom: '44%', left: '22%' }}>
        <div style={styles.badgeIconCircle}><Thermometer size={16} style={{ color: '#e74c3c' }} /></div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: T.text, lineHeight: 1 }}>
            {temperature} <span style={{ fontSize: 10, fontWeight: 500, color: T.muted }}>°C</span>
          </div>
          <div style={{ fontSize: 9, color: T.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Temperature</div>
        </div>
      </div>

      {/* Visibility Badge */}
      <div style={{ ...styles.metricBadge, top: '32%', left: '46%' }}>
        <div style={styles.badgeIconCircle}><Eye size={16} style={{ color: '#9b59b6' }} /></div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: T.text, lineHeight: 1 }}>
            {visibility} <span style={{ fontSize: 10, fontWeight: 500, color: T.muted }}>km</span>
          </div>
          <div style={{ fontSize: 9, color: T.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Visibility</div>
        </div>
      </div>

      {/* Camera Controls */}
      <div style={{
        position: 'absolute', bottom: '272px', right: isCopilotOpen ? 412 : 16,
        display: 'flex', flexDirection: 'column', gap: 8, zIndex: 20,
        transition: 'all 0.3s ease-in-out',
      }}>
        {[
          { icon: <Plus size={15} />, action: zoomIn },
          { icon: <Minus size={15} />, action: zoomOut },
          {
            icon: <><Layers size={14} /><span style={{ fontSize: 9, fontWeight: 700, marginLeft: 2 }}>{is3D ? '3D' : '2D'}</span></>,
            action: () => setIs3D(p => !p),
            active: true,
          },
        ].map((btn, i) => (
          <button key={i} onClick={btn.action} style={{
            width: 36, height: 36, borderRadius: '8px', background: T.ctrlBg,
            border: `1px solid ${T.border}`, boxShadow: T.ctrlShadow,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: btn.active ? '#f89c1d' : T.text, gap: 2,
          }}>{btn.icon}</button>
        ))}
      </div>

      {/* AI Copilot Toggle Launcher (glowing pulse button) */}
      {!isCopilotOpen && (
        <button
          onClick={() => setIsCopilotOpen(true)}
          style={{
            position: 'absolute', top: 72, right: 16, width: 44, height: 44,
            borderRadius: '50%', background: T.ctrlBg, border: `1px solid ${T.border}`,
            boxShadow: T.ctrlShadow, display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: '#f89c1d', zIndex: 30, transition: 'all 0.2s',
            fontSize: 20
          }}
          className="ai-pulse-button"
          title="Open AI Sentinel Copilot"
        >
          🤖
        </button>
      )}

      {/* ── AI SENTINEL COPILOT PANEL (Right Sidebar) ─────────────────────────── */}
      <div style={{
        position: 'absolute', top: 72, right: 16, bottom: 16, width: 380,
        background: T.floatingBg, backdropFilter: 'blur(16px)',
        borderRadius: '16px', border: `1px solid ${T.floatingBorder}`,
        boxShadow: T.ctrlShadow, zIndex: 30, display: 'flex', flexDirection: 'column',
        color: T.text, overflow: 'hidden', pointerEvents: isCopilotOpen ? 'auto' : 'none',
        transform: isCopilotOpen ? 'translateX(0)' : 'translateX(420px)',
        opacity: isCopilotOpen ? 1 : 0,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      }} className={spikeInjected ? 'ai-card-glow' : ''}>
        
        {/* Sidebar Header */}
        <div style={{
          padding: '16px', borderBottom: `1px solid ${T.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              width: 8, height: 8, borderRadius: '50%', background: spikeInjected ? '#e74c3c' : '#2ecc71',
              boxShadow: spikeInjected ? '0 0 8px #e74c3c' : '0 0 8px #2ecc71',
            }} />
            <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.05em' }}>AI SENTINEL COPILOT</span>
          </div>
          <button
            onClick={() => setIsCopilotOpen(false)}
            style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: T.muted, display: 'flex', alignItems: 'center',
              justifyContent: 'center', padding: 4, borderRadius: 4,
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = T.text}
            onMouseLeave={(e) => e.currentTarget.style.color = T.muted}
          >
            <X size={15} />
          </button>
        </div>

        {/* Tab Selection */}
        <div style={{ display: 'flex', borderBottom: `1px solid ${T.border}`, padding: 4, gap: 4, background: T.periodTabBg }}>
          <button
            onClick={() => setCopilotTab('fingerprint')}
            style={{
              flex: 1, padding: '8px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700,
              background: copilotTab === 'fingerprint' ? T.cardSolid : 'transparent',
              color: copilotTab === 'fingerprint' ? T.text : T.muted,
              border: 'none', cursor: 'pointer', transition: 'all 0.2s'
            }}
          >
            Forensic Fingerprint
          </button>
          <button
            onClick={() => setCopilotTab('chat')}
            style={{
              flex: 1, padding: '8px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700,
              background: copilotTab === 'chat' ? T.cardSolid : 'transparent',
              color: copilotTab === 'chat' ? T.text : T.muted,
              border: 'none', cursor: 'pointer', transition: 'all 0.2s'
            }}
          >
            AI Agent Chat
          </button>
        </div>

        {/* Tab Body */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto', padding: 16, gap: 14 }}>
          {copilotTab === 'fingerprint' ? (
            <>
              {/* Fingerprint Analysis card */}
              <div style={{ background: T.cardSolid, padding: 14, borderRadius: 12, border: `1px solid ${T.border}` }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: spikeInjected ? '#e74c3c' : '#f89c1d', marginBottom: 6 }}>
                  {spikeInjected ? '🚨 PATTERN ANOMALY DETECTED' : '🔎 STABLE PATTERN REASONING'}
                </div>
                <p style={{ fontSize: 11, lineHeight: 1.5, margin: 0, color: T.text }}>
                  {spikeInjected 
                    ? `Okhla PM2.5 levels surged to 232 µg/m³ due to a sudden freight traffic spike (+45% flow). A westerly shift in local wind corridors is trapping combustion exhaust in the industrial basin corridor.`
                    : `${selectedLocation.split(',')[0]} AQI is moderate at 79. Weather models indicate standard dispersion patterns, matching 14 historical baseline days. Industry stack levels remain normal.`
                  }
                </p>
              </div>

              {/* Source attribution confidence scores */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 8, color: T.muted }}>AI ATTRIBUTION & CONFIDENCE</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    { name: 'Vehicle Emissions', score: spikeInjected ? 94 : 76, color: '#e74c3c' },
                    { name: 'Industrial Stack Draft', score: spikeInjected ? 88 : 82, color: '#f89c1d' },
                    { name: 'Construction Dust (CPCB)', score: spikeInjected ? 65 : 68, color: '#f1c40f' }
                  ].map(att => (
                    <div key={att.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 10.5 }}>
                      <span style={{ color: T.text, fontWeight: 500 }}>{att.name}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 60, height: 5, background: T.barBg, borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ width: `${att.score}%`, height: '100%', background: att.color }} />
                        </div>
                        <span style={{ fontWeight: 700, width: 25, textAlign: 'right' }}>{att.score}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Directives card */}
              <div style={{ background: T.cardSolid, padding: 14, borderRadius: 12, border: `1px solid ${T.border}`, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#2ecc71' }}>RECOMMENDED ACTION DIRECTIVES</div>
                <ul style={{ margin: 0, paddingLeft: 16, fontSize: 10.5, lineHeight: 1.5, color: T.text, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {spikeInjected ? (
                    <>
                      <li><strong>Traffic Diversion:</strong> Divert commercial freight from Okhla bypass to ring highway.</li>
                      <li><strong>Deploy Mobile Checker:</strong> Deploy 2 checking officers to verify fuel emission compliant stickers.</li>
                      <li><strong>Factory Checks:</strong> Issue stack-check warnings to metal smelter units in Phase II.</li>
                    </>
                  ) : (
                    <>
                      <li><strong>Deploy 3 Inspectors:</strong> Focus audits on building construction sites in Dwarka Ward 3.</li>
                      <li><strong>Check Permits:</strong> Review wet-suppression logs of 4 registered builders.</li>
                      <li><strong>Alert Public:</strong> Deploy localized citizen alerts via WhatsApp notifications.</li>
                    </>
                  )}
                </ul>
              </div>

              {/* Citizen advisory (Multilingual) */}
              <div style={{ background: T.cardSolid, padding: 14, borderRadius: 12, border: `1px solid ${T.border}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: T.muted }}>CITIZEN HEALTH ADVISORY</span>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {['en', 'hi', 'ta'].map(lang => (
                      <button
                        key={lang}
                        onClick={() => setChatLanguage(lang)}
                        style={{
                          fontSize: 9, fontWeight: 700, padding: '2px 5px', border: 'none', borderRadius: 4,
                          background: chatLanguage === lang ? '#f89c1d' : T.periodTabBg,
                          color: chatLanguage === lang ? '#ffffff' : T.muted,
                          cursor: 'pointer'
                        }}
                      >
                        {lang.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{ fontSize: 10.5, fontStyle: 'italic', lineHeight: 1.4, color: T.text, marginBottom: 8 }}>
                  "{advisories[chatLanguage]}"
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(advisories[chatLanguage]);
                    alert('WhatsApp advisory copied to clipboard!');
                  }}
                  style={{
                    width: '100%', padding: '8px', background: T.periodTabBg, border: 'none', borderRadius: 6,
                    fontSize: 9.5, fontWeight: 700, color: T.text, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                    transition: 'all 0.2s'
                  }}
                >
                  📋 Copy WhatsApp Advisory
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Chat history */}
              <div style={{
                flex: 1, display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto',
                background: T.periodTabBg, padding: 12, borderRadius: 12, maxHeight: '420px'
              }}>
                {chatHistory.map((msg, idx) => (
                  <div key={idx} style={{
                    alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    maxWidth: '90%',
                    background: msg.role === 'user' ? '#f89c1d' : T.cardSolid,
                    color: msg.role === 'user' ? '#ffffff' : T.text,
                    padding: '9px 13px', borderRadius: 12, fontSize: 10.5, lineHeight: 1.5,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.08)', whiteSpace: 'pre-line',
                    border: msg.isGroq ? '1px solid rgba(46,204,113,0.3)' : 'none'
                  }}>
                    {msg.isGroq && (
                      <div style={{ fontSize: 8, fontWeight: 700, color: '#2ecc71', marginBottom: 4, letterSpacing: '0.04em' }}>
                        ⚡ GROQ LLM · {msg.model || 'llama3-8b'}
                      </div>
                    )}
                    {msg.text}
                  </div>
                ))}
                {chatLoading && (
                  <div style={{ alignSelf: 'flex-start', background: T.cardSolid, padding: '10px 14px', borderRadius: 12, display: 'flex', gap: 5, alignItems: 'center' }}>
                    <span style={{ fontSize: 9, color: T.muted, marginRight: 4 }}>AI thinking...</span>
                    {[0, 0.2, 0.4].map((delay, i) => (
                      <span key={i} style={{ width: 5, height: 5, background: '#f89c1d', borderRadius: '50%', animation: `pulse 1s ${delay}s infinite` }} />
                    ))}
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Chat Input */}
              <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleChatPrompt(chatInput)}
                  placeholder="Ask AI Copilot anything..."
                  style={{
                    flex: 1, background: T.inputBg, border: `1px solid ${T.border}`,
                    borderRadius: 8, padding: '8px 12px', color: T.text, fontSize: 10.5,
                    fontFamily: 'inherit', outline: 'none'
                  }}
                />
                <button
                  onClick={() => handleChatPrompt(chatInput)}
                  disabled={chatLoading || !chatInput.trim()}
                  style={{
                    width: 36, height: 36, borderRadius: 8, background: chatInput.trim() ? '#f89c1d' : T.barBg,
                    border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s'
                  }}
                >
                  <Send size={14} color={chatInput.trim() ? '#000' : T.muted} />
                </button>
              </div>

              {/* Suggested prompts */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <span style={{ fontSize: 9, fontWeight: 700, color: T.muted }}>QUICK QUERIES</span>
                {[
                  '💡 Which ward needs immediate intervention now?',
                  '📊 Predict AQI for next 2 hours if no action taken',
                  '🚛 Impact of diverting NH-44 freight today?',
                ].map((q) => (
                  <button
                    key={q}
                    onClick={() => handleChatPrompt(q.replace(/^[\S]+ /, ''))}
                    style={{
                      padding: '7px 10px', background: T.cardSolid, border: `1px solid ${T.border}`,
                      borderRadius: 7, fontSize: 9.5, fontWeight: 600, color: T.text,
                      textAlign: 'left', cursor: 'pointer', transition: 'all 0.15s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = '#f89c1d'}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = T.border}
                  >{q}</button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── FLOATING BOTTOM PANELS (Adjusted width to fit side bar) ─────────────── */}
      <div style={{
        position: 'absolute', bottom: 16, left: 16, right: isCopilotOpen ? 412 : 16, height: '240px',
        display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', gap: 14,
        zIndex: 10, pointerEvents: 'auto',
        transition: 'all 0.3s ease-in-out',
      }}>
        
        {/* 1. Stacked AQI Bar Chart Panel */}
        <div style={styles.floatingContainer}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700 }}>Air Quality Index</div>
              <div style={{ fontSize: 10, color: T.muted, marginTop: 2 }}>Overall air quality status + 24h AI forecast.</div>
            </div>
            
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, fontSize: 8.5, fontWeight: 600, maxWidth: 260, justifyContent: 'flex-end' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><span style={{ width: 5, height: 5, borderRadius: '50%', background: '#2ecc71' }} />Good</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><span style={{ width: 5, height: 5, borderRadius: '50%', background: '#f1c40f' }} />Mod</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><span style={{ width: 5, height: 5, borderRadius: '50%', background: '#e74c3c' }} />Unhealth</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 3, borderLeft: `1px solid ${T.border}`, paddingLeft: 6 }}>
                  <span style={{ width: 10, height: 1, borderTop: '2px dashed #e74c3c' }} /> No Action
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  <span style={{ width: 10, height: 1, borderTop: '2px dashed #2ecc71' }} /> AI Intervention Forecast
                </span>
              </div>
            </div>
          </div>

          {/* SVG stacked bar chart + dashed line overlay */}
          <div style={{ flex: 1, position: 'relative' }}>
            <svg viewBox="0 0 480 120" style={{ width: '100%', height: '100%' }}>
              {[25, 55, 85].map((y, idx) => (
                <line key={idx} x1="10" x2="470" y1={y} y2={y} stroke={T.border} strokeWidth="0.8" strokeDasharray="3 3" />
              ))}
              
              {/* Shaded Area of Intervention Benefit */}
              <polygon
                points={`369,${y_base} 412,${y_no} 455,${y_no2} 455,${y_wi2} 412,${y_wi} 369,${y_base}`}
                fill="rgba(46, 204, 113, 0.15)"
              />

              {/* Forecast Line - No Action (Red) — thick & vivid */}
              <path
                d={`M 369 ${y_base} L 412 ${y_no} L 455 ${y_no2}`}
                fill="none" stroke="#e74c3c" strokeWidth="3.5" strokeDasharray="6 4"
                strokeLinecap="round"
              />
              {/* No-action label */}
              <text x={460} y={y_no2} fontSize="7.5" fontWeight="800" fill="#e74c3c" dominantBaseline="middle">No Action</text>

              {/* Forecast Line - With Intervention (Green) — thick & vivid */}
              <path
                d={`M 369 ${y_base} L 412 ${y_wi} L 455 ${y_wi2}`}
                fill="none" stroke="#00e676" strokeWidth="3.5" strokeDasharray="6 4"
                strokeLinecap="round"
              />
              {/* Intervention label */}
              <text x={460} y={y_wi2 - 4} fontSize="7.5" fontWeight="800" fill="#00e676" dominantBaseline="middle">AI Act</text>
              
              {/* Stacked columns for each hour */}
              {displayHourlyData.map((item, idx) => {
                const colWidth = 14;
                const colX = 18 + idx * 43;
                const totalH = (item.val / 60) * 85;
                
                // Segment heights
                const greenH = Math.min(totalH, 40);
                const yellowH = totalH > 40 ? Math.min(totalH - 40, 25) : 0;
                const redH = totalH > 65 ? totalH - 65 : 0;

                return (
                  <g key={idx}>
                    {/* Green Segment (Good) */}
                    <rect x={colX} y={100 - greenH} width={colWidth} height={greenH} fill="#2ecc71" rx="2" />
                    {/* Yellow Segment (Moderate) */}
                    {yellowH > 0 && (
                      <rect x={colX} y={100 - greenH - yellowH} width={colWidth} height={yellowH} fill="#f1c40f" rx="1" />
                    )}
                    {/* Red Segment (Unhealthy) */}
                    {redH > 0 && (
                      <rect x={colX} y={100 - greenH - yellowH - redH} width={colWidth} height={redH} fill="#e74c3c" rx="1" />
                    )}
                  </g>
                );
              })}

              {/* Dotted Trend Line */}
              <path
                d={displayHourlyData.map((item, idx) => {
                  const colX = 18 + idx * 43 + 7;
                  const totalH = (item.val / 60) * 85;
                  const colY = 100 - totalH;
                  return `${idx === 0 ? 'M' : 'L'} ${colX} ${colY}`;
                }).join(' ')}
                fill="none" stroke="#2c3e50" strokeWidth="1.5" strokeDasharray="3 3"
              />

              {/* Trend Dots */}
              {displayHourlyData.map((item, idx) => {
                const colX = 18 + idx * 43 + 7;
                const totalH = (item.val / 60) * 85;
                const colY = 100 - totalH;
                const active = idx === 4; // Mock active highlight indicator matching mockup (0 PM)
                return (
                  <g key={idx}>
                    {active && <line x1={colX} x2={colX} y1="0" y2="100" stroke="#000" strokeWidth="1" />}
                    <circle cx={colX} cy={colY} r={3} fill="#ffffff" stroke="#2c3e50" strokeWidth="2.2" />
                  </g>
                );
              })}

              {/* X labels */}
              {displayHourlyData.map((item, idx) => (
                <text key={idx} x={18 + idx * 43 + 7} y="114" fontSize="8.5" fontWeight={idx === 4 ? '700' : '500'} fill={T.muted} textAnchor="middle">
                  {item.label}
                </text>
              ))}
              <text x={412} y="114" fontSize="8" fontWeight="700" fill="#e74c3c" textAnchor="middle">5 PM (F)</text>
              <text x={455} y="114" fontSize="8" fontWeight="700" fill="#2ecc71" textAnchor="middle">6 PM (F)</text>
            </svg>
          </div>
        </div>

        {/* 2. Pollution Sources Panel */}
        <div style={styles.floatingContainer}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700 }}>Pollution Sources</div>
              <div style={{ fontSize: 10, color: T.muted, marginTop: 2 }}>Primary sources contributing to air pollution.</div>
            </div>
            <span style={{ fontSize: 14, color: T.muted }}>···</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1, justifyContent: 'center' }}>
            {[
              { label: 'Traffic', pct: spikeInjected ? 76 : 52, icon: '🚗' },
              { label: 'Construction', pct: spikeInjected ? 11 : 20, icon: '🏗️' },
              { label: 'Industry', pct: spikeInjected ? 7 : 14, icon: '🏭' },
              { label: 'Residential Emissions', pct: spikeInjected ? 4 : 9, icon: '🏠' },
              { label: 'Others', pct: spikeInjected ? 2 : 5, icon: '📦' },
            ].map(({ label, pct, icon }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', fontSize: 11, fontWeight: 600, gap: 8 }}>
                <span style={{ width: 18 }}>{icon}</span>
                <span style={{ width: 130, color: T.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>
                <div style={{ flex: 1, height: 6, background: T.barBg, borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: '#888', borderRadius: 3 }} />
                </div>
                <span style={{ width: 32, textAlign: 'right', color: T.text }}>{pct}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Wind Status Panel */}
        <div style={styles.floatingContainer}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700 }}>Wind Status</div>
              <div style={{ fontSize: 10, color: T.muted, marginTop: 2 }}>Wind speed and direction.</div>
            </div>
            <span style={{ fontSize: 14, color: T.muted }}>···</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flex: 1 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: T.text, lineHeight: 1 }}>
                7.5 <span style={{ fontSize: 11, fontWeight: 500, color: T.muted }}>km/h</span>
              </div>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#2ecc71', display: 'flex', alignItems: 'center', gap: 3 }}>
                <span>+10%</span> <span>↗</span>
              </div>
              <div style={{ fontSize: 8.5, color: T.muted, fontWeight: 500 }}>Than last hour</div>
              
              <div style={{
                marginTop: 8, padding: '4px 6px', background: T.periodTabBg, borderRadius: '4px',
                fontSize: 8, color: T.muted, display: 'flex', alignItems: 'center', gap: 4, maxWidth: 140
              }}>
                ℹ️ <span>Well Condition! Wind helping disperse pollutants</span>
              </div>
            </div>

            {/* Compass */}
            <svg width="84" height="84" viewBox="0 0 84 84">
              {/* Outer dial ring */}
              <circle cx="42" cy="42" r="38" fill="none" stroke={T.border} strokeWidth="1.2" />
              {/* Tick marks */}
              {Array.from({ length: 24 }).map((_, i) => {
                const angle = (i * 15 * Math.PI) / 180;
                const innerR = i % 6 === 0 ? 32 : 34;
                const outerR = 38;
                return (
                  <line
                    key={i}
                    x1={42 + innerR * Math.cos(angle)}
                    y1={42 + innerR * Math.sin(angle)}
                    x2={42 + outerR * Math.cos(angle)}
                    y2={42 + outerR * Math.sin(angle)}
                    stroke={T.border}
                    strokeWidth={i % 6 === 0 ? 1.2 : 0.6}
                  />
                );
              })}

              {/* Cardinal directions */}
              <text x="42" y="14" fontSize="9" fontWeight="800" fill={T.text} textAnchor="middle">N</text>
              <text x="42" y="76" fontSize="9" fontWeight="800" fill={T.text} textAnchor="middle">S</text>
              <text x="14" y="45" fontSize="9" fontWeight="800" fill={T.text} textAnchor="middle">W</text>
              <text x="70" y="45" fontSize="9" fontWeight="800" fill={T.text} textAnchor="middle">E</text>

              {/* Center point */}
              <circle cx="42" cy="42" r="2.5" fill="#e74c3c" />

              {/* Wind Speed center label */}
              <text x="42" y="40" fontSize="10" fontWeight="800" fill={T.text} textAnchor="middle">1</text>
              <text x="42" y="48" fontSize="6.5" fontWeight="600" fill={T.muted} textAnchor="middle">m/s</text>

              {/* Needle pointing SW/NE */}
              <line x1="42" y1="42" x2="22" y2="58" stroke="#e74c3c" strokeWidth="2" strokeLinecap="round" />
              {/* Arrow tip pointing SW */}
              <polygon points="22,58 27,57 23,53" fill="#e74c3c" />

              {/* Wind direction indicator marker on E */}
              <circle cx="70" cy="42" r="3.5" fill="none" stroke="#3498db" strokeWidth="1.8" />
              <line x1="42" y1="42" x2="70" y2="42" stroke="#3498db" strokeWidth="1" />
            </svg>
          </div>
        </div>

      </div>
    </div>
  );
}
