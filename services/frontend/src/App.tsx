import { useSocket } from './hooks/useSocket';
import { Map } from './components/Map';
import { AlertsPanel } from './components/AlertsPanel';

function App() {
  const { vehicles, alerts } = useSocket();

  return (
    <div style={{ position: 'relative', height: '100vh', width: '100vw' }}>
      <Map vehicles={vehicles} />
      <AlertsPanel alerts={alerts} />
      <div style={{
        position: 'absolute',
        bottom: 20,
        left: 20,
        backgroundColor: 'rgba(0,0,0,0.7)',
        color: 'white',
        padding: '8px 16px',
        borderRadius: 20,
        fontSize: '0.9rem',
        zIndex: 1000,
      }}>
        🚗 Veículos ativos: {Object.keys(vehicles).length}
      </div>
    </div>
  );
}

export default App;