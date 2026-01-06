# Como Obter IP do VPS para Configurar Firewall no Azure

## O que você obteve

O comando `curl ifconfig.me` retornou um **IPv6**: `2a02:4780:14:9583::1`

O Azure Database geralmente precisa do **IPv4** também (ou ambos).

## Obter IPv4 do VPS

Execute no VPS:

```bash
# Opção 1: Obter IPv4 diretamente
curl -4 ifconfig.me

# Opção 2: Obter ambos (IPv4 e IPv6)
curl -4 ifconfig.me && echo "" && curl -6 ifconfig.me

# Opção 3: Usar outro serviço
curl ipv4.icanhazip.com

# Opção 4: Ver todos os IPs da interface
ip addr show | grep "inet "
```

## Configurar no Azure

No portal Azure, ao configurar o firewall:

1. **Vá para seu banco de dados**
2. **Settings → Firewall and virtual networks**
3. **Adicione as regras:**

   - **Rule name**: `VPS-IPv4` (ou qualquer nome)
   - **Start IP address**: `SEU_IPV4_AQUI`
   - **End IP address**: `SEU_IPV4_AQUI`
   - Clique em **Save**

   - **Rule name**: `VPS-IPv6` (opcional, se o banco suportar)
   - **Start IP address**: `2a02:4780:14:9583::1`
   - **End IP address**: `2a02:4780:14:9583::1`
   - Clique em **Save**

4. **OU** marque **"Allow Azure services and resources to access this server"** (temporariamente para teste)

## Importante

- O IPv4 pode mudar se o VPS reiniciar (dependendo do provedor)
- Considere usar um IP estático ou configurar um range maior
- Para desenvolvimento/teste, pode usar "Allow Azure services" temporariamente

## Próximo Passo

Execute `curl -4 ifconfig.me` no VPS e me envie o resultado para eu te ajudar a configurar no Azure.




