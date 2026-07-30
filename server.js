const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS
app.use(cors({ origin: '*' }));
app.use(express.json());

// Data file path
const DATA_FILE = path.join(__dirname, 'data.json');

// Read data from file
function readData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf8');
      return JSON.parse(content);
    }
  } catch (error) {
    console.log('No data file yet');
  }
  return [];
}

// Write data to file
function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// ============================================================
// ROUTES
// ============================================================

// Root route
app.get('/', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Expense webhook receiver is running!',
    endpoints: {
      'GET /': 'Health check',
      'GET /data': 'Get all expenses',
      'POST /webhook': 'Add new expense'
    }
  });
});

// Get all expenses
app.get('/data', (req, res) => {
  try {
    const data = readData();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to read data' });
  }
});

// Add new expense
app.post('/webhook', (req, res) => {
  try {
    const expense = req.body;
    
    // Validate
    if (!expense.date || !expense.description || !expense.amount) {
      return res.status(400).json({
        error: 'Missing required fields: date, description, amount'
      });
    }
    
    // Add ID
    if (!expense.id) {
      expense.id = Date.now() + '-' + Math.random().toString(36).substr(2, 5);
    }
    
    // Save
    const data = readData();
    data.push(expense);
    writeData(data);
    
    console.log('✅ Added expense:', expense.description);
    res.json({ success: true, id: expense.id });
    
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📍 URL: http://localhost:${PORT}`);
});