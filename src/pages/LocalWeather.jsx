import { useEffect, useState } from 'react';
import 'leaflet/dist/leaflet.css';

export default function LocalWeather() {
  const [location, setLocation] = useState(null);
  const [hourlyForecast, setHourlyForecast] = useState([]);
  const [dailyForecast, setDailyForecast] = useState([]);
  const [search, setSearch] = useState('');
  const [alerts, setAlerts] = useState([]);
  const [locationName, setLocationName] = useState('');
  const [currentConditions, setCurrentConditions] = useState(null);
  const [sunriseSunsetMap, setSunriseSunsetMap] = useState({});

  const geocodeLocation = async (query) => {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
    const data = await res.json();
    if (data.length > 0) {
      const { lat, lon, display_name } = data[0];
      setLocation({ lat, lon });
      setLocationName(display_name);
      fetchSunriseSunset(lat, lon);
    }
  };

  const reverseGeocode = async (lat, lon) => {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
    const data = await res.json();
    if (data && data.display_name) {
      setLocationName(data.display_name);
    }
  };

  useEffect(() => {
    if (!location) {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const coords = { lat: pos.coords.latitude, lon: pos.coords.longitude };
            setLocation(coords);
            reverseGeocode(coords.lat, coords.lon);
            fetchSunriseSunset(coords.lat, coords.lon);
          },
          (err) => {
            console.error("Geolocation error:", err);
          }
        );
      }
    }
  }, [location]);

  useEffect(() => {
    if (location) {
      const fetchNWSForecast = async () => {
        try {
          const pointsRes = await fetch(`https://api.weather.gov/points/${location.lat},${location.lon}`);
          const pointsData = await pointsRes.json();
          const forecastUrl = pointsData.properties.forecast;
          const hourlyUrl = pointsData.properties.forecastHourly;
          const stationUrl = pointsData.properties.observationStations;

          const forecastRes = await fetch(forecastUrl);
          const forecastData = await forecastRes.json();
          setDailyForecast(forecastData.properties.periods.slice(0, 7));

          const hourlyRes = await fetch(hourlyUrl);
          const hourlyData = await hourlyRes.json();
          setHourlyForecast(hourlyData.properties.periods.slice(0, 12));

          const alertsRes = await fetch(`https://api.weather.gov/alerts/active?point=${location.lat},${location.lon}`);
          const alertsData = await alertsRes.json();
          setAlerts(alertsData.features || []);

          const stationRes = await fetch(stationUrl);
          const stationData = await stationRes.json();
          const nearestStation = stationData.features[0]?.properties?.stationIdentifier;

          if (nearestStation) {
            const obsRes = await fetch(`https://api.weather.gov/stations/${nearestStation}/observations/latest`);
            const obsData = await obsRes.json();
            setCurrentConditions(obsData.properties);
          }
        } catch (err) {
          console.error("Error fetching NWS forecast or alerts:", err);
        }
      };

      fetchNWSForecast();
    }
  }, [location]);

  const fetchSunriseSunset = async (lat, lon) => {
    try {
      const today = new Date();
      const dateList = Array.from({ length: 4 }, (_, i) => {
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        return d.toISOString().split('T')[0];
      });

      const start = dateList[0];
      const end = dateList[dateList.length - 1];

      const apiUrl = `https://api.sunrisesunset.io/json?lat=${lat}&lng=${lon}&date_start=${start}&date_end=${end}&timezone=America/New_York`;
      const res = await fetch(apiUrl);
      const data = await res.json();
      if (data.results) {
        const mapped = {};
        data.results.forEach((item) => {
          const formatTime = (timeStr) => {
            const [hour, minute] = timeStr.split(':');
            return `${hour}:${minute}`;
          };
          mapped[item.date] = {
            sunrise: formatTime(item.sunrise),
            sunset: formatTime(item.sunset),
          };
        });
        setSunriseSunsetMap(mapped);
      }
    } catch (err) {
      console.error("Error fetching sunrise/sunset times:", err);
    }
  };

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  return (
    <div className="space-y-6">
      {/* Search Input */}
      <div className="flex flex-col sm:flex-row items-center gap-2">
        <input
          type="text"
          placeholder="Enter City, State"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border rounded px-3 py-1 w-full sm:w-64 shadow"
        />
        <button
          onClick={() => geocodeLocation(search)}
          className="bg-blue-600 text-white px-4 py-1 rounded shadow"
        >
          Search
        </button>
      </div>

      {/* Location & Current Conditions */}
      {locationName && <h2 className="text-lg font-semibold text-gray-700">📍 {locationName}</h2>}
      <h1 className="text-2xl font-bold">Local Weather</h1>

      {alerts.length > 0 && (
        <div className="bg-red-100 p-4 rounded shadow">
          <h2 className="text-lg font-semibold text-red-700">⚠️ Alerts</h2>
          <ul className="list-disc pl-5">
            {alerts.map((alert, idx) => (
              <li key={idx}>
                <strong>{alert.properties.event}:</strong> {alert.properties.headline}
              </li>
            ))}
          </ul>
        </div>
      )}

      {currentConditions && (
        <div className="p-4 bg-white rounded shadow-md space-y-2">
          <p><strong>Temperature:</strong> {(currentConditions.temperature?.value * 9/5 + 32).toFixed(1)}°F</p>
          <p><strong>Feels Like:</strong> {
            currentConditions.heatIndex?.value !== null
              ? `${(currentConditions.heatIndex.value * 9/5 + 32).toFixed(1)}°F`
              : currentConditions.windChill?.value !== null
                ? `${(currentConditions.windChill.value * 9/5 + 32).toFixed(1)}°F`
                : 'N/A'
          }</p>
          <p><strong>Conditions:</strong> {currentConditions.textDescription}</p>
          <p><strong>Wind:</strong> {currentConditions.windSpeed?.value !== null ? `${(currentConditions.windSpeed.value * 2.23694).toFixed(1)} mph` : 'Calm'}</p>
        </div>
      )}

      {/* Daily Forecast */}
      <div>
        <h2 className="text-xl font-semibold mb-2">📅 Daily Forecast</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {dailyForecast.map((day, idx) => {
            const dayDate = new Date(day.startTime).toISOString().split('T')[0];
            const sunriseSunset = sunriseSunsetMap[dayDate] || {};
            return (
              <div key={idx} className="bg-white p-3 rounded shadow text-center">
                <p className="font-semibold">{day.name} ({formatDate(day.startTime)})</p>
                <p>{day.temperature}°{day.temperatureUnit}</p>
                <p className="text-sm">{day.shortForecast}</p>
                <p className="text-sm">💨 {day.windSpeed}</p>
                {day.name.toLowerCase().includes("night")
                  ? <p className="text-sm">Sunset: {sunriseSunset.sunset || 'N/A'} PM</p>
                  : <p className="text-sm">Sunrise: {sunriseSunset.sunrise || 'N/A'} AM</p>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Hourly Forecast */}
      <div>
        <h2 className="text-xl font-semibold mb-2">🕒 Hourly Forecast</h2>
        <div className="flex overflow-x-auto gap-4">
          {hourlyForecast.map((hour, idx) => (
            <div key={idx} className="min-w-[120px] bg-white p-2 rounded shadow text-center">
              <p className="font-medium text-sm">{new Date(hour.startTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</p>
              <p>{hour.temperature}°{hour.temperatureUnit}</p>
              <p className="text-sm">💧 {hour.probabilityOfPrecipitation.value ?? 0}%</p>
              <p className="text-sm">💨 {hour.windSpeed}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Radars */}
      <div className="flex flex-col md:flex-row gap-6 mt-6">
        {/* RainViewer */}
        <div className="flex-1">
          <h2 className="text-xl font-semibold mb-2">🌧️ RainViewer Radar Animation</h2>
          <div className="w-full aspect-[4/3]">
            <iframe
              src={`https://www.rainviewer.com/map.html?loc=${location?.lat},${location?.lon},7&oFa=0&oC=0&oU=0&oCS=1&oF=1&oAP=0&c=3&o=83&lm=1&th=0`}
              width="100%"
              height="100%"
              className="rounded shadow w-full h-full"
              title="RainViewer Radar"
            ></iframe>
          </div>
        </div>

        {/* Windy.com */}
        <div className="flex-1">
          <h2 className="text-xl font-semibold mb-2">🌬️ Windy.com Radar View</h2>
          <div className="w-full aspect-[4/3]">
            <iframe
              src={`https://embed.windy.com/embed2.html?lat=${location?.lat}&lon=${location?.lon}&width=650&height=450&zoom=7&level=surface&overlay=rain&product=ecmwf&menu=false&message=&marker=&calendar=now&pressure=true&type=map&location=coordinates&detail=false&metricWind=default&metricTemp=default&radarRange=-1`}
              width="100%"
              height="100%"
              frameBorder="0"
              className="rounded shadow w-full h-full"
              title="Windy Radar"
            ></iframe>
          </div>
        </div>
      </div>

      {/* NOAA Radars */}
      <div className="flex flex-col md:flex-row gap-6 mt-6">
        <div className="flex-1">
          <h2 className="text-xl font-semibold mb-2">📡 NOAA Atlanta (KFFC) Radar</h2>
          <img
            src="https://radar.weather.gov/ridge/standard/KFFC_loop.gif"
            alt="KFFC Radar Loop"
            className="rounded shadow w-full"
            style={{ height: "500px", objectFit: "contain" }}
          />
        </div>

        <div className="flex-1">
          <h2 className="text-xl font-semibold mb-2">🌀 NOAA Southeast Radar Loop</h2>
          <img
            src="https://radar.weather.gov/ridge/standard/SOUTHEAST_loop.gif"
            alt="Southeast Radar Loop"
            className="rounded shadow w-full"
            style={{ height: "500px", objectFit: "contain" }}
          />
        </div>
      </div>
    </div>
  );
}
