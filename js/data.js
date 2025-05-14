// Load city base data
export async function loadCityBaseData() {
  // City data 
  return {
    'nyc': { 
      id: 'nyc', 
      name: 'New York City', 
      state: 'NY', 
      coordinates: [40.7128, -74.0060],
      emoji: '🗽'
    },
    'dc': { 
      id: 'dc', 
      name: 'Washington D.C.', 
      state: 'DC', 
      coordinates: [38.9072, -77.0369],
      emoji: '🏛️'
    },
    'lasvegas': { 
      id: 'lasvegas', 
      name: 'Las Vegas', 
      state: 'NV', 
      coordinates: [36.1699, -115.1398],
      emoji: '🎰'
    },
    'chicago': { 
      id: 'chicago', 
      name: 'Chicago', 
      state: 'IL', 
      coordinates: [41.8781, -87.6298],
      emoji: '🌆'
    },
    'boston': { 
      id: 'boston', 
      name: 'Boston', 
      state: 'MA', 
      coordinates: [42.3601, -71.0589],
      emoji: '🎓'
    },
    'miami': { 
      id: 'miami', 
      name: 'Miami', 
      state: 'FL', 
      coordinates: [25.7617, -80.1918],
      emoji: '🏖️'
    },
    'sanfrancisco': { 
      id: 'sanfrancisco', 
      name: 'San Francisco', 
      state: 'CA', 
      coordinates: [37.7749, -122.4194],
      emoji: '🌉'
    },
    'orlando': { 
      id: 'orlando', 
      name: 'Orlando', 
      state: 'FL', 
      coordinates: [28.5383, -81.3792],
      emoji: '🎡'
    },
    'neworleans': { 
      id: 'neworleans', 
      name: 'New Orleans', 
      state: 'LA', 
      coordinates: [29.9511, -90.0715],
      emoji: '🎭'
    },
    'seattle': { 
      id: 'seattle', 
      name: 'Seattle', 
      state: 'WA', 
      coordinates: [47.6062, -122.3321],
      emoji: '☕'
    }
  };
}

// Load monthly data from JSON file
export async function loadMonthlyData(month, year) {
  try {
    console.log(`Loading data for ${month}/${year}`);
    
    const jsonData = await loadJsonData();
    
    if (jsonData) {
      // Get data for specific month/year
      const key = `${month}-${year}`;
      const monthData = jsonData[key];
      
      if (monthData && monthData.length > 0) {
        console.log("Tourism data loaded:", monthData);
        return monthData;
      }
    }
    
    console.warn(`No data found for ${month}/${year}, using fallback data`);
    return getFallbackData(month, year);
  } catch (error) {
    console.error(`Error loading monthly data for ${month}/${year}:`, error);
    return getFallbackData(month, year);
  }
}

async function loadJsonData() {
  try {
    const response = await fetch('data/tourism-data.json');
    
    if (!response.ok) {
      throw new Error(`Failed to load tourism data: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error loading JSON data:', error);
    return null;
  }
}

function getFallbackData(month, year) {
  const fallbackData = {
    // November 2024 
    '11-2024': [
      { city_id: 'nyc', city_name: 'New York City', visitors: 850000, revenue: 1200000000, satisfaction: 4.3, avg_stay: 3.2 },
      { city_id: 'dc', city_name: 'Washington D.C.', visitors: 320000, revenue: 450000000, satisfaction: 4.5, avg_stay: 2.7 },
      { city_id: 'lasvegas', city_name: 'Las Vegas', visitors: 780000, revenue: 980000000, satisfaction: 4.1, avg_stay: 3.5 },
      { city_id: 'chicago', city_name: 'Chicago', visitors: 410000, revenue: 520000000, satisfaction: 4.0, avg_stay: 2.3 },
      { city_id: 'boston', city_name: 'Boston', visitors: 290000, revenue: 380000000, satisfaction: 4.4, avg_stay: 2.5 },
      { city_id: 'miami', city_name: 'Miami', visitors: 560000, revenue: 780000000, satisfaction: 4.6, avg_stay: 4.0 },
      { city_id: 'sanfrancisco', city_name: 'San Francisco', visitors: 480000, revenue: 720000000, satisfaction: 4.2, avg_stay: 3.1 }
    ],
    
    // December 2024
    '12-2024': [
      { city_id: 'nyc', city_name: 'New York City', visitors: 1200000, revenue: 1850000000, satisfaction: 4.5, avg_stay: 3.5 },
      { city_id: 'dc', city_name: 'Washington D.C.', visitors: 380000, revenue: 520000000, satisfaction: 4.3, avg_stay: 2.9 },
      { city_id: 'lasvegas', city_name: 'Las Vegas', visitors: 950000, revenue: 1350000000, satisfaction: 4.4, avg_stay: 3.8 },
      { city_id: 'chicago', city_name: 'Chicago', visitors: 450000, revenue: 580000000, satisfaction: 4.1, avg_stay: 2.5 },
      { city_id: 'boston', city_name: 'Boston', visitors: 320000, revenue: 420000000, satisfaction: 4.2, avg_stay: 2.6 },
      { city_id: 'miami', city_name: 'Miami', visitors: 720000, revenue: 980000000, satisfaction: 4.7, avg_stay: 4.5 },
      { city_id: 'sanfrancisco', city_name: 'San Francisco', visitors: 420000, revenue: 650000000, satisfaction: 4.0, avg_stay: 2.9 }
    ],
    
    // January 2025
    '01-2025': [
      { city_id: 'nyc', city_name: 'New York City', visitors: 720000, revenue: 980000000, satisfaction: 4.2, avg_stay: 3.0 },
      { city_id: 'dc', city_name: 'Washington D.C.', visitors: 420000, revenue: 580000000, satisfaction: 4.4, avg_stay: 3.1 },
      { city_id: 'lasvegas', city_name: 'Las Vegas', visitors: 820000, revenue: 1150000000, satisfaction: 4.3, avg_stay: 3.6 },
      { city_id: 'chicago', city_name: 'Chicago', visitors: 280000, revenue: 350000000, satisfaction: 3.9, avg_stay: 2.2 },
      { city_id: 'boston', city_name: 'Boston', visitors: 230000, revenue: 310000000, satisfaction: 4.0, avg_stay: 2.4 },
      { city_id: 'miami', city_name: 'Miami', visitors: 840000, revenue: 1180000000, satisfaction: 4.8, avg_stay: 4.7 },
      { city_id: 'sanfrancisco', city_name: 'San Francisco', visitors: 390000, revenue: 590000000, satisfaction: 4.1, avg_stay: 2.8 }
    ],
    
    // Default fallback
    'default': [
      { city_id: 'nyc', city_name: 'New York City', visitors: 500000, revenue: 750000000, satisfaction: 4.0, avg_stay: 3.0 },
      { city_id: 'dc', city_name: 'Washington D.C.', visitors: 300000, revenue: 400000000, satisfaction: 4.2, avg_stay: 2.5 },
      { city_id: 'lasvegas', city_name: 'Las Vegas', visitors: 600000, revenue: 800000000, satisfaction: 4.0, avg_stay: 3.0 },
      { city_id: 'chicago', city_name: 'Chicago', visitors: 350000, revenue: 450000000, satisfaction: 3.8, avg_stay: 2.0 },
      { city_id: 'boston', city_name: 'Boston', visitors: 250000, revenue: 300000000, satisfaction: 4.0, avg_stay: 2.0 },
      { city_id: 'miami', city_name: 'Miami', visitors: 400000, revenue: 600000000, satisfaction: 4.2, avg_stay: 3.5 },
      { city_id: 'sanfrancisco', city_name: 'San Francisco', visitors: 300000, revenue: 450000000, satisfaction: 4.0, avg_stay: 2.5 }
    ]
  };
  
  // Get correct data key
  const dataKey = `${month}-${year}`;
  
  // Return data if it exists, otherwise return default
  return fallbackData[dataKey] || fallbackData['default'];
}