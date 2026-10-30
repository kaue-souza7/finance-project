# Segurança

## Credenciais

Nunca commite valores reais em `.env.example`, README, issues ou capturas de tela.
Use apenas placeholders. O arquivo `.env` é ignorado pelo Git.

### Se uma credencial vazar

1. Revogue/rotacione a credencial no provedor imediatamente.
2. Remova o valor do histórico do Git (não basta apagar no commit seguinte).
3. Force o push da história reescrita e avise colaboradores para re-clonarem.
4. Revise logs de uso do provedor em busca de atividade suspeita.
5. Ative secret scanning e push protection no GitHub.

Exemplo de limpeza de histórico com `git filter-repo`:

```bash
git filter-repo --replace-text replacements.txt
git push --force-with-lease origin main
```

O arquivo `replacements.txt` deve conter as credenciais no formato
`valor_real==>REDACTED` e **não deve ser commitado**.

## Autenticação

- Access tokens são curtos (30 min por padrão).
- Refresh tokens são opacos, armazenados apenas como hash SHA-256, expiram em 30 dias
  e são rotacionados a cada uso.
- Troca de senha e reset revogam todos os refresh tokens do usuário.
- Rate limiting é aplicado nos endpoints de login, cadastro e recuperação de senha.

## Reportar vulnerabilidades

Abra um issue privado ou entre em contato com o mantenedor. Não publique detalhes
de vulnerabilidades em issues públicas antes da correção.
