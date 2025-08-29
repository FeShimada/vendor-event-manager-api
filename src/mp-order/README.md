# Módulo de Ordens - Arquitetura e Responsabilidades

## Visão Geral

Este módulo foi refatorado para separar claramente as responsabilidades e calcular automaticamente os valores no backend, eliminando a dependência do frontend para fornecer preços.

## Estrutura de Serviços

### 1. MpOrderService
**Responsabilidade**: Orquestração principal do processo de criação de ordens
- Coordena a execução dos outros serviços
- Gerencia transações do banco de dados
- Trata erros e retorna respostas

### 2. OrderBusinessService
**Responsabilidade**: Lógica de negócio e validações
- Valida dados da ordem (usuário, evento, itens)
- Verifica se o evento está ativo
- Valida quantidades e duplicatas
- Orquestra validações e cálculos

### 3. PriceCalculatorService
**Responsabilidade**: Cálculos de preços e validação de disponibilidade
- Calcula preços unitários e totais dos itens
- Calcula o valor total da ordem
- Valida disponibilidade dos produtos no evento
- Verifica se produtos estão ativos

### 4. MercadoPagoService
**Responsabilidade**: Integração com API do Mercado Pago
- Cria ordens no Mercado Pago
- Gerencia configurações da API
- Trata respostas e erros da integração
- Atualiza dados da ordem com informações do MP

## Fluxo de Criação de Ordem

1. **Validação de Dados** (`OrderBusinessService`)
   - Verifica se usuário e evento existem
   - Valida se evento está ativo
   - Verifica se há itens na ordem
   - Valida quantidades e duplicatas

2. **Processamento da Ordem** (`OrderBusinessService` + `PriceCalculatorService`)
   - Valida disponibilidade dos produtos
   - Calcula preços unitários e totais
   - Calcula valor total da ordem

3. **Criação no Banco** (`MpOrderService`)
   - Cria ordem com valores calculados
   - Cria itens da ordem com totais calculados

4. **Integração com Mercado Pago** (`MercadoPagoService`)
   - Cria ordem no MP
   - Atualiza ordem com dados do MP

## Benefícios da Nova Arquitetura

### Segurança
- Preços calculados no backend, evitando manipulação
- Validações robustas de dados
- Verificação de disponibilidade de produtos

### Manutenibilidade
- Responsabilidades bem definidas
- Código mais testável
- Fácil extensão de funcionalidades

### Confiabilidade
- Cálculos centralizados e consistentes
- Validações em múltiplas camadas
- Tratamento adequado de erros

## DTOs

### CreateMpOrderDto
```typescript
{
  userId: string;
  eventId: string;
  items: CreateMpOrderItemDto[];
}
```

### CreateMpOrderItemDto
```typescript
{
  eventProductId: string;
  quantity: number;
}
```

**Nota**: O frontend agora só precisa enviar `eventProductId` e `quantity`. Os valores `total` e `amount` são calculados automaticamente no backend.

## Validações Implementadas

- Usuário existe e está ativo
- Evento existe e está ativo
- Produtos existem no evento
- Produtos estão ativos
- Quantidades são válidas (> 0)
- Não há itens duplicados
- Valor total > 0
- Configurações do Mercado Pago válidas 