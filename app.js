const express = require('express');
const cors = require('cors');
const app = express();

// Middleware (ডাটা পড়া ও রিসিভ করার জন্য এটি অত্যন্ত জরুরি)
app.use(cors()); // ফ্রন্টএন্ড থেকে কানেকশন এলাউ করার জন্য
app.use(express.json()); // JSON ডাটা পার্স করার জন্য

// ডাটা গ্রহণ করার POST Route
app.post('/api/admission', (req, res) => {
  // ফ্রন্টএন্ড থেকে আসা ডাটা req.body তে পাওয়া যাবে
  const receivedData = req.body;
  
  console.log('req.body:', receivedData);

  // সফলভাবে ডাটা পাওয়ার পর ফ্রন্টএন্ডে উত্তর পাঠানো
  res.status(200).json({
    success: true,
    message: 'ফরম সফলভাবে জমা হয়েছে!',
    data: receivedData
  });
});

app.listen(5000, () => {
  console.log('Backend Server is running on http://localhost:5000');
});