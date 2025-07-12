#!/usr/bin/env node

/**
 * 🔍 Vercel Deployment Monitor
 * Monitors Vercel deployments and handles failures automatically
 */

const https = require('https');
const fs = require('fs');

// Configuration
const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID;
const VERCEL_TEAM_ID = process.env.VERCEL_TEAM_ID;
const GITHUB_SHA = process.env.GITHUB_SHA;
const GITHUB_REF = process.env.GITHUB_REF;

const MAX_WAIT_TIME = 20 * 60 * 1000; // 20 minutes
const CHECK_INTERVAL = 30 * 1000; // 30 seconds

// Utility functions
function log(message) {
    console.log(`[${new Date().toISOString()}] ${message}`);
}

function makeRequest(options, data = null) {
    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    resolve({
                        statusCode: res.statusCode,
                        data: JSON.parse(body)
                    });
                } catch (e) {
                    resolve({
                        statusCode: res.statusCode,
                        data: body
                    });
                }
            });
        });

        req.on('error', reject);
        
        if (data) {
            req.write(JSON.stringify(data));
        }
        
        req.end();
    });
}

async function getLatestDeployment() {
    log('🔍 Fetching latest deployment...');
    
    const options = {
        hostname: 'api.vercel.com',
        path: `/v6/deployments?projectId=${VERCEL_PROJECT_ID}&limit=1`,
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${VERCEL_TOKEN}`,
            'Content-Type': 'application/json'
        }
    };

    if (VERCEL_TEAM_ID) {
        options.path += `&teamId=${VERCEL_TEAM_ID}`;
    }

    try {
        const response = await makeRequest(options);
        
        if (response.statusCode !== 200) {
            throw new Error(`Vercel API error: ${response.statusCode} - ${response.data}`);
        }

        const deployments = response.data.deployments;
        if (!deployments || deployments.length === 0) {
            throw new Error('No deployments found');
        }

        return deployments[0];
    } catch (error) {
        log(`❌ Error fetching deployment: ${error.message}`);
        throw error;
    }
}

async function getDeploymentById(deploymentId) {
    log(`🔍 Fetching deployment details for ${deploymentId}...`);
    
    const options = {
        hostname: 'api.vercel.com',
        path: `/v13/deployments/${deploymentId}`,
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${VERCEL_TOKEN}`,
            'Content-Type': 'application/json'
        }
    };

    if (VERCEL_TEAM_ID) {
        options.path += `?teamId=${VERCEL_TEAM_ID}`;
    }

    try {
        const response = await makeRequest(options);
        
        if (response.statusCode !== 200) {
            throw new Error(`Vercel API error: ${response.statusCode} - ${response.data}`);
        }

        return response.data;
    } catch (error) {
        log(`❌ Error fetching deployment details: ${error.message}`);
        throw error;
    }
}

async function getDeploymentLogs(deploymentId) {
    log(`📋 Fetching deployment logs for ${deploymentId}...`);
    
    const options = {
        hostname: 'api.vercel.com',
        path: `/v2/deployments/${deploymentId}/events`,
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${VERCEL_TOKEN}`,
            'Content-Type': 'application/json'
        }
    };

    if (VERCEL_TEAM_ID) {
        options.path += `?teamId=${VERCEL_TEAM_ID}`;
    }

    try {
        const response = await makeRequest(options);
        
        if (response.statusCode !== 200) {
            log(`⚠️ Could not fetch logs: ${response.statusCode}`);
            return [];
        }

        return response.data;
    } catch (error) {
        log(`⚠️ Error fetching deployment logs: ${error.message}`);
        return [];
    }
}

function analyzeErrorLogs(logs) {
    const errors = [];
    const errorPatterns = [
        {
            pattern: /Type error:/,
            type: 'typescript',
            description: 'TypeScript compilation error'
        },
        {
            pattern: /Module not found:/,
            type: 'module',
            description: 'Missing module or dependency'
        },
        {
            pattern: /ESLint/,
            type: 'eslint',
            description: 'ESLint linting error'
        },
        {
            pattern: /npm ERR!/,
            type: 'npm',
            description: 'NPM installation error'
        },
        {
            pattern: /Build failed/,
            type: 'build',
            description: 'General build failure'
        }
    ];

    logs.forEach(log => {
        if (log.text) {
            errorPatterns.forEach(pattern => {
                if (pattern.pattern.test(log.text)) {
                    errors.push({
                        type: pattern.type,
                        description: pattern.description,
                        message: log.text,
                        timestamp: log.date
                    });
                }
            });
        }
    });

    return errors;
}

async function waitForDeployment() {
    log('⏱️ Starting deployment monitoring...');
    
    const startTime = Date.now();
    let deployment = null;
    
    // First, find the deployment for our commit
    log(`🎯 Looking for deployment of commit ${GITHUB_SHA}...`);
    
    while (Date.now() - startTime < MAX_WAIT_TIME) {
        try {
            deployment = await getLatestDeployment();
            
            // Check if this deployment is for our commit
            if (deployment.meta && deployment.meta.githubCommitSha === GITHUB_SHA) {
                log(`✅ Found deployment for our commit: ${deployment.uid}`);
                break;
            }
            
            log(`🔄 Latest deployment is for different commit (${deployment.meta?.githubCommitSha || 'unknown'}), waiting...`);
            
        } catch (error) {
            log(`⚠️ Error checking for deployment: ${error.message}`);
        }
        
        await new Promise(resolve => setTimeout(resolve, CHECK_INTERVAL));
    }
    
    if (!deployment) {
        throw new Error(`No deployment found for commit ${GITHUB_SHA} within ${MAX_WAIT_TIME / 1000}s`);
    }
    
    // Monitor the deployment status
    log(`📊 Monitoring deployment ${deployment.uid}...`);
    
    while (Date.now() - startTime < MAX_WAIT_TIME) {
        try {
            const currentDeployment = await getDeploymentById(deployment.uid);
            
            log(`📈 Deployment status: ${currentDeployment.readyState}`);
            
            if (currentDeployment.readyState === 'READY') {
                log('🎉 Deployment successful!');
                
                // Save success info
                const successInfo = {
                    status: 'success',
                    deploymentId: deployment.uid,
                    url: currentDeployment.url,
                    timestamp: new Date().toISOString(),
                    duration: Date.now() - startTime
                };
                
                fs.writeFileSync('vercel-deploy.log', JSON.stringify(successInfo, null, 2));
                return true;
            }
            
            if (currentDeployment.readyState === 'ERROR') {
                log('❌ Deployment failed!');
                
                // Get deployment logs
                const logs = await getDeploymentLogs(deployment.uid);
                const errors = analyzeErrorLogs(logs);
                
                // Save error info
                const errorInfo = {
                    status: 'error',
                    deploymentId: deployment.uid,
                    errors: errors,
                    logs: logs,
                    timestamp: new Date().toISOString(),
                    duration: Date.now() - startTime
                };
                
                fs.writeFileSync('vercel-deploy.log', JSON.stringify(errorInfo, null, 2));
                
                log('📋 Error analysis complete. Check vercel-deploy.log for details.');
                return false;
            }
            
            if (currentDeployment.readyState === 'CANCELED') {
                log('⏹️ Deployment was canceled');
                return false;
            }
            
            // Still building/queued
            await new Promise(resolve => setTimeout(resolve, CHECK_INTERVAL));
            
        } catch (error) {
            log(`⚠️ Error monitoring deployment: ${error.message}`);
            await new Promise(resolve => setTimeout(resolve, CHECK_INTERVAL));
        }
    }
    
    log('⏰ Timeout waiting for deployment');
    return false;
}

async function main() {
    try {
        // Validate required environment variables
        if (!VERCEL_TOKEN) {
            throw new Error('VERCEL_TOKEN environment variable is required');
        }
        
        if (!VERCEL_PROJECT_ID) {
            throw new Error('VERCEL_PROJECT_ID environment variable is required');
        }
        
        if (!GITHUB_SHA) {
            throw new Error('GITHUB_SHA environment variable is required');
        }
        
        log('🚀 Starting Vercel deployment monitoring...');
        log(`📊 Configuration:`);
        log(`   Project ID: ${VERCEL_PROJECT_ID}`);
        log(`   Team ID: ${VERCEL_TEAM_ID || 'Personal account'}`);
        log(`   Commit: ${GITHUB_SHA}`);
        log(`   Branch: ${GITHUB_REF}`);
        
        const success = await waitForDeployment();
        
        if (success) {
            log('✅ Deployment monitoring completed successfully');
            process.exit(0);
        } else {
            log('❌ Deployment failed');
            process.exit(1);
        }
        
    } catch (error) {
        log(`💥 Fatal error: ${error.message}`);
        
        // Save error for GitHub Actions
        fs.writeFileSync('vercel-deploy.log', JSON.stringify({
            status: 'error',
            error: error.message,
            timestamp: new Date().toISOString()
        }, null, 2));
        
        process.exit(1);
    }
}

// Run the monitor
main();