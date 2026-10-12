/**
 * Full End-to-End Hardening & Integration Test Suite
 * Covers all Phase 7 security, RBAC, execution, and dashboard scenarios.
 */
require('dotenv').config();
const http = require('http');
const mongoose = require('mongoose');
const app = require('./src/app');
const connectDB = require('./src/config/db');
const User = require('./src/models/User');
const AuthorizedEmail = require('./src/models/AuthorizedEmail');
const Question = require('./src/models/Question');
const Submission = require('./src/models/Submission');

// Helper to make HTTP requests with cookie retention
function makeRequest({ port, method, path, headers = {}, body = null, cookie = '' }) {
  return new Promise((resolve, reject) => {
    const postData = body ? (typeof body === 'string' ? body : JSON.stringify(body)) : null;
    const reqHeaders = { ...headers };
    if (postData && !reqHeaders['Content-Type']) {
      reqHeaders['Content-Type'] = 'application/json';
    }
    if (postData) {
      reqHeaders['Content-Length'] = Buffer.byteLength(postData);
    }
    if (cookie) {
      reqHeaders['Cookie'] = cookie;
    }

    const req = http.request(
      {
        hostname: 'localhost',
        port,
        path,
        method,
        headers: reqHeaders,
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          let parsed = null;
          try {
            parsed = JSON.parse(data);
          } catch (e) {
            parsed = data;
          }
          const setCookie = res.headers['set-cookie'];
          let cookieStr = '';
          if (setCookie) {
            cookieStr = Array.isArray(setCookie) ? setCookie.join('; ') : setCookie;
          }
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: parsed,
            cookie: cookieStr,
          });
        });
      }
    );

    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

function extractJwtCookie(cookieHeader) {
  if (!cookieHeader) return '';
  const match = cookieHeader.match(/token=([^;]+)/);
  return match ? `token=${match[1]}` : cookieHeader;
}

let server;
const TEST_PORT = 5006;

async function runTestSuite() {
  console.log('====================================================');
  console.log('🚀 STARTING COLLEGE CODING PLATFORM E2E HARDENING TEST');
  console.log('====================================================\n');

  await connectDB();
  server = app.listen(TEST_PORT);
  console.log(`Test server running on port ${TEST_PORT}\n`);

  const timestamp = Date.now();
  const emails = {
    unauthorized: `unauth_${timestamp}@college.edu`,
    student1: `student1_${timestamp}@college.edu`,
    student2: `student2_${timestamp}@college.edu`,
    teacherA: `teacher_a_${timestamp}@college.edu`,
    teacherB: `teacher_b_${timestamp}@college.edu`,
    admin: `admin_${timestamp}@college.edu`,
  };

  try {
    // ----------------------------------------------------
    // TEST 1: Allowlist Security
    // ----------------------------------------------------
    console.log('TEST 1: Allowlist Authorization Protection');
    const unauthReg = await makeRequest({
      port: TEST_PORT,
      method: 'POST',
      path: '/api/v1/auth/register',
      body: {
        email: emails.unauthorized,
        password: 'Password@123',
        fullName: 'Hacker User',
      },
    });
    if (unauthReg.status === 403) {
      console.log('  ✅ Non-allowlisted email registration correctly rejected with 403');
    } else {
      throw new Error(`Expected 403 for unauthorized registration, got ${unauthReg.status}`);
    }

    // Pre-authorize accounts
    await AuthorizedEmail.insertMany([
      { email: emails.student1, role: 'student', fullName: 'Student One', rollNumber: 'CS101' },
      { email: emails.student2, role: 'student', fullName: 'Student Two', rollNumber: 'CS102' },
      { email: emails.teacherA, role: 'teacher', fullName: 'Teacher Alice' },
      { email: emails.teacherB, role: 'teacher', fullName: 'Teacher Bob' },
      { email: emails.admin, role: 'admin', fullName: 'Master Admin' },
    ]);
    console.log('  ✅ Seeded authorized emails for test');

    // Register student1 through the API to verify the full allowlist registration pipeline
    const regRes = await makeRequest({
      port: TEST_PORT,
      method: 'POST',
      path: '/api/v1/auth/register',
      body: { email: emails.student1, password: 'Password@123', fullName: 'Student One' },
    });
    if (regRes.status !== 201) {
      throw new Error(`Failed to register student1: ${JSON.stringify(regRes.body)}`);
    }
    console.log('  ✅ Student 1 registered successfully through allowlist API pipeline');

    // Create remaining accounts directly to test cross-role workflows without hitting IP rate limiter
    const bcrypt = require('bcryptjs');
    const passwordHash = await bcrypt.hash('Password@123', 12);
    await User.insertMany([
      { email: emails.student2, passwordHash, fullName: 'Student Two', role: 'student', rollNumber: 'CS102', isEmailVerified: true, isActive: true },
      { email: emails.teacherA, passwordHash, fullName: 'Teacher Alice', role: 'teacher', isEmailVerified: true, isActive: true },
      { email: emails.teacherB, passwordHash, fullName: 'Teacher Bob', role: 'teacher', isEmailVerified: true, isActive: true },
      { email: emails.admin, passwordHash, fullName: 'Master Admin', role: 'admin', isEmailVerified: true, isActive: true },
    ]);
    console.log('  ✅ Seeded remaining role accounts directly for multi-user test matrix');

    // ----------------------------------------------------
    // TEST 2: Authentication & Sessions
    // ----------------------------------------------------
    console.log('\nTEST 2: Authentication & Session Verification');
    const student1Login = await makeRequest({
      port: TEST_PORT,
      method: 'POST',
      path: '/api/v1/auth/login',
      body: { email: emails.student1, password: 'Password@123' },
    });
    if (student1Login.status !== 200) throw new Error('Student 1 login failed');
    const student1Cookie = extractJwtCookie(student1Login.cookie);
    if (!student1Cookie.includes('token=')) throw new Error('Missing token cookie in login response');
    console.log('  ✅ Student 1 logged in, received httpOnly JWT cookie');

    // Verify /auth/me returns sanitized user (no password)
    const meRes = await makeRequest({
      port: TEST_PORT,
      method: 'GET',
      path: '/api/v1/auth/me',
      cookie: student1Cookie,
    });
    if (meRes.status !== 200 || meRes.body.data.password || meRes.body.data.passwordHash) {
      throw new Error('User endpoint leaked password field or failed');
    }
    console.log('  ✅ /auth/me returns clean sanitized user without password fields');

    // Login other actors
    const teacherALogin = await makeRequest({
      port: TEST_PORT,
      method: 'POST',
      path: '/api/v1/auth/login',
      body: { email: emails.teacherA, password: 'Password@123' },
    });
    const teacherACookie = extractJwtCookie(teacherALogin.cookie);

    const teacherBLogin = await makeRequest({
      port: TEST_PORT,
      method: 'POST',
      path: '/api/v1/auth/login',
      body: { email: emails.teacherB, password: 'Password@123' },
    });
    const teacherBCookie = extractJwtCookie(teacherBLogin.cookie);

    const adminLogin = await makeRequest({
      port: TEST_PORT,
      method: 'POST',
      path: '/api/v1/auth/login',
      body: { email: emails.admin, password: 'Password@123' },
    });
    const adminCookie = extractJwtCookie(adminLogin.cookie);

    // ----------------------------------------------------
    // TEST 3: RBAC & Permission Boundaries
    // ----------------------------------------------------
    console.log('\nTEST 3: Role-Based Access Control (RBAC) Enforcement');
    // Student attempting teacher endpoint
    const studentTeacherRoute = await makeRequest({
      port: TEST_PORT,
      method: 'GET',
      path: '/api/v1/teacher/questions',
      cookie: student1Cookie,
    });
    if (studentTeacherRoute.status === 403) {
      console.log('  ✅ Student accessing teacher route rejected with 403 Forbidden');
    } else {
      throw new Error(`Expected 403, got ${studentTeacherRoute.status}`);
    }

    // Student attempting admin endpoint
    const studentAdminRoute = await makeRequest({
      port: TEST_PORT,
      method: 'GET',
      path: '/api/v1/admin/stats',
      cookie: student1Cookie,
    });
    if (studentAdminRoute.status === 403) {
      console.log('  ✅ Student accessing admin route rejected with 403 Forbidden');
    } else {
      throw new Error(`Expected 403, got ${studentAdminRoute.status}`);
    }

    // Teacher attempting admin endpoint
    const teacherAdminRoute = await makeRequest({
      port: TEST_PORT,
      method: 'GET',
      path: '/api/v1/admin/stats',
      cookie: teacherACookie,
    });
    if (teacherAdminRoute.status === 403) {
      console.log('  ✅ Teacher accessing admin route rejected with 403 Forbidden');
    } else {
      throw new Error(`Expected 403, got ${teacherAdminRoute.status}`);
    }

    // ----------------------------------------------------
    // TEST 4: Teacher Question Management & Ownership
    // ----------------------------------------------------
    console.log('\nTEST 4: Question Management & Strict Ownership Isolation');
    const createQRes = await makeRequest({
      port: TEST_PORT,
      method: 'POST',
      path: '/api/v1/teacher/questions',
      cookie: teacherACookie,
      body: {
        title: `Sum of Two Numbers ${timestamp}`,
        description: 'Read two integers a and b from standard input and print their sum.',
        difficulty: 'Easy',
        tags: ['math', 'basics'],
        inputFormat: 'Two integers separated by space or newline',
        outputFormat: 'Single integer sum',
        testCases: [
          { input: '3 5\n', expectedOutput: '8', isHidden: false },
          { input: '10 20\n', expectedOutput: '30', isHidden: true },
          { input: '-5 5\n', expectedOutput: '0', isHidden: true },
        ],
        status: 'published',
      },
    });

    if (createQRes.status !== 201) {
      throw new Error(`Question creation failed: ${JSON.stringify(createQRes.body)}`);
    }
    const questionId = createQRes.body.data._id;
    console.log(`  ✅ Teacher Alice created question "${createQRes.body.data.title}" (ID: ${questionId})`);

    // Teacher Bob tries to edit Teacher Alice's question
    const bobEditRes = await makeRequest({
      port: TEST_PORT,
      method: 'PATCH',
      path: `/api/v1/teacher/questions/${questionId}`,
      cookie: teacherBCookie,
      body: { title: 'Hacked Title' },
    });
    if (bobEditRes.status === 403) {
      console.log('  ✅ Cross-teacher edit attempt correctly rejected with 403 Forbidden');
    } else {
      throw new Error(`Expected 403 for cross-teacher edit, got ${bobEditRes.status}`);
    }

    // Teacher Bob tries to delete Teacher Alice's question
    const bobDelRes = await makeRequest({
      port: TEST_PORT,
      method: 'DELETE',
      path: `/api/v1/teacher/questions/${questionId}`,
      cookie: teacherBCookie,
    });
    if (bobDelRes.status === 403) {
      console.log('  ✅ Cross-teacher delete attempt correctly rejected with 403 Forbidden');
    } else {
      throw new Error(`Expected 403 for cross-teacher delete, got ${bobDelRes.status}`);
    }

    // ----------------------------------------------------
    // TEST 5: Information Leaking Prevention (Hidden Test Cases)
    // ----------------------------------------------------
    console.log('\nTEST 5: Test Case Security & Data Masking');
    const studentCatalogRes = await makeRequest({
      port: TEST_PORT,
      method: 'GET',
      path: '/api/v1/student/questions',
      cookie: student1Cookie,
    });
    const catalogQuestion = studentCatalogRes.body.data.questions.find(
      (q) => q._id === questionId
    );
    if (!catalogQuestion || catalogQuestion.testCases) {
      throw new Error('Test cases leaked in student question catalog!');
    }
    console.log('  ✅ Student catalog strictly excludes testCases array');

    const studentDetailRes = await makeRequest({
      port: TEST_PORT,
      method: 'GET',
      path: `/api/v1/student/questions/${questionId}`,
      cookie: student1Cookie,
    });
    const studentQ = studentDetailRes.body.data.question;
    if (!studentQ || !studentQ.testCases || studentQ.testCases.length !== 1) {
      throw new Error(`Expected exactly 1 public test case for student, found: ${studentQ?.testCases?.length}`);
    }
    if (studentQ.testCases.some((tc) => tc.isHidden)) {
      throw new Error('Hidden test cases leaked to student question detail endpoint!');
    }
    console.log('  ✅ Student question detail contains ONLY public sample cases (hidden cases stripped)');

    // ----------------------------------------------------
    // TEST 6: Code Execution & Sandboxing
    // ----------------------------------------------------
    console.log('\nTEST 6: Sandboxed Code Execution & Evaluation');
    const javaSolution = `
import java.util.Scanner;
public class Solution {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (sc.hasNextInt()) {
            int a = sc.nextInt();
            int b = sc.nextInt();
            System.out.println(a + b);
        }
    }
}
    `.trim();

    // Run custom code
    const runRes = await makeRequest({
      port: TEST_PORT,
      method: 'POST',
      path: `/api/v1/student/questions/${questionId}/run`,
      cookie: student1Cookie,
      body: {
        language: 'java',
        code: javaSolution,
        customInput: '42 58\n',
      },
    });
    if (runRes.status !== 200 || !runRes.body.data.stdout.includes('100')) {
      throw new Error(`Custom code run failed: ${JSON.stringify(runRes.body)}`);
    }
    console.log('  ✅ Student custom test run executed and returned output "100"');

    // Submit valid code
    const submitRes = await makeRequest({
      port: TEST_PORT,
      method: 'POST',
      path: `/api/v1/student/questions/${questionId}/submissions`,
      cookie: student1Cookie,
      body: {
        language: 'java',
        code: javaSolution,
      },
    });
    if (submitRes.status !== 200 || submitRes.body.data.status !== 'accepted') {
      throw new Error(`Submission failed to be accepted: ${JSON.stringify(submitRes.body)}`);
    }
    const submissionId = submitRes.body.data.submissionId || submitRes.body.data._id;
    console.log(`  ✅ Student 1 submitted code, successfully evaluated as ACCEPTED (all 3 test cases passed)`);

    // Submit wrong code to verify wrong_answer status
    const wrongJava = `
import java.util.Scanner;
public class Solution {
    public static void main(String[] args) {
        System.out.println(-1);
    }
}
    `.trim();
    const wrongSubmitRes = await makeRequest({
      port: TEST_PORT,
      method: 'POST',
      path: `/api/v1/student/questions/${questionId}/submissions`,
      cookie: student1Cookie,
      body: {
        language: 'java',
        code: wrongJava,
      },
    });
    if (wrongSubmitRes.status !== 200 || wrongSubmitRes.body.data.status !== 'wrong_answer') {
      throw new Error(`Expected wrong_answer status, got: ${JSON.stringify(wrongSubmitRes.body)}`);
    }
    console.log('  ✅ Student 1 submitted incorrect code, correctly evaluated as WRONG_ANSWER');

    // ----------------------------------------------------
    // TEST 7: Teacher Dashboard Analytics & Review Workflow
    // ----------------------------------------------------
    console.log('\nTEST 7: Teacher Monitoring Dashboard & Code Review');
    const dashRes = await makeRequest({
      port: TEST_PORT,
      method: 'GET',
      path: `/api/v1/teacher/questions/${questionId}/dashboard`,
      cookie: teacherACookie,
    });
    if (dashRes.status !== 200) {
      throw new Error(`Failed to load teacher dashboard: ${JSON.stringify(dashRes.body)}`);
    }
    const metrics = dashRes.body.data.metrics;
    console.log(`  Metrics computed:`, metrics);
    if (metrics.submittedCount < 1 || metrics.pendingCount < 1) {
      throw new Error(`Dashboard counters mismatch! Submitted: ${metrics.submittedCount}, Pending: ${metrics.pendingCount}`);
    }
    console.log('  ✅ Dashboard accurately computes submitted and pending student counts');

    // Bob cannot view Alice's dashboard
    const bobDashRes = await makeRequest({
      port: TEST_PORT,
      method: 'GET',
      path: `/api/v1/teacher/questions/${questionId}/dashboard`,
      cookie: teacherBCookie,
    });
    if (bobDashRes.status === 403) {
      console.log('  ✅ Cross-teacher dashboard access rejected with 403 Forbidden');
    } else {
      throw new Error(`Expected 403 for unauthorized dashboard access, got ${bobDashRes.status}`);
    }

    // Teacher Alice reviews Student 1's submission
    const reviewRes = await makeRequest({
      port: TEST_PORT,
      method: 'PATCH',
      path: `/api/v1/teacher/submissions/${submissionId}/review`,
      cookie: teacherACookie,
      body: {
        feedback: 'Excellent work, clean Scanner logic!',
        status: 'reviewed',
      },
    });
    if (reviewRes.status !== 200 || reviewRes.body.data.teacherReview.status !== 'reviewed') {
      throw new Error(`Teacher review failed: ${JSON.stringify(reviewRes.body)}`);
    }
    console.log('  ✅ Teacher Alice reviewed submission, feedback saved');

    // ----------------------------------------------------
    // TEST 8: Question Archiving on Delete
    // ----------------------------------------------------
    console.log('\nTEST 8: Question Archiving Safeguard');
    const deleteQRes = await makeRequest({
      port: TEST_PORT,
      method: 'DELETE',
      path: `/api/v1/teacher/questions/${questionId}`,
      cookie: teacherACookie,
    });
    if (deleteQRes.status !== 200 || !deleteQRes.body.data.archived) {
      throw new Error(`Expected question to be archived due to existing submissions, got: ${JSON.stringify(deleteQRes.body)}`);
    }
    console.log('  ✅ Question with existing student submissions safely archived instead of hard-deleted');

    console.log('\n====================================================');
    console.log('🎉 ALL PHASE 7 HARDENING & E2E INTEGRATION TESTS PASSED!');
    console.log('====================================================\n');
  } finally {
    if (server) server.close();
    await mongoose.connection.close();
  }
}

runTestSuite().catch((err) => {
  console.error('\n❌ TEST SUITE FAILED:', err);
  if (server) server.close();
  process.exit(1);
});
