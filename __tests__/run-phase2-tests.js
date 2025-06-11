#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 🚀 Phase 2 Backend Integration Test Runner
console.log('🚀 Starting Phase 2: Backend Integration Testing');
console.log('='.repeat(60));

const TEST_SUITES = [
     {
          name: 'Authentication Security Tests',
          command: 'npm test -- __tests__/integration/auth.test.js',
          description: 'Testing authentication endpoints and JWT security'
     },
     {
          name: 'Journey System Integration Tests',
          command: 'npm test -- __tests__/integration/userJourney.test.js',
          description: 'Testing core journey functionality and business logic'
     },
     {
          name: 'Performance & Load Tests',
          command: 'npm test -- __tests__/integration/performance.test.js',
          description: 'Testing response times and system performance'
     }
];

const SECURITY_CHECKS = [
     {
          name: 'Migration Route Security',
          check: () => {
               const migrationRoute = fs.readFileSync(
                    path.join(__dirname, '../src/routes/migration.js'),
                    'utf8'
               );
               return migrationRoute.includes('checkLogin') && migrationRoute.includes('isAdmin');
          },
          description: 'Verify migration routes are secured with admin authentication'
     },
     {
          name: 'Question Route Security',
          check: () => {
               const questionRoute = fs.readFileSync(
                    path.join(__dirname, '../src/routes/question.js'),
                    'utf8'
               );
               return questionRoute.includes('checkLogin');
          },
          description: 'Verify question routes are secured with authentication'
     },
     {
          name: 'CORS Configuration',
          check: () => {
               const mainFile = fs.readFileSync(
                    path.join(__dirname, '../src/main.js'),
                    'utf8'
               );
               return mainFile.includes('ALLOWED_ORIGINS') && mainFile.includes('process.env');
          },
          description: 'Verify CORS uses environment variables'
     }
];

async function runSecurityChecks() {
     console.log('🔒 Running Security Verification Checks...');
     console.log('-'.repeat(40));

     let securityScore = 0;
     const totalChecks = SECURITY_CHECKS.length;

     for (const check of SECURITY_CHECKS) {
          try {
               const passed = check.check();
               if (passed) {
                    console.log(`✅ ${check.name}: PASSED`);
                    securityScore++;
               } else {
                    console.log(`❌ ${check.name}: FAILED`);
                    console.log(`   ${check.description}`);
               }
          } catch (error) {
               console.log(`❌ ${check.name}: ERROR - ${error.message}`);
          }
     }

     console.log(`\n🔒 Security Score: ${securityScore}/${totalChecks} (${Math.round((securityScore / totalChecks) * 100)}%)`);

     if (securityScore < totalChecks) {
          console.log('⚠️  Warning: Some security checks failed. Please review before proceeding.');
     }

     return securityScore === totalChecks;
}

async function runTestSuite(suite) {
     console.log(`\n🧪 Running: ${suite.name}`);
     console.log(`📝 ${suite.description}`);
     console.log('-'.repeat(40));

     try {
          const startTime = Date.now();

          // Run the test
          const output = execSync(suite.command, {
               cwd: path.join(__dirname, '..'),
               encoding: 'utf8',
               stdio: 'pipe'
          });

          const duration = Date.now() - startTime;

          console.log(`✅ ${suite.name}: PASSED (${duration}ms)`);

          // Extract test results from output
          const lines = output.split('\n');
          const passedLine = lines.find(line => line.includes('Tests:') && line.includes('passed'));
          if (passedLine) {
               console.log(`📊 ${passedLine.trim()}`);
          }

          return { success: true, duration, output };

     } catch (error) {
          console.log(`❌ ${suite.name}: FAILED`);
          console.log(`💥 Error: ${error.message}`);

          // Show relevant error output
          if (error.stdout) {
               const errorLines = error.stdout.split('\n').slice(-10);
               console.log('📋 Last 10 lines of output:');
               errorLines.forEach(line => console.log(`   ${line}`));
          }

          return { success: false, error: error.message };
     }
}

async function generateReport(results, securityPassed) {
     console.log('\n📊 Phase 2 Testing Report');
     console.log('='.repeat(50));

     const totalTests = results.length;
     const passedTests = results.filter(r => r.success).length;
     const failedTests = totalTests - passedTests;

     console.log(`🧪 Test Suites: ${passedTests}/${totalTests} passed`);
     console.log(`🔒 Security Checks: ${securityPassed ? 'PASSED' : 'FAILED'}`);
     console.log(`⏱️  Total Duration: ${results.reduce((sum, r) => sum + (r.duration || 0), 0)}ms`);

     console.log('\n📋 Detailed Results:');
     results.forEach((result, index) => {
          const suite = TEST_SUITES[index];
          const status = result.success ? '✅ PASSED' : '❌ FAILED';
          const duration = result.duration ? `(${result.duration}ms)` : '';
          console.log(`  ${status} ${suite.name} ${duration}`);
     });

     // Overall status
     const overallSuccess = passedTests === totalTests && securityPassed;
     const percentage = Math.round((passedTests / totalTests) * 100);

     console.log('\n🎯 Phase 2 Status:');
     if (overallSuccess) {
          console.log(`🎉 SUCCESS: All tests passed! (${percentage}%)`);
          console.log('✅ Ready for Phase 3: Advanced Features');
     } else {
          console.log(`⚠️  PARTIAL: ${percentage}% tests passed`);
          if (failedTests > 0) {
               console.log(`❌ ${failedTests} test suite(s) need attention`);
          }
          if (!securityPassed) {
               console.log('🔒 Security issues need to be resolved');
          }
     }

     return overallSuccess;
}

async function runPhase2Tests() {
     try {
          console.log('🔧 Environment: Node.js Backend Integration Testing');
          console.log(`📁 Working Directory: ${process.cwd()}`);
          console.log(`🕐 Started at: ${new Date().toISOString()}\n`);

          // Step 1: Security Verification
          const securityPassed = await runSecurityChecks();

          // Step 2: Run Test Suites
          const results = [];
          for (const suite of TEST_SUITES) {
               const result = await runTestSuite(suite);
               results.push(result);
          }

          // Step 3: Generate Report
          const overallSuccess = await generateReport(results, securityPassed);

          // Step 4: Next Steps
          console.log('\n🚀 Next Steps:');
          if (overallSuccess) {
               console.log('1. ✅ Phase 2 Complete - All backend tests passed');
               console.log('2. 🔄 Ready to implement Phase 3: Advanced Features');
               console.log('3. 📊 Consider adding monitoring and analytics');
               console.log('4. 🚀 Prepare for production deployment');
          } else {
               console.log('1. 🔧 Fix failing tests and security issues');
               console.log('2. 🔄 Re-run Phase 2 tests');
               console.log('3. 📝 Review error logs and improve implementation');
          }

          console.log('\n📞 Support: Check reports for detailed error information');
          console.log('🕐 Completed at:', new Date().toISOString());

          // Exit with appropriate code
          process.exit(overallSuccess ? 0 : 1);

     } catch (error) {
          console.error('\n💥 Phase 2 Testing Failed:', error.message);
          console.error('🔧 Please check your setup and try again');
          process.exit(1);
     }
}

// Run if called directly
if (require.main === module) {
     runPhase2Tests();
}

module.exports = { runPhase2Tests }; 