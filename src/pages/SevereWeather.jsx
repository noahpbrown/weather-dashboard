import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export default function SevereWeather() {
  const [alerts, setAlerts] = useState(null);
  const [selectedRegion, setSelectedRegion] = useState('Southeast');
  const [day1Type, setDay1Type] = useState('categorical');
  const [day2Type, setDay2Type] = useState('categorical');
  const [day3Type, setDay3Type] = useState('categorical');

  const regionUrls = {
    'Pacific Northwest': 'https://radar.weather.gov/region/pacnorthwest/standard',
    'North Rockies': 'https://radar.weather.gov/region/northrockies/standard',
    'Upper Mississippi Valley': 'https://radar.weather.gov/region/uppermissvly/standard',
    'Central Great Lakes': 'https://radar.weather.gov/region/greatlakes/standard',
    'Northeast': 'https://radar.weather.gov/region/northeast/standard',
    'Pacific Southwest': 'https://radar.weather.gov/region/pacsouthwest/standard',
    'Southern Rockies': 'https://radar.weather.gov/region/southrockies/standard',
    'Southern Plains': 'https://radar.weather.gov/region/southplains/standard',
    'Southern Mississippi Valley': 'https://radar.weather.gov/region/lowerMissvly/standard',
    'Southeast': 'https://radar.weather.gov/region/southeast/standard',
    'National (Large)': 'https://radar.weather.gov/region/national/standard',
    'National': 'https://radar.weather.gov/region/national/standard',
  };

  useEffect(() => {
    fetch('https://api.weather.gov/alerts/active')
      .then((res) => res.json())
      .then((data) => setAlerts(data))
      .catch((err) => console.error('Failed to fetch alerts', err));
  }, []);

  const getImageSrc = (day, type) => {
    if (type === 'categorical') {
      return `https://www.spc.noaa.gov/partners/outlooks/state/swody${day}.png`;
    }
    if (day === 3 && type === 'prob') {
      return 'https://www.spc.noaa.gov/products/outlook/day3prob.gif';
    }
    const prefix = day === 1 ? '1200' : '0600';
    return `https://www.spc.noaa.gov/products/outlook/day${day}probotlk_${prefix}_${type}.gif`;
  };

  return (
    <div className="w-full px-4 pb-8">
      <h1 className="text-2xl font-bold mb-4">Severe Weather Map</h1>

      {/* Map and Radar Section */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Leaflet Map */}
        <div className="lg:w-1/2 w-full h-[80vh]">
          <MapContainer
            center={[34.7, -86.6]}
            zoom={6}
            scrollWheelZoom={true}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution="&copy; OpenStreetMap contributors"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {alerts && <AlertPolygons alerts={alerts} />}
          </MapContainer>
        </div>

        {/* NWS Radar */}
        <div className="lg:w-1/2 w-full flex flex-col">
          <label className="font-semibold mb-2">Select Radar Region:</label>
          <select
            className="border mb-4 p-2 rounded w-fit"
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
          >
            {Object.keys(regionUrls).map((region) => (
              <option key={region} value={region}>{region}</option>
            ))}
          </select>
          <iframe
            src={regionUrls[selectedRegion]}
            className="rounded shadow w-full flex-grow"
            title="NWS Radar Region"
            style={{ height: '100%', minHeight: '500px', border: 'none' }}
          />
        </div>
      </div>

      {/* SPC Outlooks */}
      <h2 className="text-2xl font-bold mt-10 mb-4">SPC Severe Weather Outlooks</h2>

      {/* Day 1 & 2 on same row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {[1, 2].map((day) => {
          const typeState = day === 1 ? day1Type : day2Type;
          const setType = day === 1 ? setDay1Type : setDay2Type;
          return (
            <div key={day} className="text-center">
              <h3 className="font-semibold mb-2">Day {day} Outlook</h3>
              <select
                className="border p-1 rounded mb-2"
                value={typeState}
                onChange={(e) => setType(e.target.value)}
              >
                <option value="categorical">Categorical</option>
                <option value="torn">Tornado</option>
                <option value="wind">Wind</option>
                <option value="hail">Hail</option>
              </select>
              <a
                href={`https://www.spc.noaa.gov/products/outlook/day${day}otlk.html`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <img
                  src={getImageSrc(day, typeState)}
                  alt={`Day ${day} Outlook`}
                  className="border border-red-600 w-full max-w-xl mx-auto"
                />
              </a>
            </div>
          );
        })}
      </div>

      {/* Day 3 and Day 4–8 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Day 3 */}
        <div className="text-center">
          <h3 className="font-semibold mb-2">Day 3 Outlook</h3>
          <select
            className="border p-1 rounded mb-2"
            value={day3Type}
            onChange={(e) => setDay3Type(e.target.value)}
          >
            <option value="categorical">Categorical</option>
            <option value="prob">Probabilistic</option>
          </select>
          <a
            href="https://www.spc.noaa.gov/products/outlook/day3otlk.html"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img
              src={getImageSrc(3, day3Type)}
              alt="Day 3 Outlook"
              className="border border-red-600 w-full max-w-xl mx-auto"
            />
          </a>
        </div>

        {/* Day 4–8 */}
        <div className="text-center">
          <h3 className="font-semibold mb-2">Day 4–8 Outlook</h3>
          <a
            href="https://www.spc.noaa.gov/products/exper/day4-8/"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img
              src="https://www.spc.noaa.gov/products/exper/day4-8/day48prob.gif"
              alt="Day 4–8 Outlook"
              className="border border-blue-600 w-full max-w-xl mx-auto"
            />
          </a>
        </div>
      </div>

      {/* Mesoscale Discussions and WPC Hazards */}
      <h2 className="text-2xl font-bold mt-10 mb-4">Additional Severe Weather Maps</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Mesoscale Discussions */}
        <div className="text-center">
          <h3 className="font-semibold mb-2">Mesoscale Discussions</h3>
          <a
            href="https://www.spc.noaa.gov/products/md/"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img
              src="https://www.spc.noaa.gov/products/md/validmd.png"
              alt="Mesoscale Discussions"
              className="border w-full max-w-2xl mx-auto"
            />
          </a>
        </div>

        {/* WPC Day 3–7 Hazards */}
        <div className="text-center">
          <h3 className="font-semibold mb-2">WPC Day 3–7 Hazards Outlook</h3>
          <a
            href="https://www.wpc.ncep.noaa.gov/threats/threats.php"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img
              src="https://www.wpc.ncep.noaa.gov/threats/final/hazards_d3_7_contours.png"
              alt="WPC Hazards"
              className="border w-full max-w-2xl mx-auto"
            />
          </a>
        </div>
      </div>
      <h2 className="text-2xl font-bold mt-10 mb-4">Forecast Model Resources</h2>
        <div className="flex flex-col md:flex-row gap-4 justify-center text-center">
        <a
            href="https://www.pivotalweather.com/model.php"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-blue-600 text-white py-2 px-6 rounded shadow hover:bg-blue-700 transition"
        >
            Pivotal Weather
        </a>

        <a
            href="https://www.tropicaltidbits.com/analysis/models/"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-green-600 text-white py-2 px-6 rounded shadow hover:bg-green-700 transition"
        >
            Tropical Tidbits
        </a>
        </div>

    </div>
  );
}

function AlertPolygons({ alerts }) {
  const map = useMap();

  useEffect(() => {
    if (!alerts) return;

    const getAlertColor = (eventType) => {
      const type = eventType.toLowerCase();
      if (type.includes('tornado')) return 'red';
      if (type.includes('severe thunderstorm')) return 'yellow';
      if (type.includes('flood')) return 'green';
      return 'blue';
    };

    const alertLayer = L.geoJSON(alerts, {
      style: (feature) => ({
        color: getAlertColor(feature.properties.event),
        weight: 2,
        opacity: 0.7,
        fillOpacity: 0.2,
      }),
      onEachFeature: (feature, layer) => {
        const { event, headline, description, instruction } = feature.properties;
        const popupContent = `
          <strong>${event}</strong><br/>
          <em>${headline}</em><br/>
          <small>${description || ''}</small><br/>
          ${instruction ? `<small><strong>Instruction:</strong> ${instruction}</small>` : ''}
        `;
        layer.bindPopup(popupContent);
      },
    });

    alertLayer.addTo(map);
    return () => map.removeLayer(alertLayer);
  }, [alerts, map]);

  return null;
}
