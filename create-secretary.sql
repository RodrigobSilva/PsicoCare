
-- Primeiro deletar o usuário existente
DELETE FROM usuarios WHERE email = 'secretaria@clinica.com';

-- Inserir novamente com a senha correta
INSERT INTO usuarios (nome, email, senha, telefone, tipo, ativo)
VALUES (
  'Maria Silva',
  'secretaria@clinica.com',
  '6f1ed002ab5595859014ebf0951522d9006afd9f85c68f7753c0eec7066ef31c231c5e252392a13aa65d018462ee6ebd8d68536548e0b8bed84783a8b78e8725.595f028a65dd6465',
  '(21) 98888-7777',
  'secretaria',
  true
);
