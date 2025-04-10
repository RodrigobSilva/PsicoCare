
-- Primeiro deletar o usuário existente
DELETE FROM usuarios WHERE email = 'secretaria@clinica.com';

-- Inserir novamente com a senha correta
INSERT INTO usuarios (nome, email, senha, telefone, tipo, ativo)
VALUES (
  'Maria Silva',
  'secretaria@clinica.com',
  'ad57057ed26d6597df1ba23226999ab13e9e468ff9edf53b4e7d7af5a024b83f0a74fefc7a3983cb25c799f8da4346a881a50a4953bba8c3b78329eda5781927.8f17e91613ab41c5',
  '(21) 98888-7777',
  'secretaria',
  true
);
