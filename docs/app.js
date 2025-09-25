// Get city coordinates
async function getCoordinates(city) {
  try {
    const response = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1`
    );
    const data = await response.json();

    if (data.results && data.results.length > 0) {
      const { latitude, longitude } = data.results[0];
      return { lat: latitude, lon: longitude };
    } else {
      alert("City not found");
      return null;
    }
  } catch (error) {
    alert("Failed to fetch city coordinates");
    return null;
  }
}

// Handling search bar
const cityInput = document.getElementById("city-input");
const searchBtn = document.getElementById("search-btn");

async function handleSearch() {
  const city = cityInput.value.trim();
  if (!city) return;

  const coords = await getCoordinates(city);
  if (coords) {
    const weatherData = await fetchWeather(coords.lat, coords.lon);
    if (weatherData) {
      updateWeatherCard(weatherData);
    }
  }
}

cityInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") handleSearch();
});

searchBtn.addEventListener("click", handleSearch);

// Fetch weather data
async function fetchWeather(lat, lon) {
  try {
    const base_url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,apparent_temperature,precipitation&daily=temperature_2m_max,temperature_2m_min,weathercode,precipitation_sum&current_weather=true&timezone=auto`;
    const res = await fetch(base_url);
    const data = await res.json();
    return data;
  } catch (error) {
    alert("Unable to fetch weather data");
    return null;
  }
}

// Map weather code to icon
function getWeatherIcons(code) {
  if ([0].includes(code)) return "fa-sun";
  if ([1, 2, 3].includes(code)) return "fa-cloud";
  if ([45, 48].includes(code)) return "fa-smog";
  if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code))
    return "fa-cloud-rain";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "fa-snowflake";
  if ([95, 96, 99].includes(code)) return "fa-cloud-bolt";
  return "fa-sun"; // default
}

// Map weather code to description
function getWeatherDesc(code) {
  if ([0].includes(code)) return "Clear Sky";
  if ([1, 2, 3].includes(code)) return "Cloudy";
  if ([45, 48].includes(code)) return "Foggy";
  if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return "Rainy";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "Snowy";
  if ([95, 96, 99].includes(code)) return "Thunderstorm";
  return "Unknown";
}

// Update background based on weather code
function updateBg(code) {
  const container = document.querySelector(".relative");

  if ([0].includes(code))
    container.style.backgroundImage = "url('assets/sunny.jpg')";
  else if ([1, 2, 3].includes(code))
    container.style.backgroundImage = "url('assets/cloudy.jpg')";
  else if ([45, 48].includes(code))
    container.style.backgroundImage = "url('assets/foggy.jpg')";
  else if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code))
    container.style.backgroundImage = "url('assets/rainy.jpg')";
  else if ([71, 73, 75, 77, 85, 86].includes(code))
    container.style.backgroundImage = "url('assets/snowfall.jpg')";
  else if ([95, 96, 99].includes(code))
    container.style.backgroundImage = "url('assets/lightining.jpg')";
  else container.style.backgroundImage = "url('assets/sunny.jpg')";

  container.style.backgroundSize = "cover";
  container.style.backgroundPosition = "center";
}

// Update weather card dynamically
function updateWeatherCard(data) {
  const current = data.current_weather;
  const daily = data.daily;

  // Get nearest hourly temperature for more accurate "current" temp
  const now = new Date();
  const hours = data.hourly.time.map((t) => new Date(t).getHours());
  const nearestIndex = hours.reduce((prev, curr, idx) => {
    return Math.abs(curr - now.getHours()) <
      Math.abs(hours[prev] - now.getHours())
      ? idx
      : prev;
  }, 0);
  const temp = data.hourly.temperature_2m[nearestIndex];

  // Current temperature
  document.getElementById("current-temp").innerHTML = `${temp.toFixed(1)}&deg;`;

  // Weather description
  document.getElementById("current-desc").innerText = getWeatherDesc(
    current.weathercode
  );

  // High-Low
  const high = daily.temperature_2m_max?.[0] ?? "-";
  const low = daily.temperature_2m_min?.[0] ?? "-";
  document.getElementById(
    "current-extra"
  ).innerHTML = `High: ${high}&deg; Low: ${low}&deg;`;

  // Icon update
  const iconClass = getWeatherIcons(current.weathercode);
  document.getElementById(
    "current-icon"
  ).className = `fa-solid ${iconClass} text-4xl mt-2`;

  // Background update
  updateBg(current.weathercode);

  // Update info cards
  const feelsLike = data.hourly.apparent_temperature[nearestIndex].toFixed(1);
  document.getElementById("feels-like").innerHTML = `${feelsLike}&deg;`;

  const precipitation = daily.precipitation_sum?.[0]?.toFixed(1) ?? "-";
  document.getElementById("precipitation").innerHTML = `${precipitation}"`;
}

// Get current location weather
function getCurrentLocationWeather() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;

        const weatherData = await fetchWeather(lat, lon);
        if (weatherData) {
          updateWeatherCard(weatherData);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        alert("Unable to get your location. Please search manually.");
      }
    );
  } else {
    alert("Geolocation is not supported by your browser.");
  }
}

window.addEventListener("load", getCurrentLocationWeather);
