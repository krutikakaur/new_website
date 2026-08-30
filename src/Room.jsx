import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { useGLTF, Center, Environment, ContactShadows, OrbitControls, Html } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';

export default function Room({ onPopClick }) {
  // Load 3D model
const { scene } = useGLTF('./room_offical.glb')
  // Track hover state and timing
  const isLoaded = useRef(false);
  const currentHoveredItem = useRef(null);
  const hoverTimer = useRef(null);

  // Track active tooltip state
  const [activeTooltip, setActiveTooltip] = useState(null);

  // List of interactive object IDs
  const clickableItems = [
    'miffy',
    'bookshelf',
    'sticky_note',
    'cube068',
    'sphere002',
    'cone',
    'sphere006',
    'sphere007',
    'sphere003',
    'sphere004',
    'cylinder008',
  ];

  // Tooltip display labels
  const displayNames = {
    miffy: 'Creative Projects',
    bookshelf: 'CV/Resume',
    sticky_note: 'About Me',
    cube068: 'Technical Projects',
  };

  // Setup materials and store base colors on initial load
  useEffect(() => {
    if (!scene || isLoaded.current) return;

    scene.traverse((child) => {
      if (child.isMesh && child.material) {
        child.castShadow = true;
        child.receiveShadow = true;

        child.material = child.material.clone();

        const matName = child.material.name ? child.material.name.toLowerCase() : '';

        // Apply custom colors for specific items
        if (matName === 'bulb') {
          child.material.color.set('#fff3d0');
          child.material.emissive.set('#ffcc66');
          child.material.emissiveIntensity = 2.5;
        } else if (matName === 'miffy') {
          child.material.color.set('#E7E7E7');
          child.material.emissive.set('#FFFFFF');
          child.material.emissiveIntensity = 1.0;
        } else if (matName === 'clock') {
          child.material.color.set('#E7E7E7');
          child.material.emissive.set('#FFCC94');
          child.material.emissiveIntensity = 2.0;
        } else if (matName.includes('smiski')) {
          child.material.color.set('#E7E7E7');
          child.material.emissive.set('#95FF1C');
          child.material.emissiveIntensity = 1.0;
        }

        // Save base glow values to restore on pointer leave
        child.userData.baseEmissiveColor = child.material.emissive ? child.material.emissive.getHex() : 0x000000;
        child.userData.baseEmissiveIntensity = child.material.emissiveIntensity || 0;
      }
    });

    isLoaded.current = true;
  }, [scene]);

  // Identify which clickable group an object belongs to
  const getMatchedTarget = (mesh) => {
    if (!mesh) return null;

    const objName = mesh.name ? mesh.name.toLowerCase() : '';
    const matName = mesh.material && mesh.material.name ? mesh.material.name.toLowerCase() : '';
    const parentName = mesh.parent && mesh.parent.name ? mesh.parent.name.toLowerCase() : '';

    if (matName === 'miffy' || objName === 'miffy' || parentName === 'miffy') {
      return 'miffy';
    }

    if (objName.includes('book') || matName.includes('book') || parentName.includes('book')) {
      return 'bookshelf';
    }

    if (objName.includes('sticky_note') || matName.includes('sticky_note') || parentName.includes('sticky_note')) {
      return 'sticky_note';
    }

    for (let item of clickableItems) {
      if (objName.includes(item) || parentName.includes(item)) {
        return item;
      }
    }

    return null;
  };

  // Reset target object back to original glow state
  const clearHoverState = (itemToClear) => {
    document.body.style.cursor = 'default';
    setActiveTooltip(null);
    currentHoveredItem.current = null;

    scene.traverse((child) => {
      if (child.isMesh && child.material && getMatchedTarget(child) === itemToClear) {
        child.material.emissive.setHex(child.userData.baseEmissiveColor);
        child.material.emissiveIntensity = child.userData.baseEmissiveIntensity;
      }
    });
  };

  // Handle object click
  const handleClick = (e) => {
    e.stopPropagation();
    const target = getMatchedTarget(e.object);

    if (target && onPopClick) {
      onPopClick(target); //send current item (target) to trigger popup
    }
  };

  // Handle pointer enter and apply highlight glow
  const handlePointerOver = (e) => {
    e.stopPropagation();
    const target = getMatchedTarget(e.object);

    if (hoverTimer.current) {
      clearTimeout(hoverTimer.current);
    }

    if (currentHoveredItem.current === target) return;

    if (currentHoveredItem.current) {
      clearHoverState(currentHoveredItem.current);
    }

    if (!target) return;

    currentHoveredItem.current = target;
    document.body.style.cursor = 'pointer';

    // Position tooltip above object
    const pos = new THREE.Vector3();
    e.object.getWorldPosition(pos);

    setActiveTooltip({
      title: displayNames[target] || target,
      position: [pos.x, pos.y + 0.35, pos.z],
    });

    // Make target glow on hover
    scene.traverse((child) => {
      if (child.isMesh && child.material && getMatchedTarget(child) === target) {
        child.material.emissive.set('#18106a');
        child.material.emissiveIntensity = 5.0;
      }
    });
  };

  // Handle pointer leave with a small delay to prevent flicker
  const handlePointerOut = (e) => {
    e.stopPropagation();
    const target = getMatchedTarget(e.object);
    if (!target) return;

    hoverTimer.current = setTimeout(() => {
      if (currentHoveredItem.current === target) {
        clearHoverState(target);
      }
    }, 60);
  };

  return (
    <>
      {/* Camera Controls */}
      <OrbitControls makeDefault enableDamping dampingFactor={0.05} />

      {/* Lighting Setup */}
      <ambientLight intensity={0.09} color="#2a3a5b" />
      <directionalLight
        position={[5, 8, 5]}
        intensity={1.0}
        color="#fff0dd"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <Environment preset="apartment" environmentIntensity={0.22} />
      <pointLight position={[-1, 3, -1]} intensity={2.2} color="#ffcc88" distance={4} />
      <pointLight position={[1.5, 3, -1.5]} intensity={2.2} color="#ffcc88" distance={4} />
      <pointLight position={[0, 3, 1.5]} intensity={1.8} color="#ffcc88" distance={4} />

      {/* 3D Model */}
      <Center>
        <primitive
          object={scene}
          onClick={handleClick}
          onPointerOver={handlePointerOver}
          onPointerOut={handlePointerOut}
        />
      </Center>

      {/* Hover Tooltip */}
      {activeTooltip && (
        <Html position={activeTooltip.position} center distanceFactor={8} pointerEvents="none">
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.85)',
              color: '#ffffff',
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: '600',
              fontFamily: 'sans-serif',
            }}
          >
            {activeTooltip.title}
          </div>
        </Html>
      )}

      {/* UI Overlay Banner */}
      <Html fullscreen style={{ pointerEvents: 'none' }}>
        <div
          style={{
            position: 'absolute',
            bottom: '28px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(15, 23, 42, 0.8)',
            padding: '10px 24px',
            borderRadius: '9999px',
            color: '#ffffff',
            textAlign: 'center',
            fontFamily: 'sans-serif',
          }}
        >
          <h1 style={{ margin: 0, fontSize: '16px' }}>Personal Portfolio Room</h1>
          <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#94a3b8' }}>
            Hover & click objects to explore projects
          </p>
        </div>
      </Html>

      {/* Ground Shadows */}
      <ContactShadows position={[0, -0.01, 0]} opacity={0.5} scale={12} blur={2.5} />

      {/* Post-Processing Effects */}
      <EffectComposer>
        <Bloom intensity={0.7} luminanceThreshold={0.6} />
      </EffectComposer>
    </>
  );
}

// Preload 3D asset
useGLTF.preload('/room_offical.glb');
