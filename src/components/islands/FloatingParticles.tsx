/**
 * Floating Particles Component (React Island)
 * WebGL fragment-shader dot field - only loaded on desktop
 */
import { useIsMobile } from '../../hooks/use-mobile';
import { WebGLCanvas } from './particles';

export default function FloatingParticles() {
  const isMobile = useIsMobile();

  if (isMobile) {
    return null;
  }

  return <WebGLCanvas />;
}
