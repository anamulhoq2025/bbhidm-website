const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
// public ফোল্ডারটি স্ট্যাটিক হিসেবে যুক্ত করা
app.use(express.static(path.join(__dirname, 'public')));
// হোমপেজে গেলে index.html ফাইলটি দেখাবে
app.get('/', (req, res) => {
 res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
// ১. মিডলওয়্যার (বড় ফাইল এবং JSON রিসিভ করার জন্য লিমিট বাড়িয়ে দেওয়া হয়েছে)
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// হোম পেজ রাউট
app.get('/', (req, res) => {res.status(200).send('<h1>বগাছতর বায়তুল হুদা আইডিয়াল দাখিল মাদ্রাসা সার্ভার সফলভাবে চলছে! 🚀</h1>');
});

// ২. ফাইল আপলোডের জন্য ফোল্ডার তৈরি ও স্ট্যাটিক হিসেবে সার্ভ করা
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) { fs.mkdirSync(uploadDir, { recursive: true });
}
app.use('/uploads', express.static(uploadDir));

// ৩. Multer ফাইল আপলোড কনফিগারেশন
const storage = multer.diskStorage({ destination: function (req, file, cb) {
 cb(null, uploadDir);
 },
 filename: function (req, file, cb) {
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
  cb(null, uniqueSuffix + path.extname(file.originalname));
 }
});

const upload = multer({ 
 storage: storage,
 limits: { fileSize: 10 * 1024 * 1024 } // সর্বোচ্চ ১০ মেগাবাইট
});

// ইন-মেমোরি ডেটাবেস স্টোরেজ
let notices = [];
let admissions = [];
let photos = [];
let videos = [];
let academicYearData = { year: "২০২৬" };
let adminCredentials = { password: "admin" }; 
const otpStorage = {}; 

/* ==================== নোটিশ এপিআই (Notice APIs) ==================== */

// সকল নোটিশ দেখার জন্য (পাবলিক)
app.get('/api/notices', (req, res) => {
 try {
  return res.status(200).json({ success: true, data: notices });
 } catch (error) {
  return res.status(500).json({ success: false, message: error.message });
 }
});

// অ্যাডমিন প্যানেলের জন্য সকল নোটিশ দেখার রাউট (404 সমস্যার সমাধান)
app.get('/api/admin/notices', (req, res) => {
 try {
  return res.status(200).json({ success: true, data: notices });
 } catch (error) {
  return res.status(500).json({ success: false, message: error.message });
 }
});

// নতুন নোটিশ তৈরি করা
app.post('/api/admin/notices', upload.single('file'), (req, res) => {
 try {
  const { title, category, description, isPinned } = req.body;

 if (!title || !category || !description) {
 return res.status(400).json({ 
 success: false, 
 message: 'শিরোনাম, ক্যাটাগরি এবং বিবরণ দেওয়া বাধ্যতামূলক।' 
 });
 }

 let fileUrl = null;
 if (req.file) {
 fileUrl = `http://localhost:${PORT}/uploads/${req.file.filename}`;
 }

 const newNotice = {
 id: Date.now().toString(),
 title,
 category,
 description,
 isPinned: isPinned === 'true' || isPinned === true,
 fileUrl,
 date: new Date().toLocaleDateString('bn-BD')
 };

 if (newNotice.isPinned) {
 notices.unshift(newNotice);
 } else {
 notices.push(newNotice);
 }

 return res.status(201).json({
 success: true,
 message: 'নোটিশ সফলভাবে তৈরি হয়েছে।',
 data: newNotice
 });
 } catch (error) {
 console.error('Notice creation error:', error);
 return res.status(500).json({ success: false, message: 'সার্ভারে অভ্যন্তরীণ ত্রুটি হয়েছে: ' + error.message });
 }
});

// নোটিশ আপডেট বা এডিট করার রাউট
app.put('/api/notices/:id', upload.single('file'), (req, res) => {
 try {
  const { id } = req.params;
 const { title, category, description } = req.body;

 let notice = notices.find(n => n.id === id || n._id === id);
 if (!notice) {
 return res.status(404).json({ success: false, message: 'নোটিশ পাওয়া যায়নি।' });
 }

 if (title) notice.title = title;
 if (category) notice.category = category;
 if (description) notice.description = description;

 if (req.file) {
 notice.fileUrl = `http://localhost:${PORT}/uploads/${req.file.filename}`;
 }

 return res.status(200).json({
 success: true,
 message: 'নোটিশ সফলভাবে আপডেট হয়েছে।',
 data: notice
 });
 } catch (error) {
 return res.status(500).json({ success: false, message: error.message });
 }
});

// নোটিশ ডিলিট করা
app.delete('/api/admin/notices/:id', (req, res) => {
 try {
 const { id } = req.params;
 notices = notices.filter(n => n.id !== id && n._id !== id);
 return res.status(200).json({ success: true, message: 'নোটিশ মুছে ফেলা হয়েছে।' });
 } catch (error) {
  return res.status(500).json({ success: false, message: error.message });
 }
});

app.delete('/api/notices/:id', (req, res) => {
 try {
 const { id } = req.params;
 notices = notices.filter(n => n.id !== id && n._id !== id);
 return res.status(200).json({ success: true, message: 'নোটিশ মুছে ফেলা হয়েছে।' });
 } catch (error) {
 return res.status(500).json({ success: false, message: error.message });
 }
});

/* ==================== ভর্তি এপিআই (Admission APIs) ==================== */
app.post('/api/admissions', (req, res) => {
try {
 const newAdmission = { id: Date.now().toString(), ...req.body, status: 'Pending', createdAt: new Date().toISOString() };
  admissions.push(newAdmission);
 return res.status(201).json({ success: true, message: 'আবেদন সফলভাবে জমা হয়েছে।', data: newAdmission });
 } catch (error) {
  return res.status(500).json({ success: false, message: error.message });
 }
});

app.get('/api/admin/admissions', (req, res) => {
 try { return res.status(200).json({ success: true, data: admissions }); } 
 catch (error) { return res.status(500).json({ success: false, message: error.message }); }
});

/* ==================== গ্লোবাল এরর হ্যান্ডলার ==================== */
app.use((err, req, res, next) => {
 console.error('Server Error:', err.stack);
 res.status(500).json({ success: false, message: 'সার্ভারে সমস্যা হয়েছে: ' + err.message });
});

// সার্ভার চালু করা
app.listen(PORT, () => {
 console.log(`🚀 Server running on http://localhost:${PORT}`);
});





