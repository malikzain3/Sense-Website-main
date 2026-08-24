import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import "./Gallery.css";
import { motion, useScroll, useTransform, useMotionValue } from "framer-motion";

const Gallery = () => {
  const navigate = useNavigate();
  const sectionRef = useRef(null);
  const trackRef = useRef(null);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGallery = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/gallery?limit=6');
        if (!response.ok) throw new Error('Failed to fetch gallery images');
        const data = await response.json();
        setImages(data.map(item => item.image_url));
      } catch (error) {
        console.error("Error fetching gallery images:", error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchGallery();
  }, []);

  // --- Scroll-based parallax ---
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"]
  });
  const scrollX = useTransform(scrollYProgress, [0, 1], [0, -600]);

  // --- Drag-based scroll ---
  const dragX = useMotionValue(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [dragStartValue, setDragStartValue] = useState(0);

  const velocityRef = useRef(0);
  const lastXRef = useRef(0);
  const rafRef = useRef(null);

  const loopedImages = images.length > 0 ? [...images, ...images, ...images] : [];
  const singleSetWidthRef = useRef(0);

  useEffect(() => {
    if (trackRef.current && images.length > 0) {
      singleSetWidthRef.current = trackRef.current.scrollWidth / 3;
    }
  }, [images]);

  const wrapDragX = useCallback((value) => {
    const singleSetWidth = singleSetWidthRef.current;
    if (singleSetWidth === 0) return value;
    let wrapped = value % singleSetWidth;
    if (wrapped > 0) wrapped -= singleSetWidth;
    return wrapped;
  }, []);

  const combinedX = useTransform(
    [scrollX, dragX],
    ([scrollVal, dragVal]) => scrollVal + dragVal
  );

  const handleMouseDown = (e) => {
    cancelAnimationFrame(rafRef.current);
    setIsDragging(true);
    setStartX(e.pageX);
    setDragStartValue(dragX.get());
    lastXRef.current = e.pageX;
    velocityRef.current = 0;
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const currentX = e.pageX;
    const walk = (currentX - startX) * 1.2;
    dragX.set(wrapDragX(dragStartValue + walk));
    velocityRef.current = currentX - lastXRef.current;
    lastXRef.current = currentX;
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    setIsDragging(false);

    const decelerate = () => {
      velocityRef.current *= 0.95;
      if (Math.abs(velocityRef.current) > 0.5) {
        dragX.set(wrapDragX(dragX.get() + velocityRef.current));
        rafRef.current = requestAnimationFrame(decelerate);
      }
    };
    decelerate();
  };

  const handleTouchStart = (e) => {
    cancelAnimationFrame(rafRef.current);
    setIsDragging(true);
    setStartX(e.touches[0].pageX);
    setDragStartValue(dragX.get());
    lastXRef.current = e.touches[0].pageX;
    velocityRef.current = 0;
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    const currentX = e.touches[0].pageX;
    const walk = (currentX - startX) * 1.2;
    dragX.set(wrapDragX(dragStartValue + walk));
    velocityRef.current = currentX - lastXRef.current;
    lastXRef.current = currentX;
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);

    const decelerate = () => {
      velocityRef.current *= 0.95;
      if (Math.abs(velocityRef.current) > 0.5) {
        dragX.set(wrapDragX(dragX.get() + velocityRef.current));
        rafRef.current = requestAnimationFrame(decelerate);
      }
    };
    decelerate();
  };

  useEffect(() => {
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  if (loading) {
    return (
      <div id='Gallery'>
        <div className="Gallery-Heading">Gallery</div>
        <p style={{ textAlign: 'center', padding: '50px' }}>Loading gallery...</p>
      </div>
    );
  }

  return (
    <div id='Gallery'>
      <div className="Gallery-Heading">Gallery</div>

      {images.length === 0 ? (
        <p style={{ textAlign: 'center', padding: '50px' }}>No images available.</p>
      ) : (
        <div
          ref={sectionRef}
          className="Gallery-Container"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <motion.div
            ref={trackRef}
            className="Gallery-Track"
            style={{
              x: combinedX,
              cursor: isDragging ? "grabbing" : "grab",
            }}
          >
            {loopedImages.map((src, index) => (
              <motion.div key={index} className="Gallery-Card">
                <img src={src} alt={`gallery-img-${index}`} draggable={false} />
              </motion.div>
            ))}
          </motion.div>
        </div>
      )}

      <div className="Gallery-Btn">
        <button onClick={() => navigate('/GalleryPage')}>VIEW MORE</button>
      </div>
    </div>
  );
};

export default Gallery;