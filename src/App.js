import React, { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import './App.css';

function App() {
  const [longitude, setLongitude] = useState('');
  const [latitude, setLatitude] = useState('');
  const [error, setError] = useState(null);
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    const initMap = () => {
      try {
      if (window.AMap) {
          console.log('AMap is loaded');
    mapInstance.current = new window.AMap.Map(mapRef.current, {
      zoom: 11,
      center: [116.397428, 39.90923],
    });

          mapInstance.current.on('complete', () => {
            console.log('Map is ready');
          });

          mapInstance.current.on('error', (error) => {
            console.error('Map error:', error);
            setError(`地图加载错误: ${error.info}`);
          });
        window.AMap.plugin(['AMap.Scale'], function() {
          const scale = new window.AMap.Scale({
              position: 'RB'
          });
          mapInstance.current.addControl(scale);
        });
    } else {
          console.error('AMap is not loaded');
        setError('高德地图 API 未加载');
    }
    } catch (err) {
        console.error('Map initialization error:', err);
      setError(`初始化地图时出错: ${err.message}`);
    }
  };

    if (window.AMap) {
      initMap();
    } else {
      const script = document.createElement('script');
      script.src = `https://webapi.amap.com/maps?v=1.4.15&key=38bf4db3800d72dca6582848178a7539`;
      script.async = true;
      script.onload = initMap;
      script.onerror = (error) => {
        console.error('Script load error:', error);
        setError('加载高德地图 API 失败');
      };
      document.body.appendChild(script);
  }
  }, []);

  const handleFileUpload = (event) => {
    console.log("handleFileUpload start");
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json(worksheet);

      const parsedLocations = json.map(row => ({
        longitude: parseFloat(row['longitude']),
        latitude: parseFloat(row['latitude']),
        orderCount: parseInt(row['order'])
      }));

      console.log('parsedLocations:', parsedLocations);
      displayLocations(parsedLocations);
    };

    reader.readAsArrayBuffer(file);
  };

  const displayLocations = (locations) => {
    if (!mapInstance.current) return;

    // 清除之前的圆圈
    mapInstance.current.clearMap();

    locations.forEach(location => {
      const circle = new window.AMap.Circle({
        center: new window.AMap.LngLat(location.longitude, location.latitude),
        radius: Math.sqrt(location.orderCount) * 100, // 根据订单量调整圆圈大小
        fillColor: '#FF0000', // 填充颜色：红色
        strokeColor: '#8B0000', // 边框颜色：深红色
        strokeWeight: 1,
        fillOpacity: 0.4,
      });

      circle.setMap(mapInstance.current);
    });

    // 调整地图视图以包含所有点
    // if (locations.length > 0) {
    //   const bounds = locations.reduce((bounds, location) => {
    //     return bounds.extend(new window.AMap.LngLat(location.longitude, location.latitude));
    //   }, new window.AMap.Bounds());

    //   mapInstance.current.setBounds(bounds);
    // }
  };

  const handleLocate = () => {
    if (!longitude || !latitude) {
      alert('请输入经度和纬度');
      return;
    }

    try {
      const lngLat = new window.AMap.LngLat(parseFloat(longitude), parseFloat(latitude));

      // 移动地图中心点
      mapInstance.current.setCenter(lngLat);

      // 添加或更新标记
      if (markerRef.current) {
        markerRef.current.setPosition(lngLat);
      } else {
        markerRef.current = new window.AMap.Marker({
          position: lngLat,
          map: mapInstance.current,
        });
      }
    } catch (err) {
      setError(`定位时出错: ${err.message}`);
    }
  };

  if (error) {
    return <div>错误: {error}</div>;
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1>地图工具</h1>
      </header>
      <div className="content-container">
        <div className="input-container">
          <input
          type="text"
          placeholder="经度"
          value={longitude}
          onChange={(e) => setLongitude(e.target.value)}
        />
        <input
          type="text"
          placeholder="纬度"
          value={latitude}
          onChange={(e) => setLatitude(e.target.value)}
        />
        <button onClick={handleLocate}>定位</button>
          <input
            type="file"
            accept=".xlsx, .xls"
            onChange={handleFileUpload}
          />
    </div>
        <div className="map-container">
          <div ref={mapRef} className="map"></div>
      </div>
    </div>
    </div>
  );
}

export default App;
