
-- Primeiro deletar o usuário existente
DELETE FROM usuarios WHERE email = 'secretaria@clinica.com';

-- Inserir novamente com a senha correta usando o mesmo algoritmo do auth.ts
INSERT INTO usuarios (nome, email, senha, telefone, tipo, ativo)
VALUES (
  'Maria Silva',
  'secretaria@clinica.com',
  (SELECT senha FROM usuarios WHERE email = 'psicorodrigo@rodrigo.com' LIMIT 1), -- Usar mesmo formato de hash
  '(21) 98888-7777',
  'secretaria',
  true
);
