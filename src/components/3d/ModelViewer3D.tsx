import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RotateCw, Maximize2, Eye, Layers, Palette, Sparkles, RefreshCw } from 'lucide-react';

interface ModelViewer3DProps {
  modelType?: string;
  selectedColor?: string;
  productName: string;
  dimensions?: string;
}

const COLOR_MAP: Record<string, number> = {
  // Whites & Light variants
  'Pure White': 0xffffff,
  'Arctic White': 0xf8fafc,
  'Opal White': 0xeff6ff,
  'White': 0xfafafa,
  'Pearl White': 0xf4f4f5,
  'Pure White Resin': 0xf1f5f9,
  'Pure White/Cyan': 0xf8fafc,
  'Crimson/White': 0xf1f5f9,
  'Silver/Black': 0xd1d5db,

  // Dark & Grays
  'Matte Black': 0x18181b,
  'Obsidian Black': 0x09090b,
  'Carbon Black': 0x1c1917,
  'Slate Grey': 0x64748b,
  'Steel Grey': 0x475569,
  'Matte Grey (Primer Ready)': 0x6b7280,
  'Titanium Silver': 0x94a3b8,
  'Sand Dune': 0xd4a373,

  // Vibrant Colors
  'Electric Blue': 0x06b6d4,
  'Cosmic Blue': 0x3b82f6,
  'Ice Blue': 0x38bdf8,
  'Cyber Orange': 0xf97316,
  'Emerald Green': 0x10b981,
  'Forest Green': 0x047857,
  'Emerald Silk': 0x059669,
  'Silk Gold': 0xd97706,
  'Midnight Purple': 0x8b5cf6,
  'Signal Yellow': 0xeab308,
  'Neon Green Resin': 0x22c55e,
  'Ruby Red Translucent': 0xe11d48,
  'Dual Tone Gold/Navy': 0x1e3a8a,
};

export const ModelViewer3D: React.FC<ModelViewer3DProps> = ({
  modelType = 'mesh_stand',
  selectedColor = 'Electric Blue',
  productName,
  dimensions,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [wireframe, setWireframe] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const [layerEffect, setLayerEffect] = useState(true);
  const [studioLightMode, setStudioLightMode] = useState(false);
  const [activeColor, setActiveColor] = useState(selectedColor);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setActiveColor(selectedColor);
  }, [selectedColor]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 3.5, 6);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.replaceChildren(renderer.domElement);

    // Print Bed Grid (Subtle futuristic build plate)
    const gridColor1 = studioLightMode ? 0x0284c7 : 0x06b6d4;
    const gridColor2 = studioLightMode ? 0xd1d5db : 0x27272a;
    const gridHelper = new THREE.GridHelper(6, 12, gridColor1, gridColor2);
    gridHelper.position.y = -1.2;
    if (layerEffect) {
      scene.add(gridHelper);
    }

    // Bed border
    const bedGeo = new THREE.BoxGeometry(6.2, 0.05, 6.2);
    const bedMat = new THREE.MeshStandardMaterial({
      color: studioLightMode ? 0xe2e8f0 : 0x121216,
      roughness: 0.85,
      metalness: 0.15,
    });
    const bedMesh = new THREE.Mesh(bedGeo, bedMat);
    bedMesh.position.y = -1.25;
    bedMesh.receiveShadow = true;
    if (layerEffect) {
      scene.add(bedMesh);
    }

    // Lighting setup balanced for both light and dark models
    const isWhiteColor =
      activeColor.toLowerCase().includes('white') ||
      activeColor.toLowerCase().includes('opal') ||
      activeColor.toLowerCase().includes('arctic');

    const ambientLight = new THREE.AmbientLight(0xffffff, isWhiteColor ? 1.0 : 1.3);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, isWhiteColor ? 2.2 : 2.6);
    keyLight.position.set(5, 8, 5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x06b6d4, isWhiteColor ? 1.4 : 1.8);
    rimLight.position.set(-5, 3, -5);
    scene.add(rimLight);

    const fillLight = new THREE.PointLight(0x8b5cf6, 1.2, 10);
    fillLight.position.set(0, 4, 3);
    scene.add(fillLight);

    // Mesh Creation based on modelType
    const modelGroup = new THREE.Group();
    const hexColor = COLOR_MAP[activeColor] ?? (COLOR_MAP['Pure White'] || 0xffffff);

    const meshMaterial = new THREE.MeshStandardMaterial({
      color: hexColor,
      roughness: isWhiteColor ? 0.3 : 0.35,
      metalness: isWhiteColor ? 0.15 : 0.25,
      wireframe: wireframe,
    });

    // Create 3D representation based on product type
    if (modelType === 'mesh_vase') {
      const geom = new THREE.CylinderGeometry(0.8, 1.2, 3, 24, 32, true);
      const pos = geom.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const y = pos.getY(i);
        const angle = Math.atan2(pos.getZ(i), pos.getX(i));
        const twist = y * 0.8;
        const wave = Math.sin(angle * 6 + twist) * 0.18;
        pos.setX(i, pos.getX(i) + Math.cos(angle) * wave);
        pos.setZ(i, pos.getZ(i) + Math.sin(angle) * wave);
      }
      geom.computeVertexNormals();
      const vase = new THREE.Mesh(geom, meshMaterial);
      vase.position.y = 0.3;
      vase.castShadow = true;
      modelGroup.add(vase);
    } else if (modelType === 'mesh_planter') {
      const geom = new THREE.CylinderGeometry(1.4, 1.0, 2.2, 6, 16);
      const planter = new THREE.Mesh(geom, meshMaterial);
      planter.position.y = -0.1;
      planter.castShadow = true;
      modelGroup.add(planter);

      // Inner rim
      const innerGeom = new THREE.CylinderGeometry(1.2, 0.85, 2.1, 6);
      const innerMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.9 });
      const inner = new THREE.Mesh(innerGeom, innerMat);
      inner.position.y = 0.05;
      modelGroup.add(inner);
    } else if (modelType === 'mesh_keychain') {
      // Keychain body
      const baseGeo = new THREE.BoxGeometry(3.2, 0.2, 1.4);
      const base = new THREE.Mesh(baseGeo, meshMaterial);
      base.castShadow = true;
      modelGroup.add(base);

      // Keychain loop
      const ringGeo = new THREE.TorusGeometry(0.5, 0.1, 16, 32);
      const ringMat = new THREE.MeshStandardMaterial({ color: 0xd1d5db, metalness: 0.9, roughness: 0.1 });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.set(-1.8, 0, 0);
      ring.rotation.x = Math.PI / 2;
      modelGroup.add(ring);

      // Embossed letters representation
      const letterGeo = new THREE.BoxGeometry(2.2, 0.15, 0.7);
      const letterMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });
      const letters = new THREE.Mesh(letterGeo, letterMat);
      letters.position.set(0.1, 0.15, 0);
      modelGroup.add(letters);
    } else if (modelType === 'mesh_miniature') {
      // Resin stylized figurine
      const bodyGeo = new THREE.ConeGeometry(0.9, 2.2, 12);
      const headGeo = new THREE.SphereGeometry(0.6, 16, 16);
      const wingGeo = new THREE.BoxGeometry(2.4, 0.1, 1.2);
      const body = new THREE.Mesh(bodyGeo, meshMaterial);
      const head = new THREE.Mesh(headGeo, meshMaterial);
      const wings = new THREE.Mesh(wingGeo, meshMaterial);
      body.position.y = 0;
      head.position.y = 1.3;
      wings.position.set(0, 0.6, -0.3);
      wings.rotation.x = 0.3;
      modelGroup.add(body);
      modelGroup.add(head);
      modelGroup.add(wings);
    } else if (modelType === 'mesh_organizer') {
      // Honeycomb hex cups
      const hex1 = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 1.8, 6), meshMaterial);
      const hex2 = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 1.4, 6), meshMaterial);
      const hex3 = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 1.0, 6), meshMaterial);
      hex1.position.set(-0.7, -0.3, 0);
      hex2.position.set(0.7, -0.5, 0);
      hex3.position.set(0, -0.7, 1.1);
      modelGroup.add(hex1, hex2, hex3);
    } else {
      // Articulated Stand
      const baseGeo = new THREE.BoxGeometry(2.4, 0.2, 2.0);
      const backGeo = new THREE.BoxGeometry(2.2, 2.4, 0.2);
      const lipGeo = new THREE.BoxGeometry(2.2, 0.4, 0.3);

      const base = new THREE.Mesh(baseGeo, meshMaterial);
      const back = new THREE.Mesh(backGeo, meshMaterial);
      const lip = new THREE.Mesh(lipGeo, meshMaterial);

      base.position.set(0, -1.1, 0);
      back.position.set(0, 0.1, -0.5);
      back.rotation.x = -0.35;
      lip.position.set(0, -0.85, 0.7);

      modelGroup.add(base, back, lip);
    }

    scene.add(modelGroup);
    setIsLoading(false);

    // Mouse Interaction (Orbiting)
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };

    const handlePointerDown = (e: PointerEvent) => {
      isDragging = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - previousMousePosition.x;
      const deltaY = e.clientY - previousMousePosition.y;

      modelGroup.rotation.y += deltaX * 0.01;
      modelGroup.rotation.x += deltaY * 0.01;

      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const handlePointerUp = () => {
      isDragging = false;
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      camera.position.z = THREE.MathUtils.clamp(camera.position.z + e.deltaY * 0.005, 3, 10);
    };

    const dom = renderer.domElement;
    dom.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    dom.addEventListener('wheel', handleWheel, { passive: false });

    // Render loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      if (autoRotate && !isDragging) {
        modelGroup.rotation.y += 0.008;
      }

      renderer.render(scene, camera);
    };
    animate();

    // Handle Resize
    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      dom.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      dom.removeEventListener('wheel', handleWheel);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, [modelType, activeColor, wireframe, autoRotate, layerEffect, studioLightMode]);

  return (
    <div
      className={`relative w-full h-[380px] md:h-[460px] rounded-2xl border transition-colors duration-300 overflow-hidden group shadow-2xl ${
        studioLightMode
          ? 'bg-gradient-to-b from-slate-100 via-white to-slate-200 border-slate-300'
          : 'bg-gradient-to-b from-neutral-900/90 via-neutral-950 to-neutral-900/90 border-neutral-800'
      }`}
    >
      {/* 3D Canvas Mount */}
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing touch-none" />

      {/* Loading Overlay */}
      {isLoading && (
        <div className={`absolute inset-0 flex items-center justify-center backdrop-blur-sm z-20 ${
          studioLightMode ? 'bg-white/80' : 'bg-neutral-950/80'
        }`}>
          <div className="flex flex-col items-center gap-3">
            <RefreshCw className="w-8 h-8 text-cyan-500 animate-spin" />
            <p className={`text-xs font-mono uppercase tracking-widest ${
              studioLightMode ? 'text-neutral-700' : 'text-neutral-400'
            }`}>
              Loading 3D Mesh Geometry...
            </p>
          </div>
        </div>
      )}

      {/* Top Overlay Badges */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none z-10">
        <div className={`flex items-center gap-2 backdrop-blur-md px-3 py-1.5 rounded-xl border shadow-lg pointer-events-auto ${
          studioLightMode
            ? 'bg-white/90 border-slate-300 text-slate-800 shadow-slate-200'
            : 'bg-neutral-900/90 border-neutral-700/60 text-neutral-200 shadow-black/40'
        }`}>
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span className="text-xs font-mono tracking-wide font-semibold">3D INTERACTIVE INSPECT</span>
        </div>

        {dimensions && (
          <div className={`backdrop-blur-md px-3 py-1.5 rounded-xl border text-xs font-mono pointer-events-auto ${
            studioLightMode
              ? 'bg-white/90 border-slate-300 text-cyan-700'
              : 'bg-neutral-900/90 border-neutral-700/60 text-cyan-300'
          }`}>
            {dimensions}
          </div>
        )}
      </div>

      {/* Bottom Controls Toolbar */}
      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between pointer-events-auto z-10">
        <div className={`flex items-center gap-1.5 backdrop-blur-md p-1.5 rounded-xl border shadow-xl ${
          studioLightMode
            ? 'bg-white/95 border-slate-300 shadow-slate-300/60'
            : 'bg-neutral-900/90 border-neutral-700/60 shadow-xl'
        }`}>
          <button
            onClick={() => setAutoRotate(!autoRotate)}
            className={`p-2 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
              autoRotate
                ? 'bg-cyan-500/20 text-cyan-500 border border-cyan-500/40'
                : studioLightMode ? 'text-slate-600 hover:text-slate-900' : 'text-neutral-400 hover:text-white'
            }`}
            title="Toggle Turntable Rotation"
          >
            <RotateCw className={`w-4 h-4 ${autoRotate ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Rotate</span>
          </button>

          <button
            onClick={() => setWireframe(!wireframe)}
            className={`p-2 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
              wireframe
                ? 'bg-indigo-500/20 text-indigo-500 border border-indigo-500/40'
                : studioLightMode ? 'text-slate-600 hover:text-slate-900' : 'text-neutral-400 hover:text-white'
            }`}
            title="Inspect Wireframe Topology"
          >
            <Eye className="w-4 h-4" />
            <span className="hidden sm:inline">Wireframe</span>
          </button>

          <button
            onClick={() => setLayerEffect(!layerEffect)}
            className={`p-2 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
              layerEffect
                ? 'bg-cyan-500/20 text-cyan-500 border border-cyan-500/40'
                : studioLightMode ? 'text-slate-600 hover:text-slate-900' : 'text-neutral-400 hover:text-white'
            }`}
            title="Toggle Print Bed Grid"
          >
            <Layers className="w-4 h-4" />
            <span className="hidden sm:inline">Grid</span>
          </button>

          <button
            onClick={() => setStudioLightMode(!studioLightMode)}
            className={`p-2 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
              studioLightMode
                ? 'bg-amber-500/20 text-amber-600 border border-amber-500/40 font-semibold'
                : 'text-neutral-400 hover:text-white'
            }`}
            title={studioLightMode ? "Switch to Dark Studio" : "Switch to Clean White Studio Backdrop"}
          >
            <Palette className="w-4 h-4" />
            <span className="hidden sm:inline">{studioLightMode ? 'Dark Bed' : 'White Bed'}</span>
          </button>
        </div>

        <div className={`text-[11px] font-mono px-3 py-1.5 rounded-lg border hidden sm:block ${
          studioLightMode
            ? 'bg-white/90 text-slate-600 border-slate-300'
            : 'bg-neutral-900/80 text-neutral-400 border-neutral-800'
        }`}>
          Drag to Orbit • Scroll to Zoom
        </div>
      </div>
    </div>
  );
};
