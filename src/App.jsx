import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import Room from './Room';

// ============================================================================
// APP COMPONENT
// This is the top-level page. It sets up the 3D <Canvas> (the "viewport"
// that everything 3D gets drawn into) and also handles the popup/modal
// that appears when someone clicks a portfolio item inside the Room.
// ============================================================================
export default function App() {

  // Tracks whether the popup modal is currently open or closed.
  // `onClickOn` = the current value (true/false).
  // `setonClickOn` = the function we call to change that value.
  const [onClickOn, setonClickOn] = useState(false);

  // Called by Room whenever the user clicks a clickable object.
  // We just flip the modal open.
  const handleOpenPop = () => {
    setonClickOn(true);
  };

  // Called when the user clicks the "Close" button on the modal.
  const handleClosePop = () => {
    setonClickOn(false);
  };

  return (
    // Outer wrapper — fills the entire browser window.
    // `position: 'relative'` is important: it lets the modal below
    // (which uses `position: 'absolute'`) position itself relative to
    // THIS div, instead of relative to the whole page.
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>

      {/* The 3D viewport.*/}
      <Canvas shadows camera={{ position: [0, 2, 5], fov: 45 }}>
        {/* Render the room, and pass down our "open popup" function so
            Room can call it whenever something gets clicked inside. */}
        <Room onPopClick={handleOpenPop} />
      </Canvas>

      {/* The popup modal — only rendered at all when `onClickOn` is true.
          This is a common React pattern: `condition && <Thing />` means
          "only show <Thing /> if condition is true". */}
      {onClickOn && (
        <div style={overlayStyle}>
          {/* The actual modal box itself */}
          <div style={modalStyle}>
            <h2>Featured Art & Projects</h2>
            <p>Here is your artwork gallery or project summary!</p>

            {/* Clicking this button closes the modal by calling our
                handleClosePop function, which sets onClickOn back to false */}
            <button onClick={handleClosePop} style={buttonStyle}>
              Close
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

// Covers the entire screen with a dark, semi-transparent overlay,
// and centers whatever's inside it (the modal box) both horizontally
// and vertically using flexbox.
const overlayStyle = {
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  backgroundColor: 'rgba(0, 0, 0, 0.75)', // black at 75% opacity
  display: 'flex',
  justifyContent: 'center', // center horizontally
  alignItems: 'center',     // center vertically
  zIndex: 10, // makes sure this sits ABOVE the 3D canvas, not behind it
};

// The actual visible popup box: dark background, white text,
// rounded corners, centered text, capped width so it doesn't stretch
// too wide on large screens.
const modalStyle = {
  backgroundColor: '#1a1a2e',
  color: '#ffffff',
  padding: '2rem',
  borderRadius: '12px',
  textAlign: 'center',
  maxWidth: '500px',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
};

// Styling for the "Close" button inside the modal.
const buttonStyle = {
  marginTop: '1.5rem',
  padding: '0.5rem 1.5rem',
  backgroundColor: '#ff4b5c',
  color: '#fff',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
};