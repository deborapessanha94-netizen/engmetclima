(() => {
  const mapStyle = 'https://tiles.openfreemap.org/styles/dark';

  const geoJson = points => ({
    type: 'FeatureCollection',
    features: points.map(point => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [point.longitude, point.latitude] },
      properties: {
        type: point.type,
        name: point.name,
        detail: point.detail,
        color: point.color || '#76e7bb'
      }
    }))
  });

  const graticuleGeoJson = () => {
    const features = [];
    for (let latitude = -60; latitude <= 60; latitude += 30) {
      const coordinates = [];
      for (let longitude = -180; longitude <= 180; longitude += 5) coordinates.push([longitude, latitude]);
      features.push({ type: 'Feature', geometry: { type: 'LineString', coordinates } });
    }
    for (let longitude = -150; longitude <= 150; longitude += 30) {
      const coordinates = [];
      for (let latitude = -85; latitude <= 85; latitude += 5) coordinates.push([longitude, latitude]);
      features.push({ type: 'Feature', geometry: { type: 'LineString', coordinates } });
    }
    return { type: 'FeatureCollection', features };
  };

  const styleMapLines = map => {
    map.getStyle().layers
      .filter(layer => layer.type === 'line' && /boundar|admin|border|country|state/i.test(`${layer.id} ${layer['source-layer'] || ''}`))
      .forEach(layer => {
        try {
          map.setPaintProperty(layer.id, 'line-color', '#ff9b45');
          map.setPaintProperty(layer.id, 'line-width', ['interpolate', ['linear'], ['zoom'], 0, 0.6, 4, 1.25, 8, 2]);
          map.setPaintProperty(layer.id, 'line-opacity', 0.9);
          map.setPaintProperty(layer.id, 'line-blur', 0.45);
        } catch {}
      });
  };

  const reduceMapLabels = map => {
    map.getStyle().layers
      .filter(layer => layer.type === 'symbol')
      .forEach(layer => {
        try {
          const isWideReference = /country|continent|marine/i.test(`${layer.id} ${layer['source-layer'] || ''}`);
          map.setLayoutProperty(layer.id, 'text-size', ['interpolate', ['linear'], ['zoom'], 0, isWideReference ? 5 : 6, 4, isWideReference ? 7 : 8, 8, 10]);
          map.setLayoutProperty(layer.id, 'text-allow-overlap', false);
          if (!isWideReference) map.setLayerZoomRange(layer.id, 2.7, layer.maxzoom || 24);
        } catch {}
      });
  };

  window.mountInteractiveGlobe = function mountDetailedGlobe() {
    const target = document.querySelector('#interactive-globe');
    if (!target || !globalThis.maplibregl) {
      if (target) target.innerHTML = '<p class="notice">O mapa detalhado não pôde ser carregado agora. Verifique sua conexão e atualize a tela.</p>';
      return;
    }

    try {
      target.innerHTML = '';
      const map = new maplibregl.Map({
        container: target,
        style: mapStyle,
        center: [-45, -12],
        zoom: 1.25,
        attributionControl: true,
        renderWorldCopies: false
      });

      map.addControl(new maplibregl.NavigationControl({ showCompass: true }), 'top-right');
      map.addControl(new maplibregl.GlobeControl(), 'top-right');

      map.on('style.load', () => {
        map.setProjection({ type: 'globe' });
        styleMapLines(map);
        reduceMapLabels(map);
        const beforeLabels = map.getStyle().layers.find(layer => layer.type === 'symbol')?.id;
        map.addSource('engmetclima-grid', { type: 'geojson', data: graticuleGeoJson() });
        map.addLayer({
          id: 'engmetclima-grid-glow',
          type: 'line',
          source: 'engmetclima-grid',
          paint: { 'line-color': '#009fe8', 'line-width': 2.3, 'line-opacity': 0.22, 'line-blur': 1.4 }
        }, beforeLabels);
        map.addLayer({
          id: 'engmetclima-grid-core',
          type: 'line',
          source: 'engmetclima-grid',
          paint: { 'line-color': '#76ddff', 'line-width': 0.55, 'line-opacity': 0.72 }
        }, beforeLabels);
        const points = globePoints();
        map.addSource('engmetclima-events', { type: 'geojson', data: geoJson(points) });
        map.addLayer({
          id: 'engmetclima-events-dot',
          type: 'circle',
          source: 'engmetclima-events',
          paint: {
            'circle-radius': ['case', ['==', ['get', 'type'], 'Localidade'], 7, 5],
            'circle-color': ['get', 'color'],
            'circle-stroke-width': 1.4,
            'circle-stroke-color': '#ffffff',
            'circle-opacity': 0.92
          }
        });

        map.on('click', 'engmetclima-events-dot', event => {
          const feature = event.features?.[0];
          if (!feature) return;
          globeSelectedEvent = {
            type: feature.properties.type,
            name: feature.properties.name,
            detail: feature.properties.detail,
            longitude: feature.geometry.coordinates[0],
            latitude: feature.geometry.coordinates[1]
          };
          globePaused = true;
          render();
        });

        map.on('mouseenter', 'engmetclima-events-dot', () => { map.getCanvas().style.cursor = 'pointer'; });
        map.on('mouseleave', 'engmetclima-events-dot', () => { map.getCanvas().style.cursor = ''; });

        const rotate = () => {
          if (!target.isConnected) {
            map.remove();
            return;
          }
          if (!globePaused && !map.isMoving()) map.rotateTo(map.getBearing() + 0.08, { duration: 0 });
          requestAnimationFrame(rotate);
        };
        requestAnimationFrame(rotate);
      });
    } catch {
      target.innerHTML = '<p class="notice">Não foi possível iniciar o mapa detalhado neste navegador.</p>';
    }
  };
})();
