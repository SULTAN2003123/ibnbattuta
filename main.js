// Travel Data
const travelData = [
    {
        id: 1,
        title: "Tangier, Morocco",
        lat: 35.7595,
        lng: -5.8340,
        date: "1325",
        description: "Ibn Battuta leaves his home in Tangier at the age of 21 to perform the Hajj pilgrimage to Mecca. He would not return for 24 years.",
        image: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/Ibn_Battuta_in_Egypt.jpg/800px-Ibn_Battuta_in_Egypt.jpg"
    },
    {
        id: 2,
        title: "Alexandria, Egypt",
        lat: 31.2001,
        lng: 29.9187,
        date: "1326",
        description: "He arrives in Alexandria, marveling at the Lighthouse, one of the Seven Wonders of the World. Here, a mystic predicts his extensive travels.",
        image: null
    },
    {
        id: 3,
        title: "Cairo, Egypt",
        lat: 30.0444,
        lng: 31.2357,
        date: "1326",
        description: "Describing Cairo as the 'Mother of Cities', he stays for a month, visiting mosques and scholars.",
        image: null
    },
    {
        id: 4,
        title: "Mecca, Arabia",
        lat: 21.3891,
        lng: 39.8579,
        date: "1326",
        description: "He completes his first Hajj. Instead of returning home, he decides to continue traveling, joining a caravan to Baghdad.",
        image: null
    },
    {
        id: 5,
        title: "Isfahan, Persia",
        lat: 32.6546,
        lng: 51.6680,
        date: "1327",
        description: "He travels through Persia, visiting Isfahan and Shiraz, noting the destruction caused by the Mongol invasions.",
        image: null
    },
    {
        id: 6,
        title: "Mogadishu, Somalia",
        lat: 2.0469,
        lng: 45.3182,
        date: "1331",
        description: "Sailing down the Swahili Coast, he visits Mogadishu, describing it as a massive city of merchants.",
        image: null
    },
    {
        id: 7,
        title: "Constantinople",
        lat: 41.0082,
        lng: 28.9784,
        date: "1332",
        description: "He visits Constantinople (modern Istanbul) and meets the Byzantine Emperor Andronikos III.",
        image: null
    },
    {
        id: 8,
        title: "Delhi, India",
        lat: 28.7041,
        lng: 77.1025,
        date: "1334",
        description: "He reaches India and serves as a judge (Qadi) in the court of Sultan Muhammad bin Tughluq for several years.",
        image: null
    },
    {
        id: 9,
        title: "Hangzhou, China",
        lat: 30.2741,
        lng: 120.1551,
        date: "1345",
        description: "He travels to China, visiting Hangzhou, which he calls the biggest city he has ever seen.",
        image: null
    },
    {
        id: 10,
        title: "Return to Tangier",
        lat: 35.7595,
        lng: -5.8340,
        date: "1349",
        description: "After 24 years, he returns to Tangier to find his mother had passed away during the Black Death.",
        image: null
    }
];

// DOM Elements
const heroSection = document.getElementById('hero');
const startBtn = document.getElementById('start-journey-btn');
const themeToggle = document.getElementById('theme-toggle');
const storyStream = document.getElementById('story-stream');
const yearDisplay = document.getElementById('year-display');
const progressBar = document.getElementById('journey-progress');

// State
let currentIndex = -1; // Not started
let map;
let markers = [];
let pathPolyline;
let activeSegmentPolyline;

// Map Setup
map = L.map('map', {
    zoomControl: false,
    scrollWheelZoom: false, // Critical for scrollytelling
    dragging: false, // Prevent dragging to keep focus on scroll
    tap: false,
    height: '100%',
    attributionControl: false,
    zoomAnimation: true,
    minZoom: 3
}).setView([30, 20], 4);

// Tiles
const darkTiles = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
const lightTiles = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

let currentTileLayer = L.tileLayer(darkTiles, {
    maxZoom: 19,
    subdomains: 'abcd',
    keepBuffer: 20, // Load 20 screens worth of tiles around the view
    updateWhenIdle: false, // Load tiles while panning, don't wait for stop
    updateWhenZooming: false // Don't load intermediate zoom tiles (smoother)
}).addTo(map);

// Pre-load tiles by panning to bounds (hacky but helps)
const bounds = L.latLngBounds(travelData.map(d => [d.lat, d.lng]));
map.fitBounds(bounds, { animate: false });
setTimeout(() => {
    map.setView([30, 20], 4, { animate: false }); // Reset to start
}, 100);



// Functions
function init() {
    renderStories();
    addMarkers();
    setupEventListeners();
    setupIntersectionObserver();
}

function renderStories() {
    storyStream.innerHTML = travelData.map((item, index) => {
        let distanceInfo = '';
        if (index > 0) {
            const prev = travelData[index - 1];
            const distMeters = map.distance([prev.lat, prev.lng], [item.lat, item.lng]);
            const distKm = (distMeters / 1000).toFixed(0);
            const distMiles = (distMeters * 0.000621371).toFixed(0);
            distanceInfo = `<div class="card-distance"><span class="distance-icon">👣</span> ${distKm} km / ${distMiles} mi from last stop</div>`;
        }

        return `
        <div class="story-card-wrapper" data-index="${index}">
            <div class="story-card" id="card-${index}">
                <div class="card-header-row">
                    <span class="card-badge">Stop ${index + 1}</span>
                    ${distanceInfo}
                </div>
                <h2 class="card-title">${item.title}</h2>
                ${item.image ? `<img src="${item.image}" alt="${item.title}" class="card-img" loading="lazy">` : ''}
                <p class="card-desc">${item.description}</p>
            </div>
        </div>
    `}).join('');
}

function addMarkers() {
    travelData.forEach((item, index) => {
        // Modern Circle Markers
        const marker = L.circleMarker([item.lat, item.lng], {
            color: 'var(--accent)',
            fillColor: 'var(--accent)',
            fillOpacity: 0.8,
            radius: 8,
            weight: 2
        }).addTo(map);

        marker.bindTooltip(item.title, {
            permanent: false,
            direction: 'top',
            className: 'map-tooltip'
        });

        // Click on marker -> Scroll to story card
        marker.on('click', () => {
            const el = document.querySelector(`.story-card-wrapper[data-index="${index}"]`);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        });

        markers.push({ index, marker });
    });

    // Path (Full Journey - Static Background)
    const fullJourney = travelData.map(d => [d.lat, d.lng]);
    pathPolyline = L.polyline(fullJourney, {
        color: 'var(--accent)',
        weight: 3,
        opacity: 0.4, // Dimmer background path
        className: 'static-path'
    }).addTo(map);
}

function setupEventListeners() {
    startBtn.addEventListener('click', () => {
        heroSection.classList.add('hidden');
        // Scroll first item into view
        const firstItem = document.querySelector('.story-card-wrapper[data-index="0"]');
        if (firstItem) firstItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });

    // Theme Toggling Logic Restored
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const body = document.body;
            const isDark = !body.hasAttribute('data-theme'); // Default is dark

            if (isDark) {
                body.setAttribute('data-theme', 'light');
                currentTileLayer.setUrl(lightTiles);
            } else {
                body.removeAttribute('data-theme');
                currentTileLayer.setUrl(darkTiles);
            }
        });
    }
}

function setupIntersectionObserver() {
    // Observer options: Trigger when 50% of the item is visible in the container
    const options = {
        root: null, // Viewport
        rootMargin: '-40% 0px -40% 0px', // Trigger trigger when element is in middle 20% of screen
        threshold: 0
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const index = parseInt(entry.target.getAttribute('data-index'));
                updateMapState(index);
            }
        });
    }, options);

    // Map Events to Toggle Expensive Filters
    map.on('movestart', () => {
        document.body.classList.add('is-map-moving'); // Disable filters via CSS
    });
    map.on('moveend', () => {
        document.body.classList.remove('is-map-moving');
    });

    document.querySelectorAll('.story-card-wrapper').forEach(item => {
        observer.observe(item);
    });
}

let isUpdating = false;
function updateMapState(index) {
    if (index < 0 || index >= travelData.length) return;
    if (index === currentIndex || isUpdating) return;

    // Simple throttle/debounce (wait for move to finish or enforce delay)
    // Actually, just let the latest one win but ensure we don't spam flyTo

    const prevIndex = currentIndex;
    currentIndex = index;
    const item = travelData[index];

    // Fly (Restored Zoom)
    map.flyTo([item.lat, item.lng], 6, {
        animate: true,
        duration: 1.5 // Standard speed
    });

    // Update Active Card Styles
    document.querySelectorAll('.story-card').forEach(el => el.classList.remove('active'));
    const activeCard = document.getElementById(`card-${index}`);
    if (activeCard) activeCard.classList.add('active');

    // Update Header Info
    yearDisplay.textContent = item.date + " AD";
    const progressPct = ((index + 1) / travelData.length) * 100;
    progressBar.style.width = `${progressPct}%`;

    // Highlight Marker
    markers.forEach(m => {
        // Reset
        if (m.marker._path) {
            m.marker._path.classList.remove('active-glow');
            m.marker._path.style.animation = ''; // Clear inline animation
        }

        if (m.index === index) {
            m.marker.setRadius(12);
            m.marker.setStyle({ color: '#fff', fillOpacity: 1 });

            // Add Pulse Effect via CSS class
            if (m.marker._path) {
                m.marker._path.classList.add('active-glow');
                // We use the same glow class but can add specific marker animation if needed
                // actually active-glow has stroke animation which might look weird on a circle
                // Let's override it for the marker to be a pulse
                m.marker._path.style.animation = 'pulse-scale 2s infinite ease-in-out';
            }
        } else {
            m.marker.setRadius(8);
            m.marker.setStyle({ color: 'var(--accent)', fillOpacity: 0.8 });
        }
    });

    // Update Active Path Segment
    if (activeSegmentPolyline) map.removeLayer(activeSegmentPolyline);

    if (index > 0) {
        // Create line from previous stop to current stop
        const prev = travelData[index - 1];
        const curr = travelData[index];
        const segment = [[prev.lat, prev.lng], [curr.lat, curr.lng]];

        activeSegmentPolyline = L.polyline(segment, {
            color: '#fff',
            weight: 4,
            opacity: 1,
            className: 'active-glow' // CSS handles glow and pulse
        }).addTo(map);

    }
}

/*
function updatePath(prevIndex, newIndex) {
    const relevantPoints = travelData.slice(0, newIndex + 1).map(d => [d.lat, d.lng]);
    pathPolyline.setLatLngs(relevantPoints);
}
*/

// Start
init();
