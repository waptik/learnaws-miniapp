/**
 * Phase 4 API Testing Script (Node.js)
 * Run with: node scripts/test-api.js
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

async function testAPI() {
  console.log('🧪 Testing Phase 4 API Routes\n');
  console.log('==============================\n');

  try {
    // Test 1: Start Assessment
    console.log('1️⃣  Testing POST /api/assessment/start...');
    const startResponse = await fetch(`${BASE_URL}/api/assessment/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!startResponse.ok) {
      throw new Error(`Start failed: ${startResponse.status}`);
    }

    const startData = await startResponse.json();
    console.log('✅ Assessment started');
    console.log(`   Assessment ID: ${startData.assessmentId}`);
    console.log(`   Questions: ${startData.questions.length}`);

    // Check domain distribution
    const domainCounts = {};
    startData.questions.forEach(q => {
      domainCounts[q.domain] = (domainCounts[q.domain] || 0) + 1;
    });
    console.log('   Domain distribution:');
    Object.entries(domainCounts).forEach(([domain, count]) => {
      console.log(`     Domain ${domain}: ${count} questions`);
    });

    // Test 2: Submit Assessment
    console.log('\n2️⃣  Testing POST /api/assessment/submit...');
    
    // Create perfect answers
    const answers = startData.questions.map(q => ({
      questionId: q.id,
      selected: q.correctAnswer,
    }));

    const submitResponse = await fetch(`${BASE_URL}/api/assessment/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        assessmentId: startData.assessmentId,
        candidateAddress: '0x1234567890123456789012345678901234567890',
        questions: startData.questions,
        answers,
      }),
    });

    if (!submitResponse.ok) {
      throw new Error(`Submit failed: ${submitResponse.status}`);
    }

    const submitData = await submitResponse.json();
    console.log('✅ Assessment submitted');
    console.log(`   Score: ${submitData.result.scaledScore}`);
    console.log(`   Status: ${submitData.result.passFail}`);
    console.log(`   Correct: ${submitData.result.correctAnswers}/${submitData.result.totalQuestions}`);

    // Test 3: Validate Claim
    console.log('\n3️⃣  Testing POST /api/assessment/claim...');
    const claimResponse = await fetch(`${BASE_URL}/api/assessment/claim`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        assessmentId: startData.assessmentId,
        candidateAddress: '0x1234567890123456789012345678901234567890',
        score: submitData.result.scaledScore,
      }),
    });

    if (!claimResponse.ok) {
      throw new Error(`Claim validation failed: ${claimResponse.status}`);
    }

    const claimData = await claimResponse.json();
    if (claimData.canClaim) {
      console.log('✅ Claim validation successful');
      console.log(`   Daily count: ${claimData.dailyCount}/${claimData.maxDailyClaims}`);
      console.log(`   Claim data:`, claimData.claimData);
    } else {
      console.log('⚠️  Cannot claim:', claimData.reason);
    }

    console.log('\n✅ All API tests completed!');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

testAPI();








