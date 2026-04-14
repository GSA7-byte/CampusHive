const axios = require("axios");

const testAuth = async () => {
  const baseURL = "http://localhost:4000/api";
  const testEmail = `test_student_${Date.now()}@test.com`;
  const testEnrollment = `ENROLL_${Date.now()}`;
  const testPassword = "password123";

  try {
    console.log("1. Registering test student...");
    const regRes = await axios.post(`${baseURL}/auth/register`, {
      firstName: "Test",
      lastName: "Student",
      email: testEmail,
      password: testPassword,
      phone: "1234567890",
      enrollmentNo: testEnrollment,
      department: "CSE",
      year: "3",
      role: "student"
    });
    console.log("Registration Response:", regRes.data);

    if (regRes.data.success) {
      console.log("\n2. Logging in with Email (exact case)...");
      const loginRes1 = await axios.post(`${baseURL}/auth/login`, {
        email: testEmail,
        password: testPassword
      });
      console.log("Login 1 Success:", loginRes1.data.success);

      console.log("\n3. Logging in with Email (uppercase)...");
      const loginRes2 = await axios.post(`${baseURL}/auth/login`, {
        email: testEmail.toUpperCase(),
        password: testPassword
      });
      console.log("Login 2 Success:", loginRes2.data.success);

      console.log("\n4. Logging in with Enrollment Number (exact case)...");
      const loginRes3 = await axios.post(`${baseURL}/auth/login`, {
        email: testEnrollment,
        password: testPassword
      });
      console.log("Login 3 Success:", loginRes3.data.success);

      console.log("\n5. Logging in with Enrollment Number (lowercase)...");
      const loginRes4 = await axios.post(`${baseURL}/auth/login`, {
        email: testEnrollment.toLowerCase(),
        password: testPassword
      });
      console.log("Login 4 Success:", loginRes4.data.success);
    }
  } catch (error) {
    console.error("Test Failed:");
    if (error.response) {
      console.error("Response Error:", error.response.status, error.response.data);
    } else {
      console.error("Error Message:", error.message);
    }
  }
};

testAuth();
