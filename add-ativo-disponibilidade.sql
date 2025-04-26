-- Adicionar o campo 'ativo' na tabela de disponibilidade de psicólogos
ALTER TABLE disponibilidade_psicologos ADD COLUMN ativo BOOLEAN DEFAULT TRUE;