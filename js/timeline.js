// Timeline configuration
const config = {
  timePoints: [
    { month: '11', year: '2024', label: 'November 2024' },
    { month: '12', year: '2024', label: 'December 2024' },
    { month: '01', year: '2025', label: 'January 2025' }
  ],
  sections: [
    'intro',
    'november',
    'december',
    'january',
    'conclusion'
  ]
};

// Current state
let currentState = {
  currentTimeIndex: 0,
  isPlaying: false,
  playInterval: null
};

// Timeline class
class Timeline {
  constructor(tourismMap) {
    this.tourismMap = tourismMap;
    this.initialized = false;
    
    // DOM element references
    this.timelineItems = document.querySelectorAll('.timeline-item');
    this.progressBar = document.querySelector('.progress-bar');
    this.playPauseButton = document.getElementById('play-pause');
    this.storySections = document.querySelectorAll('.story-section');
    this.verticalTimelineItems = document.querySelectorAll('.vertical-timeline .timeline-item');
    this.verticalTimelineMarkers = document.querySelectorAll('.vertical-timeline .timeline-marker');
    this.verticalProgressBar = document.querySelector('.timeline-progress');
    
    // Bind methods
    this.init = this.init.bind(this);
    this.setupEventListeners = this.setupEventListeners.bind(this);
    this.setupScrollAnimations = this.setupScrollAnimations.bind(this);
    this.updateTimeline = this.updateTimeline.bind(this);
    this.playTimeline = this.playTimeline.bind(this);
    this.pauseTimeline = this.pauseTimeline.bind(this);
    this.togglePlayPause = this.togglePlayPause.bind(this);
    this.updateProgressBar = this.updateProgressBar.bind(this);
    this.updateVerticalTimeline = this.updateVerticalTimeline.bind(this);
  }
  
  init() {
    if (this.initialized) return;
    
    this.setupEventListeners();
    
    // Only set up scroll animations if GSAP is available
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
      this.setupScrollAnimations();
    } else {
      console.warn('GSAP and/or ScrollTrigger not available, skipping scroll animations');
      this.setupBasicAnimation();
    }
    
    this.updateTimeline(0); // Start from first time point
    
    this.initialized = true;
  }
  
  // Set up basic animation for fallback
  setupBasicAnimation() {
    // Make all content wrappers visible without animation
    document.querySelectorAll('.content-wrapper').forEach(wrapper => {
      wrapper.style.opacity = 1;
      wrapper.style.transform = 'translateY(0)';
    });
    
    // Set up basic scroll detection
    window.addEventListener('scroll', () => {
      this.storySections.forEach((section, index) => {
        const rect = section.getBoundingClientRect();
        const isVisible = rect.top < window.innerHeight * 0.6 && rect.bottom > window.innerHeight * 0.4;
        
        if (isVisible) {
          section.classList.add('active');
          
          // Update timeline if needed
          const month = section.getAttribute('data-month');
          if (month) {
            const timeIndex = month === '11' ? 0 : (month === '12' ? 1 : 2);
            this.updateTimeline(timeIndex, false);
          }
        } else {
          section.classList.remove('active');
        }
      });
    });
  }
  
  // Set up event listeners
  setupEventListeners() {
    // Timeline item click events
    this.timelineItems.forEach((item, index) => {
      item.addEventListener('click', () => {
        this.updateTimeline(index);
      });
    });
    
    // Play/pause button event
    if (this.playPauseButton) {
      this.playPauseButton.addEventListener('click', this.togglePlayPause);
    }
    
    // Start journey button event
    const startJourneyBtn = document.getElementById('start-journey');
    if (startJourneyBtn) {
      startJourneyBtn.addEventListener('click', () => {
        // Scroll to story container
        const storyContainer = document.querySelector('.story-container');
        if (storyContainer) {
          window.scrollTo({
            top: storyContainer.offsetTop,
            behavior: 'smooth'
          });
        }
      });
    }
    
    // Vertical timeline marker click events
    if (this.verticalTimelineMarkers) {
      this.verticalTimelineMarkers.forEach((marker) => {
        marker.addEventListener('click', () => {
          const month = marker.getAttribute('data-month');
          const year = marker.getAttribute('data-year');
          
          // Find matching timeline item
          let matchIndex = 0;
          config.timePoints.forEach((timePoint, index) => {
            if (timePoint.month === month && timePoint.year === year) {
              matchIndex = index;
            }
          });
          
          // Update timeline
          this.updateTimeline(matchIndex);
          
          // Find and scroll to first story section with this month/year
          const targetSection = Array.from(this.storySections).find(section => 
            section.getAttribute('data-month') === month && 
            section.getAttribute('data-year') === year
          );
          
          if (targetSection) {
            targetSection.scrollIntoView({ behavior: 'smooth' });
          }
        });
      });
    }
  }
  
  // Set up scroll animations
  setupScrollAnimations() {
    // Check if GSAP and ScrollTrigger are available
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
      console.warn('GSAP or ScrollTrigger not available');
      return;
    }
    
    // Register the ScrollTrigger plugin
    gsap.registerPlugin(ScrollTrigger);
    
    // For each story section, create scroll trigger
    this.storySections.forEach((section, index) => {
      // Get content wrapper
      const content = section.querySelector('.content-wrapper');
      if (!content) return;
      
      // Add initial class
      content.classList.add('fade-in');
      
      // Create scroll trigger animation
      gsap.to(content, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        scrollTrigger: {
          trigger: section,
          start: 'top 60%',
          toggleActions: 'play none none reverse'
        }
      });
      
      // If it's a month section, also update timeline
      if (index > 0 && index < 4) { // Skip intro and conclusion
        const timelineIndex = index - 1; // Adjust index
        
        ScrollTrigger.create({
          trigger: section,
          start: 'top 50%',
          onEnter: () => {
            this.updateTimeline(timelineIndex, false);
          },
          onEnterBack: () => {
            this.updateTimeline(timelineIndex, false);
          }
        });
      }
    });
    
    // Create sticky scroll effect for map
    ScrollTrigger.create({
      trigger: '.story-container',
      start: 'top top',
      endTrigger: '.story-sections',
      end: 'bottom bottom',
      pin: '.sticky-container',
      pinSpacing: false
    });
  }
  
  // Update timeline 
  updateTimeline(index, updateMap = true) {
    // Ensure index is within valid range
    if (index < 0 || index >= config.timePoints.length) return;
    
    // Update current state
    currentState.currentTimeIndex = index;
    
    // Update timeline UI 
    this.timelineItems.forEach((item, i) => {
      // Get the month and year for this item
      const itemMonth = item.getAttribute('data-month');
      const itemYear = item.getAttribute('data-year');
      
      // Get the selected month and year
      const selectedTimePoint = config.timePoints[index];
      const selectedMonth = selectedTimePoint.month;
      const selectedYear = selectedTimePoint.year;
      
      // Compare dates - if this item's date is less than or equal to selected date, make it active
      const itemDate = new Date(`${itemMonth}/01/${itemYear}`);
      const selectedDate = new Date(`${selectedMonth}/01/${selectedYear}`);
      
      if (itemDate <= selectedDate) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
    
    // Update progress bar
    this.updateProgressBar();
    
    // Update vertical timeline with progressive selection
    this.updateVerticalTimeline(index);
    
    // Update map view
    if (updateMap && this.tourismMap) {
      const timePoint = config.timePoints[index];
      this.tourismMap.updateMapView(timePoint.month, timePoint.year);
    }
  }
  
  // Update progress bar
  updateProgressBar() {
    const index = currentState.currentTimeIndex;
    const percentage = index / (config.timePoints.length - 1) * 100;
    if (this.progressBar) {
      this.progressBar.style.width = `${percentage}%`;
    }
  }
  
  // Update vertical timeline - UPDATED for progressive selection
  updateVerticalTimeline(index) {
    if (!this.verticalTimelineMarkers || !this.verticalProgressBar) return;
    
    const selectedTimePoint = config.timePoints[index];
    const selectedMonth = selectedTimePoint.month;
    const selectedYear = selectedTimePoint.year;
    const selectedDate = new Date(`${selectedMonth}/01/${selectedYear}`);
    
    // Update marker active states with progressive selection
    this.verticalTimelineMarkers.forEach(marker => {
      const month = marker.getAttribute('data-month');
      const year = marker.getAttribute('data-year');
      const markerDate = new Date(`${month}/01/${year}`);
      
      // If this marker's date is less than or equal to the selected date, activate it
      if (markerDate <= selectedDate) {
        marker.classList.add('active');
        
        // Also activate the parent item if it exists
        const parentItem = marker.closest('.timeline-item');
        if (parentItem) {
          parentItem.classList.add('active');
        }
      } else {
        marker.classList.remove('active');
        
        // Also deactivate the parent item if it exists
        const parentItem = marker.closest('.timeline-item');
        if (parentItem) {
          parentItem.classList.remove('active');
        }
      }
    });
    
    // Update progress indicator
    const percentage = currentState.currentTimeIndex / (config.timePoints.length - 1) * 100;
    this.verticalProgressBar.style.height = `${percentage}%`;
  }
  
  // Play timeline
  playTimeline() {
    if (currentState.isPlaying) return;
    
    currentState.isPlaying = true;
    this.updatePlayPauseButton();
    
    // Set play interval
    currentState.playInterval = setInterval(() => {
      const nextIndex = (currentState.currentTimeIndex + 1) % config.timePoints.length;
      this.updateTimeline(nextIndex);
      
      // If reach the last point, stop playing
      if (nextIndex === config.timePoints.length - 1) {
        this.pauseTimeline();
      }
    }, 3000); // Switch every 3 seconds
  }
  
  // Pause timeline
  pauseTimeline() {
    if (!currentState.isPlaying) return;
    
    currentState.isPlaying = false;
    this.updatePlayPauseButton();
    
    if (currentState.playInterval) {
      clearInterval(currentState.playInterval);
      currentState.playInterval = null;
    }
  }
  
  // Toggle play/pause state
  togglePlayPause() {
    if (currentState.isPlaying) {
      this.pauseTimeline();
    } else {
      this.playTimeline();
    }
  }
  
  // Update play/pause button
  updatePlayPauseButton() {
    if (!this.playPauseButton) return;
    
    if (currentState.isPlaying) {
      // Show pause icon
      this.playPauseButton.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="6" y="4" width="4" height="16" fill="currentColor"/>
          <rect x="14" y="4" width="4" height="16" fill="currentColor"/>
        </svg>
      `;
    } else {
      // Show play icon
      this.playPauseButton.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M8 5V19L19 12L8 5Z" fill="currentColor"/>
        </svg>
      `;
    }
  }
}

// Export Timeline class
export default Timeline;