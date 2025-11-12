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
    const base_url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,apparent_temperature,precipitation,relative_humidity_2m,weathercode,windspeed_10m&daily=temperature_2m_max,temperature_2m_min,weathercode,precipitation_sum&current_weather=true&timezone=auto`;

    const res = await fetch(base_url);
    const data = await res.json();
    return data;
  } catch (error) {
    alert("Unable to fetch weather data");
    return null;
  }
}

// Map weather code to icon
function getWeatherIcons(code, isNight = false) {
  if (isNight) {
    if ([0].includes(code)) return "fa-moon";
    if ([1, 2].includes(code)) return "fa-cloud-moon";
  }

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
  const hour = new Date().getHours();
  const isNight = hour > 18 || hour <= 5;

  if (isNight && [0].includes(code)) {
    container.style.backgroundImage = "url('assets/night.jpg')";
  } else if ([0].includes(code))
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
  const now = new Date(data.current_weather.time).getTime(); 
  const hours = data.hourly.time.map((t) => new Date(t).getTime());

  const nearestIndex = hours.reduce((prev, curr, idx) => {
    return Math.abs(curr - now) < Math.abs(hours[prev] - now) ? idx : prev;
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
  const hour = new Date().getHours();
  const isNight = hour > 18 || hour <= 5;
  const iconClass = getWeatherIcons(current.weathercode, isNight);
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

  // Humidity
  const humidity = data.hourly.relative_humidity_2m?.[nearestIndex] ?? "-";
  document
    .getElementById("humidity-card")
    .querySelector("h1").innerText = `${humidity}%`;

  // Wind speed
  const windSpeed = data.hourly.windspeed_10m?.[nearestIndex] ?? "-";
  document
    .getElementById("wind-card")
    .querySelector("h1").innerText = `${windSpeed} MPH`;

  //hourly forecast update
  updateHourlyData(data);
  updateWeeklyData(data);
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

function updateHourlyData(data) {
  const container = document.getElementById("hourly-forecast");
  container.innerHTML = "";

  const now = new Date();
  const hrs = data.hourly.time.map((t) => new Date(t));
  const currIndex = hrs.findIndex((h) => h.getHours() === now.getHours());
  const end = Math.min(currIndex + 12, data.hourly.time.length);

  for (let i = currIndex; i < end; i++) {
    const time = hrs[i];
    const temp = data.hourly.temperature_2m[i];
    const code = data.hourly.weathercode ? data.hourly.weathercode[i] : 0;

    const timeStr = time.toLocaleTimeString([], {
      hour: "numeric",
      hour12: true,
    });
    const hour = time.getHours();
    const isNight = hour > 18 || hour <= 5;
    const iconClass = getWeatherIcons(code, isNight);

    const hourDiv = document.createElement("div");
    hourDiv.className =
      "flex flex-col items-center justify-center w-[75px] snap-center text-center flex-none";

    hourDiv.innerHTML = `
      <p class="text-xs mb-1">${timeStr}</p>
      <i class="fa-solid ${iconClass} text-lg mb-1"></i>
      <p class="text-sm font-medium">${temp.toFixed(0)}&deg;</p>
    `;

    if (i < end - 1) hourDiv.style.marginRight = "16px";

    container.appendChild(hourDiv);
  }
}

function updateWeeklyData(data) {
  const container = document.getElementById("weekly-forecast");
  container.innerHTML = "";

  const days = data.daily.time;
  const highs = data.daily.temperature_2m_max;
  const codes = data.daily.weathercode;

  for (let i = 0; i < Math.min(7, days.length); i++) {
    const date = new Date(days[i]);
    const weekday = date.toLocaleDateString(undefined, {
      weekday: "short",
    });

    const temp = Math.round(highs[i]);
    const iconClass = getWeatherIcons(codes[i]);
    const dayDiv = document.createElement("div");
    dayDiv.className = "flex flex-col items-center min-w-[60px] snap-center";

    dayDiv.innerHTML = ` <p class="text-xs mb-1">${weekday}</p>
      <i class="fa-solid ${iconClass} text-lg mb-1"></i>
      <p class="text-sm font-medium">${temp}&deg;</p>`;

    container.appendChild(dayDiv);
  }
}
