const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Performance audit script
async function runPerformanceAudit() {
  console.log('🚀 Starting Performance Audit...\n');

  // 1. Bundle analysis
  console.log('📦 Running bundle analysis...');
  try {
    execSync('npm run build:analyze', { stdio: 'inherit' });
    console.log('✅ Bundle analysis complete\n');
  } catch (error) {
    console.error('❌ Bundle analysis failed:', error.message);
  }

  // 2. TypeScript type checking
  console.log('🔍 Running TypeScript type check...');
  try {
    execSync('npm run type-check', { stdio: 'inherit' });
    console.log('✅ TypeScript check passed\n');
  } catch (error) {
    console.error('❌ TypeScript check failed:', error.message);
  }

  // 3. ESLint check
  console.log('🔧 Running ESLint...');
  try {
    execSync('npm run lint', { stdio: 'inherit' });
    console.log('✅ ESLint check passed\n');
  } catch (error) {
    console.error('❌ ESLint check failed:', error.message);
  }

  // 4. Build size analysis
  console.log('📊 Analyzing build output...');
  try {
    const buildDir = path.join(process.cwd(), '.next');
    if (fs.existsSync(buildDir)) {
      analyzeBuildSize();
    } else {
      console.log('⚠️  Build directory not found. Run npm run build first.\n');
    }
  } catch (error) {
    console.error('❌ Build analysis failed:', error.message);
  }

  // 5. Dependencies analysis
  console.log('📚 Analyzing dependencies...');
  try {
    analyzeDependencies();
  } catch (error) {
    console.error('❌ Dependencies analysis failed:', error.message);
  }

  console.log('🎯 Performance audit complete!');
}

function analyzeBuildSize() {
  const buildPath = path.join(process.cwd(), '.next');
  
  try {
    // Get build stats
    const staticPath = path.join(buildPath, 'static');
    if (fs.existsSync(staticPath)) {
      const dirs = fs.readdirSync(staticPath);
      
      dirs.forEach(dir => {
        const dirPath = path.join(staticPath, dir);
        if (fs.statSync(dirPath).isDirectory()) {
          const files = fs.readdirSync(dirPath);
          let totalSize = 0;
          
          files.forEach(file => {
            const filePath = path.join(dirPath, file);
            const stats = fs.statSync(filePath);
            totalSize += stats.size;
          });
          
          console.log(`📁 ${dir}: ${formatBytes(totalSize)} (${files.length} files)`);
        }
      });
    }

    // Check for large files
    const bundlePath = path.join(buildPath, 'static', 'chunks');
    if (fs.existsSync(bundlePath)) {
      const chunks = fs.readdirSync(bundlePath);
      const largeChunks = [];
      
      chunks.forEach(chunk => {
        const chunkPath = path.join(bundlePath, chunk);
        const stats = fs.statSync(chunkPath);
        
        if (stats.size > 500000) { // 500KB
          largeChunks.push({ name: chunk, size: stats.size });
        }
      });
      
      if (largeChunks.length > 0) {
        console.log('\n⚠️  Large chunks detected:');
        largeChunks.forEach(chunk => {
          console.log(`   ${chunk.name}: ${formatBytes(chunk.size)}`);
        });
        console.log('   Consider code splitting or tree shaking these chunks.\n');
      } else {
        console.log('✅ No large chunks detected\n');
      }
    }
  } catch (error) {
    console.error('Error analyzing build size:', error.message);
  }
}

function analyzeDependencies() {
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  
  if (!fs.existsSync(packageJsonPath)) {
    console.log('⚠️  package.json not found\n');
    return;
  }
  
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const dependencies = packageJson.dependencies || {};
  const devDependencies = packageJson.devDependencies || {};
  
  console.log(`📦 Production dependencies: ${Object.keys(dependencies).length}`);
  console.log(`🔧 Development dependencies: ${Object.keys(devDependencies).length}`);
  
  // Check for potential issues
  const heavyDeps = [
    'moment', // Suggest date-fns instead
    'lodash', // Suggest lodash-es or individual imports
    'jquery', // Generally not needed in React apps
    '@emotion/react', // If using Tailwind, might be redundant
  ];
  
  const foundHeavyDeps = heavyDeps.filter(dep => 
    dependencies[dep] || devDependencies[dep]
  );
  
  if (foundHeavyDeps.length > 0) {
    console.log('\n⚠️  Consider optimizing these dependencies:');
    foundHeavyDeps.forEach(dep => {
      let suggestion = '';
      switch (dep) {
        case 'moment':
          suggestion = ' (consider date-fns for smaller bundle size)';
          break;
        case 'lodash':
          suggestion = ' (consider lodash-es or individual function imports)';
          break;
        case 'jquery':
          suggestion = ' (generally not needed in React applications)';
          break;
        case '@emotion/react':
          suggestion = ' (might be redundant if using Tailwind CSS)';
          break;
      }
      console.log(`   ${dep}${suggestion}`);
    });
    console.log('');
  }
  
  // Check for duplicate React packages
  const reactPackages = Object.keys(dependencies).filter(dep => 
    dep.includes('react') && dep !== 'react' && dep !== 'react-dom'
  );
  
  if (reactPackages.length > 5) {
    console.log(`⚠️  Many React packages detected (${reactPackages.length}). Consider if all are necessary.\n`);
  }
  
  console.log('✅ Dependencies analysis complete\n');
}

function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Performance recommendations
function generateRecommendations() {
  const recommendations = [
    '🎯 Performance Optimization Recommendations:',
    '',
    '1. Bundle Optimization:',
    '   - Use dynamic imports for large components',
    '   - Implement code splitting at route level',
    '   - Tree shake unused dependencies',
    '',
    '2. Image Optimization:',
    '   - Use next/image for automatic optimization',
    '   - Implement lazy loading for images',
    '   - Use modern formats (AVIF, WebP)',
    '',
    '3. Caching Strategy:',
    '   - Implement service worker caching',
    '   - Use Redis for API response caching',
    '   - Cache static assets with long expiry',
    '',
    '4. Runtime Performance:',
    '   - Use React.memo for expensive components',
    '   - Implement useMemo for expensive calculations',
    '   - Use useCallback for stable function references',
    '',
    '5. Monitoring:',
    '   - Track Core Web Vitals',
    '   - Monitor bundle size changes',
    '   - Set up performance budgets',
    '',
    'For more detailed analysis, run: npm run build:analyze'
  ];
  
  console.log(recommendations.join('\n'));
}

// Run the audit
if (require.main === module) {
  runPerformanceAudit()
    .then(() => {
      console.log('\n');
      generateRecommendations();
    })
    .catch(error => {
      console.error('Performance audit failed:', error);
      process.exit(1);
    });
}

module.exports = { runPerformanceAudit, analyzeBuildSize, analyzeDependencies };