
const testData = {
  patient_id: 'e923f284-3b56-4e1a-b8e7-acc203e79a87',
  pressure_readings: { p1: 10, p2: 15, p3: 12, p4: 18 },
  temperature: 42.0, // Should trigger high_temperature alert (>35.0)
  battery_percentage: 8, // Should trigger low_battery alert (<15)
  pump_percentage: 5 // Should trigger pump_error alert (<10)
};

async function testIngest() {
  console.log('Sending mock data to /api/ingest...');
  try {
    const response = await fetch('http://localhost:3000/api/ingest', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': 'my-secret-key'
      },
      body: JSON.stringify(testData)
    });

    const result = await response.json();
    console.log('Response:', JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log('Ingest success! Verifying DB...');
    } else {
      console.error('Ingest failed:', result.error);
    }
  } catch (error) {
    console.error('Error during fetch:', error);
  }
}

testIngest();
