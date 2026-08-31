import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import Room from './Room';

const popUpData = { //store the possible clickable items and their descriptions
  miffy: {
    title: 'Personal Art Projects!',
    description: 'filler',
    page: "art.html" },
  bookshelf: {
    title: 'Resume/Reach Out!',
    description: 'filler'},
  sticky_note: {
    title: 'About Me',
    description: 'filler'},
  cube068: {
    title: 'Technical Projects',
    description: 'filler',
    page: "projects.html"},
  };
  
export default function App() {

  const [selectedItem, setSelectedItem] = useState(null);//check which and if and item is selected, initally set to null

  const handleOpenPop = (itemName) => {//pass itemName 
    setSelectedItem(itemName);//store itemname
  };

  // Called when the user clicks the "Close" button on the modal.
  const handleClosePop = () => {
    setSelectedItem(null);//set null
  };

  const currentItem = popUpData[selectedItem] || {
    title: 'None Selected',
    description: 'not found' };
  
  const handleGoToPage = (pageUrl) => {
    if (pageUrl) {
      window.location.href = pageUrl;
    } 
  };
  
return (
  <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>

    {/* The 3D viewport */}
    <Canvas shadows camera={{ position: [0, 2, 5], fov: 45 }}>
      <Room onPopClick={handleOpenPop} />
    </Canvas>

    {/* The popup modal — rendered only when `selectedItem` is not null */}
    {selectedItem && (
      <div style={overlayStyle} onClick={handleClosePop}>
        {/* stopPropagation prevents clicking inside the card from closing it */}
        <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
          <h2>{currentItem.title}</h2>
          <p style={{ marginTop: '1rem', lineHeight: '1.6', color: '#cbd5e1' }}>
            {currentItem.description}
          </p>

          <div style={buttonContainerStyle}>
            {currentItem.page && (
              <button
                onClick={() => handleGoToPage(currentItem.page)}
                style={actionButtonStyle}
              >
                Visit Page
              </button>
            )}
            <button onClick={handleClosePop} style={closeButtonStyle}>
              Close
            </button>
          </div>
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

//styling for action button
const actionButtonStyle = {
  padding: '0.5rem 1.5rem',
  backgroundColor: '#3b82f6',
  color: '#fff',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontWeight: '600',
};

// Styling for the "Close" button inside the modal.

const closeButtonStyle = {
  padding: '0.5rem 1.5rem',
  backgroundColor: '#ff4b5c',
  color: '#fff',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontWeight: '600',
};

const buttonContainerStyle = {
  marginTop: '1.5rem',
  display: 'flex',
  gap: '10px',
  justifyContent: 'center',
};
