import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { useGLTF, Center, Environment, ContactShadows, OrbitControls, Html } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';

// ============================================================================
// ROOM COMPONENT
// Renders baked 3D bedroom model, lights it, and makes certain
// objects clickable/hoverable so visitors can explore portfolio.
// `onPopClick` is a function passed in from the parent component — it runs
// whenever the user clicks something recognized as "clickable".
// ============================================================================

export default function Room({ onPopClick }) {

  // Load the 3D model file. `scene` is the whole loaded object hierarchy
  // (walls, furniture, Miffy, string lights — everything in one tree).
  const { scene } = useGLTF('/room_offical.glb');

  // A "ref" that just remembers whether we've already done our one-time
  // material setup below. Refs don't cause re-renders when changed, which
  // is exactly what we want for a simple "have we done this already?" flag.
  const initialized = useRef(false);

  // This holds info about whatever tooltip should currently be showing
  // (which text, and where in 3D space to float it). null = no tooltip.
  const [activeTooltip, setActiveTooltip] = useState(null);

  // --------------------------------------------------------------------
  // CONFIG: which objects are "clickable" and what each one is called
  // --------------------------------------------------------------------

  // These get matched against object names / material names / parent names
  // later on (see getMatchedTarget below).
  const clickableItems = [
    'miffy',
    'bookshelf',
    'sticky_note',
    'Cube068',
    'Sphere002',
    'Cone',
    'Sphere006',
    'Sphere007',
    'Sphere003',
    'Sphere004',
    'Cylinder008',
  ];

  // Friendly tooltip text shown to the user for each key above.
  // (Note: only a few keys have custom labels here — anything else falls
  // back to showing its raw key name, see displayNames[target] || target below.)
  const displayNames = {
    miffy: 'Creative Projects',
    bookshelf: 'CV/Resume',
    sticky_note: 'About Me',
    cube068: 'Technical Projects',
  };

  // ==========================================================================
  // 1. ONE-TIME SETUP (runs once, right after the model loads)
  // ==========================================================================
  // Why this is needed: many objects in the model share the SAME material
  // (e.g. every book might use one "book" material). If we don't clone each
  // mesh's material individually, changing one object's glow would
  // accidentally change every other object using that same material too.
  //
  // While we're here, we also manually fix a few specific materials that
  // lost their proper color/glow data during an earlier baking mishap
  // (bulb, miffy, clock, smiski) by hardcoding sensible colors for them.
  useEffect(() => {
    // Guard clause: do nothing if the model isn't loaded yet, or if we've
    // already run this setup once before (prevents doing it repeatedly).
    if (!scene || initialized.current) return;

    // Walk through EVERY object in the model, one at a time.
    scene.traverse((child) => {

      // We only care about actual visible 3D shapes ("meshes") that have
      // a material attached, skip empty groups, cameras, lights, etc.
      if (child.isMesh && child.material) {

        // Let this object cast a shadow onto others, and receive shadows
        // cast onto it by other objects (needed for realistic lighting).
        child.castShadow = true;
        child.receiveShadow = true;

        // Make an independent copy of this object's material, so changing
        // it later won't affect other objects that originally shared it.
        child.material = child.material.clone();

        // Get this material's name in lowercase, so text comparisons
        // below aren't case-sensitive (e.g. "Bulb" and "bulb" both match).
        let matName = '';
        if (child.material.name) {
          matName = child.material.name.toLowerCase();
        }

        // Manually fix specific materials that lost their real bake data.
        // Each one gets a base color + a glow color + how strong that glow is.
        if (matName === 'bulb') {
          // String light bulbs
          child.material.color.set('#fff3d0');
          child.material.emissive.set('#ffcc66');
          child.material.emissiveIntensity = 2.5;
        } else if (matName === 'miffy') {
          // Miffy plush
          child.material.color.set('#E7E7E7');
          child.material.emissive.set('#FFFFFF');
          child.material.emissiveIntensity = 1.0;
        } else if (matName === 'clock') {
          // Alarm clock display
          child.material.color.set('#E7E7E7');
          child.material.emissive.set('#FFCC94');
          child.material.emissiveIntensity = 2.0;
        } else if (matName.includes('smiski')) {
          // Smiski figure
          child.material.color.set('#E7E7E7');
          child.material.emissive.set('#95FF1C');
          child.material.emissiveIntensity = 1.0;
        }

        // Remember this object's "resting" (non-hovered) glow settings,
        // so that later, when the mouse moves away, we know exactly what
        // color/strength to reset it back to instead of guessing.
        if (child.material.emissive) {
          child.userData.baseEmissiveColor = child.material.emissive.getHex();
        } else {
          child.userData.baseEmissiveColor = 0x000000; // no glow = black
        }

        if (child.material.emissiveIntensity) {
          child.userData.baseEmissiveIntensity = child.material.emissiveIntensity;
        } else {
          child.userData.baseEmissiveIntensity = 0;
        }
      }
    });

    // Mark setup as done so this whole block never runs again.
    initialized.current = true;
  }, [scene]); // Re-run this effect only if `scene` itself changes.

  // ==========================================================================
  // HELPER — figure out which "clickable key" (if any) a given mesh belongs to
  // ==========================================================================
  // This one function replaces the old duplicated getTargetName + checkIsMatch
  // functions — both did almost the same name-matching, so we only need it once.
  //
  // It checks three things about the mesh: its own name, its material's name,
  // and its parent object's name — because in a complex model, sometimes the
  // "logical" object (like "miffy") shows up as a name on a parent group
  // instead of directly on the mesh clicked.
  const getMatchedTarget = (mesh) => {
    const objName = mesh.name ? mesh.name.toLowerCase() : '';
    const matName = mesh.material && mesh.material.name ? mesh.material.name.toLowerCase() : '';
    const parentName = mesh.parent && mesh.parent.name ? mesh.parent.name.toLowerCase() : '';

    // Special case: Miffy needs an EXACT match (not just "includes"),
    // otherwise something like "miffy_face" material could falsely match
    // other unrelated objects that happen to contain "miffy" in their name.
    if (matName === 'miffy' || objName === 'miffy' || parentName === 'miffy') {
      return 'miffy';
    }

    // Special case: anything book-related (shelf or individual books)
    // all count as one clickable "bookshelf" item.
    if (
      objName.includes('bookshelf') || objName.includes('book') ||
      parentName.includes('bookshelf') || parentName.includes('book') ||
      matName.includes('bookshelf') || matName.includes('book')
    ) {
      return 'bookshelf';
    }

    // Special case: sticky notes
    if (
      matName.includes('sticky_note') ||
      objName.includes('sticky_note') ||
      parentName.includes('sticky_note')
    ) {
      return 'sticky_note';
    }

    // For everything else in our clickableItems list, just check if the
    // object's own name or its parent's name contains that keyword.
    for (let i = 0; i < clickableItems.length; i++) {
      const item = clickableItems[i].toLowerCase();
      if (objName.includes(item) || parentName.includes(item)) {
        return item;
      }
    }

    // Nothing matched — this object isn't meant to be clickable.
    return null;
  };

  // ==========================================================================
  // 2. CLICK HANDLER
  // ==========================================================================
  // Runs whenever the user clicks on ANY part of the 3D model.
  const handleClick = (e) => {
    // Stop this click from also being treated as a click on anything
    // "behind" this object in the 3D scene.
    e.stopPropagation();

    // Figure out which clickable item (if any) was actually clicked.
    const target = getMatchedTarget(e.object);

    // If it matched something real, tell the parent component to react
    // (e.g. open a project panel, navigate somewhere, etc).
    if (target !== null && onPopClick) {
      onPopClick();
    }
  };

  // ==========================================================================
  // 3. HOVER START (mouse moves ONTO a clickable object)
  // ==========================================================================
  const handlePointerOver = (e) => {
    e.stopPropagation();

    // Handy for debugging, shows exactly what you're hovering over
    // in the browser console, useful for figuring out real object names.
   console.table({
  Mesh: e.object.name,
  Parent: e.object.parent?.name,
  Material: e.object.material?.name,
});

    const target = getMatchedTarget(e.object);

    // Only do anything if we hovered a genuinely clickable item.
    if (target !== null) {
      // Show a hand/pointer cursor so it's obvious this is clickable.
      document.body.style.cursor = 'pointer';

      // Find this object's real position in 3D space (not just its
      // position relative to its parent), so we can float a tooltip
      // label right above it correctly.
      const worldPos = new THREE.Vector3();
      e.object.getWorldPosition(worldPos);

      // Show the tooltip: use the friendly display name if we have one,
      // otherwise just show the raw key. Float it slightly above the object.
      setActiveTooltip({
        title: displayNames[target] || target,
        position: [worldPos.x, worldPos.y + 0.35, worldPos.z],
      });

      // Make every mesh belonging to this same target glow, so the WHOLE
      // object lights up (not just the one triangle the mouse happens to
      // be over), important since one logical object can be made of many
      // separate mesh pieces.
      scene.traverse((child) => {
        if (child.isMesh && child.material) {
          if (getMatchedTarget(child) === target) {
            child.material.emissive.set('#18106a');
            child.material.emissiveIntensity = 5.0;
          }
        }
      });
    }
  };

  // ==========================================================================
  // 4. HOVER END (mouse moves OFF a clickable object)
  // ==========================================================================
  const handlePointerOut = (e) => {
    e.stopPropagation();

    // Reset cursor and hide the tooltip.
    document.body.style.cursor = 'default';
    setActiveTooltip(null);

    const target = getMatchedTarget(e.object);

    if (target !== null) {
      // Put every mesh belonging to this target back to its original
      // (non-glowing) appearance, using the "base" values we saved
      // during the one-time setup step earlier.
      scene.traverse((child) => {
        if (child.isMesh && child.material) {
          if (getMatchedTarget(child) === target && child.userData.baseEmissiveColor !== undefined) {
            child.material.emissive.setHex(child.userData.baseEmissiveColor);
            child.material.emissiveIntensity = child.userData.baseEmissiveIntensity;
          }
        }
      });
    }
  };

  // =============
  //    RENDER 
  // =============
  return (
    <>
      {/* Lets the user drag to rotate the camera around the room, and
          scroll/pinch to zoom. `enableDamping` gives it smooth, slightly
          "floaty" momentum instead of stopping instantly. */}
      <OrbitControls makeDefault enableDamping dampingFactor={0.05} />

      <ambientLight intensity={0.09} color="#2a3a5b" />

      <directionalLight
        position={[5, 8, 5]}
        intensity={1.0}
        color="#fff0dd"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-bias={-0.0005}
      >
        {/* Defines the boundary box for shadow calculations — tightened
            to roughly match the room's size for sharper shadows. */}
        <orthographicCamera attach="shadow-camera" args={[-6, 6, 6, -6, 0.1, 20]} />
      </directionalLight>

      {/* HDRI-based environment lighting, adds realistic ambient color
          and soft reflections instead of flat grey everywhere. */}
      <Environment preset="apartment" environmentIntensity={0.22} />

      {/* Extra warm point lights placed roughly where the string lights
          hang, so they cast actual warm light onto nearby surfaces —
          not just glow themselves, but light up what's around them too. */}
      <pointLight position={[-1, 3, -1]} intensity={2.2} color="#ffcc88" distance={4} decay={2} />
      <pointLight position={[1.5, 3, -1.5]} intensity={2.2} color="#ffcc88" distance={4} decay={2} />
      <pointLight position={[0, 3, 1.5]} intensity={1.8} color="#ffcc88" distance={4} decay={2} />
      <pointLight position={[1.8, 0.8, -0.5]} intensity={0.05} color="#88ffcc" distance={0.6} decay={2} />

      {/* Centers the model in the scene automatically, regardless of
          where its original pivot point was in Blender. */}
      <Center>
        <primitive
          object={scene}
          onClick={handleClick}
          onPointerOver={handlePointerOver}
          onPointerOut={handlePointerOut}
        />
      </Center>

      {/* FLOATING TOOLTIP — only rendered while something is being hovered.
          `Html` from drei lets us place normal HTML/CSS at a 3D position,
          so it moves with the camera like it's part of the scene. */}
      {activeTooltip && (
        <Html position={activeTooltip.position} center distanceFactor={8}>
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.85)',
              color: '#ffffff',
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: '600',
              fontFamily: 'sans-serif',
              whiteSpace: 'nowrap',
              boxShadow: '0px 4px 12px rgba(0,0,0,0.25)',
              border: '1px solid rgba(255,255,255,0.15)',
              backdropFilter: 'blur(4px)',
              pointerEvents: 'none', // so the tooltip itself can't be clicked/hovered
              transform: 'translateY(-10px)',
              transition: 'opacity 0.15s ease-in-out',
            }}
          >
            {activeTooltip.title}
          </div>
        </Html>
      )}

      {/* FIXED TITLE BANNER — always visible at the bottom of the screen,
          regardless of camera angle */}
      <Html fullscreen style={{ pointerEvents: 'none' }}>
        <div
          style={{
            position: 'absolute',
            bottom: '28px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(15, 23, 42, 0.8)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            padding: '10px 24px',
            borderRadius: '9999px',
            color: '#ffffff',
            textAlign: 'center',
            fontFamily: 'sans-serif',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.35)',
            zIndex: 10,
          }}
        >
          <h1 style={{ margin: 0, fontSize: '16px', fontWeight: '600', letterSpacing: '0.4px' }}>
            Personal Portfolio Room
          </h1>
          <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#94a3b8' }}>
            Hover & click objects to explore projects
          </p>
        </div>
      </Html>


      <ContactShadows
        position={[0, -0.01, 0]}
        opacity={0.5}
        scale={12}
        blur={2.5}
        far={4}
      />

      {/* Post-processing pass: makes genuinely bright pixels (string
          lights, glowing hover highlights).*/}
      <EffectComposer>
        <Bloom
          intensity={0.7}
          luminanceThreshold={0.6}
          luminanceSmoothing={0.3}
          mipmapBlur
        />
      </EffectComposer>
    </>
  );
}

// Preload the model file as soon as this file is imported, so it starts
// downloading before the component even mounts — reduces load-in delay.
useGLTF.preload('/room_offical.glb');