import React, { useState, useEffect, useRef } from 'react';
import { Camera, Upload, DollarSign, Bell, PieChart, Calendar, Trash2, Edit2, Check, X, Download } from 'lucide-react';
import { PieChart as RePieChart, Pie, Cell, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Tesseract from 'tesseract.js';

const ReceiptScanner = () => {
  const [receipts, setReceipts] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('upload');
  const [budget, setBudget] = useState({ 
    Groceries: 500, 
    Dining: 300, 
    Transport: 200, 
    Shopping: 400, 
    Other: 200 
  });
  const [editingReceipt, setEditingReceipt] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const saved = localStorage.getItem('receipts');
    if (saved) {
      try {
        setReceipts(JSON.parse(saved));
      } catch (e) {
        console.error('Error loading receipts:', e);
      }
    }
  }, []);

  useEffect(() => {
    if (receipts.length > 0) {
      localStorage.setItem('receipts', JSON.stringify(receipts));
    }
  }, [receipts]);

  const extractReceiptData = (text) => {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line);
    
    let total = 0;
    const totalPatterns = [
      /total[:\s]*\$?\s*(\d+\.?\d{0,2})/i,
      /amount[:\s]*\$?\s*(\d+\.?\d{0,2})/i,
      /balance[:\s]*\$?\s*(\d+\.?\d{0,2})/i,
    ];
    
    for (const pattern of totalPatterns) {
      const match = text.match(pattern);
      if (match) {
        total = parseFloat(match[1]);
        break;
      }
    }
    
    if (total === 0) {
      const numbers = text.match(/\$?\s*(\d+\.\d{2})/g);
      if (numbers) {
        const amounts = numbers.map(n => parseFloat(n.replace('$', '')));
        total = Math.max(...amounts);
      }
    }

    let date = new Date().toISOString().split('T')[0];
    const datePatterns = [
      /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/,
      /(\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})/,
    ];
    
    for (const pattern of datePatterns) {
      const match = text.match(pattern);
      if (match) {
        try {
          const parsedDate = new Date(match[1]);
          if (!isNaN(parsedDate.getTime())) {
            date = parsedDate.toISOString().split('T')[0];
            break;
          }
        } catch (e) {
          continue;
        }
      }
    }

    let merchant = 'Unknown Merchant';
    const topLines = lines.slice(0, 5);
    for (const line of topLines) {
      if (line.length > 3 && line.length < 50 && !/\d{2,}/.test(line)) {
        merchant = line;
        break;
      }
    }

    const merchantLower = merchant.toLowerCase();
    let category = 'Other';
    
    if (merchantLower.includes('walmart') || merchantLower.includes('target') || 
        merchantLower.includes('grocery') || merchantLower.includes('market')) {
      category = 'Groceries';
    } else if (merchantLower.includes('restaurant') || merchantLower.includes('cafe') ||
               merchantLower.includes('starbucks') || merchantLower.includes('pizza')) {
      category = 'Dining';
    } else if (merchantLower.includes('gas') || merchantLower.includes('shell') ||
               merchantLower.includes('uber') || merchantLower.includes('lyft')) {
      category = 'Transport';
    } else if (merchantLower.includes('amazon') || merchantLower.includes('shop')) {
      category = 'Shopping';
    }

    const items = [];
    for (const line of lines) {
      if (/\d+\.\d{2}/.test(line) && line.length < 100) {
        const cleaned = line.replace(/\$?\s*\d+\.\d{2}/, '').trim();
        if (cleaned.length > 2) {
          items.push(cleaned);
        }
      }
    }

    return {
      merchant,
      total: total || 0,
      date,
      category,
      items: items.slice(0, 10)
    };
  };

  const performOCR = async (imageData) => {
    try {
      const { data: { text } } = await Tesseract.recognize(
        imageData,
        'eng',
        {
          logger: m => console.log(m)
        }
      );
      return text;
    } catch (error) {
      console.error('Tesseract error:', error);
      throw error;
    }
  };

  const processReceipt = async (file) => {
    setProcessing(true);
    
    try {
      const imageUrl = URL.createObjectURL(file);
      const img = new Image();
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = imageUrl;
      });

      // Pass the Image element directly instead of imageData
      const text = await performOCR(img);
      
      console.log('OCR Text:', text);
      
      const receiptData = extractReceiptData(text);
      
      const newReceipt = {
        id: Date.now(),
        ...receiptData,
        rawText: text
      };

      setReceipts([newReceipt, ...receipts]);
      setEditingReceipt(newReceipt);
      setProcessing(false);
      setActiveTab('receipts');
      
      URL.revokeObjectURL(imageUrl);
    } catch (error) {
      console.error('OCR Error:', error);
      
      const manualReceipt = {
        id: Date.now(),
        merchant: 'Manual Entry',
        date: new Date().toISOString().split('T')[0],
        total: 0,
        category: 'Other',
        items: []
      };
      
      setReceipts([manualReceipt, ...receipts]);
      setEditingReceipt(manualReceipt);
      setProcessing(false);
      setActiveTab('receipts');
      alert('OCR processing failed. Please enter receipt details manually.');
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert('File too large. Please use an image under 10MB.');
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        alert('Please upload an image file (JPG, PNG, etc.)');
        return;
      }
      
      processReceipt(file);
    }
  };

  const deleteReceipt = (id) => {
    if (confirm('Delete this receipt?')) {
      const updated = receipts.filter(r => r.id !== id);
      setReceipts(updated);
      localStorage.setItem('receipts', JSON.stringify(updated));
    }
  };

  const saveEditedReceipt = () => {
    const updated = receipts.map(r => r.id === editingReceipt.id ? editingReceipt : r);
    setReceipts(updated);
    setEditingReceipt(null);
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Merchant', 'Category', 'Amount', 'Items'];
    const rows = receipts.map(r => [
      r.date, 
      r.merchant, 
      r.category, 
      r.total,
      r.items ? r.items.join('; ') : ''
    ]);
    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipts_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const monthlyReceipts = receipts.filter(r => {
    const receiptDate = new Date(r.date);
    return receiptDate.getMonth() === currentMonth && receiptDate.getFullYear() === currentYear;
  });

  const totalSpending = monthlyReceipts.reduce((sum, r) => sum + r.total, 0);
  
  const categoryData = Object.keys(budget).map(category => {
    const spent = monthlyReceipts.filter(r => r.category === category).reduce((sum, r) => sum + r.total, 0);
    return {
      name: category,
      spent: parseFloat(spent.toFixed(2)),
      budget: budget[category],
      percentage: budget[category] > 0 ? ((spent / budget[category]) * 100).toFixed(1) : 0
    };
  });

  const alerts = categoryData.filter(c => c.spent > c.budget * 0.8).map(c => ({
    category: c.name,
    message: c.spent > c.budget ? `Over budget by $${(c.spent - c.budget).toFixed(2)}` : `${c.percentage}% of budget used`,
    severity: c.spent > c.budget ? 'high' : 'medium'
  }));

  const dailyData = monthlyReceipts.reduce((acc, r) => {
    const day = new Date(r.date).getDate();
    if (!acc[day]) acc[day] = 0;
    acc[day] += r.total;
    return acc;
  }, {});

  const trendData = Object.keys(dailyData).sort((a, b) => a - b).map(day => ({
    day: `Day ${day}`,
    amount: parseFloat(dailyData[day].toFixed(2))
  }));

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-2 sm:p-4 md:p-6 lg:p-8 w-full overflow-x-hidden">
      <div className="w-full max-w-7xl mx-auto px-2 sm:px-4">
        <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 flex items-center gap-2 sm:gap-3">
                <Camera className="text-blue-600" />
                Receipt Scanner
              </h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">Track expenses with AI-powered scanning</p>
            </div>
            <button
              onClick={exportToCSV}
              disabled={receipts.length === 0}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition disabled:opacity-50 text-sm sm:text-base"
            >
              <Download size={18} />
              Export CSV
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg mb-4 sm:mb-6 p-2 grid grid-cols-1 sm:grid-cols-3 gap-2 w-full">
          <button
            onClick={() => setActiveTab('upload')}
            className={`px-2 sm:px-4 py-2 sm:py-3 rounded-lg font-medium transition text-sm ${
              activeTab === 'upload' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Upload className="inline mr-1 sm:mr-2" size={16} />
            <span className="hidden sm:inline">Upload</span>
          </button>
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-2 sm:px-4 py-2 sm:py-3 rounded-lg font-medium transition text-sm ${
              activeTab === 'dashboard' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <PieChart className="inline mr-1 sm:mr-2" size={16} />
            <span className="hidden sm:inline">Dashboard</span>
          </button>
          <button
            onClick={() => setActiveTab('receipts')}
            className={`px-2 sm:px-4 py-2 sm:py-3 rounded-lg font-medium transition text-sm ${
              activeTab === 'receipts' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Calendar className="inline mr-1 sm:mr-2" size={16} />
            <span className="hidden sm:inline">Receipts</span> ({receipts.length})
          </button>
        </div>

        {activeTab === 'upload' && (
          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 lg:p-8">
            <div className="text-center">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
                disabled={processing}
              />
              <div 
                onClick={() => !processing && fileInputRef.current?.click()}
                className="border-4 border-dashed border-blue-300 rounded-xl p-6 sm:p-8 lg:p-12 hover:border-blue-500 transition cursor-pointer"
              >
                {processing ? (
                  <div className="text-blue-600">
                    <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-lg sm:text-xl font-semibold">Processing receipt...</p>
                    <p className="text-xs sm:text-sm mt-2">Extracting data from image</p>
                  </div>
                ) : (
                  <>
                    <Upload className="mx-auto text-blue-600 mb-4" size={48} />
                    <p className="text-lg sm:text-xl font-semibold text-gray-700 mb-2">Upload Receipt Image</p>
                    <p className="text-sm sm:text-base text-gray-500">Click to select a receipt photo</p>
                    <p className="text-xs sm:text-sm text-gray-400 mt-2">Supports JPG, PNG (max 10MB)</p>
                  </>
                )}
              </div>
            </div>

            <div className="mt-6 sm:mt-8 bg-blue-50 rounded-lg p-4 sm:p-6">
              <h3 className="font-semibold text-gray-800 mb-3 text-sm sm:text-base">📸 Tips:</h3>
              <ul className="space-y-2 text-xs sm:text-sm text-gray-700">
                <li>• Ensure good lighting</li>
                <li>• Keep receipt flat and fully visible</li>
                <li>• Capture entire receipt including total</li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'dashboard' && (
          <div className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
              <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-xs sm:text-sm">Total Spending</p>
                    <p className="text-2xl sm:text-3xl font-bold text-gray-800">${totalSpending.toFixed(2)}</p>
                    <p className="text-xs text-gray-500 mt-1">This month</p>
                  </div>
                  <DollarSign className="text-blue-600" size={32} />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-xs sm:text-sm">Receipts</p>
                    <p className="text-2xl sm:text-3xl font-bold text-gray-800">{monthlyReceipts.length}</p>
                    <p className="text-xs text-gray-500 mt-1">This month</p>
                  </div>
                  <Calendar className="text-green-600" size={32} />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-xs sm:text-sm">Alerts</p>
                    <p className="text-2xl sm:text-3xl font-bold text-gray-800">{alerts.length}</p>
                    <p className="text-xs text-gray-500 mt-1">Warnings</p>
                  </div>
                  <Bell className="text-red-600" size={32} />
                </div>
              </div>
            </div>

            {alerts.length > 0 && (
              <div className="bg-red-50 border-l-4 border-red-500 rounded-lg shadow-lg p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-semibold text-red-800 mb-3 flex items-center gap-2">
                  <Bell size={20} />
                  Budget Alerts
                </h3>
                {alerts.map((alert, idx) => (
                  <div key={idx} className="bg-white rounded p-3 mb-2 last:mb-0">
                    <p className="font-medium text-gray-800 text-sm sm:text-base">{alert.category}</p>
                    <p className={`text-xs sm:text-sm ${alert.severity === 'high' ? 'text-red-600' : 'text-orange-600'}`}>
                      ⚠️ {alert.message}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {receipts.length === 0 ? (
              <div className="bg-white rounded-lg shadow-lg p-8 sm:p-12 text-center">
                <Upload className="mx-auto text-gray-400 mb-4" size={48} />
                <h3 className="text-lg sm:text-xl font-semibold text-gray-700 mb-2">No receipts yet</h3>
                <p className="text-sm sm:text-base text-gray-500 mb-6">Upload your first receipt</p>
                <button
                  onClick={() => setActiveTab('upload')}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition text-sm sm:text-base"
                >
                  Upload Receipt
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 w-full">
                  <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 w-full overflow-x-auto">
                    <h3 className="text-lg sm:text-xl font-semibold mb-4 text-gray-800">By Category</h3>
                    {categoryData.filter(c => c.spent > 0).length > 0 ? (
                      <ResponsiveContainer width="100%" height={250} minWidth={250}>
                        <RePieChart>
                          <Pie
                            data={categoryData.filter(c => c.spent > 0)}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, spent }) => `${name}: $${spent}`}
                            outerRadius={70}
                            fill="#8884d8"
                            dataKey="spent"
                          >
                            {categoryData.map((entry, index) => (
                              <Cell key={index} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </RePieChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-gray-500 text-center py-12 text-sm">No data</p>
                    )}
                  </div>

                  <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 w-full overflow-x-auto">
                    <h3 className="text-lg sm:text-xl font-semibold mb-4 text-gray-800">Budget vs Actual</h3>
                    <ResponsiveContainer width="100%" height={250} minWidth={250}>
                      <BarChart data={categoryData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" tick={{fontSize: 10}} />
                        <YAxis tick={{fontSize: 10}} />
                        <Tooltip />
                        <Legend wrapperStyle={{fontSize: '10px'}} />
                        <Bar dataKey="budget" fill="#93c5fd" name="Budget" />
                        <Bar dataKey="spent" fill="#3b82f6" name="Spent" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {trendData.length > 0 && (
                  <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 w-full overflow-x-auto">
                    <h3 className="text-lg sm:text-xl font-semibold mb-4 text-gray-800">Daily Trend</h3>
                    <ResponsiveContainer width="100%" height={250} minWidth={250}>
                      <LineChart data={trendData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="day" tick={{fontSize: 10}} />
                        <YAxis tick={{fontSize: 10}} />
                        <Tooltip />
                        <Legend wrapperStyle={{fontSize: '10px'}} />
                        <Line type="monotone" dataKey="amount" stroke="#3b82f6" strokeWidth={2} name="Spending ($)" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {activeTab === 'receipts' && (
          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
            <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-gray-800">All Receipts</h2>
            {receipts.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="mx-auto text-gray-400 mb-4" size={48} />
                <p className="text-sm sm:text-base text-gray-500 mb-6">No receipts yet</p>
                <button
                  onClick={() => setActiveTab('upload')}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition text-sm sm:text-base"
                >
                  Upload Receipt
                </button>
              </div>
            ) : (
              <div className="space-y-3 w-full">
                {receipts.map(receipt => (
                  <div key={receipt.id} className="border rounded-lg p-3 sm:p-4 hover:shadow-md transition w-full overflow-hidden">
                    {editingReceipt?.id === receipt.id ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Merchant</label>
                            <input
                              type="text"
                              value={editingReceipt.merchant}
                              onChange={(e) => setEditingReceipt({...editingReceipt, merchant: e.target.value})}
                              className="w-full border rounded px-3 py-2 text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Date</label>
                            <input
                              type="date"
                              value={editingReceipt.date}
                              onChange={(e) => setEditingReceipt({...editingReceipt, date: e.target.value})}
                              className="w-full border rounded px-3 py-2 text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Amount ($)</label>
                            <input
                              type="number"
                              step="0.01"
                              value={editingReceipt.total}
                              onChange={(e) => setEditingReceipt({...editingReceipt, total: parseFloat(e.target.value) || 0})}
                              className="w-full border rounded px-3 py-2 text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Category</label>
                            <select
                              value={editingReceipt.category}
                              onChange={(e) => setEditingReceipt({...editingReceipt, category: e.target.value})}
                              className="w-full border rounded px-3 py-2 text-sm"
                            >
                              {Object.keys(budget).map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={saveEditedReceipt}
                            className="flex items-center gap-2 bg-green-600 text-white px-3 sm:px-4 py-2 rounded hover:bg-green-700 text-sm"
                          >
                            <Check size={16} />
                            Save
                          </button>
                          <button
                            onClick={() => setEditingReceipt(null)}
                            className="flex items-center gap-2 bg-gray-600 text-white px-3 sm:px-4 py-2 rounded hover:bg-gray-700 text-sm"
                          >
                            <X size={16} />
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row justify-between gap-3">
                        <div className="flex-1 flex items-center gap-3">
                          <div className="bg-blue-100 rounded-lg p-2 sm:p-3">
                            <DollarSign className="text-blue-600" size={20} />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-800 text-sm sm:text-base">{receipt.merchant}</h3>
                            <p className="text-xs sm:text-sm text-gray-600">{receipt.date}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 justify-between sm:justify-end">
                          <div className="text-right">
                            <p className="text-xl sm:text-2xl font-bold text-gray-800">${receipt.total.toFixed(2)}</p>
                            <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mt-1">
                              {receipt.category}
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setEditingReceipt(receipt)}
                              className="text-blue-600 hover:text-blue-800 p-2 hover:bg-blue-50 rounded transition"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button
                              onClick={() => deleteReceipt(receipt.id)}
                              className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded transition"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReceiptScanner;