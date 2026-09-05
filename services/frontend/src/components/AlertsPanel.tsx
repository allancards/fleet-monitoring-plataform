import { Alert } from '../types';

interface AlertsPanelProps {
  alerts: Alert[];
}

export function AlertsPanel({ alerts }: AlertsPanelProps) {
  return (
    <div style={{
      position: 'absolute',
      top: 20,
      right: 20,
      width: 300,
      maxHeight: '50vh',
      overflowY: 'auto',
      backgroundColor: 'white',
      borderRadius: 8,
      boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
      padding: 12,
      zIndex: 1000,
    }}>
      <h3 style={{ margin: '0 0 10px 0' }}>Alertas em Tempo Real</h3>
      {alerts.length === 0 ? (
  <p style={{ color: '#666', textAlign: 'center', padding: '16px' }}>
    Nenhum alerta no momento
  </p>
) : (
  alerts.map((alert, i) => {
    // Dicionário para traduzir os tipos de alertas técnico para português
    const typeTranslations: { [key: string]: string } = {
      SPEED_LIMIT_EXCEEDED: '⚠️ Limite de Velocidade Excedido',
      ENGINE_OVERHEATING: '🔥 Superaquecimento do Motor',
      GEO_FENCE_VIOLATION: '📍 Violação de Cerca Virtual',
      // Adicione outros tipos aqui conforme surgirem
    };

    // Pega a tradução ou usa o próprio tipo original caso não encontre no dicionário
    const translatedType = typeTranslations[alert.type] || alert.type;

    return (
      <div key={i} style={{
        borderBottom: '1px solid #eee',
        padding: '12px 0',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px'
      }}>
        {/* Tipo do alerta formatado e com a cor baseada na gravidade */}
        <span style={{
          fontWeight: '600',
          fontSize: '0.95rem',
          color: alert.severity === 'CRITICAL' ? '#d32f2f' :
                 alert.severity === 'WARNING' ? '#f57c00' : '#1976d2',
        }}>
          {translatedType}
        </span>
        
        {/* Mensagem principal */}
        <p style={{ margin: 0, fontSize: '0.9rem', color: '#333' }}>
          {alert.message}
        </p>
        
        {/* Horário formatado */}
        <small style={{ color: '#999', fontSize: '0.8rem' }}>
          {new Date(alert.timestamp).toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          })}
        </small>
      </div>
    );
  })
)}

    </div>
  );
}