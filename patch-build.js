
import fs from 'fs';
import path from 'path';

const indexPath = path.resolve('dist/index.html');

if (fs.existsSync(indexPath)) {
  let content = fs.readFileSync(indexPath, 'utf8');

  console.log('Applying ultra-aggressive cleanup for file:// protocol...');

  // 1. Completely remove module-related tags and attributes
  content = content.replace(/type="module"/g, '');
  content = content.replace(/crossorigin=""/g, '');
  content = content.replace(/crossorigin/g, '');
  content = content.replace(/<link rel="modulepreload"[^>]*>/g, '');

  // 2. Remove all export keywords that appear as standalone words
  // This handles 'export {', 'export const', 'export default', etc.
  content = content.replace(/\bexport\b\s*\{[^}]*\};?/g, '');
  content = content.replace(/\bexport\b\s+default\s+/g, '');
  content = content.replace(/\bexport\b\s+(const|let|var|function|class)\s+/g, '$1 ');

  // 3. Just in case, remove any remaining standalone 'export' words not inside strings
  // (This is dangerous but we target common bundle patterns)
  // Actually, let's just target the most common problematic one: export { ... }
  content = content.replace(/export\s*\{[^}]*\}\s*;?/g, '');

  // 4. Fix potential spacing issues
  content = content.replace(/<script\s+/g, '<script ');

  fs.writeFileSync(indexPath, content);
  console.log('Cleanup complete. Bundle should now be a valid classic script.');
} else {
  console.error('dist/index.html not found!');
  process.exit(1);
}
