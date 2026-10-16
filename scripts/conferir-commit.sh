#!/usr/bin/env bash
# Checklist do repositório público (SPEC, seção 6) sobre o que está no stage.
# Sai com erro se achar algo; use antes de todo commit:  scripts/conferir-commit.sh && git commit ...
set -u
problemas=0
falha() { echo "❌ $1"; problemas=$((problemas + 1)); }

email=$(git config user.email)
[[ "$email" == *@users.noreply.github.com ]] || falha "e-mail do autor não é o noreply do GitHub: $email"

proibidos=$(git diff --cached --name-only --diff-filter=AM | grep -iE '(^|/)\.env($|\.)|\.xlsx?$|\.csv$|\.dump$|\.backup$|dados-reais/|test-results/|playwright-report/|\.pem$|\.key$' | grep -v '\.env\.example$')
[ -z "$proibidos" ] || falha "arquivos que não podem ir para o git:"$'\n'"$proibidos"

segredos=$(git diff --cached -U0 | grep -nE '^\+.*(eyJhbGci[A-Za-z0-9_-]{20,}|sb_secret_[A-Za-z0-9]{8,}|sb_publishable_[A-Za-z0-9]{8,}|gh[pousr]_[A-Za-z0-9]{20,}|postgres(ql)?://[^ :]+:[^ @]+@)')
[ -z "$segredos" ] || falha "possíveis segredos no diff:"$'\n'"$segredos"

# e-mails de verdade (exemplo.com e noreply são permitidos)
emails=$(git diff --cached -U0 | grep -oE '^\+.*' | grep -oiE '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[a-z]{2,}' | grep -viE '@exemplo\.com$|@users\.noreply\.github\.com$|@anthropic\.com$|^noreply@' | sort -u)
[ -z "$emails" ] || falha "e-mails reais no diff:"$'\n'"$emails"

if [ "$problemas" -eq 0 ]; then
  echo "✅ checklist do repositório público ok ($(git diff --cached --name-only | wc -l) arquivos)"
else
  echo "Corrija antes do commit. Nomes de pessoas reais também não podem entrar: confira à mão."
  exit 1
fi
