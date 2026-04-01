import { type FunctionalComponent } from 'preact';
import { useEffect, useRef } from 'preact/hooks';
import * as THREE from 'three';
import './styles.css';

const CURVE_DEPTH = 0.7;
const SEGMENTS_X = 40;
const SEGMENTS_Y = 40;

const App: FunctionalComponent = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;

    // Scene
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      50,
      innerWidth / innerHeight,
      0.1,
      100,
    );
    camera.position.set(0, 0, 1.5);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setSize(innerWidth, innerHeight);
    renderer.setPixelRatio(devicePixelRatio);

    // Curved geometry: parabolic bow along X axis
    const geometry = new THREE.PlaneGeometry(2, 2, SEGMENTS_X, SEGMENTS_Y);
    const positions = geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const y = positions.getY(i);
      positions.setZ(i, -CURVE_DEPTH * (x * x + y * y));
    }
    positions.needsUpdate = true;
    geometry.computeVertexNormals();

    // Texture backed by the canvas's first child element via texElementImage2D
    const gl = renderer.getContext() as WebGLRenderingContext & {
      texElementImage2D: (
        target: GLenum,
        level: GLint,
        internalformat: GLint,
        format: GLenum,
        type: GLenum,
        element: Element,
      ) => void;
    };

    // Allocate the GL texture ourselves so we can use texElementSubImage2D
    const glTexture = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, glTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindTexture(gl.TEXTURE_2D, null);

    const texture = new THREE.Texture();
    texture.isRenderTargetTexture = true; // prevent Three.js from uploading
    texture.colorSpace = THREE.SRGBColorSpace;
    // Inject our GL handle into Three.js's property map
    (
      renderer.properties.get(texture) as Record<string, unknown>
    ).__webglTexture = glTexture;

    const material = new THREE.MeshBasicMaterial({
      map: texture,
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // Animation loop — repaint every frame
    let rafId: number;
    const animate = () => {
      rafId = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };

    animate();

    // Pointermove → UV → translate element so texture point stays under mouse
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    const updateElementPosition = (x: number, y: number) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = ((x - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((y - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(pointer, camera);
      const intersects = raycaster.intersectObject(mesh);

      if (intersects.length > 0 && intersects[0].uv) {
        const uv = intersects[0].uv;
        const el = canvas.firstElementChild as HTMLElement | null;
        if (!el) return;
        const w = el.offsetWidth;
        const h = el.offsetHeight;
        // Pixel in the texture that is under the pointer
        const texX = uv.x * w;
        const texY = (1 - uv.y) * h;
        // Mouse position relative to the canvas
        const mouseX = x - rect.left;
        const mouseY = y - rect.top;
        // Translate so texPoint lands under the mouse
        el.style.transform = `translate(${mouseX - texX}px, ${mouseY - texY}px)`;
      }
    };

    const handleElementPointerPosition = (e: PointerEvent) => {
      updateElementPosition(e.clientX, e.clientY);
    };

    canvas.addEventListener('pointermove', handleElementPointerPosition);
    canvas.addEventListener('pointerdown', handleElementPointerPosition);

    // Resize handler
    const handleResize = () => {
      camera.aspect = innerWidth / innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(innerWidth, innerHeight);
    };
    addEventListener('resize', handleResize);

    const canvasPaint = () => {
      const element = canvas.firstElementChild;
      if (!element) return;
      // Bind via raw GL, bypassing Three.js state cache, then upload
      // const state = (renderer as any).state;
      // state.reset(); // force Three.js to re-bind everything on next render
      gl.bindTexture(gl.TEXTURE_2D, glTexture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texElementImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        element,
      );
    };

    canvas.addEventListener('paint', canvasPaint);
    canvas.requestPaint();

    return () => {
      cancelAnimationFrame(rafId);
      canvas.removeEventListener('pointermove', handleElementPointerPosition);
      canvas.removeEventListener('pointerdown', handleElementPointerPosition);
      canvas.removeEventListener('paint', canvasPaint);
      removeEventListener('resize', handleResize);
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      texture.dispose();
    };
  }, []);

  return (
    <canvas ref={canvasRef} layoutsubtree>
      <div class="canvas-content">
        <div class="button-row">
          <button>Button 1</button>
          <button>Button 2</button>
          <button>Button 3</button>
          <button>Button 4</button>
          <button>Button 5</button>
        </div>
        <div class="text">
          <p>
            This element is mapped to something that's kinda sphere-ish.
            However, text selection still works as expected.
          </p>

          <p>
            This works because, on pointermove, the real element is given a
            transform so the point of the real element matches up to the point
            of the texture under the mouse.
          </p>

          <p>
            This means things like{' '}
            <a href="https://jakearchibald.com" target="_blank">
              links
            </a>{' '}
            will just work.
          </p>

          <p>
            For simple 2D cases, it still makes sense to have a nice high-level
            way to handle this, but I think this proves that for complex
            non-flat cases, it's relatively simple to make things work.
          </p>

          <p>
            I'm sure there are edges cases with things like anchor-positioning
            and stop layer content, like a custom select element's picker:{' '}
            <select>
              <option>Oh</option>
              <option>no</option>
            </select>
          </p>

          <p>
            Ah, yeah, it moves around on mouse move, and I'm not handling moving
            the element on focus. But the general capability is proven, I think.
          </p>
        </div>
        <div class="range-row">
          <input type="range" min="0" max="1" step="any" value="0" />
        </div>
      </div>
    </canvas>
  );
};

export default App;
