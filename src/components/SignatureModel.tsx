import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import type { Point } from '../types/signature';

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

  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current) return;

    // Create scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);
    sceneRef.current = scene;

    // Create camera
    const camera = new THREE.PerspectiveCamera(
      75,
      width / height,
      0.1,
      1000
    );
    camera.position.z = 200;
    cameraRef.current = camera;

    // Create renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Add orbit controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controlsRef.current = controls;

    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    // Add directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(0, 1, 1);
    scene.add(directionalLight);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Cleanup
    return () => {
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [width, height]);

  // Update signature model when data changes
  useEffect(() => {
    if (!sceneRef.current || !signatureData.length) return;

    // Remove existing mesh if any
    if (meshRef.current) {
      sceneRef.current.remove(meshRef.current);
    }

    // Create geometry from signature points
    const geometry = new THREE.BufferGeometry();
    const vertices: number[] = [];
    const indices: number[] = [];
    const uvs: number[] = [];

    // Convert 2D points to 3D vertices
    signatureData.forEach((point, i) => {
      // Scale x and y to fit in the scene
      const x = (point.x / width) * 100 - 50;
      const y = -(point.y / height) * 100 + 50;
      const z = (point.pressure || 0.5) * depth;

      // Add vertex
      vertices.push(x, y, z);
      uvs.push(point.x / width, point.y / height);

      // Create triangles for the stroke
      if (i > 0) {
        const prev = i - 1;
        indices.push(prev, i, i + 1);
      }
    });

    // Set geometry attributes
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices);

    // Create material
    const material = new THREE.MeshPhongMaterial({
      color: new THREE.Color(color),
      side: THREE.DoubleSide,
      flatShading: true,
    });

    // Create mesh
    const mesh = new THREE.Mesh(geometry, material);
    sceneRef.current.add(mesh);
    meshRef.current = mesh;

    // Center the model
    geometry.computeBoundingBox();
    const center = new THREE.Vector3();
    geometry.boundingBox?.getCenter(center);
    mesh.position.sub(center);

  }, [signatureData, width, height, depth, color]);

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
