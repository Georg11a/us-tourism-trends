// main.js - Core application logic handling scrollytelling, animations, and interactive tourism flow visualization, developed and improved with help from Claude
document.addEventListener('DOMContentLoaded', async function() {
  console.log('DOM fully loaded, initializing enhanced tourism visualization...');
  
  await initMap();
  
  // Setup additional events after map is initialized
  setupEvents();
  
  // Setup scrollytelling
  setupScrollytelling();
  
  // Initialize animations if GSAP is available
  if (typeof gsap !== 'undefined') {
    initAnimations();
  } else {
    console.warn('GSAP not available, using fallback animations');
    setupFallbackAnimations();
  }
});

async function initMap() {
  try {
    console.log('Starting enhanced map initialization...');
    
    // Check if Leaflet is available
    if (typeof L === 'undefined') {
      console.error('Leaflet library is not available! Make sure it is loaded before this script.');
      showErrorMessage('Map library not available. Please check your internet connection and refresh the page.');
      return;
    }
    
    // Verify map container exists
    const mapContainer = document.getElementById('map-container');
    if (!mapContainer) {
      console.error('Map container element not found!');
      showErrorMessage('Could not find map container element.');
      return;
    }
    
    // Set container dimensions for full-screen effect
    console.log('Setting map container dimensions for full-screen display');
    mapContainer.style.width = '100%';
    mapContainer.style.height = '100vh';
    mapContainer.style.margin = '0';
    mapContainer.style.padding = '0';
    mapContainer.style.position = 'fixed';
    mapContainer.style.top = '0';
    mapContainer.style.left = '0';
    mapContainer.style.zIndex = '-1';
    
    // Import and initialize the TourismMap
    const TourismMap = (await import('./map.js')).default;
    const tourismMap = new TourismMap('map-container');
    
    // Initialize the map with visuals
    const mapInitialized = await tourismMap.init();
    if (!mapInitialized) {
      console.error('Map initialization failed');
      showErrorMessage('Unable to initialize the map. Please refresh the page.');
      return;
    }
    
    console.log('Enhanced map initialized successfully!');
    
    // Start in decorative mode for hero section
    tourismMap.setMapMode(true);
    
    // Import and initialize Timeline
    const Timeline = (await import('./timeline.js')).default;
    const timeline = new Timeline(tourismMap);
    timeline.init();
    
    // Store references globally for access from other functions
    window.appComponents = {
      tourismMap,
      timeline
    };
    
    // Add scroll event listener to toggle map mode based on scroll position
    window.addEventListener('scroll', throttle(() => {
      const scrollPosition = window.scrollY;
      const heroHeight = document.querySelector('.hero').offsetHeight;
      const header = document.querySelector('header');
      
      // Add scrolled class to header when scrolled
      if (scrollPosition > 50) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
      
      // When scrolled past hero section, switch to interactive mode
      if (scrollPosition > heroHeight * 0.7) {
        if (tourismMap.isDecorativeMode) {
          console.log('Switching to interactive mode');
          tourismMap.setMapMode(false);
        }
      } else {
        if (!tourismMap.isDecorativeMode) {
          console.log('Switching to decorative mode');
          tourismMap.setMapMode(true);
        }
      }
    }, 100));
    
    // Force a map resize after a short delay to ensure proper display
    setTimeout(() => {
      if (window.appComponents && window.appComponents.tourismMap) {
        console.log('Forcing map resize after timeout');
        window.appComponents.tourismMap.resizeMap();
      }
    }, 1000);
    
  } catch (error) {
    console.error('Error during map initialization:', error);
    showErrorMessage('An error occurred while initializing the map. Please refresh the page.');
  }
}

// Animations using GSAP
function initAnimations() {
  // Check if GSAP is available
  if (typeof gsap === 'undefined') return;
  
  // Register plugins if available
  if (typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
  }
  
  // Stagger timing for smoother animations
  const staggerTime = 0.1;
  
  // Page load animation sequence
  const tl = gsap.timeline();
  
  // Header animations
  tl.from('.logo', {
    y: -30,
    opacity: 0,
    duration: 0.8,
    ease: 'power3.out'
  })
  .from('nav ul li', {
    y: -20,
    opacity: 0,
    stagger: staggerTime,
    duration: 0.5,
    ease: 'power2.out'
  }, '-=0.5')
  .from('.auth-buttons button', {
    y: -20,
    opacity: 0,
    stagger: staggerTime,
    duration: 0.5,
    ease: 'power2.out'
  }, '-=0.4');
  
  // Hero section animations
  const heroTl = gsap.timeline();
  
  heroTl.from('.hero-content', {
    y: 30,
    opacity: 0,
    duration: 1,
    ease: 'power3.out'
  })
  .from('.hero-content h1', {
    y: 20,
    opacity: 0,
    duration: 0.8,
    stagger: 0.2,
    ease: 'power3.out'
  }, '-=0.7')
  .from('.hero-content p', {
    y: 20,
    opacity: 0,
    duration: 0.8,
    ease: 'power3.out'
  }, '-=0.6')
  .from('.hero-content button', {
    scale: 0.8,
    opacity: 0,
    duration: 0.8,
    ease: 'elastic.out(1, 0.5)'
  }, '-=0.5')
  .from('.scroll-indicator', {
    y: 20,
    opacity: 0,
    duration: 0.8,
    ease: 'power2.out'
  }, '-=0.4');
  
  // Create scroll animations for each story section
  if (typeof ScrollTrigger !== 'undefined') {
    // Animate the content wrapper for each story section
    gsap.utils.toArray('.story-section').forEach((section, i) => {
      const wrapper = section.querySelector('.content-wrapper');
      
      // Skip if no wrapper found
      if (!wrapper) return;
      
      // Create scroll trigger for section content
      gsap.fromTo(wrapper, 
        { y: 50, opacity: 0 },
        { 
          y: 0, 
          opacity: 1, 
          duration: 0.8, 
          ease: 'power2.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 70%',
            end: 'center center',
            toggleActions: 'play none none reverse'
          }
        }
      );
    });
    
    // Animate the vertical timeline progress
    ScrollTrigger.create({
      trigger: '.story-sections',
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => {
        const progress = self.progress;
        document.querySelector('.timeline-progress').style.height = `${progress * 100}%`;
      }
    });
  }
  
  // Add hover animations for interactive elements
  addHoverAnimations();
}

// Fallback animations for browsers without GSAP
function setupFallbackAnimations() {
  // Show all elements that would be animated
  document.querySelectorAll('.hero-content, .hero-content h1, .hero-content p, .hero-content button, .scroll-indicator').forEach(el => {
    el.style.opacity = 1;
    el.style.transform = 'none';
  });
  
  // Make story section content visible when scrolled into view
  window.addEventListener('scroll', throttle(() => {
    document.querySelectorAll('.story-section').forEach(section => {
      const rect = section.getBoundingClientRect();
      const isVisible = rect.top < window.innerHeight * 0.7 && rect.bottom > 0;
      
      if (isVisible) {
        section.classList.add('active');
        const wrapper = section.querySelector('.content-wrapper');
        if (wrapper) {
          wrapper.style.opacity = 1;
          wrapper.style.transform = 'translateY(0)';
        }
      } else {
        section.classList.remove('active');
      }
    });
    
    // Update vertical timeline progress
    updateVerticalTimelineProgress();
  }, 100));
}

// Add hover animations for interactive elements
function addHoverAnimations() {
  // Pulse effect for buttons on hover
  document.querySelectorAll('.btn-primary, .btn-signup').forEach(btn => {
    btn.addEventListener('mouseenter', () => {
      if (typeof gsap !== 'undefined') {
        gsap.to(btn, { scale: 1.05, duration: 0.3, ease: 'power2.out' });
      } else {
        btn.style.transform = 'scale(1.05)';
      }
    });
    
    btn.addEventListener('mouseleave', () => {
      if (typeof gsap !== 'undefined') {
        gsap.to(btn, { scale: 1, duration: 0.3, ease: 'power2.out' });
      } else {
        btn.style.transform = 'scale(1)';
      }
    });
  });
  
  // Subtle hover effect for timeline markers
  document.querySelectorAll('.timeline-marker').forEach(marker => {
    marker.addEventListener('mouseenter', () => {
      if (typeof gsap !== 'undefined') {
        gsap.to(marker, { scale: 1.2, duration: 0.3, ease: 'back.out(1.5)' });
      } else {
        marker.style.transform = 'scale(1.2)';
      }
    });
    
    marker.addEventListener('mouseleave', () => {
      if (!marker.classList.contains('active')) {
        if (typeof gsap !== 'undefined') {
          gsap.to(marker, { scale: 1, duration: 0.3, ease: 'power2.out' });
        } else {
          marker.style.transform = 'scale(1)';
        }
      }
    });
  });
}

// Set up various event listeners
function setupEvents() {
  // Mobile menu toggle
  const menuToggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('nav');
  
  if (menuToggle && nav) {
    menuToggle.addEventListener('click', () => {
      menuToggle.classList.toggle('active');
      nav.classList.toggle('active');
    });
  }
  
  // Scroll indicator
  const scrollIndicator = document.querySelector('.scroll-indicator');
  if (scrollIndicator) {
    window.addEventListener('scroll', throttle(() => {
      if (window.scrollY > 100) {
        scrollIndicator.style.opacity = '0';
      } else {
        scrollIndicator.style.opacity = '1';
      }
    }, 100));
    
    // Scroll down when clicked
    scrollIndicator.addEventListener('click', () => {
      const storyContainer = document.querySelector('.story-container');
      if (storyContainer) {
        storyContainer.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }
  
  // Start journey button - Scroll to thanksgiving-prep section
  const startJourneyBtn = document.getElementById('start-journey');
  if (startJourneyBtn) {
    startJourneyBtn.addEventListener('click', () => {
      const thanksgivingSection = document.getElementById('thanksgiving-prep');
      if (thanksgivingSection) {
        thanksgivingSection.scrollIntoView({ behavior: 'smooth' });
        
        // Switch to interactive mode when button is clicked
        if (window.appComponents && window.appComponents.tourismMap) {
          window.appComponents.tourismMap.setMapMode(false);
        }
      }
    });
  }
  
  // Enhanced timeline item click events with smooth scrolling
  const timelineItems = document.querySelectorAll('.timeline-item');
  timelineItems.forEach((item, index) => {
    item.addEventListener('click', () => {
      // Get month and year from data attributes
      const month = item.getAttribute('data-month');
      const year = item.getAttribute('data-year');
      
      // Find section with matching month/year
      const sections = document.querySelectorAll('.story-section');
      let targetSection = null;
      
      sections.forEach(section => {
        const sectionMonth = section.getAttribute('data-month');
        const sectionYear = section.getAttribute('data-year');
        
        if (sectionMonth === month && sectionYear === year) {
          if (!targetSection) targetSection = section; // Take the first match
        }
      });
      
      // Scroll to the matching section
      if (targetSection) {
        targetSection.scrollIntoView({ behavior: 'smooth' });
      }
      
      // Update timeline if available
      if (window.appComponents && window.appComponents.timeline) {
        window.appComponents.timeline.updateTimeline(index);
        
        if (window.appComponents.tourismMap && window.appComponents.tourismMap.isDecorativeMode) {
          window.appComponents.tourismMap.setMapMode(false);
        }
      }
    });
  });
  
  // Modal events
  setupModalEvents();
  
  // Window resize event for maintaining full-screen map
  window.addEventListener('resize', debounce(() => {
    if (window.appComponents && window.appComponents.tourismMap) {
      console.log('Window resized, updating map');
      window.appComponents.tourismMap.resizeMap();
    }
  }, 200));
  
  // Set up city highlighting based on section
  setupCityHighlighting();
}

// Set up city highlighting based on active section
function setupCityHighlighting() {
  // Define which cities to highlight for each section
  const sectionCityMapping = {
    'thanksgiving-prep': null, // No specific city highlighted
    'nyc-thanksgiving': 'nyc',
    'thanksgiving-peak': 'lasvegas',
    'christmas-travel': 'chicago',
    'january-patterns': 'dc',
    'conclusion': null // Clear highlights
  };
  
  // Add observers to section elements
  const sections = document.querySelectorAll('.story-section');
  
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const sectionId = entry.target.id;
          const cityToHighlight = sectionCityMapping[sectionId];
          
          if (window.appComponents && window.appComponents.tourismMap) {
            // Clear previous highlights
            window.appComponents.tourismMap.clearHighlights();
            
            // Highlight specific city if specified
            if (cityToHighlight) {
              window.appComponents.tourismMap.highlightCity(cityToHighlight);
            }
          }
        }
      });
    }, { threshold: 0.6 }); // Trigger when section is 60% visible
    
    sections.forEach(section => {
      observer.observe(section);
    });
  } else {
    // Fallback for browsers without IntersectionObserver
    window.addEventListener('scroll', throttle(() => {
      let currentSection = null;
      
      sections.forEach(section => {
        const rect = section.getBoundingClientRect();
        if (rect.top < window.innerHeight * 0.5 && rect.bottom > window.innerHeight * 0.5) {
          currentSection = section.id;
        }
      });
      
      if (currentSection && window.appComponents && window.appComponents.tourismMap) {
        const cityToHighlight = sectionCityMapping[currentSection];
        window.appComponents.tourismMap.clearHighlights();
        
        if (cityToHighlight) {
          window.appComponents.tourismMap.highlightCity(cityToHighlight);
        }
      }
    }, 100));
  }
}

// Set up modal events
function setupModalEvents() {
  const modals = document.querySelectorAll('.city-detail-modal');
  
  modals.forEach(modal => {
    // Close on background click
    modal.addEventListener('click', event => {
      if (event.target === modal) {
        closeModal(modal);
      }
    });
    
    // Close on ESC key
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && modal.classList.contains('active')) {
        closeModal(modal);
      }
    });
    
    // Close button event
    const closeBtn = modal.querySelector('.close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        closeModal(modal);
      });
    }
  });
}

// Close modal with animation
function closeModal(modal) {
  // Add a closing animation class
  modal.classList.add('closing');
  
  // Reset map highlights
  if (window.appComponents && window.appComponents.tourismMap) {
    window.appComponents.tourismMap.clearHighlights();
  }
  
  // Wait for animation to complete then hide modal
  setTimeout(() => {
    modal.classList.remove('active');
    modal.classList.remove('closing');
  }, 300);
}

// Scrollytelling implementation
function setupScrollytelling() {
  console.log('Setting up enhanced scrollytelling...');
  
  // Get all story sections
  const sections = document.querySelectorAll('.story-section');
  
  // Check if GSAP and ScrollTrigger are available for enhanced effects
  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    // Register ScrollTrigger plugin
    gsap.registerPlugin(ScrollTrigger);
    
    // Create scroll triggers for each section
    sections.forEach((section, index) => {
      ScrollTrigger.create({
        trigger: section,
        start: 'top 40%',
        end: 'bottom 40%',
        onEnter: () => updateActiveSection(index, section),
        onEnterBack: () => updateActiveSection(index, section)
      });
      
      // Create enhanced reveal animation for content
      const content = section.querySelector('.content-wrapper');
      if (content) {
        gsap.fromTo(content,
          { opacity: 0, y: 30 },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: section,
              start: 'top 60%',
              toggleActions: 'play none none reverse'
            }
          }
        );
      }
    });
    
    // Pin the map container for fixed background effect
    ScrollTrigger.create({
      trigger: '.story-container',
      start: 'top top',
      endTrigger: '.story-sections',
      end: 'bottom bottom',
      pin: '.sticky-container',
      pinSpacing: false
    });
    
    // Animated timeline progress bar
    ScrollTrigger.create({
      trigger: '.story-sections',
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => {
        const progress = self.progress;
        document.querySelector('.timeline-progress').style.height = `${progress * 100}%`;
      }
    });
  } else {
    console.warn('GSAP or ScrollTrigger not available, falling back to basic scrolling');
    
    // Fallback to basic scroll event
    window.addEventListener('scroll', throttle(() => {
      let currentIndex = 0;
      
      sections.forEach((section, index) => {
        const rect = section.getBoundingClientRect();
        if (rect.top <= window.innerHeight / 2 && rect.bottom >= window.innerHeight / 2) {
          currentIndex = index;
          updateActiveSection(index, section);
        }
      });
      
      // Update vertical timeline progress manually
      updateVerticalTimelineProgress();
    }, 100));
  }
  
  // Make the thanksgiving-prep section active by default
  // Find the thanksgiving-prep section index
  let thanksgivingIndex = 0;
  sections.forEach((section, index) => {
    if (section.id === 'thanksgiving-prep') {
      thanksgivingIndex = index;
    }
  });
  
  updateActiveSection(thanksgivingIndex, sections[thanksgivingIndex]);
}

// Update active section based on scroll position
function updateActiveSection(index, section) {
  if (!section) {
    const sections = document.querySelectorAll('.story-section');
    if (sections[index]) {
      section = sections[index];
    } else {
      return;
    }
  }
  
  // Update sections
  const storySections = document.querySelectorAll('.story-section');
  storySections.forEach((sect, i) => {
    if (i === index) {
      sect.classList.add('active');
    } else {
      sect.classList.remove('active');
    }
  });
  
  // Update vertical timeline
  updateVerticalTimeline(section);
  
  // Get data attributes from the active section
  const month = section.getAttribute('data-month');
  const year = section.getAttribute('data-year');
  
  // Update map and timeline if available
  if (window.appComponents) {
    if (window.appComponents.tourismMap && window.appComponents.tourismMap.isDecorativeMode) {
      window.appComponents.tourismMap.setMapMode(false);
    }
    
    // Update timeline if month changed
    if (window.appComponents.timeline && month) {
      const monthIndex = month === '11' ? 0 : (month === '12' ? 1 : 2);
      window.appComponents.timeline.updateTimeline(monthIndex, false);
    }
    
    // Highlight appropriate city for this section
    highlightCityForSection(section.id);
  }
}

// Update vertical timeline based on active section
function updateVerticalTimeline(activeSection) {
  const month = activeSection.getAttribute('data-month');
  const year = activeSection.getAttribute('data-year');
  
  if (!month || !year) return;
  
  // Update active state of timeline items
  document.querySelectorAll('.timeline-item').forEach(item => {
    const itemMonth = item.getAttribute('data-month');
    const itemYear = item.getAttribute('data-year');
    
    if (itemMonth === month && itemYear === year) {
      item.classList.add('active');
      item.querySelector('.timeline-marker').classList.add('active');
    } else {
      item.classList.remove('active');
      item.querySelector('.timeline-marker').classList.remove('active');
    }
  });
}

// Update vertical timeline progress manually
function updateVerticalTimelineProgress() {
  const progressBar = document.querySelector('.vertical-timeline .timeline-progress');
  if (!progressBar) return;
  
  // Calculate scroll progress
  const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  const scrollProgress = scrollTop / scrollHeight;
  
  // Update progress bar height
  progressBar.style.height = `${scrollProgress * 100}%`;
}

// Highlight appropriate city based on current section
function highlightCityForSection(sectionId) {
  if (!window.appComponents || !window.appComponents.tourismMap) return;
  
  // Skip if in decorative mode
  if (window.appComponents.tourismMap.isDecorativeMode) return;
  
  let cityToHighlight = null;
  
  // Determine which city to highlight based on section ID
  switch(sectionId) {
    case 'nyc-thanksgiving':
      cityToHighlight = 'nyc';
      break;
    case 'thanksgiving-peak':
      cityToHighlight = 'lasvegas';
      break;
    case 'christmas-travel':
      cityToHighlight = 'chicago';
      break;
    case 'january-patterns':
      cityToHighlight = 'dc';
      break;
    case 'conclusion':
      // Clear highlights for conclusion
      window.appComponents.tourismMap.clearHighlights();
      return;
  }
  
  // Highlight the city if one was selected
  if (cityToHighlight) {
    window.appComponents.tourismMap.highlightCity(cityToHighlight);
  }
}

// Show error message
function showErrorMessage(message) {
  // Create error message element
  const errorEl = document.createElement('div');
  errorEl.className = 'error-message';
  errorEl.textContent = message;
  
  // Set styles
  errorEl.style.position = 'fixed';
  errorEl.style.top = '20px';
  errorEl.style.left = '50%';
  errorEl.style.transform = 'translateX(-50%)';
  errorEl.style.backgroundColor = 'var(--secondary-color)';
  errorEl.style.color = 'white';
  errorEl.style.padding = '12px 24px';
  errorEl.style.borderRadius = 'var(--border-radius)';
  errorEl.style.boxShadow = 'var(--shadow-lg)';
  errorEl.style.zIndex = '9999';
  
  // Add to document
  document.body.appendChild(errorEl);
  
  // Remove after 5 seconds with fade out
  setTimeout(() => {
    errorEl.style.opacity = '0';
    errorEl.style.transition = 'opacity 0.5s';
    
    setTimeout(() => {
      document.body.removeChild(errorEl);
    }, 500);
  }, 5000);
}

// Utility functions
function throttle(func, limit) {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

function debounce(func, wait) {
  let timeout;
  return function() {
    const context = this;
    const args = arguments;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), wait);
  };
}