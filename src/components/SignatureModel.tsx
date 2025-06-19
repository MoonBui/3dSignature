import { useEffect, useRef, useCallback, useLayoutEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import type { Point } from '../types/signature';
import { MeshLineGeometry, MeshLineMaterial } from 'meshline';

interface SignatureModelProps {
  signatureData: Point[];
  width?: number;
  height?: number;
  depth?: number;
  color?: string;
}

const SignatureModel = ({
  signatureData,
  width = 800,
  height = 400,
  depth = 50,
  color = '#2563eb'
}: SignatureModelProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);
  const animationIdRef = useRef<number | null>(null);
  const materialRef = useRef<MeshLineMaterial | null>(null);

  console.log('SignatureModel render', { signatureDataLength: signatureData.length });

  // Animation loop using useCallback to prevent recreation
  const animate = useCallback(() => {
    if (!controlsRef.current || !rendererRef.current || !sceneRef.current || !cameraRef.current) return;
    
    animationIdRef.current = requestAnimationFrame(animate);

    // Update dash offset for drawing animation
    if (materialRef.current) {
      const currentOffset = materialRef.current.uniforms.dashOffset.value;
      if (currentOffset > 0) {
        materialRef.current.uniforms.dashOffset.value = Math.max(0, currentOffset - 0.003);
      }
    }

    controlsRef.current.update();
    rendererRef.current.render(sceneRef.current, cameraRef.current);
  }, []);

  // Store animate function in ref to avoid dependency issues
  const animateRef = useRef(animate);
  animateRef.current = animate;

  // Initialize Three.js scene
  useLayoutEffect(() => {
    if (!containerRef.current) return;

    const cleanup = () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      
      if (controlsRef.current) {
        controlsRef.current.dispose();
      }
      
      if (rendererRef.current) {
        if (containerRef.current?.contains(rendererRef.current.domElement)) {
          containerRef.current.removeChild(rendererRef.current.domElement);
        }
        rendererRef.current.dispose();
      }
      
      if (sceneRef.current) {
        sceneRef.current.clear();
      }
      
      // Clear refs
      sceneRef.current = null;
      cameraRef.current = null;
      rendererRef.current = null;
      controlsRef.current = null;
      meshRef.current = null;
      materialRef.current = null;
    };

    // Clean up before creating new scene
    cleanup();

    // Create scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);
    sceneRef.current = scene;

    // Create camera
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 120;
    cameraRef.current = camera;

    // Create renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    console.log('SignatureModel: Canvas added to DOM', containerRef.current.children.length);

    // Add orbit controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 50;
    controls.maxDistance = 200;
    controlsRef.current = controls;

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(0, 1, 1);
    scene.add(ambientLight, directionalLight);

    // Start animation loop
    animateRef.current();

    // Return cleanup function
    return cleanup;
  }, []); // Empty dependency array - only run once

  // Update renderer size and camera when dimensions change
  useLayoutEffect(() => {
    if (!rendererRef.current || !cameraRef.current) return;

    rendererRef.current.setSize(width, height);
    cameraRef.current.aspect = width / height;
    cameraRef.current.updateProjectionMatrix();
  }, [width, height]);

  // Update signature model when data changes
  useEffect(() => {
    if (!sceneRef.current || !signatureData.length) return;

    // Clean up existing mesh
    if (meshRef.current) {
      sceneRef.current.remove(meshRef.current);
      meshRef.current.geometry.dispose();
      (meshRef.current.material as THREE.Material).dispose();
    }

    // Create new mesh from signature data
    const rawPoints = signatureData.map(point => {
      // Calculate the aspect ratio
      const aspectRatio = width / height;
      
      // Scale points to maintain aspect ratio
      // Increased scale for larger signature
      const scale = 150;
      const x = (point.x / width) * scale * aspectRatio - (scale * aspectRatio / 2);
      const y = -(point.y / height) * scale + (scale / 2);
      return new THREE.Vector3(x, y, 0);
    });

    // Create a smooth curve from the points
    const curve = new THREE.CatmullRomCurve3(rawPoints);
    // Generate more points along the curve for smoothness
    const points = curve.getPoints(rawPoints.length * 10);

    // Calculate total line length
    let totalLength = 0;
    for (let i = 1; i < points.length; i++) {
      totalLength += points[i].distanceTo(points[i - 1]);
    }

    const lineGeometry = new MeshLineGeometry();
    lineGeometry.setPoints(points);

    const lineMaterial = new MeshLineMaterial({
      color: new THREE.Color(color),
      lineWidth: 1.2,
      resolution: new THREE.Vector2(window.innerWidth, window.innerHeight),
      sizeAttenuation: 1,
      alphaTest: 0.5,
      dashArray: totalLength,
      dashOffset: totalLength,
      dashRatio: 0.5,
    });
    lineMaterial.transparent = true;
    lineMaterial.depthTest = false;

    materialRef.current = lineMaterial;
    
    const line = new THREE.Mesh(lineGeometry, lineMaterial);
    sceneRef.current.add(line);
    meshRef.current = line;
  }, [signatureData, width, height, depth, color]);

  // const handleDownload = () => {
  //   if (!containerRef.current) return;
  //   const canvas = containerRef.current.querySelector('canvas');
  //   if (!canvas) return;
  //   const link = document.createElement('a');
  //   link.download = 'signature.png';
  // }

  return (
    <div className="w-full min-w-[300px] sm:min-w-[400px] md:min-w-[600px] lg:min-w-[800px] xl:min-w-[1000px] 2xl:min-w-[1200px]">
      <h3 className="text-lg font-medium mb-2">3D Signature Model</h3>
      <div 
        ref={containerRef} 
        className="w-full border-2 border-gray-300 rounded-lg bg-white"
        style={{ height: `${height}px` }}
      />
    </div>
  );
};

export default SignatureModel;
