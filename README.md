# Engmetclima

Aplicativo pessoal de meteorologia, oceano, riscos ambientais, sismologia, clima e astronomia.

## Abrir localmente

Requisitos: Node.js 18 ou superior.

No Windows, basta executar **Abrir Engmetclima.bat**. A aplicação ficará disponível em:

`http://127.0.0.1:19010`

Também é possível usar o terminal:

```bash
npm start
```

Mantenha a janela do terminal aberta enquanto estiver usando o aplicativo.

## Recursos atuais

- condições do tempo, qualidade do ar e previsão por localidade;
- oceano, ondas e referências de maré;
- sismos mundiais, ciclones e riscos ambientais;
- clima global, Lua e guia de conceitos;
- favoritos e preferências armazenados no navegador.

## Observações

Os dados dependem das fontes consultadas e de seus ciclos de atualização. Esta versão é voltada a consulta e estudo; para decisões de segurança, acompanhe sempre os avisos oficiais.

O servidor local (`server.js`) também atua como intermediário para algumas consultas externas. Ele precisa estar em execução para essas partes funcionarem.

## Próxima etapa

Após validar o funcionamento no GitHub, o projeto será otimizado como PWA para instalação e melhor experiência em celular.
