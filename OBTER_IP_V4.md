# 🔍 Obter IPv4 da VPS

## Problema

O comando `curl ifconfig.me` retornou IPv6: `2a02:4780:14:9583::1`

Azure SQL Database precisa do **IPv4** para configurar firewall.

## Solução: Obter IPv4

Execute na VPS:

```bash
# Opção 1: Obter IPv4 específico
curl -4 ifconfig.me
# ou
curl ipv4.icanhazip.com

# Opção 2: Ver todas as interfaces de rede
ip addr show | grep "inet " | grep -v 127.0.0.1

# Opção 3: Ver IP público (IPv4)
curl -4 https://api.ipify.org

# Opção 4: Ver IP da interface de rede principal
hostname -I | awk '{print $1}'
```

## Qual Usar?

Use o resultado que for um **endereço IPv4** (formato: `XXX.XXX.XXX.XXX`)

Exemplos de IPv4:
- ✅ `92.113.32.118`
- ✅ `185.123.45.67`
- ✅ `10.0.0.5` (se for IP privado)

Exemplos de IPv6 (NÃO usar):
- ❌ `2a02:4780:14:9583::1`
- ❌ `2001:0db8::1`

## Se Só Tiver IPv6

Se a VPS **só tiver IPv6** (não tiver IPv4 público):

1. **Verificar no Azure Portal** se o servidor SQL aceita IPv6
2. **Ou usar VPN/Tunnel** para obter IPv4
3. **Ou configurar Azure para aceitar todas as conexões** (não recomendado para produção)

## Comando Recomendado

```bash
# Execute este comando (retorna IPv4)
curl -4 ifconfig.me
```

**Use o IPv4 retornado para adicionar no Azure Portal!**

