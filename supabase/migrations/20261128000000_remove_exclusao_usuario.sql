-- Reverte a feature de exclusão de usuário (ver 20261126000000 e
-- 20261127000000): o recurso foi abandonado, então removemos a RPC usada
-- para destacar usuários sem dados reais.
drop function if exists public.usuarios_com_dados();
