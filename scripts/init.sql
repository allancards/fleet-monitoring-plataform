-- Habilita a extensão espacial PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;

-- Tabela de Cadastro de Veículos
CREATE TABLE IF NOT EXISTS vehicles (
    id VARCHAR(36) PRIMARY KEY,
    plate VARCHAR(20) NOT NULL UNIQUE,
    model VARCHAR(100) NOT NULL,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Histórico de Telemetria com coluna espacial (Point)
CREATE TABLE IF NOT EXISTS telemetry_history (
    id BIGSERIAL PRIMARY KEY,
    vehicle_id VARCHAR(36) REFERENCES vehicles(id) ON DELETE CASCADE,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    location GEOMETRY(Point, 4326),
    speed DOUBLE PRECISION NOT NULL,
    ignition BOOLEAN NOT NULL DEFAULT TRUE,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices Espaciais (GIST) e de Séries Temporais para buscas rápidas
CREATE INDEX IF NOT EXISTS idx_telemetry_location ON telemetry_history USING GIST (location);
CREATE INDEX IF NOT EXISTS idx_telemetry_vehicle_time ON telemetry_history (vehicle_id, timestamp DESC);

-- Tabela de Alertas Disparados pelos Workers
CREATE TABLE IF NOT EXISTS fleet_alerts (
    id BIGSERIAL PRIMARY KEY,
    vehicle_id VARCHAR(36) REFERENCES vehicles(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- Ex: 'SPEED_LIMIT_EXCEEDED', 'GEOFENCE_VIOLATION'
    severity VARCHAR(20) NOT NULL, -- Ex: 'INFO', 'WARNING', 'CRITICAL'
    message TEXT NOT NULL,
    payload JSONB,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Veículos Iniciais de Teste
INSERT INTO vehicles (id, plate, model, status) VALUES 
('veh-001', 'ABC-1234', 'Volvo FH 540', 'ACTIVE'),
('veh-002', 'XYZ-9876', 'Scania R450', 'ACTIVE')
ON CONFLICT (id) DO NOTHING;