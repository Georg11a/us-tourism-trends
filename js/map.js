// map.js - Map visualization with tourism flows, developed and improved with help from Claude
import { loadCityBaseData, loadMonthlyData } from './data.js';

// Debug check for Leaflet availability
console.log("Leaflet library available:", typeof L !== 'undefined');

// Map - US-centered view
const config = {
  mapCenter: [39.8, -98.5], // US center
  defaultZoom: 5,
  minZoom: 4.5,
  maxZoom: 6,
  cityData: {
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
    }
  }
};

// Current state
let currentState = {
  month: '11',
  year: '2024',
  activeCity: null,
  tourismData: null,
  isAnimating: false,
  highlightedCity: null
};

// Main TourismMap class
class TourismMap {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.map = null;
    this.cityMarkers = {};
    this.flowLines = [];
    this.decorativeLines = [];
    this.tooltip = this.createTooltip();
    this.initialized = false;
    this.isDecorativeMode = false; 
    this.cityLabels = {};
    this.usaBounds = L.latLngBounds(
      [24.396308, -125.000000], // Southwest
      [49.384358, -66.934570]  // Northeast
    );
    
    // Bind methods
    this.init = this.init.bind(this);
    this.updateCities = this.updateCities.bind(this);
    this.zoomToCity = this.zoomToCity.bind(this);
    this.resetZoom = this.resetZoom.bind(this);
    this.showTooltip = this.showTooltip.bind(this);
    this.hideTooltip = this.hideTooltip.bind(this);
    this.showCityDetail = this.showCityDetail.bind(this);
    this.createFlowLines = this.createFlowLines.bind(this);
    this.createDecorativeFlows = this.createDecorativeFlows.bind(this);
    this.zoomToCoordinates = this.zoomToCoordinates.bind(this);
    this.highlightCity = this.highlightCity.bind(this);
    this.clearHighlights = this.clearHighlights.bind(this);
    this.setMapMode = this.setMapMode.bind(this);
  }
  
  // Create tooltip
  createTooltip() {
    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip';
    tooltip.style.opacity = 0;
    tooltip.style.position = 'absolute';
    tooltip.style.background = 'rgba(0, 0, 0, 0.8)';
    tooltip.style.color = 'white';
    tooltip.style.padding = '10px';
    tooltip.style.borderRadius = '5px';
    tooltip.style.pointerEvents = 'none';
    tooltip.style.zIndex = '1000';
    tooltip.style.maxWidth = '250px';
    tooltip.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.2)';
    
    document.body.appendChild(tooltip);
    return tooltip;
  }
  
  // Initialize map
  async init() {
    console.log("Map initialization started with Leaflet");
    
    try {
      // Check if Leaflet is available
      if (typeof L === 'undefined') {
        console.error('Leaflet library is not loaded!');
        return false;
      }
      
      // Check if container exists
      if (!this.container) {
        console.error(`Map container not found: map-container`);
        return false;
      }
      
      console.log("Map container found:", this.container);
      
      // Set full-screen dimensions to ensure no gaps
      this.container.style.width = '100%';
      this.container.style.height = '100vh';
      this.container.style.margin = '0';
      this.container.style.padding = '0';
      this.container.style.background = 'none';
      
      // Create the Leaflet map with fixed view options
      this.map = L.map(this.container.id, {
        center: config.mapCenter,
        zoom: config.defaultZoom,
        zoomControl: false, 
        scrollWheelZoom: false, 
        doubleClickZoom: false, 
        touchZoom: false, 
        boxZoom: false, 
        keyboard: false, 
        dragging: false, 
        minZoom: config.minZoom,
        maxZoom: config.maxZoom,
        maxBounds: this.usaBounds, 
        maxBoundsViscosity: 1.0, 
        attributionControl: false 
      });
      
      console.log("Map object created:", this.map);
      
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        subdomains: 'abcd',
        maxZoom: config.maxZoom,
        minZoom: config.minZoom
      }).addTo(this.map);
      
      // Add US states outline layer for clarity
      fetch('https://raw.githubusercontent.com/johan/world.geo.json/master/countries/USA.geo.json')
        .then(response => response.json())
        .then(data => {
          L.geoJSON(data, {
            style: {
              weight: 1,
              color: '#999',
              opacity: 0.5,
              fillColor: '#f8f8f8',
              fillOpacity: 0.01
            }
          }).addTo(this.map);
        })
        .catch(error => console.error("Error loading US GeoJSON:", error));
      
      // Load city data
      await this.loadCityData();
      
      // Update city markers
      this.updateCities();
      
      // Create decorative flow lines for background
      this.createDecorativeFlows();
      
      // Create city connections flow lines
      this.createFlowLines();
      
      // Set map to fixed view of continental US
      this.map.fitBounds(this.usaBounds);
      this.map.setMaxBounds(this.usaBounds);
      
      // Force map to resize after a short delay
      setTimeout(() => {
        if (this.map) {
          console.log("Forcing map resize");
          this.map.invalidateSize(true);
        }
      }, 500);
      
      this.initialized = true;
      console.log("Map initialization completed successfully");
      return true;
    } catch (error) {
      console.error('Map initialization failed:', error);
      return false;
    }
  }

  // Set map mode (decorative or interactive)
  setMapMode(isDecorativeMode = false) {
    console.log(`Setting map mode: ${isDecorativeMode ? 'decorative' : 'interactive'}`);
    this.isDecorativeMode = isDecorativeMode;
    
    if (isDecorativeMode) {
      // Decorative mode settings
      for (const cityId in this.cityMarkers) {
        const marker = this.cityMarkers[cityId];
        if (marker && marker.getElement()) {
          // Get marker elements
          const markerContainer = marker.getElement().querySelector('.map-marker-container');
          const emoji = marker.getElement().querySelector('.emoji-marker');
          
          if (markerContainer) markerContainer.classList.add('decorative');
          if (emoji) emoji.classList.add('decorative');
        }
      }
      
      // Show decorative flows, hide data-driven flows
      this.decorativeLines.forEach(line => line.addTo(this.map));
      this.flowLines.forEach(line => {
        if (this.map.hasLayer(line)) {
          this.map.removeLayer(line);
        }
      });
      
      // Hide any tooltips
      this.hideTooltip();
      
      // Close any open popups
      this.map.closePopup();
    } else {
      // Interactive mode settings
      for (const cityId in this.cityMarkers) {
        const marker = this.cityMarkers[cityId];
        if (marker && marker.getElement()) {
          const markerContainer = marker.getElement().querySelector('.map-marker-container');
          const emoji = marker.getElement().querySelector('.emoji-marker');
          
          if (markerContainer) markerContainer.classList.remove('decorative');
          if (emoji) emoji.classList.remove('decorative');
        }
      }
      
      // Show data-driven flows, hide decorative flows
      this.decorativeLines.forEach(line => {
        if (this.map.hasLayer(line)) {
          this.map.removeLayer(line);
        }
      });
      this.createFlowLines(); 
    }
  }
  
  // Load city data
  async loadCityData() {
    try {
      // Load data for specific month
      console.log(`Loading data for ${currentState.month}/${currentState.year}`);
      const data = await loadMonthlyData(currentState.month, currentState.year);
      currentState.tourismData = data;
      console.log("Tourism data loaded:", data);
      return data;
    } catch (error) {
      console.error('Failed to load city data:', error);
      // Fallback to default data
      currentState.tourismData = [
        { city_id: 'nyc', city_name: 'New York City', visitors: 850000, revenue: 1200000000, satisfaction: 4.3, avg_stay: 3.2 },
        { city_id: 'dc', city_name: 'Washington D.C.', visitors: 320000, revenue: 450000000, satisfaction: 4.5, avg_stay: 2.7 },
        { city_id: 'lasvegas', city_name: 'Las Vegas', visitors: 780000, revenue: 980000000, satisfaction: 4.1, avg_stay: 3.5 },
        { city_id: 'chicago', city_name: 'Chicago', visitors: 410000, revenue: 520000000, satisfaction: 4.0, avg_stay: 2.3 },
        { city_id: 'boston', city_name: 'Boston', visitors: 290000, revenue: 380000000, satisfaction: 4.4, avg_stay: 2.5 },
        { city_id: 'miami', city_name: 'Miami', visitors: 560000, revenue: 780000000, satisfaction: 4.6, avg_stay: 4.0 },
        { city_id: 'sanfrancisco', city_name: 'San Francisco', visitors: 480000, revenue: 720000000, satisfaction: 4.2, avg_stay: 3.1 }
      ];
      return currentState.tourismData;
    }
  }
  
  // Update cities data and visualization
  async updateCities(month = currentState.month, year = currentState.year) {
    // Update current state
    currentState.month = month;
    currentState.year = year;
    
    // Load new data
    await this.loadCityData();
    
    console.log("Updating city markers");
    
    // Clear existing markers
    Object.values(this.cityMarkers).forEach(marker => {
      if (this.map && this.map.hasLayer(marker)) {
        this.map.removeLayer(marker);
      }
    });
    this.cityMarkers = {};
    
    // Add city markers using emoji pins (without triangle background)
    for (const cityId in config.cityData) {
      const cityInfo = config.cityData[cityId];
      const cityData = currentState.tourismData ? 
        currentState.tourismData.find(d => d.city_id === cityId) : null;
      
      const isActive = cityId === currentState.highlightedCity;
      
      const emojiIcon = L.divIcon({
        html: `<div class="map-marker-container ${isActive ? 'active' : ''} ${this.isDecorativeMode ? 'decorative' : ''}">
                 <div class="emoji-marker ${isActive ? 'active' : ''} ${this.isDecorativeMode ? 'decorative' : ''}">${cityInfo.emoji}</div>
               </div>`,
        className: '',
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      });
      
      // Create marker with the emoji icon
      const marker = L.marker(cityInfo.coordinates, {
        icon: emojiIcon,
        riseOnHover: this.isDecorativeMode ? false : true
      }).addTo(this.map);
      
      // Tooltip content with trend indicator
      const visitorTrend = this.getVisitorTrend(cityId);
      const trendIcon = visitorTrend > 0 ? '📈' : (visitorTrend < 0 ? '📉' : '');
      
      const tooltipContent = `
        <div class="city-tooltip">
          <div class="city-tooltip-header">
            <strong>${cityInfo.name}, ${cityInfo.state}</strong>
            <span class="trend-indicator">${trendIcon}</span>
          </div>
          ${cityData ? `<div class="tooltip-stat">Visitors: ${this.formatNumber(cityData.visitors)}</div>` : ''}
          ${cityData && cityData.revenue ? `<div class="tooltip-stat">Revenue: $${this.formatNumber(cityData.revenue)}</div>` : ''}
          ${cityData && cityData.satisfaction ? `<div class="tooltip-stat">Satisfaction: ${cityData.satisfaction}/5.0</div>` : ''}
          ${cityData && cityData.avg_stay ? `<div class="tooltip-stat">Avg. Stay: ${cityData.avg_stay} days</div>` : ''}
        </div>
      `;
      
      // Add popup 
      const popup = L.popup({
        closeButton: false,
        offset: [0, -20],
        className: 'enhanced-city-popup'
      }).setContent(tooltipContent);
      
      marker.bindPopup(popup);
      
      // Only add interactive events if not in decorative mode
      if (!this.isDecorativeMode) {
        marker.on('click', () => this.showCityDetail(cityId));
        
        // Add mouseover/mouseout events
        marker.on('mouseover', (e) => {
          this.showTooltip(e.originalEvent, cityId);
          marker.openPopup();
        });
        
        marker.on('mouseout', () => {
          this.hideTooltip();
          marker.closePopup();
        });
      }
      
      // Store marker reference
      this.cityMarkers[cityId] = marker;
      
      // Add city label when in interactive mode
      if (!this.isDecorativeMode && (isActive || cityId === 'nyc' || cityId === 'lasvegas')) {
        this.addCityLabel(cityId);
      }
    }
    
    // Update flow lines with new data
    if (!this.isDecorativeMode) {
      this.createFlowLines();
    }
  }

  // Get visitor trend (for showing arrows in tooltips)
  getVisitorTrend(cityId) {
    return Math.random() > 0.5 ? 1 : -1;
  }

  // Calculate city bubble radius based on visitors
  calculateRadius(cityId) {
    // Start with a baseline radius
    let radius = 10;
    
    if (currentState.tourismData) {
      const cityData = currentState.tourismData.find(d => d.city_id === cityId);
      
      if (cityData && cityData.visitors) {
        // Set min/max for visitors and radius
        const minVisitors = 200000;
        const maxVisitors = 1200000;
        const minRadius = 8;
        const maxRadius = 20;
        
        // Calculate radius (using square root scale to maintain area proportion)
        const visitorValue = Math.max(minVisitors, Math.min(maxVisitors, cityData.visitors));
        radius = minRadius + Math.sqrt((visitorValue - minVisitors) / (maxVisitors - minVisitors)) * (maxRadius - minRadius);
      }
    }
    
    return radius;
  }
  
  // Create curved flow lines between cities
  createFlowLines() {
    console.log("Creating data-driven flow lines");
    
    // Remove existing flow lines
    this.flowLines.forEach(line => {
      if (this.map && this.map.hasLayer(line)) {
        this.map.removeLayer(line);
      }
    });
    this.flowLines = [];
    
    // Get city keys
    const cityKeys = Object.keys(config.cityData);
    
    // Create tourism flow connections based on data
    if (currentState.tourismData) {
      // Sort cities by visitor count to determine flow strength
      const sortedCities = [...currentState.tourismData].sort((a, b) => b.visitors - a.visitors);
      
      // Create flows between top cities
      for (let i = 0; i < sortedCities.length; i++) {
        const sourceCity = sortedCities[i];
        
        // For each source city, create flows to a subset of other cities
        for (let j = 0; j < sortedCities.length; j++) {
          // Skip flow to itself
          if (i === j) continue;
          
          // Only create flows between certain pairs (to avoid cluttering the map)
          // Top cities connect to more destinations
          const maxConnections = i < 2 ? 4 : (i < 4 ? 2 : 1);
          if (j >= maxConnections) continue;
          
          const targetCity = sortedCities[j];
          
          // Get source and target city info
          const sourceCityInfo = config.cityData[sourceCity.city_id];
          const targetCityInfo = config.cityData[targetCity.city_id];
          
          if (!sourceCityInfo || !targetCityInfo) continue;
          
          // Get coordinates
          const sourceCoords = sourceCityInfo.coordinates;
          const targetCoords = targetCityInfo.coordinates;
          
          // Calculate flow strength based on visitor numbers
          const flowStrength = Math.min(100, (sourceCity.visitors / 10000) + (targetCity.visitors / 20000));
          
          // Generate curved path points
          const curvedPath = this.getCurvedPath(sourceCoords, targetCoords);
          
          // Create highlighted flow for the currently active city
          const isHighlighted = (sourceCity.city_id === currentState.highlightedCity || 
                                targetCity.city_id === currentState.highlightedCity);
          
          // Determine line style based on highlight
          const lineOptions = {
            color: isHighlighted ? '#FE2C6D' : '#8A44F7',
            weight: isHighlighted ? flowStrength / 15 : flowStrength / 25,
            opacity: isHighlighted ? 0.7 : 0.4,
            dashArray: isHighlighted ? '4,6' : '3,8',
            className: isHighlighted ? 'flow-line active' : 'flow-line'
          };
          
          // Create the flow line
          const flowLine = L.polyline(curvedPath, lineOptions).addTo(this.map);
          
          // Add directional arrow decorations
          this.addFlowArrows(flowLine, isHighlighted);
          
          // Add to flow lines collection
          this.flowLines.push(flowLine);
          
          // Add tooltips to flow lines
          if (!this.isDecorativeMode) {
            flowLine.bindTooltip(`Tourism flow: ${sourceCityInfo.name} ↔ ${targetCityInfo.name}`, {
              direction: 'top',
              opacity: 0.8,
              className: 'flow-tooltip'
            });
          }
        }
      }
    }
  }
  
  // Create decorative background flows
  createDecorativeFlows() {
    console.log("Creating decorative background flows");
    
    // Clear existing decorative lines
    this.decorativeLines.forEach(line => {
      if (this.map && this.map.hasLayer(line)) {
        this.map.removeLayer(line);
      }
    });
    this.decorativeLines = [];
    
    // Get all city pairs
    const cityKeys = Object.keys(config.cityData);
    
    // Create a network of decorative lines
    for (let i = 0; i < cityKeys.length; i++) {
      for (let j = i + 1; j < cityKeys.length; j++) {
        const city1Id = cityKeys[i];
        const city2Id = cityKeys[j];
        
        const city1 = config.cityData[city1Id];
        const city2 = config.cityData[city2Id];
        
        // Generate curved path
        const curvedPath = this.getCurvedPath(city1.coordinates, city2.coordinates);
        
        // Create decorative line
        const decorLine = L.polyline(curvedPath, {
          color: 'rgba(138, 68, 247, 0.15)',
          weight: 1,
          dashArray: '2,10',
          className: 'decorative-flow'
        });
        
        // Only add to map in decorative mode
        if (this.isDecorativeMode) {
          decorLine.addTo(this.map);
        }
        
        this.decorativeLines.push(decorLine);
      }
    }
  }
  
  // Generate curved path between two coordinate points, improved by Claude
  getCurvedPath(start, end) {
    // Convert coordinates to LatLng format (Leaflet uses [lat, lng] order)
    const startPoint = [start[0], start[1]];
    const endPoint = [end[0], end[1]];
    
    // Calculate midpoint
    const midX = (startPoint[0] + endPoint[0]) / 2;
    const midY = (startPoint[1] + endPoint[1]) / 2;
    
    // Calculate distance for determining curve height
    const distance = Math.sqrt(
      Math.pow(endPoint[0] - startPoint[0], 2) + 
      Math.pow(endPoint[1] - startPoint[1], 2)
    );
    
    // Calculate a control point offset from the midpoint
    // Using perpendicular offset to create a nice curve
    const offsetX = (endPoint[1] - startPoint[1]) * 0.15;
    const offsetY = -(endPoint[0] - startPoint[0]) * 0.15;
    
    // Create control point
    const controlPoint = [midX + offsetX, midY + offsetY];
    
    // Generate points along the quadratic curve
    const path = [];
    const steps = 20;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      
      // Quadratic Bezier curve formula
      const x = Math.pow(1 - t, 2) * startPoint[0] + 
                2 * (1 - t) * t * controlPoint[0] + 
                Math.pow(t, 2) * endPoint[0];
      
      const y = Math.pow(1 - t, 2) * startPoint[1] + 
                2 * (1 - t) * t * controlPoint[1] + 
                Math.pow(t, 2) * endPoint[1];
      
      path.push([x, y]);
    }
    
    return path;
  }
  
  // Add directional arrows to flow lines
  addFlowArrows(polyline, isHighlighted) {
    const path = polyline.getLatLngs();
    
    // Add arrow at midpoint
    if (path.length > 10) {
      const midIndex = Math.floor(path.length / 2);
      const midPoint = path[midIndex];
      const prevPoint = path[midIndex - 2]; // Use a point before midpoint for direction
      
      // Calculate angle for arrow
      const angle = this.calculateAngle(prevPoint.lat, prevPoint.lng, midPoint.lat, midPoint.lng);
      
      // Create arrow marker
      const arrowIcon = L.divIcon({
        html: `<div class="flow-arrow ${isHighlighted ? 'active' : ''}" style="transform: rotate(${angle}deg)">▶</div>`,
        className: '',
        iconSize: [10, 10],
        iconAnchor: [5, 5]
      });
      
      // Add arrow marker to the map
      L.marker([midPoint.lat, midPoint.lng], { 
        icon: arrowIcon,
        interactive: false
      }).addTo(this.map);
    }
  }
  
  // Calculate angle for arrow direction
  calculateAngle(lat1, lng1, lat2, lng2) {
    return Math.atan2(lng2 - lng1, lat2 - lat1) * 180 / Math.PI;
  }
  
  // Show tooltip
  showTooltip(event, cityId) {
    // Skip in decorative mode
    if (this.isDecorativeMode) return;
    
    const cityInfo = config.cityData[cityId];
    if (!cityInfo) return;
    
    // Build enhanced tooltip
    let content = `<div class="enhanced-tooltip">
                     <div class="tooltip-header">
                       <span class="tooltip-emoji">${cityInfo.emoji}</span>
                       <h3>${cityInfo.name}, ${cityInfo.state}</h3>
                     </div>`;
    
    if (currentState.tourismData) {
      const cityData = currentState.tourismData.find(d => d.city_id === cityId);
      if (cityData) {
        content += `<div class="tooltip-data">
                     <div class="tooltip-row">
                       <span class="tooltip-label">Visitors:</span>
                       <span class="tooltip-value">${this.formatNumber(cityData.visitors)}</span>
                     </div>`;
        if (cityData.revenue) {
          content += `<div class="tooltip-row">
                       <span class="tooltip-label">Revenue:</span>
                       <span class="tooltip-value">$${this.formatNumber(cityData.revenue)}</span>
                     </div>`;
        }
        if (cityData.satisfaction) {
          // Add star rating visualization
          const fullStars = Math.floor(cityData.satisfaction);
          const hasHalfStar = cityData.satisfaction % 1 >= 0.5;
          
          let starsHtml = '';
          for (let i = 0; i < 5; i++) {
            if (i < fullStars) {
              starsHtml += '★'; // Full star
            } else if (i === fullStars && hasHalfStar) {
              starsHtml += '⯨'; // Half star
            } else {
              starsHtml += '☆'; // Empty star
            }
          }
          
          content += `<div class="tooltip-row">
                       <span class="tooltip-label">Rating:</span>
                       <span class="tooltip-value tooltip-stars">${starsHtml} (${cityData.satisfaction})</span>
                     </div>`;
        }
        
        // Add average stay with a small bar visualization
        if (cityData.avg_stay) {
          const stayPercentage = Math.min(100, (cityData.avg_stay / 5) * 100);
          
          content += `<div class="tooltip-row">
                       <span class="tooltip-label">Avg. Stay:</span>
                       <span class="tooltip-value">${cityData.avg_stay} days</span>
                     </div>
                     <div class="tooltip-bar-container">
                       <div class="tooltip-bar" style="width: ${stayPercentage}%"></div>
                     </div>`;
        }
        
        content += `</div>`;
      }
    }
    
    content += `<div class="tooltip-footer">Click for details</div></div>`;
    
    this.tooltip.innerHTML = content;
    this.tooltip.style.left = `${event.pageX + 10}px`;
    this.tooltip.style.top = `${event.pageY + 10}px`;
    this.tooltip.style.opacity = 1;
  }
  
  // Hide tooltip
  hideTooltip() {
    this.tooltip.style.opacity = 0;
  }
  
  // Format number
  formatNumber(num) {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }
  
  // Show city detail in modal
  showCityDetail(cityId) {
    // Skip in decorative mode
    if (this.isDecorativeMode) return;
    
    const cityInfo = config.cityData[cityId];
    if (!cityInfo) return;
    
    console.log("Showing detail for city:", cityId);
    
    // Set current selected city
    currentState.activeCity = cityId;
    
    // Highlight the city
    this.highlightCity(cityId);
    
    // Get city data
    const cityData = currentState.tourismData ? 
      currentState.tourismData.find(d => d.city_id === cityId) : null;
    
    // Get modal element
    const modal = document.getElementById('city-detail-modal');
    if (!modal) {
      console.error("Modal element not found: city-detail-modal");
      return;
    }
    
    const contentEl = modal.querySelector('.city-detail-content');
    if (!contentEl) {
      console.error("Modal content element not found: .city-detail-content");
      return;
    }
    
    // Set enhanced content with mini chart
    contentEl.innerHTML = `
      <div class="city-header">
        <div class="city-emoji">${cityInfo.emoji}</div>
        <div class="city-title">
          <h2>${cityInfo.name}</h2>
          <p class="city-subtitle">${cityInfo.state}</p>
        </div>
      </div>
      
      <div class="city-stats">
        <div class="stat-card">
          <h3>Visitors</h3>
          <div class="value">${cityData ? this.formatNumber(cityData.visitors) : 'N/A'}</div>
          <div class="trend up">+12% from Oct</div>
        </div>
        <div class="stat-card">
          <h3>Tourism Revenue</h3>
          <div class="value">${cityData && cityData.revenue ? '$' + this.formatNumber(cityData.revenue) : 'N/A'}</div>
          <div class="trend up">+8% from Oct</div>
        </div>
        <div class="stat-card">
          <h3>Satisfaction Rating</h3>
          <div class="value">
            <div class="star-rating">
              ${this.generateStarRating(cityData ? cityData.satisfaction : 0)}
            </div>
          </div>
          <div class="trend flat">No change</div>
        </div>
        <div class="stat-card">
          <h3>Average Stay</h3>
          <div class="value">${cityData && cityData.avg_stay ? cityData.avg_stay + ' days' : 'N/A'}</div>
          <div class="trend down">-0.3 days from Oct</div>
        </div>
      </div>
      
      <div class="mini-chart">
        <h3>Visitor Trends</h3>
        <div class="chart-placeholder" id="city-chart">
          <svg viewBox="0 0 300 150" width="100%" height="150">
            <path d="M0,150 L25,120 L50,125 L75,100 L100,90 L125,80 L150,60 L175,40 L200,30 L225,35 L250,25 L275,15 L300,10" 
                  fill="none" stroke="#8A44F7" stroke-width="3" />
            <path d="M0,150 L25,120 L50,125 L75,100 L100,90 L125,80 L150,60 L175,40 L200,30 L225,35 L250,25 L275,15 L300,10" 
                  fill="url(#gradientBg)" stroke="none" />
            
            <defs>
              <linearGradient id="gradientBg" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style="stop-color:#8A44F7;stop-opacity:0.4" />
                <stop offset="100%" style="stop-color:#8A44F7;stop-opacity:0.1" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>
      
      <div class="city-description">
        ${this.getCityDescription(cityId)}
        <div class="top-attractions">
          <h3>Top Attractions</h3>
          <ul>
            ${this.getTopAttractions(cityId).map(attr => `<li>${attr}</li>`).join('')}
          </ul>
        </div>
      </div>
      
      <div class="city-actions">
        <a href="#" class="action-btn primary">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 18L15 12L9 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          Tourism Report
        </a>
        <a href="#" class="action-btn secondary">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M9 11C11.2091 11 13 9.20914 13 7C13 4.79086 11.2091 3 9 3C6.79086 3 5 4.79086 5 7C5 9.20914 6.79086 11 9 11Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          Book Hotels
        </a>
      </div>
    `;
    
    // Show modal with animation
    modal.classList.add('active');
    
    // Add close button event
    const closeBtn = modal.querySelector('.close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        modal.classList.remove('active');
        this.clearHighlights();
      });
    }
  }
  
  // Generate star rating HTML
  generateStarRating(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    let html = '';
    
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        html += '<span class="star full">★</span>';
      } else if (i === fullStars && hasHalfStar) {
        html += '<span class="star half">★</span>';
      } else {
        html += '<span class="star empty">☆</span>';
      }
    }
    
    return html + `<span class="rating-value">${rating}/5</span>`;
  }
  
  // Get city description
  getCityDescription(cityId) {
    const descriptions = {
      'nyc': 'New York City is the largest city in the United States and one of the most important financial and cultural centers in the world. It features iconic landmarks such as the Statue of Liberty, Times Square, and Central Park. Millions of tourists visit annually to experience this vibrant "city that never sleeps."',
      'dc': 'As the capital of the United States, Washington D.C. is home to numerous national museums and monuments. The White House, Capitol Building, and Lincoln Memorial are among the most visited attractions. The city\'s cherry blossom season also draws many tourists.',
      'lasvegas': 'Las Vegas is known for its luxury casino hotels, entertainment shows, and vibrant nightlife. This desert city attracts visitors from around the world with its unique themed hotels and world-class performances.',
      'chicago': 'Chicago is the third-largest city in the United States, famous for its distinctive architecture, deep musical heritage, and culinary scene. Michigan Avenue, Millennium Park, and Willis Tower are must-visit attractions.',
      'boston': 'Boston is one of the oldest cities in America, with rich historical sites and premier educational institutions. The Freedom Trail, Quincy Market, and Fenway Park are essential stops for visitors.',
      'miami': 'Miami is renowned for its beautiful beaches, vibrant nightlife, and diverse cultural scene. South Beach, Art Deco Historic District, and Little Havana attract millions of visitors seeking sunshine and excitement.',
      'sanfrancisco': 'San Francisco is famous for its iconic Golden Gate Bridge, historic cable cars, and picturesque hills. The city offers a unique blend of natural beauty, cultural diversity, and technological innovation.'
    };
    
    return descriptions[cityId] || 'No detailed description available';
  }
  
  // Get top attractions for a city
  getTopAttractions(cityId) {
    const attractions = {
      'nyc': ['Central Park', 'Statue of Liberty', 'Empire State Building', 'Times Square', 'Metropolitan Museum of Art'],
      'dc': ['National Mall', 'Smithsonian Museums', 'Lincoln Memorial', 'White House', 'Capitol Building'],
      'lasvegas': ['The Strip', 'Bellagio Fountains', 'Fremont Street', 'Grand Canyon Tours', 'Cirque du Soleil Shows'],
      'chicago': ['Millennium Park', 'Art Institute of Chicago', 'Willis Tower', 'Navy Pier', 'Field Museum'],
      'boston': ['Freedom Trail', 'Fenway Park', 'Quincy Market', 'Harvard University', 'New England Aquarium'],
      'miami': ['South Beach', 'Art Deco Historic District', 'Wynwood Walls', 'Little Havana', 'Bayside Marketplace'],
      'sanfrancisco': ['Golden Gate Bridge', 'Alcatraz Island', 'Fisherman\'s Wharf', 'Chinatown', 'Cable Cars']
    };
    
    return attractions[cityId] || [];
  }
  
  // Highlight a specific city
  highlightCity(cityId) {
    // Skip in decorative mode
    if (this.isDecorativeMode) return;
    
    console.log("Highlighting city:", cityId);
    
    // Set current highlighted city
    currentState.highlightedCity = cityId;
    
    // Update all markers to highlight the selected city
    for (const id in this.cityMarkers) {
      const marker = this.cityMarkers[id];
      if (marker) {
        // Get the emoji marker element
        const iconElement = marker.getElement().querySelector('.emoji-marker');
        
        if (iconElement) {
          // Update the marker classes and styles based on highlight state
          if (id === cityId) {
            iconElement.classList.add('active');
          } else {
            iconElement.classList.remove('active');
          }
        }
        
        // Bring highlighted marker to front
        if (id === cityId && marker.bringToFront) {
          marker.bringToFront();
        }
      }
    }
    
    // Update flow lines to highlight connections
    this.createFlowLines();
    
    // Add a prominent label for the highlighted city
    this.addCityLabel(cityId);
  }
  
  // Add city label with animation
  addCityLabel(cityId) {
    // Skip in decorative mode
    if (this.isDecorativeMode) return;
    
    // Remove existing label for this city
    if (this.cityLabels[cityId]) {
      this.map.removeLayer(this.cityLabels[cityId]);
      delete this.cityLabels[cityId];
    }
    
    const cityInfo = config.cityData[cityId];
    if (!cityInfo) return;
    
    // Get city data for visitor count
    const cityData = currentState.tourismData ? 
      currentState.tourismData.find(d => d.city_id === cityId) : null;
    
    // Create label content with emoji and visitor count
    const labelContent = `
      <div class="city-label-container ${cityId === currentState.highlightedCity ? 'active' : ''}">
        <div class="city-label">
          <span class="label-emoji">${cityInfo.emoji}</span>
          <span class="label-name">${cityInfo.name}</span>
          ${cityData ? `<span class="label-visitors">${this.formatNumber(cityData.visitors)} visitors</span>` : ''}
        </div>
      </div>
    `;
    
    // Create label marker
    const labelIcon = L.divIcon({
      html: labelContent,
      className: '',
      iconSize: [120, 40],
      iconAnchor: [60, 40] // Bottom center of label
    });
    
    // Add label slightly above the city marker
    const labelLatLng = [
      cityInfo.coordinates[0] + 0.5, // Offset latitude
      cityInfo.coordinates[1]
    ];
    
    // Create marker and add to map
    const labelMarker = L.marker(labelLatLng, { 
      icon: labelIcon,
      interactive: false,
      zIndexOffset: 1000 // Make sure label is above other elements
    }).addTo(this.map);
    
    // Store label reference
    this.cityLabels[cityId] = labelMarker;
  }
  
  // Clear all city highlights
  clearHighlights() {
    console.log("Clearing highlights");
    
    // Clear current highlighted city
    currentState.highlightedCity = null;
    
    // Remove city labels
    for (const cityId in this.cityLabels) {
      this.map.removeLayer(this.cityLabels[cityId]);
    }
    this.cityLabels = {};
    
    // Update all markers to normal state
    for (const id in this.cityMarkers) {
      const marker = this.cityMarkers[id];
      if (marker) {
        // Get the emoji marker element
        const iconElement = marker.getElement().querySelector('.emoji-marker');
        
        if (iconElement) {
          // Remove active class
          iconElement.classList.remove('active');
        }
      }
    }
    
    // Reset flow lines
    this.createFlowLines();
  }
  
  // These methods are simplified for compatibility
  
  // Modified to highlight instead of zoom
  zoomToCity(cityId) {
    if (!this.isDecorativeMode) {
      this.highlightCity(cityId);
    }
  }
  
  // Modified to clear highlights
  resetZoom() {
    if (!this.isDecorativeMode) {
      this.clearHighlights();
    }
  }
  
  // Modified to highlight nearest city
  zoomToCoordinates(coordinates, zoom) {
    if (this.isDecorativeMode) return;
    
    // Find the closest city and highlight it
    let closestCity = null;
    let minDistance = Infinity;
    
    for (const cityId in config.cityData) {
      const cityCoords = config.cityData[cityId].coordinates;
      const distance = this.calcDistance(coordinates, cityCoords);
      
      if (distance < minDistance) {
        minDistance = distance;
        closestCity = cityId;
      }
    }
    
    if (closestCity) {
      this.highlightCity(closestCity);
    }
  }
  
  // Calculate distance between coordinates
  calcDistance(coords1, coords2) {
    const lat1 = coords1[0];
    const lon1 = coords1[1];
    const lat2 = coords2[0];
    const lon2 = coords2[1];
    
    return Math.sqrt(Math.pow(lat2 - lat1, 2) + Math.pow(lon2 - lon1, 2));
  }
  
  // Update map view with new data
  updateMapView(month, year) {
    this.updateCities(month, year);
  }
  
  // Resize map to fill screen
  resizeMap() {
    if (this.container) {
      this.container.style.width = '100%';
      this.container.style.height = '100vh';
      this.container.style.margin = '0';
      this.container.style.padding = '0';
    }
    
    if (this.map) {
      this.map.invalidateSize(true);
    }
  }
}

// Export TourismMap class
export default TourismMap;