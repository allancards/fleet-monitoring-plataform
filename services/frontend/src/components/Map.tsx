import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { VehicleState } from '../types';

// Corrige ícones padrão do Leaflet no Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface MapProps {
  vehicles: Record<string, VehicleState>;
}

export function Map({ vehicles }: MapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Record<string, L.Marker>>({});
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Inicializa o mapa apenas uma vez
  useEffect(() => {
    if (!containerRef.current) return;

    // Verifica se já existe um mapa no container
    if (mapRef.current) {
      return; // já inicializado
    }

    try {
      const map = L.map(containerRef.current, {
        center: [-23.5505, -46.6333],
        zoom: 13,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
      }).addTo(map);

      mapRef.current = map;
      console.log('🗺️ Mapa inicializado com sucesso');
    } catch (err) {
      console.error('Erro ao criar mapa:', err);
      setError('Falha ao carregar o mapa.');
    }

    // Cleanup: remove o mapa quando o componente desmontar
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        console.log('🗺️ Mapa removido');
      }
    };
  }, []); // executa apenas uma vez

  // Atualiza marcadores quando o veículo muda
  useEffect(() => {
    const map = mapRef.current;
  if (!map) return;

  Object.keys(vehicles).forEach((id) => {
    const vehicle = vehicles[id];
    
    // Evita crash se a lat/lng não existirem
    if (!vehicle.lat || !vehicle.lng) return;
    const latlng = L.latLng(vehicle.lat, vehicle.lng);

    const titleText = `${id} - ${vehicle.speed} km/h`;
    const popupContent = `<b>${id}</b><br>Velocidade: ${vehicle.speed} km/h`;

    if (markersRef.current[id]) {
      // 1. Atualiza a posição no mapa
      markersRef.current[id].setLatLng(latlng);
      
      // 2. CORREÇÃO: Atualiza o texto do pop-up dinamicamente
      markersRef.current[id].setPopupContent(popupContent);
      
      // 3. CORREÇÃO: Atualiza o title (texto ao passar o mouse) do marcador
      if (markersRef.current[id].options) {
        markersRef.current[id].options.title = titleText;
      }
    } else {
      // Cria o marcador pela primeira vez caso não exista
      const marker = L.marker(latlng, {
        title: titleText,
      }).addTo(map);
      
      marker.bindPopup(popupContent);
      markersRef.current[id] = marker;
    }

    // Remove marcadores que não estão mais em vehicles (opcional)
    Object.keys(markersRef.current).forEach((id) => {
      if (!vehicles[id]) {
        map.removeLayer(markersRef.current[id]);
        delete markersRef.current[id];
      }
    });
    });
  }, [vehicles]);

  if (error) {
    return <div style={{ padding: 20, color: 'red' }}>Erro: {error}</div>;
  }

  return <div ref={containerRef} style={{ height: '100vh', width: '100%' }} />;
}