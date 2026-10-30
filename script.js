const fallbackVenues = [
  {
    id: 1,
    name: 'Sky Turf Arena',
    sport: 'Football',
    location: 'Koramangala',
    rating: 4.8,
    price: 480,
    badge: 'Featured'
  },
  {
    id: 2,
    name: 'Green Park Cricket',
    sport: 'Cricket',
    location: 'Indiranagar',
    rating: 4.9,
    price: 620,
    badge: 'Top rated'
  },
  {
    id: 3,
    name: 'Smash Zone',
    sport: 'Badminton',
    location: 'HSR Layout',
    rating: 4.7,
    price: 320,
    badge: 'Popular'
  }
];

let venues = [...fallbackVenues];

const venueGrid = document.querySelector('#venue-grid');
const venueSelect = document.querySelector('#venue-select');
const durationSelect = document.querySelector('#duration');
const rateEl = document.querySelector('#sum-rate');
const totalEl = document.querySelector('#sum-total');
const bookingMessage = document.querySelector('#booking-message');
const reserveBtn = document.querySelector('#reserve-btn');

const money = (value) => `₹${Number(value).toLocaleString('en-IN')}`;

function getCurrentVenue() {
  const selectedId = Number(venueSelect.value || 1);
  return venues.find((venue) => venue.id === selectedId) || venues[0] || fallbackVenues[0];
}

function renderVenueOptions() {
  if (!venueSelect) return;

  venueSelect.innerHTML = venues
    .map(
      (venue) => `<option value="${venue.id}">${venue.name}</option>`
    )
    .join('');
}

function renderVenues() {
  if (!venueGrid) return;

  venueGrid.innerHTML = venues
    .map(
      (venue) => `
        <article class="venue-card">
          <div class="venue-visual" aria-hidden="true"></div>
          <div class="venue-content">
            <div class="venue-head">
              <h3>${venue.name}</h3>
              <span class="badge">${venue.badge}</span>
            </div>
            <div class="meta">
              <span>${venue.sport}</span>
              <span>•</span>
              <span>${venue.location}</span>
              <span>•</span>
              <span>${venue.rating} ★</span>
            </div>
            <div class="venue-price">
              <span class="price">${money(venue.price)}</span>
              <a href="#booking" class="btn btn-primary">Book</a>
            </div>
          </div>
        </article>
      `
    )
    .join('');
}

function updateSummary() {
  const venue = getCurrentVenue();
  const duration = Number(durationSelect?.value || 1);

  if (!rateEl || !totalEl || !venue) return;

  const total = venue.price * duration;
  rateEl.textContent = money(venue.price);
  totalEl.textContent = money(total);
}

async function loadVenues() {
  try {
    const response = await fetch('/api/venues');
    if (!response.ok) throw new Error('Failed to load venues');

    const data = await response.json();
    if (Array.isArray(data) && data.length) {
      venues = data;
      renderVenueOptions();
      renderVenues();
      updateSummary();
    }
  } catch (error) {
    venues = [...fallbackVenues];
    renderVenueOptions();
    renderVenues();
    updateSummary();
  }
}

async function reserveBooking() {
  if (!venueSelect || !durationSelect || !bookingMessage) return;

  const selectedVenueId = Number(venueSelect.value);
  const selectedDate = document.querySelector('#booking-date')?.value || new Date().toISOString().slice(0, 10);
  const selectedDuration = Number(durationSelect.value || 1);

  bookingMessage.textContent = 'Sending booking request...';

  try {
    const response = await fetch('/api/bookings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        venueId: selectedVenueId,
        date: selectedDate,
        duration: selectedDuration
      })
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Booking failed');
    }

    bookingMessage.textContent = `Booked ${result.booking.venueName} for ${result.booking.date}.`;
  } catch (error) {
    bookingMessage.textContent = error.message || 'Could not complete booking.';
  }
}

if (venueSelect) {
  venueSelect.addEventListener('change', updateSummary);
}

if (durationSelect) {
  durationSelect.addEventListener('change', updateSummary);
}

if (reserveBtn) {
  reserveBtn.addEventListener('click', reserveBooking);
}

renderVenueOptions();
renderVenues();
updateSummary();
loadVenues();
